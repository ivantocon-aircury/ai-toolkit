import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { test } from "node:test"
import { promisify } from "node:util"
import { assertNoMounts, setup } from "../plugins/task-worktrees/workflow.mjs"

const exec = promisify(execFile)

test("native task worktrees retain branch, dependency, reuse, and session behavior", async (t) => {
  const root = await mkdtemp(join(tmpdir(), "toolkit-native-worktrees-"))
  const home = process.env.HOME
  process.env.HOME = root
  t.after(async () => {
    if (home === undefined) delete process.env.HOME
    else process.env.HOME = home
    await rm(root, { recursive: true, force: true })
  })
  const canonical = join(root, "project")
  await mkdir(canonical)
  const git = async (cwd, ...args) => (await exec("git", args, { cwd })).stdout.trim()
  await git(canonical, "init", "-b", "main")
  await writeFile(join(canonical, "tracked.txt"), "original\n")
  await writeFile(join(canonical, ".gitignore"), ".idea/\nnode_modules/\nbuild/\n")
  await git(canonical, "add", "tracked.txt", ".gitignore")
  await git(canonical, "-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "-m", "initial")
  await mkdir(join(canonical, "node_modules"))
  await writeFile(join(canonical, "node_modules", "dependency"), "copy me")
  await symlink("dependency", join(canonical, "node_modules", "link"))
  await symlink("node_modules", join(canonical, "vendor"))
  let current = canonical
  let definition
  let denied = false
  let failMove = false
  let failAttach = false
  let failRemove = false
  let residueToLeave = []
  let creates = 0
  let removes = 0
  let dockerRemoves = 0
  let deferredMove = false
  const approvals = []
  const inventory = [{ directory: canonical }]
  const ctx = {
    location: { directory: canonical, project: { id: "test-project", canonical } },
    permission: { assert: async (request) => {
      approvals.push(request)
      if (denied) throw new Error("Denied")
    } },
    tool: { transform: async (fn) => fn({ add: (value) => { definition = value } }) },
    session: {
      get: async () => ({ projectID: "test-project", location: { directory: current } }),
      move: async ({ directory }) => {
        if (failMove) throw new Error("Move unavailable")
        if (!deferredMove) current = directory
      },
    },
    worktree: {
      refresh: async () => {},
      list: async () => inventory,
      create: async ({ projectID, directory, name, from, branch }) => {
        assert.equal(projectID, "test-project")
        assert.equal(from, canonical)
        assert.match(branch, /^[0-9a-f]{40}$/)
        const destination = join(directory, name)
        await mkdir(directory, { recursive: true })
        await git(from, "worktree", "add", "--detach", "--", destination, branch)
        assert.equal(await git(destination, "branch", "--show-current"), "")
        creates++
        inventory.push({ directory: destination, strategy: "git" })
        if (failAttach) await git(canonical, "branch", "feature/race")
        return { directory: destination }
      },
      remove: async ({ projectID, directory, force }) => {
        assert.equal(projectID, "test-project")
        removes++
        if (failRemove) throw new Error("Native owner unavailable")
        await git(canonical, "worktree", "remove", ...(force ? ["--force"] : []), "--", directory)
        for (const [path, contents] of residueToLeave) {
          await mkdir(dirname(join(directory, path)), { recursive: true })
          await writeFile(join(directory, path), contents)
        }
        residueToLeave = []
        inventory.splice(inventory.findIndex((entry) => entry.directory === directory), 1)
      },
    },
    docker: { remove: async () => { dockerRemoves++ } },
  }
  await setup(ctx)
  const context = { sessionID: "session", messageID: "message", id: "tool", agent: "build", signal: new AbortController().signal }
  const run = async (input) => JSON.parse((await definition.execute(input, context)).content)

  await t.test("permission denial prevents all native changes", async () => {
    denied = true
    await assert.rejects(run({ action: "prepare", branch: "feature/denied" }), /Denied/)
    assert.equal(creates, 0)
    denied = false
  })
  await t.test("creates native tree, attaches branch, copies independent dependencies, and moves session", async () => {
    const result = await run({ action: "prepare", branch: "feature/task", base: "main" })
    assert.equal(result.directory, join(root, "work", "worktrees", "project", "feature-task"))
    assert.equal(await git(result.directory, "branch", "--show-current"), "feature/task")
    assert.equal(current, result.directory)
    assert.deepEqual(result.dependencies, ["node_modules"])
    assert.equal(await readFile(join(current, "node_modules", "link"), "utf8"), "copy me")
    await writeFile(join(current, "node_modules", "dependency"), "changed")
    assert.equal(await readFile(join(canonical, "node_modules", "dependency"), "utf8"), "copy me")
    assert.equal((await run({ action: "inspect" })).current, current)
  })
  await t.test("existing checked-out branch requires explicit selection", async () => {
    await assert.rejects(run({ action: "prepare", branch: "feature/task" }), /already has a worktree/)
    await run({ action: "select", directory: current })
    await assert.rejects(run({ action: "select", directory: canonical }), /canonical checkout/)
    await assert.rejects(run({ action: "select", directory: root }), /not registered/)
  })
  await t.test("new trees seed dependencies from the active session location", async () => {
    const result = await run({ action: "prepare", branch: "feature/second" })
    assert.equal(await readFile(join(result.directory, "node_modules", "dependency"), "utf8"), "changed")
  })
  await t.test("collisions and invalid refs fail before native creation", async () => {
    const before = creates
    await mkdir(join(root, "work", "worktrees", "project", "feature-collision"))
    await assert.rejects(run({ action: "prepare", branch: "feature/collision" }), /Destination already exists/)
    await assert.rejects(run({ action: "prepare", branch: "--invalid" }))
    await assert.rejects(run({ action: "prepare", branch: "feature/bad-base", base: "missing" }))
    assert.equal(creates, before)
  })
  await t.test("existing unused branch is attached without resetting it", async () => {
    await git(canonical, "branch", "feature/existing")
    await assert.rejects(run({ action: "prepare", branch: "feature/existing", base: "main" }), /new base/)
    const result = await run({ action: "prepare", branch: "feature/existing" })
    assert.equal(await git(result.directory, "branch", "--show-current"), "feature/existing")
  })
  await t.test("failed moves report the recoverable native worktree", async () => {
    failMove = true
    await assert.rejects(run({ action: "prepare", branch: "feature/recover" }), /Task worktree is ready.*use select/)
    failMove = false
    await run({ action: "select", directory: join(root, "work", "worktrees", "project", "feature-recover") })
  })
  await t.test("branch races report the preserved detached worktree", async () => {
    failAttach = true
    await assert.rejects(run({ action: "prepare", branch: "feature/race" }), /Native worktree remains registered.*branch attachment failed/)
    const directory = join(root, "work", "worktrees", "project", "feature-race")
    assert.equal(await git(directory, "branch", "--show-current"), "")
    // Follow the reported recovery path after verifying the concurrently created branch.
    await git(directory, "switch", "feature/race")
    await run({ action: "select", directory })
    assert.equal(current, directory)
    assert.equal(await git(directory, "branch", "--show-current"), "feature/race")
    failAttach = false
  })
  await t.test("cleanup refuses active targets and waits for a completed session handoff", async () => {
    const target = current
    await assert.rejects(run({ action: "remove", directory: target }), /Session is inside/)
    deferredMove = true
    await run({ action: "leave" })
    await assert.rejects(run({ action: "remove", directory: target }), /Session is inside/)
    deferredMove = false
    await run({ action: "leave" })
    assert.equal(current, canonical)
    await assert.rejects(run({ action: "remove", directory: canonical }), /canonical checkout/)
    const alias = join(root, "target-link")
    await symlink(target, alias)
    await assert.rejects(run({ action: "remove", directory: alias }), /symlink/)
    inventory.push({ directory: join(root, "work", "worktrees", "project") })
    await assert.rejects(run({ action: "remove", directory: join(root, "work", "worktrees", "project") }), /worktree parent/)
    inventory.pop()
    inventory.push({ directory: "/" })
    await assert.rejects(run({ action: "remove", directory: "/" }), /filesystem root/)
    inventory.pop()
    const unrelated = join(root, "unrelated-worktree")
    await mkdir(unrelated)
    inventory.push({ directory: unrelated })
    await assert.rejects(run({ action: "remove", directory: unrelated }), /adapter worktree parent/)
    inventory.pop()
    assert.equal(removes, 0)
  })
  await t.test("native removal propagates owner failure and preserves the worktree", async () => {
    const directory = join(root, "work", "worktrees", "project", "feature-race")
    failRemove = true
    await assert.rejects(run({ action: "remove", directory }), /Native owner unavailable/)
    assert.equal(await git(directory, "branch", "--show-current"), "feature/race")
    failRemove = false
  })
  await t.test("removal requests its own permission and stops before native removal when denied", async () => {
    const directory = join(root, "work", "worktrees", "project", "feature-race")
    const before = removes
    denied = true
    await assert.rejects(run({ action: "remove", directory, force: true }), /Denied/)
    denied = false
    assert.equal(removes, before)
    assert.deepEqual(approvals.at(-1).resources, ["remove"])
    assert.deepEqual(approvals.at(-1).metadata, { directory, force: true })
  })
  await t.test("dirty tracked, staged, and untracked paths require explicit discard consent", async () => {
    const directory = join(root, "work", "worktrees", "project", "feature-race")
    await writeFile(join(directory, "tracked.txt"), "unstaged\n")
    await assert.rejects(run({ action: "remove", directory }), /Explicit discard consent/)
    await git(directory, "restore", "tracked.txt")
    await writeFile(join(directory, "tracked.txt"), "staged\n")
    await git(directory, "add", "tracked.txt")
    await assert.rejects(run({ action: "remove", directory }), /Explicit discard consent/)
    await git(directory, "restore", "--staged", "tracked.txt")
    await git(directory, "restore", "tracked.txt")
    await writeFile(join(directory, "untracked-cleanup.txt"), "requires discard consent")
    await assert.rejects(run({ action: "remove", directory }), /Explicit discard consent/)
    await rm(join(directory, "untracked-cleanup.txt"))
  })
  await t.test("rejects mounts, nested repositories, and nested registered worktrees", async () => {
    const directory = join(root, "work", "worktrees", "project", "feature-race")
    await assert.rejects(assertNoMounts("/proc"), /mount point/)
    const nested = join(directory, "nested-repository")
    await mkdir(nested)
    await git(nested, "init")
    await assert.rejects(run({ action: "remove", directory, force: true }), /nested repository/)
    await rm(nested, { recursive: true, force: true })
    const submodule = join(directory, "nested-submodule")
    await mkdir(submodule)
    await writeFile(join(submodule, ".git"), "gitdir: ../.git/modules/nested-submodule\n")
    await assert.rejects(run({ action: "remove", directory, force: true }), /nested repository or submodule/)
    await rm(submodule, { recursive: true, force: true })
    inventory.push({ directory: join(directory, "nested-worktree") })
    await assert.rejects(run({ action: "remove", directory, force: true }), /another registered worktree/)
    inventory.pop()
  })
  await t.test("removes only verified ignored .idea and build residue through the native adapter", async () => {
    const directory = join(root, "work", "worktrees", "project", "feature-race")
    await mkdir(join(directory, ".idea"), { recursive: true })
    await writeFile(join(directory, ".idea", "workspace.xml"), "ignored IDE state")
    await mkdir(join(directory, "node_modules", "package"), { recursive: true })
    await writeFile(join(directory, "node_modules", "package", "index.js"), "ignored dependency")
    await mkdir(join(directory, "build"), { recursive: true })
    await writeFile(join(directory, "build", "output.js"), "ignored output")
    residueToLeave = [
      [".idea/workspace.xml", "ignored IDE state"],
      ["node_modules/package/index.js", "ignored dependency"],
      ["build/output.js", "ignored output"],
    ]
    const result = await run({ action: "remove", directory })
    assert.equal(result.removed, true)
    assert.equal(result.registrationRemoved, true)
    assert.equal(result.folderRemoved, true)
    assert.equal(result.ignoredResidueRemoved, true)
    assert.equal(result.branchDeleted, false)
    assert.equal(await git(canonical, "rev-parse", "--verify", "refs/heads/feature/race"), await git(canonical, "rev-parse", "HEAD"))
    assert.ok(!inventory.some((entry) => entry.directory === directory))
    assert.ok(inventory.some((entry) => entry.directory === join(root, "work", "worktrees", "project", "feature-second")))
    assert.equal(dockerRemoves, 0)
  })
  await t.test("nested branch names use hyphens and flattening collisions never overwrite a worktree", async () => {
    const result = await run({ action: "prepare", branch: "feature/group/task" })
    assert.equal(result.directory, join(root, "work", "worktrees", "project", "feature-group-task"))
    await run({ action: "leave" })
    await assert.rejects(run({ action: "prepare", branch: "feature-group/task" }), /Destination already exists/)
    assert.equal(await git(result.directory, "branch", "--show-current"), "feature/group/task")
    const removal = await run({ action: "remove", directory: result.directory })
    assert.equal(removal.folderRemoved, true)
  })
  await t.test("force removal recovers authorized tracked and untracked residue as well as ignored files", async () => {
    const result = await run({ action: "prepare", branch: "feature/full-discard" })
    await writeFile(join(result.directory, "tracked.txt"), "dirty tracked file")
    await writeFile(join(result.directory, "untracked.txt"), "untracked file")
    await writeFile(join(result.directory, "staged.txt"), "staged file")
    await git(result.directory, "add", "staged.txt")
    await mkdir(join(result.directory, "build"))
    await writeFile(join(result.directory, "build", "output"), "ignored file")
    await run({ action: "leave" })
    residueToLeave = [["tracked.txt", "dirty tracked file"], ["untracked.txt", "untracked file"], ["staged.txt", "staged file"], ["build/output", "ignored file"]]
    const removal = await run({ action: "remove", directory: result.directory, force: true })
    assert.equal(removal.registrationRemoved, true)
    assert.equal(removal.folderRemoved, true)
    await assert.rejects(readFile(join(result.directory, "untracked.txt")), { code: "ENOENT" })
  })
  await t.test("preserves the branch when native removal leaves unverified residue", async () => {
    const result = await run({ action: "prepare", branch: "feature/partial" })
    await run({ action: "leave" })
    residueToLeave = [["unexpected.txt", "not in the approved ignored snapshot"]]
    const removal = await run({ action: "remove", directory: result.directory, force: true })
    assert.equal(removal.registrationRemoved, true)
    assert.equal(removal.folderRemoved, false)
    assert.equal(removal.ignoredResidueRemoved, false)
    assert.match(removal.reason, /outside the authorized pre-removal snapshot/)
    await git(canonical, "rev-parse", "--verify", "refs/heads/feature/partial")
  })
})

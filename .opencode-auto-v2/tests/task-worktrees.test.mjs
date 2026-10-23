import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { mkdtemp, mkdir, readFile, rm, symlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"
import { promisify } from "node:util"
import { setup } from "../plugins/task-worktrees/workflow.mjs"

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
  await git(canonical, "add", "tracked.txt")
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
  let creates = 0
  const inventory = [{ directory: canonical }]
  const ctx = {
    location: { directory: canonical, project: { id: "test-project", canonical } },
    permission: { assert: async () => { if (denied) throw new Error("Denied") } },
    tool: { transform: async (fn) => fn({ add: (value) => { definition = value } }) },
    session: {
      get: async () => ({ projectID: "test-project", location: { directory: current } }),
      move: async ({ directory }) => {
        if (failMove) throw new Error("Move unavailable")
        current = directory
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
    },
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
  })
})

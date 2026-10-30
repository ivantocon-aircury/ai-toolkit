import assert from "node:assert/strict"
import { execFile } from "node:child_process"
import { access, mkdir, mkdtemp, readFile, rm, unlink, writeFile } from "node:fs/promises"
import { join } from "node:path"
import { test } from "node:test"
import { promisify } from "node:util"
import { setup } from "../plugins/task-worktrees/workflow.mjs"
import { setupCleanupTabs } from "../plugins/task-worktrees/cleanup-tabs.mjs"

const exec = promisify(execFile)

for (const failBranch of [false, true]) {
  test(`disposable cleanup ${failBranch ? "preserves tab on branch failure" : "requests tab closure after cleanup"}`, async (t) => {
    const root = await mkdtemp(join(process.env.TMPDIR || "/tmp", "cleanup-sequence-"))
    const home = process.env.HOME
    process.env.HOME = root
    t.after(async () => {
      if (home === undefined) delete process.env.HOME
      else process.env.HOME = home
      await rm(root, { recursive: true, force: true })
    })
    const canonical = join(root, "repository")
    const target = join(root, "work", "worktrees", "repository", "task")
    const runtime = join(root, "exclusive-runtime")
    await mkdir(canonical)
    await mkdir(join(root, "work", "worktrees", "repository"), { recursive: true })
    const git = async (...args) => (await exec("git", ["-C", canonical, ...args])).stdout.trim()
    await git("init", "-b", "main")
    await git("-c", "user.name=Test", "-c", "user.email=test@example.invalid", "commit", "--allow-empty", "-m", "initial")
    await git("worktree", "add", "-b", "feature/test", target)
    await writeFile(runtime, "disposable runtime stand-in")

    const tools = new Map()
    const events = []
    let current = target
    const inventory = [{ directory: canonical }, { directory: target }]
    const ctx = {
      location: { project: { id: "test", canonical } },
      permission: { assert: async () => {} },
      session: {
        get: async () => ({ projectID: "test", location: { directory: current } }),
        move: async ({ directory }) => { current = directory },
      },
      worktree: {
        refresh: async () => {},
        list: async () => inventory,
        remove: async ({ directory, force }) => {
          await git("worktree", "remove", ...(force ? ["--force"] : []), directory)
          inventory.splice(inventory.findIndex((entry) => entry.directory === directory), 1)
        },
      },
      tool: { transform: async (fn) => fn({ add: (tool) => tools.set(tool.name, tool) }) },
      rpc: { register: async () => ({ events: { emit: async (type, data) => {
        await assert.rejects(access(target), { code: "ENOENT" })
        await assert.rejects(access(runtime), { code: "ENOENT" })
        await assert.rejects(git("show-ref", "--verify", "--quiet", "refs/heads/feature/test"))
        events.push({ type, data })
      } } }) },
    }
    await setup(ctx)
    await setupCleanupTabs(ctx, {})
    const context = { sessionID: "ses_cleanup", messageID: "message", id: "tool", agent: "build", signal: new AbortController().signal }
    const run = async (input) => JSON.parse((await tools.get("task_worktree").execute(input, context)).content)

    // This models the skill's steps; the runtime stand-in is not a Docker container.
    await run({ action: "leave" })
    assert.equal((await run({ action: "inspect" })).current, canonical)
    await unlink(runtime)
    const removed = await run({ action: "remove", directory: target, force: true })
    assert.equal(removed.registrationRemoved, true)
    assert.equal(removed.folderRemoved, true)
    assert.equal((await run({ action: "inspect" })).worktrees.some((entry) => entry.directory === target), false)
    if (failBranch) {
      await git("worktree", "add", join(root, "branch-holder"), "feature/test")
      await assert.rejects(git("branch", "-D", "feature/test"))
    } else {
      await git("branch", "-D", "feature/test")
      await tools.get("cleanup_close_tab").execute({}, context)
    }
    assert.deepEqual(events, failBranch ? [] : [{ type: "close", data: { sessionID: "ses_cleanup" } }])
    const skill = await readFile(new URL("../../.agents/skills/git/clean-worktree/SKILL.md", import.meta.url), "utf8")
    assert.match(skill, /Only after all applicable cleanup is complete and verified/)
    assert.match(skill, /Do not request closure after a blocked or partial cleanup/)
  })
}

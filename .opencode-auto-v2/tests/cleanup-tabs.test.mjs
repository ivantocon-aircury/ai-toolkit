import assert from "node:assert/strict"
import { readFile } from "node:fs/promises"
import { test } from "node:test"
import { runInNewContext } from "node:vm"
import { setupCleanupTabs } from "../plugins/task-worktrees/cleanup-tabs.mjs"
import { closeTuiTab } from "../plugins/task-worktrees/tabs.mjs"

test("tool emits only the invoking session and does not claim delivery", async () => {
  const calls = []
  let tool
  const ctx = {
    rpc: { register: async (_contract, methods) => {
      assert.deepEqual(methods, {})
      return { events: { emit: async (...args) => calls.push(args) } }
    } },
    tool: { transform: async (fn) => fn({ add: (value) => { tool = value } }) },
  }
  await setupCleanupTabs(ctx, {})
  assert.equal(tool.name, "cleanup_close_tab")
  assert.equal(tool.input.additionalProperties, false)
  const result = await tool.execute({}, { sessionID: "ses_original" })
  assert.deepEqual(calls, [["close", { sessionID: "ses_original" }]])
  assert.match(result.content, /not confirmed/)
})

test("tool propagates event delivery errors", async () => {
  let tool
  await setupCleanupTabs({
    rpc: { register: async () => ({ events: { emit: async () => { throw new Error("unavailable") } } }) },
    tool: { transform: async (fn) => fn({ add: (value) => { tool = value } }) },
  }, {})
  await assert.rejects(tool.execute({}, { sessionID: "ses_a" }), /unavailable/)
})

test("TUI only closes the named session when session tabs are enabled", () => {
  const closed = []
  closeTuiTab({ enabled: () => false, close: (id) => closed.push(id) }, "ses_a")
  closeTuiTab({ enabled: () => true, close: (id) => closed.push(id) }, "ses_b")
  assert.deepEqual(closed, ["ses_b"])
})

test("desktop plugin closes the matching tab, not the focused tab", async () => {
  const source = await readFile(new URL("../plugins/task-worktrees/gui-experimental.cjs", import.meta.url), "utf8")
  const exports = {}
  const rpcDefinitions = []
  const fakeRequire = (id) => {
    if (id === "@opencode/plugin/gui") return { Plugin: { define: (definition) => definition } }
    if (id === "@opencode/plugin/rpc") return { Rpc: { define: (definition) => { rpcDefinitions.push(definition); return definition } } }
    throw new Error(`Unexpected dependency ${id}`)
  }
  runInNewContext(source, { exports, require: fakeRequire })
  const closed = []
  let callback
  let unsubscribed = false
  const stop = () => { unsubscribed = true }
  const ctx = {
    client: { rpc: () => ({ events: { on: (name, fn) => { assert.equal(name, "close"); callback = fn; return stop } } }) },
    tabs: {
      list: () => [{ key: "focused", session: { id: "ses_other" } }, { key: "target", session: { id: "ses_target" } }],
      close: (key) => closed.push(key),
    },
  }
  const dispose = exports.default.setup(ctx)
  callback({ data: { sessionID: "ses_missing" } })
  callback({ data: { sessionID: "ses_target" } })
  assert.deepEqual(closed, ["target"])
  assert.equal(rpcDefinitions[0].id, "toolkit.cleanup-tabs")
  dispose()
  assert.equal(unsubscribed, true)
})

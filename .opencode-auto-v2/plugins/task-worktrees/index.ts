import { Plugin } from "@opencode/plugin"
import { setup } from "./workflow.mjs"
import { CleanupTabs } from "./rpc"
import { setupCleanupTabs } from "./cleanup-tabs.mjs"

export default Plugin.define({
  id: "toolkit.task-worktrees",
  async setup(ctx) {
    await setup(ctx)
    await setupCleanupTabs(ctx, CleanupTabs)
  },
})

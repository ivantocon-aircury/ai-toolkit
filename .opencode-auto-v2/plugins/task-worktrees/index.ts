import { Plugin } from "@opencode/plugin"
import { setup } from "./workflow.mjs"

export default Plugin.define({
  id: "toolkit.task-worktrees",
  setup,
})

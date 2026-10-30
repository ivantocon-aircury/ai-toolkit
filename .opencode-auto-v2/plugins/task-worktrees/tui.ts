import { Plugin } from "@opencode/plugin/tui"
import { CleanupTabs } from "./rpc"
import { closeTuiTab } from "./tabs.mjs"

export default Plugin.define({
  id: "toolkit.cleanup-tabs.tui",
  setup(context) {
    return context.client.rpc(CleanupTabs).events.on("close", (event) => {
      closeTuiTab(context.ui.tabs, event.data.sessionID)
    })
  },
})

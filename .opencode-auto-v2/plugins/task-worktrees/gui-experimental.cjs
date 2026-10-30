const { Plugin } = require("@opencode/plugin/gui")
const { Rpc } = require("@opencode/plugin/rpc")

// Desktop loads a single prebuilt CommonJS file, without local imports.
const CleanupTabs = Rpc.define({
  id: "toolkit.cleanup-tabs",
  methods: {},
  events: {
    close: {
      schema: {
        type: "object",
        properties: { sessionID: { type: "string" } },
        required: ["sessionID"],
        additionalProperties: false,
      },
    },
  },
})

exports.default = Plugin.define({
  setup(ctx) {
    return ctx.client.rpc(CleanupTabs).events.on("close", (event) => {
      const tab = ctx.tabs.list().find((item) => item.session?.id === event.data.sessionID)
      if (tab) ctx.tabs.close(tab.key)
    })
  },
})

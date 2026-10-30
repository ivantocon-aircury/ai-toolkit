import { Rpc } from "@opencode/plugin/rpc"

export const CleanupTabs = Rpc.define({
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

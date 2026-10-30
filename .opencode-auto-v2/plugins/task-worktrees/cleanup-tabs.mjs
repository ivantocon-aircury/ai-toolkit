export async function setupCleanupTabs(ctx, contract) {
  const rpc = await ctx.rpc.register(contract, {})
  await ctx.tool.transform((editor) => {
    editor.add({
      name: "cleanup_close_tab",
      description: "Request closing this session's OpenCode UI tab after successful explicitly authorized worktree cleanup. Does not delete the session. Delivery is not guaranteed.",
      input: { type: "object", properties: {}, additionalProperties: false },
      async execute(_input, context) {
        await rpc.events.emit("close", { sessionID: context.sessionID })
        return { content: "Tab-close request sent; UI delivery and closure are not confirmed." }
      },
    })
  })
}

#!/usr/bin/env node
// Dependency-free MCP stdio server for the Boards Runtime API.
// Messages are newline-delimited JSON-RPC 2.0, as the MCP stdio transport defines.
import { createInterface } from "node:readline"
import { pathToFileURL } from "node:url"
import { BoardsClient, BoardsError, createTools, INSTRUCTIONS } from "./boards.mjs"

const SUPPORTED_PROTOCOLS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"]
const SERVER_INFO = { name: "boards", title: "Aircury Boards", version: "1.0.0" }

export function createServer({ client = new BoardsClient(), send }) {
  const tools = createTools(client)
  const byName = new Map(tools.map((tool) => [tool.name, tool]))

  const reply = (id, result) => send({ jsonrpc: "2.0", id, result })
  const fail = (id, code, message) => send({ jsonrpc: "2.0", id, error: { code, message } })

  async function callTool(params) {
    const tool = byName.get(params?.name)
    if (!tool) return { error: [-32602, `Unknown tool: ${params?.name}`] }
    try {
      return { result: await tool.handler(params.arguments ?? {}) }
    } catch (error) {
      const text = error instanceof BoardsError
        ? JSON.stringify({ error: error.message, ...(error.details ? { details: error.details } : {}) }, null, 2)
        : `Unexpected error: ${error?.message ?? error}`
      return { result: { content: [{ type: "text", text }], isError: true } }
    }
  }

  return async function handle(message) {
    if (!message || typeof message !== "object" || message.jsonrpc !== "2.0") return
    const { id, method, params } = message
    const isRequest = id !== undefined && id !== null
    if (!isRequest) return // Notifications such as notifications/initialized need no reply.
    switch (method) {
      case "initialize": {
        const requested = params?.protocolVersion
        return reply(id, {
          protocolVersion: SUPPORTED_PROTOCOLS.includes(requested) ? requested : SUPPORTED_PROTOCOLS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        })
      }
      case "ping":
        return reply(id, {})
      case "tools/list":
        return reply(id, {
          tools: tools.map(({ name, description, inputSchema, annotations }) => ({ name, description, inputSchema, annotations })),
        })
      case "tools/call": {
        const { result, error } = await callTool(params)
        return error ? fail(id, ...error) : reply(id, result)
      }
      default:
        return fail(id, -32601, `Method not found: ${method}`)
    }
  }
}

export function serve({ input = process.stdin, output = process.stdout, client } = {}) {
  const send = (message) => output.write(`${JSON.stringify(message)}\n`)
  const handle = createServer({ client, send })
  const lines = createInterface({ input, crlfDelay: Infinity })
  lines.on("line", (line) => {
    if (!line.trim()) return
    let message
    try {
      message = JSON.parse(line)
    } catch {
      send({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "Parse error" } })
      return
    }
    // Requests are independent; handle them concurrently and reply by id.
    handle(message).catch((error) => {
      if (message?.id !== undefined) send({ jsonrpc: "2.0", id: message.id, error: { code: -32603, message: error.message } })
    })
  })
  return lines
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) serve()

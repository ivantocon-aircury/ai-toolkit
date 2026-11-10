import assert from "node:assert/strict"
import { PassThrough } from "node:stream"
import { test } from "node:test"
import { BoardsClient, compact, discoverTokens, expandTemplate } from "../mcp/boards/boards.mjs"
import { createServer, serve } from "../mcp/boards/server.mjs"

const API = "https://api.boards.example/api"
const VOCAB = "https://boards.aircury.net/vocab/runtime-api#"

function operation(name, method, target, schema = `${API}/schemas/${name}`) {
  return {
    "@id": `${VOCAB}${name}`,
    "@type": "hydra:Operation",
    "hydra:method": method,
    ...(schema ? { "hydra:expects": schema } : {}),
    ...(target ? { [`${VOCAB}target`]: target } : {}),
  }
}

// A minimal Runtime API with one board per token, served from fixtures.
function fakeApi(boards, { failPatch = false } = {}) {
  const calls = []
  const byToken = new Map(boards.map((board) => [board.token, board]))
  const respond = (status, body) => new Response(body === undefined ? "" : JSON.stringify(body), { status, headers: { "Content-Type": "application/ld+json" } })
  const fetch = async (url, init = {}) => {
    const token = init.headers?.Authorization?.replace("Bearer ", "")
    const board = byToken.get(token)
    calls.push({ url, method: init.method, token, contentType: init.headers?.["Content-Type"], body: init.body ? JSON.parse(init.body) : undefined })
    if (!board) return respond(401, { title: "Unauthorized", detail: "Authentication required." })
    const boardUrl = `${API}/board/${board.id}`
    const columnCards = (column) => `${boardUrl}/column/${column.id}/cards`
    const routes = {
      [API]: () => ({
        "@id": API,
        tokenSelf: `${API}/token/self`,
        board: boardUrl,
        cardById: { "@type": "hydra:IriTemplate", "hydra:template": `${API}/card/{cardId}` },
        cardByToken: { "@type": "hydra:IriTemplate", "hydra:template": `${API}/card/by-token/{token}` },
      }),
      [`${API}/token/self`]: () => ({ boardId: board.id, boardTitle: board.title, effectiveCapabilities: ["card:read", "card:create"] }),
      [boardUrl]: () => ({
        "@id": boardUrl,
        "@context": { hydra: "http://www.w3.org/ns/hydra/core#" },
        id: board.id,
        slug: board.slug,
        title: board.title,
        columns: { "@id": `${boardUrl}/columns`, "hydra:template": `${boardUrl}/columns{?includeCards,limit}` },
        cardDigest: `${boardUrl}/cards/digest`,
        settings: { managedColumns: board.columns.map(({ id, title }) => ({ id, title, displayName: null })) },
        "hydra:operation": [operation("board.set-watch", "PUT", `${boardUrl}/watch`)],
      }),
      [`${boardUrl}/columns?includeCards=true&limit=1`]: () => ({
        "hydra:member": board.columns.map((column) => ({
          id: column.id,
          cards: {
            "@id": columnCards(column),
            "hydra:template": `${columnCards(column)}{?limit,cursor}`,
            "hydra:operation": [operation("card.create", "POST", columnCards(column))],
          },
        })),
      }),
    }
    for (const column of board.columns) {
      routes[`${columnCards(column)}?limit=1`] = () => ({ "@id": columnCards(column), "hydra:member": [], "hydra:operation": [operation("card.create", "POST", columnCards(column))] })
    }
    for (const card of board.cards) {
      const cardUrl = `${API}/card/${card.id}`
      const resource = () => ({
        "@id": cardUrl,
        id: card.id,
        publicToken: card.code,
        title: card.title,
        column: { id: board.columns[0].id, title: board.columns[0].title },
        "hydra:operation": [
          operation("card.update", "PATCH", null),
          operation("card.archive", "POST", `${cardUrl}/archive`, null),
          operation("card.move", "POST", `${cardUrl}/move`),
        ],
      })
      routes[cardUrl] = resource
      routes[`${API}/card/by-token/${card.code}`] = resource
    }
    const key = url.toString()
    if (init.method === "POST" && key.endsWith("/cards")) {
      const card = { id: "00000000-0000-4000-8000-0000000000aa", code: "NEW-1", title: JSON.parse(init.body).title }
      board.cards.push(card)
      return respond(201, { "@id": `${API}/card/${card.id}`, id: card.id, publicToken: card.code, title: card.title })
    }
    if (init.method === "PATCH" && failPatch) return respond(422, { title: "Unprocessable Content", detail: "Rejected." })
    if (init.method === "PATCH" || (init.method === "POST" && /\/(archive|move)$/.test(key))) {
      return respond(200, { "@id": key.replace(/\/(archive|move)$/, ""), id: "patched", title: "Patched" })
    }
    const route = routes[key] ?? routes[key.split("?")[0]]
    if (!route) return respond(403, { title: "Forbidden", detail: "Nothing within scope." })
    return respond(200, route())
  }
  return { fetch, calls }
}

const alpha = {
  token: "alpha-token",
  id: "11111111-1111-4111-8111-111111111111",
  slug: "alpha",
  title: "Alpha",
  columns: [{ id: "c-todo", title: "To do" }, { id: "c-done", title: "Done" }],
  cards: [{ id: "22222222-2222-4222-8222-222222222222", code: "AL-1", title: "First" }],
}
const beta = {
  token: "beta-token",
  id: "33333333-3333-4333-8333-333333333333",
  slug: "beta",
  title: "Beta",
  columns: [{ id: "c-backlog", title: "Backlog" }],
  cards: [{ id: "44444444-4444-4444-8444-444444444444", code: "BE-7", title: "Second" }],
}

function setup(env, boards = [structuredClone(alpha), structuredClone(beta)], options) {
  const api = fakeApi(boards, options)
  const client = new BoardsClient({ env: { BOARDS_API_URL: API, ...env }, fetch: api.fetch })
  const sent = []
  const handle = createServer({ client, send: (message) => sent.push(message) })
  const call = async (name, args = {}) => {
    await handle({ jsonrpc: "2.0", id: sent.length + 1, method: "tools/call", params: { name, arguments: args } })
    const { result } = sent.at(-1)
    return { isError: result.isError ?? false, data: JSON.parse(result.content[0].text) }
  }
  return { api, client, call }
}

test("discovers BOARDS_TOKEN and every <NAME>_BOARD_TOKEN, ignoring blanks", () => {
  const tokens = discoverTokens({ BOARDS_TOKEN: "a", ALPHA_BOARD_TOKEN: " b ", EMPTY_BOARD_TOKEN: "", _BOARD_TOKEN: "x", OTHER: "c" })
  assert.deepEqual(tokens, [{ name: "ALPHA_BOARD_TOKEN", token: "b" }, { name: "BOARDS_TOKEN", token: "a" }])
})

test("expands IRI templates and compacts JSON-LD", () => {
  assert.equal(expandTemplate(`${API}/card/{cardId}`, { cardId: "a b" }), `${API}/card/a%20b`)
  assert.equal(expandTemplate(`${API}/x{?a,b,c}`, { a: 1, c: "z" }), `${API}/x?a=1&c=z`)
  assert.equal(expandTemplate(`${API}/x{?a}`, {}), `${API}/x`)
  assert.throws(() => expandTemplate(`${API}/card/{cardId}`, {}), /cardId/)
  const result = compact({
    "@context": {},
    "hydra:member": [{ "hydra:mapping": [], name: "x" }],
    search: { "@type": "hydra:IriTemplate", "hydra:template": "t{?q}" },
    "hydra:operation": [operation("card.update", "PATCH", null)],
    "@id": "self",
  })
  assert.deepEqual(result, {
    member: [{ name: "x" }],
    search: "t{?q}",
    operations: [{ name: "card.update", method: "PATCH", target: "self", schema: `${API}/schemas/card.update`, contentType: "application/merge-patch+json" }],
    "@id": "self",
  })
})

test("lists every configured board and reports unusable tokens", async () => {
  const { call } = setup({ ALPHA_BOARD_TOKEN: "alpha-token", BETA_BOARD_TOKEN: "beta-token", STALE_BOARD_TOKEN: "revoked" })
  const { data } = await call("list_boards")
  assert.deepEqual(data.map((board) => board.slug ?? board.tokenVariable), ["alpha", "beta", "STALE_BOARD_TOKEN"])
  assert.match(data[2].error, /401/)
})

test("selects boards by slug, title, id, URL, or token name and requires a choice when ambiguous", async () => {
  const { call } = setup({ ALPHA_BOARD_TOKEN: "alpha-token", BETA_BOARD_TOKEN: "beta-token" })
  const ambiguous = await call("get_board")
  assert.equal(ambiguous.isError, true)
  assert.match(ambiguous.data.error, /pass "board"/)
  for (const board of ["beta", "Beta", beta.id, "https://boards.aircury.net/b/beta", "BETA", "BETA_BOARD_TOKEN"]) {
    const { data } = await call("get_board", { board })
    assert.equal(data.slug, "beta", board)
  }
  const unknown = await call("get_board", { board: "gamma" })
  assert.match(unknown.data.error, /No configured token grants access/)
})

test("a single configured token needs no board selector", async () => {
  const { call } = setup({ BOARDS_TOKEN: "alpha-token" }, [structuredClone(alpha)])
  const { data } = await call("get_board")
  assert.equal(data.slug, "alpha")
  assert.deepEqual(data.columns.map((column) => column.title), ["To do", "Done"])
  assert.deepEqual(data.operations.map((item) => item.name), ["board.set-watch"])
})

test("resolves cards by code, UUID, or share link across boards through entry-point templates", async () => {
  const { call, api } = setup({ ALPHA_BOARD_TOKEN: "alpha-token", BETA_BOARD_TOKEN: "beta-token" })
  for (const card of ["BE-7", beta.cards[0].id, "https://boards.aircury.net/c/BE-7"]) {
    const { data, isError } = await call("get_card", { card })
    assert.equal(isError, false, card)
    assert.equal(data.publicToken, "BE-7")
    assert.equal(data.webUrl, "https://boards.aircury.net/c/BE-7")
  }
  assert.ok(api.calls.some((request) => request.url === `${API}/card/by-token/BE-7` && request.token === "beta-token"))
  const missing = await call("get_card", { card: "ZZ-1" })
  assert.match(missing.data.error, /not found on any configured board/)
})

test("never sends a token outside the configured API origin", async () => {
  const { call, api } = setup({ BOARDS_TOKEN: "alpha-token" }, [structuredClone(alpha)])
  const { data, isError } = await call("get_resource", { url: "https://evil.example/api/steal" })
  assert.equal(isError, true)
  assert.match(data.error, /Refusing to send a board token/)
  assert.ok(api.calls.every((request) => request.url.startsWith(API)))
})

test("creates a card through the column's advertised operation and applies extra fields", async () => {
  const { call, api } = setup({ BOARDS_TOKEN: "alpha-token" }, [structuredClone(alpha)])
  const { data, isError } = await call("create_card", { column: "done", title: "Ship it", description: "Notes" })
  assert.equal(isError, false, JSON.stringify(data))
  const create = api.calls.find((request) => request.method === "POST")
  assert.equal(create.url, `${API}/board/${alpha.id}/column/c-done/cards`)
  assert.deepEqual(create.body, { title: "Ship it" })
  const patch = api.calls.find((request) => request.method === "PATCH")
  assert.equal(patch.contentType, "application/merge-patch+json")
  assert.deepEqual(patch.body, { description: "Notes" })
})

test("moves cards by column title and invokes only advertised operations", async () => {
  const { call, api } = setup({ BOARDS_TOKEN: "alpha-token" }, [structuredClone(alpha)])
  await call("move_card", { card: "AL-1", column: "Done", position: 0 })
  const move = api.calls.find((request) => request.url.endsWith("/move"))
  assert.deepEqual(move.body, { columnId: "c-done", position: 0 })
  const archived = await call("invoke_operation", { card: "AL-1", operation: "card.archive" })
  assert.equal(archived.isError, false)
  assert.equal(api.calls.find((request) => request.url.endsWith("/archive")).body, undefined)
  const missing = await call("invoke_operation", { card: "AL-1", operation: "card.delete" })
  assert.match(missing.data.error, /not available.*card\.update, card\.archive, card\.move/)
  const badColumn = await call("move_card", { card: "AL-1", column: "Nope" })
  assert.match(badColumn.data.error, /Columns: To do, Done/)
})

test("reports a created card when applying extra fields fails, so it is not created twice", async () => {
  const { call, api } = setup({ BOARDS_TOKEN: "alpha-token" }, [structuredClone(alpha)], { failPatch: true })
  const { data, isError } = await call("create_card", { column: "To do", title: "Ship it", description: "Notes" })
  assert.equal(isError, false)
  assert.equal(data.code, "NEW-1")
  assert.match(data.warning, /created.*description.*do not create it again/)
  assert.equal(api.calls.filter((request) => request.method === "POST").length, 1)
})

test("requires a target when several nested items advertise the same operation", async () => {
  const sent = []
  const client = new BoardsClient({
    env: { BOARDS_API_URL: API, BOARDS_TOKEN: "t" },
    fetch: async (url, init) => {
      sent.push({ url, method: init.method })
      return new Response("{}", { status: 200 })
    },
  })
  const card = {
    "@id": `${API}/card/1`,
    comments: [
      { "@id": `${API}/comment/a`, "hydra:operation": [operation("comment.update", "PATCH", null)] },
      { "@id": `${API}/comment/b`, "hydra:operation": [operation("comment.update", "PATCH", null)] },
    ],
  }
  const board = { token: "t" }
  await assert.rejects(client.invoke(board, card, "comment.update", { body: "x" }), /several items; pass "target".*comment\/a.*comment\/b/)
  await assert.rejects(client.invoke(board, card, "comment.update", { body: "x" }, `${API}/comment/z`), /has no target/)
  await client.invoke(board, card, "comment.update", { body: "x" }, `${API}/comment/b`)
  assert.deepEqual(sent, [{ url: `${API}/comment/b`, method: "PATCH" }])
})

test("follows only same-origin GET redirects and never redirects a write", async () => {
  const requests = []
  const redirect = (location, status = 302) => new Response(null, { status, headers: { Location: location } })
  const client = new BoardsClient({
    env: { BOARDS_API_URL: API, BOARDS_TOKEN: "t" },
    fetch: async (url, init) => {
      requests.push({ url, method: init.method, redirect: init.redirect })
      if (url === `${API}/moved`) return redirect("/api/here")
      if (url === `${API}/away`) return redirect("https://evil.example/api/steal")
      if (url === `${API}/write`) return redirect(`${API}/elsewhere`, 307)
      return new Response(JSON.stringify({ ok: true }), { status: 200 })
    },
  })
  assert.deepEqual(await client.request("t", `${API}/moved`), { ok: true })
  assert.equal(requests[1].url, `${API}/here`)
  await assert.rejects(client.request("t", `${API}/away`), /Refusing to send a board token to https:\/\/evil\.example/)
  await assert.rejects(client.request("t", `${API}/write`, { method: "POST", body: { secret: 1 } }), /redirected.*not followed/)
  assert.ok(requests.every((request) => request.redirect === "manual" && request.url.startsWith(API)))
})

test("tries other boards when the board named in a URL path refuses it", async () => {
  const { client } = setup({ ALPHA_BOARD_TOKEN: "alpha-token", BETA_BOARD_TOKEN: "beta-token" })
  // A board id in the query string does not pin the lookup to that board.
  const viaQuery = await client.requestAnyBoard(`${API}/card/${beta.cards[0].id}?from=${alpha.id}`)
  assert.equal(viaQuery.board.slug, "beta")
  const owned = await client.requestAnyBoard(`${API}/board/${beta.id}`)
  assert.equal(owned.board.slug, "beta")
  // A board named in the path is tried first, and refusal falls back to the others.
  const order = []
  const fallback = new BoardsClient({
    env: { BOARDS_API_URL: API, ALPHA_BOARD_TOKEN: "alpha-token", BETA_BOARD_TOKEN: "beta-token" },
    fetch: async (url, init) => {
      const shared = `${API}/board/${alpha.id}/shared-card`
      if (url !== shared) return fakeApi([structuredClone(alpha), structuredClone(beta)]).fetch(url, init)
      order.push(init.headers.Authorization)
      const ok = init.headers.Authorization === "Bearer beta-token"
      return new Response(JSON.stringify(ok ? { found: true } : { title: "Forbidden" }), { status: ok ? 200 : 403 })
    },
  })
  const shared = await fallback.requestAnyBoard(`${API}/board/${alpha.id}/shared-card`)
  assert.equal(shared.board.slug, "beta")
  assert.deepEqual(order, ["Bearer alpha-token", "Bearer beta-token"])
})

test("reports a missing token configuration as a tool error", async () => {
  const { call } = setup({})
  const { data, isError } = await call("list_boards")
  assert.equal(isError, true)
  assert.match(data.error, /BOARDS_TOKEN/)
})

test("speaks newline-delimited JSON-RPC over stdio", async () => {
  const input = new PassThrough()
  const output = new PassThrough()
  const client = new BoardsClient({ env: {}, fetch: async () => assert.fail("no request expected") })
  const lines = serve({ input, output, client })
  const replies = []
  output.on("data", (chunk) => replies.push(...chunk.toString().trim().split("\n").map((line) => JSON.parse(line))))
  const send = (message) => input.write(`${JSON.stringify(message)}\n`)
  send({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } })
  send({ jsonrpc: "2.0", method: "notifications/initialized" })
  send({ jsonrpc: "2.0", id: 2, method: "tools/list" })
  send({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "nope" } })
  send({ jsonrpc: "2.0", id: 4, method: "unknown/method" })
  input.write("not json\n")
  await new Promise((resolve) => setTimeout(resolve, 50))
  lines.close()
  const byId = new Map(replies.map((reply) => [reply.id, reply]))
  assert.equal(byId.get(1).result.protocolVersion, "2025-06-18")
  assert.equal(byId.get(1).result.serverInfo.name, "boards")
  assert.ok(byId.get(2).result.tools.every((tool) => tool.inputSchema.type === "object" && tool.description))
  assert.equal(byId.get(3).error.code, -32602)
  assert.equal(byId.get(4).error.code, -32601)
  assert.equal(byId.get(null).error.code, -32700)
  assert.equal(replies.length, 5)
})

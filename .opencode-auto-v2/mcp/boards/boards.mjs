// Boards Runtime API client and MCP tool catalogue.
//
// The Runtime API is hypermedia-driven (JSON-LD + Hydra): every token is scoped
// to one board, the entry point links to that board, and each resource lists the
// operations the token may perform. This module therefore hardcodes only the API
// root and follows links, IRI templates, and advertised operations from there,
// so it works for any board in the Boards app.

const DEFAULT_API_URL = "https://api.boards.aircury.net/api"
const DEFAULT_WEB_URL = "https://boards.aircury.net"
const VOCAB = "https://boards.aircury.net/vocab/runtime-api#"
const TARGET = `${VOCAB}target`
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const TOKEN_SUFFIX = "_BOARD_TOKEN"
const REQUEST_TIMEOUT_MS = 30_000
const MAX_REDIRECTS = 3

export class BoardsError extends Error {
  constructor(message, details) {
    super(message)
    this.name = "BoardsError"
    this.details = details
  }
}

// Each configured token is one board connection. `BOARDS_TOKEN` is the generic
// single-board variable; any `<NAME>_BOARD_TOKEN` adds another board.
export function discoverTokens(env) {
  const tokens = []
  for (const [name, value] of Object.entries(env)) {
    if (!value || !value.trim()) continue
    if (name === "BOARDS_TOKEN" || (name.endsWith(TOKEN_SUFFIX) && name.length > TOKEN_SUFFIX.length)) {
      tokens.push({ name, token: value.trim() })
    }
  }
  return tokens.sort((a, b) => a.name.localeCompare(b.name))
}

export function expandTemplate(template, values = {}) {
  return template.replace(/\{([?&/]?)([^}]+)\}/g, (_, operator, names) => {
    const variables = names.split(",").map((name) => name.trim())
    if (operator === "?" || operator === "&") {
      const pairs = variables
        .filter((name) => values[name] !== undefined && values[name] !== null && values[name] !== "")
        .map((name) => `${encodeURIComponent(name)}=${encodeURIComponent(String(values[name]))}`)
      if (pairs.length === 0) return ""
      return (operator === "?" ? "?" : "&") + pairs.join("&")
    }
    const name = variables[0]
    if (values[name] === undefined || values[name] === null || values[name] === "") {
      throw new BoardsError(`Missing required URL variable "${name}".`)
    }
    return encodeURIComponent(String(values[name]))
  })
}

function templateOf(value) {
  if (typeof value === "string") return value
  if (value && typeof value === "object") return value["hydra:template"] ?? value["@id"]
  return undefined
}

function operationName(operation) {
  const id = operation["@id"] ?? ""
  return id.includes("#") ? id.slice(id.lastIndexOf("#") + 1) : id
}

function describeOperation(operation, owner) {
  return {
    name: operationName(operation),
    method: operation["hydra:method"],
    target: operation[TARGET] ?? owner,
    schema: operation["hydra:expects"] ?? null,
    contentType: operation["hydra:method"] === "PATCH" ? "application/merge-patch+json" : "application/json",
  }
}

// Collect advertised operations from a resource and any embedded resources.
export function collectOperations(resource) {
  const found = []
  const visit = (node, owner) => {
    if (Array.isArray(node)) {
      for (const item of node) visit(item, owner)
      return
    }
    if (!node || typeof node !== "object") return
    const self = node["@id"] ?? owner
    for (const operation of node["hydra:operation"] ?? []) {
      found.push({ ...describeOperation(operation, self), resource: self, resourceType: node["@type"] ?? null })
    }
    for (const [key, value] of Object.entries(node)) {
      if (key !== "hydra:operation") visit(value, self)
    }
  }
  visit(resource, resource?.["@id"])
  return found
}

const DROPPED_KEYS = new Set(["@context", "hydra:mapping", "hydra:search", "hydra:variableRepresentation", "hydra:possibleStatus", "mentionDirectory"])

// Reduce JSON-LD noise for model consumption while keeping every link and value.
export function compact(node) {
  if (Array.isArray(node)) return node.map(compact)
  if (!node || typeof node !== "object") return node
  if (node["@type"] === "hydra:IriTemplate") return node["hydra:template"]
  const result = {}
  for (const [key, value] of Object.entries(node)) {
    if (DROPPED_KEYS.has(key)) continue
    if (key === "hydra:operation") {
      result.operations = value.map((operation) => describeOperation(operation, node["@id"]))
      continue
    }
    const name = key.startsWith("hydra:") ? key.slice("hydra:".length) : key.startsWith(VOCAB) ? key.slice(VOCAB.length) : key
    result[name] = compact(value)
  }
  return result
}

function matches(value, selector) {
  return typeof value === "string" && value.toLowerCase() === selector.toLowerCase()
}

export class BoardsClient {
  constructor({ env = process.env, fetch: fetchImpl = globalThis.fetch } = {}) {
    this.apiUrl = (env.BOARDS_API_URL || DEFAULT_API_URL).replace(/\/+$/, "")
    this.webUrl = (env.BOARDS_WEB_URL || DEFAULT_WEB_URL).replace(/\/+$/, "")
    this.apiOrigin = new URL(this.apiUrl).origin
    this.fetch = fetchImpl
    this.tokens = discoverTokens(env)
    this.connections = new Map()
  }

  // Only ever send a board token to the configured API origin.
  assertApiUrl(url) {
    let parsed
    try {
      parsed = new URL(url, `${this.apiUrl}/`)
    } catch {
      throw new BoardsError(`Invalid URL: ${url}`)
    }
    if (parsed.origin !== this.apiOrigin) {
      throw new BoardsError(`Refusing to send a board token to ${parsed.origin}; only ${this.apiOrigin} is allowed.`)
    }
    return parsed.href
  }

  async request(token, url, { method = "GET", body, contentType } = {}) {
    let href = this.assertApiUrl(url)
    const headers = { Authorization: `Bearer ${token}`, Accept: "application/ld+json, application/problem+json, application/json" }
    // Redirects are handled here so neither the token nor a write body can be
    // forwarded to another origin; only same-origin GET redirects are followed.
    const init = { method, headers, redirect: "manual", signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) }
    if (body !== undefined && method !== "GET" && method !== "DELETE") {
      headers["Content-Type"] = contentType ?? (method === "PATCH" ? "application/merge-patch+json" : "application/json")
      init.body = JSON.stringify(body)
    }
    let response = await this.fetch(href, init)
    for (let hops = 0; response.status >= 300 && response.status < 400; hops++) {
      const location = response.headers.get("location")
      if (method !== "GET" || !location || hops >= MAX_REDIRECTS) {
        throw new BoardsError(`${method} ${href} was redirected${location ? ` to ${location}` : ""}; the redirect was not followed.`, { status: response.status })
      }
      href = this.assertApiUrl(new URL(location, href).href)
      response = await this.fetch(href, init)
    }
    const text = await response.text()
    let data = null
    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }
    if (!response.ok) {
      const problem = data && typeof data === "object" ? data : { detail: data }
      const summary = [problem.title, problem.detail].filter(Boolean).join(": ") || response.statusText
      throw new BoardsError(`${method} ${href} failed with ${response.status}${summary ? ` (${summary})` : ""}.`, {
        status: response.status,
        problem: compact(problem),
      })
    }
    return data
  }

  // Resolve one token to its board through the entry point and token summary.
  async connection(tokenEntry) {
    if (!this.connections.has(tokenEntry.name)) {
      const pending = (async () => {
        const entry = await this.request(tokenEntry.token, this.apiUrl)
        const grant = entry.tokenSelf ? await this.request(tokenEntry.token, entry.tokenSelf) : {}
        const board = entry.board ? await this.request(tokenEntry.token, entry.board) : null
        return {
          name: tokenEntry.name,
          token: tokenEntry.token,
          entry,
          boardUrl: entry.board,
          id: board?.id ?? grant.boardId ?? null,
          slug: board?.slug ?? null,
          title: board?.title ?? grant.boardTitle ?? null,
          kind: board?.kind ?? grant.boardKind ?? null,
          capabilities: grant.effectiveCapabilities ?? [],
        }
      })()
      this.connections.set(tokenEntry.name, pending)
      pending.catch(() => this.connections.delete(tokenEntry.name))
    }
    return this.connections.get(tokenEntry.name)
  }

  async listBoards() {
    if (this.tokens.length === 0) throw this.noTokensError()
    const results = await Promise.allSettled(this.tokens.map((entry) => this.connection(entry)))
    return results.map((result, index) => {
      const tokenVariable = this.tokens[index].name
      if (result.status === "rejected") return { tokenVariable, error: result.reason.message }
      const { id, slug, title, kind, capabilities } = result.value
      return { tokenVariable, id, slug, title, kind, webUrl: slug ? `${this.webUrl}/b/${slug}` : null, capabilities }
    })
  }

  noTokensError() {
    return new BoardsError("No board token is configured. Set BOARDS_TOKEN or a <NAME>_BOARD_TOKEN environment variable for each board in the OpenCode service environment.")
  }

  // Pick the board connection named by a selector, or the only one configured.
  async board(selector) {
    if (this.tokens.length === 0) throw this.noTokensError()
    if (!selector) {
      if (this.tokens.length === 1) return this.connection(this.tokens[0])
      throw new BoardsError(`Several boards are configured; pass "board" (one of: ${(await this.boardNames()).join(", ")}).`)
    }
    const wanted = String(selector).trim().replace(/^.*\/b\/([^/?#]+).*$/, "$1")
    const byName = this.tokens.find((entry) => matches(entry.name, wanted) || matches(entry.name, `${wanted}${TOKEN_SUFFIX}`))
    if (byName) return this.connection(byName)
    const settled = await Promise.allSettled(this.tokens.map((entry) => this.connection(entry)))
    for (const result of settled) {
      if (result.status !== "fulfilled") continue
      const board = result.value
      if ([board.id, board.slug, board.title].some((value) => matches(value, wanted))) return board
    }
    throw new BoardsError(`No configured token grants access to board "${selector}". Configured boards: ${(await this.boardNames()).join(", ") || "none"}. Add a <NAME>_BOARD_TOKEN for it.`)
  }

  async boardNames() {
    const settled = await Promise.allSettled(this.tokens.map((entry) => this.connection(entry)))
    return settled.map((result, index) => (result.status === "fulfilled" && result.value.slug) || this.tokens[index].name)
  }

  async get(boardSelector, url) {
    const board = await this.board(boardSelector)
    return this.request(board.token, url)
  }

  async boardResource(boardSelector) {
    const board = await this.board(boardSelector)
    return { board, resource: await this.request(board.token, board.boardUrl) }
  }

  // Accepts a card UUID, a public code such as "EL-12", a /c/<code> share link,
  // or an API card URL. Without a board selector, every configured board is tried.
  async card(reference, boardSelector) {
    const ref = String(reference ?? "").trim()
    if (!ref) throw new BoardsError("A card reference is required.")
    const candidates = boardSelector || this.tokens.length <= 1 ? [await this.board(boardSelector)] : await this.allBoards()
    let lastError
    for (const board of candidates) {
      try {
        return { board, card: await this.request(board.token, this.cardUrl(board, ref)) }
      } catch (error) {
        if (!(error instanceof BoardsError) || ![403, 404].includes(error.details?.status)) throw error
        lastError = error
      }
    }
    throw new BoardsError(`Card "${reference}" was not found on ${candidates.length === 1 ? "the selected board" : "any configured board"}.`, lastError?.details)
  }

  // GET an API URL with the token that can see it: the selected board, the
  // board whose id appears in the URL, or the first board that is not refused.
  async requestAnyBoard(url, boardSelector) {
    const href = this.assertApiUrl(url)
    if (boardSelector || this.tokens.length <= 1) {
      const board = await this.board(boardSelector)
      return { board, resource: await this.request(board.token, href) }
    }
    const boards = await this.allBoards()
    // Try the board whose id appears in the URL path first, then the others.
    const path = new URL(href).pathname
    const owner = boards.find((board) => board.id && path.split("/").includes(board.id))
    const ordered = owner ? [owner, ...boards.filter((board) => board !== owner)] : boards
    let lastError
    for (const board of ordered) {
      try {
        return { board, resource: await this.request(board.token, href) }
      } catch (error) {
        if (!(error instanceof BoardsError) || ![403, 404].includes(error.details?.status)) throw error
        lastError = error
      }
    }
    throw lastError
  }

  async allBoards() {
    const settled = await Promise.allSettled(this.tokens.map((entry) => this.connection(entry)))
    const boards = settled.filter((result) => result.status === "fulfilled").map((result) => result.value)
    if (boards.length === 0) throw new BoardsError("No configured board token could be resolved.", { errors: settled.map((result) => result.reason?.message) })
    return boards
  }

  cardUrl(board, ref) {
    if (/^https?:\/\//i.test(ref)) {
      const url = new URL(ref)
      if (url.origin === this.apiOrigin) return url.href
      const share = url.pathname.match(/\/c\/([^/]+)/)
      if (share) return expandTemplate(templateOf(board.entry.cardByToken), { token: decodeURIComponent(share[1]) })
      throw new BoardsError(`Unrecognised card URL: ${ref}`)
    }
    if (UUID.test(ref)) return expandTemplate(templateOf(board.entry.cardById), { cardId: ref })
    return expandTemplate(templateOf(board.entry.cardByToken), { token: ref })
  }

  async columns(board) {
    const resource = await this.request(board.token, board.boardUrl)
    const settings = resource.settings && typeof resource.settings === "object" ? resource.settings : await this.request(board.token, resource.settings)
    return { resource, columns: settings.managedColumns ?? [] }
  }

  async column(board, selector) {
    const { resource, columns } = await this.columns(board)
    const wanted = String(selector ?? "").trim()
    const column = columns.find((candidate) => [candidate.id, candidate.title, candidate.displayName].some((value) => matches(value, wanted)))
    if (!column) {
      throw new BoardsError(`Column "${selector}" does not exist on board "${board.slug ?? board.title}". Columns: ${columns.map((candidate) => candidate.displayName ?? candidate.title).join(", ")}.`)
    }
    return { resource, column }
  }

  // The column's card collection (and its card.create operation) is only linked
  // from the board's column listing, so follow that link instead of building it.
  async columnCards(board, boardResource, column, query = {}) {
    const columns = await this.request(board.token, expandTemplate(templateOf(boardResource.columns), { includeCards: "true", limit: 1 }))
    const member = (columns["hydra:member"] ?? []).find((candidate) => candidate.id === column.id)
    if (!member) throw new BoardsError(`Column "${column.title}" is not listed on the board.`)
    return this.request(board.token, expandTemplate(templateOf(member.cards), query))
  }

  // Run an operation advertised by a resource. Operations are only advertised
  // when the token holds the capability, so discovery doubles as authorisation.
  // When nested items (comments, checklist items) advertise the same operation,
  // the caller must name the intended target; never guess between them.
  async invoke(board, resource, name, body, target) {
    const available = collectOperations(resource)
    const named = available.filter((candidate) => candidate.name === name)
    if (named.length === 0) {
      const names = [...new Set(available.map((candidate) => candidate.name))]
      throw new BoardsError(`Operation "${name}" is not available on ${resource["@id"]}. Available: ${names.join(", ") || "none"}. Operations are only advertised when the token has the required capability.`)
    }
    const matching = target ? named.filter((candidate) => candidate.target === target || candidate.resource === target) : named
    if (matching.length !== 1) {
      const targets = named.map((candidate) => candidate.target).join(", ")
      throw new BoardsError(matching.length === 0
        ? `Operation "${name}" has no target ${target}. Targets: ${targets}.`
        : `Operation "${name}" is advertised by several items; pass "target" (one of: ${targets}).`)
    }
    const [operation] = matching
    const payload = operation.schema ? body ?? {} : body
    return { operation, result: await this.request(board.token, operation.target, { method: operation.method, body: payload, contentType: operation.contentType }) }
  }
}

function cardSummary(card) {
  return {
    id: card.id,
    code: card.publicToken,
    title: card.title,
    column: card.columnDisplayName ?? card.columnTitle ?? card.column?.title ?? null,
    columnId: card.columnId ?? card.column?.id ?? null,
    labels: (card.labels ?? []).map((label) => label.name ?? label),
    assignees: (card.assignees ?? []).map((assignee) => assignee.displayName ?? assignee.name ?? assignee.id ?? assignee),
    dueAt: card.dueAt ?? card.faceSummary?.dueAt ?? null,
    blocked: card.blocked ?? false,
    archived: card.archived ?? false,
    commentCount: card.commentCount,
    checklist: card.checklistItemCount ? `${card.checklistCompletedCount ?? 0}/${card.checklistItemCount}` : undefined,
    url: card["@id"],
  }
}

function json(value) {
  return { content: [{ type: "text", text: JSON.stringify(value, null, 2) }] }
}

const boardProperty = {
  type: "string",
  description: "Board slug, id, title, web URL, or token variable name. Optional when only one board token is configured.",
}
const cardProperty = {
  type: "string",
  description: "Card public code (e.g. \"EL-12\"), card UUID, /c/<code> share link, or API card URL.",
}

export function createTools(client) {
  return [
    {
      name: "list_boards",
      description: "List the boards reachable with the configured tokens, with their capabilities. Each token grants access to exactly one board.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: { type: "object", properties: {}, additionalProperties: false },
      handler: async () => json(await client.listBoards()),
    },
    {
      name: "get_board",
      description: "Get a board overview: columns (with ids and card counts), labels, members, settings, links, and the operations available on it.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: { type: "object", properties: { board: boardProperty }, additionalProperties: false },
      handler: async ({ board }) => {
        const { board: connection, resource } = await client.boardResource(board)
        const settings = resource.settings ?? {}
        return json({
          id: resource.id,
          slug: resource.slug,
          title: resource.title,
          kind: resource.kind,
          role: resource.role,
          webUrl: `${client.webUrl}/b/${resource.slug}`,
          capabilities: connection.capabilities,
          columns: (settings.managedColumns ?? []).map((column) => ({
            id: column.id,
            title: column.displayName ?? column.title,
            activeCardCount: column.activeCardCount,
            completed: (resource.completedColumnIds ?? []).includes(column.id),
            backlog: (resource.backlogColumnIds ?? []).includes(column.id),
          })),
          labels: (resource.labels?.["hydra:member"] ?? []).map(({ id, name, colourPreset }) => ({ id, name, colourPreset })),
          members: (resource.members ?? []).map(({ userId, displayName, role, email, active }) => ({ userId, displayName, role, email, active })),
          settings: {
            timezone: settings.timezone,
            estimateUnit: settings.estimateUnit,
            identifierStrategy: settings.identifierStrategy,
            activeSequencePrefix: settings.activeSequencePrefix,
            addOns: (settings.addOnCatalogue ?? []).map(({ id, name, enabled }) => ({ id, name, enabled })),
          },
          links: Object.fromEntries(Object.entries(compact(resource)).filter(([, value]) => typeof value === "string" && value.startsWith(client.apiOrigin))),
          operations: collectOperations(resource).map(({ name, method, target, schema }) => ({ name, method, target, schema })),
        })
      },
    },
    {
      name: "list_cards",
      description: "List cards. With \"column\", returns that column's cards with paging; otherwise returns the whole board's card digest (code, title, column, labels, description).",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          board: boardProperty,
          column: { type: "string", description: "Column title, display name, or id." },
          includeArchived: { type: "boolean", description: "Include archived cards (column listing only)." },
          limit: { type: "integer", minimum: 1, description: "Page size (column listing only)." },
          cursor: { type: "string", description: "Cursor from a previous column listing's nextCursor." },
        },
        additionalProperties: false,
      },
      handler: async ({ board, column, includeArchived, limit, cursor }) => {
        const connection = await client.board(board)
        if (!column) {
          const resource = await client.request(connection.token, connection.boardUrl)
          const digest = await client.request(connection.token, templateOf(resource.cardDigest))
          return json({ board: connection.slug, cards: (digest.cards ?? []).map((card) => compact(card)) })
        }
        const { resource, column: found } = await client.column(connection, column)
        const cards = await client.columnCards(connection, resource, found, { includeArchivedCards: includeArchived ? "true" : undefined, limit, cursor })
        return json({
          board: connection.slug,
          column: { id: found.id, title: found.displayName ?? found.title },
          totalItems: cards["hydra:totalItems"],
          nextCursor: cards.nextCursor ?? null,
          cards: (cards["hydra:member"] ?? []).map((card) => cardSummary({ columnTitle: found.displayName ?? found.title, columnId: found.id, ...card })),
        })
      },
    },
    {
      name: "search_cards",
      description: "Full-text search for cards on a board. Returns matching active cards and archived matches.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: { board: boardProperty, query: { type: "string", minLength: 1, description: "Search text." } },
        required: ["query"],
        additionalProperties: false,
      },
      handler: async ({ board, query }) => {
        const { board: connection, resource } = await client.boardResource(board)
        const template = templateOf(resource.cardSearch)
        const url = template.includes("{") ? expandTemplate(template, { q: query }) : `${template}?q=${encodeURIComponent(query)}`
        const result = await client.request(connection.token, url)
        return json({
          totalItems: result["hydra:totalItems"],
          cards: (result["hydra:member"] ?? []).map(cardSummary),
          archivedCards: (result.archivedCards ?? []).map(cardSummary),
          archivedHasMore: result.archivedHasMore ?? false,
        })
      },
    },
    {
      name: "get_card",
      description: "Get a card's full detail (description, comments, checklists, labels, assignees, links, attachments) and the operations available on it and its nested items. Optionally include activity, relations, or time entries.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          card: cardProperty,
          board: boardProperty,
          include: {
            type: "array",
            items: { type: "string", enum: ["activity", "relations", "timeEntries"] },
            description: "Linked resources to fetch alongside the card.",
          },
        },
        required: ["card"],
        additionalProperties: false,
      },
      handler: async ({ card, board, include = [] }) => {
        const found = await client.card(card, board)
        const detail = compact(found.card)
        delete detail.boardDetails
        detail.webUrl = found.card.publicToken ? `${client.webUrl}/c/${encodeURIComponent(found.card.publicToken)}` : undefined
        detail.operations = collectOperations(found.card).map(({ name, method, target, schema, resourceType }) => ({ name, method, target, schema, on: resourceType }))
        for (const key of include) {
          if (typeof found.card[key] === "string") detail[key] = compact(await client.request(found.board.token, found.card[key]))
        }
        return json(detail)
      },
    },
    {
      name: "create_card",
      description: "Create a card in a column. Extra fields (description, labels, assignees, due date, estimate) are applied with a follow-up card.update.",
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          board: boardProperty,
          column: { type: "string", description: "Column title, display name, or id." },
          title: { type: "string", minLength: 1, maxLength: 500 },
          position: { type: "integer", minimum: 0, description: "Zero-based position in the column; defaults to the API's placement." },
          description: { type: "string", description: "Markdown description." },
          labelIds: { type: "array", items: { type: "string" } },
          assigneeUserIds: { type: "array", items: { type: "string" } },
          dueAt: { type: "string", format: "date-time" },
          estimate: { type: "object" },
          parentCardId: { type: "string" },
        },
        required: ["column", "title"],
        additionalProperties: false,
      },
      handler: async ({ board, column, title, position, ...rest }) => {
        const connection = await client.board(board)
        const { resource, column: found } = await client.column(connection, column)
        const cards = await client.columnCards(connection, resource, found, { limit: 1 })
        const body = position === undefined ? { title } : { title, position }
        const { result: created } = await client.invoke(connection, cards, "card.create", body)
        const changes = Object.fromEntries(Object.entries(rest).filter(([, value]) => value !== undefined))
        if (Object.keys(changes).length === 0) return json(cardSummary(created))
        try {
          const fresh = await client.request(connection.token, created["@id"])
          return json(cardSummary((await client.invoke(connection, fresh, "card.update", changes)).result))
        } catch (error) {
          // The card exists; report it so a retry does not create a duplicate.
          return json({
            ...cardSummary(created),
            warning: `The card was created, but applying ${Object.keys(changes).join(", ")} failed: ${error.message} Retry with update_card on this card; do not create it again.`,
          })
        }
      },
    },
    {
      name: "update_card",
      description: "Update card fields with card.update (JSON merge patch). Use get_schema with \"card.update\" for every accepted field. Moving between columns uses move_card.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          card: cardProperty,
          board: boardProperty,
          changes: {
            type: "object",
            description: "Fields to change, e.g. title, description, dueAt, dueComplete, labelIds, assigneeUserIds, blocked, blockReason, estimate, parentCardId. Use null to clear nullable fields.",
            minProperties: 1,
          },
        },
        required: ["card", "changes"],
        additionalProperties: false,
      },
      handler: async ({ card, board, changes }) => {
        const found = await client.card(card, board)
        const { result } = await client.invoke(found.board, found.card, "card.update", changes)
        return json(cardSummary(result))
      },
    },
    {
      name: "move_card",
      description: "Move a card to another column on its board, optionally at a zero-based position.",
      annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          card: cardProperty,
          board: boardProperty,
          column: { type: "string", description: "Destination column title, display name, or id." },
          position: { type: "integer", minimum: 0 },
        },
        required: ["card", "column"],
        additionalProperties: false,
      },
      handler: async ({ card, board, column, position }) => {
        const found = await client.card(card, board)
        const { column: destination } = await client.column(found.board, column)
        const body = position === undefined ? { columnId: destination.id } : { columnId: destination.id, position }
        const { result } = await client.invoke(found.board, found.card, "card.move", body)
        return json(cardSummary(result))
      },
    },
    {
      name: "add_comment",
      description: "Add a Markdown comment to a card.",
      annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: { card: cardProperty, board: boardProperty, body: { type: "string", minLength: 1, description: "Markdown comment body." } },
        required: ["card", "body"],
        additionalProperties: false,
      },
      handler: async ({ card, board, body }) => {
        const found = await client.card(card, board)
        const { result } = await client.invoke(found.board, found.card, "comment.create", { body })
        return json(compact(result))
      },
    },
    {
      name: "list_events",
      description: "List the board's event log (card created, moved, settings changed, …) in sequence order. Use \"after\" with the previous nextAfter to page or poll.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: { board: boardProperty, after: { type: "integer", minimum: 0, description: "Return events after this sequence number." } },
        additionalProperties: false,
      },
      handler: async ({ board, after }) => {
        const { board: connection, resource } = await client.boardResource(board)
        const base = templateOf(resource.events)
        const url = base.includes("{") ? expandTemplate(base, { after }) : after === undefined ? base : `${base}?after=${after}`
        const events = await client.request(connection.token, url)
        return json({
          totalItems: events["hydra:totalItems"],
          nextAfter: events.nextAfter ?? null,
          hasMore: events.hasMore ?? false,
          events: (events["hydra:member"] ?? []).map(({ sequence, type, occurredAt, card, actor }) => ({ sequence, type, occurredAt, card, actor })),
        })
      },
    },
    {
      name: "list_operations",
      description: "List the operations the token may perform on a resource (the board, a card, or any API URL), including nested items such as comments, checklists, or labels, with their JSON schema URLs.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          board: boardProperty,
          card: cardProperty,
          url: { type: "string", description: "Any Boards API resource URL. Defaults to the board when neither card nor url is given." },
        },
        additionalProperties: false,
      },
      handler: async ({ board, card, url }) => {
        const { resource } = await resolveResource(client, { board, card, url })
        return json({ resource: resource["@id"], type: resource["@type"], operations: collectOperations(resource) })
      },
    },
    {
      name: "get_schema",
      description: "Get the JSON schema for an operation body, by operation name (e.g. \"card.update\") or schema URL.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: { operation: { type: "string", minLength: 1 }, board: boardProperty },
        required: ["operation"],
        additionalProperties: false,
      },
      handler: async ({ operation, board }) => {
        const url = /^https?:\/\//.test(operation) ? operation : `${client.apiUrl}/schemas/${encodeURIComponent(operation)}`
        return json((await client.requestAnyBoard(url, board)).resource)
      },
    },
    {
      name: "invoke_operation",
      description: "Run any operation advertised by a resource (see list_operations), e.g. card.archive, card.assign, card.attach-label, checklist.create, card.log-time, label.create. The body must match the operation's schema (see get_schema).",
      annotations: { readOnlyHint: false, destructiveHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          operation: { type: "string", minLength: 1, description: "Operation name, e.g. \"card.archive\"." },
          board: boardProperty,
          card: cardProperty,
          url: { type: "string", description: "API URL of the resource that advertises the operation. Defaults to the card, or to the board." },
          body: { type: "object", description: "Request body matching the operation schema. Omit for operations without a schema." },
          target: { type: "string", description: "Operation target or owning item URL from list_operations; required when several nested items advertise the same operation." },
        },
        required: ["operation"],
        additionalProperties: false,
      },
      handler: async ({ operation, board, card, url, body, target }) => {
        const { connection, resource } = await resolveResource(client, { board, card, url })
        const { operation: performed, result } = await client.invoke(connection, resource, operation, body, target)
        return json({ operation: performed.name, method: performed.method, target: performed.target, result: compact(result) })
      },
    },
    {
      name: "get_resource",
      description: "GET any Boards API resource by URL (links found in other responses), optionally expanding URL template variables. Use for activity, relations, time entries, archived cards, repeat rules, templates, and similar links.",
      annotations: { readOnlyHint: true, openWorldHint: true },
      inputSchema: {
        type: "object",
        properties: {
          url: { type: "string", description: "Boards API URL or URL template such as .../columns{?includeCards,limit}." },
          variables: { type: "object", description: "Values for URL template variables.", additionalProperties: { type: ["string", "number", "boolean"] } },
          board: boardProperty,
        },
        required: ["url"],
        additionalProperties: false,
      },
      handler: async ({ url, variables, board }) => {
        return json(compact((await client.requestAnyBoard(expandTemplate(url, variables ?? {}), board)).resource))
      },
    },
  ]
}

async function resolveResource(client, { board, card, url }) {
  if (url) {
    const { board: connection, resource } = await client.requestAnyBoard(url, board)
    return { connection, resource }
  }
  if (card) {
    const found = await client.card(card, board)
    return { connection: found.board, resource: found.card }
  }
  const { board: connection, resource } = await client.boardResource(board)
  return { connection, resource }
}

export const INSTRUCTIONS = `Boards (boards.aircury.net) tools. Each configured token grants access to one board; use list_boards to see them and pass "board" (slug, id, or title) when several are configured.
Cards are referenced by public code (e.g. "EL-12"), UUID, or /c/<code> share link; columns by title or id.
The API is hypermedia-driven: operations appear only when the token holds the capability. Use list_operations and get_schema before invoke_operation for anything without a dedicated tool (archive, assign, labels, checklists, time, links, watch, snooze).
Prefer reading a card with get_card before changing it, and confirm destructive operations (archive, delete) with the user.`

---
name: next-auth-app-router
description: Use whenever creating, editing, or reviewing NextAuth.js or Auth.js authentication in Next.js App Router projects. Trigger for credentials or OAuth providers, JWT/session callbacks, typed session data, server guards, middleware, client session providers, protected layouts, token forwarding, 401 handling, logout, impersonation, or session-expiry behavior. Keep authorization server-side, keep tokens out of client props, and align server, client, API, and cache lifecycles.
---

# NextAuth App Router

Use this skill for authentication lifecycle and session boundaries. Use `nextjs-app-router` for generic route composition and `react-query-api` for ordinary server-state fetching after authentication is established.

## Related Skills

- Use `nextjs-app-router` for layouts, route groups, redirects, metadata, not-found, and error boundaries.
- Use `react-query-api` for authenticated API modules, query keys, cache invalidation, and hydration.
- Use `react-components` for client session-aware components and accessible auth UI.
- Use `frontend-testing` for login, redirect, session-expiry, and role behavior.

## Inspect The Installed Version

- Inspect the installed NextAuth/Auth.js version and existing config before choosing APIs. `auth()`, `getServerSession()`, route handlers, middleware, and provider patterns differ across major versions.
- Read the existing session type augmentation, provider tree, callbacks, and API connector before adding a second auth path.
- Preserve the project's session strategy, cookie settings, secret handling, and provider conventions unless the task explicitly changes them.

## Providers And Session Data

- Configure credentials, OAuth, or custom providers in the central auth module. Keep provider-specific normalization there rather than in page components.
- Use callbacks to enrich the token/session with the smallest typed identity and capability data the UI needs.
- Never put access tokens, refresh tokens, secrets, or sensitive provider responses into client-visible session data unless the project has a deliberate secure contract.
- Augment session and token types instead of casting session objects throughout the application.
- Treat token expiry and refresh failures as explicit unauthenticated outcomes; do not render a stale authenticated UI indefinitely.

## Server And Client Boundaries

- Guard protected pages and layouts on the server before fetching protected data or rendering private content.
- Use the server session API appropriate for the installed version in Server Components, route handlers, and server actions.
- Use `useSession` only in Client Components that need reactive session state. Keep the provider at the smallest shared client boundary that needs it.
- Pass only serializable, non-sensitive session data to client providers and components.
- Middleware can provide early redirects or request context, but it is not a replacement for server authorization near the resource.

## Roles And Permissions

- Keep role/capability checks in a named guard or policy helper, not repeated string comparisons across pages.
- Distinguish authentication from authorization: an authenticated user may still be forbidden from a resource or action.
- Enforce permissions on the server for pages, route handlers, mutations, and downloads. Hiding a button is only a usability improvement.
- Use safe, validated return URLs for post-login redirects. Do not redirect to an arbitrary user-controlled external URL.
- Make impersonation or elevated support sessions explicit, auditable, and easy to exit if the product requires them.

## API Tokens And 401 Recovery

- Keep token forwarding in the shared server/client API connector appropriate for the environment. Do not repeat bearer-header logic in components.
- Decide how a 401 is represented: session expiry, sign-out, refresh, or a visible re-authentication state. Apply it consistently.
- Do not turn authentication failures into empty successful responses.
- Clear or scope cached user data when the authenticated identity changes or the session ends. Avoid leaking one user's query cache into another session.
- Keep multipart uploads, downloads, and server-only token use on the appropriate side of the boundary.

## Login And Logout UX

- Represent pending, invalid credentials, provider errors, expired sessions, and successful redirects distinctly.
- Prevent duplicate login/logout submissions and preserve useful field-level errors.
- After logout, clear private UI state and query caches that could reveal prior user data.
- Avoid client-only guards that briefly render private content before redirecting.

## Review Checklist

- Installed auth version and existing provider/session APIs were inspected.
- Server guards protect pages, handlers, mutations, and private data before rendering or fetching.
- Session/token types are explicit and sensitive values never cross into client props.
- Roles and capabilities use centralized, server-enforced policy helpers.
- Return URLs are validated and 401/expiry behavior is consistent.
- API token forwarding is centralized and cache data is cleared or scoped on identity changes.
- Login, logout, pending, error, forbidden, and expired-session states are intentional and tested.

---
name: nextjs-app-router
description: Use whenever creating, editing, or reviewing Next.js App Router routes, pages, layouts, route groups, dynamic segments, metadata, redirects, authentication guards, loading/error handling, or server/client boundaries. Apply this skill whenever the user asks for a Next.js page, route, layout, SEO metadata, protected screen, 404 behavior, or navigation change, even if they do not mention the App Router explicitly. Keep routes thin, server-first, version-aware, and composed from feature components.
---

# Next.js App Router

Use this skill for App Router file conventions and route composition. Inspect the installed Next.js version and neighboring routes first because `params`, caching, and some APIs differ between major versions.

## Related Skills

- Use `react-components` for feature component structure, props, and client boundaries.
- Use `frontend-styling` for layout and responsive presentation.
- Use `react-query-api` for server prefetching, client queries, and hydration.
- Use `next-auth-app-router` for NextAuth/Auth.js session lifecycle, token forwarding, and role guards.
- Use `frontend-testing` for route and navigation behavior tests.

## Route Structure

- Keep framework route files under `app` and screen composition in feature-oriented components.
- Keep `page.tsx` and `layout.tsx` files thin: resolve route input, authenticate/authorize, fetch or prefetch initial data, define metadata, and render a feature component.
- Use route groups to share shells and access boundaries without changing the public URL.
- Use dynamic segments for identifiers and slugs. Use nested layouts for shared navigation, headers, footers, and dashboard shells.
- Centralize internal route construction and parameter encoding in a typed route helper when the project has more than a few internal URLs.
- Preserve the project's naming and route grouping conventions. Framework-reserved filenames remain lowercase.

## Server-First Boundaries

- Pages and layouts are Server Components by default. Keep them server-compatible unless they need browser interactivity.
- Add `'use client';` only to the smallest component that needs hooks, event handlers, browser APIs, client context, or a browser-only library.
- Keep authentication, authorization, secrets, database access, filesystem access, and server-only API helpers on the server.
- Pass only serializable props across the Server Component boundary.
- Do not make a page a Client Component just to render one interactive child.
- Mark server-only modules with `import 'server-only'` where the project's tooling supports or expects it.

## Params And Search Params

- Check the installed Next.js version before typing route input. In current Next.js versions, page and layout `params` and `searchParams` are promises and should be awaited in async Server Components.

```tsx
interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const { tab } = await searchParams

  return <RecordPage id={id} tab={tab} />
}
```

- On older versions, follow the installed version's synchronous route prop contract rather than copying current examples blindly.
- Validate and normalize route input at the boundary. Do not pass untrusted query strings into domain code without parsing.
- Keep filters, tabs, pagination, and sort state in the URL when they should be shareable, bookmarkable, or restorable.
- Use the appropriate client pattern for reading promise-based route props in a Client Component; Client Components cannot be async.

## Authentication And Authorization

- Enforce access on the server in the route or layout that owns the protected boundary.
- Use `redirect()` for unauthenticated users, role routing, canonical tabs, and other intentional navigation outcomes.
- Treat middleware as supplemental routing behavior, not the only authorization boundary.
- Re-check authorization close to protected data and actions. Do not rely on hidden UI controls for security.
- Keep redirect targets and route construction centralized and correctly encoded.
- If a shared protected layout bootstraps the current user, pass only the serializable session data needed by client providers and keep the authoritative guard on the server.

## Not Found And Errors

- Use `notFound()` for a confirmed missing resource and let the appropriate not-found UI render.
- Re-throw unexpected failures rather than turning every error into a 404.
- Add `loading.tsx` for route-level loading UI when a segment benefits from streaming or a consistent pending shell.
- Add `error.tsx` for a recoverable segment error boundary; it must be a Client Component and should expose a reset/retry action.
- Keep user-facing empty states in the feature UI when the request succeeded but returned no records. Do not confuse empty data with a route error.
- Use `global-error.tsx` only for the application-level failure boundary when the project needs one.

## Data And Caching

- Fetch on the server when data is needed for initial rendering, authorization, metadata, or SEO.
- Follow the project's explicit cache and revalidation policy. Choose cache behavior deliberately for personalized, mutable, and public data.
- Avoid fetching the same resource through incompatible server and client contracts.
- When a client component also uses TanStack Query, prefetch/hydrate using the exact query key and request contract only if the project already uses that pattern or the screen benefits from it.
- Keep response parsing and error mapping at the API boundary.

## Metadata And Canonical URLs

- Define stable application metadata in the root or shared layout.
- Use route-specific static metadata or `generateMetadata()` for titles, descriptions, images, and canonical URLs.
- Build canonical URLs from normalized route data, not raw unvalidated query strings.
- Keep metadata generation server-side and avoid duplicating route literals.

## Review Checklist

- Route file follows the installed Next.js version's params/searchParams contract.
- Page and layout are thin and delegate screen UI to a feature component.
- Server/client boundaries are minimal and serialization-safe.
- Authentication and authorization are enforced server-side; redirects are intentional.
- Dynamic parameters are validated, canonical URLs are normalized, and 404s use `notFound()` appropriately.
- Loading, recoverable error, empty, and success states are represented at the correct layer.
- Cache/revalidation behavior is deliberate and does not expose personalized data.
- Metadata and internal URLs follow existing helpers and conventions.

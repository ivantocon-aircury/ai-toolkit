---
name: react-tanstack-table
description: Use whenever creating, editing, or reviewing TanStack Table or React Table grids in React and Next.js projects. Trigger for API-backed tables, typed columns, server-side pagination, sorting, filtering, row selection, bulk actions, table state synchronized with URLs or React Query, or migrations from legacy table APIs. Keep table state typed and explicit, use stable row identifiers, and distinguish client-side from manual server-side behavior.
---

# React TanStack Table

Use this skill for data grids. Keep transport and cache contracts in `react-query-api`, form validation in `react-hook-form-yup`, and visual primitives in `frontend-styling` or `tailwindcss`.

## Related Skills

- Use `react-query-api` for API modules, query keys, pagination requests, prefetching, and cache invalidation.
- Use `react-components` for component structure, accessibility, and action components.
- Use `react-hook-form-yup` or `react-controlled-form-widgets` for table filters with form-controlled inputs.
- Use `frontend-testing` for user-visible table behavior and request-state tests.

## Table Contract

- Inspect the installed table version and nearby wrappers before choosing APIs. Do not mix v7 and v8 contracts in new code.
- Define typed `ColumnDef` values and explicit row/data types. Keep accessors, headers, cell renderers, and filter metadata intention-revealing.
- Give rows a stable domain identifier through the table's row-ID configuration when the data does not use the expected `id` field.
- Keep columns stable. Define static columns outside the component when possible; otherwise follow the project's established stability pattern instead of recreating definitions on every render.
- Keep action columns explicit and use labeled buttons or links with stable selectors when semantic locators cannot identify them.

## Client And Server State

- Decide whether each feature is client-side or manual server-side before implementing the table.
- Client-side mode may sort, filter, and paginate the loaded dataset locally when the dataset is bounded and already complete.
- Manual mode must send normalized page, page size, sort, filter, and search parameters to the API. Do not enable client row models that silently contradict server results.
- Keep table interaction state separate from query response state. The table owns user intent; the query layer owns fetching and cache.
- Include every response-affecting table parameter in the query key through a shared factory.
- Debounce free-text filters and reset or clamp the page when filters, sort, or page size change.
- Preserve useful rows during background refetch when the project supports placeholder data, and show a refetch indicator separately from initial loading.

## Filtering And Sorting

- Normalize empty values, dates, option IDs, ranges, and multi-select values before they enter the table state or query key.
- Give each filter a stable identifier and a clear conversion between UI value, table state, and API parameter.
- Keep filter widgets controlled through the established form/control adapter rather than placing transport calls inside a cell.
- Make sort direction and null ordering explicit when the API and client could differ.
- Do not hide a server filter inside a client-only predicate; users should see behavior that matches the request being made.

## Pagination And Selection

- Treat pagination metadata as part of the typed response contract. Render current page, total count, and disabled navigation states from that contract.
- Reset selection after a mutation or page/filter change when selected rows are no longer visible, unless the product explicitly supports cross-page selection.
- For bulk actions, define whether selection is page-local or query-wide and prevent actions with no selected rows.
- Keep row actions available on narrow screens; use responsive layout rather than clipping a table horizontally without a usable fallback.

## State Rendering And Accessibility

- Distinguish initial loading, background refetch, empty success, error, and populated states.
- Use real table semantics for tabular data: `table`, `caption` or an accessible name, `thead`, `tbody`, headers, and cells.
- Associate sortable headers with their sort state and expose selection state through native or ARIA attributes.
- Provide a useful empty message and recovery action for errors. Do not render an empty table when the request failed.
- Keep focus order usable after pagination, filtering, dialogs, and bulk actions.

## Review Checklist

- Installed table version and existing wrapper contract are respected.
- Columns and row IDs are typed and stable; no random or index keys are used.
- Client-side and manual server-side behavior is chosen intentionally.
- Query keys include normalized table parameters and pagination resets correctly.
- Filters, sorting, selection, and bulk actions have explicit contracts.
- Initial loading, refetching, empty, error, and populated states are distinct.
- Table semantics, labels, sort/selection state, responsive actions, and focus behavior are accessible.

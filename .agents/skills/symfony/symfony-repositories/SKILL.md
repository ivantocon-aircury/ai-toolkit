---
name: symfony-repositories
description: Use when creating, editing, or reviewing Doctrine repositories, QueryBuilder or DQL queries, filters, ordering, pagination, counts, persistence helpers, or data lookups.
---

# Symfony Repositories

Follow repository instructions, Doctrine configuration, existing base classes,
return conventions, and nearby query methods. Repositories own persistence and
query details, not a globally mandated application architecture.

## Guidance

- Bind all dynamic values and allowlist dynamic fields, directions, and joins.
- Apply optional filters only when present, with explicit handling for zero,
  empty strings, null, and empty collections.
- Keep joins and selected fields deliberate; avoid duplicate rows, accidental
  inner-join filtering, and hidden N+1 behavior.
- Use deterministic ordering where pagination or stable output requires it.
- Match the project's page numbering, offset, count, and paginator conventions.
- Express useful return and collection element types accurately.
- Keep flush timing deliberate and consistent with transaction ownership.
- Return the project's established not-found shape rather than mixing nullable,
  exception, and sentinel behavior arbitrarily.

## Verification

- Test meaningful filter combinations, ordering, empty input, and pagination
  boundaries.
- Inspect generated SQL or query plans when joins, counts, or performance matter.
- Confirm user-controlled input cannot become raw DQL or SQL structure.

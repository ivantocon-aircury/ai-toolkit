---
name: symfony-entities
description: Use when creating, editing, or reviewing Doctrine entities, embeddables, ORM mappings, relationships, lifecycle state, identifiers, or domain invariants in Symfony projects.
---

# Symfony Entities

Repository conventions, Doctrine configuration, the database platform, and
neighboring model objects take precedence. UUIDs, timestamp traits, soft deletes,
accessor style, and where invariants live are project choices, not global rules.

## Guidance

- Keep PHP types, nullability, Doctrine mapping, defaults, and schema constraints
  consistent.
- Initialize collections and maintain both sides of bidirectional relationships
  where the project expects entity methods to do so.
- Use identifier generation, table/schema naming, inheritance, lifecycle hooks,
  and value generation already established by the project.
- Preserve valid state through constructors or domain methods when that matches
  the local model. Do not add generic setters merely for convenience.
- Avoid infrastructure calls, HTTP concerns, and third-party transport inside
  entities.
- Consider cascade, orphan removal, fetch mode, indexes, uniqueness, and deletion
  semantics explicitly; do not add cascades as a shortcut.
- Update migrations and fixtures/factories when persisted structure changes.

## Verification

- Run mapping/schema validation and relevant tests.
- Check relationship consistency, nullability, defaults, and serialization
  boundaries.
- Review the migration diff for unintended changes.

---
name: symfony-doctrine-migrations
description: Use when creating, editing, or reviewing Doctrine migrations, schema diffs, data backfills, constraints, indexes, or migration validation in Symfony projects.
---

# Symfony Doctrine Migrations

Follow repository instructions, the configured Doctrine versions, database
platform, and established migration tooling. Do not assume a command, container,
schema, naming strategy, or deployment process.

## Workflow

1. Inspect the mapping change and current schema or migration history.
2. Generate a diff with the project's documented tooling when available; write a
   migration manually only when generation cannot express the required operation.
3. Review every generated statement. Remove unrelated schema drift rather than
   accepting it blindly.
4. Add deterministic data cleanup or backfill before new non-null, unique, or
   foreign-key constraints require it.
5. Keep migrations self-contained. Do not call application services or depend on
   current entity behavior.
6. Make destructive operations, platform-specific SQL, locking risk, and
   irreversible `down()` behavior explicit.

## Verification

- Validate migration metadata and run the project's migration checks.
- Apply the migration in an appropriate disposable or test environment when
  feasible, and test rollback only when the project supports it safely.
- Recheck the schema diff afterward and inspect the final SQL for unintended
  changes, missing indexes, unsafe defaults, or ordering errors.

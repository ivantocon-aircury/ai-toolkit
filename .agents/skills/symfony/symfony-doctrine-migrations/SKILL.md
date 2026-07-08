---
name: symfony-doctrine-migrations
description: Use when creating, editing, or reviewing Symfony Doctrine migrations under migrations/, including make:migration, doctrine:migrations:diff, schema updates, data migrations, backfills, removals, manual SQL additions, containerized commands, and migration review. Prefer this skill whenever the task mentions migrations, Doctrine schema diffs, database changes, SQL backfills, or updating generated migration files after entity mapping changes.
---

# Symfony Doctrine Migrations

Use this skill for Symfony Doctrine migration work, especially after entity mapping changes or when a database change also needs data movement, cleanup, or backfill SQL.

## Related Skills

- Use `symfony-entities` when the database shape should change through Doctrine entity mapping attributes.
- Use `symfony-repositories` or `symfony-services` when migration work exposes missing application logic that should not live in a migration.
- Use `php-code-style` for PHP syntax, strict types, imports, and formatting in migration classes.

## Core Rule

- Let Doctrine manage table-shape changes. Generate the migration with the project's Doctrine command first, then preserve Doctrine's generated schema SQL unless it is clearly broken or incomplete because Doctrine could not infer the intended operation.
- Do not hand-edit table shape as the primary implementation path. Columns, indexes, foreign keys, table names, nullable flags, lengths, defaults, and relationships should come from Doctrine mapping changes and a regenerated migration.
- Add manual SQL only for work Doctrine cannot infer safely: data migrations, backfills, value normalization, deduplication, cleanup before constraints, post-schema updates, database-specific operations, or correcting an obvious diff-generation gap.

## Creation Workflow

1. Inspect the project command style before running anything. Look for `docker-compose.yml`, `compose.yaml`, `Makefile`, existing documentation, or previous commands in the conversation.
2. If the project uses Docker, run the migration command inside the PHP/application container. Prefer the existing project wrapper if one exists; otherwise use the local container convention, such as `docker compose exec php bin/console make:migration`.
3. If the project does not use Docker, run the Symfony console command directly, usually `bin/console make:migration`.
4. Review the generated migration before editing it. Compare it to the entity mapping changes and the user's requested data changes.
5. Add only the manual migration SQL needed around the generated schema SQL.
6. Run the project's formatting or validation commands when available, and at minimum check the migration for syntax errors if PHP tooling is present.

## Command Selection

- Prefer the project's existing command for generating migrations. Common examples are `make migration`, `composer console make:migration`, `docker compose exec php bin/console make:migration`, or `bin/console make:migration`.
- Use `doctrine:migrations:diff` only when that is the existing local convention or `make:migration` is unavailable.
- Do not create migration class files by hand unless the user explicitly asks for an empty/manual migration and the project convention supports it.
- Do not run migrations against a database unless the user explicitly asks. Generating and editing migration files is safe; applying them changes state.

## Editing Generated Migrations

- Keep the generated `addSql()` statements for schema changes in the order Doctrine produced unless a manual data step must happen between them.
- Place data cleanup before constraints that require clean data. For example, backfill null values before making a column non-null, remove duplicates before adding a unique index, and create referenced rows before adding a foreign key.
- Place data backfills after adding a new nullable column when existing rows need values, then rely on a later generated statement to make the column non-null if Doctrine produced that sequence.
- Keep manual SQL explicit and reversible when practical. `down()` may not be able to restore deleted or transformed data; when not reversible, make that clear with a short comment or throw `Doctrine\Migrations\Exception\IrreversibleMigration` only if the project uses that pattern.
- Avoid application services, repositories, entity managers, HTTP clients, or current-user context inside migrations. Migrations should use SQL and deterministic database state only.
- Use platform checks when adding vendor-specific SQL and the project supports multiple databases.

## Data Migration SQL

- Use set-based SQL instead of row-by-row PHP loops unless the transformation genuinely needs PHP logic.
- Make backfills idempotent where reasonable, especially for nullable columns or enum/status changes. Guard with `WHERE` clauses so repeated local testing does not corrupt data.
- Prefer simple SQL expressions over complex temporary PHP data structures.
- Be cautious with destructive operations. If removing data, encode the user's intent clearly and avoid broader deletes than requested.
- For large tables, consider batching only if the project has an established migration batching pattern; otherwise flag the risk to the user.

## Review Checklist

- Migration was generated by the project's Doctrine command before manual edits.
- Doctrine-generated schema SQL is preserved unless there is a concrete generation gap.
- Entity mappings, not hand-written migration SQL, define table shape.
- Manual SQL is limited to data migration, cleanup, backfill, removal, or Doctrine-inference gaps.
- Ordering protects constraints and data integrity.
- The migration does not use application services, repositories, or runtime user/request state.
- Applying the migration was not run unless explicitly requested by the user.

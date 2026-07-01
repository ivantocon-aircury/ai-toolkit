---
name: symfony-test-data-generators
description: Use when creating, editing, or reviewing Symfony test data generators under src/Service/TestDataGenerator, fixture helpers, entity factory utilities, deterministic sample data, and test-only setup services. Prefer this skill whenever the task mentions fixtures, test data, generators, factories, seeded entities, AbstractTestDataGenerator, or creating valid related Doctrine entities for tests.
---

# Symfony Test Data Generators

Use this skill for project-local test data generators under `src/Service/TestDataGenerator` and related fixture setup helpers.

## Related Skills

- Use `symfony-entities` for constructor requirements, fixture-only factories, and entity invariants.
- Use `symfony-repositories` when generated data must be persisted, flushed, or referenced consistently.

## Core Style

- Keep generators deterministic enough for repeatable tests while still producing realistic entity graphs.
- Put one generator per entity or aggregate when the project already follows `EntityNameTestDataGenerator` naming.
- Use a shared `AbstractTestDataGenerator` only for common persistence, faker, or dependency helpers already used by multiple generators.
- Prefer entity constructors and public setters over reflection.
- Use fixture-only entity factories only when normal constructors cannot represent legacy, encrypted, or imported state.
- Make relationship setup explicit so tests can see which school, user, group, trial, product, or access group owns the generated entity.

## Persistence

- Persist generated objects through the same persistence abstraction used by the surrounding test helpers.
- Flush deliberately. Allow callers to batch generation when the existing generator style supports it.
- Avoid hidden database resets inside individual generators; database lifecycle belongs in test setup utilities such as database managers or fixture loaders.
- Use references instead of full queries only when the generated object does not need current state from the referenced entity.

## Defaults And Overrides

- Provide sensible defaults for required constructor arguments.
- Allow callers to override important fields and relationships without having to duplicate the whole object setup.
- Avoid random values for fields that tests commonly assert against, such as email, code, name, status, role, or active flags.
- Keep generated enum-like values aligned with entity constants.
- Use valid relationship combinations by default, such as matching education phases between subjects and interventions or students belonging to the expected school/class.
- Prefer explicit override parameters for important relations over hidden global defaults; tests should be able to state the graph they depend on.

## External Systems

- Do not call real external services from test data generators.
- Do not write real files unless the test explicitly targets file storage and uses a test filesystem.
- Keep billing, email, CRM, captcha, and queue side effects out of generators unless mocked by the test environment.

## Review Checklist

- Generator creates valid entities that respect constructor requirements and relationship invariants.
- Defaults are realistic, stable, and easy to override.
- Persistence and flush behavior is explicit and consistent with nearby generators.
- No real external side effects are triggered.
- Fixture-only shortcuts are clearly limited to test/fixture needs.

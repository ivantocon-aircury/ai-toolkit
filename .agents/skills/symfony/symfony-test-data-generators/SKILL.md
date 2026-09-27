---
name: symfony-test-data-generators
description: Use when creating, editing, or reviewing Symfony test factories, fixture builders, data generators, deterministic samples, or helpers that construct valid related Doctrine objects.
---

# Symfony Test Data Generators

Inspect the project's existing fixtures, factories, builders, base classes, and
test database lifecycle first. Their locations and persistence conventions
override these defaults.

## Guidance

- Produce valid deterministic defaults and allow focused overrides for the state
  each test needs.
- Reuse existing generators for related objects instead of duplicating setup.
- Make persistence and flush behavior explicit so callers know whether returned
  objects are managed.
- Keep generated relationships consistent with entity invariants and authorization
  assumptions.
- Avoid real network, mail, billing, storage, or nondeterministic clock/randomness
  side effects.
- Prefer readable named overrides over long positional argument lists.
- Do not turn factories into a second business-logic implementation.

## Verification

- Use the generator in a representative test and confirm repeatability.
- Check override behavior, required relationships, uniqueness, and cleanup.
- Confirm it works with the project's isolation and reset strategy.

---
name: symfony-services
description: Use when creating, editing, or reviewing Symfony services that coordinate business workflows, persistence, transactions, files, current-user context, or multiple collaborators.
---

# Symfony Services

Repository architecture, dependency-injection configuration, transaction policy,
and neighboring services take precedence. Do not move logic into a service merely
to satisfy a generic layering rule.

## Guidance

- Give the service one clear application responsibility and inject explicit
  collaborators using the project's configuration style.
- Keep HTTP response construction and framework request objects at the boundary
  unless the project intentionally models them here.
- Make entity lookup, authorization ownership, persistence, flush timing, and
  transaction boundaries explicit.
- Use a transaction for a multi-step invariant when partial completion would be
  invalid; avoid broad transactions around remote calls unless designed for it.
- Treat files, external calls, mail, and billing as failure-prone side effects.
  Define ordering, retries, idempotency, and cleanup where relevant.
- Preserve domain invariants and avoid duplicating query or transport details that
  belong to established repositories or clients.
- Return the project's established entities, DTOs, results, or void contracts.

## Verification

- Test the successful workflow and meaningful partial-failure paths.
- Confirm persistence and side effects occur exactly once at intended boundaries.
- Check that errors retain useful context without exposing secrets.

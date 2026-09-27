---
name: symfony-phpunit-functional-tests
description: Use when creating, editing, or reviewing Symfony PHPUnit functional, controller, API, authorization, upload, download, mailer, or persistence-side-effect tests.
---

# Symfony PHPUnit Functional Tests

Repository instructions, PHPUnit and Symfony versions, existing base test cases,
authentication helpers, fixtures/factories, and database-reset strategy take
precedence. Do not assume Alice, JWT, Docker, Make, service names, or directories.

## Workflow

1. Inspect neighboring tests and the implementation boundary before choosing the
   client, boot strategy, data setup, and assertion style.
2. Reuse deterministic local fixtures, factories, authentication helpers, and
   response assertions.
3. Cover the successful behavior and meaningful validation, unauthenticated,
   unauthorized, not-found, conflict, and malformed-input cases for the change.
4. Assert observable HTTP behavior and important repository or side effects, not
   private method calls or framework internals.
5. Keep upload fixtures isolated from mutation and assert download headers and
   content safely.
6. Mock or fake external boundaries using the project's test mechanism.

## Quality

- Keep authorization matrices compact and readable.
- Assert structured JSON semantically rather than relying on property order.
- Avoid fixed persisted identifiers unless the fixture contract guarantees them.
- Make time, randomness, queues, mail, and background work deterministic.
- Run the narrowest relevant test first, then the project's broader suite through
  the discovered execution environment.

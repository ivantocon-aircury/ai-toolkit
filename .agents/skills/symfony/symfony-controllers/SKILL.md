---
name: symfony-controllers
description: Use when creating, editing, or reviewing Symfony controllers, routes, request mapping, authorization at the HTTP boundary, responses, uploads, or downloads.
---

# Symfony Controllers

Repository instructions, the installed Symfony version, routing configuration,
and neighboring controllers take precedence. Do not impose single-action
controllers, DTO mapping, response wrappers, or naming conventions unless the
project demonstrates them.

## Guidance

- Keep controllers focused on HTTP concerns: input, authentication context,
  authorization, orchestration handoff, and response construction.
- Use the project's established request validation and mapping mechanism. Treat
  path, query, body, multipart, and uploaded-file input deliberately.
- Apply authorization at the established boundary with the subject contract used
  by the project's voters or policy layer.
- Delegate substantial queries and workflows to existing repositories, handlers,
  or services rather than embedding them in controllers.
- Return the project's established response shape and status codes. Do not expose
  persistence entities, secrets, stack traces, or raw third-party payloads unless
  that is an explicit safe contract.
- Preserve not-found, validation, authorization, conflict, empty-list, file, and
  error semantics demonstrated by adjacent endpoints.
- For downloads, validate access before reading data and set safe content headers.

## Verification

- Exercise successful and important failure responses through the existing test
  style.
- Confirm route, method, status, serialization, and authorization behavior.
- Check that business logic and persistence details did not leak into the HTTP
  boundary without a project-specific reason.

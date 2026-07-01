---
name: symfony-services
description: Use when creating, editing, or reviewing Symfony services under src/Service, including managers, workflow orchestration, entity creation/update/delete, file handling, imports, reporting, mail/billing/CRM/captcha calls, transactions, current-user context, and application-layer business logic. Prefer this skill whenever the task moves logic out of controllers, mutates entities, coordinates repositories, handles files, or implements a multi-step business process.
---

# Symfony Services

Use this skill for application services under `src/Service`, including managers, external clients, reporting services, file services, mailers, billing integrations, and workflow coordinators.

## Related Skills

- Use `symfony-entities` for entity state and relationship rules mutated by services.
- Use `symfony-repositories` for reads, filters, persistence helpers, and query-specific methods used by services.
- Use `symfony-external-integrations` for third-party API clients, external DTO normalization, provider mappings, and import-specific error handling.

## Core Style

- Keep controllers thin by putting mutations, workflows, imports, reporting, file handling, and integration calls in services.
- Inject specific repositories/services/clients/filesystems needed by the workflow, not broad dependencies for convenience.
- Use DTO arguments for request-shaped inputs and entity arguments for already-loaded domain objects.
- Return entities, value arrays, response DTO source data, files as strings, or domain results as appropriate; do not return Symfony HTTP responses from application services.
- Keep method names intention-revealing: `create`, `update`, `register`, `joinTrial`, `updateResourceFilesPack`, `generateUniqueLoginCodes`.

## Mutations And Persistence

- Create entities with constructors for required state, then use setters for optional/update state following the local entity style.
- Use repository `save()` when a single entity update should persist and flush immediately.
- Use `EntityManagerInterface` directly for multi-entity workflows, explicit transactions, references, and batch persistence when that is the local project style.
- Make flush timing deliberate. Avoid hidden flushes in helpers when the caller needs batching.
- Use `getReference()` for related entities by ID when the service does not need to inspect the related entity.
- Use `find()` when the service must validate current state before continuing.
- Throw domain-specific exceptions when they exist; otherwise use explicit SPL exceptions only for truly invalid internal state.

```php
$trial = new Trial(
    $intervention,
    $dto->name,
    $this->entityManager->getReference(Funder::class, $dto->funder),
    $subject,
    $yearGroups,
    $this->entityManager->getReference(TrialDesign::class, $dto->trialDesign),
    $dto->active,
);

$this->trialRepository->save($trial);
```

## Workflows And Transactions

- Keep multi-entity workflows in one service method unless meaningful reusable sub-steps emerge.
- Use private helper methods for repeated or conceptually isolated workflow steps, such as deleting a current file before storing a replacement.
- For complex consolidation workflows, keep the public method small and split private steps by domain concept, such as resolving the survivor, applying selected data, consolidating reviews, consolidating scores, and moving related records.
- Use explicit transactions for workflows that must succeed or fail as a unit, especially registration, billing, and large cross-entity changes.
- When using manual transactions, wrap the whole mutation in `try/catch`, roll back on `Throwable`, and rethrow. Prefer `EntityManagerInterface::wrapInTransaction()` if the local codebase already uses it and no manual intermediate flushes are needed.
- Be careful with external side effects inside database transactions. Prefer persisting local state first, then perform external calls if the existing workflow supports it.
- Log integration failures where the project already injects a logger for long workflows.

## Files And External Systems

- Inject `FilesystemOperator` instances by purpose-specific service name for file storage.
- Generate stored file names centrally through the project's file trait/helper when available.
- Delete replaced files before or alongside entity state changes according to local consistency expectations.
- Keep raw file response construction in controllers; services should return bytes/strings or update stored file entities.
- Keep HTTP/API clients in dedicated external client services when the integration has transport details.
- Wrap vendor-specific payment, CRM, email, analytics, or captcha calls behind project services such as `StripeService`, `FreeAgentService`, `CustomerIoService`, `MailerService`, or `CaptchaService`.
- Normalize external results into project DTOs before creating or updating local entities.

## Current User Context

- Prefer passing the logged-in user from the controller to services when adding new workflows.
- If the project already uses token storage inside a service, keep the type assertion explicit and avoid spreading that pattern unnecessarily.
- Never make authorization decisions in services that should be voters. Services may assume the controller/voter has authorized the action and may still enforce domain invariants.

## Validation And Exceptions

- Let controller argument mapping or validator services validate request DTO structure before service calls.
- Services should validate domain consistency that requires database/entity state, such as matching education phases, available products, school ownership invariants, or group membership.
- Throw specific project exceptions for user-correctable domain errors when they exist.
- Let controllers translate known domain exceptions to HTTP exceptions at the boundary when needed.

## Review Checklist

- Service owns business workflow and persistence timing, while controllers only delegate.
- Dependencies are specific and constructor-injected.
- Entity creation and mutation follow entity invariants and relationship consistency rules.
- Repository methods handle reads/filters; services do not duplicate complex query builders unless there is no repository abstraction yet.
- File, email, billing, CRM, captcha, and other external systems are behind purpose-specific services/clients.
- Import and merge workflows preserve related records deliberately and use transactions when moving data between entities.
- Authorization policy is not hidden in services when it belongs in voters.

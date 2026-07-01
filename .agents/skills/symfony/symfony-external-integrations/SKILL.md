---
name: symfony-external-integrations
description: Use when creating, editing, or reviewing Symfony external integrations and API clients, including third-party HTTP clients, import services, external DTO normalization, provider aggregators, missing-item mapping entities, billing/email/CRM clients, captcha clients, remote book/data lookup services, and credentials/configuration. Prefer this skill whenever the task mentions Stripe, Salesforce, Customer.io, FreeAgent, Sendy, Typeform, captcha, mail providers, OpenLibrary, ISBN APIs, external mappings, imports, or any third-party service boundary.
---

# Symfony External Integrations

Use this skill for services that call third-party systems or normalize external data into local entities. This includes book lookup APIs, Stripe, Salesforce, Customer.io, FreeAgent, Sendy, Typeform, captcha providers, mail transports, and similar clients.

## Related Skills

- Use `symfony-services` for the application workflow that calls the integration and persists local changes.
- Use `symfony-repositories` for local mapping tables, missing-item tracking, and lookup queries.
- Use `symfony-entities` for mapping entities and imported local domain entities.

## Client Boundaries

- Keep transport details in dedicated client or external API classes.
- Expose intention-level methods such as `findBookByIsbn()`, `createCustomer()`, `sendEmail()`, or `verifyCaptcha()`.
- Return project DTOs or domain values from clients; do not leak raw HTTP responses unless the caller truly needs transport details.
- Keep provider identifiers as constants when the integration can have multiple providers.
- Use interfaces when multiple providers implement the same capability.

```php
interface ExternalBookApiInterface
{
    public function findBookByIsbn(string $isbn): ?ExternalBookDto;

    public function getIdentifier(): string;
}
```

## HTTP And Credentials

- Inject API keys, base URLs, and credentials through configuration/container parameters; do not hard-code secrets.
- Use a clear user agent where public APIs expect one.
- Catch transport, decoding, and provider-shape exceptions at the client boundary when a missing result is acceptable.
- Return `null` for not-found or unusable external results only when the caller can continue without that provider.
- Do not swallow exceptions that should fail a user-visible workflow or alert operations.

## Provider Aggregators

- Use an aggregator service when multiple providers can satisfy the same lookup.
- Iterate providers in a deliberate order and stop once a useful result is found unless the existing workflow intentionally lets later providers override earlier ones; document the reason if overriding is intentional.
- Keep retry constants near the aggregator or client that owns retry behavior.
- Avoid making retries implicit if they can duplicate mutations in the external system.

## External Data Mapping

- Normalize external data into DTOs before creating or updating entities.
- Keep mapping from external categories, languages, edition types, statuses, or provider IDs in explicit mapping entities/repositories when manual review is needed.
- Track missing mappings when imported values cannot be mapped automatically.
- Allow ignored mappings to skip values without failing the whole import when that is the product behavior.
- Persist missing mapping items deliberately and make flush timing configurable for batch imports.

```php
$externalApiMapping = $this->externalApiMappingRepository->findOneOrCreate(
    type: ExternalApiMapping::TYPE_CATEGORY,
    original: $category,
    itemId: $book->getId(),
    flush: false,
);
```

## Local Entity Creation

- Use application services to convert external DTOs into local entities.
- Use `getReference()` for mapped local IDs when no local state inspection is needed.
- Validate and normalize dates, ISBNs, currencies, emails, and provider-specific codes before storing them.
- Keep external provider quirks isolated to the client or mapping layer, not spread across controllers and entities.
- Do not call real external services from test data generators.

## Review Checklist

- Third-party transport code is isolated behind a purpose-specific client/service.
- Credentials are injected and never committed.
- External data is decoded, normalized into DTOs, and mapped before entity mutation.
- Missing/ignored mappings are handled deliberately.
- Error handling distinguishes acceptable missing data from workflow failures.
- Controllers and entities do not contain direct third-party HTTP calls.

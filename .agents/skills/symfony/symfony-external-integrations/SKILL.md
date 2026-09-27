---
name: symfony-external-integrations
description: Use when creating, editing, or reviewing Symfony clients and services that cross a third-party HTTP, messaging, billing, email, CRM, captcha, import, or remote-data boundary.
---

# Symfony External Integrations

Repository architecture, vendor SDK versions, existing client abstractions, and
operational requirements take precedence. Load current vendor documentation when
behavior depends on an external API.

## Guidance

- Keep credentials in configuration or secret stores and inject them; never log
  or commit credentials and tokens.
- Isolate transport and vendor-specific payloads behind the project's established
  client boundary.
- Normalize remote data into explicit local contracts before mutating domain or
  persistence objects.
- Distinguish not-found or rejected business results from authentication,
  throttling, timeout, malformed-response, and provider failures.
- Define timeout, retry, idempotency, pagination, rate-limit, and partial-result
  behavior where relevant. Retry only safe operations.
- Validate untrusted remote data and preserve diagnostic context without exposing
  secrets or full sensitive payloads.
- Keep mapping creation, ignored values, persistence timing, and reconciliation
  behavior explicit when external identifiers map to local records.

## Verification

- Test at the client boundary with deterministic fakes or mocked transport; do not
  call real providers in the normal test suite.
- Cover malformed, empty, partial, unauthorized, throttled, and timeout responses
  relevant to the integration.
- Confirm logs and exceptions redact credentials and sensitive data.

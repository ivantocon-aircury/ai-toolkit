---
name: symfony-voters
description: Use when creating, editing, or reviewing Symfony voters, authorization attributes, subjects, ownership rules, roles, memberships, or access-policy queries.
---

# Symfony Voters

Follow the project's authorization model and subject contracts. Entities, classes,
DTOs, commands, strings, and aggregate subjects can all be valid when established
locally; this skill does not impose one subject shape.

## Guidance

- Keep supported attributes explicit and `supports()` narrow enough to avoid
  intercepting unrelated decisions.
- Handle anonymous or unsupported users safely and deny by default when required
  facts are absent.
- Keep attribute ownership and naming consistent with neighboring voters and
  controller calls.
- Separate broad role grants, ownership, membership, and resource-state checks so
  the policy remains understandable.
- Use repositories for factual persistence queries, but avoid mutating state or
  producing unrelated side effects during authorization.
- Be deliberate about super-admin bypasses, impersonation, deleted resources,
  tenant boundaries, and create/list actions without persisted subjects.
- Preserve access logging only when the project intentionally requires it and
  ensure repeated decisions do not create duplicate effects.

## Verification

- Test allowed and denied cases, anonymous users, unsupported attributes or
  subjects, ownership boundaries, and privileged roles.
- Confirm callers pass the subject form the voter expects.
- Review for information leaks and cross-tenant access.

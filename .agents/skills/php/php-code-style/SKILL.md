---
name: php-code-style
description: Use when creating, editing, or reviewing PHP syntax, types, PHPDoc, namespaces, constructors, constants, enums, or language-level behavior. Adapts to the project's PHP version, formatter, static analyzer, and demonstrated style.
---

# PHP Code Style

Repository instructions, the configured PHP version and formatter, static-analysis
rules, and nearby code take precedence. This skill supplies language-level
defaults; framework skills own framework architecture.

## Defaults

- Use strict types when the project does, and preserve the local declaration
  layout.
- Prefer accurate native parameter, property, return, and constant types supported
  by the installed PHP version.
- Use PHPDoc only for useful contracts PHP cannot express, such as generic
  collection element types or shaped arrays. Keep it synchronized with behavior.
- Keep nullability aligned with runtime behavior and persisted constraints.
- Follow local visibility, constructor promotion, readonly, enum, import ordering,
  and method-layout conventions rather than imposing a separate formatter style.
- Use attributes only when supported and established by the project or library.
- Prefer explicit failure for malformed data, such as `JSON_THROW_ON_ERROR` when
  directly decoding untrusted JSON.
- Use `match`, enums, and readonly features when they improve clarity and fit the
  supported version; do not modernize unrelated code opportunistically.
- Avoid comments that merely restate code. Explain only non-obvious invariants,
  compatibility constraints, assertions, or workarounds.

## Verification

- Run the project formatter and static analyzer when available.
- Confirm types and PHPDoc describe actual values and collection elements.
- Confirm syntax is supported by the project's PHP version.
- Review the diff for unrelated formatting churn.

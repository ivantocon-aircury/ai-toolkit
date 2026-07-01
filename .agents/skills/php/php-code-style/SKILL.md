---
name: php-code-style
description: Use when creating, editing, or reviewing PHP files, especially modern PHP code style, strict types, typed properties/constants, constructor property promotion, readonly classes/properties, PHPDoc generics, match expressions, JSON decoding, and namespace/use organization. Prefer this skill whenever the task touches PHP syntax or language-level conventions, even when another framework-specific skill such as Symfony is also relevant.
---

# PHP Code Style

Use this skill for language-level PHP choices that apply across frameworks. Pair it with framework-specific skills when the task also touches Symfony, Doctrine, Laravel, or another PHP ecosystem.

## File Structure

- Use `<?php declare(strict_types=1);` on the first line for new or touched files unless the local file deliberately lacks it.
- Keep namespace and `use` imports consistent with nearby files.
- Prefer attributes for metadata when the library and project already use PHP attributes instead of annotations or configuration.
- Avoid comments unless they clarify a non-obvious type assertion, invariant, workaround, or exceptional behavior.

## Types And Visibility

- Prefer typed properties, parameters, and return values when the type is known.
- Keep object state `private` by default and expose explicit methods when callers need access or mutation.
- Align nullable types with real runtime possibilities and persisted schema constraints.
- Use docblock type assertions sparingly when framework APIs return broad types, such as `mixed` or an interface that the project narrows by convention.

## Constructors And Dependencies

- Use constructor property promotion for injected dependencies when it improves clarity and matches local style.
- Prefer `private readonly` promoted dependencies for immutable service collaborators.
- Prefer `readonly class` for new dependency-only services when all properties can be readonly and the project uses modern PHP.
- Do not use readonly for values that are intentionally reassigned during the object lifecycle.

## Constants And Enum-Like Values

- Use typed class constants for status, role, type, payment, and other enum-like string values when the project uses PHP typed constants.
- Group allowed values in array constants when validation or membership checks need the full set.
- Consider native enums only when the surrounding codebase already uses them or the change can update all callers cleanly.

```php
public const string STATUS_ACTIVE = 'active';
public const string STATUS_INACTIVE = 'inactive';

public const array STATUSES = [
    self::STATUS_ACTIVE,
    self::STATUS_INACTIVE,
];
```

## Collections And Static Analysis

- Add PHPDoc generics or element-type comments for collections and iterables when useful to static analysis and readers.
- Keep docblocks accurate; stale generic comments are worse than no generic comment.

```php
/** @var Collection<int, Student> */
private Collection $students;
```

## Control Flow And Data Handling

- Use `match` for finite value dispatch when it is clearer than chained conditionals and every branch can return a value.
- Include an explicit fallback branch when the input set is not exhaustive or may grow.
- Decode JSON with `JSON_THROW_ON_ERROR` when using raw PHP JSON decoding so invalid payloads fail explicitly.

```php
$type = match ($subject::class) {
    CreateStudentDto::class => self::TYPE_CREATE,
    UpdateStudentDto::class => self::TYPE_UPDATE,
    default => self::TYPE_UNKNOWN,
};
```

## Review Checklist

- New or touched PHP files use strict types unless local style says otherwise.
- Types, nullability, visibility, constants, and docblocks match actual behavior.
- Constructor promotion and readonly are used where they make dependencies clearer without constraining mutable state.
- Enum-like values are represented consistently with the local project.
- JSON decoding and finite dispatch fail explicitly instead of silently accepting invalid states.

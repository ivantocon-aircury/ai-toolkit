---
name: php-method-formatting
description: Use whenever creating, editing, or reviewing PHP methods, including getters, setters, constructors, service methods, and method signatures. Apply it to method layout, parameter wrapping, native types, return types, and PHPDoc when PHP cannot express a useful type. Prefer this skill for any PHP method work even if the request only asks to add a getter or make a small method change.
---

# PHP Method Formatting

Use this skill for PHP method declarations and their bodies.
Keep method code easy to scan in diffs and reviews while preserving the repository's existing formatter and conventions.

## Layout

- Write every method declaration across multiple lines. Do not use one-line methods, including trivial getters, setters, constructors, or methods with an empty body.
- Keep the opening brace on the declaration's closing line when that matches the local PHP style.
- Place the body on its own indented lines and the closing brace on its own line.
- When a method has more than three parameters, put one parameter on each line with a trailing comma. Preserve a stricter local formatter rule when one exists.
- For three or fewer parameters, retain a readable single-line parameter list unless local style requires wrapping.

```php
public function getName(): string
{
    return $this->name;
}

public function schedule(
    User $user,
    DateTimeImmutable $startsAt,
    DateTimeImmutable $endsAt,
    bool $sendReminder,
): Appointment {
    // ...
}
```

## Types

- Add native parameter and return types whenever the method contract is known and PHP can express it accurately.
- Match nullability to real behavior. Use `?Type` only when `null` is a valid input or result.
- Use precise scalar, class, interface, union, intersection, iterable, and `void`/`never` types where supported by the project's PHP version.
- Do not invent a type merely to satisfy this rule. When the actual value is uncertain or intentionally broad, keep the native declaration honest.
- Add concise PHPDoc when it supplies information native types cannot represent usefully, such as collection element types, array shapes, callable signatures, templates, or framework-provided `mixed` values.
- Do not duplicate a fully expressed native signature with redundant PHPDoc.

```php
/** @return list<Order> */
public function getPendingOrders(): array
{
    return $this->pendingOrders;
}
```

## Method-Specific Checks

- Give getters the property's accurate return type and return the stored value directly unless the domain requires transformation.
- Give setters and mutators typed inputs. Return `void`, `static`, or the enclosing class according to established fluent-method conventions.
- Give constructors typed dependencies and values where known; use promoted properties only if this fits the surrounding code.
- Preserve visibility, inheritance contracts, attributes, and framework-required signatures. Compatibility takes priority over a stylistic change.

## Before Finishing

- Inspect nearby methods and the active formatter configuration so this skill extends, rather than competes with, project conventions.
- Confirm every touched method is multiline.
- Confirm methods with more than three parameters use one parameter per line.
- Confirm native and PHPDoc types are accurate, useful, and not redundant.

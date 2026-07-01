---
name: symfony-voters
description: Use when creating, editing, or reviewing Symfony security voters under src/Security/Voter, including entity-subject voters, entity-class create/list checks, voter-owned action constants, role checks, ownership rules, access-group membership, before/after update authorization, access logging, and controller denyAccessUnlessGranted calls. Prefer this skill whenever the task mentions voters, authorization policy, roles, permissions, ownership, access groups, or deciding whether a user can create/update/list/delete something.
---

# Symfony Voters

Use this skill for voters under `src/Security/Voter` and authorization calls that target those voters.

## Related Skills

- Use `symfony-controllers` when adding `denyAccessUnlessGranted()` calls or route-level security attributes.
- Use `symfony-repositories` for data facts needed by voters, such as membership, ownership, or access-group queries.
- Use `symfony-entities` for the entity relationships and role/profile methods that voters inspect.

## Voter Shape

- Declare public action constants on the voter, such as `CREATE`, `UPDATE`, `LIST`, `DELETE`, or project-specific verbs. This keeps the controller and voter coupled to one explicit policy vocabulary.
- In `supports()`, check both the supported action and the supported subject type.
- Use the entity instance as the subject for existing-resource actions such as view, update, delete, move, archive, or download.
- Use `Entity::class` as the subject for create/list actions and other checks that do not have a specific entity instance yet.
- Do not use request DTOs, query DTOs, marker DTO interfaces, or arbitrary payload objects as voter subjects. DTOs describe input; voters should authorize against persisted domain objects or the entity type being acted on.
- Keep action names readable at the controller call site.
- Keep the subject stable: authorize against the existing entity before applying submitted changes, then separately check any submitted target ownership inside the voter or service domain invariants.

```php
$this->denyAccessUnlessGranted(StudentVoter::UPDATE, $student);
$this->denyAccessUnlessGranted(SchoolVoter::CREATE, School::class);
```

```php
protected function supports(string $attribute, mixed $subject): bool
{
    return in_array($attribute, [self::CREATE, self::UPDATE, self::LIST, self::DELETE], true)
        && ($subject instanceof Student || Student::class === $subject);
}
```

## User And Role Handling

- Always verify the token user is the expected `User` object before authorizing when anonymous access is possible.
- Use project role helpers such as `$user->hasRole(User::ROLE_ADMIN)` or role constants already present on the entity.
- Return `false` by default for unsupported users, unsupported roles, and missing relationships.
- Keep super-admin/admin allow rules explicit and early when the project policy has them.
- Avoid throwing from voters unless the project already uses voter exceptions for precise API errors; prefer `false` for normal denial.

## Ownership And Membership Rules

- Express policy in small private methods such as `canCreateStudent`, `canDeleteSecret`, `canMoveStudentsToClass`, or `canImpersonate`.
- Compare stable IDs when checking submitted IDs against owned entities.
- Compare object identity only when both sides are managed entity instances from the same request context.
- Use repositories for database-backed membership facts, such as whether all students belong to a school or a user can access a secret.
- Keep repository methods factual and keep the allow/deny decision in the voter.
- Be explicit about before-and-after checks on updates: verify both the existing entity ownership and the submitted target ownership when the change can move an entity across boundaries.

## Side Effects

- Voters should normally be side-effect free.
- Keep access logging in a voter only when the existing project already treats authorization as the audit boundary, such as logging successful and failed secret views.
- If adding new audit behavior, consider whether it belongs in a service after authorization instead of in the voter.

## Review Checklist

- `supports()` is narrow, checks a voter-owned action constant, and accepts only an entity instance or the entity `::class` string.
- `voteOnAttribute()` handles anonymous/non-`User` tokens safely.
- Every authorization path returns `false` by default unless explicitly allowed.
- Role, ownership, membership, access-group, and before/after update rules are clear and tested where practical.
- Repository calls provide data facts only; policy remains in the voter.
- Controllers call voters with readable voter action constants and entity/entity-class subjects.

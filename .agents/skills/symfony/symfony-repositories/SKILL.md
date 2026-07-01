---
name: symfony-repositories
description: Use when creating, editing, or reviewing Symfony Doctrine repositories under src/Repository, including query builders, read/filter methods, paginated lists, DTO-driven searches, count methods, persistence helpers, getReference usage, authorization support queries, and external mapping repositories. Prefer this skill whenever the task mentions repositories, DQL, QueryBuilder, Paginator, findBy filters, save/remove helpers, or database lookup methods.
---

# Symfony Repositories

Use this skill for classes under `src/Repository` and repository-like Doctrine query code.

## Related Skills

- Use `symfony-entities` for Doctrine mappings, relationships, and entity invariants queried by repositories.
- Use `symfony-services` for workflows that call repositories, mutate entities, or coordinate transactions.
- Use `symfony-voters` when repository methods support authorization checks, such as membership or ownership verification.

## Core Style

- Keep repositories focused on database access, filtering, persistence helpers, and aggregate lookup rules.
- Put business workflows and multi-step mutations in services, not repositories.
- Extend the project-local `AbstractRepository` when one exists for the entity's project and it provides the needed helpers.
- Otherwise extend `ServiceEntityRepository` directly and keep the constructor minimal.
- Add `@extends ServiceEntityRepository<Entity>` or generated `@method` annotations when the local repository style uses them.
- Use intention-revealing method names: `findTrials`, `findAllBySchool`, `findOneAvailableById`, `areStudentsFromSchool`, `countBySchool`.

## Query Builders

- Use `createQueryBuilder()` with stable, readable aliases.
- Add joins only when needed for filtering, ordering, or avoiding obvious N+1 reads.
- Use `addSelect()` with joins when returned objects need related data immediately.
- Always bind values with parameters rather than interpolating input into DQL.
- Use `LOWER(...)` comparisons for case-insensitive search when that is the existing local convention.
- Split search strings into tokens only when the existing endpoint semantics require every token to match.
- Use `ArrayParameterType::STRING` or another explicit DBAL array parameter type for array parameters when required by the DBAL version and project style.

```php
$qb = $this->createQueryBuilder('student')
    ->leftJoin('student.class', 'class')
    ->andWhere('class.school = :school')
    ->setParameter('school', $school)
;
```

## DTO-Driven Filters

- Accept query/filter DTOs for list endpoints when the controller maps query parameters into a DTO.
- Keep the DTO as input-only filter state; do not mutate it in the repository.
- Apply each optional filter only when the DTO value is present.
- Keep order fields explicit with `match` or `switch`; do not pass unchecked user-provided field names directly to `orderBy()`.
- Apply deterministic fallback ordering after user-selected ordering.
- Avoid duplicate fallback ordering unless the existing query deliberately needs it; repeated `addOrderBy()` on the same field can hide sorting bugs.
- Use `Paginator` for paginated lists and set both first result and max results.
- Follow the local page indexing convention before changing offsets; some projects use `($page - 1) * $itemsPerPage`, others use `$page * $itemsPerPage`.

```php
if (null !== $dto->searchName) {
    $qb
        ->andWhere('LOWER(student.name) LIKE LOWER(:searchName)')
        ->setParameter('searchName', sprintf('%%%s%%', $dto->searchName))
    ;
}

$qb
    ->setFirstResult(($dto->page - 1) * $dto->itemsPerPage)
    ->setMaxResults($dto->itemsPerPage)
;
```

## Persistence Helpers

- Use project-local helpers such as `persist()`, `flush()`, `save()`, `remove()`, `transaction()`, or `getReference()` when they exist.
- Keep helper signatures consistent with the existing `AbstractRepository` in that project.
- Use `save()` only when the change should flush immediately.
- Use `persist()` plus a later `flush()` for batches or workflows that need one transaction.
- In projects whose `save()` returns `void`, do not chain or rely on a returned entity.
- Preserve local helper names such as `delete()` instead of introducing `remove()` when the project already uses `delete()`.
- Avoid adding broad helpers to `AbstractRepository` unless multiple repositories need them.
- Prefer `EntityManagerInterface::getReference()` or repository `getReference()` when a service only needs a relation by ID and does not need to query its state.

## Authorization Support Queries

- Repositories may answer data-membership questions needed by voters, such as whether all selected students belong to a school.
- Return booleans or scalar counts for authorization support methods when the caller does not need entities.
- Keep authorization policy in voters; keep only the data lookup in repositories.
- Do not read the current user from token storage inside repositories.

## Mapping And Import Repositories

- Repositories may create local mapping records when the lookup itself owns the mapping lifecycle, such as `findOneOrCreate()` for external API mappings.
- Keep these methods explicit about whether they flush.
- Track missing external items close to the mapping creation when product workflows need later manual resolution.
- Keep provider mapping order and weighting in repository queries when the admin/settings UI depends on it.

## Review Checklist

- Repository contains query/persistence code only, not workflow orchestration or HTTP/security boundary logic.
- Method names communicate the query intent and return type.
- Query parameters are bound, optional filters are guarded, and order fields are whitelisted.
- Pagination follows the existing project offset convention.
- Persistence helpers are used consistently and flush timing is deliberate.
- Mapping repositories make missing/ignored external data states explicit.
- Authorization support methods return data facts and leave policy decisions to voters.
- Count methods cast scalar results to `int` before returning.

---
name: symfony-entities
description: Use when creating, editing, or reviewing Symfony Doctrine entities and domain model objects under src/Entity, including ORM attributes, relationships, UUID IDs, timestamps, soft deletes, constructors, getters/setters, entity invariants, counters, lifecycle fields, and model objects. Prefer this skill whenever the task touches Doctrine mapping, entity relationships, collection add/remove methods, generated IDs, or persisted domain state.
---

# Symfony Entities

Use this skill for Doctrine entities under `src/Entity` and closely related model objects, including value-like models under namespaces such as `App\Entity\Model`.

## Related Skills

- Use `symfony-repositories` when adding query methods, persistence helpers, pagination, or Doctrine query builders for these entities.
- Use `symfony-services` when entity changes require business workflows, file handling, external integrations, or multi-entity mutations.

## Core Style

- Prefer PHP attributes for Doctrine mapping.
- Keep entities focused on state, relationships, lightweight invariants, and relationship consistency.
- Do not put controller concerns, request DTOs, serialization response shapes, repository queries, or external API calls in entities.
- Use constructor arguments for required state and initialize collection properties in the constructor.
- Generate string UUID identifiers with `Uuid::v4()` when the project uses UUID string IDs.
- Maintain derived identifier fields such as SHA or short-code columns inside the ID setter when the existing entity uses that pattern.
- Use `Gedmo\Timestampable\Traits\TimestampableEntity` or Gedmo timestamp attributes according to the existing entity style in the project.
- Preserve existing table schemas such as `mesme`, `vault`, or `what_worked_education` when adding mapped tables.

## Properties And Constants

- Keep properties private and expose them through explicit getters and setters.
- Let setters return `self` when the surrounding entity follows fluent setters.
- Keep nullable Doctrine columns aligned with nullable PHP properties.
- Initialize boolean defaults in the property declaration when the database has a default option.
- Validate simple enum-like assignments in setters when the entity already enforces those invariants.

```php
public const string STATUS_ACTIVE = 'active';
public const string STATUS_INACTIVE = 'inactive';

#[ORM\Column(type: 'boolean', options: ['default' => true])]
private bool $active = true;
```

```php
public function setPaymentType(string $paymentType): self
{
    if (!in_array($paymentType, self::PAYMENT_TYPES, true)) {
        throw new \InvalidArgumentException('Invalid payment type');
    }

    $this->paymentType = $paymentType;

    return $this;
}
```

## Relationships

- Use `Collection` for to-many relationships and initialize them with `ArrayCollection`.
- Prefer explicit `add*` and `remove*` methods for to-many relationships.
- Maintain inverse-side consistency in relationship setters and adders when the existing entity model does this.
- Include an optional boolean such as `$inversed = true` or `$setInversed = true` only when needed to prevent recursive relationship updates.
- Use `fetch: 'EXTRA_LAZY'` or `fetch: 'LAZY'` only when the surrounding project/entity already uses it for potentially large relations.
- Keep query-only relationships clearly marked if they should not be used for ORM state changes.

```php
public function setFunder(Funder $funder, bool $inversed = true): self
{
    $this->funder = $funder;

    if ($inversed) {
        $funder->addTrial($this, false);
    }

    return $this;
}
```

## Domain Logic

- Keep small derived values on the entity when they depend only on entity state, such as formatted codes, full names, or active membership accessors.
- Keep cached counters and review/status timestamps on the entity when they are maintained by entity methods and queried frequently.
- Track entity-local changed fields in the entity only when existing workflows use that state, such as review or moderation workflows.
- Put multi-step workflows, persistence, file storage, encryption, mail, billing, and cross-aggregate decisions in services.
- Do not call repositories, entity managers, token storage, filesystems, HTTP clients, or mailers from entities.
- Avoid silently changing immutable or generated values after creation unless the existing entity has an explicit fixture/import escape hatch.

```php
public function setId(string $id): self
{
    $this->id = $id;
    $this->idSha = sha1($this->id);
    $this->idShaShort = substr($this->idSha, 0, self::ID_SHA_SHORT_LENGTH);

    return $this;
}
```

## Serialization Exceptions

- Prefer response DTOs over entity serialization for new API responses.
- If an existing entity implements `NormalizableInterface` for search, indexing, or legacy API output, preserve that behavior and keep normalization limited to derived read data.
- Do not add new broad entity normalizers unless the project already relies on entity-level normalization for that use case.

## Model Objects

- Use non-ORM model objects for transient domain data that cannot or should not be stored directly, such as unencrypted user-submitted secret data.
- Keep these models free of persistence attributes unless they are actual Doctrine entities.
- Use explicit methods for state transitions such as `markPasswordAsChanged()` or changelog construction.
- Do not blur DTO and entity-model responsibilities: request DTOs carry input, model objects carry domain state, entities carry persisted state.

## Fixtures And Test Data Hooks

- Prefer normal constructors for real entity creation.
- Use fixture-only factories sparingly and mark them as internal when bypassing constructors is necessary for legacy or encrypted data.
- Keep fixture-only plain fields clearly marked and out of production workflows.
- Pair fixture-specific entity needs with `symfony-test-data-generators`.

## Review Checklist

- Entity has strict types, private typed properties, and Doctrine attributes matching the database schema.
- Required constructor arguments and nullable properties match real domain requirements.
- Collections are initialized and relationship add/remove methods keep both sides consistent where needed.
- UUID, timestamp, soft-delete, schema, and repository-class patterns match the local project.
- Enum-like values are represented by constants and simple invariants are enforced close to the state.
- Derived IDs, counters, and changed-property tracking stay internally consistent after setters run.
- No repositories, HTTP concerns, services, security checks, filesystem writes, or response serialization logic leaked into the entity.

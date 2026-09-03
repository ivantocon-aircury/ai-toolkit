# Symfony Skills

This repository centralizes the skills, conventions, and working patterns I use for Symfony projects.

It is intended to become the shared home for Symfony-related skills, including framework workflows, project structure preferences, debugging habits, testing approaches, code-generation guidance, and any recurring practices that should be applied consistently across Symfony work.

## Purpose

- Keep Symfony skills in one place.
- Document how each skill should be used.
- Capture preferred ways of working with Symfony.
- Make future Symfony automation and guidance easier to discover and maintain.

## Skills

Each Symfony skill added to this repository should be documented here.

When adding a new skill, update this section with:

- Skill name
- Short description
- When to use it
- Location of the skill files

### Skill Index

- `branch-commit-pr`: Captures a safe GitHub branch-to-PR workflow. Use when creating a branch from current changes, committing, pushing, and opening a pull request against a specified target branch. Location: `.agents/skills/git/branch-commit-pr/SKILL.md`.
- `symfony-controllers`: Captures a reusable Symfony API controller style. Use when creating, editing, or reviewing single-action controllers under `src/Controller`. Location: `.agents/skills/symfony-controllers/SKILL.md`.
- `symfony-entities`: Captures Doctrine entity and model object conventions. Use when creating, editing, or reviewing entities, ORM mappings, relationships, lifecycle fields, and entity invariants under `src/Entity`. Location: `.agents/skills/symfony-entities/SKILL.md`.
- `symfony-repositories`: Captures Doctrine repository conventions. Use when creating, editing, or reviewing repositories, query builders, pagination, persistence helpers, and read/filter methods under `src/Repository`. Location: `.agents/skills/symfony-repositories/SKILL.md`.
- `symfony-services`: Captures application service conventions. Use when creating, editing, or reviewing services, workflow orchestration, entity mutation, file handling, external integrations, and business logic under `src/Service`. Location: `.agents/skills/symfony-services/SKILL.md`.
- `symfony-voters`: Captures Symfony voter conventions. Use when creating, editing, or reviewing voters, authorization calls, DTO-subject voter patterns, role checks, ownership rules, and access-group checks under `src/Security/Voter`. Location: `.agents/skills/symfony-voters/SKILL.md`.
- `symfony-test-data-generators`: Captures fixture and test data generator conventions. Use when creating, editing, or reviewing project-local test data generator services under `src/Service/TestDataGenerator`. Location: `.agents/skills/symfony-test-data-generators/SKILL.md`.
- `symfony-external-integrations`: Captures external integration conventions. Use when creating, editing, or reviewing API clients, import services, external DTO normalization, provider mapping entities/repositories, and third-party integrations such as book APIs, Stripe, Salesforce, Customer.io, FreeAgent, Sendy, Typeform, captcha, and mail services. Location: `.agents/skills/symfony-external-integrations/SKILL.md`.

## Maintenance

Keep this README updated whenever a skill is added, renamed, removed, or substantially changed.

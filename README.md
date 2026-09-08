# OpenCode Skills

This repository centralizes reusable OpenCode skills, conventions, and working patterns.

It includes composable development workflows and technology-specific guidance that should be applied consistently across projects.

## Purpose

- Keep reusable OpenCode skills in one place.
- Document how each skill should be used.
- Capture preferred development and technology-specific workflows.
- Make future automation and guidance easier to discover and maintain.

## Skills

Each skill added to this repository should be documented here.

When adding a new skill, update this section with:

- Skill name
- Short description
- When to use it
- Location of the skill files

### Skill Index

#### Git Workflows

- `inspect-git-state`: Performs read-only repository, worktree, branch, change, remote, and publication inspection. Location: `.agents/skills/git/inspect-git-state/SKILL.md`.
- `create-worktree`: Creates or reuses and verifies a task worktree after the isolation decision has been made. Location: `.agents/skills/git/create-worktree/SKILL.md`.
- `worktree-workflow`: Decides whether modifying work needs worktree isolation and coordinates confirmation and creation. Location: `.agents/skills/git/worktree-workflow/SKILL.md`.
- `commit-changes`: Groups actual changes into one or more coherent commits without mixing unrelated work. Location: `.agents/skills/git/commit-changes/SKILL.md`.
- `push-branch`: Verifies and safely publishes an intended branch without rewriting history. Location: `.agents/skills/git/push-branch/SKILL.md`.
- `create-pull-request`: Reviews the complete branch and creates or locates its GitHub pull request. Location: `.agents/skills/git/create-pull-request/SKILL.md`.
- `development-lifecycle`: Coordinates isolation, implementation handoff, logical commits, final checks, push, and pull request state. Location: `.agents/skills/git/development-lifecycle/SKILL.md`.

#### Next.js

- `next-auth-app-router`: Covers Auth.js and NextAuth.js authentication in App Router projects. Location: `.agents/skills/nextjs/next-auth-app-router/SKILL.md`.
- `nextjs-app-router`: Covers App Router pages, layouts, routing, metadata, guards, and server/client boundaries. Location: `.agents/skills/nextjs/nextjs-app-router/SKILL.md`.

#### PHP

- `php-code-style`: Captures modern PHP language and code-style conventions. Location: `.agents/skills/php/php-code-style/SKILL.md`.

#### React

- `frontend-styling`: Covers visual React and Next.js styling, responsiveness, and design-system consistency. Location: `.agents/skills/react/frontend-styling/SKILL.md`.
- `frontend-testing`: Covers behavior-focused React and Next.js tests. Location: `.agents/skills/react/frontend-testing/SKILL.md`.
- `react-components`: Covers React component structure, boundaries, props, and accessibility. Location: `.agents/skills/react/react-components/SKILL.md`.
- `react-controlled-form-widgets`: Integrates React Hook Form with non-native controlled widgets. Location: `.agents/skills/react/react-controlled-form-widgets/SKILL.md`.
- `react-hook-form-yup`: Covers React forms, Yup validation, and submit flows. Location: `.agents/skills/react/react-hook-form-yup/SKILL.md`.
- `react-query-api`: Covers TanStack Query data fetching, mutations, query keys, and cache behavior. Location: `.agents/skills/react/react-query-api/SKILL.md`.
- `react-tanstack-table`: Covers typed TanStack Table grids and server-side table state. Location: `.agents/skills/react/react-tanstack-table/SKILL.md`.
- `react-toastify`: Covers React Toastify notification behavior and integration. Location: `.agents/skills/react/react-toastify/SKILL.md`.
- `tailwindcss`: Covers Tailwind CSS utilities, configuration, tokens, variants, and validation. Location: `.agents/skills/react/tailwindcss/SKILL.md`.

#### Symfony

- `symfony-controllers`: Captures a reusable Symfony API controller style. Use when creating, editing, or reviewing single-action controllers under `src/Controller`. Location: `.agents/skills/symfony/symfony-controllers/SKILL.md`.
- `symfony-doctrine-migrations`: Covers Doctrine schema and data migration generation, review, and validation. Location: `.agents/skills/symfony/symfony-doctrine-migrations/SKILL.md`.
- `symfony-entities`: Captures Doctrine entity and model object conventions. Use when creating, editing, or reviewing entities, ORM mappings, relationships, lifecycle fields, and entity invariants under `src/Entity`. Location: `.agents/skills/symfony/symfony-entities/SKILL.md`.
- `symfony-repositories`: Captures Doctrine repository conventions. Use when creating, editing, or reviewing repositories, query builders, pagination, persistence helpers, and read/filter methods under `src/Repository`. Location: `.agents/skills/symfony/symfony-repositories/SKILL.md`.
- `symfony-services`: Captures application service conventions. Use when creating, editing, or reviewing services, workflow orchestration, entity mutation, file handling, external integrations, and business logic under `src/Service`. Location: `.agents/skills/symfony/symfony-services/SKILL.md`.
- `symfony-voters`: Captures Symfony voter conventions. Use when creating, editing, or reviewing voters, authorization calls, DTO-subject voter patterns, role checks, ownership rules, and access-group checks under `src/Security/Voter`. Location: `.agents/skills/symfony/symfony-voters/SKILL.md`.
- `symfony-test-data-generators`: Captures fixture and test data generator conventions. Use when creating, editing, or reviewing project-local test data generator services under `src/Service/TestDataGenerator`. Location: `.agents/skills/symfony/symfony-test-data-generators/SKILL.md`.
- `symfony-external-integrations`: Captures external integration conventions. Use when creating, editing, or reviewing API clients, import services, external DTO normalization, provider mapping entities/repositories, and third-party integrations. Location: `.agents/skills/symfony/symfony-external-integrations/SKILL.md`.
- `symfony-phpunit-functional-tests`: Covers fixture-backed Symfony API and controller functional tests. Location: `.agents/skills/symfony/symfony-phpunit-functional-tests/SKILL.md`.

## Maintenance

Keep this README updated whenever a skill is added, renamed, removed, or substantially changed.

# OpenCode Development Toolkit

This repository contains reusable global defaults for software development with
OpenCode. It uses OpenCode's native configuration, instructions, agents, skills,
permissions, and MCP support without adding an installation framework.

## Precedence

Behavior is resolved from most specific to most general:

1. The current user request.
2. Instructions and conventions in the active project.
3. Global instructions from this toolkit.
4. Defaults in a relevant reusable skill.

Skills are fallback procedures. They do not override a project's architecture,
commands, versions, issue-reference format, or demonstrated conventions.

## Profiles

Both profile directories contain the same development instructions and agents.
Install the desired profile as `~/.config/opencode` and expose this repository's
`.agents/skills` as `~/.agents/skills`; OpenCode discovers that location natively.
This repository intentionally does not prescribe a copy or installation script.

- `.opencode-auto` is intended for isolated development environments. It allows
  normal repository edits, commands, delegation, verification, and task worktrees
  under `~/work/worktrees`. It denies common destructive command forms and native
  access to credential directories, but it is not an OS sandbox: broad Bash access
  can bypass path-based rules. Use this profile only in an isolated environment.
- `.opencode-normal` is intended for environments containing personal or
  unrelated files. Native project inspection is available, but edits, shell
  commands, web or MCP documentation access, and external paths retain
  conservative approval rules. Environment-file edits are denied.

The auto-only Wakatime plugin and permission differences are intentional. Other
models, MCP configuration, instructions, and agent definitions stay aligned.

Restart OpenCode after installing or changing a profile because configuration,
agents, and skills are loaded at startup.

## Global Instructions

- `instructions/language.md` selects the default user-facing language.
- `instructions/development.md` defines precedence, focused implementation,
  autonomous completion, native-tool preference, and verification principles.
- `instructions/subagent-delegation.md` defines when to use the small subagent
  set without moving implementation decisions away from the main agent.

## Agents

- `executor` runs clearly defined commands and analyzes output using the project's
  documented execution environment. It does not author code edits, although an
  explicitly requested formatter, generator, or Git command may change files.
- `researcher` performs substantial read-only codebase or external investigation.
- `reviewer` independently reviews completed work for defects, regressions,
  missed requirements, security issues, convention drift, and missing tests.

Agent files are duplicated between profiles because each directory is a complete,
independently installable global configuration. Keep their contents aligned.

## Skills

Skills live under `.agents/skills/<area>/<name>/SKILL.md`. Keep each skill focused,
load related skills only when the task includes their concern, and avoid creating
a project skill with the same name merely to customize a global default. Project
instructions should provide those overrides.

### Git Workflows

- `inspect-git-state`: read-only repository and publication inspection.
- `worktree-workflow`: decides whether modifying work benefits from isolation.
- `create-worktree`: safely creates or reuses task worktrees under
  `~/work/worktrees/<project>/<branch-or-task>`.
- `clean-worktree`: explicitly removes one clean task worktree, its
  Docker Compose containers, and its local branch.
- `verify-changes`: reviews the complete diff and runs discovered project checks.
- `commit-changes`: creates coherent commits using project message conventions.
- `push-branch`: safely publishes an intended branch without implicit force push.
- `create-pull-request`: verifies and creates or locates a GitHub pull request.
- `development-lifecycle`: composes the requested Git endpoint from atomic skills.

### Project Knowledge

- `extract-rule`: turns evidence from changes or review corrections into a
  confirmed, discoverable project rule without imposing a global taxonomy.

### Interaction

- `ask-question`: collects a decision or confirmation through the native
  structured question tool instead of guessing or using multiple-choice chat.

### PHP And Symfony

- `php-code-style`: PHP syntax, native types, PHPDoc, and version-aware style.
- `symfony-controllers`: HTTP boundaries, request mapping, authorization, and
  responses.
- `symfony-doctrine-migrations`: schema diffs, data migrations, and validation.
- `symfony-entities`: Doctrine mapping, relationships, state, and invariants.
- `symfony-repositories`: queries, filters, ordering, pagination, and persistence.
- `symfony-services`: multi-step application workflows and transaction boundaries.
- `symfony-voters`: authorization attributes, subjects, roles, and ownership.
- `symfony-external-integrations`: third-party clients and normalization boundaries.
- `symfony-test-data-generators`: deterministic fixtures, factories, and builders.
- `symfony-phpunit-functional-tests`: behavior-focused Symfony functional tests.

### React And Next.js

- `react-components`: component boundaries, props, rendering, and accessibility.
- `frontend-styling`: visual-system, responsive, and interaction-state guidance.
- `frontend-testing`: behavior-focused React and Next.js automated tests.
- `react-controlled-form-widgets`: non-native form control adapters.
- `react-hook-form-yup`: forms using the confirmed React Hook Form and Yup stack.
- `react-query-api`: TanStack Query transport, keys, mutations, and cache behavior.
- `react-tanstack-table`: TanStack Table grids and explicit client/server state.
- `react-toastify`: React Toastify container and notification behavior.
- `tailwindcss`: version-aware Tailwind utilities, tokens, and source detection.
- `nextjs-app-router`: version-aware App Router routes and server/client boundaries.
- `next-auth-app-router`: Auth.js or NextAuth.js App Router authentication.

## Maintenance

- Keep global instructions small and move detailed procedures into skills.
- Keep both profiles aligned except for intentional security and privacy choices.
- Validate configuration against `https://opencode.ai/config.json`.
- Keep agent names and skill frontmatter names unique and discoverable.
- Store evals beside the skill they exercise; do not create aggregate skill names
  that OpenCode cannot discover.
- Review the complete diff and run relevant validation after toolkit changes.

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

Install `.opencode-auto-v2` as `~/.config/opencode` and expose this repository's
`.agents/skills` as `~/.agents/skills`; OpenCode discovers that location natively.
This repository intentionally does not prescribe a copy or installation script.

- `.opencode-auto-v2` is intended for isolated development environments. It
  defaults to GPT-6.1 Terra with default reasoning effort and uses the native
  worktree adapter described below. It allows normal repository edits, commands,
  delegation, verification, and task worktrees under `~/work/worktrees`. It denies
  common destructive command forms and native access to credential directories,
  but it is not an OS sandbox: broad Bash access can bypass path-based rules.
  Use this profile only in an isolated environment.
  Install the complete profile, including `plugins/` and `instructions/`.

OpenCode reloads configuration, agents, commands, skills, plugins, and MCP
servers after a profile change. Use `/reload` to force a full reload when needed.
The profile's `cli.json` enables terminal-title updates, so session-title changes
can also appear in a supporting terminal window or terminal-emulator tab.

## Global Instructions

- `instructions/language.md` selects the default user-facing language.
- `instructions/development.md` defines precedence, focused implementation,
  autonomous completion, native-tool preference, and verification principles.
- `instructions/subagent-delegation.md` defines when to use the small subagent
  set without moving implementation decisions away from the main agent.

## Agents

- `build` is the default primary agent and owns implementation, verification,
  and the final answer for each task.
- `executor` runs clearly defined commands and analyzes output using the project's
  documented execution environment. It does not author code edits, although an
  explicitly requested formatter, generator, or Git command may change files.
- `researcher` performs substantial read-only codebase or external investigation.
- `reviewer` independently reviews completed work for defects, regressions,
  missed requirements, security issues, convention drift, and missing tests.

Subagents are bounded specialists: they cannot delegate further, return their
results to Build, and default to one active child at a time. Direct execution is
the default; a handoff should provide a clear specialization or parallelism benefit.
The profile keeps different model and reasoning-effort choices on those specialists, rather than
adding an orchestration layer for ordinary implementation work.

| Agent | Model | Reasoning effort |
| --- | --- | --- |
| Build | GPT-6.1 Terra | Model default |
| Executor | GPT-6 Luna Fast | Low |
| Researcher | GPT-6 Luna | Medium |
| Reviewer | GPT-6.1 Terra | High |

These are the profile's configured choices, not an automatic complexity router.
Use `/models` to select an available session model and the session controls to
select a supported reasoning variant:
prefer a fast capable choice for routine work and a stronger choice for difficult
or high-risk work. Escalate on evidence of stalled progress rather than repeatedly
switching. Session selections and provider availability take precedence; do not
assume an agent can change its own model. The catalog may not expose pricing.

OpenCode discovers `.agents/skills` in a project and `~/.agents/skills` globally;
the global profile's agents and instructions load from `~/.config/opencode`.
Installing copies means later repository edits require updating those copies;
reload only after installation. Built-in commands such as `/goal` are not defined
by this repository. Automatic compaction is enabled; for long tasks, a concise
checkpoint of the worktree, decisions, progress, checks, and next action helps
recovery without inventing a separate mandatory tracking system.

## Skills

Skills live under `.agents/skills/<area>/<name>/SKILL.md`. Keep each skill focused,
load related skills only when the task includes their concern, and avoid creating
a project skill with the same name merely to customize a global default. Project
instructions should provide those overrides.

### Git Workflows

- `inspect-git-state`: read-only repository and publication inspection.
- `worktree-workflow`: isolates every modifying task, first checking for related
  existing worktrees to reuse.
- `create-worktree`: prepares or selects a native task worktree under
  `~/work/worktrees/<project>/<branch-or-task>` and verifies session handoff.
- `clean-worktree`: explicitly removes one registered task worktree folder,
  its verified Docker containers, volumes, networks, and eligible local branch.
  Explicit invocation discards all target files, including ignored files.
  Shared or unverifiable Docker resources are preserved with a warning.
- `audit-worktrees`: checks every project under `~/work/worktrees` against
  main, master, preview, and staging; delegates explicitly approved cleanup.
- `verify-changes`: reviews the complete diff and runs discovered project checks.
- `commit-changes`: creates coherent commits using project message conventions.
- `push-branch`: safely publishes an intended branch without implicit force push.
- `create-pull-request`: verifies and creates or locates a GitHub pull request.
- `development-lifecycle`: composes the requested Git endpoint from atomic skills.

The agent initiates native worktree creation when isolation is required.
The user does not need to create a worktree manually.
The adapter uses
`~/work/worktrees/<project>/<branch-with-slashes-as-hyphens>`,
attaches the task branch after native detached creation, copies dependencies
for new worktrees, and requests native session movement.
Direct UI/API creation without the adapter uses the configured shared parent
without the per-project adapter conventions.

For cleanup, explicitly select `clean-worktree` or mention it as
`@clean-worktree` in the UI.
Cleanup first moves the active session outside the target and verifies handoff,
then performs the shared runtime and consent checks before native removal.
The profile requests permission for native removal, with the target and force
flag shown; other native worktree operations retain their automatic flow.
It deletes the verified local branch only after folder and registrations are gone.
When native removal deregisters a worktree but leaves ignored residue (such as
`.idea/`, `node_modules/`, or build output), the adapter can remove that exact
folder only after revalidating its path, mounts, nested repositories/worktrees,
and a pre-removal authorized snapshot (all files when discard is approved).
It never exposes generic recursive
deletion or uses `rm -rf`. Unregistered leftover folders or damaged Git metadata
still require reported, targeted recovery outside the adapter.
No implementation, commit, or PR completion implicitly authorizes cleanup.

Run adapter checks with
`node --test .opencode-auto-v2/tests/task-worktrees.test.mjs`.

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
- Keep the installed profile and skill copies aligned with the intended revision.
- Validate configuration against `https://opencode.ai/config.json`.
- Keep agent names and skill frontmatter names unique and discoverable.
- Store evals beside the skill they exercise; do not create aggregate skill names
  that OpenCode cannot discover.
- Review the complete diff and run relevant validation after toolkit changes.

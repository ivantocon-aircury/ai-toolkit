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
  defaults to GPT-6.1 Sol with low reasoning effort and uses the native worktree
  adapter described below. It allows normal repository edits, commands,
  delegation, verification, and task worktrees under `~/work/worktrees`. It denies
  common destructive command forms and native access to credential directories,
  but it is not an OS sandbox: broad Bash access can bypass path-based rules.
   Use this profile only in an isolated environment.
   Install the complete profile, including `plugins/` and `instructions/`.

### Automatic task routing

New sessions use the `task-router` primary agent.
It classifies normal requests by the work required and delegates sequentially to
one configured execution profile:

- `quick`: low-effort work that is understood and low risk.
- `implement`: the medium-effort default for ordinary development work.
- `deep`: high-effort work requiring substantial reasoning or consequential
  decisions.

The profiles and the coordinator default share one model and differ only by
reasoning effort. Their model selectors and routing policy are maintained directly
in the agent files under `.opencode-auto-v2/agents/`.

Routing is instruction-based best effort, not a guarantee of optimal model
selection.
The coordinator respects an explicit profile, model, or effort selection, asks
for missing requirements rather than escalating, and can escalate once when new
evidence warrants it.
For an explicit model or effort, select it in OpenCode through `/models` first;
V2 does not reliably apply a model named only in task text to a configured child
agent.
An unavailable configured profile reports its rejected model/effort and retries
once with its documented fallback (`quick` → `implement`, `implement` → `quick`,
and `deep` → `implement`); a failed fallback requires user model selection
through `/models`.
Delegation changes the worker model, not the coordinator session's model.
Routing adds one coordinator-to-worker handoff and its associated usage; it
avoids extra delegation for routine work.


OpenCode reloads configuration, agents, and skills after a profile change;
use `/reload` if a running session does not reflect a change.

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

The task-router and execution-profile files are maintained directly in the
installed profile.

## Skills

Skills live under `.agents/skills/<area>/<name>/SKILL.md`. Keep each skill focused,
load related skills only when the task includes their concern, and avoid creating
a project skill with the same name merely to customize a global default. Project
instructions should provide those overrides.

### Git Workflows

- `inspect-git-state`: read-only repository and publication inspection.
- `worktree-workflow`: decides whether modifying work benefits from native task
  isolation.
- `create-worktree`: prepares or selects a native task worktree under
  `~/work/worktrees/<project>/<branch-or-task>` and verifies session handoff.
- `clean-worktree`: explicitly removes one task worktree or leftover folder,
  its verified Docker containers, volumes, networks, and eligible local branch.
  Asks before discarding changes or continuing with unresolved Compose config.
- `verify-changes`: reviews the complete diff and runs discovered project checks.
- `commit-changes`: creates coherent commits using project message conventions.
- `push-branch`: safely publishes an intended branch without implicit force push.
- `create-pull-request`: verifies and creates or locates a GitHub pull request.
- `development-lifecycle`: composes the requested Git endpoint from atomic skills.

The agent initiates native worktree creation when isolation is required.
The user does not need to create a worktree manually.
The adapter preserves `~/work/worktrees/<project>/<branch-with-slashes-as-hyphens>`,
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
and a pre-removal ignored-residue snapshot. It never exposes generic recursive
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
- Keep both profiles aligned except for intentional security and privacy choices.
- Validate configuration against `https://opencode.ai/config.json`.
- Keep agent names and skill frontmatter names unique and discoverable.
- Store evals beside the skill they exercise; do not create aggregate skill names
  that OpenCode cannot discover.
- Review the complete diff and run relevant validation after toolkit changes.

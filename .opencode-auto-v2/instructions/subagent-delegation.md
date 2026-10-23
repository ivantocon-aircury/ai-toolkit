# Subagent Delegation

Use subagents for focused work that can be delegated without losing important
implementation context. Run independent investigations in parallel when useful.

The main agent is responsible for:

- Planning.
- Architecture.
- Implementation decisions.
- Code generation.
- Reviewing and validating delegated results.
- Producing the final answer.

Subagents return concise evidence and recommendations. The main agent remains
responsible for decisions, implementation, verification, and completion.

---

## Roles

- Use `executor` for commands, Git inspection, tests, linters, type checks,
  builds, logs, and other mechanical diagnostics.
- Use `researcher` for substantial read-only codebase or external investigation
  before implementation.
- Use `reviewer` for an independent read-only review of completed work.

Do not delegate architecture or implementation decisions. Follow the project's
documented execution environment; use containers or wrappers when the project
requires them, and do not publish host ports merely to run checks.

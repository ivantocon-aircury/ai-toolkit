# Subagent Delegation

The primary Build agent owns each task from implementation through verification.
It works directly by default and uses a subagent only for a bounded task whose
result it can evaluate and apply.

The main agent is responsible for:

- Planning.
- Architecture.
- Implementation decisions.
- Code generation.
- Reviewing and validating delegated results.
- Producing the final answer.

Subagents return concise evidence, results, and uncertainties to Build. They do
not own the user task, make final architecture decisions, or claim task
completion. They must not delegate further.

Default to at most one active subagent. Do not split ordinary work into a plan,
research, implementation, and review chain. Use parallel subagents only when
the primary agent identifies independent, read-only work whose benefit exceeds
the additional context and usage cost.

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

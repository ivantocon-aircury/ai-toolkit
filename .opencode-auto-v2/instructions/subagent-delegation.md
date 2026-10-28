# Subagent Delegation

The primary Build agent owns each task from implementation through verification.
It delegates bounded mechanical command work to a subagent by default and
evaluates and applies its result.

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

## Command Execution

Use `executor` by default for bounded, command-only work that does not require
an implementation or architecture decision.
This includes Git inspection, tests, linters, type checks, builds, formatter
runs, log collection, and CI diagnostics.

Run a command directly only when it is a single, immediate, context-sensitive
check required to decide or validate the next implementation edit.
Do not delegate a command sequence that writes source files or requires the
parent agent's implementation judgment.

## Roles

- Use `executor` for bounded mechanical command work.
- Use `researcher` for substantial read-only codebase or external investigation
  before implementation.
- Use `reviewer` for an independent read-only review of completed work.

Do not delegate architecture or implementation decisions. Follow the project's
documented execution environment; use containers or wrappers when the project
requires them, and do not publish host ports merely to run checks.

# Subagent Delegation

The primary Build agent owns each task from implementation through verification.
Work directly by default; delegate only when a specialist or independent parallel
work is likely to save more time or context than the handoff costs. Respect any
stricter session or project delegation policy.

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

Run routine Git inspection, tests, linters, and other bounded commands directly.
Consider `executor` for lengthy independent command work where its results can
arrive while implementation continues. Do not delegate source edits or decisions.

## Roles

- Consider `executor` for independent mechanical command work.
- Consider `researcher` for substantial independent read-only investigation.
- Consider `reviewer` when independent review materially reduces risk.

Do not delegate architecture or implementation decisions. Follow the project's
documented execution environment; use containers or wrappers when the project
requires them, and do not publish host ports merely to run checks.

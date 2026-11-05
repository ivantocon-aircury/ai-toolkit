# Subagent Delegation

The primary Build agent owns each task from implementation through verification.
Implement directly; use the specialists for the situations listed under
"When To Delegate", where an independent model or background work adds value
beyond the handoff cost. Respect any stricter session or project delegation
policy.

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

## When To Delegate

Run routine Git inspection, quick tests, linters, and other short commands
directly. Delegate in these concrete situations:

- `reviewer`: after a non-trivial change and before reporting it complete. A
  change is non-trivial when it touches several files, alters behavior others
  depend on (public APIs, schemas, migrations, permissions, security, auth,
  concurrency, data handling), or when you had to make judgment calls. Subagents
  run on a different model family than Build, so the review catches blind spots
  that self-review misses. Skip it for typo fixes, documentation-only wording,
  or mechanical renames.
- `researcher`: when answering a question needs reading across an unfamiliar
  subsystem, tracing a flow through many files, checking Git history for why
  code exists, or consulting current external documentation. Launch it in the
  background when you can make independent progress meanwhile.
- `executor`: for slow or noisy command work, such as full test suites, builds,
  container setup, or long log analysis, especially in the background while
  implementation continues. Do not delegate source edits or decisions.

Give each subagent a self-contained prompt: the goal, relevant paths, the
worktree directory, constraints, and the shape of the answer you need. Treat its
result as evidence to verify, not as a conclusion.

Do not delegate architecture or implementation decisions. Follow the project's
documented execution environment; use containers or wrappers when the project
requires them, and do not publish host ports merely to run checks.

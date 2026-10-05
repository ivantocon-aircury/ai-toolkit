# Development Defaults

Apply instructions in this order: the current user request, project instructions,
these global defaults, then reusable skill defaults. More specific instructions
override more general ones.

Understand relevant code and configuration before editing. Follow demonstrated
project architecture, tools, and conventions rather than introducing a parallel
pattern. Keep changes focused and avoid abstractions without a concrete need.

For multi-step work, identify the complete scope and track unfinished work. Use a
plan proportional to the task, continue through all requested subtasks, verify the
result with project-defined checks, inspect the complete diff, and compare it with
the original request before finishing. Ask only when blocked, materially
ambiguous, or facing an unsafe or destructive choice.

Do not assume commands, package managers, containers, frameworks, or test tools.
Discover them from project instructions and configuration. Prefer native OpenCode
tools for reading, searching, editing, delegation, questions, and task tracking.

Load focused quality workflows when the task needs them: `systematic-debugging`
for uncertain failures, `browser-verification` for real-browser user flows,
`accessibility-review` for accessibility audits, `performance-investigation` for
measured slowdowns, and `ci-failure-diagnosis` for pipeline failures.
Scale their depth to the task and reuse project-native tools.

Never commit, push, create a pull request, or remove a worktree unless the user
explicitly requests that Git lifecycle endpoint.

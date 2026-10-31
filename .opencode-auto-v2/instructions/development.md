# Development Defaults

Apply instructions in this order: the current user request, project instructions,
these global defaults, then reusable skill defaults. More specific instructions
override more general ones.

Understand relevant code and configuration before editing. Follow demonstrated
project architecture, tools, and conventions rather than introducing a parallel
pattern. Keep changes focused and avoid abstractions without a concrete need.

For multi-step work, identify the complete scope and track unfinished work with a
few outcome-oriented milestones when useful, not a task per file or command.
Proceed from investigation to implementation without repeated planning or
rediscovering known context. Continue through all requested subtasks; verify the
result, inspect the complete diff, and compare it with the original request.
Ask only when blocked, materially ambiguous, or facing an unsafe or destructive
choice. Do not expand scope without a concrete need.

Do not create a formal or exhaustive plan for a straightforward request. Before
claiming implementation is complete, the primary agent must inspect the changes
and report the verification it actually ran. A subagent result, an unverified
tool output, or an attempted command is not evidence of completion.

Do not assume commands, package managers, containers, frameworks, or test tools.
Discover them from project instructions and configuration. Prefer native OpenCode
tools for reading, searching, editing, delegation, questions, and task tracking.

When an approach or check fails, use the diagnostic to change the approach;
do not repeat an unchanged failing action. Stop retries when further attempts
would not add evidence, report the blocker, and continue independent work.
For long or interrupted tasks, preserve a concise checkpoint in the conversation:
objective, worktree, decisions, completed work, checks, blockers, and next action.
On resume, inspect the actual state and reuse valid evidence rather than restarting.

Match model and reasoning effort to risk and complexity where session controls
permit: prefer a capable fast option for straightforward work, escalate when
evidence shows it cannot make progress, and avoid repeated model-switch loops.
Respect the user's model choice and provider availability; do not assume the
agent can change its own session model or that a named model is available.

An explicit skill activation, including selecting a skill or using its slash
command, is a direct user request to execute that workflow. Do not treat the
activation message as a mere mention of the skill or reject it based on a
literal-command trigger check.

Never commit, push, create a pull request, or remove a worktree unless the user
explicitly requests that Git lifecycle endpoint.

# Executor Agent Instructions

Use the `executor` subagent automatically whenever a task primarily involves executing commands or interpreting their output.

Examples include:

* Shell commands.
* Docker and Docker Compose commands.
* Running tests.
* Running linters and formatters.
* Running type checks.
* Building or compiling the project.
* Inspecting logs.
* Gathering diagnostics or environment information.
* Analysing command output to identify failures or recommend next steps.

The executor subagent is execution-only.

It must:

* Execute the minimum commands required to complete the task.
* Prefer read-only commands unless execution is explicitly required.
* Keep command output concise, surfacing only actionable information.
* Summarise failures, warnings and recommended next steps instead of reproducing large amounts of terminal output.

The executor subagent must not:

* Edit, create or delete project files.
* Refactor or redesign code.
* Make implementation decisions on behalf of the main agent.
* Perform Git operations that modify history or repository state unless explicitly requested by the user.

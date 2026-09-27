---
name: verify-changes
description: Use after implementation and before declaring work complete, committing, pushing, or opening a pull request. Reviews the complete diff, discovers project-defined checks, runs relevant verification, fixes discovered problems through the main workflow, and reports evidence and gaps.
---

# Verify Changes

Use this workflow for reusable implementation verification. The current user
request and repository instructions define success; this skill supplies defaults
only when they are silent.

## Inspect The Result

1. Load `inspect-git-state` in the intended worktree.
2. Review staged, unstaged, untracked, and relevant committed changes against the
   complete original request. Check for missing work, unrelated changes,
   accidental generated files, security issues, and needless complexity.
3. Discover verification commands from repository instructions, README files,
   package scripts, build files, CI configuration, and demonstrated local usage.
   Never assume tool names or host-versus-container execution.

## Run Relevant Checks

Use the native task tool with `executor` for mechanical command execution. Run
the smallest relevant checks first, then broader checks when warranted:

1. Focused tests for changed behavior.
2. Relevant broader tests.
3. Static analysis or type checking.
4. Linting and formatting checks.
5. Build, packaging, migration, or smoke checks when the change affects them.

Do not run unrelated expensive checks merely to fill a checklist. Do not suppress
failures. If a check cannot run, record the command, reason, and residual risk.

## Review And Repeat

After checks, reinspect Git state because formatters, generators, and tests may
create changes. The main agent owns implementation fixes; the executor does not.
Fix task-owned problems, rerun affected checks, and request an independent
`reviewer` pass for substantial or high-risk work.

Report the reviewed scope, exact checks and results, fixes made, remaining gaps,
and whether the requested work is ready for its intended endpoint. This skill
never commits, pushes, creates a PR, or cleans up a worktree.

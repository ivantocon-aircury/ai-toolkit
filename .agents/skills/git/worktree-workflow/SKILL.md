---
name: worktree-workflow
description: Invoke before any task that may modify tracked repository files. It reuses or creates task worktrees by default and may explicitly approve the current checkout only for a one-file, low-risk change.
---

# Worktree Workflow

Invoke this orchestration skill before beginning any task that may modify tracked repository files, including code, tests, documentation, and configuration. It decides whether the current checkout qualifies for the narrow exception; otherwise it reuses or creates task isolation and delegates all creation mechanics to `create-worktree`.

## Related Skills

- Load `inspect-git-state` to determine the current repository, branch, and worktree context.
- Load `create-worktree` only after deciding that a worktree is appropriate.
- Use `development-lifecycle` when coordinating the complete task lifecycle.

## Decide Whether Isolation Is Appropriate

Use a task worktree for every tracked-file modification unless the current checkout is explicitly approved under the one-file, low-risk exception below. This includes:

- New features and bug fixes.
- Significant refactors.
- Other independently reviewable code, test, documentation, or configuration changes.

No worktree decision is needed for read-only investigation, explanation, planning that will not implement, or operations that do not modify tracked repository content. If the task's intent is unclear, ask one concise question.

### Current Checkout Exception

Approve the current checkout only when all of the following are true:

- The task changes exactly one tracked file.
- The change is low risk: it is localized, straightforward, easily reversible, and does not alter public interfaces, persisted data, dependencies, CI, deployment, security, or broad behavior.
- Existing changes in the checkout are compatible with the task and have clear ownership.

Record the explicit approval and its reason before implementation. If any condition is not met, reuse an existing task worktree or create one.

## Detect Existing Isolation First

Load `inspect-git-state` before proposing anything.

- Treat the current checkout as appropriate when it is already a linked worktree intentionally associated with the task and its branch and existing changes are compatible with that task. This is reusing task isolation, not the current-checkout exception.
- Also accept an existing registered worktree clearly associated with the task, and hand its path to the caller after checking its status.
- Do not create a child, nested, second, or replacement worktree merely because this skill was loaded.
- A non-default branch alone does not prove the current checkout is the right task worktree. Check its registered worktree path and existing changes.
- If an existing worktree has changes of unclear ownership or a branch unrelated to the task, ask rather than reusing or altering it.

When appropriate isolation already exists, report the branch and absolute path and continue there without asking to create another worktree.

## Creation

- When task ownership, branch, base, and destination are unambiguous, load
  `create-worktree` and continue without asking for routine confirmation.
- Use the native question tool only for a real ambiguity, collision, unsafe reuse,
  or destructive choice that cannot be resolved from user or repository context.
- An explicit request to work in the current checkout does not waive the one-file, low-risk exception. Reuse or create a task worktree when the exception does not apply.

## Handoff

Return either:

- The verified existing or newly created worktree path and branch that all task operations must use, or
- A clear decision that no worktree is needed.

This skill does not create commits, push branches, open pull requests, or implement the task.

## Review Checklist

- The decision was made before implementation began.
- Any task that modifies tracked files invoked this skill first.
- Current-checkout approval was limited to a one-file, low-risk change and recorded its reason.
- Existing task isolation was detected before proposing a new worktree.
- Unambiguous safe creation did not cause an unnecessary pause.
- `create-worktree` owned creation and verification.
- No nested or redundant worktree was created.

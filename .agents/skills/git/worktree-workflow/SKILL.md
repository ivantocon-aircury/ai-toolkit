---
name: worktree-workflow
description: Use when substantial development may modify a repository. Decides whether isolation is useful, reuses existing task worktrees, and delegates safe creation without interrupting unambiguous autonomous work.
---

# Worktree Workflow

Use this orchestration skill before implementation starts. It decides whether task isolation is appropriate and delegates all creation mechanics to `create-worktree`.

## Related Skills

- Load `inspect-git-state` to determine the current repository, branch, and worktree context.
- Load `create-worktree` only after deciding that a worktree is appropriate.
- Use `development-lifecycle` when coordinating the complete task lifecycle.

## Decide Whether Isolation Is Appropriate

Normally propose a worktree for an independent unit of development expected to modify the codebase, including:

- New features and bug fixes.
- Significant refactors.
- Other independently reviewable code, test, documentation, or configuration changes.

Do not propose a worktree for read-only investigation, explanation, planning that will not implement, or a trivial operation that does not modify repository content. If the task's intent is unclear, ask one concise question.

## Detect Existing Isolation First

Load `inspect-git-state` before proposing anything.

- Treat the current checkout as appropriate when it is already a linked worktree intentionally associated with the task and its branch and existing changes are compatible with that task.
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
- Respect an explicit request to work in the current checkout when it is safe.

## Handoff

Return either:

- The verified existing or newly created worktree path and branch that all task operations must use, or
- A clear decision that no worktree is needed.

This skill does not create commits, push branches, open pull requests, or implement the task.

## Review Checklist

- The decision was made before implementation began.
- Existing task isolation was detected before proposing a new worktree.
- Unambiguous safe creation did not cause an unnecessary pause.
- `create-worktree` owned creation and verification.
- No nested or redundant worktree was created.

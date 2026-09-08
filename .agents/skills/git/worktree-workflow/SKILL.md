---
name: worktree-workflow
description: Use when development may modify a repository, including requests to implement or fix something, significant refactors, and OpenSpec or Spec Kit workflows entering implementation. Decides whether isolated work should use a Git worktree, avoids nested or redundant worktrees, asks before creation in interactive sessions, and delegates creation to `create-worktree`.
---

# Worktree Workflow

Use this orchestration skill before implementation starts. It decides whether task isolation is appropriate and delegates all creation mechanics to `create-worktree`.

## Related Skills

- Load `inspect-git-state` to determine the current repository, branch, and worktree context.
- Load `create-worktree` only after deciding that a new worktree is appropriate and obtaining any required confirmation.
- Use `development-lifecycle` when coordinating the complete task lifecycle.

## Decide Whether Isolation Is Appropriate

Normally propose a worktree for an independent unit of development expected to modify the codebase, including:

- New features and bug fixes.
- Significant refactors.
- OpenSpec changes that are moving from specification into implementation.
- Spec Kit workflows that are moving into implementation.
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

## Confirmation And Creation

- In normal interactive operation, briefly propose the worktree and ask the user to confirm before creating it.
- Include the reason for isolation and, when known, the proposed branch, base, and path. Do not force the user to request a worktree explicitly.
- If the runtime explicitly indicates that interaction or approval is intentionally bypassed, such as a YOLO or non-interactive run, create the worktree automatically. Do not infer non-interactive mode merely from user silence.
- After confirmation, or immediately in intentionally non-interactive operation, load `create-worktree` and pass the task context plus any explicit branch or base requirements.
- If the user declines, continue in the current checkout only when doing so is safe and consistent with higher-priority policies; record that isolation was declined.

## Handoff

Return either:

- The verified existing or newly created worktree path and branch that all task operations must use, or
- A clear decision that no worktree is needed or that the user declined it.

This skill does not create commits, push branches, open pull requests, or implement the task.

## Review Checklist

- The decision was made before implementation began.
- Existing task isolation was detected before proposing a new worktree.
- Interactive creation had user confirmation; intentionally non-interactive creation did not wait for it.
- `create-worktree` owned creation and verification.
- No nested or redundant worktree was created.

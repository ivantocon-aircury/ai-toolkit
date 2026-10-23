---
name: opencode-v2-worktree-workflow
description: Use before repository modifications in OpenCode v2 when the task_worktree tool is available. Decide whether to reuse or create native task isolation, allowing only the one-file low-risk checkout exception. Use the original worktree-workflow skill in other environments.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# OpenCode V2 Worktree Workflow

Decide whether isolation is appropriate before implementation.
Use `inspect-git-state` and `task_worktree` with `action: inspect` to identify
the active session directory, canonical checkout, branches, and dirty state.
Native inventory complements Git inspection; it does not replace it.

## Decide And Reuse

Use task isolation for tracked-file modifications by default.
No worktree decision is necessary for read-only investigation or discussion.
Approve the current checkout only for exactly one tracked file whose change is
localized, reversible, and low risk, with clear ownership of existing changes.
The exception excludes changes to public interfaces, persisted data,
dependencies, CI, deployment, security, or broad behavior.
Record the exception and its reason before editing.

Reuse the current linked worktree when its branch, task, and existing changes
clearly belong to this work.
A non-default branch alone is insufficient evidence.
Do not create another worktree merely because this skill was loaded.
For another registered worktree, inspect status and establish task ownership
before selecting it.
Ask about unclear ownership or conflicting changes; do not stash or move them.

## Native Handoff

When another worktree is needed, load `opencode-v2-create-worktree`.
Let that skill resolve branch/base, call the native adapter, and verify handoff.
Proceed without routine confirmation when task ownership and destination are
unambiguous.
Ask only for a material ambiguity, unsafe reuse, collision, or destructive choice.

After a session move, wait for the next step boundary and verify the new active
directory before any edit, test, build, or Git lifecycle operation.
Explicit working-directory arguments must also point to the selected worktree.
Return the verified absolute path and branch, or the approved checkout exception.

If the native tool is missing, stop and report that the v2 profile/plugin needs
installation; do not silently fall back to legacy worktree creation.
This skill does not authorize commits, publication, or cleanup.

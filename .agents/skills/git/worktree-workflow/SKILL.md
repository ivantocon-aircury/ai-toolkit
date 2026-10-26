---
name: worktree-workflow
description: Use before every repository modification when task_worktree is available. Search existing worktrees for related work, then reuse verified task isolation or create a dedicated worktree. No canonical-checkout small-change exception.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# Worktree Workflow

Decide whether isolation is appropriate before implementation.
Use `inspect-git-state` and `task_worktree` with `action: inspect` to identify
the active session directory, canonical checkout, branches, and dirty state.
Native inventory complements Git inspection; it does not replace it.

## Decide And Reuse

Use a dedicated task worktree for every repository modification.
No worktree decision is necessary for read-only investigation or discussion.
Do not use a small-change exception to edit the canonical checkout.
Before creating anything, inspect all registered worktrees, including those
outside the default parent, for related branches, work references, task names,
and existing changes. Check the system inventory under `~/work/worktrees` too.
Reuse a verified related worktree rather than creating a duplicate.
Report the related-worktree search result; ask when multiple plausible matches
or another active task make ownership ambiguous.

Reuse the current linked worktree when its branch, task, and existing changes
clearly belong to this work.
A non-default branch alone is insufficient evidence.
Do not create another worktree merely because this skill was loaded.
For another registered worktree, inspect status and establish task ownership
before selecting it.
Ask about unclear ownership or conflicting changes; do not stash or move them.

## Native Handoff

When another worktree is needed, load `create-worktree`.
Let that skill resolve branch/base, call the native adapter, and verify handoff.
Proceed without routine confirmation when task ownership and destination are
unambiguous.
Ask only for a material ambiguity, unsafe reuse, collision, or destructive choice.

After a session move, wait for the next step boundary and verify the new active
directory before any edit, test, build, or Git lifecycle operation.
Explicit working-directory arguments must also point to the selected worktree.
Return the verified absolute path and branch and the related-worktree search result.

If the native tool is missing, stop and report that the required profile/plugin
needs installation.
This skill does not authorize commits, publication, or cleanup.

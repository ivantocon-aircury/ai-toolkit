---
name: create-worktree
description: Use with task_worktree after deciding to create or reuse task isolation. Resolve a conventional branch and base, prepare or select a native worktree, and verify session handoff. Does not decide whether isolation is needed.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# Create Worktree

Use `worktree-workflow` for the isolation decision.
Use `inspect-git-state` before creation and after session handoff.
Do not execute raw `git worktree add` or replace the native Git strategy.
If `task_worktree` is unavailable, report an incomplete installation and stop.

## Resolve Branch, Base, And Location

Prefer an explicit branch, then repository conventions, then a short
`feature/`, `fix/`, or `refactor/` name.
Preserve a supplied work reference in the repository's format.
Never invent or require one when none was supplied.

Use an explicit starting ref when supplied.
Otherwise infer it from project instructions, remote default, current branch,
upstream, and task context.
Verify the ref and make any local/remote difference explicit.
Pass the selected base explicitly for a new branch so canonical `HEAD` is not
accidentally used when another ref was intended.
An existing branch retains its current tip; omit `base` when reusing it.

The adapter defaults to
`~/work/worktrees/<canonical-project-name>/<branch-with-slashes-as-hyphens>`.
Inspect the reported parent and destination before creation.
If project instructions require a different layout, stop and reconcile it with
the adapter configuration rather than silently ignoring project instructions.

## Prepare Or Select

1. Call `task_worktree` with `action: inspect` and inspect Git state.
2. If already in the intended task worktree, verify it and return it unchanged.
3. If the branch has another worktree, establish task ownership and inspect its
   changes before calling `action: select` with its absolute `directory`.
   Ask if ownership is unclear.
4. Otherwise call `action: prepare` with `branch` and, for a new branch, `base`.
   The adapter creates through OpenCode, then attaches the named task branch.
   The native API's `branch` argument is a starting ref, not a new branch name;
   leave that API translation to the adapter.
5. Treat an existing destination as a collision unless verified for reuse.
   Do not remove it, invent another branch, or accept a suffixed directory just
   to bypass the collision.

Creation copies non-symlink `node_modules/` and `vendor/` from the active
session checkout only for new worktrees.
Copies remain independent; internal dependency symlinks are preserved.
Do not repeat seeding on reuse or copy environment files, caches, or user changes.
Report absent dependencies or copy warnings and use project installation
commands when necessary.

## Verify Handoff And Recover

Prepare and select request a native session move.
Wait for the next step boundary, then inspect the active directory again.
Verify canonical repository identity, linked-worktree registration, task branch,
`HEAD`, starting ancestry, and compatible Git status before continuing.
Report the absolute path, branch, base, and dependency-copy outcome.
Run all subsequent task operations there, including explicit `workdir` values.

A failed branch attachment leaves a registered detached worktree.
Inspect its status and branch ownership, attach the intended existing branch
with `git switch`, or create it with `git switch -c` only if it is still absent,
then use `action: select`.
A failed move leaves a prepared worktree; inspect and select it again.
Do not retry prepare against the existing destination or automatically remove
partial worktrees.
This skill never authorizes cleanup, commits, or remote publication.

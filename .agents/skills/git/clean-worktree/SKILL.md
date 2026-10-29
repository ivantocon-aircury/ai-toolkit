---
name: clean-worktree
description: Explicitly clean one worktree by folder, branch, or worktree name, defaulting to the active linked worktree. Discard all its files and verified local branch; remove only runtime resources proven exclusive to it. Also accepts exact targets explicitly approved through audit-worktrees. Never infer cleanup from task completion.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# Clean Worktree

This is a deliberately short, one-worktree cleanup. The native adapter performs
the filesystem safety checks, so do not reproduce them with broad Docker,
process, or recursive filesystem investigations.

If `task_worktree` is unavailable, report an incomplete installation and stop.

## Authorization And Target

Only an explicit `clean-worktree` invocation/selection, or an `audit-worktrees`
delegation with the user's approval for this exact target, authorizes deletion.
A mention, task completion, or PR readiness does not.

Resolve exactly one registered linked worktree from an absolute folder, branch,
or unique basename. Resolve relative folders from the original session directory.
If no target is provided, capture the active linked worktree before moving; never
default to the canonical checkout. Show candidates and ask when resolution is
ambiguous.

State the exact folder and branch before removal: all tracked, staged,
untracked, and ignored target files, plus its local branch, will be discarded.
This authorization covers ordinary dirty files; do not ask a duplicate
dirty-file question.

## Fast Native Cleanup

1. Call `task_worktree` with `action: inspect`. Confirm the target is a registered
   linked worktree in the current project and record its branch, tip, and Git
   status snapshot using `--untracked-files=all`. For each Git-visible changed or
   untracked file, also record a content snapshot. Reject the canonical checkout,
   a symlink, a worktree parent, or an ancestor of another registered worktree.
2. If the session is inside the target, call `task_worktree` with `action: leave`.
   At the next step boundary, inspect again and proceed only after the session is
   outside the target. Use an explicit safe `workdir` for any subsequent Git call.
3. Immediately before removal, recheck the branch tip, Git status, and recorded
   changed-path content snapshots. New or changed Git-visible work needs renewed
   consent; a proven active writer is a blocker. Then call `task_worktree` with
   `action: remove`, the exact absolute `directory`, and `force: true`. Explicit
   invocation authorizes this flag. The adapter requests native permission and
   rejects locks, mounts, nested repositories/worktrees, active session targets,
   and unsafe residue; never bypass one of those failures with raw Git or
   `rm -rf`.
4. Require both `registrationRemoved: true` and `folderRemoved: true`, then call
   `inspect` again to confirm the target is absent. A failed owner, retained
   residue, or stale/unregistered folder is a partial result: preserve the branch
   and report the adapter's reason rather than attempting a fallback deletion.
5. For a captured non-detached branch, verify its ref still equals the recorded
   tip and it is not checked out elsewhere. Delete only that local branch. Preserve
   remote branches, stashes, caches, and shared services.

## Runtime And External Resources

The fast path preserves runtime resources. Inspect, stop, or remove one only when
both its exclusive ownership by this exact worktree and the command's exact scope
are clear. A documented target-specific cleanup command is evidence to inspect,
not authority to affect shared Compose containers, volumes, networks, bind mounts,
or external services. Never infer ownership from a port, basename, or Compose
project name. Ask separately before deleting bind-mounted data or external
services. Shared, unavailable, or ambiguous Docker/Compose resources are retained
and reported; they never block native worktree removal.

Do not stop the agent, its shell, or unrelated process groups. Before removal,
use a targeted process and open-file scan for the target; a proven active writer
or mount is a hard blocker. Do not perform a broad process or Docker sweep when
no target-owned runtime evidence exists.

## Completion Tab Indicator

Only after every successful cleanup confirmation above, including local branch
cleanup when applicable, call OpenCode's native `opencode.session_rename` tool
without a `sessionID`. Do not set this indicator for a partial, blocked, or
resumable cleanup.

Use the captured target's basename, rather than an untrusted user-supplied
title. Strip C0 control characters and DEL, then rename the current session to:

```text
🧹 Worktree cleaned — <sanitized target basename>
```

Do not use `opencode api get /api/session/active` to select a session. That API
reports service-wide activity and can identify a tab belonging to another client.
Omitting `sessionID` makes the native tool rename only the session running this
cleanup workflow.

This changes the OpenCode tab directly and does not depend on a shell's
controlling terminal. The shipped CLI profile enables `terminal.title`, so
OpenCode also propagates the session title to a supporting terminal window or
terminal-emulator tab. If a terminal does not support title updates, report that
limitation without treating an otherwise successful cleanup as failed.

Report session destination, target/owner, approvals, runtime cleanup,
folder/registration/inventory state, branch result, preserved resources,
tab-indicator result, and any resumable partial failure.

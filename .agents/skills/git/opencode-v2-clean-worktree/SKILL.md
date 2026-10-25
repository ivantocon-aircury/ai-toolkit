---
name: opencode-v2-clean-worktree
description: Use ONLY when the user explicitly invokes or selects opencode-v2-clean-worktree in OpenCode v2 with task_worktree. Removes exactly one authorized task worktree through native APIs after runtime and data-loss checks. Never trigger for general cleanup, mentions, task completion, or PR creation.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# OpenCode V2 Clean Worktree

If `task_worktree` is unavailable, report an incomplete v2 installation and stop.
Do not execute legacy cleanup as a fallback from this skill.

## Activation And Shared Safety Policy

An explicit selection or invocation of this skill authorizes this workflow.
Use its exact ID, `opencode-v2-clean-worktree`, including `@` where the v2 UI
uses skill mentions.
The legacy ID is denied in the v2 profile, not registered as a native alias.
A mention in discussion or a general cleanup request does not authorize removal.
Capture exactly one target before moving the session.
Without a target, use the chat session's active linked worktree, never the
canonical checkout or an arbitrary inventory entry.
Resolve an explicit branch only when it identifies exactly one linked worktree.

Read `../clean-worktree/SKILL.md` as the shared safety-policy reference.
It remains the original skill for older profiles; do not load or execute its
legacy workflow as a second skill.
Apply its sections on scope, resumability, target inspection and consent,
runtime discovery and ownership, processes and external dependencies,
Docker cleanup, and reporting.
This skill replaces its activation, session handoff, and registered-worktree
removal mechanics with the native sequence below.

In particular, preserve its checks for dirty/uninspectable files, locks, nested
repositories, mount points, runtime access, historical Compose resources,
shared volumes/networks, external data, branch identity, and retry state.
Ask the documented discard-or-cancel question before destroying changes.
Resolve hard blockers and obtain applicable approvals before stopping processes
or removing runtime resources.
Do not treat this skill's invocation as approval for every separate data-loss
decision in that policy.

## Native Session Handoff

1. Load `inspect-git-state` and call `task_worktree` with `action: inspect`.
   Record canonical project identity, exact target, branch ref/tip, registration,
   native owner, status, runtime inventory, approvals, and completed operations.
2. Reject the canonical checkout, primary/standalone repositories, filesystem
   roots, home directories, symlink targets, and ancestors of retained checkouts.
3. If the session is in the target or a descendant, call `action: leave`.
   It requests a move to the canonical checkout; it does not remove anything.
   Wait for the next step boundary and call inspect again to verify the active
   session is outside the target.
4. Run all cleanup commands from that verified safe directory, with explicit
   `workdir` arguments outside the target.
   Do not stop the agent, its shell, or unrelated process groups.

## Native Removal And Branch Cleanup

Complete shared-policy process, runtime, and separately approved external-data
cleanup first.
Immediately before removal, revalidate the exact path, Git status against the
approved snapshot, registration, locks, nested checkouts/submodules, and mount
points. New changes require renewed consent. Revalidate these same conditions
when native removal leaves a folder, before asking the adapter to recover
ignored residue.

For a registered task worktree, call `task_worktree` with `action: remove`, the
exact absolute `directory`, and `force: false` first.
Use `force: true` only when required and already authorized by the shared policy;
do not use it to bypass locks, mounts, unknown ownership, or a failed strategy.
The adapter calls the native recorded owner's removal operation, verifies that
the exact target is no longer registered, and then checks whether its folder
remains. If it does, the adapter may remove it only when every remaining entry
matches a pre-removal ignored-residue snapshot for that exact formerly
registered target. This private adapter recovery never follows symlinks and
rejects mounts, nested repositories/submodules, and nested registered
worktrees. It is not a generic recursive-delete API.
The profile asks for native removal permission, including the target and force
flag; this does not replace the shared policy's separate data-loss checks.
If the native owner is unavailable or removal fails, stop and report the partial
result; do not fall back to raw Git removal of a valid registered worktree.

If the response reports `registrationRemoved: true` but `folderRemoved: false`,
preserve the local branch and report its precise reason. The adapter has already
attempted only its verified ignored-residue recovery; do not use raw `rm -rf` or
reinterpret an unresolved native-owner failure as an unregistered leftover.
For a genuinely unregistered leftover folder or exact stale Git metadata that
native inventory cannot represent, stop and report the recovery checks from the
shared policy. Distinguish missing resources from inspection failures.

Confirm the native response reports both `registrationRemoved: true` and
`folderRemoved: true`, then refresh native inventory through `action: inspect`
and confirm the target is absent there too. Only then delete the verified
unchanged local task branch, provided it is not checked out elsewhere, using the
shared policy's branch cleanup procedure.
A detached worktree needs no branch deletion.
Preserve remote branches, stashes, caches, and shared services.

Report session destination, target/owner, approvals, runtime cleanup,
folder/registration/inventory state, branch result, preserved resources,
and any resumable partial failure.

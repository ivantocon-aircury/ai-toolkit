---
name: audit-worktrees
description: Audit ALL existing worktrees under ~/work/worktrees across projects, compare their work with main, master, preview, and staging, and identify integrated cleanup candidates. Delegate only explicitly approved targets to clean-worktree; never delete on an audit-only request.
compatibility: Git and OpenCode v2 with the toolkit task_worktree plugin for cleanup.
---

# Audit Worktrees

## Inventory Every Project

Scan `~/work/worktrees` read-only, including hidden entries and legacy directory
names. Do not follow directory symlinks or traverse dependencies recursively.
Inspect project children for worktree roots and cross-check each repository's
`git worktree list --porcelain` and resolved common Git directory.
Report unregistered folders, missing checkouts, permission failures, and unknown
entries separately; do not silently omit them or delete them as worktrees.
Include registered worktrees outside the root as out-of-scope information.
Do not change the active session merely to inspect another repository.

Load `inspect-git-state`. For every worktree, record exact path, repository,
branch or detached HEAD, tip, lock state, and staged/unstaged/untracked status.
Inventory ignored files separately: integrated commits do not prove these files
are disposable. Never expose secret file contents.

## Compare All Integration Branches

For each repository resolve every existing local and remote-tracking branch
named exactly `main`, `master`, `preview`, or `staging`. Compare each distinct
tip, not merely the repository default. Report absent refs and stale or unknown
remote freshness. Do not fetch without authorization; offer a fetch if necessary
before a deletion decision that depends on remote freshness.

For each target tip:

1. Test whether the worktree tip is an ancestor of the integration tip using
   `git merge-base --is-ancestor`. Exit 1 means not integrated; other errors are
   inspection failures, not a negative result.
   Ancestry proves historical integration, not that the effect still exists.
   Check subsequent changes to the task's affected paths for reverts or lost
   effects before recommending removal; uncertainty means preserve for review.
2. For non-ancestor histories, compare the aggregate task diff from a verified
   merge base, patch equivalence, and resulting relevant file contents. Squash
   and cherry-pick integration require evidence beyond commit ancestry.
   `git cherry` alone is insufficient for squashes or merge commits.
3. Label ancestry-proven work as integrated. Label non-ancestral equivalence as
   a candidate requiring review unless the complete task effect is demonstrably
   present in that integration tip. Never use a clean worktree, matching subject,
   empty unique-commit count, or one matching patch as proof of full integration.
4. Keep divergent, partially applied, reverted, or uncertain work. Flag missing
   merge bases, shallow histories, and failed comparisons as unresolved.

Integration into any one named branch is sufficient to identify a candidate;
show which branch/ref and evidence. Do not require integration into all four.
Never propose removing canonical checkouts or integration-branch worktrees.
Flag active sessions/processes, locks, dirty files, and ignored data separately.

## Approve Then Delegate

Return a table with project, exact path, branch/tip, integration ref/evidence,
dirty/ignored state, blockers, and recommended action. An audit is read-only.
Ask the user to select exact candidates and explicitly approve permanent loss
of their staged, unstaged, untracked, and ignored files and local task branches.
Do not treat integrated commits as permission to discard uncommitted work.

For approved targets, invoke `clean-worktree` sequentially with the absolute
folder and approval scope. When changing projects, use OpenCode's native
`session_move` with the verified owning project's canonical directory, not
`task_worktree select` (which is project-bound and rejects canonical checkouts).
Wait for the next step boundary so location-specific plugins/tools reload.
Call the newly active `task_worktree inspect` and inspect Git state to verify
the session directory, canonical repository identity, and target registration
all belong to the intended project before invoking its `clean-worktree`.
If tools still belong to the previous project, stop that target and report the
handoff failure; do not use the previous project's adapter or a raw Git fallback.
Use absolute working directories throughout and retain the original safe
session directory for a verified return after the batch, if it still exists.
Revalidate refs, tip, status, and integration evidence immediately before each
cleanup. Changed evidence requires renewed review and approval.
Let `clean-worktree` handle Docker ownership, full-folder removal, local-branch
deletion, and partial failures. Never implement a second recursive-delete flow.
Continue independent approved targets after a failure, retaining a per-target
result. Report removed, preserved, blocked, and failed resources distinctly.
Do not remove the audit's active worktree unless it was explicitly selected.

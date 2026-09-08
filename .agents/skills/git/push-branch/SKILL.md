---
name: push-branch
description: Use when preparing and pushing a Git branch to a remote. Verifies the intended worktree, branch, upstream, remote, commits, and divergence before publishing; sets upstream tracking when needed; and never force-pushes or resolves divergence implicitly.
---

# Push Branch

Use this atomic skill to publish the intended local branch safely. It does not create commits or pull requests.

## Related Skills

- Load `inspect-git-state` before and after pushing.
- Use `commit-changes` for relevant uncommitted work.
- Use `create-pull-request` after a successful push when a pull request is expected.

## Prepare

- Confirm the command is running in the task's intended worktree and on the intended branch, not a default or target branch by accident.
- Load `inspect-git-state` and review the branch, upstream, remotes, ahead/behind state, relevant commits, and all local changes.
- Confirm the selected remote is the intended repository. Do not assume `origin` when multiple plausible remotes exist.
- Relevant uncommitted changes must be committed or explicitly left for later before publication. Do not hide them with a stash or discard them.
- Do not include unrelated commits merely because they are reachable from the branch. Compare the branch with its intended base and stop if branch history is not the coherent unit expected by the caller.

## Push

- When the branch has no upstream, use `git push -u <remote> <branch>`.
- When the intended upstream already exists, push normally without changing it.
- If the remote branch or upstream points somewhere unexpected, stop and ask rather than rewriting configuration.
- If the push is rejected or histories have diverged, report the exact state and return control to the caller. Do not force-push, reset, rebase, merge, or pull implicitly.

## Verify And Report

Load `inspect-git-state` after the push and report the remote, branch, upstream, pushed commit range, and any remaining ahead/behind or local-change state. Do not claim publication succeeded until Git reports success and tracking state is consistent.

## Review Checklist

- The intended worktree, branch, remote, and upstream were verified.
- Relevant local work was not omitted accidentally.
- Branch history is coherent relative to the intended base.
- No force push or implicit history integration occurred.
- The post-push tracking state was verified.

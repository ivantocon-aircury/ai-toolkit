---
name: push-branch
description: Use ONLY when the user explicitly asks to push or publish a Git branch, or as the publication prerequisite of an explicitly requested pull request. Verifies remote state, follows the repository's integration policy, and never force-pushes implicitly.
---

# Push Branch

Use this atomic skill after an explicit push request or as the necessary
publication step of an explicit pull-request request. A commit or completed
implementation alone does not authorize a push.

## Related Skills

- Load `inspect-git-state` before and after pushing.
- Use `commit-changes` for relevant uncommitted work.
- Use `create-pull-request` after a successful push when a pull request is expected.

## Prepare

- Confirm the command is running in the task's intended worktree and on the intended branch, not a default or target branch by accident.
- Load `inspect-git-state` and review the branch, upstream, remotes, ahead/behind state, relevant commits, and all local changes.
- Resolve remote and base by precedence: explicit request, repository instructions,
  current upstream and remote default, then `origin` and its default branch. Ask
  only when multiple plausible choices remain.
- Relevant uncommitted changes must be committed or explicitly left for later before publication. Do not hide them with a stash or discard them.
- Do not include unrelated commits merely because they are reachable from the branch. Compare the branch with its intended base and stop if branch history is not the coherent unit expected by the caller.
- Fetch the resolved remote and verify the target refs. Follow the repository's
  documented integration policy. If none exists, rebase only unpublished task
  commits onto the resolved remote base before first publication.
- If integration conflicts, return control to the main workflow for task-owned
  edits and rerun `verify-changes` afterward. Never skip commits or invent a
  merge strategy. Do not rewrite published commits without explicit direction.

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
- The repository's integration policy was followed against current remote state.
- No force push or implicit history integration occurred.
- The post-push tracking state was verified.

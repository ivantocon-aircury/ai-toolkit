---
name: inspect-git-state
description: Use when checking Git repository, branch, worktree, commit, remote, or publication state before or after development operations. Trigger before creating worktrees, committing, pushing, opening pull requests, or declaring Git work complete. This skill is read-only and reports state; it never changes Git state.
---

# Inspect Git State

Use this skill as the single source of truth for read-only Git inspection. Report facts needed by the calling workflow without changing files, refs, branches, worktrees, remotes, the index, or the network.

## Delegation

Delegate command execution and output analysis to the `executor` subagent, as required by the global subagent policy. Tell it the repository or worktree path and the specific inspection goal. Do not delegate workflow decisions to it.

## Baseline Inspection

Collect the smallest relevant set of facts:

```bash
git status --short --branch
git rev-parse --show-toplevel
git branch --show-current
git worktree list --porcelain
git remote -v
git log --oneline -10
```

- Use `git diff` and `git diff --cached` when changes or staging matter.
- Inspect untracked paths explicitly; a diff alone does not include them.
- Inspect the current branch's upstream and ahead/behind state when push or pull-request readiness matters.
- Compare the current repository root with `git worktree list --porcelain` to identify the current checkout and whether it is the primary checkout or a linked worktree.
- Add targeted read-only commands only when the caller needs more evidence, such as checking whether a ref exists or comparing the proposed PR head with its base.
- Do not fetch unless the user or calling workflow has approved a network operation. State when remote conclusions rely only on local tracking refs.

## Report

Return the facts relevant to the caller, including:

- Repository root, current worktree path, and current branch or detached-HEAD state.
- Whether the checkout is the primary checkout or a linked worktree.
- Staged, unstaged, and untracked changes, with apparent unrelated or sensitive paths called out rather than discarded.
- Relevant local and remote-tracking refs, upstream state, and remotes.
- Recent commit-message conventions when commit naming is needed.
- Any ambiguity that must be resolved before a write operation.

Never describe a repository as clean based only on `git diff`; include staged and untracked state.

## Review Checklist

- Inspection was performed in the intended repository or worktree.
- The index, worktree, refs, remotes, and network were not changed.
- The report distinguishes observed remote-tracking state from current remote state.
- Untracked and potentially unrelated changes are visible to the caller.

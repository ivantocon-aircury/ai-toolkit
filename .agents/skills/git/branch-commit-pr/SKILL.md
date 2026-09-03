---
name: branch-commit-pr
description: Use when the user asks to create a Git branch from current work, commit the current changes, push the branch, and open a GitHub pull request against a specified target branch. Trigger for requests to "make a PR", "commit and push", "open a pull request", or complete a branch-to-PR workflow, even if the user only specifies the target branch. Use `commit-changes` for the commit when that skill is available.
---

# Branch, Commit, And Pull Request

Use this skill to turn the current repository changes into a pushed Git branch and GitHub pull request. Keep the user in control of what is published: inspect the repository first, make the commit content explicit, and return the PR URL.

## Required Information

Establish these details before making remote changes:

- The work reference, such as `PROJ-123` or `#456`. Ask for it when it is not supplied. It identifies the work consistently across the branch, commit, and pull request.
- The target branch for the pull request. Ask when it is not supplied.
- A working branch name. Use one supplied by the user. When the current branch is already a suitable non-target feature branch, ask whether to use it; otherwise propose a concise name based on the work.
- A commit message and PR title. Derive them from the change when the user has not supplied them, and state the proposed wording before committing.

Do not create a PR whose head and target branches are the same. If the target branch does not exist locally or on the configured remote, stop and ask for the intended branch.

## Reference Format

Use the supplied reference in every published identifier:

- Branch: `<reference>_<branch-name>`, for example `PROJ-123_add-export`.
- Commit subject: `<commit message> [<reference>]`, for example `Add CSV export [PROJ-123]`.
- Pull request title: `<PR title> [<reference>]`, for example `Add CSV export [PROJ-123]`.

If the reference contains characters Git does not permit in branch names, ask for a branch-safe reference or an approved branch-safe representation. Keep the original reference in the commit subject and PR title unless the user instructs otherwise.

## Inspect Before Changing Git State

Run these checks before creating a branch, staging files, committing, pushing, or creating the PR:

```bash
git status --short
git branch --show-current
git remote -v
git log --oneline -10
```

- Review the diff and untracked files to understand exactly what `current changes` includes.
- Warn and ask before staging apparent secrets, generated artifacts, unrelated files, or changes whose ownership is unclear. Do not silently discard anything.
- If there are no changes to commit, explain that no branch/commit/PR can be created from current work and ask whether the user instead wants a PR for existing commits.
- Confirm that `origin` points to the intended GitHub repository. If no suitable GitHub remote exists, stop rather than pushing to an unknown destination.
- Check that GitHub CLI authentication is available before the final PR step. Use `gh auth status` and report the actionable failure if authentication is missing.

## Create The Branch

- Keep the current working tree intact. Creating a branch from the current `HEAD` preserves the user’s uncommitted changes.
- Construct the working branch as `<reference>_<branch-name>`. If the current branch is not that branch, create and switch to it with `git switch -c <reference>_<branch-name>`.
- If the chosen branch already exists locally, switch to it only after confirming it is the intended branch. If it exists only on the remote, ask whether to track and reuse it or choose a new name.
- Do not switch to, reset, rebase, merge, or force-push the target branch as part of this workflow.

## Commit Changes

If the `commit-changes` skill is available, load and follow it for the commit. It owns the commit-specific process and any project conventions.

Otherwise:

- Stage only the reviewed current changes. When the user explicitly means every reviewed change, use `git add -A`; otherwise stage the agreed paths individually.
- Re-check the staged diff with `git diff --cached` before committing.
- Create one concise commit describing the actual change, with the reference suffix: `<commit message> [<reference>]`. Do not amend an existing commit unless the user explicitly requests it.
- If Git rejects the commit because hooks fail, report the failure and fix it only when it is within the user’s requested work. Never bypass hooks.

## Push And Open The Pull Request

- Push with upstream tracking: `git push -u origin <branch-name>`.
- If the push is rejected because the remote branch has diverged, stop and ask how to proceed. Do not force-push.
- Check for an existing open PR for the branch before creating a new one, for example with `gh pr list --head <branch-name> --state open`.
- If no PR exists, create it with `gh pr create`, using the specified target with `--base <target-branch>` and the working branch with `--head <branch-name>`.
- Use a clear title based on the committed change with the reference suffix: `<PR title> [<reference>]`. Include a short summary and tests run in the body; state `Not run (not requested)` when no checks were run. Do not invent test results, issue references, reviewers, labels, or draft status.
- If `gh` reports that a PR already exists, return that PR rather than creating a duplicate.

## Completion Report

Report:

- The branch name and target branch.
- The commit SHA and message.
- The push result.
- The pull request URL.
- Tests or checks run, including failures or checks not run.

Do not claim the pull request was created until `gh` returns its URL.

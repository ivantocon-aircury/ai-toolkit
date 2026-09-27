---
name: create-pull-request
description: Use ONLY when the user explicitly asks to create or locate a GitHub pull request. Verifies and publishes the intended branch when needed, reviews the complete change, avoids duplicates, and returns the confirmed URL.
---

# Create Pull Request

Use this atomic skill only after an explicit user request to create or locate a GitHub pull request. A completed implementation or pushed branch does not authorize PR creation. A pull request may contain multiple logical commits.

## Related Skills

- Load `inspect-git-state` for repository, branch, worktree, and change state.
- Use `verify-changes` before publication.
- Use `push-branch` when the head or intended commits are not published. The
  explicit PR request authorizes this prerequisite push.
- Return PR state to `development-lifecycle` or the calling workflow.

## Verify Readiness

- Resolve head, remote, and base from the explicit request, repository
  instructions, upstream and remote default, then global defaults. Ask only when
  ambiguity remains.
- Do not create a PR whose head and base are the same.
- Verify that the base exists and that the head branch and all intended commits are pushed.
- Confirm that `push-branch` published the intended current head according to the
  repository's integration policy. Return to it if remote state changed.
- Review the complete head-to-base commit list, diff, and changed paths. The title and body must describe the whole PR, not only the latest commit.
- Stop for relevant uncommitted changes, accidentally included unrelated commits
  or files, or commits that should be separated. Ask before invoking
  `commit-changes` unless commits were already explicitly authorized. Do not
  rewrite history in this skill.
- Confirm the selected remote is the intended GitHub repository and run `gh auth status` before attempting creation.

## Find Or Create

- Check for an existing open pull request for the exact remote and head branch, for example with `gh pr list --head <branch> --state open`.
- If one exists, verify its base and return its URL rather than creating a duplicate. Ask before changing an existing PR's base or metadata.
- Otherwise use `gh pr create --base <base> --head <branch>`.
- Follow demonstrated repository title conventions and preserve explicit issue references. Do not invent issue references, reviewers, labels, milestones, or draft status.
- Write a concise body with a summary and the checks actually run. State that checks were not run when applicable; never invent results.

## Report

Report the head and base branches, included commit range, PR title, and URL. Do not claim a PR exists until `gh` returns or confirms its URL.

## Review Checklist

- The PR represents a coherent unit of work, regardless of commit count.
- Head, base, remote, pushed state, commits, and diff were reviewed.
- No duplicate PR was created.
- Title, body, and test results are accurate.
- The confirmed PR URL was returned.

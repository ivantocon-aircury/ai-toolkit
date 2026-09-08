# Worktree Policy

## Scope

For feature work, bug fixes, and other code changes, work in a dedicated Git worktree.
Never modify the primary checkout.

The only exception is when the user explicitly asks to change OpenCode configuration or agent instruction files in the primary checkout.
Do not use this exception for application code, tests, documentation, generated files, or Git metadata.

## Before Starting

Before creating a branch or worktree, always ask the user for the base branch.
Do not assume `main`, `master`, the currently checked-out branch, or a remote default branch.

Determine the repository root and inspect `git worktree list` and existing branches before creating anything.
Treat the first worktree reported by `git worktree list --porcelain` as the primary checkout.

Verify that the selected base branch resolves locally or as a remote-tracking ref.
If it is unavailable, ask the user how to proceed.
If the selected local base branch is behind its remote-tracking branch, ask whether to start from the local or remote-tracking ref.
Do not update the base branch in the primary checkout.

## Naming And Location

Use these branch names:

- Features: `feature/<short-description>`
- Bug fixes: `fix/<short-description>`

Use a lowercase kebab-case `<short-description>`, such as `user-settings`.
For work that is neither a feature nor a bug fix, ask the user for the branch prefix before creating it.

Create each worktree at:

```text
../<project_folder_name>_worktrees/<branch-name-with-slashes-replaced-by-dashes>
```

Derive `<project_folder_name>` from the repository root directory name.

For example, a `feature/user-settings` branch in a project named `my-app` uses:

```text
../my-app_worktrees/feature-user-settings
```

## Creating Or Reusing Worktrees

If the requested branch is already checked out in a worktree, reuse that worktree.
Before reusing it, inspect its Git status.
If it has uncommitted changes, report them and ask the user before making further changes.

If the branch exists but is not checked out in a worktree, create the requested worktree from that branch without creating a second branch.
If the destination path already exists and is not the matching worktree, stop and ask the user how to proceed.

If the branch does not exist, create it from the user-selected base branch together with its worktree.
Do not create an alternate branch name to work around a collision without the user's approval.

## While Working

After creating or selecting a worktree, perform all project analysis, edits, tests, builds, commits, and Git operations from that worktree.
Do not run `git switch`, `git checkout`, or `git pull` in the primary checkout.
The only Git write allowed from the primary checkout is `git worktree add` to create the dedicated worktree.
Do not edit files, stage changes, commit, switch branches, or update branches in the primary checkout.

If changes were made in the primary checkout before a worktree was created, first transfer and commit those exact changes in the dedicated worktree.
After verifying that the primary checkout's copies match the committed versions, restore or remove only those transferred files from the primary checkout to leave it clean.

Keep one task scoped to its dedicated branch and worktree.
Report the selected branch and worktree path before implementation begins.

## Cleanup

Never remove a worktree or delete its branch without explicit user approval.

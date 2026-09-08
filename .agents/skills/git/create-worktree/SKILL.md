---
name: create-worktree
description: Use only after a decision has been made to create or reuse a Git worktree for a task. Determines a repository-conventional branch name, safely creates or selects the worktree, verifies it, and establishes that all subsequent work must run there. It does not decide whether a task needs isolation.
---

# Create Worktree

Use this atomic skill to execute worktree creation or reuse. The caller owns the decision to use a worktree; this skill owns branch naming, collision checks, creation, verification, and the handoff to the selected path.

## Related Skills

- Use `inspect-git-state` before and after creation.
- Use `worktree-workflow` to decide whether isolation is appropriate and whether confirmation is required.
- Return the selected branch and path to `development-lifecycle` or the calling implementation workflow.

## Resolve The Branch And Base

- Prefer an explicit user-supplied branch name, then an established repository or issue-reference convention, then the repository's documented branch prefixes.
- In this configuration repository's established convention, use `feature/<short-description>` for features, `fix/<short-description>` for bug fixes, and `refactor/<short-description>` for significant refactors. Use lowercase kebab-case for the description.
- Do not invent an issue reference. Preserve a supplied reference according to the target repository's demonstrated convention.
- For other task types, follow a demonstrated repository convention. If none exists and the prefix is ambiguous, ask the user in interactive operation rather than guessing.
- Use an explicitly selected base ref when provided. Otherwise inspect the repository's default branch, the current branch and upstream, and the task context. Ask when more than one base is plausible; do not silently update, reset, or switch the primary checkout.
- Verify that the selected base resolves locally or as a remote-tracking ref. If local and remote-tracking versions differ, make the selected starting point explicit.

## Resolve The Location

Use the existing location convention unless the repository documents another one:

```text
../<project-folder-name>_worktrees/<branch-name-with-slashes-replaced-by-dashes>
```

Derive the project folder from the repository root. For `feature/user-settings` in `my-app`, use `../my-app_worktrees/feature-user-settings`.

## Create Or Reuse Safely

1. Load `inspect-git-state` and inspect the repository, all registered worktrees, the proposed branch, and the destination path.
2. If the current session is already in the worktree for the selected branch, verify its status and return it without creating another worktree.
3. If the selected branch is checked out in another worktree, reuse that path only when it is the intended task worktree. Report existing changes and ask before continuing when ownership is unclear.
4. If the branch exists but is not checked out, create the worktree from that branch without creating another branch.
5. If the branch does not exist, create it with the worktree from the verified base ref, for example `git worktree add -b <branch> <path> <base-ref>`.
6. If the destination exists but is not the matching registered worktree, stop. Never delete it or choose an alternate branch or path merely to bypass a collision.
7. Do not move, copy, stash, discard, or commit pre-existing changes as part of worktree creation. Return control to the caller if changes must be assigned or migrated first.

## Verify And Handoff

After creation or reuse:

- Load `inspect-git-state` for the selected path.
- Verify that its repository root, branch, `HEAD`, base ancestry, and registration in `git worktree list` match the intended result.
- Report the absolute worktree path, branch, and base ref.
- Require every subsequent analysis, edit, test, build, commit, push, and PR command for the task to use the selected worktree as its working directory.
- Do not continue task work from the checkout that invoked this skill. A shell `cd` is not a persistent handoff; callers must pass the worktree path as `workdir` or equivalent on every operation.

Never remove a worktree or delete its branch as part of this skill.

## Review Checklist

- Branch naming follows explicit or demonstrated repository conventions.
- The base ref and any local/remote difference were made explicit.
- No branch or path collision was bypassed.
- The worktree is registered, on the intended branch, and based on the intended ref.
- The caller has the absolute path and will continue all task work there.

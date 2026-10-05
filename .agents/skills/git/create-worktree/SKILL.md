---
name: create-worktree
description: Use only after a decision has been made to create or reuse a Git worktree for a task. Determines a repository-conventional branch name, safely creates or selects the worktree, verifies it, and establishes that all subsequent work must run there. It does not decide whether a task needs isolation.
---

# Create Worktree

Use this atomic skill to execute worktree creation or reuse. The caller owns the decision to use a worktree; this skill owns branch naming, collision checks, creation, verification, and the handoff to the selected path.

## Related Skills

- Use `inspect-git-state` before and after creation.
- Use `worktree-workflow` to decide whether isolation is appropriate.
- Return the selected branch and path to `development-lifecycle` or the calling implementation workflow.

## Resolve The Branch And Base

- Prefer an explicit user-supplied branch name, then repository instructions and
  demonstrated history, then the global fallback `feature/`, `fix/`, or
  `refactor/` with a short lowercase kebab-case description.
- Do not invent an issue reference. Preserve a supplied reference according to the target repository's demonstrated convention.
- If no local convention exists, choose the narrowest sensible global fallback.
  Ask only when multiple materially different choices remain plausible.
- Use an explicit base when supplied. Otherwise infer it from repository
  instructions, the remote default branch, current branch and upstream, and task
  context. Ask only when that evidence remains ambiguous; never reset or switch
  the primary checkout.
- Verify that the selected base resolves locally or as a remote-tracking ref. If local and remote-tracking versions differ, make the selected starting point explicit.

## Resolve The Location

Unless the repository documents another location, create task worktrees under
the shared worktree root:

```text
~/work/worktrees/<project>/<branch-or-task>
```

Derive `<project>` from the repository root folder and replace slashes in the
branch or task name with hyphens. For `/work/my-app` and
`feature/user-settings`, use
`~/work/worktrees/my-app/feature-user-settings`.

## Create Or Reuse Safely

1. Load `inspect-git-state` and inspect the repository, all registered worktrees, the proposed branch, and the destination path.
2. If the current session is already in the worktree for the selected branch, verify its status and return it without creating another worktree.
3. If the selected branch is checked out in another worktree, reuse that path only when it is the intended task worktree. Report existing changes and ask before continuing when ownership is unclear.
4. If the branch exists but is not checked out, create the worktree from that branch without creating another branch.
5. If the branch does not exist, create it with the worktree from the verified base ref, for example `git worktree add -b <branch> <path> <base-ref>`.
6. If the destination exists but is not the matching registered worktree, stop. Never delete it or choose an alternate branch or path merely to bypass a collision.
7. Do not move, copy, stash, discard, or commit pre-existing changes as part of worktree creation. Return control to the caller if changes must be assigned or migrated first.

## Copy And Install Runtime Dependencies

After creating a new worktree, copy available dependency directories from the
invoking checkout to seed installation, then install dependencies for every
applicable JavaScript and PHP package in the selected worktree.
Copying is an optimization, not evidence that dependencies are current.
Never overwrite dependencies in a reused worktree with copies from another
checkout; still run its applicable dependency installation commands.

- If the source checkout has a non-symlink `node_modules/` directory, copy it into the new worktree with `cp -a --reflink=auto -- <source-path>/node_modules <worktree-path>/`.
- If the source checkout has a non-symlink `vendor/` directory, copy it into the new worktree with `cp -a --reflink=auto -- <source-path>/vendor <worktree-path>/`.
- Use copies, not symlinks or hard links, so package-manager writes in one worktree
  cannot modify another.
  `--reflink=auto` uses copy-on-write storage when supported and otherwise makes
  a normal independent copy.
- Before seeding, inspect dependency symlinks as they would resolve at the target
  location, including absolute links and workspace or path-package links.
  Preserve local executable shims and other links that remain inside the selected
  worktree; skip seeding a directory with unresolved or external links and use
  the project's installation instead.
  Copying with `cp -a` preserves links, so it does not establish isolation alone.
- Do not copy other ignored files, caches, environment files, build outputs, or generated artifacts. Those may be branch-specific or contain secrets.
- If either directory is absent, skip its copy but still install dependencies
  when the selected worktree has the corresponding package manifest.
  If a copy fails, report it and proceed with installation.
- This dependency seeding is not migration of Git changes and is the sole exception to the no-copy rule above.

### Refresh Both Dependency Ecosystems

- Discover installation commands from project instructions, package manifests,
  lockfiles, package-manager declarations, CI, and documented setup wrappers.
  Follow container requirements and run commands in the selected worktree.
- Before installing in a reused worktree, inspect dependency-directory and
  package symlinks for external or shared targets.
  Follow documented project setup for intentional path packages, but do not
  mutate another checkout through an unexplained dependency link.
  If safe local installation cannot be established, clarify that link or report
  that ecosystem as blocked while proceeding with the other applicable install.
- For JavaScript packages, use the project's established package manager and
  lockfile-preserving install command even when `node_modules/` was copied.
  A clean install may replace the seeded directory; correctness takes precedence
  over preserving the copy's speed benefit.
- For Composer packages, run the project's dependency install command even when
  `vendor/` was copied.
  Install the versions selected by the target lockfile, not newer dependency
  versions through an update operation.
- In mixed projects, run both installations independently.
  In monorepos, use the documented workspace-root installation once for its
  managed members; do not run duplicate leaf installs or require leaf lockfiles.
  Discover nested manifests and install separately only when they belong to
  independently managed package roots.
- Do not skip one ecosystem because the other succeeded or failed.
  Do not introduce a package manager or silently rewrite manifests or lockfiles.
  If a required lockfile, tool, network connection, or setup prerequisite is
  missing, report the blocked command and its reason.
- Inspect the result for install-script changes and unexpected tracked changes.
  Do not discard existing work or report the worktree as dependency-ready unless
  every applicable installation succeeded.

## Verify And Handoff

After creation or reuse:

- Load `inspect-git-state` for the selected path.
- Verify that its repository root, branch, `HEAD`, base ancestry, and registration in `git worktree list` match the intended result.
- Report copied or absent dependency directories, each installation command and
  result, and any copy failure, blocked installation, or unexpected file change.
- Report the absolute worktree path, branch, and base ref.
- Require every subsequent analysis, edit, test, build, commit, push, and PR command for the task to use the selected worktree as its working directory.
- Do not continue task work from the checkout that invoked this skill. A shell `cd` is not a persistent handoff; callers must pass the worktree path as `workdir` or equivalent on every operation.

Never remove a worktree or delete its branch as part of this skill.

## Review Checklist

- Branch naming follows explicit or demonstrated repository conventions.
- The base ref and any local/remote difference were made explicit.
- No branch or path collision was bypassed.
- The worktree is registered, on the intended branch, and based on the intended ref.
- Available `node_modules/` and `vendor/` directories were copied independently into a newly created worktree.
- Every applicable JavaScript and Composer installation ran in the selected
  worktree, including when dependencies were copied or the worktree was reused.
- Installation respected project tooling and lockfiles; failures were reported
  without claiming dependency readiness.
- Copied and existing dependency links were checked for isolation, and workspace
  members did not trigger redundant installs.
- The caller has the absolute path and will continue all task work there.

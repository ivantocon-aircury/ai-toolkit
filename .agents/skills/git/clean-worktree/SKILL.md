---
name: clean-worktree
description: Use ONLY when the user directly commands `clean-worktree` or `/clean-worktree`. It removes the chat's active linked worktree by default, or one explicitly identified target, along with its verified Docker Compose containers and safe project networks, then force-deletes its local branch. Do not invoke for general cleanup requests, mentions of this skill, implementation completion, branch cleanup, or discussion of cleanup.
---

# Clean Worktree

Use this destructive cleanup workflow only when the user directly commands
`clean-worktree` or `/clean-worktree`, optionally followed by a target, for
example, `/clean-worktree /absolute/path`.
The command form is a deliberate consent boundary: a mention of this skill in a
question, document, review, negation, or discussion is not an invocation.
Never infer it from a request to finish work, clean up, delete a branch, or
remove a worktree.

Clean exactly one target worktree at a time.
When no target is supplied, capture the repository root of the chat's active
worktree before changing execution context and use it as the target.
When a target is supplied, require an absolute path or a branch that resolves
to one registered linked worktree.
Do not sweep stale worktrees or choose a target from a list.

## Scope

This skill removes, in order:

1. Docker Compose containers whose `com.docker.compose.project.working_dir`
   label equals the target's canonical absolute path.
2. Docker Compose networks for those projects only when every container with
   the project label belongs to that same target path.
3. The target worktree.
4. Its local branch, including an unmerged branch.

The worktree directory removes its local ignored runtime dependencies, build
outputs, and other workspace-local files.

Do not remove Docker volumes, images, remote branches, Docker resources without
the target-path label, caches outside the worktree, or resources belonging to a
different worktree.
Preserving volumes and images avoids deleting persistent or shared data merely
because a disposable checkout is being removed.

## Preconditions

Capture the target path first and canonicalize it immediately. Match that
canonical path against canonical registered-worktree paths, identify whether it
is the primary checkout, and resolve its branch before changing execution
context. Refuse a primary checkout at this stage, before inspecting or removing
Docker resources.

Then select a different registered checkout of the same repository and run
every inspection and destructive command from that checkout. This handoff lets
the skill remove the worktree that hosted the chat without deleting the shell's
own working directory.

Load `inspect-git-state` first and verify all of the following:

- The target is a registered linked worktree, not the primary checkout.
- The canonical current working directory is outside the target tree; reject the
  target itself and every directory beneath it.
- The target has no staged, unstaged, untracked, or ignored-submodule changes
  according to `git -C <target> status --porcelain=v1 --untracked-files=all
  --ignore-submodules=none`.
- Its branch name is available from `git worktree list --porcelain`.

If any precondition fails before a destructive operation, explain the blocking
condition and leave every resource unchanged.
Never use `git worktree remove --force`, `rm -rf`, `git clean`, or Git reset.
If the captured or supplied target is the primary checkout, refuse cleanup.

## Docker Compose Cleanup

First require a usable local Docker daemon.
If Docker cannot be inspected, stop before removing the worktree so the user
does not lose the path needed to manage its running containers.

1. Canonicalize the target path. Resolve its Compose project name and declared,
   non-external networks from its Compose configuration before examining Docker.
   If the project cannot be resolved, stop and leave the workspace intact.
2. List all containers, including stopped containers. A container belongs to the
   target only when all of these agree with the resolved configuration: its
   `com.docker.compose.project.working_dir` label is the canonical target path,
   its `com.docker.compose.project` label is the resolved project name, its
   `com.docker.compose.project.config_files` label exactly matches the resolved
   Compose file list, and it has `com.docker.compose.version`. Preserve and
   report every partial or conflicting match.
3. Immediately re-check the target's Git status with the explicit status
   options from the preconditions. If it is no longer clean, stop before any
   container removal. Otherwise record the verified containers' IDs, names,
   project names, and Compose config-file labels, then force-remove only those
   recorded containers. This is intentional: the user named this skill to
   dispose of the workspace and its containers.
4. For each declared non-external network, list every container, including
   stopped containers, with the resolved project label. Remove the network only
   when every one is a verified target container, its Compose project and
   network labels match the resolved configuration, and network inspection
   confirms it has no remaining endpoints. Immediately re-check the target's
   Git status before each network removal; stop if it is no longer clean.
   Preserve and report any network with another worktree's container, an
   endpoint, missing labels, a mismatched label, or ambiguous ownership.
5. Re-list all containers matching the target path and resolved project, and
   stop before Git cleanup if any verified target container remains.

Do not use `docker compose down -v`: it can delete named volumes that may hold
data the user expects to keep.
If there are no target-labelled containers, report that Docker Compose had
nothing to remove and continue.

## Git Cleanup

After Docker cleanup succeeds:

1. Re-check the target's Git status with the explicit status options from the
   preconditions. If it is no longer clean, report that Docker resources may
   already be removed but retain the worktree and branch.
2. Run `git worktree remove <target-path>` without `--force`.
3. Confirm the target is absent from `git worktree list --porcelain`.
4. Run `git branch -D <target-branch>` from the remaining checkout. The user
   explicitly chose this skill, so delete even an unmerged local branch.
5. Confirm the local branch no longer resolves. `git worktree remove` has
   already removed the target's administrative metadata; do not run the
   repository-wide `git worktree prune` command.

If worktree removal fails, stop and retain the branch.
If branch deletion fails, report the failure without trying alternative
destructive Git commands.

## Report

State the target path and branch, removed container IDs or that none existed,
removed versus preserved project networks, worktree-removal result,
local-branch-removal result, and the intentionally retained volumes, images,
remote branches, and unidentifiable Docker resources.

## Review Checklist

- The user directly invoked `clean-worktree` or `/clean-worktree`; a mention or
  negated use did not qualify.
- Exactly one registered non-primary worktree was targeted.
- The target was clean, and commands ran outside it.
- Docker cleanup used target-path labels and did not remove volumes or images.
- The worktree was removed without force before its local branch was deleted.
- The completion report distinguishes deleted resources from intentionally
  retained ones.

---
name: clean-worktree
description: Use ONLY after the user explicitly invokes this skill or directly commands `clean-worktree` or `/clean-worktree`. It removes the chat's active linked worktree by default, or one explicitly identified worktree or leftover folder, with its verified Docker containers, volumes, and networks, then deletes its verified local branch. Asks before discarding uncommitted changes or proceeding with unresolved Compose configuration. Do not invoke for general cleanup requests, mentions of this skill, implementation completion, branch cleanup, or discussion of cleanup.
---

# Clean Worktree

## Activation Boundary

Use this destructive workflow only after an explicit user invocation: selecting
this skill through the available interface, or directly entering
`clean-worktree` or `/clean-worktree`, optionally followed by a target, for
example, `/clean-worktree /absolute/path`.

Skill interfaces can inject this file into the conversation without retaining
the original command text. When the skill is loaded through an explicit user
invocation, that invocation is the consent boundary: proceed with the workflow
and do not require a second literal-command match in the remaining
conversation.

Do not treat a skill load inferred from a general cleanup request, a mention in
a question, document, review, negation, or discussion as authorization. Never
infer authorization from a request to finish work, clean up, delete a branch,
or remove a worktree.

Clean exactly one target folder at a time, even if it is no longer a worktree.
When no target is supplied, capture the repository root of the chat's active
worktree before changing execution context and use it as the target.
When a target is supplied, require an absolute path or a branch that resolves
to one registered linked worktree.
Do not sweep stale worktrees or choose a target from a list.

## Scope

Remove the target's verified Docker containers, workspace-owned volumes and
networks, then its worktree registration if present, its folder, and its verified
local branch (including an unmerged branch) when registration removal succeeds.
Folder deletion includes ignored runtime dependencies and build outputs.
Preserve images, remote branches, external or shared Docker resources, and caches
outside the target.

## Target Inspection and Consent

1. Load `inspect-git-state`. Capture and canonicalize the target before changing
   execution context. Match canonical registered-worktree paths and record any
   verified owning repository and branch. A missing or broken `.git` file, absent
   registration, or failed Git inspection does not disqualify a leftover folder.
   Do not mistake an ancestor repository discovered by Git for the target itself.
2. Refuse a primary checkout, a standalone repository, a filesystem root, a home
   directory, or an ancestor of a checkout that must remain. Reject a symlink
   target rather than following it for recursive deletion. If the default target
   cannot be identified, ask for its absolute path; do not guess a parent folder.
3. Move execution outside the target and all its descendants, preferably to
   another checkout of the owning repository. If none is available, use a safe
   existing directory outside the target. Run all subsequent commands there.
4. Where Git is usable for the target itself, inspect
   `git -C <target> status --porcelain=v1 --untracked-files=all
   --ignore-submodules=none`. If staged, unstaged, untracked, or submodule changes
   exist, summarize the affected paths and ask through the native question tool:
   continue and permanently discard these changes, or cancel? Wait for explicit
   consent before removing any Docker resource or file. Cancellation leaves
   everything unchanged. Do not reset or clean files as a preliminary step.
5. If Git cannot inspect a leftover folder, explain that its changes cannot be
   assessed and ask the same discard-or-cancel question before deletion.
   Do not describe an uninspectable folder as clean.

Record the approved status snapshot. Re-check before each destructive phase,
including folder removal. If changes appear or differ from the approved snapshot,
describe them and ask again. If the user cancels after cleanup has begun, retain
the remaining resources and report what was already removed.

## Resolve Docker Ownership

Require a usable local Docker daemon. If Docker cannot be inspected, stop before
deletion and report the blocker.

Attempt to resolve the target's Compose configuration, including project name,
config-file list, non-external networks, and non-external volumes. Missing files,
missing environment values, unavailable includes, or invalid configuration can
prevent resolution. If it fails, show the reason without exposing secrets and
warn that some Docker dependencies may be left behind. Ask through the native
question tool whether to continue with verified Docker cleanup and removal of
the worktree/folder, or cancel. Wait for consent before any destructive action.
This confirmation does not authorize deleting resources of uncertain ownership.
Only treat Compose as inapplicable after Docker inspection confirms there are no
target-labelled resources and no evidence of an expected Compose configuration.
Missing configuration with target-labelled containers is an unresolved
configuration and requires the confirmation above.

List all containers, including stopped containers, before deleting anything.
Build and retain an inventory of container IDs, labels, mounts, and networks:

- Require `com.docker.compose.project.working_dir` to match the canonical target
  path, along with Compose project, config-file, and version labels.
- With resolved configuration, require project and config-file labels to agree
  with it. Preserve and report conflicting or partial matches.
- With unresolved configuration and consent to continue, use consistent Compose
  labels with the exact target path to identify containers. Do not infer ownership
  from a folder basename or project name alone.
- For each candidate project, inspect every container with its project label.
  A container belonging to another path or with ambiguous ownership means the
  project cannot establish exclusive ownership of its volumes or networks.
- A named volume or network needs matching Compose project and resource labels,
  exclusive project ownership, and a matching non-external declaration in the
  resolved configuration. Volume/network labels alone do not carry target-path
  ownership. Check other registered checkouts' configurations for references,
  including inactive consumers. Require a target-specific resolved resource name
  or equivalent independent ownership evidence; if sharing cannot be ruled out,
  preserve the resource. A lack of current container references is not sufficient.
- Record anonymous volumes attached exclusively to verified target containers.
  Check all containers for references before approving their removal.
- Without resolved configuration, preserve named volumes and networks unless
  independent evidence establishes both target ownership and non-external status.
  Report resources that cannot be verified; missing configuration is not a reason
  to abandon the approved folder removal.

## Docker Cleanup

1. Re-check Git changes and consent as described above. Force-remove only the
   recorded, verified target containers. Retain their mount inventory for cleanup
   after container deletion.
2. Remove verified workspace-owned named and anonymous volumes individually.
   Re-check references across all containers immediately before removal; preserve
   any shared, external, or ambiguous volume. Never force volume deletion.
3. Remove verified non-external project networks only after inspecting them and
   confirming there are no remaining endpoints.
4. Re-list target containers and approved resources. If a verified cleanup
   operation fails or a verified target container remains, stop and report the
   partial result. Ambiguous resources intentionally preserved under the approved
   unresolved-configuration path do not block folder removal.

Do not use global Docker prune commands or an indiscriminate
`docker compose down -v`. Bind-mounted paths outside the target are not removable
Docker volumes. If no verified Docker resources exist, report that and continue.

## Worktree and Folder Cleanup

After Docker cleanup, re-check Git changes and consent, then revalidate the exact
canonical target and its registration before removal:

1. For a valid registered linked worktree, run
   `git worktree remove <target-path>`. Use `--force` only when needed to discard
   explicitly approved changes or ignored files; never as an unexplained retry.
2. For a leftover folder with no valid registration, remove exactly that folder
   recursively using its quoted, validated absolute path. A targeted `rm -rf --
   <target-path>` is permitted here and for a residual folder after successful
   worktree removal, after the same path and consent checks. Never delete a parent,
   wildcard match, symlink destination, or another registered checkout.
3. If stale registration still names the target but its Git metadata is broken,
   first try targeted `git worktree remove` from the verified owning repository.
   If that fails because it is no longer a valid worktree, remove the validated
   folder anyway. Report any stale administrative entry left behind; do not run
   repository-wide `git worktree prune` or manually guess metadata to delete.
   Other removal failures are blockers, not permission to bypass Git safeguards.
4. Confirm the folder is absent and report whether registration remains.
   Only after folder and registration removal, delete a branch with
   `git branch -D <verified-target-branch>` from the owning repository, provided
   it is not checked out elsewhere. Never infer a branch from the folder name.
   For an unregistered folder with no verified branch, skip branch deletion.
5. Verify branch deletion when attempted. If it fails, report the failure without
   trying alternative destructive Git commands.

## Report

State the target path and whether it was a valid worktree or leftover folder,
consent decisions, removed containers, volumes and networks, preserved resources
and reasons, folder/registration removal results, and branch deletion or skip
reason. Clearly identify partial cleanup and unresolved Compose configuration.

## Review Checklist

- Explicit invocation authorized exactly one validated target.
- Commands ran outside the target; primary and unrelated checkouts were protected.
- Uncommitted or uninspectable changes required discard-or-cancel consent.
- Unresolved Compose configuration required continue-or-cancel consent.
- Docker ownership was verified; shared and external resources were preserved.
- A leftover folder was removed even without valid worktree registration.
- Branch deletion used verified identity only after folder/registration removal.
- The report distinguishes removed, preserved, failed, and skipped resources.

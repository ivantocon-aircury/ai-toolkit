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

Stop verified target processes, remove verified Docker containers, volumes and
networks, then its worktree registration if present, its folder, and its verified
local branch (including an unmerged branch) when registration removal succeeds.
Folder deletion includes ignored runtime dependencies and build outputs.
External bind-mount data and dedicated service resources require the separate
ownership and consent checks below. Preserve images and build caches, remote
branches, Git stashes, shared package caches, and shared databases or services.

## Resumable Cleanup

Treat an already-absent folder, container, volume, network, branch, or registration
as completed, after confirming absence in the verified repository/runtime.
Distinguish absence from inspection, permission, or connection failures.
Never require a folder to exist just to finish its verified remaining cleanup.
For a missing target, canonicalize its existing parent and retain the exact final
path component; check for symlinks before resolving paths.

Retain an execution inventory across phases: canonical target, owning repository,
branch/ref identity, administrative entry, runtime endpoint, resource IDs and
ownership evidence, approvals, and completed operations. Avoid secrets in reports
or persisted notes. On retry, revalidate that inventory and approvals against the
current state; do not trust names or reuse stale process IDs. If no prior inventory
exists, reconstruct only identities that can still be verified. Report resources
that can no longer be attributed rather than guessing them from a folder name.

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
5. If Git cannot inspect an existing leftover folder, explain that its changes cannot be
   assessed and ask the same discard-or-cancel question before deletion.
   Do not describe an uninspectable folder as clean.

Inspect worktree locks and their reasons before destructive action. Ask before
unlocking the exact target; decline or unresolved ownership stops cleanup.
Do not silently override a lock with repeated force options.

Inspect the target for nested repositories, registered worktrees, and initialized
submodules, including ignored directories. Outer Git status cannot establish
their cleanliness. Ask before deleting nested repositories or submodules and
inspect their changes separately. A separately registered nested worktree must
be cleaned as its own target first; do not bypass the one-target rule.
Inspect mount points at and beneath the target, including bind mounts on the same
filesystem. Do not traverse them during recursive deletion or silently unmount
them. Stop before destructive cleanup until the mounts are removed or the user
selects a scope that excludes them. Apply these checks to external deletion paths
too, and re-check immediately before folder removal.

Record the approved status snapshot. Re-check before each destructive phase,
including folder removal. If changes appear or differ from the approved snapshot,
describe them and ask again. If the user cancels after cleanup has begun, retain
the remaining resources and report what was already removed.

## Runtime Discovery and Ownership

Follow the project's actual runtime: Docker Compose, Podman, devcontainers, or
documented wrappers. Apply the same ownership, sharing, consent, and retry rules
to each; do not execute a devcontainer removal command that also removes the
workspace before these checks. Do not require Docker for a project proven to use
another runtime, or no runtime, exclusively.

For Docker, determine the effective daemon from explicit flags, `DOCKER_CONTEXT`,
`DOCKER_HOST`, context configuration, and project launch instructions. Record and
pin the resolved endpoint for inspection and cleanup without changing the global
context. Require a usable daemon when Docker is applicable. If it cannot be
inspected, stop before deletion. If launch evidence points to another context,
inspect that specific context rather than concluding there are no resources on
the current daemon. Ask if the intended endpoint is ambiguous; do not sweep all
contexts. A remote daemon's bind-mount paths belong to its host, not the client.

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
  with it for current resources. Also inventory every exact-target-path container
  from older project names and config-file lists. Group these by historical
  configuration identity and verify each separately using consistent labels and
  available launch/configuration evidence. Apply the unresolved-configuration
  confirmation to historical groups that cannot be resolved; do not silently
  preserve them just because they differ from today's configuration. Preserve
  genuinely conflicting or partial ownership matches and report them.
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

Inventory declared volumes and networks even if all containers are already gone.
Use resolved target-specific declarations or a revalidated prior inventory as
ownership evidence. An empty container list alone proves neither ownership nor
absence of remaining Docker resources.

## Processes and External Dependencies

Complete discovery, resolve hard blockers (locks, nested registered worktrees,
mounts, and runtime access), and obtain required consent before stopping anything.
Do not stop processes while folder cleanup is blocked. Inspect host
development servers, watchers, workers, test runners, and project supervisors.
Require ownership evidence such as an exact working directory under the target
plus command/executable or supervisor metadata. A matching port, command name,
or path string in arguments alone is insufficient. Exclude the agent, its shell,
and unrelated process groups. Prefer the project's targeted graceful stop command;
otherwise signal only verified processes, wait, and re-check identity before any
further signal. Ask before force-killing survivors. Stop if owned processes still
run or their ownership cannot be safely resolved; report suspected unrelated
processes without killing them. Do not kill container processes via host PIDs.
Re-check Git changes after shutdown because a process can write files as it exits.

Inventory bind mounts and project-documented external workspace data. Report
paths outside the target, including mount sources absent from today's config.
Delete one only if it is a dedicated canonical path owned exclusively by this
workspace, is not an ancestor of the target or another retained resource, and is
unused by other containers/processes/configurations. Summarize the exact paths
and data loss, then ask for separate consent before recursive deletion. Apply
the target's path, nested-checkout, and mount protections. For remote runtimes,
do not map daemon-host paths to similarly named local paths; use a documented
host-side procedure or preserve and report them.

For an external database, bucket, queue, or other service, use cleanup only when
project documentation explicitly marks the exact resource as disposable and
workspace-specific. Verify account/environment and identity, explain the effect,
and ask separately before deleting it through the documented procedure. Preserve
shared services and resources with uncertain ownership. Missing documentation is
a reason to report an external resource, not to invent deletion commands.

## Docker Cleanup

Run after host-process shutdown. Use the pinned runtime endpoint and equivalent
verified operations for the selected runtime. Stop containers gracefully first;
report a graceful-stop failure before force-removing verified target containers.

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
   partial result. Intentionally preserved shared, external, or ambiguous resources
   do not block folder removal once all applicable confirmations are satisfied.

Do not use global Docker prune commands or an indiscriminate
`docker compose down -v`. Bind-mounted paths outside the target are not removable
Docker volumes. If no verified Docker resources exist, report that and continue.

## Worktree and Folder Cleanup

After runtime and approved external cleanup, re-check Git changes and consent,
mounts and nested checkouts, then revalidate the exact
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
   folder anyway. Then use the exact-entry procedure below. Do not run
   repository-wide `git worktree prune` or guess metadata from the folder name.
   Other removal failures are blockers, not permission to bypass Git safeguards.
4. Confirm the folder is absent and report whether registration remains.
   Only after folder and registration removal, delete a branch with
   `git branch -D <verified-target-branch>` from the owning repository, provided
   it is not checked out elsewhere. Never infer a branch from the folder name.
   For an unregistered folder with no verified branch, skip branch deletion.
5. Verify branch deletion when attempted. If it fails, report the failure without
   trying alternative destructive Git commands.

### Exact Stale Registration

Prefer Git's targeted removal. If the folder is confirmed absent and targeted
removal cannot clear its stale entry, inspect the owning repository's resolved
Git common directory. Identify exactly one direct child of its `worktrees/`
directory whose `gitdir` points to the validated target's `.git` path. Cross-check
the registration, common-directory association, and recorded HEAD/branch when
available. Verify this is a stale entry, not a moved checkout or unavailable
mounted checkout. Do not follow symlinked administrative directories.

Before deleting metadata, explain that the entry may contain per-worktree index,
reflog, or other recovery state and ask for explicit consent to remove that exact
entry. Respect any lock and its separate approval. Re-check the folder is still
absent and no Git operation is using the entry; if this cannot be established,
retain it. Remove only the verified direct child, never the common directory,
`worktrees/` parent, object store, or another entry. Verify the registration is
gone before branch deletion. If identity is ambiguous or consent is declined,
retain and report the entry and branch; the folder may already be removed.

Record the branch ref and commit before cleanup; re-check before branch deletion.
If the ref changed, ask rather than deleting new work. Detached HEAD needs no
branch deletion. An already-missing branch is complete, not a failure.

## Report

State the target path and whether it was a valid worktree, leftover, or absent
folder; runtime/context; consent decisions; stopped processes; removed containers,
volumes, networks and approved external resources; preserved resources and reasons;
folder/registration removal results; and branch deletion or skip reason. Clearly
identify already-absent resources, partial cleanup, unresolved configurations, and
what evidence or action is needed to finish a retry.

## Review Checklist

- Explicit invocation authorized exactly one validated target.
- Commands ran outside the target; primary and unrelated checkouts were protected.
- Uncommitted or uninspectable changes required discard-or-cancel consent.
- Unresolved Compose configuration required continue-or-cancel consent.
- Docker ownership was verified; shared and external resources were preserved.
- Historical Compose groups and resources without containers were considered.
- Runtime endpoint was pinned; only verified host processes were stopped.
- Nested checkouts, mounts, locks, and external deletion approvals were checked.
- A leftover folder was removed even without valid worktree registration.
- Retries accepted absence; stale metadata cleanup targeted one verified entry.
- Branch deletion used verified identity only after folder/registration removal.
- The report distinguishes removed, preserved, failed, and skipped resources.

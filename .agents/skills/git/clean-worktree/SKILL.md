---
name: clean-worktree
description: Explicitly clean one worktree by folder, branch, or worktree name, defaulting to the active linked worktree. Discard everything worktree-specific - all its files, its Docker containers, volumes, networks, and built images, and its verified local branch - while preserving shared resources. Also accepts exact targets explicitly approved through audit-worktrees. Never infer cleanup from task completion.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# Clean Worktree

This is a one-worktree cleanup that removes everything specific to the target.
The native adapter performs the filesystem safety checks, so do not reproduce
them with process or recursive filesystem investigations. Docker discovery is
limited to the targeted ownership queries below.

If `task_worktree` is unavailable, report an incomplete installation and stop.

## Authorization And Target

Only an explicit `clean-worktree` invocation/selection, or an `audit-worktrees`
delegation with the user's approval for this exact target, authorizes deletion.
A mention, task completion, or PR readiness does not.

Resolve exactly one registered linked worktree from an absolute folder, branch,
or unique basename. Resolve relative folders from the original session directory.
If no target is provided, capture the active linked worktree before moving; never
default to the canonical checkout. Show candidates and ask when resolution is
ambiguous.

State the exact folder and branch before removal: all tracked, staged,
untracked, and ignored target files, its worktree-owned Docker containers,
volumes (including their data), networks, and built images, plus its local
branch, will be discarded. This authorization covers ordinary dirty files and
owned Docker resources; do not ask a duplicate dirty-file or volume question.

## Cleanup Sequence

1. Call `task_worktree` with `action: inspect`. Confirm the target is a registered
   linked worktree in the current project and record its branch, tip, and Git
   status snapshot using `--untracked-files=all`. For each Git-visible changed or
   untracked file, also record a content snapshot. Reject the canonical checkout,
   a symlink, a worktree parent, or an ancestor of another registered worktree.
2. If the session is inside the target, call `task_worktree` with `action: leave`.
   At the next step boundary, inspect again and proceed only after the session is
   outside the target. Use an explicit safe `workdir` for any subsequent Git call.
3. Recheck the branch tip, Git status, and recorded changed-path content
   snapshots. New or changed Git-visible work needs renewed consent; a proven
   active writer other than a target-owned container is a blocker. Resolve both
   before deleting anything.
4. Remove the target's Docker resources as described in
   [Docker Resources](#docker-resources), so no container still writes to or
   mounts the target.
5. Immediately before removal, recheck the tip and status once more, then call
   `task_worktree` with `action: remove`, the exact absolute `directory`, and
   `force: true`. Explicit invocation authorizes this flag. The adapter requests
   native permission and rejects locks, mounts, nested repositories/worktrees,
   active session targets, and unsafe residue; never bypass one of those failures
   with raw Git or `rm -rf`.
6. Require both `registrationRemoved: true` and `folderRemoved: true`, then call
   `inspect` again to confirm the target is absent. A failed owner, retained
   residue, or stale/unregistered folder is a partial result: preserve the branch
   and report the adapter's reason rather than attempting a fallback deletion.
7. For a captured non-detached branch, verify its ref still equals the recorded
   tip and it is not checked out elsewhere. Delete only that local branch. Preserve
   remote branches, stashes, caches, and shared services.

## Docker Resources

Ownership requires positive Docker or Compose evidence pointing at the target
folder, never a port, basename, or Compose project name alone. Discovery is
read-only and targeted; never run a destructive sweep.

1. List all containers, including stopped ones, with their
   `com.docker.compose.project` and `com.docker.compose.project.working_dir`
   labels. A container is target-owned when its `working_dir` is the target
   folder or inside it. A non-Compose container is target-owned only when it has
   at least one bind mount and every bind-mount source is inside the target.
2. Identify target projects: those of target-owned containers and, while the
   folder exists, the name from `docker compose config --format json` run in the
   target. This finds volumes, networks, and images whose containers are gone.
3. A target project is owned only when no container from another folder carries
   its label and no other registered worktree or the canonical checkout resolves
   to the same Compose project name. Otherwise it is shared: remove only the
   target-owned containers and preserve its volumes, networks, and images.
4. For each owned project, collect the volumes, networks, and images labeled
   `com.docker.compose.project=<project>`. Preserve any that a container outside
   the target uses (`docker ps -a --filter volume=…`, `network=…`, or
   `ancestor=…`), or whose exact name appears in another registered worktree's or
   the canonical checkout's Compose files, such as an `external` declaration.
   Unlabeled `external` resources are preserved.
5. Remove by exact ID or name, in order: `docker rm -f -v` for owned containers
   (this also removes their anonymous volumes), then `docker network rm`,
   `docker volume rm`, and `docker image rm` for the owned resources. Never use
   `prune`, `compose down`, filters that match by name pattern, or a shared
   project's documented cleanup command.
6. Query again and confirm every removed resource is absent. A resource that
   fails to remove is reported; it blocks folder removal only when it is a
   running container that still mounts or writes to the target.

When Docker is unavailable or no target evidence exists, report that and
continue; this never blocks native worktree removal. When the folder is already
gone and no container remains, labeled leftovers cannot be attributed: report
them as unresolved rather than deleting them. Shared or ambiguous resources are
retained and reported. Build cache is shared and preserved. Ask separately before
deleting bind-mounted host data outside the target or any external service, such
as a remote database or cloud resource.

Do not stop the agent, its shell, or unrelated process groups. Before removal,
use a targeted process and open-file scan for the target; a proven active writer
or mount is a hard blocker.

Report session destination, target/owner, approvals, removed Docker containers,
volumes, networks, and images, folder/registration/inventory state, branch
result, preserved resources with reasons, and any resumable partial failure.
Leave the OpenCode session/tab title unchanged.

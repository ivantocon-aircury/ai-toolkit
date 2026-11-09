---
name: clean-worktree
description: Explicitly clean one worktree by folder, branch, or worktree name, defaulting to the active linked worktree. Discard everything worktree-specific - stop host services started from it, remove its Docker containers, volumes, networks, and built images, its folder-scoped local dev routing, all its files, and its verified local branch - while preserving shared resources. Also accepts exact targets explicitly approved through audit-worktrees. Never infer cleanup from task completion.
compatibility: OpenCode v2 with the toolkit task_worktree plugin.
---

# Clean Worktree

This is a one-worktree cleanup that removes everything specific to the target:
its running services, Docker resources, folder-scoped dev routing, files, and
local branch. The native adapter performs the filesystem safety checks, so do
not reproduce them with recursive filesystem investigations. Process, Docker,
and routing discovery are limited to the targeted queries below.

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

State the exact folder, branch, and branch tip SHA before removal: services
started from the target will be stopped, and all tracked, staged, untracked, and
ignored target files, its worktree-owned Docker containers, volumes (including
their data), networks, and built images, its folder-scoped dev routing, plus its
local branch, will be discarded. List the branch commits that are not on any
remote branch or local `main`, `master`, `preview`, or `staging`
(`git log --oneline <branch> --not --remotes <existing integration branches>`),
and state that the branch can be recovered with `git branch <name> <sha>` until
garbage collection. This authorization covers ordinary dirty files, unpublished
commits, running target services, and owned Docker resources; do not ask a
duplicate dirty-file, commit, service, or volume question.

## Cleanup Sequence

1. Call `task_worktree` with `action: inspect`. Confirm the target is a registered
   linked worktree in the current project and record its branch, tip, and Git
   status snapshot using `--untracked-files=all`. For each Git-visible changed or
   untracked file, also record a content snapshot. Reject the canonical checkout,
   a symlink, a worktree parent, or an ancestor of another registered worktree.
2. If the session is inside the target, call `task_worktree` with `action: leave`.
   At the next step boundary, inspect again and proceed only after the session is
   outside the target. Use an explicit safe `workdir` for any subsequent command.
3. Stop the target's host services as described in
   [Host Services](#host-services).
4. Recheck the branch tip, Git status, and recorded changed-path content
   snapshots. Changes made by the services just stopped are expected; any other
   new or changed Git-visible work needs renewed consent. A remaining active
   writer from outside the target is a blocker. Resolve both before deleting
   anything.
5. Restore ownership of container-created files as described in
   [Foreign-Owned Files](#foreign-owned-files), then remove the target's Docker
   resources as described in [Docker Resources](#docker-resources), so no
   container still writes to or mounts the target.
6. Remove folder-scoped dev routing as described in
   [Local Dev Routing](#local-dev-routing).
7. Immediately before removal, recheck the tip, status, and changed-path content
   snapshots once more against the last consented state. Any difference needs
   renewed consent before continuing. Then call `task_worktree` with
   `action: remove`, the exact absolute `directory`, and
   `force: true`. Explicit invocation authorizes this flag. The adapter requests
   native permission and rejects locks, mounts, nested repositories/worktrees,
   active session targets, and unsafe residue; never bypass one of those failures
   with raw Git, `sudo`, or `rm -rf`.
8. Require both `registrationRemoved: true` and `folderRemoved: true`, then call
   `inspect` again to confirm the target is absent. A failed owner, retained
   residue, or stale/unregistered folder is a partial result: preserve the branch
   and report the adapter's reason rather than attempting a fallback deletion.
9. For a captured non-detached branch, verify its ref still equals the recorded
   tip and it is not checked out elsewhere. Delete only that local branch. Preserve
   remote branches, stashes, caches, and shared services.

## Host Services

Explicit invocation authorizes stopping every service started from the target;
do not ask again. A process is target-owned when it runs as the current user and
its working directory (`/proc/<pid>/cwd`) or executable (`/proc/<pid>/exe`) is the
target folder or inside it. Tool-registered servers are target-owned when the
tool reports the exact target folder:

- Symfony CLI: `symfony server:list`, stopped with `symfony server:stop --dir=<target>`.
- pm2: `pm2 jlist` entries whose `pm2_env.pm_cwd` is inside the target, stopped
  with `pm2 delete <id>`.
- systemd user units: `systemctl --user` units whose `WorkingDirectory` or
  `ExecStart` path is inside the target, stopped with `systemctl --user stop`.

Never stop the agent, its shell or ancestors, the OpenCode server and its
language-server children, or IDE/editor windows, even when their working
directory is inside the target; report them instead. Never stop processes owned
by another user. These exclusions are protected processes.

1. Prefer the tool's own stop command, but only after confirming every process
   it would terminate is target-owned and not protected: the pm2 app PID and its
   descendants, the Symfony server PID with its descendants and registered
   workers, or every PID in the systemd unit's control group. Otherwise signal
   the exact eligible PIDs instead.
2. Without a tool command, send SIGTERM to the process group only when every
   member is target-owned and not protected, or to the exact PID otherwise.
3. Wait briefly, recheck, and send SIGKILL only to eligible processes that are
   still alive.
4. Confirm no eligible process remains. A survivor is reported; it blocks
   folder removal only while it still writes to the target.

Then find remaining writers with a targeted open-file scan: for every process
whose `/proc/<pid>/fd` is readable, check links that resolve inside the target
and whose `/proc/<pid>/fdinfo/<fd>` flags open it for writing (`O_WRONLY` or
`O_RDWR`). Any such writer that was not stopped (an outside process, a protected
process, or another user's process) is a blocker; report it rather than
stopping it. Other users' descriptors are not readable without elevated
privileges; report that limitation rather than using `sudo`.

## Foreign-Owned Files

Bind-mounted containers often create files owned by root or another UID, such as
`var/`, `vendor/`, or database data. The adapter then fails with permission
errors. Check once with `find <target> ! -user "$(id -u)" -print -quit`.

When such a file exists and Docker is available, first confirm no filesystem
is mounted at or beneath the target (`findmnt -rn -o TARGET` filtered to the
target prefix); if one is, skip this step and report it, since the adapter will
reject the mount anyway. Otherwise restore ownership before removing the
target's containers, using a throwaway container that mounts only the target
and changes only foreign-owned entries without following symlinks, crossing
filesystems, or touching hard-linked files (whose inode may be shared with a path
outside the target):
`docker run --rm -v <target>:/w alpine find /w -xdev ! -user <uid> \( -type d -o -links 1 \) -exec chown -h <uid>:<gid> {} +`
with the current numeric `id -u` and `id -g`. Every foreign-owned entry of the
exclusive target is in scope because the whole target is about to be deleted.
Report skipped hard-linked files. Use an image already present locally when
possible. Never use `sudo`, and never mount any path other than the exact target. When ownership cannot be restored,
report the affected path and expect a partial removal result.

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

## Local Dev Routing

Remove routing only when an installed tool scopes it to the exact target folder:

- Symfony CLI proxy domains whose directory, as reported by
  `symfony server:list` (which works whether or not the proxy is running), is
  exactly the target, detached by name with `symfony proxy:domain:detach <domain>`.
- Caddy, Traefik, or nginx configuration files whose root, upstream, or
  directory points inside the target and that exist only for the target, removed
  and followed by the tool's reload command. Shared configuration files are
  reported, not edited.
- mkcert certificates for target-only domains, removed only when they are
  stored inside the target or referenced exclusively by removed configuration.
  Never uninstall the mkcert root CA.

Report `/etc/hosts` entries for target domains instead of editing them, since that
requires elevated privileges. Report routing that cannot be attributed to the
exact target as unresolved.

## Other Sessions

Report other OpenCode sessions whose directory is the target, when the session
listing is available, so the user can archive or move them. Do not delete or move
them.

## Report

Report session destination, target/owner, approvals, stopped services and any
retained processes with reasons, ownership restoration, removed Docker
containers, volumes, networks, and images, removed and reported dev routing,
folder/registration/inventory state, branch result with tip SHA and unpublished
commits, other sessions on the target, preserved resources with reasons, and any
resumable partial failure. Leave the OpenCode session/tab title unchanged.

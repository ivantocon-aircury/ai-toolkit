# Native Task Worktrees

For worktree operations in this v2 profile, use the `task_worktree` tool.
These instructions replace the creation and handoff mechanics in the installed
`worktree-workflow` and `create-worktree` skills.
Keep their isolation, naming, ownership, and lifecycle rules.

Before modifying repository files, inspect Git state and call `task_worktree`
with `action: inspect`.
Reuse the current linked worktree when it already belongs to the task.
Otherwise use `action: prepare` with the repository-conventional task `branch`
and an optional verified starting `base` ref.
Preserve explicit work references; never invent one.
The one-file, low-risk current-checkout exception still applies.

The tool uses OpenCode's native inventory, creation, and session movement.
Task worktrees live at `~/work/worktrees/<canonical-project-name>/<branch>`
with branch slashes replaced by hyphens.
Native Git creation starts detached; the tool attaches the requested task branch.
It copies existing non-symlink `node_modules/` and `vendor/` only for new trees.
It never transfers uncommitted source changes.

Existing branch/worktree reuse requires inspection and clear task ownership.
Use `action: select` with a registered worktree's absolute `directory` only after
checking its status and confirming that it belongs to this task.
Ask about ambiguous ownership or collisions rather than overwriting anything.

After prepare or select, the session move takes effect at the next step boundary.
Before editing, verify the session's active directory, Git branch, and status.
Run every subsequent task operation in the selected worktree.
Report dependency-copy warnings and fix missing dependencies using project commands.

Prefer the native inventory and session flow over raw `git worktree add`.
Never commit, push, create a pull request, or remove a worktree without an explicit
user request for that endpoint.
When removal is requested, retain the cleanup skill's project/container checks
and use OpenCode's native removal API for the registered worktree.

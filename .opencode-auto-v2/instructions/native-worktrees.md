# Native Task Worktrees

Use the v2-specific skills from the installed toolkit:

- Before repository modifications: `opencode-v2-worktree-workflow`.
- After deciding to create or select isolation: `opencode-v2-create-worktree`.
- Only on explicit cleanup invocation: `opencode-v2-clean-worktree`.

When reading shared skills such as `development-lifecycle`, substitute these
v2 counterparts for workflow references to `worktree-workflow`,
`create-worktree`, and `clean-worktree`.
This is an instruction to the agent, not a native skill-ID alias.
Users must explicitly invoke or select `opencode-v2-clean-worktree` for cleanup.
If they select a denied legacy ID, explain the v2 ID rather than removing work.
Legacy worktree skill IDs are denied in this profile to avoid competing flows.
The v2 cleanup skill may read the original cleanup file as a safety reference.

The `task_worktree` plugin supplies native operations; the skills own workflow
decisions, task ownership, handoff verification, and cleanup consent.
Native creation and session movement are initiated by the agent when required,
not manually by the user and not automatically for every OpenCode session.

If a v2 skill or the native tool is missing, report the incomplete installation
instead of silently using legacy worktree mechanics.
Keep `inspect-git-state`, verification, and publication skills shared.
Never infer commit, push, PR, or cleanup authorization from task completion.

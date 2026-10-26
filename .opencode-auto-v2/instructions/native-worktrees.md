# Native Task Worktrees

Use the native worktree skills from the installed toolkit:

- Before repository modifications: `worktree-workflow`.
- After deciding to create or select isolation: `create-worktree`.
- Only on explicit cleanup invocation: `clean-worktree`.

Users must explicitly invoke or select `clean-worktree` for cleanup.
An explicitly requested `audit-worktrees` cleanup selection may delegate exact
approved targets to `clean-worktree`; an audit alone never authorizes deletion.
Every modifying task uses its own worktree, without a small-change exception.
Search for related existing worktrees before creation and reuse verified matches.
New paths use `~/work/worktrees/<project>/<branch-with-slashes-as-hyphens>`.

The `task_worktree` plugin supplies native operations; the skills own workflow
decisions, task ownership, handoff verification, and cleanup consent.
Native creation and session movement are initiated by the agent when required,
not manually by the user and not automatically for every OpenCode session.

If a worktree skill or the native tool is missing, report the incomplete
installation.
Keep `inspect-git-state`, verification, and publication skills shared.
Never infer commit, push, PR, or cleanup authorization from task completion.

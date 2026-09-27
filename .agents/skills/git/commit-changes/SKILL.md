---
name: commit-changes
description: Use ONLY when the user explicitly asks to commit changes or organise them into commits. Creates coherent commits that follow repository-specific message and issue-reference conventions, with Conventional Commits as the fallback.
---

Do not commit because implementation is complete, tests pass, a branch exists,
or another skill refers to this one. Commit only after an explicit user request.
Repository instructions and recent commit history override the defaults below.

1. Load `inspect-git-state` and inspect staged, unstaged, untracked, and recent
   commit state in the intended worktree.

2. Group related files into the smallest coherent functional commits. Preserve
   unrelated user changes outside those groups.

3. Follow the repository's documented and demonstrated message style. If none
   exists, use `<type>(<scope>): <description>` with a concise imperative subject.
   Include a supplied issue reference where the project requires it. Never invent
   one or ask for one unless the project requires it. Conventional fallback types:
   - `feat`: new feature
   - `fix`: bug fix
   - `refactor`: code restructuring without behavior change
   - `docs`: documentation only
   - `style`: formatting, whitespace, semicolons (no logic change)
   - `test`: adding or updating tests
   - `chore`: tooling, configs, dependencies
   - `perf`: performance improvement
   - `ci`: CI/CD changes
   - `build`: build system changes
   - `revert`: reverting a previous commit

4. Before each commit, stage only its exact paths and inspect the staged diff.
   Do not use `git add .` unless every change belongs to the same commit.

5. Write the message using the repository's established body and trailer
   conventions. Never add AI/tool attribution, generated-by markers, bot
   signatures, or invented co-authors.

6. After each commit, verify the resulting message and load `inspect-git-state`
   to confirm the intended paths were committed and unrelated work remains intact.

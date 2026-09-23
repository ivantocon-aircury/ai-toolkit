---
name: development-lifecycle
description: Use ONLY when the user explicitly requests Git lifecycle work, such as committing, pushing, opening a pull request, or preparing a branch for review. Do not trigger for implementation, fixes, refactors, or specification workflows alone. Coordinates the requested Git steps without implementing the feature itself.
---

# Development Lifecycle

Use this orchestration skill only for Git steps the user explicitly requested. It does not design or implement the requested feature; the main agent or calling domain workflow owns implementation and verification.

An implementation request never implies permission to commit, push, create a pull request, or remove a worktree. Leave changes uncommitted unless the user explicitly asks for one of those actions.

## Related Skills

- Load `worktree-workflow` before implementation to decide and establish isolation.
- Load `inspect-git-state` at lifecycle boundaries and before considering Git work complete.
- Load `commit-changes` to create one or more logical commits.
- Load `push-branch` when branch publication is expected.
- Load `create-pull-request` when a pull request is expected.

Do not copy the execution rules from these skills. Load them and pass the relevant task, path, branch, base, remote, and issue-reference context.

## Establish The Lifecycle

At the start, determine the requested endpoint of the Git workflow:

- Implementation only, with changes left uncommitted.
- Implementation plus one or more commits.
- A pushed branch.
- A pull request.

Perform only the endpoint(s) explicitly requested by the user and permitted by higher-priority instructions. Do not infer that commits, publication, a PR, or worktree cleanup are expected from an implementation task, a branch name, or prior workflow stages. Record the intended base branch, remote, work reference, and PR expectation when supplied; ask only for information needed for the next explicitly requested irreversible or remote step.

## Sequence

1. Before implementation begins, load `worktree-workflow`. For OpenSpec and Spec Kit, invoke it when the workflow transitions from specification or planning into implementation, not during read-only specification work.
2. Pass the resulting absolute worktree path to the implementing agent or workflow. Require all implementation, tests, and later Git operations to use that path.
3. Allow the responsible implementation workflow to make and verify the code changes. This skill coordinates state but does not implement features.
4. Load `inspect-git-state` after implementation. Reconcile the actual changes with the task and identify unrelated, missing, or misplaced work.
5. Load `commit-changes` only when the user explicitly requests commits. Accept multiple logical commits and preserve unrelated work outside them.
6. Run the project's required final checks through the responsible testing or executor workflow, then load `inspect-git-state` again.
7. Load `push-branch` only when the user explicitly requests a push or branch publication. It rebases the local branch onto the user-selected remote-tracking base immediately before pushing; recommend `origin/main` when asking the user to choose.
8. Load `create-pull-request` only when the user explicitly requests a pull request.
9. Remove a task worktree only when the user explicitly requests cleanup. Run this only from a different worktree after verifying that the target is a registered, non-primary task worktree with no tracked or untracked changes. Use `git worktree remove <path>` without `--force`; if removal is unsafe or fails, report the reason and leave it intact. Do not delete the local branch as part of cleanup.

The workflow may resume at a later stage for pre-existing work. Inspect current state first and skip only stages already completed correctly.

## Completion Gate

Before declaring the requested lifecycle complete, load `inspect-git-state` and verify:

- The task ran in the intended worktree and branch.
- Every relevant change is either intentionally uncommitted or included in an appropriate logical commit.
- Unrelated changes or commits were not accidentally included.
- Commit boundaries are coherent; a PR may contain multiple commits.
- Required checks ran and their real results are recorded.
- The branch is pushed when publication was expected.
- The pull request exists with the intended head and base when a PR was expected.
- A task worktree was removed after its PR was confirmed, or the reason it was retained is explicit.
- No unresolved divergence, detached `HEAD`, wrong-worktree state, or ambiguous Git ownership remains.

If unrelated changes make branch or commit ownership ambiguous, ask whether they belong in a separate commit on the same branch or a separate task, branch, and worktree. Do not silently choose.

## Completion Report

Report the worktree path and whether it was removed, preserved local branch and base, created commits, checks, push state, PR URL when applicable, and any intentionally unfinished Git state. Completion means the endpoint established at the start was reached, not that every task must always produce a commit or PR.

## Review Checklist

- Atomic skills, rather than duplicated instructions, performed Git operations.
- Worktree isolation was considered before implementation for every modifying task.
- Commit count followed logical change boundaries rather than task count.
- Publication matched user intent and was verified.
- Confirmed PR worktrees were safely removed without deleting their local branches.
- All unfinished or unrelated Git state is explicit.

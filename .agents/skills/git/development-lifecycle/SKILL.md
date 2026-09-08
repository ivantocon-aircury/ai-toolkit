---
name: development-lifecycle
description: Use when coordinating the Git lifecycle of an implementation task from isolation through completion. Trigger for direct requests such as "implement X" or "fix X", significant refactors, and OpenSpec or Spec Kit workflows that will implement changes. Orchestrates worktree selection, logical commits, final checks, push, and pull request creation without implementing the feature itself.
---

# Development Lifecycle

Use this orchestration skill to coordinate Git state around a development task. It does not design or implement the requested feature; the main agent or calling domain workflow owns implementation and verification.

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

Respect explicit user intent and higher-priority permission requirements. Do not publish, commit, or create a PR merely because this skill can coordinate those actions. Record the intended base branch, remote, work reference, and PR expectation when supplied; ask only for information needed for the next irreversible or remote step.

## Sequence

1. Before implementation begins, load `worktree-workflow`. For OpenSpec and Spec Kit, invoke it when the workflow transitions from specification or planning into implementation, not during read-only specification work.
2. Pass the resulting absolute worktree path to the implementing agent or workflow. Require all implementation, tests, and later Git operations to use that path.
3. Allow the responsible implementation workflow to make and verify the code changes. This skill coordinates state but does not implement features.
4. Load `inspect-git-state` after implementation. Reconcile the actual changes with the task and identify unrelated, missing, or misplaced work.
5. If commits are requested or required for publication, load `commit-changes`. Accept multiple logical commits and preserve unrelated work outside them.
6. Run the project's required final checks through the responsible testing or executor workflow, then load `inspect-git-state` again.
7. If publication is expected, load `push-branch`.
8. If a PR is expected, load `create-pull-request`.

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
- No unresolved divergence, detached `HEAD`, wrong-worktree state, or ambiguous Git ownership remains.

If unrelated changes make branch or commit ownership ambiguous, ask whether they belong in a separate commit on the same branch or a separate task, branch, and worktree. Do not silently choose.

## Completion Report

Report the worktree path, branch and base, created commits, checks, push state, PR URL when applicable, and any intentionally unfinished Git state. Completion means the endpoint established at the start was reached, not that every task must always produce a commit or PR.

## Review Checklist

- Atomic skills, rather than duplicated instructions, performed Git operations.
- Worktree isolation was considered before implementation for every modifying task.
- Commit count followed logical change boundaries rather than task count.
- Publication matched user intent and was verified.
- All unfinished or unrelated Git state is explicit.

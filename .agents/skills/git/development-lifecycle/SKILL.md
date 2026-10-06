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
- Load `verify-changes` after implementation and before publication.
- Load `commit-changes` to create one or more logical commits.
- Load `push-branch` when branch publication is expected.
- Load `create-pull-request` when a pull request is expected.
- Load `clean-worktree` only when the user directly invokes `clean-worktree` or
  `/clean-worktree` for a target, not when the skill name is merely mentioned.

Do not copy the execution rules from these skills. Load them and pass the relevant task, path, branch, base, remote, and issue-reference context.

## Establish The Lifecycle

At the start, determine the requested endpoint of the Git workflow:

- Implementation only, with changes left uncommitted.
- Implementation plus one or more commits.
- A pushed branch.
- A pull request.

Perform only the endpoint explicitly requested. A commit request authorizes
commits. A push or PR request authorizes remote publication, but does not by
itself authorize creating commits or cleaning up a worktree. If intended work is
still uncommitted, ask whether it should be committed before publication.
Resolve context from user instructions, repository conventions, then global
defaults. Ask only when a meaningful ambiguity remains.

## Sequence

1. Before implementation begins, load `worktree-workflow`. For any planning or
   specification workflow, invoke it only when work transitions into repository
   modification.
2. Pass the resulting absolute worktree path to the implementing agent or workflow. Require all implementation, tests, and later Git operations to use that path.
3. Allow the responsible implementation workflow to make the code changes. This
   skill coordinates state but does not implement features.
4. Load `inspect-git-state` after implementation. Reconcile the actual changes with the task and identify unrelated, missing, or misplaced work.
5. Load `verify-changes` and fix discovered implementation problems before Git
   publication steps.
6. Load `commit-changes` only when commits are explicitly requested. Accept
   multiple coherent commits and preserve unrelated work.
7. Load `push-branch` only for an explicit push or as a prerequisite of an
   explicit PR request.
8. Load `create-pull-request` only for an explicit PR request.
9. Delegate cleanup only when the user directly invokes `clean-worktree` or
   `/clean-worktree` for a target. Do not infer cleanup authorization from a
   mention of the skill or a request to complete, publish, or otherwise finish
   the task.

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
- Worktree cleanup occurred only through a direct `clean-worktree` or
  `/clean-worktree` invocation for a target.
- No unresolved divergence, detached `HEAD`, wrong-worktree state, or ambiguous Git ownership remains.

If unrelated changes make branch or commit ownership ambiguous, ask whether they belong in a separate commit on the same branch or a separate task, branch, and worktree. Do not silently choose.

## Completion Report

Report the worktree path and whether it was removed, the local branch state,
created commits, checks, push state, PR URL when applicable, and any
intentionally unfinished Git state. Completion means the endpoint established
at the start was reached, not that every task must always produce a commit or
PR.

## Review Checklist

- Atomic skills, rather than duplicated instructions, performed Git operations.
- Worktree isolation was considered before implementation for every modifying task.
- Commit count followed logical change boundaries rather than task count.
- Publication matched user intent and was verified.
- Worktree retention or explicitly requested cleanup is accurately reported.
- All unfinished or unrelated Git state is explicit.

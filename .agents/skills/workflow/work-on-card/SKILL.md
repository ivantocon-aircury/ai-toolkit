---
name: work-on-card
description: Use when the user explicitly asks to work on a Kanban card or issue. Select the card, rename the active OpenCode session, follow the project's workflow, and open a pull request when the work is ready.
---

# Work On Card

An explicit `@work-on-card` invocation requests work on one card, its board
transitions, and a pull request for completed repository changes, unless the
user limits the scope.

## Resolve The Card

1. Find the intended board using the project's instructions, repository
   identity, and configured tracker tools. If the user supplies a card
   reference or direct card link, resolve that exact card regardless of its
   column. If the reference is not found or is ambiguous, ask instead of
   falling back to another card.
2. If no reference or card link is supplied, use the column explicitly named
   by the user, otherwise the repository's documented default Kanban column,
   otherwise `Backlog`. Use the same default as `create-card`. Select the top
   card in the board's displayed top-to-bottom order; don't independently
   sort by priority, date, or reference. If the column is missing, ambiguous,
   or empty, or its order can't be verified, report the blocker and ask for
   a reference or clarification. Don't switch columns or pick a different
   card on your own.
3. Verify the selected card belongs to the intended project before renaming
   the session or editing files. Read its canonical reference and title,
   description, acceptance criteria, status, relevant comments, and linked
   dependencies. If tracker access is unavailable, only work from a supplied
   copy if the user provides the card's reference, title, and enough context
   to establish its project and scope. Note when you're working from a
   supplied copy rather than verified board state. Never infer the top card
   from a copy of a single card.

## Name The Active Session

As soon as the target card is confirmed, rename the current OpenCode session
to `<card ref> - <card title>` using the card's actual reference and title,
for example `APP-42 - Keep filters when returning to search`.

In Code Mode, prefer `tools.opencode.session_rename({ title })` with no
`sessionID`, so it targets the current session. Check the returned title.
If the native tool isn't available, use a supported OpenCode session-update
interface only if the active session can be identified reliably. Report an
unavailable or failed rename and give the exact intended title; don't select
another session or claim the title changed.

## Start Work

When starting work, move the card to the column the project uses for active
work (for example, `In Progress`). Then do what the card asks, following the
project's instructions and established workflows.

## Hand Off Completed Work

When the card's work is complete and ready for review under the project's
workflow, use the card reference and the project's pull-request process to
open a PR, or confirm the matching open PR if one already exists. Where the
project uses the toolkit's Git skills, follow `development-lifecycle` for
publication and `create-pull-request` for the PR; don't bypass their
authorization or verification requirements.

Once the PR is confirmed, move the card to the project's post-PR column
(for example, `In Review`) and report the PR URL and confirmed card status.
Don't advance the card to a status that implies merge or release unless that
milestone has actually happened. If the PR is blocked or fails, report why
and don't make the post-PR move. If the card doesn't require repository
changes, don't create an empty PR; follow the project's completion flow for
that kind of card.

For both moves, use the documented workflow first, then an unambiguous
existing column that matches the milestone. Verify each move. If the card is
already in the right column, leave it there. Don't move it backward on resume
unless the project expects that transition. If no appropriate column can be
determined or the move can't be verified, report the blocker rather than
claiming the card moved.

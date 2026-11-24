---
name: work-on-card
description: Use when the user explicitly asks to work on a Kanban card or issue. Select the card, rename the active OpenCode session, follow the project's workflow, and, with user approval for every board action, push, and pull request, hand off the completed work.
---

# Work On Card

An explicit `@work-on-card` invocation requests work on one card. It does not
authorize board writes, pushes, or pull requests: each of those needs the
user's approval at the moment it is about to happen.

## Approval Rule

Reading the board is allowed without asking. Every board write needs explicit
user approval first, including moving the card, adding or editing comments,
and changing labels, assignees, fields, checklists, or the description.
Ask with the native question tool (see `ask-question`), stating the exact
action, for example "Move `APP-42` from `Backlog` to `In Progress`?" or the
full comment text. Approval covers only the action shown. Ask again for later
actions. If the user declines, don't perform the action and continue the
remaining work unless they say otherwise. Never claim a declined or
unperformed action happened.

## Resolve The Card

Find the intended board using the project's instructions, repository identity,
and configured tracker tools. Then select the card using the first of these
sources that yields a card. Move to the next source only when the current one
doesn't apply:

1. **Card specified by the user.** If the user supplies a card reference or
   direct link, resolve that exact card regardless of its column. If it isn't
   found or is ambiguous, ask instead of falling back to another source.
2. **Card created in this session.** If a card was created earlier in the
   current session (for example, with `create-card`), use it. If several were
   created, ask which one to work on.
3. **First card in the "to work on" column.** Use the column explicitly named
   by the user, otherwise the repository's documented work-intake column,
   otherwise `Backlog`. If none of those columns exists on the board, list the
   board's columns in their displayed order and ask the user which one to use.
   Don't guess a column. Select the top card in the board's displayed
   top-to-bottom order; don't independently sort by priority, date, or
   reference. If the column is empty or its order can't be verified, report
   that and ask for a reference or another column.

Verify the selected card belongs to the intended project before renaming the
session or editing files. Read its canonical reference and title, description,
acceptance criteria, status, relevant comments, and linked dependencies.
If tracker access is unavailable, only work from a supplied copy if the user
provides the card's reference, title, and enough context to establish its
project and scope. Note when you're working from a supplied copy rather than
verified board state. Never infer the top card from a copy of a single card.

## Name The Active Session

As soon as the target card is confirmed, rename the current OpenCode session
to `<card ref> - <card title>` using the card's actual reference and title,
for example `APP-42 - Keep filters when returning to search`.

In Code Mode, prefer `tools.opencode.session.rename({ title })` with no
`sessionID`, so it targets the current session. Check the returned title.
If the native tool isn't available, use a supported OpenCode session-update
interface only if the active session can be identified reliably. Report an
unavailable or failed rename and give the exact intended title; don't select
another session or claim the title changed.

## Start Work

Before starting, propose moving the card to the next column in the board's
workflow, normally the one used for active work (for example, `In Progress`).
Use the documented workflow first, otherwise the next column after the card's
current one in the board's order. Move it only after approval. Then do what
the card asks, following the project's instructions and established workflows.

## Hand Off Completed Work

When the card's work is complete and ready for review under the project's
workflow, summarize the changes and verification, then ask the user to approve
pushing the branch. After the push, ask separately to approve opening the pull
request, showing its intended title and base. If a matching open PR already
exists, confirm it instead of creating another. Use the card reference and the
project's pull-request process. Where the project uses the toolkit's Git
skills, follow `development-lifecycle` for publication and
`create-pull-request` for the PR; don't bypass their authorization or
verification requirements. If the user declines either step, stop there and
report the current state.

Once the PR is confirmed, propose moving the card to the project's post-PR
column (for example, `In Review`) and move it only after approval. Report the
PR URL and confirmed card status. Don't advance the card to a status that
implies merge or release unless that milestone has actually happened. If the
PR is blocked or fails, report why and don't propose the post-PR move. If the
card doesn't require repository changes, don't create an empty PR; follow the
project's completion flow for that kind of card, still asking before any
board action.

For every move, verify the result. If the card is already in the right column,
leave it there. Don't move it backward on resume unless the project expects
that transition. If no appropriate column can be determined or the move can't
be verified, report the blocker rather than claiming the card moved.

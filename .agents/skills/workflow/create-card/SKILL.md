---
name: create-card
description: Use when the user explicitly asks to create a Kanban card or issue. Refine their input with project context, choose existing board labels, and create the card on the correct board.
---

# Create Card

Turn the user's notes into one actionable card. An explicit `@create-card`
invocation requests creation, not just a draft, unless the user says otherwise.

## Understand The Request And Project

1. Identify the intended project and board from the request, project
   instructions, repository identity, and configured tracker tools. Prefer the
   project's documented integration (for example, an MCP tool or project CLI).
   Don't assume the repository and board share a name or that the first
   available board is the right one.
2. Read the relevant project docs and, when helpful, the smallest useful slice
   of code or tests. Keep the user's intended outcome and constraints separate
   from implementation guesses. On the board, check the card template, target
   column, available labels, and nearby examples when accessible. Search for
   existing cards by topic and affected behavior before creating one.
3. Ask only when the target, scope, or expected outcome cannot be inferred
   safely. If there is a clear duplicate, return its reference and link rather
   than creating another card. If the overlap is uncertain or the request
   contains several independent outcomes, ask before choosing how to file it.

## Refine The Card

- **Title:** Use the project's language and style. Name the action or outcome
  and the affected behavior so the title is useful on its own. Don't add a
  reference the tracker will assign.
- **Description:** Follow the project's template. Otherwise explain the problem
  and why it matters, then state the expected outcome and scope. Add a short
  list of observable acceptance criteria. For bugs, include known reproduction
  context and actual versus expected behavior. Link relevant evidence and
  dependencies; mark non-blocking assumptions or unknowns explicitly rather
  than inventing facts, reproduction steps, or implementation requirements.
- **Labels:** Use the smallest useful set of existing labels (for example,
  type and affected area) based on the board's taxonomy. Don't create labels
  or guess priority, assignee, or dates. If no existing label fits, leave it
  unlabeled and explain why; ask if a required board field remains unresolved.
- Include only information appropriate for the board's audience. Omit secrets,
  personal data that is not needed, and unrelated repository content.

## Create And Verify

Use the column explicitly named by the user, otherwise the repository's
documented default Kanban column, otherwise `Backlog`. Use the same default
as `work-on-card`. Verify that the chosen column exists on the intended board.
If it is missing or ambiguous, ask rather than using a different column or
the tracker default.

Create the card once in that column. Apply the selected labels and verify the
saved title, destination, and labels from the result or by reading back the
card. If creation times out or returns an ambiguous result, search for the card
before attempting another write.

Return the confirmed reference, title, link, and applied labels. If the board
can't be determined or accessed, show the refined draft and the missing detail
or access needed. Clearly distinguish suggested labels from applied ones, and
never claim a draft was created on the board.

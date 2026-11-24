---
name: create-card
description: Use when the user explicitly asks to create a Kanban card or issue. Refine their input with project context and the board's templates, propose a column with a default, choose existing board labels, and create a ready-to-work card on the correct board.
---

# Create Card

Turn the user's notes into one actionable card that someone can pick up and
work on without asking for more context. An explicit `@create-card`
invocation requests creation, not just a draft, unless the user says otherwise.

## Understand The Request And Project

1. Identify the intended project and board from the request, project
   instructions, repository identity, and configured tracker tools. Prefer the
   project's documented integration (for example, an MCP tool or project CLI).
   Don't assume the repository and board share a name or that the first
   available board is the right one.
2. Read the relevant project docs and, when helpful, the smallest useful slice
   of code or tests. Keep the user's intended outcome and constraints separate
   from implementation guesses. On the board, review its columns in their
   displayed order, its card templates, available labels, and nearby
   examples when accessible. Search for existing cards by topic and affected
   behavior before creating one.
3. Ask only when the target, scope, or expected outcome cannot be inferred
   safely. If there is a clear duplicate, return its reference and link rather
   than creating another card. If the overlap is uncertain or the request
   contains several independent outcomes, ask before choosing how to file it.

## Refine The Card

Decide the card type (for example, bug, feature, task, or chore) from the
request and the board's taxonomy.

- **Title:** Use the project's language and style. Name the action or outcome
  and the affected behavior so the title is useful on its own. Don't add a
  reference the tracker will assign.
- **Description:** If the board or project has a template for this card type,
  use it and fill every section. Otherwise write a structured description
  with these sections, omitting one only when it truly doesn't apply:
  - **Context:** the problem or need and why it matters.
  - **Goal:** the expected outcome.
  - **Scope:** what's included and, when useful, what's explicitly out of
    scope.
  - **Acceptance criteria:** a short checklist of observable, testable
    results.
  - **For bugs:** steps to reproduce, actual versus expected behavior, and
    known environment details.
  - **Notes:** relevant evidence, links, affected areas, dependencies, and
    open questions.

  Mark non-blocking assumptions or unknowns explicitly rather than inventing
  facts, reproduction steps, or implementation requirements. Leave
  implementation choices to whoever works on the card unless the user
  specified them.
- **Labels:** Use the smallest useful set of existing labels (for example,
  type and affected area) based on the board's taxonomy. Don't create labels
  or guess priority, assignee, or dates. If no existing label fits, leave it
  unlabeled and explain why; ask if a required board field remains unresolved.
- Include only information appropriate for the board's audience. Omit secrets,
  personal data that is not needed, and unrelated repository content.

## Choose The Column

Define the default column: the column explicitly named by the user, otherwise
the repository's documented default Kanban column, otherwise `Backlog`, and,
if the board has none of those, its first intake column in displayed order.
Verify the default exists on the intended board.

Before creating, use the native question tool (see `ask-question`) to propose
the column, even when the user named one. Show the refined title and labels,
offer the default first as the recommended option, and list the board's other
columns as alternatives. If the user named a column that doesn't exist, say so
in the question. If the board's columns can't be read, ask rather than relying
on the tracker default.

## Create And Verify

Create the card once in the chosen column. Apply the selected labels and verify
the saved title, description, destination, and labels from the result or by
reading back the card. If creation times out or returns an ambiguous result,
search for the card before attempting another write.

Return the confirmed reference, title, link, column, and applied labels.
If the board can't be determined or accessed, show the refined draft and the
missing detail or access needed. Clearly distinguish suggested labels from
applied ones, and never claim a draft was created on the board.

---
name: extract-rule
description: Use when the user explicitly asks to extract, record, or formalize a reusable project rule from a diff, commit, review correction, or established code pattern. Requires evidence, checks existing project documentation, and confirms wording before making project law.
---

# Extract Rule

Use this skill only when the user asks to make an engineering decision durable.
Repository instructions define where and how rules are stored; do not impose a
global `docs/rules` taxonomy or template when the project uses another convention.

## Workflow

1. Establish the requested evidence scope: current staged/unstaged changes, a
   named commit or range, a review correction, or demonstrated neighboring code.
2. Read the diff and enough surrounding context to understand why the decision
   exists. Exclude generated files, lockfiles, and tooling artifacts that contain
   no reusable engineering decision.
3. Distill a general, actionable rule rather than narrating the specific change.
   State the triggering condition, required behavior, evidence, and a project-
   grounded example.
4. Inspect existing project instructions, rules, ADRs, and convention docs. Classify
   the proposal as new, an update, a duplicate, or a conflict. Never silently
   overwrite a conflicting rule.
5. Use the native question tool to confirm an important new rule, conflict
   resolution, or wording before writing it. A rule affects future work and should
   not be inferred from weak evidence.
6. Write it in the project's established location and format. If none exists,
   propose the smallest discoverable location and update the project's agent guide
   only when needed so future agents can find it.
7. Re-read the result and remove wording that is vague, redundant, overly broad,
   or specific to a one-off implementation detail.

Report the evidence reviewed, files changed, conflicts resolved, and why the rule
is reusable. Do not create a rule merely to document ordinary code behavior.

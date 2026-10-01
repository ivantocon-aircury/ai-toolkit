---
name: ask-question
description: Use when progress requires a user decision, confirmation, preference, or selection between clear options. Use the native question tool instead of asking multiple-choice questions in chat; use chat only when the answer must be free text.
---

# Ask Question

Use the native question tool only after investigating the available context and
confirming that a consequential decision remains unresolved. It presents choices
consistently and prevents implementation from proceeding on an unconfirmed
assumption without needlessly interrupting the user.

## Investigate First

Before asking, inspect the user's request, repository instructions, relevant
code and configuration, established project conventions, and prior decisions in
the conversation. Prefer the smallest safe action supported by that evidence.

Do not ask merely because several technically valid approaches exist. Ask only
when the answer materially affects behavior, scope, security, data, cost, or an
irreversible operation and cannot be resolved from available context.

## When To Ask

- A requirement, scope, preference, environment, or strategy is ambiguous.
- A choice affects implementation, security, data, cost, or an irreversible
  operation.
- The user needs to confirm a discovered conflict, tradeoff, or next step.

Do not ask when repository instructions, the user's request, or established
project conventions already determine the answer. Make routine implementation
decisions without interrupting the user.

## How To Ask

1. Ask one decision per question unless choices are inseparable.
2. Use short, concrete labels and explain the meaningful consequence of each
   option.
3. Put the recommended option first and mark it as recommended.
4. Allow a custom response when the available options may not cover the user's
   intent.
5. Wait for the response before taking the dependent action.

## Free-Text Input

Ask in chat only when the answer cannot be expressed as useful predefined
options, such as a reference number, a custom name, credentials, or detailed
requirements. Keep that request concise and state why the information is needed.

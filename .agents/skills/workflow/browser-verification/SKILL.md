---
name: browser-verification
description: Use when verifying changed web user flows in a real browser, reproducing browser-only defects, or checking responsive behavior and console/network failures. Reuse available browser tools and project setup without introducing a test stack for manual verification.
---

# Browser Verification

Project instructions, existing browser tooling, fixtures, and service wrappers
take precedence.
Verify the changed user flow at the smallest useful scope.
Manual browser evidence complements automated checks; neither proves the other.

## Prepare The Environment

- Discover the intended worktree, application URL, startup command, and existing
  browser runner or automation tool.
  Reuse available tools rather than prescribing a new CLI, MCP, or language.
- Run services through project-native wrappers in the selected worktree.
  Check readiness before interacting and record which processes you started.
  Use documented port and container isolation; do not stop unrelated services or
  publish host ports merely to bypass project policy.
- Use existing test users, auth setup, and deterministic data.
  Keep sessions isolated between independent cases.
  Avoid consequential operations against production accounts or data; use the
  project's test environment and fixtures.
- If no browser or environment is available, report the missing prerequisite.
  Static inspection is not an executed browser check.

## Exercise The Changed Flow

1. Identify the user action and observable acceptance criteria.
   Cover the primary path plus relevant validation, pending, failure, recovery,
   or unauthorized states rather than every state in every task.
2. Inspect rendered content and use roles, accessible names, labels, or the
   project's stable test selectors.
   Wait for specific UI, URL, or request conditions, not arbitrary sleeps or
   blanket network-idle waits on applications with persistent connections.
3. Follow the user journey through navigation, input, submission, and resulting
   state where applicable.
   Confirm visible outcomes and relevant request effects, not merely a
   screenshot or a successful page load.
4. Inspect console errors and failed network requests around the interaction.
   Distinguish pre-existing noise, intentionally simulated failures, and new
   defects using timing, initiators, and response evidence.
5. For layout changes, check representative desktop and mobile viewports.
   Inspect overflow, hidden controls, touch targets, overlays, and interaction
   behavior; screenshots alone do not establish keyboard accessibility.

## Preserve Useful Evidence

- Capture focused screenshots, traces, URLs, or error summaries when they help
  explain a failure or demonstrate the changed behavior.
  Keep auth tokens and personal data out of shared artifacts.
- Use `systematic-debugging` for unexpected failures rather than repeatedly
  retrying until a flow happens to succeed.
- Use `frontend-testing` when implementing durable React or Next.js tests.
  Do not add a runner or committed one-off automation for a manual-only request.
- Use `accessibility-review` for deeper keyboard, focus, and assistive-technology
  checks, and `frontend-styling` for visual implementation.
- Stop only services started for this verification when they are no longer
  needed, following project conventions.

## Report

State the environment, browser/tool, tested flows, viewports, observed results,
console/network findings, useful artifacts, and untested cases or setup
blockers.
Distinguish manual observations from automated test results.

## Review Checklist

- The intended worktree and project-native setup were used.
- Assertions or observations establish user-visible outcomes.
- Async waits target meaningful conditions.
- Relevant error states and responsive behavior were exercised.
- Console/network findings and coverage limits are explicit.

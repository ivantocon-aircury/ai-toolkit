---
name: systematic-debugging
description: Use when diagnosing bugs, failing tests, build errors, or unexpected behavior whose cause needs investigation. Establish a reproduction, test evidence-backed hypotheses, fix the cause, and verify the regression using project-native tools.
---

# Systematic Debugging

Explicit requests, project instructions, and the established execution
environment take precedence.
Scale investigation to uncertainty: a clear local defect needs a short feedback
loop, while intermittent or cross-service failures need deeper evidence.
Avoid speculative patches and unnecessary diagnostic infrastructure.

## Establish A Feedback Loop

1. Identify expected behavior, actual behavior, affected scope, and the first
   useful error or failing assertion.
   Read the relevant stack trace and recent changes before proposing a cause.
2. Reproduce with the smallest project-native command, request, or user flow.
   Record inputs and environment differences that matter.
   If reproduction is intermittent, measure frequency and capture failing runs.
3. Define a pass/fail signal that detects this defect, not merely successful
   compilation or an unrelated passing test.
   Use a regression test when it adds meaningful coverage; otherwise use a
   focused reproduction and explain its verification limits.

## Trace And Test Hypotheses

- Trace the failing value or operation to its source and compare with a working
  example in the same project.
  For multi-service problems, inspect boundaries to find the first divergence.
- State the current hypothesis, its evidence, and an experiment that could
  disprove it.
  Change one relevant variable at a time and inspect the result before patching.
- Use focused, temporary instrumentation when existing diagnostics cannot locate
  the failure.
  Keep credentials and personal data out of commands, logs, and reports.
- Distinguish an application defect from fixture, configuration, dependency,
  infrastructure, and external-service failures.
  Do not weaken an assertion merely to make a test pass.
- After repeated unsuccessful attempts, revisit assumptions and collect new
  evidence instead of stacking fixes.
  Ask for help only when missing access, information, or a material decision
  blocks progress; an arbitrary attempt count is not proof of bad architecture.

## Fix And Verify

- Fix the confirmed cause with the smallest coherent change.
  Avoid unrelated refactoring or dependency upgrades.
- Run the defect-specific reproduction after the fix and the relevant neighboring
  checks.
  When adding a regression test, demonstrate that it fails on the defective
  behavior and passes after the fix when feasible.
- Remove task-owned temporary diagnostics unless they are useful maintained
  observability, and inspect the complete diff with `verify-changes`.
- For environmental or external failures, report the evidence and distinguish
  mitigation from a verified root-cause fix.

## Related Skills

- Use `ci-failure-diagnosis` for CI environment and job evidence.
- Use `browser-verification` for browser-only reproductions.
- Use `performance-investigation` when the failure is a measured slowdown.
- Use the relevant framework and testing skills for implementation and tests.

## Report

Summarize the reproduction, confirmed cause or remaining uncertainty,
experiments, fix, exact checks and outcomes, and any limits on the conclusion.

## Review Checklist

- The feedback loop detects the reported defect.
- Evidence distinguishes the cause from symptoms and environment differences.
- Experiments test a hypothesis rather than bundle speculative changes.
- The fix and verification address the same behavior.
- Unresolved failures and diagnostic cleanup are reported honestly.

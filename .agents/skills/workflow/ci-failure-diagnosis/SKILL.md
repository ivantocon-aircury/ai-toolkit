---
name: ci-failure-diagnosis
description: Use when investigating failed CI jobs, pipeline-only errors, flaky checks, or differences between local and CI results. Inspect the failing revision and first causal error, reproduce the job environment, and verify a focused fix without weakening checks.
---

# CI Failure Diagnosis

Project CI configuration, execution wrappers, provider, and repository access
take precedence.
Use the configured provider's existing CLI or integration when available.
Do not assume GitHub Actions or that a local green suite proves CI is green.

## Identify The Actual Failure

1. Confirm repository, run, job, attempt, commit SHA, and relevant matrix entry.
   Distinguish a branch revision from a generated merge revision where
   applicable.
2. Read the failed step's logs and relevant artifacts.
   Find the first causal error, not just the final nonzero exit or canceled job.
   Keep credentials and personal data out of reports and copied artifacts.
3. Inspect the workflow, reusable jobs, setup scripts, dependency installation,
   caches, and service definitions for that revision.
   If logs or access are unavailable, request the specific missing evidence and
   continue inspecting local configuration where useful.

## Reproduce The Relevant Environment

- Compare local and CI runtime versions, OS, architecture, working directory,
  lockfiles, build mode, service readiness, and environment-variable
  availability.
  Inspect whether a required variable exists without printing its secret value.
- Follow the project's job commands and container or wrapper policy.
  Reproduce the smallest failing step first, then relevant surrounding steps.
- Check differences caused by case-sensitive paths, permissions, timezone,
  locale, generated files, workspace boundaries, or resource limits when
  evidence points to them.
- For cache hypotheses, compare with a clean or cache-disabled run in an isolated
  environment rather than deleting unrelated developer caches.
  Determine whether cache keys reflect the actual dependency inputs.
- For flaky tests, collect failing traces, seeds, timing, parallelism, and fixture
  evidence.
  Test readiness and shared-state hypotheses; retries or arbitrary sleeps do not
  establish a fix.

## Classify, Fix, And Verify

- Distinguish application/test defects, CI configuration errors, dependency or
  cache problems, service failures, and provider infrastructure incidents.
  Use `systematic-debugging` for the causal investigation.
- Make a focused correction that preserves the intended check.
  Do not disable tests, loosen assertions, remove coverage gates, or add retries
  merely to produce a green status.
- Use `frontend-testing` for relevant React/Next.js test changes and
  `browser-verification` for browser evidence when appropriate.
- Run the relevant local reproduction and inspect changes with `verify-changes`.
  When an authorized remote rerun is available, confirm its revision and result.
  Publishing a branch or creating a PR still requires an explicit user request.
- Distinguish a locally verified fix, a queued/running pipeline, and a confirmed
  successful remote job.
  If infrastructure is the cause, report evidence and remaining verification
  rather than patching unrelated application code.

## Report

Include run/job/revision, causal error, classification, environment differences,
reproduction commands, fix, local and remote results, and missing evidence.

## Review Checklist

- The failed revision and matrix entry are known or explicitly unavailable.
- Logs identify a causal error rather than only a downstream symptom.
- Reproduction uses the project-defined CI environment.
- The fix preserves the checks and addresses evidence-backed causes.
- Remote success is claimed only after observing the relevant run.

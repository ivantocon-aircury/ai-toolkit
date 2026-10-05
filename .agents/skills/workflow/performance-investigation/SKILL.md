---
name: performance-investigation
description: Use when investigating slow pages, APIs, queries, builds, large bundles, rendering delays, or performance regressions. Measure a representative baseline, locate the bottleneck, and compare a targeted change using the project's profiling tools.
---

# Performance Investigation

Project performance budgets, versions, architecture, and available profiling
tools take precedence.
Optimize a measured bottleneck rather than mechanically applying
micro-optimization rules, memoization, caching, or a new dependency.

## Define A Representative Baseline

- Identify the affected operation, user impact, workload, and metric.
  Use project targets when defined; do not invent a pass threshold.
- Record build mode, runtime versions, data size, concurrency, hardware or
  environment, and cache state when relevant.
  Development-mode timings may not represent production behavior.
- Reproduce with the project's existing profiler, trace, query analysis, bundle
  report, benchmark, or diagnostic command.
  Repeat noisy measurements and distinguish cold starts from warm runs.
- Use safe representative test data and environments.
  Do not run unbounded load tests or potentially expensive query execution
  against production merely to obtain measurements.

## Locate The Bottleneck

- Trace the critical path before choosing a fix.
  Separate CPU, I/O, network, queueing, lock contention, and rendering costs.
- For web flows, inspect request waterfalls, payload sizes, server/client
  boundaries, expensive renders, and third-party work.
  Parallelize only independent operations and keep authorization boundaries.
- For database work, inspect query count, N+1 access, execution plans, index
  selectivity, pagination, connection use, and lock behavior as applicable.
  Distinguish estimated plans from actually executed query analysis.
- For bundles or builds, inspect the actual report for large imports, generated
  inputs, repeated work, and cache misses before suggesting changes.
- Treat suspected bottlenecks as hypotheses until measurements support them.
  If tooling is unavailable, identify a focused measurement path and label
  unmeasured recommendations as hypotheses.

## Change And Compare

- Make the smallest change that addresses the dominant cost.
  Preserve ordering, consistency, authorization, and error behavior.
- For caching, specify ownership, keys, user/tenant boundaries, invalidation,
  freshness, and memory limits; speed does not justify cross-user data leaks.
- Compare before and after under equivalent workload and environment conditions.
  Report repeated measurements or variability when noise affects the conclusion.
- Verify correctness and neighboring behavior with `verify-changes`.
  Explain tradeoffs, such as memory, complexity, write cost, or stale data.
- Do not claim an improvement from a refactor alone or compare incompatible
  development and production measurements.

## Related Skills

- Use `systematic-debugging` for regression tracing and hypothesis testing.
- Use the relevant React/Next.js skills for rendering and data boundaries.
- Use `symfony-repositories` and `symfony-doctrine-migrations` for relevant
  Doctrine query or index changes.
- Use `browser-verification` when measuring a user-visible web interaction.

## Report

State the metric and workload, baseline, bottleneck evidence, change, comparable
results, correctness checks, tradeoffs, and unresolved measurement limits.

## Review Checklist

- A representative baseline or an explicit measurement blocker exists.
- Evidence identifies the dominant cost.
- The change preserves semantics and data boundaries.
- Before/after measurements are comparable.
- Claims distinguish measured improvements from hypotheses.

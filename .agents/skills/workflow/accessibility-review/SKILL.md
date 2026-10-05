---
name: accessibility-review
description: Use when asked to audit accessibility or review keyboard navigation, focus, accessible names, error announcements, contrast, or reduced motion in web UI. Combine scoped code review and available browser evidence without claiming automated scans prove accessibility compliance.
---

# Accessibility Review

Explicit scope, project accessibility targets, shared UI primitives, and
installed tooling take precedence.
Review the changed interaction or requested surface instead of imposing a full
site audit on every component edit.

## Establish Scope And Evidence

- Identify affected routes, components, user tasks, supported viewports, and any
  stated accessibility standard or acceptance criteria.
- Inspect the implementation and available rendered behavior.
  Reuse existing accessibility tooling where configured; do not install an audit
  package or replace shared primitives without a concrete need.
- Separate code-inspection findings, automated scan findings, browser checks, and
  actual assistive-technology observations.
  Report unavailable checks instead of implying they passed.

## Review The Interaction

- Check semantic headings, landmarks, links, buttons, lists, and tables.
  Prefer native behavior; do not add ARIA that contradicts it.
- Verify controls have useful accessible names and associated labels.
  Check error descriptions, required/invalid state, and meaningful non-text
  content; decorative content should not add noise.
- Exercise keyboard navigation and activation.
  Check logical tab order, visible focus, no keyboard traps, and equivalence
  between pointer and keyboard actions.
- For dialogs, menus, and other overlays, check initial focus, focus containment
  where appropriate, expected dismissal, and focus restoration.
  Prefer fixing the established accessible primitive over custom focus code.
- Check loading, save results, validation, and asynchronously updated content
  for appropriate announcements without excessive or duplicated live regions.
- Review contrast, non-color state cues, zoom/reflow, touch target usability, and
  content visibility at the project's representative viewport sizes.
  Measure contrast using actual colors rather than guessing from class names.
- Check reduced-motion behavior for significant animations and avoid hiding
  essential state or content when motion is reduced.

## Prioritize And Verify

- Tie each finding to a user task, affected users, evidence, and file/line when
  available.
  Prioritize blocked navigation or actions ahead of cosmetic improvements.
- Recommend the smallest project-consistent fix.
  When implementing it, use `react-components` and `frontend-styling` only for
  their relevant React concerns.
- Use `browser-verification` for rendered interaction checks and
  `frontend-testing` for durable React/Next.js accessibility behavior tests.
  Recheck the specific defect after a fix rather than relying on a clean scan.
- Do not claim full accessibility or standards compliance from a scan or a
  limited review.
  State which criteria and interactions were actually examined.

## Report

Provide findings ordered by user impact, with location, reproduction or
evidence, recommended correction, and verification status.
State when no findings were observed within the reviewed scope and list gaps.

## Review Checklist

- Scope and available evidence are explicit.
- Names, keyboard interaction, focus, and dynamic feedback were considered.
- Visual and motion findings have concrete evidence.
- Fixes preserve project primitives and native semantics.
- Conclusions do not exceed the checks performed.

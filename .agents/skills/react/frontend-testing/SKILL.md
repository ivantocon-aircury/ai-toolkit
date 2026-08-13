---
name: frontend-testing
description: Use whenever adding, editing, or reviewing tests for React or Next.js behavior, forms, routes, API-backed screens, analytics, loading states, or accessibility. Trigger when the user asks to test a frontend change or reproduce a UI flow, even if they do not name the test runner. Choose the runner already supported by the project, use semantic locators and stable existing selectors, mock at API boundaries, and verify meaningful behavior rather than implementation details.
---

# Frontend Testing

Use this skill to add focused, deterministic frontend tests that survive refactors. Inspect the package scripts, test configuration, fixtures, and nearby tests before choosing a file location or assertion style.

## Related Skills

- Use `react-components` for component boundaries and accessible markup.
- Use `react-hook-form-yup` for form validation and submit behavior.
- Use `react-query-api` for API-backed query and mutation behavior.
- Use `nextjs-app-router` for route, redirect, metadata, and boundary behavior.

## Choose The Existing Runner

- Use the project's configured unit/component runner for hooks and isolated component behavior.
- Use the project's configured browser runner for navigation, authentication, API-backed flows, and cross-component behavior.
- Do not introduce a new test framework because it is familiar. Follow the existing scripts, setup files, fixtures, and test naming.
- Put tests beside the existing feature or in the project's established `tests` area; preserve the local organization.

## Test Behavior

- Test what a user can observe and do: rendered content, labels, enabled/disabled state, validation messages, URL changes, request outcomes, and visible success/error states.
- Cover the meaningful state matrix for changed behavior: initial loading, success, empty result, validation failure, server failure, retry/recovery, and pending submission where relevant.
- Verify accessibility contracts such as labels, roles, accessible names, focusable controls, dialog state, and alert output.
- Test the smallest useful surface. Do not duplicate the same implementation detail in unit, component, and browser tests without a behavior reason.
- For forms, test user input and submission rather than calling internal handlers directly.

## Locators

- Prefer accessible roles and names, labels, visible text, and URLs.
- Use the project's configured stable attribute such as `data-testid` or `data-cy` only when semantic locators cannot identify a dynamic control reliably.
- Add stable selectors to important fields, submit actions, table actions, dynamic rows, and stateful controls when required by the existing test style.
- Never select by Tailwind class, generated DOM structure, brittle text fragments, or array index.
- Keep selectors specific enough to identify the intended control but not coupled to visual copy that is expected to change.

## API And State Boundaries

- Mock or stub at the API/module boundary when testing a component or hook. Avoid mocking every child component because that hides integration problems.
- Use deterministic fixtures and reset mocks, cookies, navigation state, and query state between tests.
- For browser tests, use request contexts or existing setup helpers for deterministic authentication and data creation when available.
- Assert the outcome of requests through visible UI, URLs, or response effects rather than inspecting private query-cache internals.
- Make tests independent. A test must not rely on execution order or data created by a previous test unless the existing fixture system explicitly guarantees isolation.

## Async Behavior

- Wait for meaningful conditions: a role, text, URL, request completion, or state transition.
- Do not use arbitrary sleeps to hide race conditions. If timing is unstable, identify the missing state or request assertion.
- Use the runner's async query and assertion APIs consistently.
- Verify that loading indicators disappear or that previous data remains visible during background refetch when that is part of the feature contract.

## Test Data

- Create data through existing generators, fixtures, factories, or API helpers.
- Use deterministic values that make the assertion unambiguous.
- Avoid whole-response or whole-page snapshots for behavior that can be asserted semantically.
- Assert the smallest stable response shape and repository/network side effect needed to prove the behavior.

## Verification

- Run the smallest targeted test command first.
- Run the project's relevant lint, type check, and build checks when the change affects compilation or route behavior.
- When a test fails, inspect whether the product behavior or the locator/fixture is wrong before weakening the assertion.
- Report skipped checks and environment limitations rather than implying full verification.

## Review Checklist

- Existing test runner, setup, fixtures, and naming conventions were used.
- Tests cover user-visible behavior and relevant loading/error/empty/pending states.
- Locators are semantic or use the project's stable selector convention.
- API calls are mocked at an appropriate boundary and state is reset between tests.
- Async assertions wait for meaningful conditions with no arbitrary delays.
- Data is deterministic and tests are independent.
- Assertions prove behavior without coupling to classes, DOM implementation, or array order.
- Targeted tests and available static checks were run and reported accurately.

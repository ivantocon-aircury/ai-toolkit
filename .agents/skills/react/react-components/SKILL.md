---
name: react-components
description: Use whenever creating, editing, or reviewing React or TSX components, feature modules, page components, modals, form controls, hooks used by components, or reusable UI. Prefer this skill whenever the user asks to add a component, split a screen into components, refactor JSX, or build interactive React UI, even if they do not mention component architecture. Components should use default PascalCase function declarations, explicit client boundaries, local typed props, accessible markup, and stable test selectors.
---

# React Components

Use this skill to build React components in a consistent, feature-oriented style. Preserve the project's existing component and import conventions where they differ, but keep the boundaries below unless there is a concrete reason not to.

## Related Skills

- Use `frontend-styling` for visual layout, responsive behavior, design tokens, and class composition.
- Use `react-hook-form-yup` for forms and validation.
- Use `react-query-api` for server-state fetching, mutations, and API modules.
- Use `frontend-testing` when adding or changing behavior tests.
- Use `nextjs-app-router` for pages, layouts, route segments, metadata, and server/client route boundaries.

## Component Declaration

- Define React components with a named PascalCase function declaration and default-export the component.

```tsx
interface Props {
  title: string
  onClose: () => void
}

export default function NoticePanel({ title, onClose }: Props) {
  return (
    <section aria-labelledby="notice-panel-title">
      <h2 id="notice-panel-title">{title}</h2>
      <button type="button" onClick={onClose}>
        Close
      </button>
    </section>
  )
}
```

- Do not use `React.FC` for ordinary components.
- Do not use `const Component = () => ...` for new components when a function declaration is sufficient.
- Use `forwardRef` only for a reusable DOM primitive that genuinely needs to expose its ref, such as an input used by React Hook Form.
- Default-export components. Use named exports for hooks, API functions, types, schemas, constants, and other non-component values.
- Keep a local `Props` interface near the component, typically after the implementation when that matches the surrounding files. Export it only when another module actually needs the type.
- Keep a component focused on one visual or interaction responsibility. Split a large screen by feature responsibility, not by arbitrary fragments.
- Do not add memoization, `useMemo`, or `useCallback` by default. Add it only when profiling, a stable child contract, or the project's React Compiler configuration justifies it.

## Organization

- Keep route files under the project's route directory and feature UI in feature-oriented component folders.
- Put feature-only pieces close to their feature. Typical subfolders are `components`, `modules`, `modals`, `tabs`, and `steps`.
- Put genuinely reusable primitives in a shared UI area. Do not move a component there merely because it is used twice.
- Keep API transport, route construction, and domain transformations out of JSX when they are reusable or independently testable.
- Prefer the configured absolute import alias for cross-feature imports and relative imports for close siblings.
- Follow the existing filename convention. For new feature components, PascalCase filenames are preferred; framework-reserved route filenames remain lowercase.
- Name screen-level feature components with a `PageComponent` suffix. Use descriptive suffixes such as `Form`, `Modal`, `Table`, `Block`, `LayoutComponent`, and `Cell` when they clarify the component's role.

## Client Boundaries

- Keep components server-compatible by default.
- Add `'use client';` as the first statement only when the module uses hooks, event handlers, browser APIs, client context, or a browser-only library.
- Keep the client boundary as low in the tree as practical. Do not turn a route page or an entire layout into a Client Component just to support one interactive control.
- Pass serializable props from Server Components to Client Components. Keep server-only authentication, secrets, and filesystem/database access on the server side.
- Use `startTransition`, `useDeferredValue`, or an effect event when the interaction benefits from interruptible updates or separating urgent from non-urgent work. Do not introduce them mechanically.
- Keep local UI state local. Use a shared state solution only when multiple parts of the feature genuinely need the same state.

## Props And Rendering

- Type required and optional props explicitly. Prefer discriminated unions for mutually exclusive states.
- Avoid boolean prop combinations that permit invalid states; use a union or a small variant type when the states have different contracts.
- Derive display values during render when possible instead of synchronizing duplicate state with an effect.
- Use stable domain identifiers for list keys. Never use array indexes for reorderable or mutable lists.
- Handle meaningful loading, error, empty, disabled, and success states instead of rendering only the happy path.
- Keep event handlers intention-revealing and close to the interaction they serve. Move reusable domain logic to a hook or service.

## Accessibility

- Prefer semantic HTML: headings, landmarks, links for navigation, buttons for actions, lists for collections, and tables for tabular data.
- Give every form control an associated label. Reuse shared form primitives when they provide IDs, error text, and ARIA wiring.
- Give icon-only controls an accessible name. Mark decorative icons as hidden from assistive technology.
- Set an explicit `type` on every button, especially buttons inside forms.
- Expose state for expandable, selected, pressed, busy, invalid, and disabled controls through the appropriate HTML or ARIA attributes.
- Use accessible dialog/select primitives rather than implementing focus management from scratch.

## Stable Selectors

- Prefer roles, labels, visible text, and URLs in tests.
- Add the project's configured stable test attribute to important actions, fields, dynamic rows, and stateful controls when semantic targeting is insufficient.
- Do not add selectors based on Tailwind classes, generated DOM structure, or array indexes.

## Review Checklist

- Component uses `export default function PascalCaseName(...)` unless a concrete existing convention requires otherwise.
- Props are typed locally and the component has no unnecessary `React.FC` or memoization.
- `'use client';` exists only where client behavior requires it.
- Route, API, and domain concerns are not unnecessarily embedded in presentational JSX.
- Loading, error, empty, disabled, and success states are represented where relevant.
- Semantics, labels, button types, focus behavior, and ARIA state are correct.
- Lists use stable keys and important interactions have stable selectors when needed.

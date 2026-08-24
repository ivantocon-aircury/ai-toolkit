---
name: tailwindcss
description: Use whenever creating, editing, or reviewing Tailwind CSS configuration, utility classes, responsive layouts, variants, theme tokens, plugins, global Tailwind styles, or class composition in React and Next.js projects. Trigger for requests to add Tailwind classes, customize tailwind.config, fix responsive or variant behavior, style headless primitives, or refactor utility strings. Reuse the project's tokens and class helper, prefer object-based conditional classes, and avoid dynamic utilities that Tailwind cannot detect.
---

# Tailwind CSS

Use this skill for Tailwind mechanics. Use `frontend-styling` for broader visual hierarchy, responsive design quality, accessibility, and choosing between styling systems.

## Related Skills

- Use `frontend-styling` for visual design, layout quality, responsive review, and styling boundaries.
- Use `react-components` for component structure, props, exports, and client boundaries.
- Use `frontend-testing` for interaction and accessibility verification.
- Use `react-controlled-form-widgets` for portaled form controls whose styles cross DOM boundaries.

## Inspect First

- Inspect the installed Tailwind version, `tailwind.config`, global CSS, content globs, plugins, dark-mode strategy, and the project's class helper before changing styles.
- Identify whether the project uses `cn`, `classnames`, `clsx`, `tailwind-merge`, a variant utility, or a local equivalent. Reuse it; do not create a competing helper.
- Preserve the existing boundary between Tailwind utilities, Sass/global CSS, CSS Modules, and styled-components. A new utility is not a reason to move an existing primitive to another system.
- Check whether shared tokens are consumed by JavaScript libraries, portals, or styled primitives before renaming or removing them.

## `cn` Helper

- If the project already has a class helper, use its existing import and behavior. Do not add a second `cn` implementation.
- If no suitable helper exists, add `clsx` and `tailwind-merge` as direct runtime dependencies using the package manager already used by the project. Detect it from the lockfile or `packageManager` field; never introduce a second package manager. Use the equivalent command, for example `npm install clsx tailwind-merge`, `pnpm add clsx tailwind-merge`, `yarn add clsx tailwind-merge`, or `bun add clsx tailwind-merge`.
- Add the helper in the project's established shared utility location, such as `src/lib/cn.ts` or `src/util/cn.ts`:

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
```

- `clsx` handles strings, arrays, and object conditions; `tailwind-merge` resolves conflicting Tailwind utilities so later variants can intentionally override base classes.
- Keep the helper named and typed consistently with the rest of the project. Verify the dependency entries, lockfile, import alias, and a representative class-conflict case after adding it.

## Utilities And Tokens

- Prefer semantic theme tokens for application colors, typography, spacing, radii, shadows, and motion. Add a token to configuration when it represents a repeated design decision.
- Use utility classes for layout, spacing, typography, responsive behavior, and interaction states rather than one-off global selectors.
- Keep arbitrary values rare and explainable. Use them for a genuine one-off constraint, not to bypass an existing token.
- Use mobile-first utilities and add breakpoint variants for larger layouts. Check narrow widths, long content, tables, dialogs, and touch targets.
- Keep responsive and state variants close to the base class so the full behavior is visible.

## Conditional Classes

- Use the configured class helper for merging and conflict resolution.
- Prefer objects with class names as keys and boolean expressions as values for conditional classes.

```tsx
className={cn('rounded-md px-4 py-2', {
  'bg-primary text-primary-foreground': variant === 'primary',
  'bg-secondary text-secondary-foreground': variant === 'secondary',
  'cursor-not-allowed opacity-50': disabled,
})}
```

- Do not build utilities through interpolated fragments such as `` `bg-${color}-500` `` unless the complete values are safelisted and the project deliberately supports that pattern.
- Prefer complete static class strings in maps when a value is selected dynamically.
- Keep base, variant, and state classes distinguishable. Avoid long opaque strings that make it difficult to see which state wins.

## Components And Variants

- Put repeated variants in the shared primitive or a local variant definition, not in every consumer.
- Keep variant names domain-neutral and typed when the primitive is reusable.
- Set disabled, loading, selected, invalid, pressed, and focus-visible styles together with the corresponding HTML or ARIA state.
- For headless primitives, use documented data attributes or state props such as `data-state` and `data-disabled` instead of guessing from DOM structure.
- Keep focus indicators visible and do not use `outline-none` without an equivalent `focus-visible` treatment.

## Portals And Global Styles

- Portaled dialogs, menus, tooltips, and select lists do not inherit styles from the trigger's DOM subtree. Style the portaled content explicitly and verify its stacking context.
- Keep z-index values tokenized or ordered through the project's established scale.
- Use `@apply` only where the project already uses it for a repeated primitive or global rule. Do not hide complex component logic in large `@apply` blocks.
- Keep third-party global overrides in the established global stylesheet and document why they are global.

## Validation

- Confirm all new classes are covered by content globs or an intentional safelist.
- Check class conflicts after merging responsive and state variants.
- Verify keyboard focus, disabled behavior, reduced motion, contrast, and content overflow.
- Run the project's formatter, lint, type check, and build checks when available.

## Review Checklist

- Existing Tailwind version, theme, helper, plugins, and styling boundaries were inspected.
- Repeated design values use semantic tokens rather than arbitrary utilities.
- Conditional classes use object maps with class names as keys and booleans as values.
- Dynamic utilities are static or intentionally safelisted.
- Responsive, state, focus, and disabled variants are complete and accessible.
- Headless and portaled primitives are styled through their state/portal contract.
- No unrelated global CSS or parallel class-merging utility was introduced.

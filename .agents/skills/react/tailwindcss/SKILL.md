---
name: tailwindcss
description: Use when Tailwind CSS is installed or explicitly requested and the task changes utilities, responsive variants, tokens, plugins, global Tailwind CSS, source detection, or class composition. Adapts to Tailwind v3, v4, and project helpers.
---

# Tailwind CSS

Repository instructions, the installed Tailwind version, local tokens, and class
composition conventions take precedence. Use `frontend-styling` for visual design.

## Related Skills

- Use `frontend-styling` for visual design, layout quality, responsive review, and styling boundaries.
- Use `react-components` for component structure, props, exports, and client boundaries.
- Use `frontend-testing` for interaction and accessibility verification.
- Use `react-controlled-form-widgets` for portaled form controls whose styles cross DOM boundaries.

## Inspect First

- Inspect the installed Tailwind version first. For v3, inspect configuration,
  content globs, plugins, and safelists. For v4, inspect CSS-first `@theme`,
  automatic source detection, and any `@source` directives. Also inspect global
  CSS, dark mode, and the project's class helper.
- Identify whether the project uses `cn`, `classnames`, `clsx`, `tailwind-merge`, a variant utility, or a local equivalent. Reuse it; do not create a competing helper.
- Preserve the existing boundary between Tailwind utilities, Sass/global CSS, CSS Modules, and styled-components. A new utility is not a reason to move an existing primitive to another system.
- Check whether shared tokens are consumed by JavaScript libraries, portals, or styled primitives before renaming or removing them.

## Class Helpers

- If the project already has a class helper, use its existing import and behavior. Do not add a second `cn` implementation.
- Do not add a class-merging dependency merely because none exists. Add one only
  when the task needs reusable conditional merging and the project accepts the
  dependency. Place it in the established utility location.

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
- Follow the helper's established string, array, object, or variant API. Keep full
  class names statically discoverable.

```tsx
className={cn('rounded-md px-4 py-2', {
  'bg-primary text-primary-foreground': variant === 'primary',
  'bg-secondary text-secondary-foreground': variant === 'secondary',
  'cursor-not-allowed opacity-50': disabled,
})}
```

- Do not build utilities through interpolated fragments such as
  `` `bg-${color}-500` `` unless complete values are explicitly sourced or
  safelisted using the installed Tailwind version's mechanism.
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

- Confirm v3 content globs/safelist or v4 source detection/`@source` covers all
  new classes.
- Check class conflicts after merging responsive and state variants.
- Verify keyboard focus, disabled behavior, reduced motion, contrast, and content overflow.
- Run the project's formatter, lint, type check, and build checks when available.

## Review Checklist

- Existing Tailwind version, theme, helper, plugins, and styling boundaries were inspected.
- Repeated design values use semantic tokens rather than arbitrary utilities.
- Conditional classes follow the existing helper and remain statically detectable.
- Dynamic utilities are static or intentionally safelisted.
- Responsive, state, focus, and disabled variants are complete and accessible.
- Headless and portaled primitives are styled through their state/portal contract.
- No unrelated global CSS or parallel class-merging utility was introduced.

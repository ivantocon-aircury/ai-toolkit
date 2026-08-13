---
name: frontend-styling
description: Use whenever creating, editing, or reviewing visual React UI, Tailwind classes, responsive layouts, shared primitives, Sass styles, styled-components, CSS Modules, colors, spacing, typography, or interactive states in Next.js projects. Trigger for requests to style a component, improve a screen, make a layout responsive, or match an existing visual system, even when the user does not name the styling technology. Preserve established tokens, class-merging helpers, styling boundaries, accessibility, and desktop/mobile behavior instead of inventing a parallel design system.
---

# Frontend Styling

Use this skill to make UI changes that fit the existing visual language and remain usable across viewport sizes. Inspect the project's styling setup before editing; the rules below are defaults, not a reason to replace an established system.

## Related Skills

- Use `react-components` for component structure, props, exports, and client boundaries.
- Use `nextjs-app-router` for route layouts and page composition.
- Use `frontend-testing` for visual behavior, interaction, and accessibility tests.
- Use `react-hook-form-yup` for form structure and validation behavior.

## Inspect Before Styling

- Check the package manifest, Tailwind or other theme configuration, global styles, class-merging helper, and nearby components before adding classes.
- Reuse existing buttons, links, inputs, alerts, loaders, tables, dialogs, typography, and layout primitives.
- Follow the local choice between Tailwind, Sass, CSS Modules, and styled-components. Do not introduce a second styling boundary for convenience.
- Use the project's configured import alias and class composition helper rather than creating local replacements.
- Treat existing tokens as the visual contract. Extend the token source when a value is a real design token, not for one-off decoration.

## Layout And Tokens

- Prefer semantic theme tokens for color, spacing, radius, shadows, typography, and motion. Avoid arbitrary values when an existing token expresses the intent.
- Build layouts with clear container, grid, flex, and gap rules. Avoid using absolute positioning for primary page structure.
- Keep content readable with deliberate max widths, line heights, and spacing rhythm.
- Use responsive classes or media rules for both narrow and wide viewports. Check wrapping, overflow, touch targets, tables, dialogs, and navigation on mobile.
- Make the smallest structural change that solves the requested design problem. Do not rewrite neighboring screens or replace the theme without a requirement.

## Class Composition

- Use the shared `cn()` or equivalent helper for conditional and merged classes.
- For conditional classes, prefer an object with class names as keys and boolean expressions as values. Use the project's helper's supported object syntax instead of short-circuit strings such as `disabled && 'cursor-not-allowed opacity-50'`.
- Keep base styles, variants, and state styles distinguishable. Put conditional state logic in the component rather than hiding important behavior in string concatenation.
- Prefer explicit variants for reusable primitives instead of repeated ad hoc class combinations.
- Avoid class selectors in application logic and avoid styling based on DOM depth that is likely to change.

```tsx
<button
  type="button"
  className={cn(
    'rounded-md px-4 py-2 font-medium transition-colors focus-visible:outline-none',
    'bg-primary text-primary-foreground hover:bg-primary/90',
    {
      'cursor-not-allowed opacity-50': disabled,
    },
  )}
  disabled={disabled}
>
  {children}
</button>
```

## States And Accessibility

- Style hover, focus-visible, active, disabled, loading, selected, invalid, and error states when the control supports them.
- Keep focus indicators visible and high contrast. Do not remove outlines without replacing them with an equally clear focus-visible treatment.
- Do not communicate meaning through color alone. Pair color with text, iconography, shape, or state attributes.
- Preserve readable contrast, usable touch targets, and clear disabled/loading affordances.
- Use semantic elements first; styling a `div` to look like a button does not provide button behavior or keyboard support.
- Keep motion brief and purposeful, and respect reduced-motion preferences where animation is meaningful.

## Visual Quality

- Match existing typography, density, radii, shadows, and color hierarchy before adding novelty.
- Avoid generic decorative gradients, excessive cards, random pills, and visually noisy effects unless they serve the product and fit the established system.
- Give prominent content a clear hierarchy and enough whitespace to scan.
- Make empty and error states intentional rather than leaving unstyled text in a layout.
- When a request is ambiguous, improve hierarchy, alignment, and responsive behavior before adding decoration.

## Validation

- Inspect the rendered result at a narrow mobile width and a desktop width.
- Check keyboard focus and interaction states for every changed control.
- Check long labels, empty data, errors, loading indicators, and content overflow.
- Run the project's formatter, lint, type check, or build command when available.

## Review Checklist

- Existing styling boundaries, tokens, primitives, and class helper were reused.
- No unnecessary styling system, global override, or arbitrary token was introduced.
- Layout works on mobile and desktop without clipped or unreachable content.
- Responsive typography, spacing, overflow, and touch targets are intentional.
- Focus, hover, active, disabled, loading, selected, and invalid states are visible where relevant.
- Contrast and meaning do not rely on color alone.
- The result fits the surrounding visual language rather than looking like a separate template.

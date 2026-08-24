---
name: react-controlled-form-widgets
description: Use whenever integrating React Hook Form with React Select, AsyncSelect, date pickers, date ranges, file inputs, rich-text editors, switches, checkboxes, reCAPTCHA, or other controlled form widgets in React and Next.js projects. Trigger when a field does not behave like a native input, when a browser-only selector needs SSR handling, or when option loading, portals, value normalization, accessibility, and API payload conversion must be coordinated.
---

# React Controlled Form Widgets

Use this skill for adapters between form state and non-native controls. Use `react-hook-form-yup` for schema validation and form lifecycle, `react-query-api` for option-loading transport, and `frontend-testing` for interaction coverage.

## Adapter Contract

- Use `Controller` or the project's equivalent controlled-field adapter when a widget does not expose a native `value`, `onChange`, `name`, and ref contract.
- Keep the adapter responsible for translating the widget's value and events into the form's field contract. Keep API calls and domain decisions outside the visual control.
- Preserve `field.onChange`, `field.onBlur`, `field.name`, and `field.ref` where the widget supports them.
- Normalize the widget's empty value deliberately. Decide whether the form stores `null`, `undefined`, an empty string, or an empty collection and keep that choice consistent.
- Keep option types explicit. Do not pass an untyped object from a selector through the form and cast it at submit time.

## Select And AsyncSelect

- Map between option objects and the form/API representation explicitly, such as an option object in the UI and an ID in the payload.
- Handle single, multi, clearable, disabled, and creatable modes as separate typed contracts when their values differ.
- Debounce async option loading and ignore stale responses. Do not issue a request for every keystroke without a deliberate reason.
- Use `enabled` or an equivalent guard when options depend on another field. Clear dependent selections when the parent value changes.
- Keep option loading in an API/query module or injected loader. The selector should not own authentication headers or response parsing.

## Date And Time Controls

- Choose one form representation for dates, usually a typed `Date`, ISO string, or date-only string, and convert at the field or submit boundary.
- Treat date-only values differently from instants. Do not apply the browser's local timezone to a date-only API field accidentally.
- Normalize min/max dates, invalid values, cleared values, and range ordering before submission.
- Keep formatting and parsing in a small helper or adapter rather than duplicating date logic in every field.
- Make timezone assumptions explicit when using a date library.

## Files, Editors, And Other Controls

- For file inputs, keep the browser `File` or `FileList` in the form only as long as needed, validate type/size, and convert to `FormData` in the API boundary.
- For rich-text editors, decide whether the form stores HTML, JSON, or plain text and validate the same representation that the API receives.
- For switches, checkboxes, ratings, and reCAPTCHA, map boolean/token/object values explicitly and preserve accessible labels.
- For repeatable widget rows, use stable field-array IDs for React keys and clear removed values intentionally.

## Next.js And Portals

- Add `'use client';` to the smallest adapter that needs browser APIs or widget hooks.
- Load browser-only widgets with the project's established dynamic import strategy, including `ssr: false` only when SSR genuinely cannot render the library.
- Portaled menus and dialogs do not inherit the trigger's ancestor styles. Configure the portal target, z-index, width, and error/focus presentation intentionally.
- Keep server components from importing browser-only widget modules through an accidental barrel export.

## Accessibility And Testing

- Reuse shared field wrappers for labels, IDs, help text, `aria-invalid`, and `aria-describedby`.
- Give searchable selectors an accessible label and preserve keyboard navigation, clear actions, and loading announcements.
- Test opening the widget, choosing/clearing a value, validation errors, dependent loading, pending submission, and the final payload.
- Query portaled options and dialogs at document scope using roles or stable selectors, not only within the trigger subtree.

## Review Checklist

- Controlled field uses the established adapter and preserves the form field contract.
- Empty, option, date, file, editor, and token values are normalized explicitly.
- Async options are debounced, guarded, and protected from stale responses.
- Browser-only imports and portals are handled without leaking client code into server modules.
- Labels, errors, focus, keyboard behavior, and loading announcements are accessible.
- Submit payload conversion is explicit and covered by a meaningful test.

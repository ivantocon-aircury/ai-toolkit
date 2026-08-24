---
name: react-hook-form-yup
description: Use whenever creating, editing, or reviewing React forms, validation schemas, controlled selectors, date pickers, file inputs, asynchronous uniqueness checks, or submit flows in Next.js frontends. Prefer this skill whenever the user asks to add a form or field, validate input, support create/edit mode, or connect a form to an API, even if they do not explicitly mention React Hook Form or Yup. Use the established React Hook Form plus Yup pattern, shared controls, translated errors, explicit payload transformation, and accessible test selectors.
---

# React Hook Form And Yup

Use this skill for forms whose UI values need validation, controlled widgets, async checks, or conversion into an API payload. Keep the form responsible for input state and presentation; keep transport and cache ownership in the appropriate API or query layer.

## Related Skills

- Use `react-components` for component declarations, props, and client boundaries.
- Use `react-controlled-form-widgets` for adapters around React Select, date pickers, editors, files, switches, and other controlled inputs.
- Use `frontend-styling` for form layout and visual states.
- Use `react-query-api` for API functions, mutations, query invalidation, and server state.
- Use `frontend-testing` for validation, submission, and accessibility tests.

## Form Setup

- Use `useForm<FormValues>()` with a Yup schema through `yupResolver` when the project uses this stack.
- Keep the schema close to the form unless it is genuinely shared by multiple forms or API boundaries.
- Define explicit `defaultValues`; do not rely on uncontrolled browser defaults for application fields.
- Type the form values separately from the API request when the UI representation differs from the transport representation.
- Reuse shared input, label, selector, date, checkbox, file, and error primitives so IDs, refs, styles, and ARIA attributes remain consistent.

```tsx
const validationSchema = yup.object({
  name: yup.string().trim().required(t('validation.required')),
  categoryId: yup.string().required(t('validation.required')),
})

const form = useForm<FormValues>({
  defaultValues: {
    name: initialValue?.name ?? '',
    categoryId: initialValue?.categoryId ?? '',
  },
  resolver: yupResolver(validationSchema),
})
```

- Keep translated messages in the project's translation system when one exists. Do not hard-code a new language layer inside a form.
- Use `noValidate` only when the form's validation UI intentionally replaces native browser validation.

## Field Registration

- Use `register()` for native text, number, email, textarea, checkbox, and radio controls.
- Use `Controller` for selectors, date pickers, rich text editors, toggles, file inputs, reCAPTCHA, and any controlled component that does not expose a compatible ref/value contract.
- Preserve the field name and error path when wrapping a shared control. A styled control that is not connected to form state is not a working form field.
- Give every field a visible or screen-reader label, stable ID, and error association. Set `aria-invalid` and `aria-describedby` through the shared primitive or explicitly.
- Set explicit button types. Submit buttons should reflect `isSubmitting` and prevent duplicate submissions.

## Create And Edit Modes

- Normalize incoming entity data into form values before rendering. Convert nullable values, IDs, dates, numbers, files, and option objects deliberately.
- Use `reset()` or the project's established `values` pattern when an edit record changes; do not leave stale values from a previous record.
- Keep the UI model stable even when the API has a different shape. The submit handler is the boundary where the payload is assembled.
- Decide explicitly how empty strings, nulls, omitted fields, and unchanged files are represented in update requests.

## Submission Boundary

- Make the submit handler transform `FormValues` into the exact request DTO. Do not pass raw form values to an API unless their contracts are identical.
- Convert numeric strings, dates, option objects, nullable values, and files at this boundary.
- Keep API calls in a domain API module or mutation hook. The form may call an injected submit function or a mutation hook, but should not duplicate HTTP setup.
- Display server validation errors in the same field error system when the API returns field-level violations.
- Map non-field server failures to a form-level or submit-level error. Do not attach an unrelated API error to the first field just to make it visible.
- Preserve user input when submission fails unless the server explicitly requires a reset.

```tsx
const onSubmit = form.handleSubmit(async (values) => {
  await saveRecord({
    name: values.name.trim(),
    categoryId: values.categoryId,
    dueDate: values.dueDate ? formatDateForApi(values.dueDate) : null,
  })
})
```

## Async Validation

- Debounce uniqueness and remote validation requests. Do not make a network request for every keystroke.
- Avoid async validation when a server-side submit check is sufficient.
- Cancel or ignore stale responses so an older request cannot overwrite a newer value's result.
- Keep async validation errors distinct from transport failures and display a useful retry or submit-level message for the latter.

## Form States

- Represent initial values, dirty state, submitting, success, field errors, server errors, and disabled controls intentionally.
- Disable only controls that cannot safely operate during submission; keep error recovery possible.
- For dependent fields, clear or revalidate values when the controlling field changes.
- For file fields, validate type and size before upload when practical and never mutate the source fixture or browser file object.
- Use `useFieldArray` for repeatable fields and stable item identifiers for rows. Do not use array indexes as React keys when items can be inserted, removed, or reordered.
- Treat Formik or another legacy form abstraction as existing-code compatibility. Use the project's current React Hook Form pattern for new forms unless migration is explicitly requested.

## Review Checklist

- Form values are typed and have deliberate default values.
- Yup validation is connected through the resolver and messages follow the existing translation system.
- Native fields use `register`; controlled widgets use `Controller`.
- Shared controls provide labels, IDs, refs, errors, and ARIA wiring.
- Edit data is normalized and refreshed without stale values.
- Submit values are explicitly transformed into the API contract.
- Loading, duplicate-submit prevention, field errors, server errors, and success behavior are covered.
- Async checks are debounced and stale responses cannot win.
- Important fields and actions have stable selectors when semantic test locators are insufficient.

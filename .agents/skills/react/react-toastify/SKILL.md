---
name: react-toastify
description: Use whenever creating, editing, or reviewing React Toastify notifications, toast containers, mutation feedback, upload progress messages, authentication errors, or success/error alerts in React and Next.js projects. Trigger when a user asks to show a toast, standardize notifications, report an API result, or test a notification flow. Keep the container centralized, messages translated and actionable, notifications tied to real outcomes, and client-only behavior out of server modules.
---

# React Toastify

Use this skill for transient notifications. Use inline alerts for persistent or field-specific problems; use `react-query-api` for the mutation/error contract that determines when a notification is justified.

## Related Skills

- Use `react-components` for accessible action and status markup.
- Use `react-query-api` for mutation lifecycle and API error classification.
- Use `react-hook-form-yup` for field and form-level validation errors.
- Use `nextjs-app-router` for provider placement and server/client boundaries.
- Use `frontend-testing` for notification behavior and provider harnesses.

## Provider Placement

- Inspect the installed React Toastify version, existing CSS import, theme, and container before adding another instance.
- Mount one intentional `ToastContainer` in the existing client provider or application shell. Do not add a container inside every feature.
- Keep the container's position, limit, auto-close, pause, theme, and transition consistent with the existing design system.
- Import Toastify only from client modules. Do not call browser notification APIs or Toastify from Server Components, route handlers, or server-only services.
- Preserve the project's established global CSS import order and portal/z-index rules.

## Choosing The Message

- Use a toast for short-lived feedback that does not block the user's next action: completed mutations, saved settings, copied content, or recoverable background failures.
- Use inline alerts for information the user must keep visible, field errors, destructive confirmation, and detailed recovery instructions.
- Do not toast every validation error or every query refetch. Notify on a meaningful user action or an error that would otherwise be invisible.
- Keep messages concise, translated through the existing i18n system when present, and specific about the outcome. Include an actionable recovery path when one exists.

## Mutation Feedback

- Trigger success notifications from the confirmed mutation success callback, not immediately after a click.
- Trigger failure notifications from classified API/domain errors. Preserve field-level validation and show a toast only for the remaining form-level or transport failure.
- Tie loading/pending notifications to a promise or mutation lifecycle only when the operation is long enough to need transient progress feedback.
- Avoid showing both a toast and an identical inline message unless the product deliberately uses both channels.
- Dismiss or update a loading toast when the operation resolves, rejects, or is cancelled.

## Duplicate Prevention And Lifecycle

- Do not fire toasts during render. Guard effect-based notifications against duplicate execution and dependency churn.
- Avoid notifying twice when both a shared API connector and a feature mutation handle the same error. Choose one owner.
- Use stable toast IDs or an equivalent deduplication strategy for repeated background events.
- Clear stale loading notifications on unmount, cancellation, logout, and route changes when they no longer describe a live operation.
- Never put tokens, personal data, raw server payloads, or stack traces in user-visible notification text.

## Accessibility And UX

- Preserve the library's accessible role and live-region behavior. Do not hide important content only inside a toast.
- Keep toast contrast, close controls, duration, focus behavior, and pause-on-hover/blur aligned with the project's accessibility needs.
- Use an inline error or persistent status when the user must be able to review it later.
- Ensure mobile placement does not cover navigation, form actions, or safe-area content.

## Testing

- Render the existing toast container in the shared test harness when testing notification behavior.
- Assert user-visible message text, role, dismissal, and the triggering outcome rather than inspecting Toastify internals.
- Test success, classified failure, duplicate prevention, loading-to-success/error transitions, and translated messages where relevant.
- Reset containers, timers, and notification state between tests. Use fake timers only for duration-specific behavior.

## Review Checklist

- One centralized client-side container and existing CSS/theme conventions are reused.
- Toasts are reserved for meaningful transient outcomes; persistent and field errors use the correct channel.
- Success/failure/loading notifications are tied to actual mutation or operation lifecycle.
- Messages are translated, concise, safe, and actionable without exposing sensitive data.
- Duplicate notifications and stale loading toasts are prevented or cleaned up.
- Accessibility, mobile placement, dismissal, and test-harness behavior are covered.

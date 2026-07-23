# Shell Command Guidance

- Prefer focused, read-only commands for inspection.
- Keep diagnostics visible. Do not use `2>/dev/null` or other `/dev/null` redirection to hide errors by default. If suppression is intentional, explain why.
- Inspect the project setup before running tooling commands.
- When Docker or Docker Compose is configured, run project tooling inside the appropriate container.
- Avoid destructive commands and commands that modify project files unless explicitly required.
- Keep command output concise without hiding failures.

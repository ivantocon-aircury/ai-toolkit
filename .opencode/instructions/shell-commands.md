# Shell Command Guidance

- Prefer focused, read-only commands for inspection.
- Keep diagnostics visible. Never redirect output to `/dev/null`; do not hide errors.
- Inspect the project setup before running tooling commands.
- When Docker or Docker Compose is configured, run project tooling inside the appropriate container.
- Avoid destructive commands and commands that modify project files unless explicitly required.
- Keep command output concise without hiding failures.

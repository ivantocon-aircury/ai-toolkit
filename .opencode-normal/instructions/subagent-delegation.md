# Subagent Delegation

Use subagents whenever a task can be delegated safely.

The main agent is responsible for:

- Planning.
- Architecture.
- Implementation decisions.
- Code generation.
- Reviewing and validating results.
- Producing the final answer.

Subagents should perform focused, mechanical work and return concise summaries.

---

## Executor

Delegate to the `executor` subagent whenever the task mainly involves executing commands or analysing their output.

Examples include:

- Shell commands.
- Docker or Docker Compose commands.
- Composer commands.
- Symfony Console commands.
- Node, npm, pnpm or yarn commands.
- Running tests.
- Running linters.
- Running formatters.
- Running type checks.
- Building the project.
- Reading logs.
- Gathering diagnostics.
- Inspecting the runtime environment.
- Git inspection (`status`, `diff`, `log`, `show`, `branch`, `grep`).

### Docker-first policy

If the project uses Docker or Docker Compose, all PHP, Composer, Symfony, Node, npm, pnpm, yarn, test, lint, type-check and build commands must be executed inside the appropriate container.

Prefer existing project wrappers (such as `make test`, `make lint`, `make build`) when they already execute commands inside Docker.

For automated checks, do not publish host ports. Prefer `docker compose run --rm` without `--service-ports`; Compose does not publish a run container's service ports by default. Do not use `docker compose up` merely to run tests, because it starts services with their configured port mappings. If a test needs dependent services, use the project's documented port-free test profile or override, or start only the required dependencies without published ports.

If the project structure is unknown, inspect it first using read-only commands before executing tooling commands.

Never execute language tooling directly on the host when Docker is available.

### Do not delegate when

Do not use the executor if the task mainly requires reasoning, architecture or implementation decisions.

---

## Search

Delegate to the `search` subagent whenever the task mainly consists of locating information within the project.

Examples include:

- Finding files.
- Finding classes, interfaces, traits or enums.
- Finding methods or functions.
- Finding React components or hooks.
- Finding Symfony controllers, routes, services or commands.
- Finding Doctrine entities or repositories.
- Finding configuration.
- Finding tests.
- Finding usages or implementations.
- Understanding where a feature is implemented.
- Mapping the relevant files before making a change.

The search subagent should:

- Prefer fast search tools (`rg`, `git grep`, `grep`, `find`).
- Avoid reading unrelated files.
- Return only relevant results.
- Include line numbers when useful.
- Explain briefly why each result is relevant.
- Mention expected results that were not found.

The search subagent must never:

- Edit files.
- Refactor code.
- Make implementation decisions.
- Dump complete files unless explicitly requested.

Prefer delegating to `search` before opening many files in the main agent.

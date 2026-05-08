# 0016 - Local git hooks

## Status

Accepted

## Context

The project must avoid GitHub Actions and use local hooks for quality gates.

## Decision

Use plain `.githooks/` wired through `make install-hooks`.

Hooks:

- `pre-commit`: format check, lint, typecheck, and `gitleaks protect --staged`.
- `commit-msg`: Conventional Commits validation.
- `pre-push`: `make test`, `make build`, and `make smoke`.
- `post-merge` and `post-checkout`: dependency hints and generated artifact reminders.

## Consequences

- Contributors must install local hooks.
- Checks are reproducible as Make targets outside git hooks.

## Alternatives Considered

- Lefthook: capable, but plain hooks reduce one dependency.

# 0013 - Testing strategy

## Status

Accepted

## Context

The app has pure analysis logic, browser file handling, and a Pages deployment target.

## Decision

Use:

- Vitest for unit tests on analysis, citation, storage-schema, and export logic.
- Playwright for one happy-path smoke test against a locally served `docs/` build.
- `scripts/smoke.sh` to build, serve, and test the Pages artifact.
- `make test`, `make lint`, `make build`, and `make smoke` as the local gate.

## Consequences

- Tests stay fast enough for pre-push hooks.
- Heavy model downloads are not part of automated tests.

## Alternatives Considered

- GitHub Actions: rejected by the bootstrap constraint.
- Browser-only manual QA: rejected because regressions in the static artifact would be too easy.

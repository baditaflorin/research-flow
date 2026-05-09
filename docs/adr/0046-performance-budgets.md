# 0046 - Performance budgets and measurement plan

## Status

Accepted

## Context

Real 75-page and 77-page papers took about 16s individually, and the six-PDF batch took about 36s.

## Decision

Budgets:

- <300ms: no progress UI required.
- > =300ms: visible progress required.
- > =5s: cancellable operation required.
- Real-data fixture runs record median, p95, and worst duration.

Measurement data lives under `docs/perf/`.

## Consequences

- Long PDF extraction must be abortable and report per-file progress.
- Performance regressions become visible in the postmortem.

## Alternatives Considered

- Only measure final smoke test time: rejected because it hides per-operation cliffs.

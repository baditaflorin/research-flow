# 0007 - Data generation pipeline

## Status

Accepted

## Context

Mode B would require an offline pipeline that writes static artifacts. Research Flow v1 is Mode A.

## Decision

Do not implement a data-generation pipeline in v1. `make data` is a documented no-op placeholder that validates this decision.

## Consequences

- No scheduled backend, release artifact publishing, or committed generated corpus exists.
- A future public benchmark corpus will need a new ADR before adding `/data/v1/` artifacts.

## Alternatives Considered

- Add sample generated data now: rejected because it could distract from the private local workflow.

# 0008 - Go backend project layout

## Status

Accepted

## Context

The bootstrap specifies Go layout for Modes B and C. Research Flow v1 is Mode A.

## Decision

Do not create a Go backend layout in v1. There is no `cmd/`, `internal/`, `pkg/`, or server binary because no backend is deployed.

## Consequences

- Go lint, Docker, metrics, and server health checks are not part of the v1 implementation.
- A future backend must add a new ADR and follow the requested Go project layout.

## Alternatives Considered

- Create empty Go folders: rejected because empty structure implies a backend exists when it does not.

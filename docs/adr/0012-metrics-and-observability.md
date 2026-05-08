# 0012 - Metrics and observability

## Status

Accepted

## Context

There is no runtime backend and no product requirement for analytics.

## Decision

Ship v1 with no analytics. The app exposes local status only: counts, processing duration, storage status, version, and commit.

## Consequences

- No PII or paper-derived telemetry is collected.
- Product usage insight comes from GitHub stars/issues and direct feedback.

## Alternatives Considered

- Plausible or beacon analytics: rejected for v1 to preserve trust in a private-paper workflow.

# 0050 - Interaction-learning policy

## Status

Accepted

## Context

The Phase 2 plan includes remembering corrections within a session, without adding accounts or sync.

## Decision

Remember only local, session-scoped corrections such as preferred title/author cleanup patterns. Store them in memory first; persisted per-user defaults are deferred. Surface remembered behavior transparently in debug mode.

## Consequences

- The app can avoid repeating an obvious mistake within one research session.
- No cross-device or account state is introduced.

## Alternatives Considered

- Persist all corrections permanently: deferred because it needs a stronger privacy and reset story.

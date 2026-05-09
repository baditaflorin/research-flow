# 0067 State Management Convention

## Status

Accepted

## Context

The app has project data, persisted settings, operation state, transient progress, and toasts.

## Decision

Project state is persisted in IndexedDB and portable JSON. Settings are persisted separately in localStorage and embedded in exported state. Operation/progress/toast state stays transient in React component state.

## Consequences

Reloads restore durable work without restoring stale busy states. Importing state replaces durable project/settings by design.

## Alternatives Considered

Persisting every UI bit was rejected because query/toast/progress are session details, not project state.

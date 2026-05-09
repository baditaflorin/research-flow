# 0045 - State taxonomy and state machine

## Status

Accepted

## Context

Long operations and mixed file batches can leave the user unsure what is done, failed, or safe to export.

## Decision

Use explicit states documented in `docs/phase2-substance/states.md`: empty, restoring, ready, extracting, analyzing, cancelling, cancelled, partial-success, recoverable-error, fatal-error, exporting.

Each state has at least one user-actionable exit.

## Consequences

- No stuck states are acceptable.
- Upload and analysis concurrency must be defined.

## Alternatives Considered

- Continue boolean flags such as `isExtracting` and `isAnalyzing`: rejected as insufficient for mixed batches.

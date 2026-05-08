# 0005 - Client-side storage strategy

## Status

Accepted

## Context

Users need reload-safe local projects. Files and derived artifacts can be large, and the app must not upload them.

## Decision

Use IndexedDB through the `idb` package for project records, extracted text, metadata, analysis results, draft outlines, and settings. Store only text and compact derived artifacts in v1. Do not persist raw PDF blobs by default.

Use `localStorage` only for small UI preferences.

## Consequences

- Browser quota and private browsing behavior must be handled as user-visible errors.
- The app remains private by default.
- Cross-device sync is out of scope for v1.

## Alternatives Considered

- OPFS: useful for larger raw-paper persistence, but more complexity than v1 needs.
- Server database: rejected by Mode A.

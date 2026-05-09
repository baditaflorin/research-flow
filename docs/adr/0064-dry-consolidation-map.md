# 0064 DRY Consolidation Map

## Status

Accepted

## Context

State validation, provenance formatting, and app settings would otherwise be duplicated across IndexedDB, import/export, hash share, and export rendering.

## Decision

Create single-purpose helpers:

- `projectState` for portable project shape, validation, and migrations.
- `settingsStore` for browser settings.
- export provenance helpers reused by Markdown, LaTeX, and Word.

## Consequences

Boundary logic becomes testable without rendering the app. `App.tsx` still contains UI composition, but the riskiest duplicate logic leaves it.

## Alternatives Considered

A broad component refactor was rejected for this pass because it would churn UI without directly improving stranger usability.

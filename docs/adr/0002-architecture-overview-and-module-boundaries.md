# 0002 - Architecture overview and module boundaries

## Status

Accepted

## Context

The app needs heavy local processing without blocking the UI. It also needs clear boundaries so search, clustering, synthesis, citations, and export can evolve independently.

## Decision

Use a feature-oriented frontend with these boundaries:

- `features/library`: file ingestion, extraction, metadata, and local document state.
- `features/analysis`: embeddings, clustering, contradiction detection, gap detection, and outline generation.
- `features/search`: local full-text index and query helpers.
- `features/export`: citation formatting and Word/LaTeX export.
- `features/storage`: IndexedDB persistence and schema migration helpers.
- `workers`: CPU-heavy parsing and analysis work isolated from React rendering.
- `shared`: UI primitives, constants, and cross-feature types.

## Consequences

- Each feature has testable pure functions.
- Workers can be replaced with WASM-backed engines without rewriting the UI.
- Cross-feature data contracts need explicit TypeScript types and Zod validation.

## Alternatives Considered

- Layered folders by technology (`components`, `utils`, `hooks`): rejected because domain ownership would be harder to follow.
- A single analysis worker doing everything: rejected because exports and search should be independently replaceable.

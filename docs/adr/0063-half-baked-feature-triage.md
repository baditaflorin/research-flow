# 0063 Half-Baked Feature Triage Decisions

## Status

Accepted

## Context

Several Phase 2 promises existed partially: BibTeX ingestion, confidence surfaces, cancellation, debug inspectability, and settings.

## Decision

Finish:

- BibTeX ingestion in UI, docs, and tests.
- Confidence display in inspector/map/gaps/citations and exports.
- Cancellation for extraction and analysis workers.
- `?debug=1` inspectability.
- Persisted settings for embeddings, citation style, and auto-analysis.

Hide/delete:

- No features are hidden; no production stubs were present.

## Consequences

These changes reduce confusion without expanding the research surface area.

## Alternatives Considered

Leaving debug/cancellation in ADR-only form was rejected because documentation promises must match runtime behavior.

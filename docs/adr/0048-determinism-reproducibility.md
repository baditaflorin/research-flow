# 0048 - Determinism and reproducibility guarantees

## Status

Accepted

## Context

Research outputs must be reproducible. v0.1.0 used random UUIDs and timestamps in core analysis records.

## Decision

Use deterministic IDs from normalized source identity and content hashes. Core analysis JSON is deterministic for identical inputs and parameters. Human export files may include generation time, but canonical analysis exports must use explicit provenance metadata.

## Consequences

- Same fixture input can be tested for byte-identical analysis output.
- User-visible IDs survive reload and re-import.

## Alternatives Considered

- Keep random IDs and compare properties only: rejected because it weakens reproducibility.

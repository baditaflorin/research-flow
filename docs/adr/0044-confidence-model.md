# 0044 - Confidence model

## Status

Accepted

## Context

The audit showed high-risk wrongness: bad metadata and clusters looked complete.

## Decision

Represent every non-trivial inference as:

- `value`
- `confidence` from 0 to 1
- `level`: high, medium, low
- `reasons`
- optional `warnings`

Analysis can proceed with low-confidence fields, but the UI and exports must carry confidence and warnings. Low-text or corrupt inputs are blocked from confident analysis.

## Consequences

- Users can correct weak guesses instead of trusting them.
- Exports become auditable.

## Alternatives Considered

- Global confidence per paper only: rejected because title can be high-confidence while DOI is low-confidence.

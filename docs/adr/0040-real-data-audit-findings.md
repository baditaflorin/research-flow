# 0040 - Real-data audit findings and substance success metrics

## Status

Accepted

## Context

The v0.1.0 demo path worked, but the Phase 2 audit showed real papers were often processed with wrong metadata and generic cluster labels. The worst failures were wrong-but-confident: the UI marked papers as ready while titles, DOIs, years, authors, and clusters were unusable.

## Decision

Use `docs/phase2-substance/realdata-audit.md` and `test/fixtures/realdata/` as the Phase 2 grading set. Phase 2 success requires at least 7 of the 10 fixtures to complete the primary flow without manual correction for basic title/year/usability, plus a six-paper batch with meaningful concept labels.

## Consequences

- Fixture regressions block Phase 2.
- The app must expose uncertainty instead of pretending weak inferences are final.
- Postmortem results must report before/after pass rate per fixture.

## Alternatives Considered

- Continue optimizing the demo fixtures: rejected because it would polish the toy.

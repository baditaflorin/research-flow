# 0043 - Domain vocabulary and UI language conventions

## Status

Accepted

## Context

Errors such as "Invalid PDF structure" and labels such as "The And" do not speak the user's domain.

## Decision

Use research-domain terms:

- "Paper identity" for title/authors/year/DOI/arXiv.
- "Text quality" for extracted text sufficiency.
- "Research themes" for clusters.
- "Evidence tension" for contradiction candidates.
- "Needs OCR or better text" for scanned/low-text PDFs.

Every recoverable error must contain what failed, why it matters for research synthesis, and the next step.

## Consequences

- UI and exports become more honest.
- Tests can check domain error strings.

## Alternatives Considered

- Surface raw parser errors: rejected because they are not actionable.

# 0047 - Error taxonomy and messaging guidelines

## Status

Accepted

## Context

Failures need to be recoverable and domain-specific.

## Decision

Use these error classes:

- `unsupported_format`
- `metadata_only`
- `corrupt_or_partial_pdf`
- `needs_ocr_or_better_text`
- `extraction_failed`
- `analysis_low_confidence`
- `storage_failed`
- `export_failed`

Every message includes what, why, and now what.

## Consequences

- Recoverable failures keep the rest of the batch intact.
- Tests can assert error class and next step.

## Alternatives Considered

- Throw raw errors from PDF.js/storage/export: rejected after the truncated PDF audit.

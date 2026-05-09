# 0041 - Input robustness and normalization policy

## Status

Accepted

## Context

Real files include BOMs, CRLF, NBSP, smart quotes, mojibake, truncated PDFs, scanned/OCR-poor PDFs, and metadata-only BibTeX.

## Decision

Normalize text at ingestion boundaries:

- Strip BOM and replacement characters where recoverable.
- Normalize CRLF/LF, NBSP, soft hyphen, ligatures, and repeated whitespace.
- Decode text files with `TextDecoder` fallback attempts before accepting replacement-heavy output.
- Classify corrupt PDFs, metadata-only inputs, and low-text PDFs explicitly.

## Consequences

- Extraction returns a typed result: ready, recoverable failure, metadata-only, or needs OCR/better text.
- Low-quality inputs do not enter confident analysis.

## Alternatives Considered

- Leave browser default decoding alone: rejected after `attention-cp1252.txt` polluted the title.

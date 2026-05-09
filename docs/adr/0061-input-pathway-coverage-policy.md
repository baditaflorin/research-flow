# 0061 Input Pathway Coverage Policy

## Status

Accepted

## Context

Users encounter papers as files, copied text, BibTeX, URLs, and saved projects. Phase 1 exposed only file upload/drop.

## Decision

One ingestion coordinator will route supported files, pasted text/HTML, CORS-fetchable URLs, built-in samples, and imported project state. Unsupported inputs return domain guidance without mutating existing work.

## Consequences

All pathways must share deduplication and partial-success handling. Image OCR, folder upload, authenticated URLs, and server-side scraping remain out of scope.

## Alternatives Considered

Implementing a proxy backend was rejected because it escalates the deployment mode. Treating URL input as a documentation-only limitation was rejected because CORS-fetchable public URLs can work directly in the browser.

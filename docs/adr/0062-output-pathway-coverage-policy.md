# 0062 Output Pathway Coverage Policy

## Status

Accepted

## Context

Draft exports exist, but users also need to back up, copy, share, print, and restore work.

## Decision

Research Flow will provide Markdown, LaTeX, Word, copy-to-clipboard, print, full project JSON export/import, and small-project hash share links. Outputs include provenance and confidence metadata.

## Consequences

The JSON state file becomes the canonical round-trip format. Share links are size-limited; larger projects use state files.

## Alternatives Considered

Cloud sync was rejected because it requires a runtime service and account model. A binary state format was rejected because JSON is inspectable and automation-friendly.

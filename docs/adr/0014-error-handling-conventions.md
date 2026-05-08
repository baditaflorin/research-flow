# 0014 - Error handling conventions

## Status

Accepted

## Context

Users may upload malformed PDFs, very large files, unsupported formats, or hit browser quota limits.

## Decision

All recoverable errors are represented as typed UI states with clear next actions. Workers return structured failure objects instead of throwing across the boundary. React error boundaries catch unexpected rendering failures. Export actions surface failures in a toast region.

## Consequences

- The UI remains usable when individual papers fail.
- Tests can assert failure behavior without reading console output.

## Alternatives Considered

- Global `console.error` only: rejected because users need visible recovery paths.

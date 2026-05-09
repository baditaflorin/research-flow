# 0049 - Inspectability and debug surface

## Status

Accepted

## Context

Users and maintainers need to understand why an inference happened.

## Decision

Enable `?debug=1` to show internal state: paper IDs, content hashes, confidence levels, warnings, timings, cache hits, and inference reasons. This is a local-only UI surface; it sends nothing to a server.

## Consequences

- Support and fixture debugging become easier.
- Debug output must not leak beyond the browser.

## Alternatives Considered

- Console-only diagnostics: rejected because console output is invisible to most users and risky for paper contents.

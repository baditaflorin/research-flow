# 0017 - Dependency policy

## Status

Accepted

## Context

Research Flow touches parsing, search, storage, exports, and local AI-like workflows. Custom implementations should be limited to product-specific glue and transparent heuristics.

## Decision

Prefer mature libraries for framework, parsing, search, storage, exports, tests, and icons. Heavy dependencies must be lazy-loaded when they are not needed for first paint. Pin dependencies through `package-lock.json` and review high/critical audit findings before release.

## Consequences

- Initial bundle size remains a design constraint.
- Analysis heuristics must be documented when no browser-safe production library fits v1.

## Alternatives Considered

- Hand-roll parsing/export/search: rejected where stable browser libraries exist.
- Pull every planned AI/WASM runtime into the initial bundle: rejected due to load time and Pages reliability.

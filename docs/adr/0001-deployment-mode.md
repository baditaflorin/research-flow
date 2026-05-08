# 0001 - Deployment mode

## Status

Accepted

## Context

Research Flow needs to process user-supplied papers, generate clusters, surface contradictions and gaps, draft outlines, format citations, and export Word/LaTeX from one URL. The bootstrap requires GitHub Pages first and only allows a runtime backend when browser/build-time execution is genuinely insufficient.

## Decision

Use **Mode A: Pure GitHub Pages** for v1. The frontend is a static Vite app served from `main` branch `/docs`. Runtime work happens in the browser through Web Workers, browser storage, and lazily loaded browser libraries.

The app will use browser-native or browser-friendly equivalents for the named pipeline:

- Tika role: browser PDF/text extraction with `pdfjs-dist` and file APIs.
- Tantivy role: client-side full-text search with `minisearch`.
- sentence-transformers role: optional lazy Transformers.js embeddings, with a deterministic local vector fallback.
- local LLM role: local browser synthesis heuristics in v1, with WebLLM-compatible boundaries documented for future enhancement.
- Pandoc/LaTeX-WASM role: browser export to `.docx` and `.tex`; Pandoc-WASM can be added behind the same export boundary later.

## Consequences

- No server, database, auth, secrets, Docker image, nginx, or hosted paper storage is needed for v1.
- Papers remain local to the user's browser unless the user exports them.
- Browser capabilities and memory become the main limit; the UI must communicate local processing progress and failure states clearly.
- Exact Apache Tika parity is not a v1 guarantee.

## Alternatives Considered

- **Mode B: GitHub Pages + pre-built data**: rejected because user papers are private and arrive at runtime.
- **Mode C: Pages frontend + Docker backend**: rejected because v1 has no required shared state, secrets, auth, or server-only processing.

# 0006 - WASM modules

## Status

Accepted

## Context

The proposed pipeline references WASM-capable tools. GitHub Pages cannot set arbitrary COOP/COEP headers, so WASM choices must work in a static hosting environment or be isolated behind explicit user action.

## Decision

Use browser-compatible libraries first and load WASM or model backends lazily:

- `pdfjs-dist` for PDF extraction.
- Transformers.js-compatible embeddings as an optional, user-triggered deep analysis path.
- Browser-generated `.docx` and `.tex` exports for v1.

Do not require cross-origin isolation for the default experience.

## Consequences

- The app works on GitHub Pages without custom headers.
- WebGPU/model-backed features can fail gracefully while deterministic local analysis remains available.
- Pandoc-WASM and LaTeX-WASM remain future enhancements behind the export boundary.

## Alternatives Considered

- Require COOP/COEP with a service worker shim: rejected for v1 because it adds fragility to the first-run experience.
- Mode C server-side WASM: rejected by ADR 0001.

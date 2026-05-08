# Postmortem

## What Was Built

Research Flow v0.1.0 is a Mode A GitHub Pages app at:

https://baditaflorin.github.io/research-flow/

It supports local paper upload, PDF/TXT/Markdown extraction, local search, clustering, contradiction candidates, gap cards, generated outline sections, citation keys, bibliography formatting, Markdown export, Word `.docx` export, LaTeX `.tex` export, IndexedDB persistence, PWA shell caching, and visible version/commit metadata.

The public repo is:

https://github.com/baditaflorin/research-flow

The support link is:

https://www.paypal.com/paypalme/florinbadita

## Was Mode A Correct?

Yes for v1. The core private-paper workflow works without a runtime backend, secrets, auth, or cross-device state. Staying on GitHub Pages keeps the public surface small and makes the privacy promise easier to understand.

Mode C may become justified later if exact Apache Tika parity, server-side Pandoc, hosted WebLLM inference, team workspaces, or cross-device sync become requirements.

## What Worked

- GitHub Pages from `main` `/docs` gave a live URL immediately.
- Browser workers kept analysis work separate from rendering.
- Local TF-IDF vectors were fast enough for smoke tests and provide a reliable fallback.
- Lazy chunks keep the initial application payload below the requested budget.

## What Did Not Work

- The older `@xenova/transformers` package pulled critical audit findings, so it was replaced with `@huggingface/transformers`.
- Exact Tika, Tantivy, Pandoc-WASM, and LaTeX-WASM parity is not realistic as the default GitHub Pages path without extra complexity.
- The optional embeddings path ships a large ONNX runtime WASM asset, even though it is lazy-loaded.

## Surprises

- The static build can host quite a lot of local research machinery, but model-capable browser libraries still bring substantial artifact weight.
- GitHub Pages was easy to enable from the CLI once the source fields were quoted correctly.

## Accepted Tech Debt

- Citation formatting is pragmatic APA/MLA/Chicago output, not full CSL.
- Contradiction detection is evidence-linked heuristic detection, not truth adjudication.
- Raw PDFs are not persisted by default; only extracted text and derived artifacts are stored.
- The deep embedding path is optional and may depend on browser/model support.

## Next Three Improvements

1. Add a CSL engine and BibTeX/RIS import/export.
2. Add OPFS-backed raw PDF persistence with explicit user consent.
3. Add a WebLLM-backed synthesis mode with clear model download controls and offline status.

## Time Spent Vs Estimate

Estimated for v1 scaffold plus working prototype: 6-8 hours.

Actual implementation in this session: roughly 2-3 focused hours of agent work, with the main compromises being pragmatic local heuristics instead of exact server-grade Tika/Tantivy/Pandoc parity.

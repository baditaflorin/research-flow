# Phase 3 Feature Claims Audit

| Claim source      | Claim                                                                         | Before status | Decision                                                                       |
| ----------------- | ----------------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| README            | Drop up to 50 PDF, TXT, or Markdown papers.                                   | green         | Update to include BibTeX and state files.                                      |
| README            | Extract text and metadata locally in the browser.                             | yellow        | True for readable PDFs/text; clarify scanned/corrupt limits and review states. |
| README            | Build a semantic research map with local TF-IDF and optional Transformers.js. | green         | Keep.                                                                          |
| README            | Search uploaded library with MiniSearch.                                      | green         | Keep.                                                                          |
| README            | Detect contradiction candidates.                                              | green         | Keep as candidates, not certainties.                                           |
| README            | Generate gap cards and draft outline.                                         | green         | Keep.                                                                          |
| README            | Export Markdown, Word, LaTeX.                                                 | green         | Keep; add provenance claim after implementation.                               |
| README            | Persist latest project in IndexedDB.                                          | green         | Keep; add schema/migration language.                                           |
| README            | Show version and commit.                                                      | green         | Keep.                                                                          |
| Phase 2 ADRs      | Confidence surfaces in UI and exports.                                        | yellow        | Engine exposes confidence; UI/export must surface more of it.                  |
| Phase 2 ADRs      | Debug surface exists.                                                         | red           | No `?debug=1` surface yet.                                                     |
| Phase 2 ADRs      | Cancellation exists for long operations.                                      | red           | Extractor supports signals but UI does not wire cancel.                        |
| In-app empty text | Drop papers to build the map.                                                 | green         | Keep.                                                                          |

## Highest Priority Mismatches

1. Phase 2 promised debug inspectability; the UI still hides internals.
2. Phase 2 promised cancellation; the UI cannot cancel extraction/analysis.
3. Export claims are true as downloads but weak as reproducible artifacts.
4. BibTeX is implemented but not claimed or discoverable.
5. README still speaks as V1 even though Phase 2 changed the input semantics.

## After Phase 3

| Claim area             | After status | Evidence                                                                               |
| ---------------------- | ------------ | -------------------------------------------------------------------------------------- |
| Debug inspectability   | shipped      | `?debug=1` panel shows operation state, paper confidence, analysis hash, and activity. |
| Cancellation           | shipped      | Cancel button aborts extraction signals and terminates analysis workers.               |
| Export reproducibility | shipped      | Drafts and state files include provenance, source hash, settings, and confidence.      |
| BibTeX                 | shipped      | UI accepts `.bib`; fixture passes as metadata-only.                                    |
| README feature list    | aligned      | README now describes current tested behavior and limitations.                          |

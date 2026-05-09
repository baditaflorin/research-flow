# Phase 2 Substance Plan

Status: Accepted by user request on 2026-05-09.

Ranking principle: user impact on the 10 real-data audit inputs, especially silent wrongness.

## Ranked Substance Items

1. **Stopword and phrase-aware topic extraction** - §2 B6, B8, C15  
   Fixes `The And` / `And The` clusters and generic contradiction topics.

2. **Paper-aware metadata extraction pipeline** - §2 B6, B7, C13, C15  
   Infer title, authors, year, DOI/arXiv ID, abstract from front matter and PDF metadata before broad text.

3. **Reference-section contamination guard** - §2 C12, C15, H33  
   Prevent reference DOIs/years/titles from being accepted as paper metadata.

4. **Confidence model for every inference** - §2 D16, D19, I38  
   Title, authors, year, DOI, abstract, clusters, contradictions, gaps, and exports carry confidence.

5. **Low-text/OCR-poor detection** - §2 A4, C12, H32, H34  
   Scanned or near-empty PDFs should not get confident analysis.

6. **Actionable domain errors** - §2 C11, H32, H34  
   Translate parser failures into research terms with next steps.

7. **Encoding and whitespace normalization** - §2 A2, B9, C15  
   Normalize BOM, CRLF, NBSP, smart quotes, replacement characters, and common mojibake.

8. **Robust partial/corrupt PDF handling** - §2 A4, A5, H32  
   Detect truncated PDFs, keep batch state coherent, and explain recovery.

9. **Stable human-readable paper IDs** - §2 E22, I38  
   Deterministic IDs based on source identity and content hash; survive reload/export.

10. **Deterministic analysis outputs** - §2 I35  
    Remove random UUID ordering and locale/time variance from core analysis JSON.

11. **Output provenance in exports** - §2 C14, I38  
    Include app version, schema version, source IDs, parameters, and inference confidence.

12. **Real-data fixture harness** - §2 A1, I35  
    Commit the 10 inputs and expected properties; run all fixtures as tests.

13. **Boundary validation with Zod schemas** - §2 H33  
    Validate files, extracted papers, analysis requests, saved projects, and export payloads.

14. **State taxonomy and explicit state exits** - §2 F24, F25  
    Document and encode loading/empty/some/many/error/cancelled states.

15. **Cancellation that actually cancels analysis/extraction** - §2 F26, G29  
    Long PDF batches and analysis jobs can be aborted without half-updating state.

16. **Concurrency safety for repeated runs/uploads** - §2 F27  
    Define behavior when users upload during analysis or click run twice.

17. **Performance budgets and measurements** - §2 G28  
    Measure real-data median/p95/worst extraction and analysis times.

18. **Heavy work containment and progress honesty** - §2 G29, G30  
    Keep UI responsive, report per-file progress, and avoid misleading "done" states.

19. **Cache extracted/derived artifacts by stable content hash** - §2 G31  
    Reuse expensive extraction and analysis when the same file is uploaded again.

20. **Anomaly surfacing** - §2 D18  
    Flag suspicious metadata, weak text, bad DOI source, low topic confidence, and mixed evidence.

21. **Decision explanations** - §2 D19, I37  
    Debug surface explains why title/DOI/cluster/contradiction was inferred.

22. **Inspectable activity history** - §2 I36  
    Track uploads, extraction, analysis, errors, cancellation, exports with timestamps.

23. **Debug overlay via `?debug=1`** - §2 I37  
    Show internal state, confidence, timings, cache hits, and fixture diagnostics.

24. **Domain-aware BibTeX handling** - §2 C13, H32  
    Recognize metadata-only `.bib` as a research artifact; provide useful guidance rather than generic rejection.

25. **Remember corrections within session** - §2 J39  
    If user edits/corrects metadata once, similar low-confidence guesses default to that correction pattern in-session.

## Expected Pass-Rate Movement

- Before: 0/10 inputs meet the Phase 2 substance bar without meaningful manual correction.
- Target after Phase 2: at least 7/10 pass the primary flow with no manual correction for title/year/basic usability.
- Batch target: six real PDFs produce meaningful research concept labels and no stopword-only cluster labels.

## Non-Goals

- No new product surface beyond existing upload, map, insights, outline, citations, export.
- No visual polish or redesign.
- No backend, hosted OCR, hosted LLM, auth, sync, collaboration, or paid API.
- No new external runtime secrets.

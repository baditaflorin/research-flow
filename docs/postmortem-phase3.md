# Phase 3 Postmortem

## Audit Grids

| Audit           | Before green/yellow/red/gray          | After green/limited/gray                              |
| --------------- | ------------------------------------- | ----------------------------------------------------- |
| Input           | 4 / 5 / 4 / 2                         | 7 green / 3 limited / 2 gray                          |
| Output          | 3 / 2 / 4 / 3                         | 6 green / 1 limited / 3 gray                          |
| Controls        | 6 / 5 / 0 / 0                         | all visible controls functional                       |
| Feature claims  | 7 / 4 / 2 / 0                         | claims aligned with tests/docs                        |
| Codebase health | unsafe storage schema, no state tests | project-state schema, migration tests, fixture runner |

## Half-Baked Triage

Finished:

- BibTeX ingestion in UI and docs.
- Debug inspectability via `?debug=1`.
- Cancellation for extraction and analysis.
- Confidence in inspector/map/gaps/citations/exports.
- Persisted settings for citation style, embeddings, and auto-analysis.

Hidden/deleted:

- No production controls were hidden or deleted because none were pure stubs.

## Codebase Metrics

| Metric                    | Before                     | After                                   |
| ------------------------- | -------------------------- | --------------------------------------- |
| Production `any`          | `z.any()` storage boundary | 0                                       |
| `@ts-ignore`              | 0                          | 0                                       |
| TODO/FIXME/XXX/HACK       | 0 source occurrences       | 0 source occurrences                    |
| Real-data fixture command | absent                     | `npm run test:realdata`                 |
| State round-trip test     | absent                     | unit test covers JSON/hash/v1 migration |
| Main app file             | 837 lines                  | still large; boundary logic moved out   |

## Stranger-Test Findings

Top three fixed:

1. `20ar` year bug from arXiv id parsing.
2. Missing exact recovery language for OCR/better PDF/re-download/metadata-only cases.
3. Batch map labels could be noisy organization phrases.

## Documentation-Reality Mismatches Fixed

- README now describes the current input and output paths.
- Limitations now mention OCR, URL CORS, local-only storage, and lightweight citations.
- Hook/Makefile docs include real-data regression.

## What Surprised Me

The app was closest to failing not on PDF parsing but on completion loops: moving work between browsers, copying output, and explaining CORS. Those are not glamorous, but they are what make a stranger able to keep going.

## Still-Open Completeness Gaps

1. URL input is limited by browser CORS.
2. No OCR for images or scanned PDFs.
3. State share URLs are size-limited.
4. No real external human tester participated in this autonomous run.
5. `App.tsx` remains larger than ideal, though core boundary logic is now separated.

## Honest Take

A stranger can now use Research Flow for their own real papers end to end: upload or paste, inspect confidence, recover from bad files, export drafts, copy citations, save state, restore state, and see version/commit. It is still not a full Zotero replacement because sync, OCR, and professional CSL citation formatting are deliberately out of scope.

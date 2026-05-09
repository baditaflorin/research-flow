# Phase 3 Findings Synthesis

## Top 5 Usability Gaps

1. A user with text in the clipboard cannot start without making a file.
2. A user cannot move or back up their project because there is no portable state export/import.
3. The app does not make recoverable failures prominent enough; scanned/corrupt papers can look like generic failures.
4. Long extraction/analysis jobs cannot be cancelled from the UI.
5. URL-first research behavior is unsupported except by manual download.

## Top 5 Half-Baked Features

| Feature               | Decision | Rationale                                                   |
| --------------------- | -------- | ----------------------------------------------------------- |
| BibTeX ingestion      | finish   | Engine supports it; UI/docs/tests must expose it.           |
| Debug inspectability  | finish   | Promised in Phase 2 ADR 0049 and critical for trust.        |
| Cancellation          | finish   | Extractor already accepts signals; UI is the missing layer. |
| Confidence in exports | finish   | Phase 2 engine emits confidence; exports should carry it.   |
| Transformers setting  | finish   | Real setting, but must persist and explain fallback.        |

## Top 5 Codebase Pain Points

1. `App.tsx` mixes orchestration and rendering, slowing all UI changes.
2. Storage uses unsafe schemas, so bad persisted state can leak into the app.
3. Export/state provenance has no canonical formatter.
4. No real-data fixture command blocks regressions.
5. Settings are local component state instead of persisted app state.

## Top 5 Documentation/Reality Mismatches

1. README omits BibTeX.
2. README does not mention scanned/corrupt PDF behavior.
3. Phase 2 ADRs mention debug/cancellation before they exist in UI.
4. README calls the feature list "V1" even after Phase 2 real-data changes.
5. Local hook docs omit real-data fixture regression.

## Definition Of Fully Usable

1. A stranger can upload, drag/drop, paste, or import a state file and get a useful first preview.
2. A stranger can understand which papers are ready, which need review, and why.
3. A stranger can cancel long local work without losing the previous project state.
4. A stranger can export a draft, copy citations, and export/import full project state.
5. A stranger can reload the page or move to another browser and continue from a saved/exported project.

## Phase 3 Success Metrics

1. 10/10 Phase 2 fixtures complete with expected ready/review/fail statuses.
2. State export -> import restores paper ids, analysis source hash, settings, and citation style.
3. No production `any`, `@ts-ignore`, or unsafe storage casts outside validated boundary code.
4. All visible controls either pass an end-to-end test or are documented out of scope.
5. README feature claims are covered by lint/test/smoke/real-data commands.

## Out Of Scope

1. Runtime backend, auth, cloud sync, or server-side scraping.
2. OCR for images/scanned PDFs.
3. Visual polish, themes, command palette, animations, or marketing additions.
4. New research-engine heuristics beyond what Phase 2 already locked.
5. API endpoints; Mode A remains GitHub Pages only.

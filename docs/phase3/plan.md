# Phase 3 Implementation Plan

Priority is ranked by real-user impact, not implementation novelty.

| Rank | Catalog item                         | Implementation                                                                     |
| ---: | ------------------------------------ | ---------------------------------------------------------------------------------- |
|    1 | #11 Downloadable state file          | Add versioned `.research-flow.json` export/import with schema validation.          |
|    2 | #38 Every save really saves          | Persist settings and project state together with migrations.                       |
|    3 | #1 Every input pathway claimed works | Route PDF/TXT/MD/BibTeX/state files through one ingestion path.                    |
|    4 | #6 Clipboard read                    | Add clipboard-read button and fallback paste box.                                  |
|    5 | #7 Sample/demo as first-class        | Add built-in sample loader that uses the same text extraction path.                |
|    6 | #3 URL input                         | Add CORS-aware fetch with domain-specific fallback guidance.                       |
|    7 | #4 Multi-file/batch partial success  | Deduplicate stable ids and surface ready/review/failed counts.                     |
|    8 | #10 Copy-to-clipboard                | Copy Markdown and BibTeX/citation output with confirmation.                        |
|    9 | #12 Shareable URL                    | Add compressed-enough hash state for small projects and guardrails for large ones. |
|   10 | #13 Print/PDF view                   | Add explicit print command for current analysis.                                   |
|   11 | #16 Finish kept half-baked features  | Wire cancellation, debug view, BibTeX UI, confidence visibility.                   |
|   12 | #18 Settings completeness            | Add a settings panel; every setting affects import/export/analysis and persists.   |
|   13 | #19 Help/docs alignment              | Update README claims and limitations.                                              |
|   14 | #20 Extract duplicated logic         | Add canonical project-state and provenance helpers.                                |
|   15 | #22 Single canonical types           | Define `ProjectState` and app settings once.                                       |
|   16 | #23 Shared validation schemas        | Reuse zod schemas for IndexedDB, import, and hash restore.                         |
|   17 | #24 Split god modules                | Move portable state and settings logic out of `App.tsx`.                           |
|   18 | #31 One error handling convention    | Add UI boundary error normalizer.                                                  |
|   19 | #32 One state management convention  | Enumerate operation state in UI and debug surface.                                 |
|   20 | #35 Eliminate `any`                  | Remove production `z.any()` and unsafe casts.                                      |
|   21 | #36 Validate boundaries              | Validate imported state, hash state, and stored IndexedDB.                         |
|   22 | #39 Migrations                       | Add schema version migration from v1 to v2 project state.                          |
|   23 | #40 Clear state                      | Clear IndexedDB and hash state together.                                           |
|   24 | #41 Round-trip                       | Add unit tests for export/import state restoration.                                |
|   25 | #46 Stranger test                    | Run private-session test and fix top 3 issues.                                     |

## Batches

1. ADRs 0060-0071.
2. Project state schema, settings, import/export/share.
3. UI input/output completeness and operation state.
4. Tests: storage/state, real-data fixtures, smoke expansion.
5. Docs, postmortem, version bump, Pages publish.

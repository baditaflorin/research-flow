# Phase 3 Codebase Health Audit

Measured on 2026-05-09 before Phase 3 implementation.

## Size And Responsibility

| Module                              | Lines | Finding                                                                                                               |
| ----------------------------------- | ----: | --------------------------------------------------------------------------------------------------------------------- |
| `src/App.tsx`                       |   837 | God component: app state, persistence, ingestion, export, UI panels, toast, and worker orchestration are in one file. |
| `src/features/library/extract.ts`   |   774 | Large but coherent domain parser; acceptable for Phase 3 unless a focused seam becomes obvious.                       |
| `src/features/analysis/insights.ts` |   235 | Coherent analysis heuristics module.                                                                                  |

## DRY Violations

| Area              | Files                                                      | Finding                                                  | Decision                                      |
| ----------------- | ---------------------------------------------------------- | -------------------------------------------------------- | --------------------------------------------- |
| Export provenance | `src/features/export/exporters.ts`, future state export    | No single provenance formatter yet.                      | Extract export metadata helpers.              |
| State validation  | `src/features/storage/projectStore.ts`, future import path | IndexedDB uses `z.any()` and import path does not exist. | Create one project-state schema and reuse it. |
| Operation errors  | `src/App.tsx`, worker promise                              | Error messages are generic in several catch sites.       | Add one UI error-normalization helper.        |

## Dead Code

No abandoned files were found in `src/`. Built assets under `docs/assets/` are generated Pages output and excluded from source-health scoring.

## TODO/FIXME/XXX/HACK

No source TODO/FIXME/XXX/HACK comments were found outside generated Pages assets.

## Type Safety Holes

| Location                               | Finding                                                          | Decision                                                     |
| -------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| `src/features/storage/projectStore.ts` | `z.any()` for papers and analysis; cast back to `StoredProject`. | Replace with schema-based boundary validation and migration. |
| `src/App.tsx`                          | `event.target.value as CitationStyle`.                           | Replace with narrow helper.                                  |
| `src/main.tsx`                         | `document.getElementById("root") as HTMLElement`.                | Replace with explicit guard.                                 |
| `src/features/analysis/insights.ts`    | Filter casts to `ResearchPaper[]`.                               | Replace with type guard.                                     |

## Consistency Issues

1. Persistence exists for project data but not user settings.
2. Export buttons download files; no copy/share/output commands follow the same convention.
3. Recoverable paper statuses exist in types but are summarized as only failed vs ready.
4. Browser boundary data is not consistently validated with zod.

## Test Coverage Holes

1. No real-data regression runner for the 10 Phase 2 fixtures.
2. No import/export state round-trip test.
3. No test for storage migration/validation.
4. Smoke test covers text upload only, not paste/import/output commands.

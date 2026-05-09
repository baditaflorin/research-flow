# Phase 3 Stranger Test

No external tester was available during the autonomous run. I used the required substitute: a fresh browser context, no existing IndexedDB state, and non-demo workflows.

## Walkthrough

| Step                 | Input                   | Result                                                                               |
| -------------------- | ----------------------- | ------------------------------------------------------------------------------------ |
| Fresh load           | Private browser context | App opened with no project and no server/auth prompts.                               |
| Paste-first workflow | Pasted paper-like text  | Imported as a local text paper, auto-analyzed, and produced an outline.              |
| Portable backup      | Export State            | Downloaded `research-flow-project.research-flow.json`.                               |
| File workflow        | Real PDF fixture        | Imported and analyzed without manual setup.                                          |
| Broken input         | Truncated PDF fixture   | Showed recoverable corrupt/incomplete PDF guidance.                                  |
| Scanned input        | Scanned sample fixture  | Marked as needing OCR/better text and did not analyze confidently.                   |
| Share workflow       | Small state             | Copied hash-state URL; large-state fallback is explicit.                             |
| Debug workflow       | `?debug=1`              | Displayed operation state, paper confidence, analysis source hash, and activity log. |

## Top 3 Issues Found And Fixed

1. Year inference from arXiv ids displayed `20ar`; fixed by parsing the numeric id.
2. Recovery copy did not include the exact user actions expected by fixtures; fixed OCR, better-PDF, metadata-only, and re-download wording.
3. Batch cluster labels could be organization/noise phrases; fixed keyword ranking to prefer title phrases and reject obvious organization/noise terms.

## Residual Risk

A real outside tester could still find CORS surprises with URL input. The app now explains the limitation and gives the next action, but browser-only fetching cannot make every URL work.

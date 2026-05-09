# Phase 3 Output Pathway Audit

Status key: green = works end to end; yellow = partial or unclear; red = expected but missing; gray = deliberately out of scope.

| Output                  | Before | Evidence                                          | Phase 3 target                                                             |
| ----------------------- | ------ | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Markdown draft download | green  | `buildMarkdownDocument` and button exist.         | Keep green; include provenance/confidence metadata.                        |
| LaTeX download          | green  | `buildLatexDocument` and button exist.            | Keep green; include provenance/confidence metadata.                        |
| Word `.docx` download   | green  | Lazy `docx` export and button exist.              | Keep green; include provenance/confidence metadata.                        |
| Bibliography copy       | red    | Citation keys display, but no copy button.        | Add copy for bibliography/BibTeX/Markdown.                                 |
| JSON/API-ready output   | red    | No state/data export exists.                      | Add deterministic project state JSON export.                               |
| Import exported state   | red    | No round-trip path.                               | Add state import with schema validation/migration.                         |
| Share link              | red    | No state hash or URL export.                      | Add hash-state for small projects with size guard and state-file fallback. |
| Print/PDF view          | red    | Browser print works incidentally but no command.  | Add explicit print command for the analysis result.                        |
| Screenshot/export image | gray   | Not claimed and not central to research workflow. | Keep out of scope.                                                         |
| Embed code              | gray   | Not useful for private local research drafts.     | Keep out of scope.                                                         |
| API/curl endpoint       | gray   | Mode A has no runtime API.                        | Keep out of scope; JSON state export is automation-ready.                  |

## Top Output Findings

1. The app can export drafts but cannot export its own editable state.
2. Users cannot copy the citation output without selecting text manually.
3. Exports do not yet carry enough metadata to reproduce a run.
4. A share link is expected for a URL-first product but absent.
5. Browser print is discoverable only by accident.

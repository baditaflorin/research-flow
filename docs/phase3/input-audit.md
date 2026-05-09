# Phase 3 Input Pathway Audit

Status key: green = works end to end on user data; yellow = works partially or needs clearer limits; red = claimed/expected but broken; gray = deliberately out of scope for Mode A.

| Pathway                   | Before | Evidence                                                                                     | Phase 3 target                                                                   |
| ------------------------- | ------ | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| File picker: PDF          | green  | Multi-file `<input type=file>` accepts PDFs and Phase 2 fixtures extract locally.            | Keep green; include scanned/corrupt PDFs as recoverable rows.                    |
| File picker: TXT/Markdown | green  | Text fixtures and smoke fixtures import locally.                                             | Keep green; make paste share same parser.                                        |
| File picker: BibTeX       | yellow | Extractor supports `.bib`, but UI accept text omits it and README omits it.                  | Add `.bib` accept text and documentation.                                        |
| Drag/drop                 | green  | Drop zone passes `DataTransfer.files` to the same handler.                                   | Keep green.                                                                      |
| Multi-file batch          | yellow | Works, but duplicates are appended and partial failures are counted as generic failed files. | Deduplicate by stable id/hash; show needs-review counts and per-file next steps. |
| Paste plain text          | red    | No paste pathway exists; users must create a file manually.                                  | Add paste box and clipboard-read button.                                         |
| Paste HTML                | red    | No paste pathway exists.                                                                     | Accept pasted HTML as text; preserve URL/source hint when available.             |
| Paste image / OCR         | gray   | Browser-only OCR is outside Phase 3 and Phase 1 Mode A scope.                                | Document as out of scope; scanned PDFs already fail gracefully.                  |
| URL input                 | yellow | No URL control exists; CORS prevents reliable browser fetching.                              | Add CORS-aware URL fetch with honest fallback to paste/upload.                   |
| Mobile file picker        | yellow | Native browser file input works, but no mobile-specific affordance or documented limit.      | Keep file input; document Photos/camera OCR as out of scope.                     |
| Folder upload             | gray   | Not claimed; webkitdirectory is browser-specific and unnecessary for v1.                     | Keep out of scope.                                                               |
| Sample/demo input         | yellow | Test fixtures exist, but the UI has no first-class sample loader.                            | Add one small built-in sample loader equivalent to user data path.               |
| Deep links / share links  | red    | No hash/import pathway.                                                                      | Add compact hash-state import/export for small projects and state-file fallback. |
| Imported state file       | red    | Persistence is IndexedDB-only; users cannot move work across browsers.                       | Add `.research-flow.json` import via file picker.                                |
| Restored autosave         | green  | IndexedDB restores latest project on reload.                                                 | Keep green; add schema validation and settings persistence.                      |

## Top Input Findings

1. Users can upload files, but cannot paste the text they already have open in another tab.
2. Browser storage restores on one browser only; there is no portable state import.
3. Batch uploads append duplicates, making repeated attempts messy.
4. URL input is absent even though many real papers are encountered first as URLs.
5. BibTeX is supported in the engine but hidden from the input affordance.

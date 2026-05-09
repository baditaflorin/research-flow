# Phase 3 Controls Audit

| Control                             | Before status | Does it do what it says?                             | Phase 3 decision                                |
| ----------------------------------- | ------------- | ---------------------------------------------------- | ----------------------------------------------- |
| Star on GitHub                      | green         | Opens https://github.com/baditaflorin/research-flow. | Keep.                                           |
| Support                             | green         | Opens https://www.paypal.com/paypalme/florinbadita.  | Keep.                                           |
| Choose Files                        | yellow        | Works for PDF/TXT/MD; BibTeX support is hidden.      | Add `.bib` and state-file routing.              |
| Drop Papers                         | green         | Same ingestion path as file picker.                  | Keep.                                           |
| Try lazy Transformers.js embeddings | yellow        | Does something, but setting does not persist.        | Persist setting and surface failure fallback.   |
| Build Research Map                  | green         | Runs local analysis on ready papers.                 | Keep; add cancellation and better busy state.   |
| Search                              | green         | Searches ready papers with MiniSearch.               | Keep.                                           |
| Clear Local Project                 | green         | Clears papers, analysis, query, IndexedDB.           | Keep; also clear imported/share state.          |
| Citation style select               | yellow        | Affects exports only, but does not persist.          | Persist as a setting.                           |
| MD export                           | yellow        | Downloads Markdown draft; no provenance.             | Add provenance and copy-to-clipboard companion. |
| TeX export                          | yellow        | Downloads LaTeX draft; no provenance.                | Add provenance.                                 |
| Word export                         | yellow        | Downloads `.docx`; no provenance.                    | Add provenance.                                 |
| Toast close                         | green         | Dismisses current toast.                             | Keep.                                           |

## Stub/TODO Result

No visible production control is a pure stub. The incomplete controls are real handlers with missing end-to-end completeness: persistence, provenance, copy/share/import, and cancellation.

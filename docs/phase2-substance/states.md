# Phase 2 State Taxonomy

Every state must have at least one user-actionable exit.

| State               | Meaning                                                          | Allowed exits                                               |
| ------------------- | ---------------------------------------------------------------- | ----------------------------------------------------------- |
| `empty`             | No local project and no files selected.                          | Upload files, restore saved project.                        |
| `restoring`         | IndexedDB project load is in progress.                           | Loaded, empty, recoverable-error.                           |
| `ready`             | Papers and analysis are coherent.                                | Upload, analyze, export, clear.                             |
| `extracting`        | One or more files are being read/extracted.                      | Complete, partial-success, cancelled, recoverable-error.    |
| `analyzing`         | Analysis worker is building map/insights.                        | Complete, cancelled, recoverable-error.                     |
| `cancelling`        | Abort requested, resources being released.                       | Cancelled, ready.                                           |
| `cancelled`         | Last long operation was cancelled; prior coherent state remains. | Resume, upload, analyze, clear.                             |
| `partial-success`   | Some files succeeded and some failed recoverably.                | Review warnings, upload replacements, analyze ready papers. |
| `recoverable-error` | A file/action failed but user work remains intact.               | Retry, remove failed item, upload replacement, clear.       |
| `fatal-error`       | Unexpected render/storage failure.                               | Reload, clear local state.                                  |
| `exporting`         | Export blob is being generated.                                  | Complete, recoverable-error.                                |

Concurrency rules:

- Upload during extraction queues behind the current extraction.
- Analyze during extraction is disabled until at least one coherent ready set exists.
- Clicking analyze twice cancels the older in-flight analysis and starts the latest request.
- Clearing a project aborts extraction/analysis first, then clears storage.

# Phase 3 Real-Data Performance

Measured against the production Pages build on 2026-05-09 with `npm run test:realdata`.

| Fixture                   | Status              | Duration |
| ------------------------- | ------------------- | -------: |
| `attention.pdf`           | ready               |  1335 ms |
| `bert.pdf`                | ready               |  1286 ms |
| `gpt3.pdf`                | ready               |  1740 ms |
| `llama2.pdf`              | ready               |  1767 ms |
| `vit.pdf`                 | ready               |  1331 ms |
| `react.pdf`               | ready               |  1342 ms |
| `scanned-sample.pdf`      | needs OCR/text      |  1351 ms |
| `attention.bib`           | metadata only       |   736 ms |
| `attention-truncated.pdf` | recoverable failure |  1357 ms |
| `attention-cp1252.txt`    | ready               |   923 ms |
| six-paper batch           | ready               |  4016 ms |

Median single-input time: 1338.5 ms.

Worst single-input time: 1767 ms (`llama2.pdf`).

Batch p95 proxy: 4016 ms for six papers, including deterministic rerun.

All operations stay below the Phase 2 five-second cancellation threshold on this fixture set, but cancellation is still wired for slower real-world inputs.

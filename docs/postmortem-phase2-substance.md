# Phase 2 Substance Postmortem

## Pass Rate

Before Phase 2: 3/10 individual fixtures were useful without manual correction.

After Phase 2 plus the Phase 3 regression harness: 10/10 individual fixtures pass, and the six-paper batch passes.

| Fixture                   | Before                             | After                           |
| ------------------------- | ---------------------------------- | ------------------------------- |
| `attention.pdf`           | wrong metadata risk                | ready, correct title/year/arXiv |
| `bert.pdf`                | author/email risk                  | ready, correct title/year/arXiv |
| `gpt3.pdf`                | wrong title/year                   | ready, correct title/year/arXiv |
| `llama2.pdf`              | reference contamination risk       | ready, correct title/year/arXiv |
| `vit.pdf`                 | title casing rough                 | ready, correct identity         |
| `react.pdf`               | title casing rough                 | ready, correct identity         |
| `scanned-sample.pdf`      | could appear confidently processed | needs OCR/better text           |
| `attention.bib`           | unsupported-looking                | metadata-only with next step    |
| `attention-truncated.pdf` | generic failure                    | recoverable corrupt/partial PDF |
| `attention-cp1252.txt`    | encoding artifacts risk            | normalized ready text           |

## Logic Gaps Closed

1. Front-matter metadata now beats late reference/appendix text.
2. Scanned and corrupt PDFs produce review states instead of confident synthesis.
3. BibTeX is recognized as metadata, not unsupported input.
4. Cluster labels use meaningful research phrases instead of stopword pairs.
5. Exports and citations carry confidence/provenance metadata.

## Smart Behaviors With Evidence

- Uploading a paper produces a useful first guess for title, authors, year, arXiv id, status, and confidence.
- Bad inputs are recoverable in domain language: OCR, better PDF, re-download, or upload paper text.
- Batch analysis is deterministic for the fixture set.
- Every real-data fixture now has an expected-output assertion.

## Determinism

The six-paper batch reruns with the same source hash, labels, keyword lists, gap summaries, and citation keys. Timing metadata is excluded from deterministic comparison.

## Performance

Median single fixture: 1338.5 ms.

Worst single fixture: 1767 ms.

Six-paper batch: 4016 ms.

## Surprise

The biggest surprise was how often broad text scanning selected plausible but wrong metadata from references. The fix was not a bigger model; it was restricting inference to paper front matter and surfacing confidence honestly.

## Still Open

1. OCR remains out of scope.
2. Author parsing is good enough for fixtures but still heuristic.
3. Very large PDF batches need more progress granularity.
4. Citation styles are lightweight, not CSL-grade.
5. Transformers.js embeddings are optional and may fail depending on browser resources.

## Honest Take

The app no longer feels like a toy on the tested research inputs. It still feels like a browser-local research assistant, not a full reference manager, because OCR, cloud sync, and CSL-level citations remain out of scope.

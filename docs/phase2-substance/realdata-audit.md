# Phase 2 Substance Real-Data Audit

Date: 2026-05-08

Scope: v0.1.0 live GitHub Pages app at https://baditaflorin.github.io/research-flow/

This audit uses real research-workflow inputs, not the curated demo fixtures. The goal is to identify where the current app feels dumb, brittle, or wrong with real user material.

## Input Set

1. `attention.pdf` - clean born-digital arXiv PDF, "Attention Is All You Need" - https://arxiv.org/pdf/1706.03762
2. `bert.pdf` - short two-column arXiv PDF, "BERT" - https://arxiv.org/pdf/1810.04805
3. `gpt3.pdf` - long 75-page paper, "Language Models are Few-Shot Learners" - https://arxiv.org/pdf/2005.14165
4. `llama2.pdf` - large 77-page, 13MB paper, "Llama 2" - https://arxiv.org/pdf/2307.09288
5. `vit.pdf` - math/table-heavy two-column paper, "An Image is Worth 16x16 Words" - https://arxiv.org/pdf/2010.11929
6. `react.pdf` - short methods paper, "ReAct" - https://arxiv.org/pdf/2210.03629
7. `scanned-sample.pdf` - image/OCR-like one-page PDF sample representative of scanned uploads.
8. `attention.bib` - real BibTeX metadata export from DBLP - https://dblp.org/rec/journals/corr/VaswaniSPUJGKP17.bib
9. `attention-truncated.pdf` - first 60KB of `attention.pdf`, representative of partial/interrupted downloads.
10. `attention-cp1252.txt` - real arXiv abstract text transcoded with BOM/CP1252-like bytes and CRLF line endings.

Additional batch check: uploaded the six real arXiv PDFs together to exercise the actual "drop papers" promise.

## Per-Input Walkthrough

| #   | Input                     | What v1 did                                                                                                                                                                                                    | What it should have done                                                                                                                            | Why it failed or fell short                                                                                                                                                | Failure mode                                  | Manual work forced onto user                                                    |
| --- | ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | `attention.pdf`           | Processed as ready in 7.7s, 15 pages, 6,527 words. Title became `attention`. Authors became copyright/permission text. Year became `2014`. Cluster label was `The And`; gap was `The And needs more evidence`. | Infer title "Attention Is All You Need", authors, 2017 year, and useful themes such as attention, transformers, translation, sequence transduction. | Metadata inference uses filename/first-line heuristics and scans the whole text for the first year. Stopwords are incomplete, so `the` and `and` become dominant keywords. | Wrong-but-confident.                          | User must correct title, authors, year, cluster meaning, and citation metadata. |
| 2   | `bert.pdf`                | Processed as ready in 7.4s, 16 pages, 10,557 words. Title became `bert`. Authors became email fragments. Cluster label was `The And`.                                                                          | Infer full title, proper authors, and themes around bidirectional transformers, pre-training, GLUE/SQuAD.                                           | Two-column author blocks and emails are treated as author names. The clusterer overweights generic tokens.                                                                 | Wrong-but-confident.                          | User must repair title/authors and mentally ignore bad cluster labels.          |
| 3   | `gpt3.pdf`                | Processed as ready after 16.4s, 75 pages, 39,046 words. Title became a figure-caption appendix line. Year became `2005`.                                                                                       | Use first-page/arXiv metadata; identify GPT-3/few-shot learning as the paper; report long-running extraction progress and allow cancellation.       | Title inference scans broad text and accepts late appendix lines; year inference accepts any early-looking year from references/data. Long work is not cancellable.        | Wrong-but-confident plus performance opacity. | User must correct identity metadata and wait without a meaningful cancel path.  |
| 4   | `llama2.pdf`              | Processed as ready after 16.6s, 77 pages, 43,021 words. Title became a reference entry. DOI became an unrelated ACL DOI from the references.                                                                   | Infer "Llama 2: Open Foundation and Fine-Tuned Chat Models"; avoid reference-section DOI contamination; flag large input cost.                      | DOI/year/title extraction scans the entire document without section awareness. References pollute primary metadata.                                                        | Wrong-but-confident.                          | User must spot and repair a false DOI, title, and partial authors.              |
| 5   | `vit.pdf`                 | Processed as ready in 7.6s, 22 pages, 11,250 words. Title became `vit`. DOI became unrelated `10.1137/0330046`. Cluster label was `The And`.                                                                   | Infer full title, authors/year, and theme around vision transformers/image classification. Do not treat reference DOIs as the paper DOI.            | Filename fallback beats document metadata; DOI scan is not section-aware.                                                                                                  | Wrong-but-confident.                          | User must repair title, DOI, and theme labels.                                  |
| 6   | `react.pdf`               | Processed as ready in 7.4s, 33 pages, 17,552 words. Title became `react`. DOI became an unrelated reference DOI.                                                                                               | Infer ReAct title, authors, and themes around reasoning/action trajectories; avoid reference DOI contamination.                                     | Same broad-text metadata extraction and poor title fallback.                                                                                                               | Wrong-but-confident.                          | User must repair metadata and citation records.                                 |
| 7   | `scanned-sample.pdf`      | Processed as ready, 1 page, 45 words. Title became `scanned sample`. Authors became sentence fragments. It produced clusters/gaps as if this were valid paper text.                                            | Detect low/empty text extraction and say "This looks scanned or OCR-poor; use OCR or upload text." Avoid generating confident analysis.             | No text-quality threshold, OCR/scanned detection, or confidence gate before analysis.                                                                                      | Wrong-but-confident.                          | User must realize the analysis is based on almost no usable text.               |
| 8   | `attention.bib`           | Marked failed with "Unsupported file type. Upload PDF, TXT, or Markdown files."                                                                                                                                | Recognize BibTeX as metadata/citation input or explain that v1 cannot use metadata-only files and suggest uploading the PDF too.                    | Input type support is narrow and error copy is generic rather than research-domain guidance.                                                                               | Obvious but unhelpful.                        | User has to know why BibTeX matters and how to proceed.                         |
| 9   | `attention-truncated.pdf` | Marked failed with "Invalid PDF structure."                                                                                                                                                                    | Explain "This PDF appears incomplete or corrupted; re-download it or upload the full file." Preserve other files in a batch.                        | Low-level PDF parser error is surfaced without domain translation.                                                                                                         | Obvious but not actionable enough.            | User must infer that the file was truncated/corrupt.                            |
| 10  | `attention-cp1252.txt`    | Processed as ready. Title began with replacement character: `�Attention Is All You Need`. Cluster label was `The And`.                                                                                         | Normalize BOM/encoding/CRLF/NBSP and recover the title cleanly.                                                                                     | Text decoding assumes browser default UTF-8 and does not repair common encoding artifacts.                                                                                 | Subtle wrongness.                             | User must manually clean title/text artifacts.                                  |

## Batch Walkthrough

Input: `attention.pdf`, `bert.pdf`, `gpt3.pdf`, `llama2.pdf`, `vit.pdf`, `react.pdf` together.

What v1 did:

- Completed in about 35.6s.
- Marked all six PDFs as ready.
- Produced two clusters: `The And` and `And The`.
- Dominant keywords included `the`, `and`, `for`, `language`, `tasks`.
- Produced 8 contradiction candidates, but the topics were driven by generic tokens rather than research concepts.
- Produced only one gap: `Author-stated limitations`.

What it should have done:

- Produce meaningful clusters such as transformers/attention, language-model scaling, vision transformers, reasoning/action agents, and open/fine-tuned LLMs.
- Expose metadata confidence and flag bad title/DOI/year guesses before they contaminate citations/export.
- Keep generic stopwords out of keywords and contradiction topics.
- Report long-running batch progress per document and allow cancellation.

Failure mode: wrong-but-confident. The app looks busy and successful, but the intellectual output is not useful enough for a real literature review without heavy manual correction.

## Top 5 Logic Gaps

1. **Metadata extraction is not paper-aware.** Titles, years, authors, and DOIs are inferred from filenames or arbitrary document text, so references, copyright notices, emails, and appendix captions become primary metadata.
2. **Keyword extraction is polluted by missing stopwords and no phrase model.** Real clusters are labeled `The And` / `And The`, and contradiction topics can be built from generic words.
3. **No confidence model gates downstream analysis.** The app exports and displays bad metadata, scanned/low-text PDFs, and weak clusters with the same confidence as good results.
4. **PDF parsing is all-or-nothing and not section-aware.** It does not distinguish front matter, body, references, appendix, tables, or OCR-poor text.
5. **Long operations lack honest control.** Real 75-page/77-page PDFs take 16s individually and 35s in a batch, with no true cancellation or per-stage performance budget.

## Top 3 Intuition Failures

1. **"Ready" does not mean useful.** A paper can be marked ready while the title, authors, DOI, and cluster label are visibly wrong.
2. **Export inherits bad guesses silently.** If the app thinks a reference DOI is the paper DOI, citations and exported drafts carry that wrongness.
3. **The map looks authoritative even when it is not.** Cluster cards and contradiction counts appear polished enough to trust, but the labels can be generic stopwords.

## Top 3 "Feels Stupid" Moments

1. The user uploads famous papers and has to tell the app their obvious titles.
2. The user has to explain that `the`, `and`, and `for` are not research themes.
3. The user has to recognize that a scanned/OCR-poor PDF is not analyzable even though the app claims it analyzed it.

## What "Smart" Means For Research Flow

For this product, "smart" means:

1. **A dropped paper identifies itself.** Title, authors, year, DOI/arXiv ID, abstract, and citation key are inferred from front matter and metadata with visible confidence.
2. **Clusters use research concepts, not raw frequent words.** Labels should be phrases like "transformer attention" or "few-shot language models," never stopwords.
3. **Bad inputs are caught before synthesis.** Scanned, corrupted, metadata-only, encoding-damaged, or low-text files are flagged in research terms with a next step.
4. **Every inference is honest.** Low-confidence title/DOI/cluster/contradiction guesses are shown as low confidence and carried into exports.
5. **Real batches are responsive and reproducible.** Progress is per paper, long runs are cancellable, and identical inputs produce identical analysis and exports.

## Phase 2 Substance Success Metrics

1. **Real-data pass rate:** at least 7/10 audit inputs complete the primary flow with no manual correction required for title/year/basic usability.
2. **Batch quality:** the six-PDF batch produces no cluster label containing stopword-only phrases and at least 4/6 papers have correct title/year.
3. **Metadata precision:** no false DOI from a references section is accepted as a high-confidence paper DOI on the fixture set.
4. **Low-text detection:** scanned/OCR-poor or empty text inputs are blocked from confident analysis 100% of the time.
5. **Encoding normalization:** BOM, CRLF, NBSP, smart quotes, and CP1252-like artifacts do not appear in inferred titles.
6. **Determinism:** same fixture input produces byte-identical analysis JSON and exports across 3 repeated runs.
7. **Performance honesty:** operations over 300ms show progress; operations over 5s can be cancelled; cancellation leaves prior saved state intact.
8. **Actionable errors:** every failed fixture shows what failed, why in research-domain terms, and a next step.

## Out Of Scope For Phase 2 Substance

- No new product surface beyond the existing flow.
- No dark mode, command palette, landing-page polish, marketing assets, or visual redesign.
- No architecture escalation beyond Mode A GitHub Pages.
- No server-side Tika, hosted LLM, hosted OCR, auth, sync, or collaboration.
- No new paid API dependency.
- No Phase 3 polish work.
- No broad feature expansion such as collaborative notebooks, reference-manager sync, or literature-database search.

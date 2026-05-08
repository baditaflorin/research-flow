# Data Contract

Research Flow v1 has no server-side or pre-built research dataset. User papers arrive at runtime and stay in the browser.

## Static Data

Static data is limited to public build metadata:

- `version`
- `commit`
- `repositoryUrl`
- `paypalUrl`
- `pagesUrl`

The UI displays version and commit in the footer.

## Local Project Schema

The latest local project is stored in IndexedDB database `research-flow`, object store `projects`, key `latest`.

```ts
interface StoredProject {
  schemaVersion: 1;
  papers: ResearchPaper[];
  analysis?: AnalysisResult;
  updatedAt: string;
}
```

Raw PDF blobs are not persisted by default. Extracted text, metadata, derived analysis, and citations are persisted.

## Future Static Corpus

If a public demo or benchmark corpus is added later, it should use `/data/v1/` and sibling metadata files with:

- generated-at
- source commit
- input checksums
- schema version

That change requires a new ADR before implementation.

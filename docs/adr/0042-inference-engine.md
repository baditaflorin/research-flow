# 0042 - Inference engine

## Status

Accepted

## Context

Current inference accepts arbitrary document text as metadata and uses raw token frequency for cluster labels.

## Decision

Use a staged inference engine:

1. Extract structural zones: metadata, first page/front matter, abstract window, body, references.
2. Infer metadata from the strongest zones first.
3. Generate stable content hashes and human-readable IDs.
4. Build topic phrases from domain terms, bigrams, and stopword-filtered TF-IDF.
5. Keep reasoning traces for title, authors, year, DOI/arXiv ID, topics, contradictions, and gaps.

## Consequences

- References and appendices can be excluded from primary metadata.
- Cluster labels become research concepts instead of generic words.
- Tests can assert inference reasons and confidence.

## Alternatives Considered

- Add a larger local LLM first: rejected because deterministic metadata and topic logic must be correct before generative synthesis.

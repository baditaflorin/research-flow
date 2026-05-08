import type { ResearchPaper } from "../library/types";
import { tokenize } from "./text";

export interface VectorizedPaper {
  paper: ResearchPaper;
  vector: number[];
  terms: Map<string, number>;
}

export function vectorizePapers(papers: ResearchPaper[], maxTerms = 480): VectorizedPaper[] {
  const docTerms = papers.map((paper) => {
    const text = `${paper.title}\n${paper.abstract ?? ""}\n${paper.text.slice(0, 8000)}`;
    const terms = new Map<string, number>();
    for (const token of tokenize(text)) terms.set(token, (terms.get(token) ?? 0) + 1);
    return { paper, terms };
  });

  const documentFrequency = new Map<string, number>();
  for (const { terms } of docTerms) {
    for (const term of terms.keys()) {
      documentFrequency.set(term, (documentFrequency.get(term) ?? 0) + 1);
    }
  }

  const vocabulary = [...documentFrequency.entries()]
    .filter(([, count]) => count <= Math.max(4, Math.ceil(papers.length * 0.8)))
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, maxTerms)
    .map(([term]) => term);

  const idf = new Map(
    vocabulary.map((term) => [
      term,
      Math.log((1 + papers.length) / (1 + (documentFrequency.get(term) ?? 0))) + 1
    ])
  );

  return docTerms.map(({ paper, terms }) => {
    const vector = vocabulary.map((term) => (terms.get(term) ?? 0) * (idf.get(term) ?? 1));
    return { paper, terms, vector: normalize(vector) };
  });
}

export function normalize(vector: number[]) {
  const magnitude = Math.sqrt(vector.reduce((sum, value) => sum + value * value, 0));
  if (!magnitude) return vector.map(() => 0);
  return vector.map((value) => value / magnitude);
}

export function cosineSimilarity(a: number[], b: number[]) {
  let score = 0;
  for (let index = 0; index < Math.min(a.length, b.length); index += 1) {
    score += a[index] * b[index];
  }
  return score;
}

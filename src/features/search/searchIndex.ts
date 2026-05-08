import MiniSearch from "minisearch";
import type { ResearchPaper } from "../library/types";

export interface SearchResult {
  id: string;
  title: string;
  fileName: string;
  score: number;
  snippet: string;
}

type SearchRecord = {
  id: string;
  title: string;
  authors: string;
  abstract: string;
  text: string;
  fileName: string;
};

export function createSearchIndex(papers: ResearchPaper[]) {
  const index = new MiniSearch<SearchRecord>({
    fields: ["title", "authors", "abstract", "text"],
    storeFields: ["title", "fileName", "text"],
    searchOptions: {
      boost: { title: 3, abstract: 2, authors: 1.5 },
      fuzzy: 0.2,
      prefix: true
    }
  });

  index.addAll(
    papers
      .filter((paper) => paper.status === "ready")
      .map((paper) => ({
        id: paper.id,
        title: paper.title,
        authors: paper.authors.join(" "),
        abstract: paper.abstract ?? "",
        text: paper.text.slice(0, 20_000),
        fileName: paper.fileName
      }))
  );

  return index;
}

export function searchPapers(papers: ResearchPaper[], query: string): SearchResult[] {
  if (!query.trim()) return [];
  const index = createSearchIndex(papers);
  return index
    .search(query)
    .slice(0, 8)
    .map((result) => ({
      id: result.id,
      title: result.title,
      fileName: result.fileName,
      score: result.score,
      snippet: snippet(result.text, query)
    }));
}

function snippet(text: string, query: string) {
  const firstTerm = query.toLowerCase().split(/\s+/)[0] ?? "";
  const index = firstTerm ? text.toLowerCase().indexOf(firstTerm) : -1;
  const start = Math.max(0, index - 90);
  const excerpt = text
    .slice(start, start + 220)
    .replace(/\s+/g, " ")
    .trim();
  return `${start > 0 ? "... " : ""}${excerpt}${start + 220 < text.length ? " ..." : ""}`;
}

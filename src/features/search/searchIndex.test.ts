import { describe, expect, it } from "vitest";
import type { ResearchPaper } from "../library/types";
import { searchPapers } from "./searchIndex";

describe("searchPapers", () => {
  it("finds local papers by title and body text", () => {
    const papers: ResearchPaper[] = [
      paper("1", "Semantic Clustering", "Embeddings reveal themes in papers."),
      paper("2", "Citation Export", "Bibliographies can be exported.")
    ];

    expect(searchPapers(papers, "embeddings")[0].title).toBe("Semantic Clustering");
    expect(searchPapers(papers, "bibliographies")[0].title).toBe("Citation Export");
  });
});

function paper(id: string, title: string, text: string): ResearchPaper {
  return {
    id,
    fileName: `${id}.txt`,
    sourceType: "text",
    title,
    authors: [],
    text,
    wordCount: text.split(/\s+/).length,
    addedAt: "2026-05-08T00:00:00.000Z",
    status: "ready"
  };
}

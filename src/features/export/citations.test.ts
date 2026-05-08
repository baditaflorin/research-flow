import { describe, expect, it } from "vitest";
import type { ResearchPaper } from "../library/types";
import { bibtexEntry, bibliographyEntry, citationKey, inlineCitation } from "./citations";

const paper: ResearchPaper = {
  id: "paper-1",
  fileName: "sample.txt",
  sourceType: "text",
  title: "A Useful Study About Research Workflows",
  authors: ["Jane Doe", "John Smith"],
  year: "2026",
  doi: "10.1234/example",
  text: "Example text",
  wordCount: 2,
  addedAt: "2026-05-08T00:00:00.000Z",
  status: "ready"
};

describe("citation helpers", () => {
  it("creates stable keys and formatted references", () => {
    expect(citationKey(paper)).toBe("doe2026-a-useful-study");
    expect(inlineCitation(paper, "apa")).toBe("(Doe, 2026)");
    expect(bibliographyEntry(paper, "apa")).toContain("https://doi.org/10.1234/example");
    expect(bibtexEntry(paper)).toContain("@article{doe2026-a-useful-study");
  });
});

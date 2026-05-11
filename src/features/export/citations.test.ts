import { describe, expect, it } from "vitest";
import type { ResearchPaper } from "../library/types";
import {
  bibliographyEntry,
  bibtexEntry,
  citationKey,
  inlineCitation,
  parseAuthorName
} from "./citations";

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

function withAuthors(authors: string[]): ResearchPaper {
  return { ...paper, authors };
}

describe("citation helpers", () => {
  it("creates stable keys and formatted references", () => {
    expect(citationKey(paper)).toBe("doe2026-a-useful-study");
    expect(inlineCitation(paper, "apa")).toBe("(Doe & Smith, 2026)");
    expect(bibliographyEntry(paper, "apa")).toContain("https://doi.org/10.1234/example");
    expect(bibtexEntry(paper)).toContain("@article{doe2026-a-useful-study");
  });

  it("parses author names from both 'First Last' and 'Last, First'", () => {
    expect(parseAuthorName("Jane Doe")).toMatchObject({
      first: "Jane",
      last: "Doe",
      initials: "J."
    });
    expect(parseAuthorName("Doe, Jane M.")).toMatchObject({
      first: "Jane M.",
      last: "Doe",
      initials: "J. M."
    });
    expect(parseAuthorName("Madonna")).toMatchObject({
      first: "",
      last: "Madonna"
    });
    expect(parseAuthorName("").last).toBe("Unknown");
  });

  it("formats APA author lists with initials, comma+ampersand, and et al. for 3+", () => {
    const single = bibliographyEntry(withAuthors(["Jane Doe"]), "apa");
    expect(single.startsWith("Doe, J. (")).toBe(true);

    const two = bibliographyEntry(withAuthors(["Jane Doe", "John Smith"]), "apa");
    expect(two.startsWith("Doe, J., & Smith, J.")).toBe(true);

    const three = bibliographyEntry(withAuthors(["Jane Doe", "John Smith", "Pat Lee"]), "apa");
    expect(three.startsWith("Doe, J., Smith, J., & Lee, P.")).toBe(true);
  });

  it("formats APA in-text citations with et al. for 3+ authors", () => {
    expect(inlineCitation(withAuthors(["Jane Doe"]), "apa")).toBe("(Doe, 2026)");
    expect(inlineCitation(withAuthors(["Jane Doe", "John Smith"]), "apa")).toBe(
      "(Doe & Smith, 2026)"
    );
    expect(inlineCitation(withAuthors(["Jane Doe", "John Smith", "Pat Lee"]), "apa")).toBe(
      "(Doe et al., 2026)"
    );
  });

  it("formats MLA bibliography with 'Last, First' head and 'et al.' for 3+", () => {
    expect(bibliographyEntry(withAuthors(["Jane Doe"]), "mla")).toMatch(/^Doe, Jane\./);
    expect(bibliographyEntry(withAuthors(["Jane Doe", "John Smith"]), "mla")).toMatch(
      /^Doe, Jane, and John Smith\./
    );
    expect(bibliographyEntry(withAuthors(["Jane Doe", "John Smith", "Pat Lee"]), "mla")).toMatch(
      /^Doe, Jane, et al\./
    );
  });

  it("formats MLA in-text citations", () => {
    expect(inlineCitation(withAuthors(["Jane Doe"]), "mla")).toBe("(Doe)");
    expect(inlineCitation(withAuthors(["Jane Doe", "John Smith"]), "mla")).toBe("(Doe and Smith)");
    expect(inlineCitation(withAuthors(["Jane Doe", "John Smith", "Pat Lee"]), "mla")).toBe(
      "(Doe et al.)"
    );
  });

  it("formats Chicago author-date with 3 listed authors before et al.", () => {
    const three = bibliographyEntry(withAuthors(["Jane Doe", "John Smith", "Pat Lee"]), "chicago");
    expect(three.startsWith("Doe, Jane, John Smith, and Pat Lee.")).toBe(true);

    const four = bibliographyEntry(
      withAuthors(["Jane Doe", "John Smith", "Pat Lee", "Sam Park"]),
      "chicago"
    );
    expect(four.startsWith("Doe, Jane, et al.")).toBe(true);
  });

  it("formats DOIs as full https://doi.org URLs", () => {
    const bare = { ...paper, doi: "10.1234/foo" };
    expect(bibliographyEntry(bare, "apa")).toContain("https://doi.org/10.1234/foo");
    const passthrough = { ...paper, doi: "https://doi.org/10.1234/foo" };
    expect(bibliographyEntry(passthrough, "apa")).toContain("https://doi.org/10.1234/foo");
    const noProto = { ...paper, doi: "doi.org/10.1234/foo" };
    expect(bibliographyEntry(noProto, "apa")).toContain("https://doi.org/10.1234/foo");
  });
});

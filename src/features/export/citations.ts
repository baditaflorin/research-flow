import type { ResearchPaper } from "../library/types";
import type { CitationRecord } from "../analysis/types";

export type CitationStyle = "apa" | "mla" | "chicago";

export function createCitationRecords(
  papers: ResearchPaper[],
  style: CitationStyle = "apa"
): CitationRecord[] {
  return papers.map((paper) => {
    const key = citationKey(paper);
    return {
      paperId: paper.id,
      key,
      inline: inlineCitation(paper, style),
      bibliography: bibliographyEntry(paper, style),
      bibtex: bibtexEntry(paper, key)
    };
  });
}

export function citationKey(paper: ResearchPaper) {
  const author = paper.authors[0]?.split(/\s+/).at(-1) ?? "source";
  const year = paper.year ?? "nd";
  const slug = paper.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .split("-")
    .slice(0, 3)
    .join("-");
  return `${author.toLowerCase()}${year}${slug ? `-${slug}` : ""}`.replace(/[^a-z0-9-]/g, "");
}

export function inlineCitation(paper: ResearchPaper, style: CitationStyle) {
  const author = paper.authors[0]?.split(/\s+/).at(-1) ?? shortTitle(paper.title);
  const year = paper.year ?? "n.d.";
  if (style === "mla") return `(${author})`;
  if (style === "chicago") return `(${author} ${year})`;
  return `(${author}, ${year})`;
}

export function bibliographyEntry(paper: ResearchPaper, style: CitationStyle) {
  const authors = paper.authors.length ? paper.authors.join(", ") : "Unknown author";
  const year = paper.year ?? "n.d.";
  const doi = paper.doi ? ` https://doi.org/${paper.doi.replace(/^https?:\/\/doi.org\//, "")}` : "";

  if (style === "mla") {
    return `${authors}. "${paper.title}." ${year}.${doi}`;
  }

  if (style === "chicago") {
    return `${authors}. ${year}. "${paper.title}."${doi}`;
  }

  return `${authors}. (${year}). ${paper.title}.${doi}`;
}

export function formatBibliography(papers: ResearchPaper[], style: CitationStyle) {
  return createCitationRecords(papers, style)
    .map((record) => record.bibliography)
    .sort((a, b) => a.localeCompare(b))
    .join("\n");
}

export function bibtexEntry(paper: ResearchPaper, key = citationKey(paper)) {
  const fields = [
    ["title", paper.title],
    ["author", paper.authors.join(" and ")],
    ["year", paper.year],
    ["doi", paper.doi]
  ].filter(([, value]) => Boolean(value));

  const body = fields
    .map(([name, value]) => `  ${name} = {${escapeBibtex(value ?? "")}}`)
    .join(",\n");
  return `@article{${key},\n${body}\n}`;
}

function shortTitle(title: string) {
  return title.split(/\s+/).slice(0, 3).join(" ");
}

function escapeBibtex(value: string) {
  return value.replace(/[{}]/g, "");
}

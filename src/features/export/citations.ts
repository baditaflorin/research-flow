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
      bibtex: bibtexEntry(paper, key),
      confidence: citationConfidence(paper),
      warnings: citationWarnings(paper)
    };
  });
}

export function citationKey(paper: ResearchPaper) {
  const author = parseAuthorName(paper.authors[0] ?? "source").last;
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
  const lastNames = paper.authors.map((author) => parseAuthorName(author).last);
  const fallbackHandle = lastNames[0] ?? shortTitle(paper.title) ?? "Unknown";
  const year = paper.year ?? "n.d.";

  if (style === "mla") {
    // MLA in-text: (Last) for 1, (Last and Last) for 2, (Last et al.) for 3+.
    if (lastNames.length === 0) return `("${shortTitle(paper.title)}")`;
    if (lastNames.length === 1) return `(${lastNames[0]})`;
    if (lastNames.length === 2) return `(${lastNames[0]} and ${lastNames[1]})`;
    return `(${lastNames[0]} et al.)`;
  }

  if (style === "chicago") {
    // Author-date Chicago: (Last and Last 2020); (Last et al. 2020) for 4+
    if (lastNames.length === 0) return `(${fallbackHandle} ${year})`;
    if (lastNames.length === 1) return `(${lastNames[0]} ${year})`;
    if (lastNames.length === 2) return `(${lastNames[0]} and ${lastNames[1]} ${year})`;
    if (lastNames.length === 3) {
      return `(${lastNames[0]}, ${lastNames[1]}, and ${lastNames[2]} ${year})`;
    }
    return `(${lastNames[0]} et al. ${year})`;
  }

  // APA in-text: (Smith, 2020); (Smith & Jones, 2020); (Smith et al., 2020) for 3+
  if (lastNames.length === 0) return `(${fallbackHandle}, ${year})`;
  if (lastNames.length === 1) return `(${lastNames[0]}, ${year})`;
  if (lastNames.length === 2) return `(${lastNames[0]} & ${lastNames[1]}, ${year})`;
  return `(${lastNames[0]} et al., ${year})`;
}

export function bibliographyEntry(paper: ResearchPaper, style: CitationStyle) {
  const year = paper.year ?? "n.d.";
  const doi = paper.doi ? formatDoi(paper.doi) : "";
  const doiSuffix = doi ? ` ${doi}` : "";

  if (style === "mla") {
    const authorBlock = formatMlaAuthors(paper.authors);
    return `${authorBlock} "${paper.title}." ${year}.${doiSuffix}`;
  }

  if (style === "chicago") {
    const authorBlock = formatChicagoAuthors(paper.authors);
    return `${authorBlock} ${year}. "${paper.title}."${doiSuffix}`;
  }

  // APA: Last, F. M., Last, F. M., & Last, F. M. (Year). Title.
  const authorBlock = formatApaAuthors(paper.authors);
  return `${authorBlock} (${year}). ${paper.title}.${doiSuffix}`;
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

interface ParsedName {
  first: string;
  last: string;
  initials: string;
}

/**
 * Parse a "First Middle Last" or "Last, First" string into pieces. Style
 * formatters use the initials variant ("F. M.") and the last-name surname
 * to produce APA/Chicago/MLA-style author entries.
 */
export function parseAuthorName(value: string): ParsedName {
  const trimmed = value.trim();
  if (!trimmed) return { first: "", last: "Unknown", initials: "" };

  if (trimmed.includes(",")) {
    const [last = "", givenRaw = ""] = trimmed.split(",", 2).map((part) => part.trim());
    return {
      last: last || "Unknown",
      first: givenRaw,
      initials: toInitials(givenRaw)
    };
  }

  const parts = trimmed.split(/\s+/);
  const last = parts.length === 1 ? parts[0]! : (parts.at(-1) ?? "Unknown");
  const first = parts.length === 1 ? "" : parts.slice(0, -1).join(" ");
  return { first, last, initials: toInitials(first) };
}

function toInitials(name: string): string {
  if (!name) return "";
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}.`)
    .join(" ");
}

function formatApaAuthors(authors: string[]): string {
  const parsed = authors.map(parseAuthorName);
  if (parsed.length === 0) return "Unknown author.";
  const formatted = parsed.map((author) =>
    author.initials ? `${author.last}, ${author.initials}` : author.last
  );
  if (formatted.length === 1) return ensureTrailingPeriod(formatted[0]!);
  if (formatted.length === 2) return ensureTrailingPeriod(`${formatted[0]}, & ${formatted[1]}`);
  // APA 7: list up to 20 authors with comma, ampersand before last.
  const head = formatted.slice(0, -1).join(", ");
  return ensureTrailingPeriod(`${head}, & ${formatted.at(-1)}`);
}

function ensureTrailingPeriod(value: string): string {
  return value.endsWith(".") ? value : `${value}.`;
}

function formatMlaAuthors(authors: string[]): string {
  if (authors.length === 0) return "Unknown.";
  if (authors.length >= 3) {
    const first = parseAuthorName(authors[0]!);
    return first.first ? `${first.last}, ${first.first}, et al.` : `${first.last}, et al.`;
  }
  const first = parseAuthorName(authors[0]!);
  const firstFormatted = first.first ? `${first.last}, ${first.first}` : first.last;
  if (authors.length === 1) return `${firstFormatted}.`;
  const second = parseAuthorName(authors[1]!);
  const secondFormatted = second.first ? `${second.first} ${second.last}` : second.last;
  return `${firstFormatted}, and ${secondFormatted}.`;
}

function formatChicagoAuthors(authors: string[]): string {
  if (authors.length === 0) return "Unknown.";
  const head = parseAuthorName(authors[0]!);
  const headFormatted = head.first ? `${head.last}, ${head.first}` : head.last;
  if (authors.length === 1) return `${headFormatted}.`;
  if (authors.length === 2) {
    const second = parseAuthorName(authors[1]!);
    const secondFormatted = second.first ? `${second.first} ${second.last}` : second.last;
    return `${headFormatted}, and ${secondFormatted}.`;
  }
  if (authors.length === 3) {
    const middle = parseAuthorName(authors[1]!);
    const middleFormatted = middle.first ? `${middle.first} ${middle.last}` : middle.last;
    const last = parseAuthorName(authors[2]!);
    const lastFormatted = last.first ? `${last.first} ${last.last}` : last.last;
    return `${headFormatted}, ${middleFormatted}, and ${lastFormatted}.`;
  }
  return `${headFormatted}, et al.`;
}

function formatDoi(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.toLowerCase().startsWith("doi.org/")) return `https://${trimmed}`;
  return `https://doi.org/${trimmed}`;
}

function shortTitle(title: string) {
  return title.split(/\s+/).slice(0, 3).join(" ");
}

function escapeBibtex(value: string) {
  return value.replace(/[{}]/g, "");
}

function citationConfidence(paper: ResearchPaper) {
  const fields = [
    paper.inference?.title,
    paper.inference?.authors,
    paper.inference?.year,
    paper.inference?.doi
  ]
    .filter(Boolean)
    .map((field) => field?.confidence ?? 0);
  if (!fields.length) return 0.3;
  return Number((fields.reduce((sum, value) => sum + value, 0) / fields.length).toFixed(2));
}

function citationWarnings(paper: ResearchPaper) {
  return [
    ...(paper.warnings ?? []),
    ...(paper.inference?.title.warnings ?? []),
    ...(paper.inference?.authors.warnings ?? []),
    ...(paper.inference?.year?.warnings ?? []),
    ...(paper.inference?.doi?.warnings ?? [])
  ];
}

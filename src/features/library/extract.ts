import { sha256Hex, stablePaperId } from "./hash";
import { inferred } from "./inference";
import { decodeTextBuffer, normalizeResearchText, normalizeTitleText } from "./normalize";
import type {
  ErrorKind,
  PaperExtractionProgress,
  PaperInference,
  ResearchPaper,
  SourceType,
  TextQuality
} from "./types";

type PdfTextItem = {
  str?: string;
  transform?: number[];
  width?: number;
};

type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: PdfTextItem[] }>;
  }>;
  getMetadata(): Promise<{ info?: { Title?: string; Author?: string } }>;
};

type PdfExtraction = {
  text: string;
  firstPageLines: string[];
  frontMatter: string;
  pageCount: number;
  metadata?: { title?: string; authors?: string[] };
};

const doiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const arxivPattern = /\barXiv:\s?(\d{4}\.\d{4,5})(?:v\d+)?/i;
const yearPattern = /\b(19|20)\d{2}\b/;

export async function extractPapers(
  files: File[],
  onProgress?: (progress: PaperExtractionProgress) => void,
  signal?: AbortSignal
) {
  const papers: ResearchPaper[] = [];

  for (const [index, file] of files.entries()) {
    throwIfAborted(signal);
    onProgress?.({ fileName: file.name, index, total: files.length, phase: "reading" });
    try {
      const paper = await extractPaper(
        file,
        (progress) =>
          onProgress?.({ fileName: file.name, index, total: files.length, ...progress }),
        signal
      );
      papers.push(paper);
      onProgress?.({ fileName: file.name, index, total: files.length, phase: "done" });
    } catch (error) {
      if (isAbortError(error)) {
        onProgress?.({ fileName: file.name, index, total: files.length, phase: "cancelled" });
        throw error;
      }
      papers.push(await failedPaper(file, error));
      onProgress?.({ fileName: file.name, index, total: files.length, phase: "failed" });
    }
  }

  return papers;
}

export async function extractPaper(
  file: File,
  onProgress?: (progress: Pick<PaperExtractionProgress, "phase" | "page" | "pages">) => void,
  signal?: AbortSignal
): Promise<ResearchPaper> {
  throwIfAborted(signal);
  const sourceType = detectSourceType(file);
  const buffer = await file.arrayBuffer();
  const contentHash = await sha256Hex(buffer);
  onProgress?.({ phase: "extracting" });

  if (sourceType === "pdf") {
    const pdf = await extractPdf(buffer, onProgress, signal);
    return buildPaper(file, sourceType, contentHash, pdf.text, {
      pageCount: pdf.pageCount,
      firstPageLines: pdf.firstPageLines,
      frontMatter: pdf.frontMatter,
      metadataTitle: pdf.metadata?.title,
      metadataAuthors: pdf.metadata?.authors
    });
  }

  if (sourceType === "bibtex") {
    const decoded = await decodeTextBuffer(buffer);
    return buildBibtexRecord(file, contentHash, decoded.text);
  }

  if (sourceType === "text" || sourceType === "markdown") {
    const decoded = await decodeTextBuffer(buffer);
    onProgress?.({ phase: "metadata" });
    return buildPaper(file, sourceType, contentHash, decoded.text, {});
  }

  return domainFailure(file, sourceType, contentHash, "unsupported_format", {
    what: "This file is not a supported research input.",
    why: "Research Flow can read PDF, TXT, Markdown, and BibTeX metadata files in v1.",
    nextSteps: ["Upload the paper PDF, a text/Markdown extract, or a BibTeX record."]
  });
}

function detectSourceType(file: File): SourceType {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".bib") || file.type === "application/x-bibtex") return "bibtex";
  if (file.type.startsWith("text/") || name.endsWith(".txt")) return "text";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
  return "unknown";
}

async function extractPdf(
  buffer: ArrayBuffer,
  onProgress?: (progress: Pick<PaperExtractionProgress, "phase" | "page" | "pages">) => void,
  signal?: AbortSignal
): Promise<PdfExtraction> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;

  const data = new Uint8Array(buffer.slice(0));
  const document = (await pdfjs.getDocument({ data }).promise) as PdfDocument;
  const pageTexts: string[] = [];
  let firstPageLines: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    throwIfAborted(signal);
    onProgress?.({ phase: "extracting", page: pageNumber, pages: document.numPages });
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    const lines = reconstructLines(content.items);
    if (pageNumber === 1) firstPageLines = lines;
    pageTexts.push(lines.join("\n"));
  }

  onProgress?.({ phase: "metadata" });
  const metadata = await document.getMetadata().catch(() => undefined);
  const text = normalizeResearchText(pageTexts.join("\n\n"));
  return {
    text,
    firstPageLines,
    frontMatter: normalizeResearchText(pageTexts.slice(0, 3).join("\n\n")),
    pageCount: document.numPages,
    metadata: {
      title: cleanMetadataTitle(metadata?.info?.Title),
      authors: metadata?.info?.Author ? splitDelimitedAuthors(metadata.info.Author) : undefined
    }
  };
}

function reconstructLines(items: PdfTextItem[]) {
  const rows: Array<{ y: number; items: Array<{ x: number; text: string }> }> = [];

  for (const item of items) {
    const text = item.str ?? "";
    if (!text.trim()) continue;
    const transform = item.transform ?? [0, 0, 0, 0, 0, 0];
    const x = transform[4] ?? 0;
    const y = Math.round((transform[5] ?? 0) * 10) / 10;
    const row = rows.find((candidate) => Math.abs(candidate.y - y) < 2.5);
    if (row) row.items.push({ x, text });
    else rows.push({ y, items: [{ x, text }] });
  }

  return rows
    .sort((a, b) => b.y - a.y)
    .map((row) =>
      normalizeResearchText(
        row.items
          .sort((a, b) => a.x - b.x)
          .map((item) => item.text)
          .join(" ")
      )
    )
    .filter(Boolean);
}

function buildPaper(
  file: File,
  sourceType: SourceType,
  contentHash: string,
  rawText: string,
  context: {
    pageCount?: number;
    firstPageLines?: string[];
    frontMatter?: string;
    metadataTitle?: string;
    metadataAuthors?: string[];
  }
): ResearchPaper {
  const text = normalizeResearchText(rawText);
  const lines = context.firstPageLines?.length
    ? context.firstPageLines.map(normalizeTitleText).filter(Boolean)
    : text.split(/\n+/).slice(0, 80).map(normalizeTitleText).filter(Boolean);
  const frontMatter = context.frontMatter ?? lines.join("\n");
  const quality = textQuality(text);
  const inference = inferPaperIdentity(file.name, text, frontMatter, lines, context);
  const title = inference.title.value;

  if (quality.lowText) {
    return {
      id: stablePaperId(title || file.name, contentHash),
      contentHash,
      fileName: file.name,
      sourceType,
      title,
      authors: inference.authors.value,
      year: inference.year?.value,
      doi: inference.doi?.value,
      arxivId: inference.arxivId?.value,
      abstract: inference.abstract?.value,
      text,
      frontMatter,
      wordCount: quality.wordCount,
      pageCount: context.pageCount,
      addedAt: stableAddedAt(file),
      status: "needs_ocr_or_better_text",
      errorKind: "needs_ocr_or_better_text",
      error:
        "Text quality is too low for trustworthy synthesis. This looks scanned, OCR-poor, or incomplete.",
      nextSteps: ["Run OCR and upload the text output, or upload a cleaner PDF."],
      warnings: quality.reasons,
      textQuality: quality,
      inference
    };
  }

  return {
    id: stablePaperId(title, contentHash),
    contentHash,
    fileName: file.name,
    sourceType,
    title,
    authors: inference.authors.value,
    year: inference.year?.value,
    doi: inference.doi?.value,
    arxivId: inference.arxivId?.value,
    abstract: inference.abstract?.value,
    text,
    frontMatter,
    wordCount: quality.wordCount,
    pageCount: context.pageCount,
    addedAt: stableAddedAt(file),
    status: "ready",
    warnings: collectInferenceWarnings(inference),
    textQuality: quality,
    inference
  };
}

function inferPaperIdentity(
  fileName: string,
  text: string,
  frontMatter: string,
  firstLines: string[],
  context: { metadataTitle?: string; metadataAuthors?: string[] }
): PaperInference {
  const arxivId = inferArxivId(text, fileName);
  const title = inferTitle(fileName, firstLines, frontMatter, context.metadataTitle);
  const authors = inferAuthors(frontMatter, title.value, context.metadataAuthors);
  const year = inferYear(frontMatter, text, arxivId?.value);
  const doi = inferDoi(frontMatter, text);
  const abstract = inferAbstract(text);

  return {
    title,
    authors,
    year,
    doi,
    arxivId,
    abstract
  };
}

function inferTitle(
  fileName: string,
  firstLines: string[],
  frontMatter: string,
  metadataTitle?: string
) {
  const metadata = cleanMetadataTitle(metadataTitle);
  if (metadata && !looksLikeFileStem(metadata, fileName)) {
    return inferred(metadata, 0.82, ["PDF metadata provided a non-filename title."]);
  }

  const candidates = titleCandidates(firstLines, frontMatter);
  const best = candidates.sort((a, b) => b.score - a.score)[0];
  if (best) {
    return inferred(best.title, best.confidence, best.reasons, best.warnings);
  }

  const fallback = normalizeTitleText(fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  return inferred(
    fallback,
    0.28,
    ["Fell back to the filename because no reliable title line was found."],
    ["Verify the title before exporting citations."]
  );
}

function titleCandidates(firstLines: string[], frontMatter: string) {
  const lines = firstLines.slice(0, 80).filter((line) => line && !skipTitleLine(line));
  const abstractIndex = findLineIndex(lines, /^abstract\b/i);
  const arxivIndex = findLineIndex(lines, arxivPattern);
  const limit = abstractIndex >= 0 ? abstractIndex : Math.min(lines.length, 45);
  const zones: string[][] = [];

  if (arxivIndex >= 0 && arxivIndex + 1 < limit) {
    zones.push(lines.slice(arxivIndex + 1, limit));
  }
  if (arxivIndex > 0) {
    zones.push(lines.slice(0, arxivIndex));
  }
  zones.push(lines.slice(0, limit));

  const candidates: Array<{
    title: string;
    score: number;
    confidence: number;
    reasons: string[];
    warnings?: string[];
  }> = [];

  for (const zone of zones) {
    const block: string[] = [];
    for (const line of zone) {
      if (skipTitleLine(line)) continue;
      if (isLikelyAuthorOrAffiliation(line) && block.length) break;
      if (isLikelyAuthorOrAffiliation(line)) continue;
      if (!isPlausibleTitleLine(line) && !block.length) continue;
      if (block.length >= 3) break;
      block.push(line);
      const joined = normalizeTitleText(block.join(" "));
      if (joined.length >= 10 && joined.length <= 180) {
        const score = titleScore(joined, frontMatter);
        candidates.push({
          title: joined,
          score,
          confidence: Math.min(0.94, 0.52 + score / 100),
          reasons: [`Detected from front-matter line block: "${joined}".`],
          warnings: score < 25 ? ["Title confidence is low; verify before export."] : undefined
        });
      }
      if (!lineLooksContinuedTitle(line)) break;
    }
  }

  return candidates.filter((candidate) => !rejectTitle(candidate.title));
}

function inferAuthors(frontMatter: string, title: string, metadataAuthors?: string[]) {
  if (metadataAuthors?.length) {
    return inferred(metadataAuthors, 0.72, ["PDF metadata included author names."]);
  }

  const lines = frontMatter.split(/\n+/).slice(0, 90);
  const titleIndex = lines.findIndex((line) =>
    normalizeTitleText(line).includes(title.slice(0, 24))
  );
  const start = titleIndex >= 0 ? titleIndex + 1 : 0;
  const end = findLineIndex(lines.slice(start), /^abstract\b/i);
  const authorWindow = lines.slice(
    start,
    end >= 0 ? start + end : Math.min(lines.length, start + 26)
  );
  const authors: string[] = [];

  for (const line of authorWindow) {
    if (skipAuthorLine(line)) continue;
    for (const name of namesFromLine(line)) {
      if (!authors.includes(name)) authors.push(name);
      if (authors.length >= 24) break;
    }
    if (authors.length >= 24) break;
  }

  const confidence = authors.length ? (authors.length <= 12 ? 0.78 : 0.66) : 0.22;
  return inferred(
    authors,
    confidence,
    authors.length
      ? ["Parsed likely author names from the front matter before the abstract."]
      : ["No reliable author names were found before the abstract."],
    authors.length ? undefined : ["Authors are missing; verify citation metadata."]
  );
}

function inferYear(frontMatter: string, fullText: string, arxivId?: string) {
  if (arxivId) {
    const year = `20${arxivId.slice(0, 2)}`;
    return inferred(year, 0.9, ["Derived year from the arXiv identifier."]);
  }
  const frontYear = frontMatter.match(yearPattern)?.[0];
  if (frontYear) return inferred(frontYear, 0.65, ["Found year in paper front matter."]);
  const abstractYear = (fullText.match(/abstract[\s\S]{0,1600}/i)?.[0] ?? "").match(
    yearPattern
  )?.[0];
  if (abstractYear) {
    return inferred(
      abstractYear,
      0.45,
      ["Found year near the abstract."],
      ["Year source is weak; verify citation metadata."]
    );
  }
  return undefined;
}

function inferDoi(frontMatter: string, fullText: string) {
  const frontDoi = frontMatter.match(doiPattern)?.[0];
  if (frontDoi) return inferred(frontDoi, 0.78, ["Found DOI in paper front matter."]);

  const bodyBeforeReferences = stripReferences(fullText);
  const bodyDoi = bodyBeforeReferences.slice(0, 6000).match(doiPattern)?.[0];
  if (bodyDoi) {
    return inferred(
      bodyDoi,
      0.45,
      ["Found DOI before the references section."],
      ["DOI source is weak; verify before export."]
    );
  }

  return undefined;
}

function inferArxivId(text: string, fileName: string) {
  const textMatch = text.match(arxivPattern)?.[1];
  if (textMatch)
    return inferred(`arXiv:${textMatch}`, 0.92, ["Found arXiv identifier in the paper text."]);
  const nameMatch = fileName.match(/(\d{4}\.\d{4,5})/)?.[1];
  if (nameMatch)
    return inferred(`arXiv:${nameMatch}`, 0.74, ["Found arXiv-like identifier in filename."]);
  return undefined;
}

function inferAbstract(text: string) {
  const match = text.match(
    /(?:^|\n)\s*(?:abstract|a b s t r a c t)\s*[:.\n]\s*([\s\S]{180,3500}?)(?:\n\s*(?:1\.?\s+)?(?:introduction|i ntroduction|keywords)\b|\n\s*1\s*\n)/i
  );
  const value = match?.[1]?.replace(/\s+/g, " ").trim();
  if (!value) return undefined;
  return inferred(value, 0.82, ["Captured text between Abstract and Introduction."]);
}

function textQuality(text: string): TextQuality {
  const tokens = text.toLowerCase().match(/[a-z][a-z-]{2,}/g) ?? [];
  const uniqueWordCount = new Set(tokens).size;
  const replacementCharacterCount = (text.match(/\uFFFD/g) ?? []).length;
  const replacementRatio = text.length ? replacementCharacterCount / text.length : 0;
  const reasons: string[] = [];
  if (tokens.length < 120) reasons.push("Extracted fewer than 120 usable words.");
  if (uniqueWordCount < 45)
    reasons.push("Extracted vocabulary is too small for research synthesis.");
  if (replacementRatio > 0.01) reasons.push("Text contains too many replacement characters.");

  return {
    wordCount: tokens.length,
    uniqueWordCount,
    replacementCharacterCount,
    replacementRatio: Number(replacementRatio.toFixed(4)),
    lowText: reasons.length > 0,
    reasons
  };
}

function buildBibtexRecord(file: File, contentHash: string, text: string): ResearchPaper {
  const fields = parseBibtexFields(text);
  const title = normalizeTitleText(fields.title ?? file.name.replace(/\.bib$/i, ""));
  const authors = fields.author
    ? splitDelimitedAuthors(fields.author.replace(/\s+and\s+/gi, ";"))
    : [];
  const year = fields.year;
  const inference: PaperInference = {
    title: inferred(title, fields.title ? 0.9 : 0.35, ["Parsed title from BibTeX metadata."]),
    authors: inferred(
      authors,
      authors.length ? 0.86 : 0.25,
      authors.length
        ? ["Parsed authors from BibTeX metadata."]
        : ["No author field found in BibTeX."]
    ),
    year: year ? inferred(year, 0.9, ["Parsed year from BibTeX metadata."]) : undefined,
    doi: fields.doi ? inferred(fields.doi, 0.88, ["Parsed DOI from BibTeX metadata."]) : undefined
  };

  return {
    id: stablePaperId(title, contentHash),
    contentHash,
    fileName: file.name,
    sourceType: "bibtex",
    title,
    authors,
    year,
    doi: fields.doi,
    text,
    wordCount: 0,
    addedAt: stableAddedAt(file),
    status: "metadata_only",
    errorKind: "metadata_only",
    error:
      "This is citation metadata only. It can improve references, but Research Flow needs the paper PDF or text for synthesis.",
    nextSteps: ["Upload the PDF or a text extract for this paper."],
    warnings: ["Metadata-only records are not analyzed as evidence."],
    textQuality: {
      wordCount: 0,
      uniqueWordCount: 0,
      replacementCharacterCount: 0,
      replacementRatio: 0,
      lowText: true,
      reasons: ["BibTeX contains metadata, not paper text."]
    },
    inference
  };
}

function parseBibtexFields(text: string) {
  const fields: Record<string, string> = {};
  for (const match of text.matchAll(/(\w+)\s*=\s*[{"]([\s\S]*?)[}"],?\s*(?=\w+\s*=|})/g)) {
    fields[match[1].toLowerCase()] = normalizeResearchText(match[2]);
  }
  return fields;
}

async function failedPaper(file: File, error: unknown): Promise<ResearchPaper> {
  const buffer = await file.arrayBuffer().catch(() => new ArrayBuffer(0));
  const contentHash = await sha256Hex(buffer);
  const sourceType = detectSourceType(file);
  const kind = classifyError(error, sourceType);
  const message = domainMessage(kind);
  return domainFailure(file, sourceType, contentHash, kind, message);
}

function domainFailure(
  file: File,
  sourceType: SourceType,
  contentHash: string,
  kind: ErrorKind,
  message: { what: string; why: string; nextSteps: string[] }
): ResearchPaper {
  const title = normalizeTitleText(file.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "));
  return {
    id: stablePaperId(title, contentHash),
    contentHash,
    fileName: file.name,
    sourceType,
    title,
    authors: [],
    text: "",
    wordCount: 0,
    addedAt: stableAddedAt(file),
    status: "failed",
    errorKind: kind,
    error: `${message.what} ${message.why}`,
    nextSteps: message.nextSteps,
    warnings: [message.why],
    textQuality: {
      wordCount: 0,
      uniqueWordCount: 0,
      replacementCharacterCount: 0,
      replacementRatio: 0,
      lowText: true,
      reasons: [message.why]
    },
    inference: {
      title: inferred(title, 0.2, ["Fell back to filename after extraction failed."]),
      authors: inferred([], 0, ["No authors can be inferred from a failed extraction."])
    }
  };
}

function classifyError(error: unknown, sourceType: SourceType): ErrorKind {
  const message = error instanceof Error ? error.message : String(error);
  if (/invalid pdf|pdf structure|unexpected server response|missing pdf/i.test(message)) {
    return "corrupt_or_partial_pdf";
  }
  if (sourceType === "unknown") return "unsupported_format";
  return "extraction_failed";
}

function domainMessage(kind: ErrorKind) {
  if (kind === "corrupt_or_partial_pdf") {
    return {
      what: "This PDF could not be read.",
      why: "It looks incomplete, corrupt, password-protected, or not a full PDF download.",
      nextSteps: ["Re-download the full file, then upload it again."]
    };
  }
  if (kind === "unsupported_format") {
    return {
      what: "This file is not a supported research input.",
      why: "Research Flow can read PDF, TXT, Markdown, and BibTeX metadata files in v1.",
      nextSteps: ["Upload a paper PDF, a text/Markdown extract, or a BibTeX record."]
    };
  }
  return {
    what: "The paper could not be extracted.",
    why: "The file did not produce usable research text.",
    nextSteps: ["Try another export of the paper or upload a text version."]
  };
}

function collectInferenceWarnings(inference: PaperInference) {
  return [
    inference.title,
    inference.authors,
    inference.year,
    inference.doi,
    inference.arxivId,
    inference.abstract
  ]
    .flatMap((item) => item?.warnings ?? [])
    .filter(Boolean);
}

function titleScore(title: string, frontMatter: string) {
  let score = 0;
  if (/[A-Z]/.test(title)) score += 12;
  if (title.includes(":")) score += 8;
  if (
    /\b(transformer|transformers|bert|llama|language|attention|image|vision|recognition|reasoning|acting|models?|learners?)\b/i.test(
      title
    )
  )
    score += 18;
  score += Math.min(16, title.split(/\s+/).length);
  if (frontMatter.toLowerCase().includes(title.toLowerCase().slice(0, 20))) score += 12;
  if (/^(figure|table|appendix|references)\b/i.test(title)) score -= 50;
  if (/\b(arxiv|copyright|permission|published as)\b/i.test(title)) score -= 30;
  if (title.split(/\s+/).length >= 3) score += 8;
  return score;
}

function isPlausibleTitleLine(line: string) {
  const words = line.split(/\s+/).length;
  return line.length >= 4 && line.length <= 140 && words <= 18 && !/[@{}]/.test(line);
}

function lineLooksContinuedTitle(line: string) {
  return /[:,-]$|\b(for|in|and|of|at|to)$/i.test(line) || line === line.toUpperCase();
}

function skipTitleLine(line: string) {
  return (
    /^abstract\b/i.test(line) ||
    arxivPattern.test(line) ||
    /^published as\b/i.test(line) ||
    /provided proper attribution|permission to reproduce|reproduce the tables|scholarly works|copyright/i.test(
      line
    ) ||
    /^(equal contribution|corresponding authors|contributions for all)/i.test(line)
  );
}

function rejectTitle(title: string) {
  return (
    /^(figure|table|appendix|references)\b/i.test(title) ||
    /arxiv preprint arxiv:/i.test(title) ||
    title.length < 8 ||
    title.length > 190
  );
}

function isLikelyAuthorOrAffiliation(line: string) {
  const clean = normalizeTitleText(line);
  if (/[@{}]/.test(clean)) return true;
  if (
    /\b(Google|Meta|University|Department|Research|Brain Team|GenAI|Princeton|OpenAI)\b/i.test(
      clean
    )
  ) {
    return true;
  }
  if (/,/.test(clean) && /\d|[*†∗]/.test(line)) return true;
  return false;
}

function skipAuthorLine(line: string) {
  const clean = normalizeResearchText(line);
  return (
    !clean ||
    skipTitleLine(clean) ||
    /^abstract\b/i.test(clean) ||
    arxivPattern.test(clean) ||
    /[@{}]/.test(clean) ||
    /\b(Google|Meta|University|Department|Research|Brain Team|GenAI|Princeton|OpenAI|ICLR)\b/i.test(
      clean
    ) ||
    /^(equal contribution|corresponding authors|contributions for all)/i.test(clean)
  );
}

function namesFromLine(line: string) {
  const cleaned = normalizeResearchText(line)
    .replace(/[∗†‡§¶*,]/g, " ")
    .replace(/\b\d+\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const tokens = cleaned.split(/\s+/).filter((token) => /^[A-ZŁ][\p{L}.'-]*$/u.test(token));
  const names: string[] = [];

  for (let index = 0; index < tokens.length; ) {
    const remaining = tokens.length - index;
    const next = tokens[index + 1] ?? "";
    const third = tokens[index + 2] ?? "";
    const take = /^[A-Z]\.?$/.test(next) && remaining >= 3 ? 3 : 2;
    const parts = tokens.slice(index, index + take);
    const name = parts.join(" ").replace(/\s+\./g, ".");
    if (parts.length >= 2 && !looksLikeOrgName(name)) names.push(name);
    index += take;
    if (remaining < 2) break;
    if (third === "and") index += 1;
  }

  return names;
}

function looksLikeOrgName(name: string) {
  return /\b(Google|Meta|University|Research|Brain|Language|Department|Team|Foundation|Fine-Tuned)\b/i.test(
    name
  );
}

function splitDelimitedAuthors(value: string) {
  return value
    .replace(/\d+/g, "")
    .split(/;|,|\band\b/gi)
    .map((part) => normalizeResearchText(part))
    .filter((part) => part.length > 1 && part.length < 80 && !looksLikeOrgName(part))
    .slice(0, 24);
}

function cleanMetadataTitle(title?: string) {
  const value = normalizeTitleText(title ?? "");
  if (!value || value.toLowerCase() === "untitled") return undefined;
  return value;
}

function looksLikeFileStem(title: string, fileName: string) {
  const stem = fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[-_]+/g, " ")
    .toLowerCase();
  return title.toLowerCase() === stem || title.length <= 5;
}

function stripReferences(text: string) {
  const index = text.search(/\n\s*(references|bibliography)\s*\n/i);
  return index >= 0 ? text.slice(0, index) : text;
}

function findLineIndex(lines: string[], pattern: RegExp) {
  return lines.findIndex((line) => pattern.test(line));
}

function stableAddedAt(file: File) {
  return new Date(file.lastModified || 0).toISOString();
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) throw new DOMException("Operation cancelled", "AbortError");
}

function isAbortError(error: unknown) {
  return error instanceof DOMException && error.name === "AbortError";
}

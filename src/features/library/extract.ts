import type { PaperExtractionProgress, ResearchPaper, SourceType } from "./types";

type PdfDocument = {
  numPages: number;
  getPage(pageNumber: number): Promise<{
    getTextContent(): Promise<{ items: Array<{ str?: string }> }>;
  }>;
  getMetadata(): Promise<{ info?: { Title?: string; Author?: string } }>;
};

const doiPattern = /\b10\.\d{4,9}\/[-._;()/:A-Z0-9]+\b/i;
const yearPattern = /\b(19|20)\d{2}\b/;

export async function extractPapers(
  files: File[],
  onProgress?: (progress: PaperExtractionProgress) => void
) {
  const papers: ResearchPaper[] = [];

  for (const [index, file] of files.entries()) {
    onProgress?.({ fileName: file.name, index, total: files.length, phase: "reading" });
    try {
      const paper = await extractPaper(file, (phase) =>
        onProgress?.({ fileName: file.name, index, total: files.length, phase })
      );
      papers.push(paper);
      onProgress?.({ fileName: file.name, index, total: files.length, phase: "done" });
    } catch (error) {
      papers.push(failedPaper(file, error));
      onProgress?.({ fileName: file.name, index, total: files.length, phase: "failed" });
    }
  }

  return papers;
}

export async function extractPaper(
  file: File,
  onPhase?: (phase: PaperExtractionProgress["phase"]) => void
): Promise<ResearchPaper> {
  const sourceType = detectSourceType(file);
  onPhase?.("extracting");

  if (sourceType === "pdf") {
    return extractPdf(file, sourceType, onPhase);
  }

  if (sourceType === "text" || sourceType === "markdown") {
    const text = await file.text();
    onPhase?.("metadata");
    return readyPaper(file, sourceType, text, {});
  }

  throw new Error("Unsupported file type. Upload PDF, TXT, or Markdown files.");
}

function detectSourceType(file: File): SourceType {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "pdf";
  if (file.type.startsWith("text/") || name.endsWith(".txt")) return "text";
  if (name.endsWith(".md") || name.endsWith(".markdown")) return "markdown";
  return "unknown";
}

async function extractPdf(
  file: File,
  sourceType: SourceType,
  onPhase?: (phase: PaperExtractionProgress["phase"]) => void
): Promise<ResearchPaper> {
  const pdfjs = await import("pdfjs-dist");
  const workerUrl = await import("pdfjs-dist/build/pdf.worker.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl.default;

  const data = new Uint8Array(await file.arrayBuffer());
  const document = (await pdfjs.getDocument({ data }).promise) as PdfDocument;
  const pageTexts: string[] = [];

  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pageTexts.push(content.items.map((item) => item.str ?? "").join(" "));
  }

  onPhase?.("metadata");
  const metadata = await document.getMetadata().catch(() => undefined);
  const text = pageTexts.join("\n\n");
  return readyPaper(file, sourceType, text, {
    pageCount: document.numPages,
    title: metadata?.info?.Title,
    authors: metadata?.info?.Author ? splitAuthors(metadata.info.Author) : undefined
  });
}

function readyPaper(
  file: File,
  sourceType: SourceType,
  text: string,
  overrides: { pageCount?: number; title?: string; authors?: string[] }
): ResearchPaper {
  const cleanText = normalizeWhitespace(text);
  const title = cleanTitle(overrides.title) ?? inferTitle(cleanText, file.name);
  const abstract = inferAbstract(cleanText);
  const doi = cleanText.match(doiPattern)?.[0];
  const year = cleanText.match(yearPattern)?.[0];
  const authors = overrides.authors?.length ? overrides.authors : inferAuthors(cleanText, title);

  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    sourceType,
    title,
    authors,
    year,
    doi,
    abstract,
    text: cleanText,
    wordCount: countWords(cleanText),
    pageCount: overrides.pageCount,
    addedAt: new Date().toISOString(),
    status: "ready"
  };
}

function failedPaper(file: File, error: unknown): ResearchPaper {
  const message = error instanceof Error ? error.message : "Unknown extraction error";
  return {
    id: crypto.randomUUID(),
    fileName: file.name,
    sourceType: detectSourceType(file),
    title: file.name,
    authors: [],
    text: "",
    wordCount: 0,
    addedAt: new Date().toISOString(),
    status: "failed",
    error: message
  };
}

function inferTitle(text: string, fileName: string) {
  const lines = text
    .split(/\n+/)
    .map((line) => line.trim())
    .filter((line) => line.length >= 8 && line.length <= 180);

  const candidate = lines.find((line) => !/^(abstract|introduction|keywords)$/i.test(line));
  return candidate ?? fileName.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " ");
}

function cleanTitle(title?: string) {
  const value = title?.trim();
  if (!value || value.toLowerCase() === "untitled") return undefined;
  return value.replace(/\s+/g, " ");
}

function inferAuthors(text: string, title: string) {
  const beforeAbstract = text.split(/abstract/i)[0] ?? "";
  const lines = beforeAbstract
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);
  const titleIndex = lines.findIndex((line) => line.includes(title.slice(0, 24)));
  const authorLine = lines
    .slice(Math.max(0, titleIndex + 1), titleIndex + 4)
    .find((line) => /,| and |;/.test(line) && !yearPattern.test(line));
  return authorLine ? splitAuthors(authorLine) : [];
}

function inferAbstract(text: string) {
  const match = text.match(
    /abstract\s*[:.\n]\s*([\s\S]{180,2500}?)(?:\n\s*(?:keywords|introduction|1\.|i\.))/i
  );
  return match?.[1]?.replace(/\s+/g, " ").trim();
}

function splitAuthors(value: string) {
  return value
    .replace(/\d+/g, "")
    .split(/;|,|\band\b/gi)
    .map((part) => part.trim())
    .filter((part) => part.length > 1 && part.length < 80)
    .slice(0, 12);
}

function normalizeWhitespace(text: string) {
  return text
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function countWords(text: string) {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

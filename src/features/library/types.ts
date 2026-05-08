export type SourceType = "pdf" | "text" | "markdown" | "unknown";

export interface ResearchPaper {
  id: string;
  fileName: string;
  sourceType: SourceType;
  title: string;
  authors: string[];
  year?: string;
  doi?: string;
  abstract?: string;
  text: string;
  wordCount: number;
  pageCount?: number;
  addedAt: string;
  status: "ready" | "failed";
  error?: string;
}

export interface PaperExtractionProgress {
  fileName: string;
  index: number;
  total: number;
  phase: "reading" | "extracting" | "metadata" | "done" | "failed";
}

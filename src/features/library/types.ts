export type SourceType = "pdf" | "text" | "markdown" | "bibtex" | "unknown";

export type PaperStatus = "ready" | "failed" | "needs_ocr_or_better_text" | "metadata_only";

export type ErrorKind =
  | "unsupported_format"
  | "metadata_only"
  | "corrupt_or_partial_pdf"
  | "needs_ocr_or_better_text"
  | "extraction_failed";

export type ConfidenceLevel = "high" | "medium" | "low";

export interface Inference<T> {
  value: T;
  confidence: number;
  level: ConfidenceLevel;
  reasons: string[];
  warnings?: string[];
}

export interface TextQuality {
  wordCount: number;
  uniqueWordCount: number;
  replacementCharacterCount: number;
  replacementRatio: number;
  lowText: boolean;
  reasons: string[];
}

export interface PaperInference {
  title: Inference<string>;
  authors: Inference<string[]>;
  year?: Inference<string>;
  doi?: Inference<string>;
  arxivId?: Inference<string>;
  abstract?: Inference<string>;
  topics?: Inference<string[]>;
}

export interface ResearchPaper {
  id: string;
  contentHash?: string;
  fileName: string;
  sourceType: SourceType;
  title: string;
  authors: string[];
  year?: string;
  doi?: string;
  arxivId?: string;
  abstract?: string;
  text: string;
  frontMatter?: string;
  wordCount: number;
  pageCount?: number;
  addedAt: string;
  status: PaperStatus;
  error?: string;
  errorKind?: ErrorKind;
  nextSteps?: string[];
  warnings?: string[];
  textQuality?: TextQuality;
  inference?: PaperInference;
}

export interface PaperExtractionProgress {
  fileName: string;
  index: number;
  total: number;
  phase: "reading" | "extracting" | "metadata" | "quality" | "done" | "failed" | "cancelled";
  page?: number;
  pages?: number;
}

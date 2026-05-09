import type { ResearchPaper } from "../library/types";

export interface Cluster {
  id: string;
  label: string;
  summary: string;
  keywords: string[];
  paperIds: string[];
  confidence: number;
  reasons: string[];
  x: number;
  y: number;
  color: string;
}

export interface Evidence {
  paperId: string;
  title: string;
  sentence: string;
}

export interface Contradiction {
  id: string;
  topic: string;
  summary: string;
  confidence: number;
  evidence: [Evidence, Evidence];
}

export interface Gap {
  id: string;
  title: string;
  rationale: string;
  opportunity: string;
  relatedPaperIds: string[];
  priority: "high" | "medium" | "low";
  confidence: number;
}

export interface OutlineSection {
  id: string;
  heading: string;
  bullets: string[];
}

export interface CitationRecord {
  paperId: string;
  key: string;
  inline: string;
  bibliography: string;
  bibtex: string;
  confidence: number;
  warnings: string[];
}

export interface AnalysisProvenance {
  appVersion: string;
  schemaVersion: 1;
  sourceHash: string;
  parameters: AnalyzeOptions;
  paperIds: string[];
}

export interface AnalysisResult {
  schemaVersion: 1;
  generatedAt: string;
  durationMs: number;
  engine: "local-tfidf" | "transformers-js";
  papersAnalyzed: number;
  provenance: AnalysisProvenance;
  warnings: string[];
  clusters: Cluster[];
  contradictions: Contradiction[];
  gaps: Gap[];
  outline: OutlineSection[];
  citations: CitationRecord[];
}

export interface AnalyzeOptions {
  useDeepEmbeddings: boolean;
}

export interface AnalysisRequest {
  papers: ResearchPaper[];
  options: AnalyzeOptions;
}

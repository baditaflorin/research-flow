import { z } from "zod";
import type { AnalysisResult } from "../analysis/types";
import type { ResearchPaper } from "../library/types";
import { appSettingsSchema, defaultSettings, type AppSettings } from "./settingsStore";

const confidenceLevelSchema = z.enum(["high", "medium", "low"]);

const stringInferenceSchema = z.object({
  value: z.string(),
  confidence: z.number(),
  level: confidenceLevelSchema,
  reasons: z.array(z.string()),
  warnings: z.array(z.string()).optional()
});

const stringArrayInferenceSchema = z.object({
  value: z.array(z.string()),
  confidence: z.number(),
  level: confidenceLevelSchema,
  reasons: z.array(z.string()),
  warnings: z.array(z.string()).optional()
});

const textQualitySchema = z.object({
  wordCount: z.number(),
  uniqueWordCount: z.number(),
  replacementCharacterCount: z.number(),
  replacementRatio: z.number(),
  lowText: z.boolean(),
  reasons: z.array(z.string())
});

export const researchPaperSchema = z.object({
  id: z.string(),
  contentHash: z.string().optional(),
  fileName: z.string(),
  sourceType: z.enum(["pdf", "text", "markdown", "bibtex", "unknown"]),
  title: z.string(),
  authors: z.array(z.string()),
  year: z.string().optional(),
  doi: z.string().optional(),
  arxivId: z.string().optional(),
  abstract: z.string().optional(),
  text: z.string(),
  frontMatter: z.string().optional(),
  wordCount: z.number(),
  pageCount: z.number().optional(),
  addedAt: z.string(),
  status: z.enum(["ready", "failed", "needs_ocr_or_better_text", "metadata_only"]),
  error: z.string().optional(),
  errorKind: z
    .enum([
      "unsupported_format",
      "metadata_only",
      "corrupt_or_partial_pdf",
      "needs_ocr_or_better_text",
      "extraction_failed"
    ])
    .optional(),
  nextSteps: z.array(z.string()).optional(),
  warnings: z.array(z.string()).optional(),
  textQuality: textQualitySchema.optional(),
  inference: z
    .object({
      title: stringInferenceSchema,
      authors: stringArrayInferenceSchema,
      year: stringInferenceSchema.optional(),
      doi: stringInferenceSchema.optional(),
      arxivId: stringInferenceSchema.optional(),
      abstract: stringInferenceSchema.optional(),
      topics: stringArrayInferenceSchema.optional()
    })
    .optional()
}) satisfies z.ZodType<ResearchPaper>;

const analyzeOptionsSchema = z.object({
  useDeepEmbeddings: z.boolean()
});

const clusterSchema = z.object({
  id: z.string(),
  label: z.string(),
  summary: z.string(),
  keywords: z.array(z.string()),
  paperIds: z.array(z.string()),
  confidence: z.number(),
  reasons: z.array(z.string()),
  x: z.number(),
  y: z.number(),
  color: z.string()
});

const evidenceSchema = z.object({
  paperId: z.string(),
  title: z.string(),
  sentence: z.string()
});

export const analysisResultSchema = z.object({
  schemaVersion: z.literal(1),
  generatedAt: z.string(),
  durationMs: z.number(),
  engine: z.enum(["local-tfidf", "transformers-js"]),
  papersAnalyzed: z.number(),
  provenance: z.object({
    appVersion: z.string(),
    schemaVersion: z.literal(1),
    sourceHash: z.string(),
    parameters: analyzeOptionsSchema,
    paperIds: z.array(z.string())
  }),
  warnings: z.array(z.string()),
  clusters: z.array(clusterSchema),
  contradictions: z.array(
    z.object({
      id: z.string(),
      topic: z.string(),
      summary: z.string(),
      confidence: z.number(),
      evidence: z.tuple([evidenceSchema, evidenceSchema])
    })
  ),
  gaps: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      rationale: z.string(),
      opportunity: z.string(),
      relatedPaperIds: z.array(z.string()),
      priority: z.enum(["high", "medium", "low"]),
      confidence: z.number()
    })
  ),
  outline: z.array(
    z.object({
      id: z.string(),
      heading: z.string(),
      bullets: z.array(z.string())
    })
  ),
  citations: z.array(
    z.object({
      paperId: z.string(),
      key: z.string(),
      inline: z.string(),
      bibliography: z.string(),
      bibtex: z.string(),
      confidence: z.number(),
      warnings: z.array(z.string())
    })
  )
}) satisfies z.ZodType<AnalysisResult>;

export const projectStateSchema = z.object({
  schemaVersion: z.literal(2),
  appVersion: z.string(),
  exportedAt: z.string(),
  updatedAt: z.string(),
  settings: appSettingsSchema,
  papers: z.array(researchPaperSchema),
  analysis: analysisResultSchema.optional()
});

const legacyProjectSchema = z.object({
  schemaVersion: z.literal(1),
  papers: z.array(researchPaperSchema),
  analysis: analysisResultSchema.optional(),
  updatedAt: z.string()
});

export type ProjectState = z.infer<typeof projectStateSchema>;

export interface ProjectStateInput {
  appVersion: string;
  papers: ResearchPaper[];
  analysis?: AnalysisResult;
  settings?: AppSettings;
}

export function createProjectState(input: ProjectStateInput): ProjectState {
  const timestamp = new Date().toISOString();
  return {
    schemaVersion: 2,
    appVersion: input.appVersion,
    exportedAt: timestamp,
    updatedAt: timestamp,
    settings: input.settings ?? defaultSettings,
    papers: stablePapers(input.papers),
    analysis: input.analysis
  };
}

export function parseProjectState(value: unknown): ProjectState {
  const current = projectStateSchema.safeParse(value);
  if (current.success) return normalizeState(current.data);

  const legacy = legacyProjectSchema.safeParse(value);
  if (legacy.success) {
    return normalizeState({
      schemaVersion: 2,
      appVersion: "0.1.x",
      exportedAt: legacy.data.updatedAt,
      updatedAt: legacy.data.updatedAt,
      settings: defaultSettings,
      papers: legacy.data.papers,
      analysis: legacy.data.analysis
    });
  }

  throw new Error("This does not look like a Research Flow project state file.");
}

export function projectStateToJson(state: ProjectState) {
  return `${JSON.stringify(normalizeState(state), null, 2)}\n`;
}

export function projectStateFromJson(json: string) {
  return parseProjectState(JSON.parse(json));
}

export function encodeProjectStateHash(state: ProjectState) {
  const json = JSON.stringify(normalizeState(state));
  return encodeURIComponent(btoa(encodeUtf8(json)));
}

export function decodeProjectStateHash(hash: string) {
  return projectStateFromJson(decodeUtf8(atob(decodeURIComponent(hash))));
}

function normalizeState(state: ProjectState): ProjectState {
  return {
    ...state,
    settings: { ...defaultSettings, ...state.settings },
    papers: stablePapers(state.papers),
    analysis: state.analysis
      ? {
          ...state.analysis,
          provenance: {
            ...state.analysis.provenance,
            paperIds: [...state.analysis.provenance.paperIds].sort()
          },
          citations: [...state.analysis.citations].sort((a, b) => a.key.localeCompare(b.key))
        }
      : undefined
  };
}

function stablePapers(papers: ResearchPaper[]) {
  return [...papers].sort((a, b) => a.id.localeCompare(b.id));
}

function encodeUtf8(value: string) {
  return Array.from(new TextEncoder().encode(value), (byte) => String.fromCodePoint(byte)).join("");
}

function decodeUtf8(value: string) {
  const bytes = Uint8Array.from(value, (char) => char.codePointAt(0) ?? 0);
  return new TextDecoder().decode(bytes);
}

import type { ResearchPaper } from "../library/types";
import { clusterPapers } from "./clustering";
import { detectContradictions, detectGaps, generateOutline } from "./insights";
import type { AnalysisResult, AnalyzeOptions } from "./types";
import { normalize, vectorizePapers, type VectorizedPaper } from "./vectorize";
import { createCitationRecords } from "../export/citations";

export async function analyzePapers(
  papers: ResearchPaper[],
  options: AnalyzeOptions = { useDeepEmbeddings: false }
): Promise<AnalysisResult> {
  const started = performance.now();
  const readyPapers = papers.filter((paper) => paper.status === "ready" && paper.wordCount > 0);
  const vectorized = options.useDeepEmbeddings
    ? await vectorizeWithTransformers(readyPapers).catch(() => vectorizePapers(readyPapers))
    : vectorizePapers(readyPapers);

  const clusters = clusterPapers(vectorized);
  const contradictions = detectContradictions(readyPapers, clusters);
  const gaps = detectGaps(readyPapers, clusters);
  const outline = generateOutline(readyPapers, clusters, contradictions, gaps);
  const sourceHash = analysisSourceHash(readyPapers, options);

  return {
    schemaVersion: 1,
    generatedAt: "1970-01-01T00:00:00.000Z",
    durationMs: Math.round(performance.now() - started),
    engine: options.useDeepEmbeddings ? "transformers-js" : "local-tfidf",
    papersAnalyzed: readyPapers.length,
    provenance: {
      appVersion: appVersion(),
      schemaVersion: 1,
      sourceHash,
      parameters: options,
      paperIds: readyPapers.map((paper) => paper.id).sort()
    },
    warnings: readyPapers.flatMap((paper) => paper.warnings ?? []),
    clusters,
    contradictions,
    gaps,
    outline,
    citations: createCitationRecords(readyPapers)
  };
}

function analysisSourceHash(papers: ResearchPaper[], options: AnalyzeOptions) {
  const input = JSON.stringify({
    paperHashes: papers.map((paper) => paper.contentHash ?? paper.id).sort(),
    options
  });
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

function appVersion() {
  const globalVersion = (globalThis as { __APP_VERSION__?: string }).__APP_VERSION__;
  return globalVersion ?? "0.1.0";
}

async function vectorizeWithTransformers(papers: ResearchPaper[]): Promise<VectorizedPaper[]> {
  const transformers = (await import("@huggingface/transformers")) as {
    pipeline: (task: string, model: string, options?: Record<string, unknown>) => Promise<unknown>;
  };
  const extractor = (await transformers.pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    dtype: "q8"
  })) as (
    input: string,
    options: Record<string, unknown>
  ) => Promise<{ data: Float32Array | number[] }>;

  const lexical = vectorizePapers(papers);
  const deepVectors = await Promise.all(
    papers.map(async (paper) => {
      const text = `${paper.title}. ${paper.abstract ?? paper.text.slice(0, 1200)}`.slice(0, 1800);
      const output = await extractor(text, { pooling: "mean", normalize: true });
      return Array.from(output.data);
    })
  );

  return lexical.map((item, index) => ({
    ...item,
    vector: normalize(deepVectors[index] ?? item.vector)
  }));
}

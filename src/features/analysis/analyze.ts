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

  return {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    durationMs: performance.now() - started,
    engine: options.useDeepEmbeddings ? "transformers-js" : "local-tfidf",
    papersAnalyzed: readyPapers.length,
    clusters,
    contradictions,
    gaps,
    outline,
    citations: createCitationRecords(readyPapers)
  };
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

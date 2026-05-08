import { analyzePapers } from "../features/analysis/analyze";
import type { AnalysisRequest } from "../features/analysis/types";

self.onmessage = async (event: MessageEvent<AnalysisRequest>) => {
  try {
    const result = await analyzePapers(event.data.papers, event.data.options);
    self.postMessage({ ok: true, result });
  } catch (error) {
    self.postMessage({
      ok: false,
      error: error instanceof Error ? error.message : "Analysis failed"
    });
  }
};

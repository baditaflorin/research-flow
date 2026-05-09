import type { ConfidenceLevel, Inference } from "./types";

export function confidenceLevel(confidence: number): ConfidenceLevel {
  if (confidence >= 0.78) return "high";
  if (confidence >= 0.5) return "medium";
  return "low";
}

export function inferred<T>(
  value: T,
  confidence: number,
  reasons: string[],
  warnings?: string[]
): Inference<T> {
  const clamped = Math.max(0, Math.min(1, confidence));
  return {
    value,
    confidence: Number(clamped.toFixed(2)),
    level: confidenceLevel(clamped),
    reasons,
    warnings: warnings?.length ? warnings : undefined
  };
}

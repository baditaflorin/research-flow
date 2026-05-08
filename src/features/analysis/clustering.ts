import { titleCase } from "../../shared/format";
import type { ResearchPaper } from "../library/types";
import type { Cluster } from "./types";
import { cosineSimilarity, normalize, type VectorizedPaper } from "./vectorize";

const colors = ["#0f766e", "#2563eb", "#b45309", "#7c3aed", "#be123c", "#15803d"];

export function clusterPapers(vectorized: VectorizedPaper[]): Cluster[] {
  if (vectorized.length === 0) return [];

  const k = chooseClusterCount(vectorized.length);
  const assignments = kmeans(
    vectorized.map((item) => item.vector),
    k
  );
  const grouped = new Map<number, VectorizedPaper[]>();

  vectorized.forEach((item, index) => {
    const clusterIndex = assignments[index] ?? 0;
    grouped.set(clusterIndex, [...(grouped.get(clusterIndex) ?? []), item]);
  });

  return [...grouped.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([clusterIndex, items], visualIndex) => {
      const keywords = clusterKeywords(items);
      const angle = (Math.PI * 2 * visualIndex) / Math.max(1, grouped.size);
      const label = keywords.length ? titleCase(keywords.slice(0, 2).join(" ")) : "General";

      return {
        id: `cluster-${clusterIndex}`,
        label,
        summary: summarizeCluster(
          items.map((item) => item.paper),
          keywords
        ),
        keywords,
        paperIds: items.map((item) => item.paper.id),
        x: Math.round(50 + 24 * Math.cos(angle)),
        y: Math.round(50 + 26 * Math.sin(angle)),
        color: colors[visualIndex % colors.length]
      };
    });
}

function chooseClusterCount(total: number) {
  if (total <= 1) return 1;
  if (total <= 4) return 2;
  return Math.min(6, Math.max(2, Math.round(Math.sqrt(total))));
}

function kmeans(vectors: number[][], k: number) {
  const centroids = Array.from({ length: k }, (_, index) => vectors[index % vectors.length] ?? []);
  let assignments = vectors.map((_, index) => index % k);

  for (let iteration = 0; iteration < 14; iteration += 1) {
    assignments = vectors.map((vector) => nearestCentroid(vector, centroids));
    for (let clusterIndex = 0; clusterIndex < k; clusterIndex += 1) {
      const members = vectors.filter((_, index) => assignments[index] === clusterIndex);
      if (members.length) centroids[clusterIndex] = averageVector(members);
    }
  }

  return assignments;
}

function nearestCentroid(vector: number[], centroids: number[][]) {
  let bestIndex = 0;
  let bestScore = Number.NEGATIVE_INFINITY;
  centroids.forEach((centroid, index) => {
    const score = cosineSimilarity(vector, centroid);
    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  });
  return bestIndex;
}

function averageVector(vectors: number[][]) {
  const width = vectors[0]?.length ?? 0;
  const totals = Array.from({ length: width }, () => 0);
  for (const vector of vectors) {
    vector.forEach((value, index) => {
      totals[index] += value;
    });
  }
  return normalize(totals.map((value) => value / vectors.length));
}

function clusterKeywords(items: VectorizedPaper[]) {
  const totals = new Map<string, number>();
  for (const item of items) {
    for (const [term, count] of item.terms.entries()) {
      totals.set(term, (totals.get(term) ?? 0) + count);
    }
  }
  return [...totals.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 7)
    .map(([term]) => term);
}

function summarizeCluster(papers: ResearchPaper[], keywords: string[]) {
  const lead = papers.length === 1 ? "1 paper" : `${papers.length} papers`;
  const keywordPhrase = keywords.slice(0, 4).join(", ");
  return keywordPhrase
    ? `${lead} around ${keywordPhrase}.`
    : `${lead} with limited shared vocabulary.`;
}

import { describe, expect, it } from "vitest";
import { analyzePapers } from "./analyze";
import type { ResearchPaper } from "../library/types";

describe("analyzePapers", () => {
  it("clusters papers and surfaces evidence-linked contradictions", async () => {
    const papers = [
      paper(
        "a",
        "Remote Work Improves Productivity",
        "The study finds that remote work increases productivity and improves focus for software teams. Future work should examine long-term outcomes."
      ),
      paper(
        "b",
        "Remote Work Reduces Productivity",
        "The study finds that remote work decreases productivity and reduces team coordination in software teams. The effect is not significant for senior staff."
      ),
      paper(
        "c",
        "Coordination Practices",
        "Coordination rituals support distributed teams and improve delivery predictability. Open data is available for the survey instrument."
      )
    ];

    const result = await analyzePapers(papers, { useDeepEmbeddings: false });

    expect(result.papersAnalyzed).toBe(3);
    expect(result.clusters.length).toBeGreaterThan(0);
    expect(result.contradictions.length).toBeGreaterThan(0);
    expect(result.contradictions[0].evidence).toHaveLength(2);
    expect(result.outline.some((section) => section.heading.includes("Gaps"))).toBe(true);
  });
});

function paper(id: string, title: string, text: string): ResearchPaper {
  return {
    id,
    fileName: `${id}.txt`,
    sourceType: "text",
    title,
    authors: ["Ada Lovelace"],
    year: "2026",
    text,
    wordCount: text.split(/\s+/).length,
    addedAt: new Date("2026-05-08T00:00:00.000Z").toISOString(),
    status: "ready"
  };
}

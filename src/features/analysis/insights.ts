import type { ResearchPaper } from "../library/types";
import { extractClaimSentences, topTerms } from "./text";
import type { Cluster, Contradiction, Evidence, Gap, OutlineSection } from "./types";

export function detectContradictions(
  papers: ResearchPaper[],
  clusters: Cluster[]
): Contradiction[] {
  const byId = new Map(papers.map((paper) => [paper.id, paper]));
  const contradictions: Contradiction[] = [];

  for (const cluster of clusters) {
    const clusterPapers = cluster.paperIds.map((id) => byId.get(id)).filter(isResearchPaper);
    const claims = clusterPapers.flatMap((paper) =>
      extractClaimSentences(paper.text, cluster.keywords).map((claim) => ({ paper, claim }))
    );

    for (let leftIndex = 0; leftIndex < claims.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < claims.length; rightIndex += 1) {
        const left = claims[leftIndex];
        const right = claims[rightIndex];
        if (left.paper.id === right.paper.id) continue;
        if (left.claim.direction === right.claim.direction) continue;

        const overlap = sharedTerms(left.claim.terms, right.claim.terms);
        if (overlap.length === 0) continue;

        contradictions.push({
          id: `contradiction-${contradictions.length + 1}`,
          topic: overlap.slice(0, 3).join(", "),
          summary: `The papers make opposite-direction claims around ${overlap.slice(0, 3).join(", ")}.`,
          confidence: Math.min(0.92, 0.58 + overlap.length * 0.1),
          evidence: [
            toEvidence(left.paper, left.claim.sentence),
            toEvidence(right.paper, right.claim.sentence)
          ]
        });

        if (contradictions.length >= 8) return contradictions;
      }
    }
  }

  if (!contradictions.length && papers.length > 1) {
    const keywords = topTerms(papers.map((paper) => paper.text).join(" "), 16);
    const claims = papers.flatMap((paper) =>
      extractClaimSentences(paper.text, keywords).map((claim) => ({ paper, claim }))
    );

    for (let leftIndex = 0; leftIndex < claims.length; leftIndex += 1) {
      for (let rightIndex = leftIndex + 1; rightIndex < claims.length; rightIndex += 1) {
        const left = claims[leftIndex];
        const right = claims[rightIndex];
        if (left.paper.id === right.paper.id) continue;
        if (left.claim.direction === right.claim.direction) continue;

        const overlap = sharedTerms(left.claim.terms, right.claim.terms);
        if (overlap.length === 0) continue;

        contradictions.push({
          id: `contradiction-${contradictions.length + 1}`,
          topic: overlap.slice(0, 3).join(", "),
          summary: `Across clusters, the papers make opposite-direction claims around ${overlap
            .slice(0, 3)
            .join(", ")}.`,
          confidence: Math.min(0.88, 0.52 + overlap.length * 0.09),
          evidence: [
            toEvidence(left.paper, left.claim.sentence),
            toEvidence(right.paper, right.claim.sentence)
          ]
        });

        if (contradictions.length >= 8) return contradictions;
      }
    }
  }

  return contradictions;
}

function isResearchPaper(paper: ResearchPaper | undefined): paper is ResearchPaper {
  return Boolean(paper);
}

export function detectGaps(papers: ResearchPaper[], clusters: Cluster[]): Gap[] {
  const gaps: Gap[] = [];
  const allText = papers.map((paper) => paper.text.toLowerCase()).join("\n");

  for (const cluster of clusters) {
    if (cluster.paperIds.length <= 1) {
      gaps.push({
        id: `gap-${gaps.length + 1}`,
        title: `${cluster.label} needs more evidence`,
        rationale:
          "Only one uploaded paper strongly anchors this cluster, so the theme may be under-sampled.",
        opportunity:
          "Add adjacent papers or position this as a narrow, emerging thread in the review.",
        relatedPaperIds: cluster.paperIds,
        priority: "high",
        confidence: cluster.confidence
      });
    }
  }

  const methodChecks = [
    {
      title: "Longitudinal evidence",
      pattern: /\blongitudinal|follow-up|panel\b/i,
      opportunity: "Look for time-aware designs to separate short-term signal from durable change."
    },
    {
      title: "Replication and external validity",
      pattern: /\breplication|replicate|external validity|generaliz/i,
      opportunity:
        "Check whether key claims have been tested in another setting, population, or dataset."
    },
    {
      title: "Open data and reproducibility",
      pattern: /\bopen data|repository|code available|reproducib/i,
      opportunity: "Prioritize sources that publish data, code, protocols, or preregistrations."
    }
  ];

  for (const check of methodChecks) {
    if (!check.pattern.test(allText)) {
      gaps.push({
        id: `gap-${gaps.length + 1}`,
        title: check.title,
        rationale: `The uploaded set rarely mentions ${check.title.toLowerCase()}, which may weaken synthesis confidence.`,
        opportunity: check.opportunity,
        relatedPaperIds: papers.slice(0, 5).map((paper) => paper.id),
        priority: gaps.length < 2 ? "medium" : "low",
        confidence: 0.58
      });
    }
  }

  const futureWorkPapers = papers.filter((paper) =>
    /\bfuture work|limitation|further research/i.test(paper.text)
  );
  if (futureWorkPapers.length) {
    gaps.push({
      id: `gap-${gaps.length + 1}`,
      title: "Author-stated limitations",
      rationale: `${futureWorkPapers.length} paper(s) contain limitation or future-work language worth mining directly.`,
      opportunity: "Turn repeated limitations into a dedicated gap subsection with citations.",
      relatedPaperIds: futureWorkPapers.slice(0, 8).map((paper) => paper.id),
      priority: "high",
      confidence: 0.74
    });
  }

  return gaps.slice(0, 8);
}

export function generateOutline(
  papers: ResearchPaper[],
  clusters: Cluster[],
  contradictions: Contradiction[],
  gaps: Gap[]
): OutlineSection[] {
  const fieldTerms = topTerms(
    papers.map((paper) => `${paper.title} ${paper.abstract ?? ""}`).join(" "),
    5
  );

  return [
    {
      id: "working-title",
      heading: "Working Title",
      bullets: [
        fieldTerms.length
          ? `A structured review of ${fieldTerms.slice(0, 3).join(", ")}`
          : "A structured review of the uploaded literature"
      ]
    },
    {
      id: "introduction",
      heading: "1. Introduction",
      bullets: [
        `Frame the research area using ${papers.length} uploaded source(s).`,
        "Define the review question and explain why the evidence base is fragmented.",
        "Preview the thematic clusters and points of tension."
      ]
    },
    {
      id: "map",
      heading: "2. Thematic Map",
      bullets: clusters.map(
        (cluster) => `${cluster.label}: ${cluster.summary} Cite ${citeKeys(cluster.paperIds)}.`
      )
    },
    {
      id: "tensions",
      heading: "3. Contradictions And Tensions",
      bullets: contradictions.length
        ? contradictions.map(
            (item) => `${item.summary} Compare ${citeKeys(item.evidence.map((e) => e.paperId))}.`
          )
        : [
            "No direct contradictions were detected; report this as an evidence gap, not as consensus."
          ]
    },
    {
      id: "gaps",
      heading: "4. Gaps And Future Work",
      bullets: gaps.map(
        (gap) => `${gap.title}: ${gap.opportunity} Cite ${citeKeys(gap.relatedPaperIds)}.`
      )
    },
    {
      id: "conclusion",
      heading: "5. Conclusion",
      bullets: [
        "Synthesize what is stable across clusters.",
        "Separate high-confidence claims from unresolved disagreements.",
        "End with the smallest useful next study or analysis."
      ]
    }
  ];
}

function sharedTerms(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return [...new Set(left.filter((term) => rightSet.has(term)))];
}

function toEvidence(paper: ResearchPaper, sentence: string): Evidence {
  return { paperId: paper.id, title: paper.title, sentence };
}

function citeKeys(paperIds: string[]) {
  return paperIds
    .slice(0, 3)
    .map((id) => `[@${id.slice(0, 8)}]`)
    .join(" ");
}

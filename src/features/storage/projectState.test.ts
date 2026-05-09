import { describe, expect, it } from "vitest";
import type { AnalysisResult } from "../analysis/types";
import type { ResearchPaper } from "../library/types";
import {
  createProjectState,
  decodeProjectStateHash,
  encodeProjectStateHash,
  parseProjectState,
  projectStateFromJson,
  projectStateToJson
} from "./projectState";

describe("portable project state", () => {
  it("round-trips state through JSON and URL hash encoding", () => {
    const state = createProjectState({
      appVersion: "0.3.0-test",
      papers: [paperFixture],
      analysis: analysisFixture,
      settings: {
        citationStyle: "mla",
        useDeepEmbeddings: true,
        autoAnalyze: false
      }
    });

    const fromJson = projectStateFromJson(projectStateToJson(state));
    const fromHash = decodeProjectStateHash(encodeProjectStateHash(state));

    expect(fromJson.schemaVersion).toBe(2);
    expect(fromJson.settings.citationStyle).toBe("mla");
    expect(fromJson.papers[0]?.id).toBe("paper-1");
    expect(fromHash.analysis?.provenance.sourceHash).toBe("abc123");
  });

  it("migrates v1 browser state to schema version 2", () => {
    const migrated = parseProjectState({
      schemaVersion: 1,
      updatedAt: "2024-01-01T00:00:00.000Z",
      papers: [paperFixture],
      analysis: analysisFixture
    });

    expect(migrated.schemaVersion).toBe(2);
    expect(migrated.settings.autoAnalyze).toBe(true);
    expect(migrated.appVersion).toBe("0.1.x");
  });
});

const paperFixture: ResearchPaper = {
  id: "paper-1",
  contentHash: "hash-1",
  fileName: "paper.txt",
  sourceType: "text",
  title: "Portable Research State",
  authors: ["Ada Lovelace"],
  year: "2026",
  text: "Research state should be portable and reproducible.",
  wordCount: 7,
  addedAt: "1970-01-01T00:00:00.000Z",
  status: "ready",
  inference: {
    title: {
      value: "Portable Research State",
      confidence: 0.9,
      level: "high",
      reasons: ["Fixture title."]
    },
    authors: {
      value: ["Ada Lovelace"],
      confidence: 0.8,
      level: "high",
      reasons: ["Fixture authors."]
    }
  }
};

const analysisFixture: AnalysisResult = {
  schemaVersion: 1,
  generatedAt: "1970-01-01T00:00:00.000Z",
  durationMs: 12,
  engine: "local-tfidf",
  papersAnalyzed: 1,
  provenance: {
    appVersion: "0.3.0-test",
    schemaVersion: 1,
    sourceHash: "abc123",
    parameters: { useDeepEmbeddings: false },
    paperIds: ["paper-1"]
  },
  warnings: [],
  clusters: [
    {
      id: "cluster-1",
      label: "Portable State",
      summary: "1 paper around portable state.",
      keywords: ["portable state"],
      paperIds: ["paper-1"],
      confidence: 0.8,
      reasons: ["Fixture reason."],
      x: 50,
      y: 50,
      color: "#0f766e"
    }
  ],
  contradictions: [],
  gaps: [],
  outline: [{ id: "outline-1", heading: "Portable State", bullets: ["Export and import."] }],
  citations: [
    {
      paperId: "paper-1",
      key: "lovelace2026-portable-research-state",
      inline: "(Lovelace, 2026)",
      bibliography: "Ada Lovelace. (2026). Portable Research State.",
      bibtex: "@article{lovelace2026-portable-research-state}",
      confidence: 0.85,
      warnings: []
    }
  ]
};

import { chromium } from "@playwright/test";
import { execFileSync, spawn } from "node:child_process";
import { readFileSync } from "node:fs";
import { createServer } from "node:net";
import { resolve } from "node:path";

const basePath = "/research-flow/";
const fixtureDir = resolve("test/fixtures/realdata");
const singleExpectedFiles = [
  "attention.expected.json",
  "bert.expected.json",
  "gpt3.expected.json",
  "llama2.expected.json",
  "vit.expected.json",
  "react.expected.json",
  "scanned-sample.expected.json",
  "attention.bib.expected.json",
  "attention-truncated.expected.json",
  "attention-cp1252.expected.json"
];

const results = [];

execFileSync("npm", ["run", "build"], { stdio: "inherit" });

const port = await freePort();
const server = spawn(process.execPath, ["scripts/serve-docs.mjs"], {
  env: { ...process.env, PORT: String(port) },
  stdio: "inherit"
});

try {
  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForServer(`${baseUrl}${basePath}`);
  const browser = await chromium.launch();

  try {
    for (const expectedFile of singleExpectedFiles) {
      const expected = readExpected(expectedFile);
      const result = await runSingleFixture(browser, baseUrl, expected);
      results.push(result);
      console.log(`${result.pass ? "PASS" : "FAIL"} ${result.fixture} ${result.durationMs}ms`);
      if (!result.pass) {
        console.error(result.messages.join("\n"));
        process.exitCode = 1;
      }
    }

    const batch = await runBatchFixture(browser, baseUrl);
    results.push(batch);
    console.log(`${batch.pass ? "PASS" : "FAIL"} ${batch.fixture} ${batch.durationMs}ms`);
    if (!batch.pass) {
      console.error(batch.messages.join("\n"));
      process.exitCode = 1;
    }
  } finally {
    await browser.close();
  }
} finally {
  server.kill();
}

const passed = results.filter((result) => result.pass).length;
console.log(JSON.stringify({ passed, total: results.length, results }, null, 2));

async function runSingleFixture(browser, baseUrl, expected) {
  const started = Date.now();
  const context = await browser.newContext();
  const page = await context.newPage();
  const fixture = expected.fixture;
  const messages = [];

  try {
    await page.goto(`${baseUrl}${basePath}`);
    await page.setInputFiles("input[type='file']", resolve(fixtureDir, fixture));
    const project = await waitForProject(page, (state) =>
      state?.papers?.some((paper) => paper.fileName === fixture)
    );
    const paper = project.papers.find((item) => item.fileName === fixture);
    if (!paper) throw new Error(`No paper stored for ${fixture}`);
    validatePaper(paper, expected.expected, messages);
    return {
      fixture,
      pass: messages.length === 0,
      durationMs: Date.now() - started,
      status: paper.status,
      words: paper.wordCount,
      title: paper.title,
      messages
    };
  } catch (error) {
    return {
      fixture,
      pass: false,
      durationMs: Date.now() - started,
      messages: [error instanceof Error ? error.message : String(error)]
    };
  } finally {
    await context.close();
  }
}

async function runBatchFixture(browser, baseUrl) {
  const started = Date.now();
  const context = await browser.newContext();
  const page = await context.newPage();
  const expected = readExpected("batch-six-papers.expected.json").expected;
  const fixture = "batch-six-papers";
  const messages = [];

  try {
    await page.goto(`${baseUrl}${basePath}`);
    await page.setInputFiles(
      "input[type='file']",
      readExpected("batch-six-papers.expected.json").fixture.map((file) =>
        resolve(fixtureDir, file)
      )
    );
    const project = await waitForProject(
      page,
      (state) => state?.analysis?.papersAnalyzed === expected.papersAnalyzed,
      120_000
    );
    const labels = project.analysis.clusters.map((cluster) => cluster.label);
    const labelText = project.analysis.clusters
      .flatMap((cluster) => [cluster.label, ...cluster.keywords])
      .join(" ")
      .toLowerCase();

    if (project.analysis.papersAnalyzed !== expected.papersAnalyzed) {
      messages.push(`Expected ${expected.papersAnalyzed} analyzed papers.`);
    }
    if (project.analysis.clusters.length < expected.minMeaningfulClusters) {
      messages.push(`Expected at least ${expected.minMeaningfulClusters} clusters.`);
    }
    for (const forbidden of expected.forbiddenClusterLabels) {
      if (labels.includes(forbidden)) messages.push(`Forbidden cluster label: ${forbidden}`);
    }
    const conceptHits = expected.clusterLabelsShouldIncludeConcepts.filter((concept) =>
      labelText.includes(concept.toLowerCase())
    );
    if (conceptHits.length < 2) {
      messages.push(`Expected at least two recognizable concept labels, saw ${labels.join(", ")}.`);
    }

    const first = canonicalAnalysis(project.analysis);
    await page.getByRole("button", { name: /Build Research Map/i }).click();
    const rerun = await waitForProject(
      page,
      (state) =>
        state?.analysis?.papersAnalyzed === expected.papersAnalyzed &&
        canonicalAnalysis(state.analysis).sourceHash === first.sourceHash,
      120_000
    );
    const second = canonicalAnalysis(rerun.analysis);
    if (JSON.stringify(first) !== JSON.stringify(second)) {
      messages.push("Analysis output changed after rerun for identical input.");
    }

    return {
      fixture,
      pass: messages.length === 0,
      durationMs: Date.now() - started,
      labels,
      messages
    };
  } catch (error) {
    return {
      fixture,
      pass: false,
      durationMs: Date.now() - started,
      messages: [error instanceof Error ? error.message : String(error)]
    };
  } finally {
    await context.close();
  }
}

function validatePaper(paper, expected, messages) {
  const expectedStatus = statusName(expected.status);
  if (paper.status !== expectedStatus)
    messages.push(`Expected status ${expectedStatus}, got ${paper.status}.`);

  for (const titlePart of expected.titleIncludes ?? []) {
    if (!paper.title.toLowerCase().includes(titlePart.toLowerCase())) {
      messages.push(`Title "${paper.title}" does not include "${titlePart}".`);
    }
  }
  for (const forbidden of expected.titleMustNotInclude ?? []) {
    if (paper.title.includes(forbidden))
      messages.push(`Title includes forbidden text ${forbidden}.`);
  }
  for (const forbidden of expected.forbiddenTitlePatterns ?? []) {
    if (paper.title.toLowerCase().includes(forbidden.toLowerCase())) {
      messages.push(`Title includes forbidden pattern ${forbidden}.`);
    }
  }
  for (const author of expected.authorsInclude ?? []) {
    const authorText = paper.authors.join(" ").toLowerCase();
    if (!authorText.includes(author.toLowerCase())) {
      messages.push(`Authors "${paper.authors.join(", ")}" do not include "${author}".`);
    }
  }
  if (expected.year && paper.year !== expected.year) {
    messages.push(`Expected year ${expected.year}, got ${paper.year ?? "missing"}.`);
  }
  for (const identifier of expected.identifiersInclude ?? []) {
    if (paper.arxivId !== identifier)
      messages.push(`Expected identifier ${identifier}, got ${paper.arxivId}.`);
  }
  if (expected.minWords && paper.wordCount < expected.minWords) {
    messages.push(`Expected at least ${expected.minWords} words, got ${paper.wordCount}.`);
  }
  if (typeof expected.lowText === "boolean" && paper.textQuality?.lowText !== expected.lowText) {
    messages.push(`Expected lowText=${expected.lowText}, got ${paper.textQuality?.lowText}.`);
  }
  for (const text of expected.errorIncludes ?? []) {
    if (
      !String(paper.error ?? "")
        .toLowerCase()
        .includes(text.toLowerCase())
    ) {
      messages.push(`Error does not include "${text}".`);
    }
  }
  for (const text of expected.nextStepIncludes ?? []) {
    const nextSteps = [...(paper.nextSteps ?? []), paper.error ?? ""].join(" ").toLowerCase();
    if (!nextSteps.includes(text.toLowerCase())) {
      messages.push(`Next steps do not include "${text}".`);
    }
  }
  if (expected.mustNotAcceptReferenceDoiAsPaperDoi && paper.doi) {
    messages.push(`Unexpected DOI inferred from likely reference list: ${paper.doi}.`);
  }
  if (
    expected.mustNotUseEmailFragmentsAsAuthors &&
    paper.authors.some((author) => author.includes("@"))
  ) {
    messages.push("Email fragment was parsed as an author.");
  }
}

function statusName(value) {
  if (value === "failed_recoverable") return "failed";
  if (value === "needs_pdf_or_text") return "metadata_only";
  return value;
}

function canonicalAnalysis(analysis) {
  return {
    sourceHash: analysis.provenance.sourceHash,
    engine: analysis.engine,
    clusters: analysis.clusters.map((cluster) => ({
      label: cluster.label,
      paperIds: cluster.paperIds,
      keywords: cluster.keywords,
      confidence: cluster.confidence
    })),
    gaps: analysis.gaps.map((gap) => ({
      title: gap.title,
      relatedPaperIds: gap.relatedPaperIds,
      confidence: gap.confidence
    })),
    citations: analysis.citations.map((citation) => citation.key)
  };
}

async function waitForProject(page, predicate, timeoutMs = 90_000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const project = await latestProject(page);
    if (predicate(project)) return project;
    await page.waitForTimeout(500);
  }
  throw new Error("Timed out waiting for expected project state.");
}

async function latestProject(page) {
  return page.evaluate(
    () =>
      new Promise((resolve) => {
        const request = globalThis.indexedDB.open("research-flow", 2);
        request.onerror = () => resolve(undefined);
        request.onsuccess = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains("projects")) {
            resolve(undefined);
            return;
          }
          const transaction = db.transaction("projects", "readonly");
          const getRequest = transaction.objectStore("projects").get("latest");
          getRequest.onerror = () => resolve(undefined);
          getRequest.onsuccess = () => resolve(getRequest.result);
        };
      })
  );
}

function readExpected(file) {
  return JSON.parse(readFileSync(resolve(fixtureDir, file), "utf8"));
}

async function waitForServer(url) {
  for (let attempt = 0; attempt < 80; attempt += 1) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // keep polling
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Preview server did not start.");
}

function freePort() {
  return new Promise((resolve) => {
    const server = createServer();
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      server.close(() => resolve(address.port));
    });
  });
}

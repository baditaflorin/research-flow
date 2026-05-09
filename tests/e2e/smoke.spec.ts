import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

test("happy path builds a local research map from text papers", async ({ page }) => {
  await page.goto("/research-flow/");

  await expect(page.getByRole("heading", { name: "Research Flow" })).toBeVisible();
  await expect(page.getByRole("link", { name: /Star on GitHub/i })).toHaveAttribute(
    "href",
    "https://github.com/baditaflorin/research-flow"
  );
  await expect(page.getByText(/commit/i)).toBeVisible();

  await page.setInputFiles("input[type='file']", [
    resolve("tests/fixtures/remote-work-positive.txt"),
    resolve("tests/fixtures/remote-work-negative.txt")
  ]);

  await expect(page.getByText(/Research map built/i).last()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText("Published Research Map")).toBeVisible();
  await expect(page.getByText("Draft Outline And Citations")).toBeVisible();
  await expect(page.getByRole("button", { name: /Word/i })).toBeEnabled();
});

test("pasted text can produce a portable project state", async ({ page }) => {
  await page.goto("/research-flow/");

  await page
    .getByPlaceholder(/Paste paper text/i)
    .fill(
      [
        "Paste-First Local Research",
        "Example Author",
        "",
        "Abstract",
        "This pasted paper argues that usable research tools should accept text from the clipboard, keep source provenance, and export project state for later restoration.",
        "",
        "1 Introduction",
        "Researchers often start from copied abstracts and notes rather than clean PDF files.",
        "",
        "2 Workflow",
        "A paste-first workflow should preserve enough text for clustering, citation warnings, and gap analysis. It should not ask the user to save a temporary file before the first useful preview. The application should normalize whitespace, track provenance, and show confidence so the user can correct the draft rather than configure the system.",
        "",
        "3 Findings",
        "Portable state is necessary because local browser projects otherwise stay trapped in one profile. Exported state should include settings, paper identifiers, analysis source hashes, and enough metadata to reproduce the result later. A stranger should be able to paste, analyze, export, import, and continue without asking for help."
      ].join("\n")
    );
  await page.getByRole("button", { name: /Import Text/i }).click();
  await expect(page.getByText(/Research map built/i).last()).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export State/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("research-flow-project.research-flow.json");
});

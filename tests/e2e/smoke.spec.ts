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
        "Researchers often start from copied abstracts and notes rather than clean PDF files."
      ].join("\n")
    );
  await page.getByRole("button", { name: /Import Text/i }).click();
  await expect(page.getByText(/Research map built/i).last()).toBeVisible({ timeout: 15_000 });

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /Export State/i }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe("research-flow-project.research-flow.json");
});

import { chromium } from "@playwright/test";
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const port = Number(process.env.PORT ?? 4190);
const baseURL = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, ["scripts/serve-docs.mjs"], {
  env: { ...process.env, PORT: String(port) },
  stdio: "inherit"
});

async function waitForServer() {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    try {
      const response = await fetch(`${baseURL}/research-flow/`);
      if (response.status < 500) return;
    } catch {
      // Keep polling until the preview server accepts connections.
    }
    await new Promise((resolveWait) => setTimeout(resolveWait, 250));
  }
  throw new Error("Preview server did not start");
}

try {
  await waitForServer();
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1440, height: 980 } });
  await page.goto(`${baseURL}/research-flow/`);
  await page.setInputFiles("input[type='file']", [
    resolve("tests/fixtures/remote-work-positive.txt"),
    resolve("tests/fixtures/remote-work-negative.txt")
  ]);
  await page
    .getByText(/Research map built/i)
    .last()
    .waitFor({ state: "visible", timeout: 15_000 });
  mkdirSync("docs", { recursive: true });
  await page.screenshot({ path: "docs/screenshot.png", fullPage: true });
  await browser.close();
} finally {
  server.kill();
}

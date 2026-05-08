import { existsSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const required = ["docs/index.html", "docs/404.html", "docs/manifest.webmanifest"];

for (const file of required) {
  if (!existsSync(file) || statSync(file).size === 0) {
    throw new Error(`${file} is missing or empty`);
  }
}

const index = readFileSync(resolve("docs/index.html"), "utf8");
if (!index.includes("/research-flow/")) {
  throw new Error("docs/index.html does not contain the GitHub Pages base path");
}

console.log("Pages output is present and base-path aware");

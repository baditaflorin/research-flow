import { copyFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const indexPath = resolve("docs/index.html");
const fallbackPath = resolve("docs/404.html");

if (!existsSync(indexPath)) {
  throw new Error("docs/index.html was not generated");
}

copyFileSync(indexPath, fallbackPath);
console.log("Generated docs/404.html SPA fallback");

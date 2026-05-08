import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig } from "vite";

const packageJson = JSON.parse(readFileSync(resolve("package.json"), "utf8")) as {
  version: string;
};

function gitValue(command: string, fallback: string) {
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

const commit = gitValue("git rev-parse --short HEAD", "local");
const fullCommit = gitValue("git rev-parse HEAD", "local");

export default defineConfig({
  base: "/research-flow/",
  plugins: [react(), tailwindcss()],
  build: {
    outDir: "docs",
    emptyOutDir: false,
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("pdfjs-dist")) return "pdf";
          if (id.includes("@huggingface/transformers")) return "embeddings";
          if (id.includes("docx")) return "exports";
          if (id.includes("minisearch")) return "search";
          if (id.includes("node_modules")) return "vendor";
          return undefined;
        }
      }
    }
  },
  define: {
    __APP_VERSION__: JSON.stringify(packageJson.version),
    __APP_COMMIT__: JSON.stringify(commit),
    __APP_FULL_COMMIT__: JSON.stringify(fullCommit),
    __APP_REPOSITORY_URL__: JSON.stringify("https://github.com/baditaflorin/research-flow"),
    __APP_PAYPAL_URL__: JSON.stringify("https://www.paypal.com/paypalme/florinbadita"),
    __APP_PAGES_URL__: JSON.stringify("https://baditaflorin.github.io/research-flow/")
  },
  worker: {
    format: "es"
  }
});

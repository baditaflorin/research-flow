import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: ["src/test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      include: [
        "src/features/analysis/**/*.{ts,tsx}",
        "src/features/export/citations.ts",
        "src/features/search/**/*.{ts,tsx}",
        "src/shared/format.ts"
      ],
      exclude: [
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.worker.ts",
        "src/features/analysis/stopwords.ts"
      ],
      thresholds: {
        lines: 70,
        functions: 70,
        branches: 60,
        statements: 70
      }
    }
  }
});

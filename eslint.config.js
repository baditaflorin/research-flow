import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["docs/assets/**", "docs/index.html", "docs/404.html", "coverage/**"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-explicit-any": "warn"
    }
  },
  {
    files: ["*.config.js", "scripts/**/*.mjs"],
    languageOptions: {
      globals: globals.node
    }
  },
  {
    files: ["public/sw.js", "docs/sw.js"],
    languageOptions: {
      globals: globals.serviceworker
    }
  }
);

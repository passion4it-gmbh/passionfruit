// @ts-check
import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

const tsFiles = ["src/**/*.ts", "src/**/*.tsx"];

export default tseslint.config(
  {
    ignores: [
      "eslint.config.mjs",
      "eslint.astro.config.mjs",
      "**/node_modules/**",
      "**/dist/**",
      "**/.astro/**",
      ".claude/**",
      "**/*.js",
      "**/*.cjs",
      "**/*.mjs",
      "src/content.config.ts",
    ],
  },
  {
    files: tsFiles,
    ...eslint.configs.recommended,
  },
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: tsFiles,
  })),
  {
    files: tsFiles,
    languageOptions: {
      globals: {
        ...globals.node,
      },
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-unsafe-argument": "error",
      "@typescript-eslint/require-await": "error",
    },
  },
);

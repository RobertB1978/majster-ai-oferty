import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import i18next from "eslint-plugin-i18next";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", {
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
        "caughtErrorsIgnorePattern": "^_"
      }],
    },
  },
  // Enforce no console.log in src/ (except logger.ts and sentry.ts)
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/lib/logger.ts", "src/lib/sentry.ts"],
    rules: {
      "no-console": ["error", { allow: ["warn", "error"] }],
    },
  },
  // ─────────────────────────────────────────────────────────────────────────
  // Zero-Hardcode Policy: i18n/no-literal-string
  //
  // All user-facing strings in JSX must go through t() / <Trans>.
  // Rule is in "warn" mode so existing files surface in IDE/CI reports
  // without blocking the build. Escalate individual files to "error" after
  // they are fully migrated.
  //
  // Excluded attributes are technical/non-visible (routing, styling, a11y
  // hidden, test IDs) — they never render as visible text.
  // ─────────────────────────────────────────────────────────────────────────
  {
    files: ["src/**/*.{ts,tsx}"],
    // Exclude non-UI files where literal strings are intentional:
    // tests, data constants, type definitions, Supabase integration stubs
    ignores: [
      "src/**/*.test.{ts,tsx}",
      "src/**/*.spec.{ts,tsx}",
      "src/test/**",
      "src/data/**",
      "src/types/**",
      "src/integrations/**",
      "src/lib/validations.ts",
      "src/lib/sentry.ts",
      "src/lib/logger.ts",
    ],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": ["warn", {
        framework: "react",
        // "jsx-only" — only flag strings that appear in JSX context
        // (JSXText and JSX attribute values). Skips plain TS/function bodies
        // where literals are technical (e.g. route paths, Supabase table names).
        mode: "jsx-only",
        "jsx-attributes": {
          // These attributes never render as visible text — exclude them.
          exclude: [
            "className", "styleName", "style",
            "type", "key", "id",
            "width", "height",
            "variant", "size",
            "htmlFor", "to", "href", "target", "rel",
            "name", "value",
            "data-testid", "data-cy", "data-id",
            "aria-hidden", "aria-describedby", "aria-labelledby",
            "src", "alt",         // alt is often i18n'd separately — keep warn
            "fill", "stroke",     // SVG attributes
            "accept", "pattern",  // input technical attrs
            "role",
          ],
        },
        // Allow common technical string patterns that are never user-facing
        // (hex colours, CSS units, icon names, route segments, etc.)
        words: [
          "^[0-9]+(%|px|rem|em|vh|vw)?$",   // CSS / numeric values
          "^#[0-9a-fA-F]{3,8}$",             // hex colours
          "^[A-Z][A-Z0-9_]+$",               // SCREAMING_SNAKE constants
          "^/[a-z0-9/-]*$",                  // URL paths
          "^[a-z]+:[a-z-]+$",                // namespaced tokens (e.g. "text:primary")
        ],
        // Don't require t() inside these call expressions (utility / library calls)
        callees: ["t", "i18n.t", "i18next.t", "Trans", "cn", "clsx", "cva"],
      }],
    },
  },
  // Fully-migrated files: escalate to "error" to block regressions
  {
    files: [
      "src/pages/Login.tsx",
      "src/components/auth/AuthDiagnostics.tsx",
    ],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": ["error", {
        framework: "react",
        mode: "jsx-only",
        "jsx-attributes": {
          exclude: [
            "className", "styleName", "style", "type", "key", "id",
            "width", "height", "variant", "size", "htmlFor", "to",
            "href", "target", "rel", "name", "data-testid",
            "aria-hidden", "aria-describedby", "fill", "stroke", "role",
          ],
        },
        callees: ["t", "i18n.t", "i18next.t", "Trans", "cn", "clsx", "cva"],
      }],
    },
  },
);

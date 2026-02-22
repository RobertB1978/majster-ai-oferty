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
  // i18n literal-string proof: applied per-screen as migration progresses
  {
    files: [
      "src/pages/Login.tsx",
      "src/components/auth/AuthDiagnostics.tsx",
    ],
    plugins: { i18next },
    rules: {
      "i18next/no-literal-string": ["warn", {
        framework: "react",
        mode: "jsx-only",
        "jsx-attributes": {
          exclude: [
            "className", "styleName", "style", "type", "key", "id",
            "width", "height", "variant", "size", "htmlFor", "to",
            "href", "target", "rel", "name", "data-testid",
          ],
        },
      }],
    },
  },
);

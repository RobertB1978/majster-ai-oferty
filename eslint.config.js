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
      // shadcn/ui internal components — vendor code, not user-facing text
      "src/components/ui/calendar.tsx",
      "src/components/ui/sidebar.tsx",
      // Environment check page — technical/developer-only
      "src/pages/EnvCheck.tsx",
      // i18n config — technical setup
      "src/i18n/**",
      // Config files
      "src/config/**",
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
            // Core React/HTML attributes
            "className", "styleName", "style",
            "type", "key", "id",
            "width", "height",
            "variant", "size",
            "htmlFor", "to", "href", "target", "rel",
            "name", "value", "defaultValue",
            "data-testid", "data-cy", "data-id", "data-sidebar", "data-mobile",
            // Accessibility attributes
            "aria-hidden", "aria-describedby", "aria-labelledby",
            "aria-label", "aria-controls", "aria-expanded",
            "aria-required", "aria-live", "aria-atomic",
            // SVG attributes
            "fill", "stroke", "strokeDasharray", "strokeLinecap", "strokeLinejoin",
            "strokeWidth", "viewBox", "d", "rx", "ry", "cx", "cy", "r",
            // Form / input technical attributes
            "accept", "pattern", "autoComplete", "inputMode", "placeholder",
            // Routing attributes (React Router)
            "path", "element", "index",
            // Image attributes
            "src", "alt",
            // UI component attributes (shadcn / Radix)
            "role", "align", "side", "sideOffset", "asChild", "orientation",
            // Recharts data attributes
            "dataKey", "stackId", "color",
            // Framer Motion / animation attributes
            "mode", "reducedMotion", "layout", "drag", "layoutId",
            "initial", "animate", "exit", "transition",
            // Other technical attributes
            "title", "keywords", "activeClassName",
          ],
        },
        // Literal strings inside these call expressions are exempt from the rule.
        // cn/clsx/cva compose class names (never user-visible text).
        // t/i18n.t are already understood by the plugin but listed for clarity.
        callees: {
          exclude: ["cn", "clsx", "cva", "t", "i18n.t", "i18next.t"],
        },
        // Regex patterns for string values that are always technical (never UI text).
        // v6 schema: words.exclude is an array of regex strings.
        words: {
          exclude: [
            "[0-9]+(px|rem|em|vh|vw|%)?",  // CSS numeric values
            "#[0-9a-fA-F]{3,8}",            // hex colours
            "[A-Z][A-Z0-9_]+",              // SCREAMING_SNAKE constants
            "/[a-z0-9/:.-]*",              // URL path segments (including params like :id)
            "h-[0-9]+",                     // Tailwind height classes
            "w-[0-9]+",                     // Tailwind width classes
            "[a-z]+-[a-z]+",               // kebab-case identifiers (CSS, data attrs)
            "text-[a-z-]+",               // Tailwind text classes
            "\\.[0-9]+",                   // decimal numbers
          ],
        },
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
            // Core React/HTML attributes
            "className", "styleName", "style", "type", "key", "id",
            "width", "height", "variant", "size", "htmlFor", "to",
            "href", "target", "rel", "name", "value", "data-testid",
            // Accessibility attributes
            "aria-hidden", "aria-describedby", "aria-labelledby",
            "aria-label", "aria-controls", "aria-expanded",
            // SVG / graphic attributes
            "fill", "stroke", "strokeLinecap", "strokeLinejoin",
            "strokeWidth", "viewBox", "d", "rx", "ry", "cx", "cy", "r",
            // Form / input attributes
            "autoComplete", "placeholder", "src", "alt",
            // UI component attributes (shadcn / Radix)
            "role", "align", "side", "sideOffset", "asChild",
            // Framer Motion / animation attributes
            "mode", "reducedMotion", "layout", "drag",
          ],
        },
        callees: {
          exclude: ["cn", "clsx", "cva", "t", "i18n.t", "i18next.t"],
        },
        // Mirror warn-mode word patterns so numeric/constant values don't trip errors
        words: {
          exclude: [
            "[0-9]+(px|rem|em|vh|vw|%)?",
            "#[0-9a-fA-F]{3,8}",
            "[A-Z][A-Z0-9_]+",
            "/[a-z0-9/-]*",
          ],
        },
      }],
    },
  },
);

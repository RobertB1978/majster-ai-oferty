# Known Issues & Monitoring

This document tracks known non-critical issues that are being monitored but do not impact application functionality.

---

## 🟡 Supabase ESM Build Warnings (Benign)

**Status:** Monitoring
**Impact:** None - build completes successfully, all tests pass
**First observed:** December 2024
**Supabase version:** `@supabase/supabase-js@2.87.3` (latest stable)

### Warning Details

During Vite production builds, two warnings appear:

```
node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs (46:10):
"default" is not exported by "node_modules/@supabase/supabase-js/dist/module/index.js",
imported by "node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs".

node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs (94:21):
"default" is not exported by "node_modules/@supabase/supabase-js/dist/module/index.js",
imported by "node_modules/@supabase/supabase-js/dist/esm/wrapper.mjs".
```

### Root Cause

This is an ESM/CJS interop issue within the Supabase client library itself, not our code. The warnings occur during the Vite build process when resolving module exports between ESM wrapper and CommonJS module.

### Why It's Safe to Ignore

1. ✅ **Build succeeds** - Despite warnings, build completes successfully
2. ✅ **All tests pass** - No runtime errors, all 188 tests passing
3. ✅ **App functions correctly** - No impact on Supabase client functionality
4. ✅ **Latest stable version** - Using `2.87.3` (latest as of Dec 2024)
5. ✅ **Upstream issue** - This is a known packaging issue in Supabase client itself

### What We're Doing

- **Monitoring:** Tracking in production logs (Sentry/Vercel)
- **Watching upstream:** Monitoring Supabase releases for fix
- **No workarounds:** Avoiding Vite/Rollup hacks that could introduce real bugs

### When to Revisit

- [ ] When Supabase releases version `2.88.x` or `3.x.x` with ESM fix
- [ ] If production errors appear related to Supabase client module resolution
- [ ] If Vite upgrade changes warning behavior

### References

- Supabase client: https://github.com/supabase/supabase-js
- Similar issue discussions: [Supabase GitHub Issues](https://github.com/supabase/supabase-js/issues)

---

## 🟡 npm audit: devDependency Vulnerabilities (Accepted Risk)

**Status:** Accepted — devDependencies only, not shipped to production
**Date:** 2026-03-22
**Severity:** 2 high, 1 moderate

### Details

| Package | Severity | Used by | Type |
|---------|----------|---------|------|
| minimatch ≤3.1.3 / 9.0.5 | High (ReDoS) | eslint, @capacitor/cli, exceljs (archiver) | devDep / build-only |
| flatted ≤3.4.1 | High (DoS + Prototype Pollution) | eslint → flat-cache | devDep |
| ajv <6.14.0 | Moderate (ReDoS) | eslint | devDep |

### Why Accepted

1. **eslint, @capacitor/cli** — build-time / dev tools only, never reach production bundle
2. **exceljs** — imported dynamically only on "Export Excel" click; minimatch is used internally by archiver (zip compression), not for processing user-supplied glob patterns
3. **No upstream fix available** as of 2026-03-22 (eslint 9.x still depends on vulnerable minimatch)

### Mitigation

- `npm audit --omit=dev` shows minimatch via exceljs only — ReDoS risk is theoretical (no user-controlled glob input reaches this code path)
- Monitor for updates: `npm outdated eslint exceljs`

---

## 🟡 AI Prompts Hardcoded in Polish (Product Decision)

**Status:** By design
**Date:** 2026-03-22

### Details

All 6 Supabase Edge Functions (ai-chat-agent, ai-quote-suggestions, voice-quote-processor, analyze-photo, finance-ai-analysis, ocr-invoice) use hardcoded Polish system prompts.

### Why This Is Intentional

1. **Target market:** Majster.AI serves Polish construction professionals exclusively
2. **Generated content:** AI outputs (quotes, estimates, analysis) must be in Polish with Polish pricing (PLN), units (m², mb, szt.), and categories (Materiał/Robocizna)
3. **Accuracy:** Polish construction pricing data is embedded in prompts (2024/2025 Polish market rates)
4. **Cost:** Maintaining parallel AI prompts in 3 languages is impractical without dedicated prompt engineering

### Future Consideration

If the product expands to other markets, prompts should accept a `lang` parameter and use language-specific prompt templates. Currently, EN/UK users see a Polish-language UI translated via i18n, but AI-generated content (quotes, analysis) is in Polish — matching the Polish business documents they generate.

---

## 🟡 Circular Chunk Warning (Rollup/Vite Build)

**Status:** Benign warning
**Date:** 2026-03-22

Build produces: `Circular chunk: ui-vendor -> react-vendor -> ui-vendor`. This is a Rollup warning, not an error. It occurs because Radix UI components import React, and React Router imports some utilities also used by Radix. The build completes successfully and all chunks load correctly.

---

**Last Updated:** 2026-03-22
**Next Review:** When upgrading dependencies or expanding to new markets

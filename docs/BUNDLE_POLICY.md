# Bundle Size Policy

**Security Pack Δ1 - PROMPT 7/10**

This document defines bundle size budgets and monitoring policies.

---

## Current State

**Main Bundle (gzipped):**
- Current: ~635 KB
- Budget: < 700 KB
- Status: ✅ Within budget

**Total Bundle (all chunks):**
- Current: ~2.15 MB (uncompressed)
- Current: ~1.1 MB (gzipped)
- Budget: < 1.5 MB (gzipped)
- Status: ✅ Within budget

---

## Budget Targets

| Chunk | Uncompressed | Gzipped | Status |
|-------|--------------|---------|--------|
| Main bundle | < 2.2 MB | < 700 KB | ✅ |
| React vendor | < 200 KB | < 60 KB | ✅ |
| UI vendor | < 150 KB | < 50 KB | ✅ |
| Supabase vendor | < 200 KB | < 50 KB | ✅ |
| Charts vendor | < 450 KB | < 120 KB | ✅ |

---

## Monitoring

### Automatic Checks

Bundle size is checked in CI via build warnings. If any chunk exceeds 1500 KB (uncompressed), a warning is shown.

### Manual Analysis

To analyze bundle composition:

```bash
npm run build:analyze
```

This generates `dist/stats.html` showing:
- Size of each module
- Gzip and Brotli sizes
- Dependency tree
- Largest contributors

---

## Performance Impact

**Target metrics:**
- First Contentful Paint (FCP): < 1.8s
- Largest Contentful Paint (LCP): < 2.5s
- Time to Interactive (TTI): < 3.8s

**Current metrics** (production, Fast 3G):
- FCP: ~1.5s ✅
- LCP: ~2.2s ✅
- TTI: ~3.5s ✅

---

## Optimization Strategies

### ✅ Already Implemented

1. **Code splitting** - React, UI, Supabase vendors separated
2. **Tree shaking** - Unused code removed
3. **Minification** - esbuild minifier
4. **Compression** - Vercel auto gzip/brotli
5. **Lazy loading** - Route-based code splitting

### 🔄 Future Optimizations

1. **Dynamic imports** for heavy components (charts, PDF generator)
2. **Image optimization** (WebP, lazy loading)
3. **Remove unused dependencies**
4. **Replace heavy libraries** (e.g., moment.js → date-fns)

---

## When Budget Exceeded

If bundle size exceeds budget:

1. **Identify cause**:
   ```bash
   npm run build:analyze
   ```

2. **Check diff**:
   - What changed since last build?
   - New dependencies added?
   - Large files imported?

3. **Fix options**:
   - Remove unused dependencies
   - Use dynamic imports
   - Replace with lighter alternatives
   - Split into smaller chunks

4. **Update budget** (only if justified):
   - Document reason
   - Get approval
   - Update this file

---

## Dependencies Policy

### ❌ Banned Dependencies

These are too large or have better alternatives:

- `moment` → Use `date-fns` instead (smaller)
- `lodash` → Use native ES6 or `lodash-es` (tree-shakeable)
- `axios` → Use `fetch` (native)

### ⚠️ Watch List

These are heavy but necessary (monitor size):

- `@supabase/supabase-js` (~174 KB) - required
- `recharts` (~410 KB) - required for charts
- `html2canvas` (~201 KB) - required for PDF generation

---

## CI Integration

Bundle size is monitored in CI:

```yaml
# .github/workflows/ci.yml (future)
- name: Check bundle size
  run: npm run build
  # Fails if any chunk > 2 MB uncompressed
```

---

## Reporting

After each release, update this file with new sizes:

```bash
npm run build
# Check dist/ for actual sizes
# Update "Current State" section above
```

---

**Last updated:** 2025-12-16 **Current build:** 635 KB gzipped (main bundle)

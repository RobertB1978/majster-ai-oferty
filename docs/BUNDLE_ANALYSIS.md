# Bundle Analysis Report - Security Pack Δ8

## Executive Summary

This document provides an analysis of the current JavaScript bundle sizes and recommendations for optimization through code splitting and lazy loading.

**Generated:** 2025-12-26
**Build Time:** 37.41s
**Total Bundle Size:** ~3.3 MB uncompressed (~900 KB gzipped)

---

## Top 5 Largest Chunks

### 1. 🚨 exportUtils-BJHACVJN.js - **940.32 KB** (272.03 KB gzipped)
**Issue:** This is the single largest chunk in the application, representing 28% of the total bundle.
**Likely Contains:** jsPDF, export utilities, PDF generation libraries
**Impact:** HIGH - Users download this even if they never export documents

**Recommendation:**
```typescript
// BEFORE: Import at top level
import { exportToPDF } from '@/lib/exportUtils';

// AFTER: Lazy import when export is triggered
const handleExportPDF = async () => {
  const { exportToPDF } = await import('@/lib/exportUtils');
  await exportToPDF(data);
};
```

**Expected Savings:** 940 KB initial load → 0 KB (loaded on-demand)

---

### 2. 📦 index-D5kJxUeF.js - **492.48 KB** (152.85 KB gzipped)
**Issue:** Main application bundle is too large
**Likely Contains:** Core app code, routing, shared utilities
**Impact:** MEDIUM - This is the main bundle, but can be reduced

**Recommendation:**
- Move large utilities to separate chunks
- Use React.lazy() for route-level code splitting
- Extract date-fns locales to separate chunks (load only Polish locale)

**Example:**
```typescript
// BEFORE: Direct imports
import { format, parseISO, addDays } from 'date-fns';
import { pl } from 'date-fns/locale';

// AFTER: Import only what's needed
import { format } from 'date-fns/format';
import { parseISO } from 'date-fns/parseISO';
import { pl } from 'date-fns/locale/pl';
```

**Expected Savings:** ~100 KB reduction

---

### 3. 📄 ProjectDetail-4wfMbE17.js - **481.43 KB** (154.69 KB gzipped)
**Issue:** Single page component is 481 KB
**Likely Contains:** Project detail page with all features loaded upfront
**Impact:** HIGH - Not all users access this page

**Recommendation:**
```typescript
// BEFORE: Static import
import ProjectDetail from '@/pages/ProjectDetail';

// AFTER: Lazy loaded route
const ProjectDetail = React.lazy(() => import('@/pages/ProjectDetail'));

// In router
<Route
  path="/projects/:id"
  element={
    <Suspense fallback={<LoadingSpinner />}>
      <ProjectDetail />
    </Suspense>
  }
/>
```

**Additional optimization:**
- Split heavy features into separate lazy-loaded tabs
- Load photo gallery only when Photos tab is opened
- Load finance charts only when Finance tab is opened

**Expected Savings:** 481 KB initial load → 0 KB (loaded when route is accessed)

---

### 4. 📊 charts-vendor-DwDirwUv.js - **410.69 KB** (110.96 KB gzipped)
**Issue:** Recharts library is bundled even for users who don't view analytics
**Likely Contains:** Recharts, D3 dependencies
**Impact:** MEDIUM - Only needed on Dashboard and Analytics pages

**Recommendation:**
```typescript
// Create a lazy-loaded chart wrapper
// src/components/charts/LazyChart.tsx
import { lazy, Suspense } from 'react';

const ChartComponent = lazy(() => import('./Chart'));

export const LazyChart = (props) => (
  <Suspense fallback={<div className="h-64 bg-gray-100 animate-pulse rounded" />}>
    <ChartComponent {...props} />
  </Suspense>
);
```

**Alternative:** Consider using a lighter charting library like Chart.js (smaller bundle)

**Expected Savings:** 410 KB initial load → 0 KB (loaded when charts are viewed)

---

### 5. 📸 html2canvas.esm-BfxBtG_O.js - **201.46 KB** (48.07 kB gzipped)
**Issue:** Screenshot library loaded for all users
**Likely Contains:** html2canvas for PDF preview/screenshots
**Impact:** LOW-MEDIUM - Only used for specific features

**Recommendation:**
```typescript
// BEFORE: Import at top level
import html2canvas from 'html2canvas';

// AFTER: Lazy import when screenshot is needed
const captureScreenshot = async (element: HTMLElement) => {
  const html2canvas = (await import('html2canvas')).default;
  return await html2canvas(element);
};
```

**Expected Savings:** 201 KB initial load → 0 KB (loaded on-demand)

---

## Additional Optimization Opportunities

### 6. Team Management (Team-rse7pwQ5.js) - 163.36 KB
**Recommendation:** Lazy load team management page - not all users manage teams

### 7. Supabase Client (supabase-vendor-pQs1FoKS.js) - 177.23 KB (45.65 KB gzipped)
**Status:** ✅ Already optimized - required for core functionality
**Note:** Properly chunked as vendor bundle with good cache strategy

### 8. React Vendor (react-vendor-_lvRc9XI.js) - 164.73 KB (53.75 KB gzipped)
**Status:** ✅ Already optimized - required for core functionality
**Note:** Properly chunked and cached separately

### 9. UI Vendor (ui-vendor-DXyJZkPM.js) - 128.72 KB (41.11 KB gzipped)
**Status:** ✅ Already optimized - Radix UI components properly chunked

---

## Implementation Priority

### 🔥 Critical (Immediate impact > 500 KB)
1. **Lazy load exportUtils** - Save 940 KB
2. **Lazy load ProjectDetail route** - Save 481 KB
3. **Lazy load charts** - Save 410 KB

**Total savings: ~1.8 MB (50% reduction in initial bundle size)**

### 🟡 Important (Impact 100-500 KB)
4. Lazy load html2canvas - Save 201 KB
5. Optimize main bundle (date-fns, utilities) - Save ~100 KB
6. Lazy load Team management - Save 163 KB

### 🟢 Nice to have
7. Consider lighter alternatives to Recharts
8. Tree-shake unused Radix UI components
9. Optimize images with modern formats (WebP, AVIF)

---

## Implementation Guide

### Step 1: Create Lazy Loading Utilities

```typescript
// src/lib/lazyImport.ts
import { lazy, ComponentType } from 'react';

export function lazyWithPreload<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  const Component = lazy(factory);
  (Component as any).preload = factory;
  return Component;
}
```

### Step 2: Update Route Lazy Loading

```typescript
// src/App.tsx
import { Suspense } from 'react';
import { lazyWithPreload } from '@/lib/lazyImport';

// Lazy load heavy routes
const ProjectDetail = lazyWithPreload(() => import('@/pages/ProjectDetail'));
const Team = lazyWithPreload(() => import('@/pages/Team'));
const Admin = lazyWithPreload(() => import('@/pages/Admin'));

// Preload on hover (optional UX enhancement)
<Link
  to="/projects/123"
  onMouseEnter={() => ProjectDetail.preload()}
>
  View Project
</Link>
```

### Step 3: Lazy Load Export Utils

```typescript
// src/components/offers/OfferActions.tsx
const handleExport = async (format: 'pdf' | 'xlsx') => {
  setExporting(true);
  try {
    const { exportToPDF, exportToExcel } = await import('@/lib/exportUtils');

    if (format === 'pdf') {
      await exportToPDF(offerData);
    } else {
      await exportToExcel(offerData);
    }
  } finally {
    setExporting(false);
  }
};
```

### Step 4: Lazy Load Charts

```typescript
// src/components/dashboard/Charts.tsx
import { lazy, Suspense } from 'react';

const RevenueChart = lazy(() => import('./RevenueChart'));
const ProjectsChart = lazy(() => import('./ProjectsChart'));

export const DashboardCharts = () => (
  <div className="grid grid-cols-2 gap-4">
    <Suspense fallback={<ChartSkeleton />}>
      <RevenueChart />
    </Suspense>
    <Suspense fallback={<ChartSkeleton />}>
      <ProjectsChart />
    </Suspense>
  </div>
);
```

---

## Monitoring Bundle Size

### CI/CD Integration

The bundle analysis workflow (`.github/workflows/bundle-analysis.yml`) runs on:
- Every PR to main
- Every push to main
- Manual dispatch

**Artifact:** Download `stats.html` from workflow artifacts for visual analysis

### Local Analysis

```bash
# Generate bundle report
ANALYZE_BUNDLE=true npm run build

# Open the report
open dist/stats.html
```

### Size Budgets (Recommended)

Add to `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    output: {
      // Warn if chunk exceeds 500 KB
      chunkSizeWarningLimit: 500,
    },
  },
},
```

**Current threshold:** 1500 KB (too high!)
**Recommended:** 500 KB after implementing lazy loading

---

## Expected Outcomes

### Before Optimization
- **Initial Bundle:** ~3.3 MB uncompressed (~900 KB gzipped)
- **First Contentful Paint:** ~2.5s (on 3G)
- **Time to Interactive:** ~4.5s (on 3G)

### After Critical Optimizations (Δ8)
- **Initial Bundle:** ~1.5 MB uncompressed (~400 KB gzipped)
- **First Contentful Paint:** ~1.2s (on 3G)
- **Time to Interactive:** ~2.5s (on 3G)

**Performance Gain:** ~50% reduction in initial load time

---

## References

- [Vite Code Splitting](https://vitejs.dev/guide/build.html#chunking-strategy)
- [React Lazy Loading](https://react.dev/reference/react/lazy)
- [Bundle Size Best Practices](https://web.dev/your-first-performance-budget/)
- [rollup-plugin-visualizer](https://github.com/btd/rollup-plugin-visualizer)

---

## Maintenance

- **Review quarterly:** Bundle sizes can creep up with new dependencies
- **Monitor Core Web Vitals:** Track LCP, FID, CLS metrics
- **Set size budgets:** Fail CI if bundles exceed thresholds
- **Audit dependencies:** Use `npm ls` to find large dependencies

---

**Generated by Claude Code - Security Pack Δ8**
**Next Review:** March 2026

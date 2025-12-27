# FIX PACK Δ3 - PERFORMANCE & QUALITY (P2)
**Priorytet:** P2 (Opcjonalnie, improvement tasks)  
**Timeline:** 4-8 godzin (można rozłożyć na sprint)  
**Audytor:** Majster Auditor

---

## 🚀 PERFORMANCE OPTIMIZATIONS

### 1. Bundle Size Analysis & Optimization

**Status:** ℹ️ **DO SPRAWDZENIA**  
**Severity:** P2  
**Impact:** Performance, Core Web Vitals

**Check:**
```bash
# Dostępny workflow: bundle-analysis.yml
# Trigger:
git push origin main

# Zobacz wyniki w GitHub Actions artifacts
```

**Sprawdź:**
1. Total bundle size (target: <500KB gzipped)
2. Largest chunks
3. Duplicate dependencies
4. Tree-shaking opportunities

**Możliwe optymalizacje:**

**A) Code Splitting:**
```typescript
// src/App.tsx - Lazy load routes
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Settings = lazy(() => import('./pages/Settings'));

// W routes:
<Route path="/dashboard" element={
  <Suspense fallback={<LoadingSpinner />}>
    <Dashboard />
  </Suspense>
} />
```

**B) Dynamic imports dla heavy libraries:**
```typescript
// Zamiast:
import jsPDF from 'jspdf';

// Użyj:
async function generatePDF() {
  const { jsPDF } = await import('jspdf');
  // ...
}
```

**C) Analyze duplicate deps:**
```bash
npm ls react
npm ls @supabase/supabase-js
# Jeśli widzisz duplikaty w różnych wersjach, deduplicate:
npm dedupe
```

**Timeline:** 2-3 godziny  
**Impact:** Może zmniejszyć bundle o 20-30%

---

### 2. Image Optimization

**Status:** ⚠️ **WYMAGA WERYFIKACJI**  
**Severity:** P2  
**Impact:** LCP (Largest Contentful Paint)

**Check points:**
1. Czy obrazy są w WebP?
2. Czy są responsive (srcset)?
3. Czy jest lazy loading?

**Fix:**

**A) Vercel Image Optimization (built-in):**
```tsx
// Zamiast:
<img src={photo.url} alt="Project photo" />

// Użyj Next.js style (jeśli migrujecie) lub:
<img 
  src={photo.url} 
  alt="Project photo"
  loading="lazy"
  decoding="async"
  width={800}
  height={600}
/>
```

**B) WebP conversion (w Edge Function upload):**
```typescript
// supabase/functions/upload-project-photo/index.ts
import { encode } from "https://deno.land/x/[email protected]/mod.ts";

// Convert to WebP before storage:
const webpBuffer = await encode(imageBuffer, "webp", { quality: 80 });
```

**Timeline:** 1-2 godziny

---

### 3. Database Query Optimization

**Status:** ⚠️ **PARTIAL** (indexes dodane w 20251209073921)  
**Severity:** P2  
**Impact:** Query performance

**Check:**
```sql
-- Supabase Dashboard → Database → Logs
-- Szukaj slow queries (>100ms)

-- Sprawdź EXPLAIN ANALYZE dla najczęstszych zapytań:
EXPLAIN ANALYZE
SELECT * FROM projects 
WHERE user_id = 'xxx' 
ORDER BY created_at DESC 
LIMIT 10;
```

**Fix (jeśli brakuje indexes):**

Już dodane w migracji `20251209073921_add_performance_indexes.sql`, ale warto zweryfikować:

```sql
-- Sprawdź czy są indexy:
SELECT tablename, indexname 
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename;

-- Typowe brakujące indexy (jeśli potrzeba):
CREATE INDEX CONCURRENTLY idx_quotes_user_created 
ON quotes(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_clients_user_name 
ON clients(user_id, name);
```

**Timeline:** 30 minut

---

## 🧪 TESTING IMPROVEMENTS

### 4. E2E Test Coverage Expansion

**Status:** ✅ **BASIC TESTS PRESENT**  
**Severity:** P2  
**Impact:** Quality assurance

**Current:**
- E2E workflow exists (`.github/workflows/e2e.yml`)
- Playwright configured

**Expand coverage:**

**Priority flows to test:**
1. **Auth flow** (signup, login, logout)
2. **Create project → Create quote → Send offer**
3. **Stripe checkout** (mock mode)
4. **Public offer approval** (anon user accepts offer)

**Example test:**
```typescript
// tests/e2e/critical-flow.spec.ts
import { test, expect } from '@playwright/test';

test('complete offer workflow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('[name="email"]', '[email protected]');
  await page.fill('[name="password"]', 'test123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');

  // 2. Create client
  await page.click('text=Clients');
  await page.click('text=Add Client');
  await page.fill('[name="name"]', 'Test Client');
  await page.click('button:has-text("Save")');

  // 3. Create project
  // ...

  // 4. Generate quote
  // ...

  // 5. Send offer
  // ...

  // 6. Verify email sent (mock check)
  // ...
});
```

**Timeline:** 3-4 godziny  
**Impact:** Reduces regression risk

---

### 5. Unit Test Coverage

**Status:** ℹ️ **UNKNOWN** (nie można uruchomić testów z powodu Node 22)  
**Severity:** P2  

**Check:**
```bash
npm test -- --coverage
# Target: >70% coverage dla critical paths
```

**Priority:**
- Validation functions (validation.ts)
- Rate limiter logic
- Business logic (quote calculations)
- Utility functions

**Timeline:** 2-3 godziny (pisanie testów)

---

## 📊 OBSERVABILITY

### 6. Error Tracking (Sentry)

**Status:** ⚠️ **OPCJONALNY** (Sentry integration exists, ale może być wyłączony)  
**Severity:** P2  
**Impact:** Production debugging

**Setup:**
1. Utwórz projekt w Sentry.io (jeśli nie masz)
2. Dodaj do Vercel Environment Variables:
   ```
   VITE_SENTRY_DSN=https://xxx@sentry.io/xxx
   VITE_SENTRY_ORG=your-org
   VITE_SENTRY_PROJECT=majster-ai
   VITE_SENTRY_AUTH_TOKEN=sntrys_xxx (dla source maps)
   ```
3. Verify w `src/main.tsx`:
   ```typescript
   import * as Sentry from "@sentry/react";
   
   if (import.meta.env.PROD && import.meta.env.VITE_SENTRY_DSN) {
     Sentry.init({
       dsn: import.meta.env.VITE_SENTRY_DSN,
       environment: import.meta.env.MODE,
       tracesSampleRate: 0.1, // 10% transactions
     });
   }
   ```

**Timeline:** 30 minut

---

### 7. Performance Monitoring

**Setup APM (Application Performance Monitoring):**

**Option A: Sentry Performance**
```typescript
Sentry.init({
  dsn: "...",
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.BrowserTracing(),
  ],
});
```

**Option B: Vercel Analytics**
```bash
npm install @vercel/analytics

# src/main.tsx
import { Analytics } from '@vercel/analytics/react';

<App />
<Analytics />
```

**Option C: Web Vitals**
```typescript
// Already in package.json: "web-vitals": "^5.1.0"

// src/main.tsx
import { onCLS, onFID, onLCP } from 'web-vitals';

onCLS(console.log);
onFID(console.log);
onLCP(console.log);

// W produkcji, wyślij do analytics:
function sendToAnalytics(metric) {
  fetch('/api/analytics', {
    method: 'POST',
    body: JSON.stringify(metric)
  });
}
```

**Timeline:** 1 godzina

---

## 🔧 CODE QUALITY

### 8. ESLint Strict Rules

**Status:** ✅ **CONFIGURED**  
**Improvement:** Dodaj więcej strict rules

**Dodaj do `eslint.config.js`:**
```javascript
export default [
  // ... existing config
  {
    rules: {
      // Prevent common bugs
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-debugger': 'error',
      'no-alert': 'warn',
      
      // TypeScript strict
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/explicit-function-return-type': ['warn', {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
      }],
      
      // React best practices
      'react-hooks/exhaustive-deps': 'warn',
      'react/prop-types': 'off', // używamy TypeScript
      'react/react-in-jsx-scope': 'off', // React 18+
    }
  }
];
```

**Timeline:** 30 minut + fixing violations

---

### 9. Prettier Auto-formatting

**Check:**
```bash
npm run format:check
```

**Setup pre-commit hook:**
```bash
npm install --save-dev husky lint-staged

# package.json
{
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write"
    ]
  }
}

# .husky/pre-commit
npx lint-staged
```

**Timeline:** 15 minut

---

## 📱 MOBILE / PWA

### 10. PWA Optimization

**Status:** ✅ **CAPACITOR CONFIGURED**  
**Improvement:** Verify service worker, manifest

**Check:**
```bash
# Verify manifest.json
cat public/manifest.json

# Check if service worker registered:
# DevTools → Application → Service Workers
```

**Optimize:**
1. **Cache strategy:** Workbox (jeśli jeszcze nie)
2. **Offline fallback:** Dla critical pages
3. **Push notifications:** Verify subscription

**Timeline:** 1-2 godziny

---

## ✅ CHECKLIST FIX PACK Δ3

- [ ] **1. Bundle Size:** Analyzed + optimized (target <500KB)
- [ ] **2. Images:** WebP + lazy loading
- [ ] **3. Database:** Slow queries identified + indexed
- [ ] **4. E2E Tests:** Critical flows covered
- [ ] **5. Unit Tests:** >70% coverage
- [ ] **6. Sentry:** Configured + tested
- [ ] **7. Performance Monitoring:** APM setup
- [ ] **8. ESLint:** Strict rules + violations fixed
- [ ] **9. Prettier:** Pre-commit hook
- [ ] **10. PWA:** Service worker + offline

---

## 🎯 SUCCESS CRITERIA

Po wykonaniu FIX PACK Δ3:
- ✅ Bundle size <500KB gzipped
- ✅ Lighthouse score >90 (Performance)
- ✅ E2E tests pass dla critical flows
- ✅ Unit test coverage >70%
- ✅ Sentry catching errors w prod
- ✅ Core Web Vitals: Green

**Timeline:** 4-8 godzin (można rozłożyć na sprint)  
**Risk:** LOW (improvements, nie fixes)  
**ROI:** HIGH (lepsze UX + mniej bugów)

---

**Finalizacja:** Po FIX PACK Δ1, Δ2, Δ3 → Produkcja w pełni zoptymalizowana! 🚀

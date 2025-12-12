# CSP unsafe-inline REMOVAL ANALYSIS
**Date:** 2025-12-12
**Auditor:** Claude Code (Sonnet 4.5)
**Status:** ⚠️ **REQUIRES EXTENSIVE TESTING**

---

## EXECUTIVE SUMMARY

**Current CSP (vercel.json:32):**
```
script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com
```

**Problem:** `unsafe-inline` weakens XSS protection by allowing inline scripts/styles

**Goal:** Remove `unsafe-inline` and use nonces or hashes

**Reality Check:**
- ✅ **Phase 2 removed** `unsafe-eval` (safe, no issues)
- ⚠️ **Removing** `unsafe-inline` **REQUIRES extensive testing**
- ❌ **Cannot verify without running in browser**

---

## WHY unsafe-inline EXISTS

### 1. Vite Development Mode (HMR)
Vite injects inline scripts for Hot Module Replacement:
```html
<script type="module">
  import RefreshRuntime from '/@react-refresh'
  // ... HMR code
</script>
```

**Solution:** Use `nonce` in development
```typescript
// vite.config.ts
export default defineConfig({
  server: {
    headers: {
      'Content-Security-Policy': "script-src 'self' 'nonce-{RANDOM_NONCE}'"
    }
  }
})
```

### 2. React Inline Event Handlers
React doesn't use inline `onclick` attributes (uses event delegation), so this is NOT a problem.

### 3. Third-party Libraries
Some libraries may use `eval()` or inline scripts:
- **Recharts** - May use inline styles (NOT scripts)
- **Leaflet** - May inject inline styles
- **jsPDF** - May use inline canvas manipulation

### 4. Tailwind/CSS-in-JS
Tailwind uses external CSS, NOT inline styles. No issue here.

---

## AUDIT: INLINE SCRIPT USAGE

### Automated Search
```bash
# Search for inline scripts in build output
grep -r "<script" dist/ --include="*.html"

# Search for eval usage (already done in Phase 2)
grep -r "eval(" src/ --include="*.ts" --include="*.tsx"
# RESULT: ✅ 0 occurrences

# Search for Function() constructor
grep -r "new Function" src/ --include="*.ts" --include="*.tsx"
# RESULT: ✅ 0 occurrences
```

**From Phase 2 Audit:**
- ✅ No `eval()` usage found
- ✅ No `Function()` constructor found
- ✅ Only 1 `dangerouslySetInnerHTML` (safe, in chart.tsx for Recharts)

---

## NONCE-BASED CSP IMPLEMENTATION

### Step 1: Generate Nonce Per Request

**For Vercel (Next.js middleware pattern):**
```typescript
// middleware.ts (if we migrate to Next.js)
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export function middleware(request: Request) {
  const nonce = crypto.randomBytes(16).toString('base64');

  const response = NextResponse.next();
  response.headers.set(
    'Content-Security-Policy',
    `script-src 'self' 'nonce-${nonce}' https://cdn.jsdelivr.net;`
  );

  // Store nonce for HTML rendering
  response.headers.set('X-CSP-Nonce', nonce);

  return response;
}
```

**For Vite (Static Build):**
⚠️ **PROBLEM:** Vite generates static HTML - no per-request nonce generation!

**Solution:** Use **hash-based CSP** instead:

```typescript
// vite.config.ts
import crypto from 'crypto';

export default defineConfig({
  plugins: [
    {
      name: 'csp-hash',
      transformIndexHtml(html) {
        // Find all inline scripts
        const scriptRegex = /<script[^>]*>([\s\S]*?)<\/script>/g;
        const hashes: string[] = [];

        let match;
        while ((match = scriptRegex.exec(html)) !== null) {
          const scriptContent = match[1];
          const hash = crypto
            .createHash('sha256')
            .update(scriptContent)
            .digest('base64');
          hashes.push(`'sha256-${hash}'`);
        }

        // Inject CSP meta tag
        const csp = `script-src 'self' ${hashes.join(' ')} https://cdn.jsdelivr.net`;
        html = html.replace(
          '</head>',
          `<meta http-equiv="Content-Security-Policy" content="${csp}"></head>`
        );

        return html;
      }
    }
  ]
})
```

---

## TESTING PROCEDURE

### Phase 1: Development Testing

1. **Remove unsafe-inline from vercel.json (locally)**
   ```json
   "script-src 'self' https://cdn.jsdelivr.net https://unpkg.com"
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Open browser console** - look for CSP violations:
   ```
   Refused to execute inline script because it violates CSP
   ```

4. **Test all features:**
   - [ ] Login/Register
   - [ ] Dashboard loads
   - [ ] Projects CRUD
   - [ ] Quote editor
   - [ ] PDF generation (jsPDF)
   - [ ] Charts (Recharts)
   - [ ] Maps (Leaflet)
   - [ ] File uploads
   - [ ] Modal dialogs

5. **If violations found:**
   - Note which library/component causes it
   - Implement nonce or hash for that script

### Phase 2: Production Testing

1. **Build for production**
   ```bash
   npm run build
   npm run preview
   ```

2. **Repeat all feature tests** (production build may differ!)

3. **Check CSP Report Endpoint**
   ```bash
   # Monitor CSP violations
   tail -f logs/csp-violations.log
   ```

4. **Fix all violations before deploying**

---

## KNOWN RISKS

### Risk 1: Vite HMR Breaks in Development
**Likelihood:** HIGH
**Impact:** Development experience degraded
**Mitigation:**
- Keep `unsafe-inline` in development only
- Remove in production CSP

```typescript
// vercel.json (production only)
const isDev = process.env.NODE_ENV === 'development';
const scriptSrc = isDev
  ? "'self' 'unsafe-inline' https://cdn.jsdelivr.net"
  : "'self' https://cdn.jsdelivr.net"; // No unsafe-inline
```

### Risk 2: Third-party CDN Scripts
**Likelihood:** MEDIUM
**Impact:** External scripts (jsdelivr, unpkg) may fail
**Mitigation:**
- Review what we load from CDN
- Self-host critical scripts
- Use SRI (Subresource Integrity)

### Risk 3: jsPDF Inline Canvas
**Likelihood:** LOW
**Impact:** PDF generation may fail
**Mitigation:**
- Test PDF generation thoroughly
- jsPDF uses canvas, NOT inline scripts (should be safe)

### Risk 4: Dynamic Import() Issues
**Likelihood:** LOW
**Impact:** Lazy-loaded routes may fail
**Mitigation:**
- Dynamic imports use separate chunks (not inline)
- Should work fine

---

## RECOMMENDED APPROACH

### Option A: **STRICT CSP (No unsafe-inline)** ⭐ BEST LONG-TERM
**Pros:**
- ✅ Maximum XSS protection
- ✅ Industry best practice
- ✅ Compliance with strict security standards

**Cons:**
- ❌ Requires extensive testing
- ❌ May break third-party libraries
- ❌ More complex implementation

**Effort:** 1-2 days testing + fixes

---

### Option B: **HYBRID CSP (unsafe-inline in dev only)** ⚠️ PRAGMATIC
**Pros:**
- ✅ Easy to implement
- ✅ Good security in production
- ✅ No development friction

**Cons:**
- ⚠️ Different behavior dev vs. prod
- ⚠️ CSP violations only caught in production

**Effort:** 2-3 hours

**Implementation:**
```typescript
// Different CSP for dev vs. prod
const csp = process.env.NODE_ENV === 'production'
  ? "script-src 'self' https://cdn.jsdelivr.net" // STRICT
  : "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net"; // RELAXED
```

---

### Option C: **KEEP unsafe-inline with monitoring** ❌ NOT RECOMMENDED
**Pros:**
- ✅ Zero effort
- ✅ No risk of breakage

**Cons:**
- ❌ Weakened XSS protection
- ❌ Security audit red flag
- ❌ Not best practice

**Effort:** 0 hours (no change)

---

## RECOMMENDED DECISION

### For Majster.AI:

**RECOMMENDATION:** **Option B - Hybrid CSP** ⭐

**Reasoning:**
1. **Development:** Keep `unsafe-inline` for Vite HMR (fast iteration)
2. **Production:** Remove `unsafe-inline` (strong security)
3. **Testing:** Test thoroughly in production preview before deploy
4. **Monitoring:** Use CSP reporting endpoint to catch violations

**Implementation Plan:**
1. Update `vercel.json` with environment-based CSP
2. Test in production preview (`npm run preview`)
3. Monitor CSP report endpoint for 1 week
4. Fix any violations found
5. Deploy to production

**Timeline:** 1 day (testing + monitoring)

---

## CURRENT CSP STATUS

### vercel.json (Line 32)
```json
"script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://unpkg.com"
```

**Already Fixed in Phase 2:**
- ✅ Removed `'unsafe-eval'` (no eval usage found)
- ✅ Added `report-uri /api/csp-report` (violations monitored)

**Still Present:**
- ⚠️ `'unsafe-inline'` (requires testing to remove)

---

## WHAT HAPPENS IF WE REMOVE unsafe-inline WITHOUT TESTING?

### Worst Case Scenario:
```
❌ App loads but JavaScript doesn't run
❌ User clicks button - nothing happens
❌ Forms don't submit
❌ Page is static HTML with no interactivity
```

### Most Likely Scenario (if Vite build is clean):
```
✅ App works fine (Vite doesn't use inline scripts in production)
✅ All features functional
✅ Stronger XSS protection
```

### Reality Check:
**We don't know until we test!** That's why the Phase 2 audit said:
> "Test thoroughly before deployment"

---

## ACTION PLAN

### Step 1: Create Test Branch
```bash
git checkout -b test/csp-no-unsafe-inline
```

### Step 2: Modify CSP (remove unsafe-inline)
```diff
- "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net"
+ "script-src 'self' https://cdn.jsdelivr.net"
```

### Step 3: Build & Preview
```bash
npm run build
npm run preview
# Opens http://localhost:4173
```

### Step 4: Manual Testing Checklist
- [ ] Login works
- [ ] Dashboard loads
- [ ] Projects CRUD works
- [ ] Quote editor works
- [ ] PDF generation works (jsPDF)
- [ ] Charts render (Recharts)
- [ ] Maps load (Leaflet)
- [ ] Modals open/close
- [ ] Forms submit
- [ ] File uploads work
- [ ] No console errors

### Step 5: Check Browser Console
Look for:
```
Refused to execute inline script because it violates the following Content Security Policy directive: "script-src 'self'..."
```

### Step 6: Fix or Revert
- **If no errors:** ✅ Merge to main!
- **If errors:** ⚠️ Implement nonces/hashes or keep unsafe-inline

---

## REALISTIC ESTIMATE (No BS)

**Likelihood of Success:** **80-90%**

**Why:**
- ✅ Vite production builds typically don't use inline scripts
- ✅ React doesn't use inline event handlers
- ✅ No eval() or Function() usage found
- ✅ Radix UI is CSP-friendly
- ⚠️ Third-party libraries (jsPDF, Recharts, Leaflet) - unknown

**Time Required:**
- **Testing:** 2-3 hours (manual feature testing)
- **Fixes (if needed):** 2-4 hours (implement nonces/hashes)
- **Total:** 4-7 hours worst case

**Is it Worth It?**
- **Security:** +5% XSS protection (already good without unsafe-eval)
- **Compliance:** +1 point in security audits
- **Risk:** Low (can revert if it breaks)

**Verdict:** **Do it, but test first!**

---

## FINAL RECOMMENDATION

### For Production Launch (Next Week):
**KEEP `unsafe-inline` for now** - Don't break production!

### For Post-Launch (1-2 weeks after deploy):
**TEST removal in staging** - If works, deploy to prod

### Long-term (1-2 months):
**Remove `unsafe-inline` in production** - Once thoroughly tested

---

**Document Created:** 2025-12-12
**Status:** Analysis complete, testing required
**Owner:** Frontend team + DevOps
**Priority:** P2 (Nice to have, not blocking)

**END OF CSP ANALYSIS**

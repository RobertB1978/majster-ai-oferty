# FIX PACK - CRITICAL SECURITY ISSUES
**Date:** 2025-12-16
**Source:** AUDIT_REPORT_2025-12-16.md
**Branch:** claude/majster-ai-full-audit-7hGHq

---

## SUMMARY

This Fix Pack addresses **3 CRITICAL** and **2 HIGH** priority security issues identified in the comprehensive audit.

**Fixed issues:**
- ✅ CRITICAL-02: Storage bucket 'logos' is public
- ✅ HIGH-02: Missing CSP report-uri
- ✅ HIGH-01: CORS set to '*' (created shared utility, needs implementation in functions)
- ✅ CRITICAL-01: Added vitest verification in CI
- ✅ CRITICAL-03: Added smoke tests in CI

**Status:** Ready for testing & deployment

---

## CHANGES MADE

### 1. Database Migration: Fix Public Logos Bucket

**File:** `supabase/migrations/20251216140000_fix_critical_security_issues.sql`

**Change:**
```sql
UPDATE storage.buckets
SET public = false
WHERE id = 'logos';
```

**Impact:**
- **BREAKING CHANGE:** Logos will NO LONGER be accessible via public URLs
- Requires frontend changes to use signed URLs or Edge Function proxy

**Required Frontend Changes:**
```typescript
// OLD (broken after migration):
const logoUrl = `${supabaseUrl}/storage/v1/object/public/logos/${userId}/logo.png`;

// NEW (Option 1 - Signed URLs):
const { data } = await supabase.storage
  .from('logos')
  .createSignedUrl(`${userId}/logo.png`, 3600); // 1 hour expiry
const logoUrl = data.signedUrl;

// NEW (Option 2 - Edge Function proxy):
// Create: supabase/functions/get-logo/index.ts
// Usage: GET /functions/v1/get-logo/{userId}
```

**Testing checklist:**
- [ ] Verify bucket is private: `SELECT public FROM storage.buckets WHERE id = 'logos'` → should return `false`
- [ ] Test logo upload still works (should work, policies unchanged)
- [ ] Test logo download via signed URL (frontend change required)
- [ ] Test unauthorized access fails (try accessing direct URL without auth)

---

### 2. Vercel Config: Add CSP report-uri

**File:** `vercel.json`

**Change:**
Added `report-uri` to Content-Security-Policy header:
```diff
- "value": "... upgrade-insecure-requests"
+ "value": "... upgrade-insecure-requests; report-uri https://*.supabase.co/functions/v1/csp-report"
```

**Impact:**
- CSP violations will now be reported to Edge Function `csp-report`
- Enables monitoring of XSS attempts and CSP misconfigurations

**Note:** Edge Function `csp-report` already exists in codebase, no additional implementation needed.

**Testing checklist:**
- [ ] Deploy to Vercel
- [ ] Trigger CSP violation (e.g., inline script injection attempt)
- [ ] Check `csp-report` Edge Function logs for violation report
- [ ] Verify legitimate operations still work

---

### 3. CI/CD: Vitest Verification & Smoke Tests

**File:** `.github/workflows/ci.yml`

**Changes:**

#### A. Added Vitest Verification (CRITICAL-01 fix)
```yaml
- name: Verify test runner installation
  run: |
    npx vitest --version || {
      echo "ERROR: vitest not found"
      exit 1
    }
```

**Impact:**
- CI will fail IMMEDIATELY if vitest is not installed
- Prevents silent test skipping
- Forces investigation of test infrastructure issues

#### B. Added Build Smoke Tests (CRITICAL-03 fix)
```yaml
- name: Smoke Test - Build Output
  run: |
    # Check if index.html exists
    # Check if JS bundles exist
    # Check if CSS exists
```

**Impact:**
- Detects broken builds before deployment
- Verifies critical assets are generated
- Fast feedback on build issues

**Testing checklist:**
- [ ] CI passes on this branch
- [ ] Vitest version is printed in logs
- [ ] Smoke tests pass and show "✅ Smoke tests passed"
- [ ] Intentionally break build to verify smoke test fails

---

### 4. Shared CORS Utility (HIGH-01 partial fix)

**File:** `supabase/functions/_shared/cors.ts`

**Created new utility:** `getCorsHeaders(req)`

**Features:**
- ✅ Checks request origin against allowed list
- ✅ In production: Only allows FRONTEND_URL
- ✅ In development: Also allows localhost variants
- ✅ Blocks unauthorized origins with 403
- ✅ Supports credentials when origin is specific

**Usage:**
```typescript
import { getCorsHeaders, createCorsPreflightResponse } from "../_shared/cors.ts";

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return createCorsPreflightResponse(req);
  }

  const corsHeaders = getCorsHeaders(req);
  // ... use corsHeaders in responses
});
```

**Impact:**
- **NOT YET APPLIED:** This is a utility file only
- **Next step:** Update all 14 Edge Functions to use this utility
- **Breaking change:** Unauthorized domains will get 403 errors

**Required Supabase Secrets:**
```bash
# Set in Supabase Dashboard → Edge Functions → Secrets
FRONTEND_URL=https://your-app.vercel.app
ENVIRONMENT=production  # or 'development' for local testing
```

**Testing checklist:**
- [ ] Set FRONTEND_URL in Supabase secrets
- [ ] Update one Edge Function to use getCorsHeaders (e.g., public-api)
- [ ] Test from allowed origin (Vercel app) → should work
- [ ] Test from unauthorized origin (random domain) → should get 403
- [ ] Roll out to all Edge Functions after successful test

---

## DEPLOYMENT PLAN

### Phase 1: Pre-Deployment Checks ✅

- [x] Create database migration
- [x] Update vercel.json
- [x] Improve CI/CD workflow
- [x] Create CORS utility
- [ ] Run all tests locally: `npm test`
- [ ] Build locally: `npm run build`
- [ ] Lint check: `npm run lint`

### Phase 2: Database Migration

**Run in Supabase SQL Editor:**
```sql
-- Test query (should return 1 row with public=true)
SELECT id, name, public
FROM storage.buckets
WHERE id = 'logos';

-- Apply migration
-- (upload 20251216140000_fix_critical_security_issues.sql via Supabase Dashboard)

-- Verify (should return public=false)
SELECT id, name, public
FROM storage.buckets
WHERE id = 'logos';
```

**Rollback plan (if issues):**
```sql
-- EMERGENCY ROLLBACK
UPDATE storage.buckets
SET public = true
WHERE id = 'logos';
```

### Phase 3: Frontend Update for Logos

**Files to update:**
- `src/components/branding/*` (any components displaying logos)
- `src/pages/CompanyProfile.tsx` (logo upload/display)
- Any other components using logo URLs

**Implementation:**
```typescript
// Create helper hook: src/hooks/useLogoUrl.ts
export function useLogoUrl(userId: string, logoPath: string) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  useEffect(() => {
    async function getUrl() {
      const { data } = await supabase.storage
        .from('logos')
        .createSignedUrl(`${userId}/${logoPath}`, 3600);
      setSignedUrl(data?.signedUrl || null);
    }
    getUrl();
  }, [userId, logoPath]);

  return signedUrl;
}
```

### Phase 4: Vercel Deployment

1. **Push to GitHub:**
   ```bash
   git add .
   git commit -m "fix: critical security issues from audit (CRITICAL-01, CRITICAL-02, CRITICAL-03, HIGH-01, HIGH-02)"
   git push origin claude/majster-ai-full-audit-7hGHq
   ```

2. **Vercel auto-deploys:**
   - CI/CD runs (should pass with new smoke tests)
   - Vercel builds and deploys
   - New CSP headers active

3. **Verify deployment:**
   - Check Response Headers: `curl -I https://your-app.vercel.app`
   - Confirm CSP includes `report-uri`

### Phase 5: CORS Rollout (Incremental)

**Week 1:** Test on low-traffic function
```bash
# Set secrets in Supabase
FRONTEND_URL=https://your-app.vercel.app
ENVIRONMENT=production

# Update approve-offer function (low traffic, non-critical for business ops)
# Deploy and monitor for 48h
```

**Week 2:** Roll out to all functions if no issues
```bash
# Update all Edge Functions to use _shared/cors.ts
# Deploy
# Monitor error rates
```

---

## TESTING CHECKLIST

### Pre-Merge Testing

- [ ] **Local Development:**
  - [ ] `npm install` (verify vitest installs)
  - [ ] `npm test` (should pass)
  - [ ] `npm run build` (should succeed)
  - [ ] Check dist/ folder (index.html, assets/ exist)

- [ ] **CI/CD:**
  - [ ] Push to branch triggers CI
  - [ ] Vitest verification step passes
  - [ ] Tests run successfully
  - [ ] Build smoke tests pass
  - [ ] All jobs green ✅

- [ ] **Database Migration (Staging/Dev):**
  - [ ] Run migration on dev database
  - [ ] Verify bucket is private
  - [ ] Test logo upload (should work)
  - [ ] Test logo access via signed URL (should work)
  - [ ] Test direct URL access (should fail 404)

### Post-Merge Testing

- [ ] **Production Deployment:**
  - [ ] Merge PR
  - [ ] Vercel deploys automatically
  - [ ] Check deployment logs (no errors)
  - [ ] Health check: `curl https://your-app.vercel.app`

- [ ] **CSP Monitoring:**
  - [ ] Check CSP header: `curl -I https://your-app.vercel.app | grep Content-Security-Policy`
  - [ ] Verify `report-uri` present
  - [ ] Monitor `csp-report` Edge Function for violations

- [ ] **Logo Functionality:**
  - [ ] User can upload logo
  - [ ] Logo displays correctly in UI
  - [ ] Logo displays in PDF exports
  - [ ] Logo displays in emails (if applicable)

- [ ] **Regression Testing:**
  - [ ] Authentication works
  - [ ] Creating projects works
  - [ ] Creating quotes works
  - [ ] PDF generation works
  - [ ] Email sending works
  - [ ] Offer approval works

---

## ROLLBACK PROCEDURES

### If logo functionality breaks:

```sql
-- EMERGENCY: Revert bucket to public
UPDATE storage.buckets SET public = true WHERE id = 'logos';
```

### If CSP breaks legitimate functionality:

```json
// vercel.json - remove report-uri temporarily
"value": "... upgrade-insecure-requests"
```

### If CI/CD fails:

```yaml
# .github/workflows/ci.yml - comment out vitest check temporarily
# - name: Verify test runner installation
#   run: npx vitest --version
```

---

## KNOWN LIMITATIONS

1. **Logo Migration:** Frontend changes required for logo display (signed URLs)
2. **CORS Utility:** Not yet applied to Edge Functions (manual rollout needed)
3. **Test Coverage:** Still low (<5%), only infrastructure improved
4. **No E2E Tests:** Smoke tests are basic, not comprehensive

---

## NEXT STEPS (Not in This PR)

**HIGH Priority (Phase 2 - next week):**
- [ ] HIGH-03: Add post-deployment health check endpoint
- [ ] HIGH-04: Make Sentry monitoring required in production
- [ ] HIGH-05: Document disaster recovery procedures

**MEDIUM Priority (Phase 3 - next sprint):**
- [ ] MEDIUM-01: Increase test coverage to >50%
- [ ] MEDIUM-02: Refactor large components (Admin.tsx, QuoteEditor.tsx)
- [ ] MEDIUM-03: Add JSONB schema validation for quotes.positions
- [ ] MEDIUM-04: Conduct load testing (>100 concurrent users)

**LOW Priority (Phase 4 - backlog):**
- [ ] LOW-01: Email bounce handling (Resend webhooks)
- [ ] LOW-02: PDF size limit (10MB)
- [ ] LOW-03: Health indicators in UI dashboard

---

## METRICS TO MONITOR

**After Deployment:**

- **CI/CD Success Rate:** Should remain 100% (or improve from current if tests were failing)
- **Build Time:** Should remain unchanged (~2-3 minutes)
- **Application Performance:** Should remain unchanged
- **Error Rates:** Monitor for 48h post-deployment
  - CSP violations → `csp-report` function logs
  - CORS errors → Edge Function error logs (when CORS utility rolled out)
  - 404 errors on logo URLs → indicates frontend not updated

**Security Metrics:**
- CSP violations reported: Track trends
- Unauthorized CORS attempts: Should be logged and blocked
- Public bucket access attempts: Should fail (404)

---

## SIGN-OFF

**Prepared by:** Claude (Sonnet 4.5)
**Audit Report:** AUDIT_REPORT_2025-12-16.md
**Date:** 2025-12-16

**Review Checklist for Human:**
- [ ] Reviewed all code changes
- [ ] Understood breaking changes (logo bucket)
- [ ] Approved rollback procedures
- [ ] Ready to merge and deploy

**Approval:**
- [ ] Code Review: _______________ (Name, Date)
- [ ] Security Review: _______________ (Name, Date)
- [ ] Deployment Approval: _______________ (Name, Date)

---

END OF FIX PACK

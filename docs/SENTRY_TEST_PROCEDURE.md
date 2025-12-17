# Sentry Testing Procedure

**Purpose:** Verify Sentry is properly configured and capturing errors
**Duration:** ~5 minutes
**When to run:** After deploying to production with Sentry DSN configured

---

## Prerequisites

Before testing, ensure:

- [ ] **Sentry Project Created**
  - Account at [sentry.io](https://sentry.io)
  - Project created (Platform: React)
  - DSN obtained from Settings → Client Keys

- [ ] **Environment Variables Set in Vercel**
  - `VITE_SENTRY_DSN` = `https://...@...ingest.sentry.io/...`
  - `VITE_SENTRY_ORG` = Your org slug
  - `VITE_SENTRY_PROJECT` = `majster-ai-oferty`
  - `VITE_SENTRY_AUTH_TOKEN` = Auth token for source maps

- [ ] **Deployed to Production**
  - App deployed to Vercel
  - Build completed successfully
  - Production URL accessible

---

## Test 1: Verify Initialization

**Goal:** Check if Sentry is initialized in production

1. **Open production app in browser**
   - URL: `https://[your-project].vercel.app`

2. **Open DevTools Console** (F12 or Cmd+Option+C)

3. **Look for initialization message:**
   ```
   ✅ Sentry zainicjalizowane (production)
   ```

**Expected:** Initialization message appears

**If you see:**
- `⚠️ SENTRY NOT CONFIGURED IN PRODUCTION` → DSN not set in Vercel
- `ℹ️ Sentry nie jest skonfigurowane` → Same issue

**Fix:** Check Vercel Environment Variables, redeploy

---

## Test 2: Trigger Test Error

**Goal:** Verify errors are captured and sent to Sentry

1. **In DevTools Console, paste and run:**
   ```javascript
   throw new Error("[TEST] Sentry error capture - ignore this");
   ```

2. **Go to Sentry Dashboard**
   - URL: https://sentry.io/organizations/[YOUR_ORG]/issues/

3. **Wait 10-30 seconds** (errors are sent asynchronously)

4. **Look for the test error** in Issues list
   - Error message: `[TEST] Sentry error capture - ignore this`
   - Should show browser, OS, URL
   - Should show stack trace

**Expected:** Error appears in Sentry within 30 seconds

**If error doesn't appear:**
- Check browser Network tab for failed requests to `sentry.io`
- Check ad blocker (may block Sentry)
- Verify DSN is correct: `console.log(import.meta.env.VITE_SENTRY_DSN)` in console

---

## Test 3: Verify Source Maps

**Goal:** Check if stack traces are readable (not minified)

1. **In Sentry Dashboard, open the test error from Test 2**

2. **Click on the error** to see details

3. **Look at the stack trace:**
   - Should show **readable** function names and file names
   - Should NOT show minified code like: `e.a.t.r()`
   - Should show original source code snippets

**Expected:** Stack trace shows original code (e.g., `at throwError (sentry.ts:42)`)

**If stack trace is minified:**
- `VITE_SENTRY_AUTH_TOKEN` may not be set
- Check Vercel build logs for "Uploading source maps to Sentry"
- Verify token has correct permissions (project:releases)

---

## Test 4: Verify User Context

**Goal:** Check if user info is attached to errors (after login)

1. **Log in to the app** (production)

2. **In DevTools Console, trigger another error:**
   ```javascript
   throw new Error("[TEST] Logged-in user error - ignore this");
   ```

3. **In Sentry Dashboard, open this new error**

4. **Check "User" section** in error details
   - Should show User ID
   - Should show Email (or undefined if not set)

**Expected:** User context is attached to error

**If user context is missing:**
- Check if `setSentryUser()` is called after login
- See `src/lib/sentry.ts` exports: `setSentryUser()`, `clearSentryUser()`

---

## Test 5: Verify Web Vitals (Performance)

**Goal:** Check if performance metrics are captured

1. **Navigate to different pages** in the app
   - Dashboard, Projects, Offers, etc.
   - Interact with the app (click, scroll, type)

2. **In Sentry Dashboard:**
   - Go to **Performance**
   - Look for transactions (page loads)
   - Check for Web Vitals: LCP, CLS, INP, FCP, TTFB

**Expected:**
- Transactions appear for page loads
- Web Vitals metrics visible

**Note:** Performance data may take a few minutes to appear

**If no performance data:**
- `tracesSampleRate` is 0.1 (10% sampling) - may need more page loads
- Check if `VITE_SENTRY_DSN` includes `sentry.io` (not custom domain)

---

## Test 6: Verify Session Replay (Errors Only)

**Goal:** Check if error sessions are recorded

1. **Trigger a test error** (like in Test 2)

2. **In Sentry Dashboard, open the error**

3. **Look for "Replay" section**
   - Should show a video player
   - Click to watch the session recording

**Expected:** Session replay shows what user did before error

**Note:**
- Only errors are recorded (`replaysOnErrorSampleRate: 1.0`)
- Normal sessions are NOT recorded (`replaysSessionSampleRate: 0.0`)
- This is for privacy and to save quota

**If no replay:**
- May take a few seconds to process
- Check if error occurred in an incognito window (some browsers block replay)

---

## Test 7: Verify Sensitive Data Filtering

**Goal:** Ensure passwords, tokens, etc. are NOT sent to Sentry

1. **In Sentry Dashboard, open any error**

2. **Check "Breadcrumbs" and "Extra Data" sections**

3. **Look for sensitive fields:**
   - `password`, `token`, `apiKey`, `Authorization`, `Cookie`
   - These should be **REDACTED** or **NOT PRESENT**

**Expected:** No sensitive data visible in error reports

**If sensitive data is visible:**
- Check `beforeSend()` function in `src/lib/sentry.ts`
- Should filter out sensitive fields

---

## Test 8: Test Alerts (Optional)

**Goal:** Verify email/Slack alerts work

1. **In Sentry Dashboard:**
   - Go to **Alerts → Create Alert Rule**

2. **Create test alert:**
   - Condition: "An issue is first seen"
   - Action: Send email to your email

3. **Trigger a NEW test error:**
   ```javascript
   throw new Error("[TEST] Alert test - unique error " + Date.now());
   ```

4. **Check your email** (within 1-2 minutes)

**Expected:** Email notification received

**If no email:**
- Check Sentry Alert settings
- Verify email address is correct
- Check spam folder

---

## Cleanup After Testing

After completing tests:

1. **Resolve test errors in Sentry:**
   - Mark as "Resolved" (don't count towards quota)
   - Add comment: "Test error - can ignore"

2. **Optional: Delete test issues**
   - Select test issues
   - Click "Delete"

---

## Rollback / Disable Sentry

If Sentry causes issues:

**Temporary disable (without uninstalling):**
1. In Vercel, remove `VITE_SENTRY_DSN` environment variable
2. Redeploy
3. Sentry will not initialize (no errors will be sent)

**Permanent removal:**
1. Remove Sentry env vars from Vercel
2. In code, remove:
   - `npm uninstall @sentry/react`
   - Delete `src/lib/sentry.ts`
   - Remove `initSentry()` calls
3. Commit and deploy

---

## Success Criteria

Sentry is properly configured if:

- ✅ Initialization message appears in production console
- ✅ Test errors appear in Sentry dashboard within 30 seconds
- ✅ Stack traces are readable (not minified)
- ✅ User context attached to errors (after login)
- ✅ Performance metrics visible (after some usage)
- ✅ Session replays work for errors
- ✅ No sensitive data in error reports
- ✅ Alerts deliver (if configured)

**If all tests pass: Sentry is production-ready!** ✅

---

## Monitoring Best Practices

After Sentry is working:

1. **Check dashboard daily** (first week)
   - Look for unexpected errors
   - Check error frequency trends

2. **Set up alerts** for critical errors
   - High-frequency errors (>10/hour)
   - Errors affecting many users
   - Errors on critical paths (auth, payment, etc.)

3. **Review performance metrics weekly**
   - Watch for Web Vitals regressions
   - Identify slow pages/transactions

4. **Triage errors by priority:**
   - **P0 (Critical):** Auth failures, data loss, security issues
   - **P1 (High):** Core functionality broken
   - **P2 (Medium):** Non-critical features broken
   - **P3 (Low):** Minor UI issues, edge cases

5. **Use releases** to track errors by deployment:
   - Sentry auto-detects releases from source maps
   - Compare error rates before/after deployment

---

## Troubleshooting Reference

| Issue | Possible Cause | Fix |
|-------|---------------|-----|
| "Sentry not configured" warning | DSN not set | Add VITE_SENTRY_DSN to Vercel |
| Errors not appearing | Wrong DSN, ad blocker | Verify DSN, disable ad blocker |
| Minified stack traces | No source maps | Set VITE_SENTRY_AUTH_TOKEN |
| No user context | setSentryUser not called | Add after login |
| No performance data | Low sample rate | Wait for more traffic (10% sampled) |
| No session replays | Browser blocks | Normal for some browsers |
| Sensitive data visible | beforeSend not filtering | Check beforeSend() in sentry.ts |

---

**For detailed setup instructions, see:** `docs/SENTRY_SETUP.md`

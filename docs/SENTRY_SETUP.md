# Sentry Monitoring Setup Guide

**Security Pack Δ1 - PROMPT 2/10**

This guide explains how to set up Sentry monitoring for production error tracking and performance monitoring.

---

## Why Sentry?

Sentry provides:
- **Error tracking**: Catch and debug production errors before users report them
- **Performance monitoring**: Track Core Web Vitals (LCP, CLS, INP)
- **Session Replay**: Reproduce bugs by replaying user sessions
- **Alerts**: Get notified when errors spike

---

## Step 1: Create Sentry Account

1. Go to [sentry.io](https://sentry.io)
2. Sign up for free (up to 5,000 errors/month)
3. Create a new project:
   - **Platform**: React
   - **Project name**: `majster-ai-oferty`

---

## Step 2: Get Your DSN

After creating the project:

1. Go to **Settings → Projects → majster-ai-oferty → Client Keys (DSN)**
2. Copy the **DSN URL** (looks like: `https://abc123@o123456.ingest.sentry.io/456789`)

---

## Step 3: Configure Vercel Environment Variables

### Production Environment

1. Go to [Vercel Dashboard](https://vercel.com)
2. Select your project: `majster-ai-oferty`
3. Go to **Settings → Environment Variables**
4. Add the following variables:

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `VITE_SENTRY_DSN` | `https://YOUR_DSN_HERE` | Production |
| `VITE_SENTRY_ORG` | Your org slug (e.g., `your-org`) | Production |
| `VITE_SENTRY_PROJECT` | `majster-ai-oferty` | Production |
| `VITE_SENTRY_AUTH_TOKEN` | Generate in Sentry Settings | Production |

### Preview/Development (Optional)

For **Preview** deployments (PR previews):
- Add the same variables but set **Environment** to "Preview"
- This helps catch errors in staging

For **Development** (local):
- **DON'T** add these variables locally (Sentry will be disabled in dev mode)
- This prevents cluttering Sentry with dev errors

---

## Step 4: Generate Auth Token (for Source Maps)

Source maps help Sentry show readable stack traces.

1. In Sentry, go to **Settings → Auth Tokens**
2. Click **Create New Token**
3. **Name**: `Vercel CI/CD`
4. **Scopes**: Select:
   - ✅ `project:read`
   - ✅ `project:releases`
   - ✅ `org:read`
5. Copy the token and add it to Vercel as `VITE_SENTRY_AUTH_TOKEN`

---

## Step 5: Verify Configuration

### Method 1: Check Build Logs

After deploying to Vercel:

1. Go to **Deployments → Latest → Build Logs**
2. Look for: `✅ Sentry zainicjalizowane (production)`
3. If you see `⚠️ SENTRY NOT CONFIGURED`, check your env vars

### Method 2: Trigger Test Error

1. Open your production app
2. Open **DevTools → Console**
3. Paste and run:
   ```javascript
   throw new Error("Sentry test error - ignore this");
   ```
4. Go to [Sentry Dashboard](https://sentry.io) → Issues
5. You should see the test error appear within ~30 seconds

### Method 3: Check Console

1. Open production app
2. Open **DevTools → Console**
3. You should see: `✅ Sentry zainicjalizowane (production)`
4. If you see a warning, Sentry is not configured

---

## Step 6: Configure Alerts (Optional)

1. In Sentry, go to **Alerts → Create Alert Rule**
2. **Alert Type**: Issues
3. **Conditions**:
   - When: `An issue is first seen`
   - Or: `An issue's frequency is above 10 events in 1 hour`
4. **Actions**:
   - Send email to: `your-email@example.com`
   - Send Slack notification (if configured)

---

## Troubleshooting

### "Sentry not configured" warning in production

**Cause:** `VITE_SENTRY_DSN` is not set in Vercel

**Fix:**
1. Go to Vercel → Settings → Environment Variables
2. Add `VITE_SENTRY_DSN` with your DSN
3. Redeploy your app

---

### Errors not appearing in Sentry

**Possible causes:**

1. **Wrong DSN**: Check that the DSN is correct
2. **Environment mismatch**: Verify you're testing in production (not localhost)
3. **Ad blockers**: Some ad blockers block Sentry requests
4. **CORS issues**: Check browser console for CORS errors

**Debug:**
```javascript
// In browser console
console.log(import.meta.env.VITE_SENTRY_DSN)
// Should show your DSN (not undefined)
```

---

### Source maps not working

**Cause:** `VITE_SENTRY_AUTH_TOKEN` is not set or invalid

**Fix:**
1. Regenerate auth token in Sentry
2. Update `VITE_SENTRY_AUTH_TOKEN` in Vercel
3. Redeploy

---

## Security Best Practices

### ✅ DO:
- Store DSN in environment variables (Vercel)
- Use auth tokens with minimal scopes
- Filter sensitive data (already configured in `beforeSend`)
- Set up alerts for error spikes

### ❌ DON'T:
- Commit DSN to Git (use `.env` which is git-ignored)
- Use production DSN in development
- Disable `beforeSend` filtering (removes sensitive data)
- Send user passwords/tokens to Sentry

---

## What's Already Configured

The following is already set up in the codebase:

✅ **Sentry initialization** (`src/lib/sentry.ts`)
✅ **Error filtering** (removes passwords, tokens, cookies)
✅ **Web Vitals monitoring** (CLS, INP, LCP, FCP, TTFB)
✅ **Session Replay** (only on errors, privacy-safe)
✅ **Ignored errors** (browser extensions, network errors)
✅ **Self-check** (warns if not configured in production)

---

## Testing Checklist

Before going live, verify:

- [ ] DSN is set in Vercel (Production environment)
- [ ] Auth token is set (for source maps)
- [ ] Test error appears in Sentry dashboard
- [ ] Source maps are uploaded (readable stack traces)
- [ ] Alert rules are configured
- [ ] Team members have access to Sentry project

---

## Cost Estimate

**Free Tier** (recommended for starting):
- 5,000 errors/month
- 10,000 performance units/month
- 50 replays/month
- 1 team member

**Paid Tier** (if you outgrow free):
- $26/month (Team plan)
- 50,000 errors/month
- 100,000 performance units/month
- Unlimited replays

---

## Support

If you have issues:
1. Check [Sentry Docs](https://docs.sentry.io/platforms/javascript/guides/react/)
2. Ask in `#support` channel (if applicable)
3. Contact: your-email@example.com

---

**Last updated:** 2025-12-16
**Author:** Claude Code (Security Pack Δ1)

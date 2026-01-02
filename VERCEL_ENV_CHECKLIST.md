# 🌐 Vercel Environment Variables Configuration

**Project:** Majster.AI Frontend
**Platform:** Vercel
**Configure at:** [Vercel Dashboard → Settings → Environment Variables](https://vercel.com)

---

## ✅ Required Environment Variables

### 1. Supabase Connection (REQUIRED)

These variables connect your frontend to Supabase backend:

- [ ] `VITE_SUPABASE_URL`
  - **Value:** `https://xwvxqhhnozfrjcjmcltv.supabase.co`
  - **Where to get:** Supabase Dashboard → Settings → API → Project URL
  - **Environment:** Production, Preview, Development
  - **⚠️ Must use `VITE_` prefix** for Vite to expose to browser

- [ ] `VITE_SUPABASE_ANON_KEY`
  - **Value:** `eyJhbGci...` (long JWT token starting with `eyJ`)
  - **Where to get:** Supabase Dashboard → Settings → API → anon/public key
  - **Environment:** Production, Preview, Development
  - **⚠️ Use `anon` key, NOT `service_role` key!**
  - **⚠️ Must use `VITE_` prefix**

---

## 🔍 Optional Environment Variables

### 2. Sentry Error Monitoring (Recommended for production)

- [ ] `VITE_SENTRY_DSN`
  - **Value:** `https://...@sentry.io/...`
  - **Where to get:** [sentry.io](https://sentry.io) → Project Settings → Client Keys (DSN)
  - **Environment:** Production, Preview
  - **Used for:** Real-time error tracking and monitoring

- [ ] `VITE_SENTRY_ORG`
  - **Value:** Your Sentry organization slug
  - **Example:** `majster-ai`
  - **Environment:** Production

- [ ] `VITE_SENTRY_PROJECT`
  - **Value:** Your Sentry project slug
  - **Example:** `majster-ai-frontend`
  - **Environment:** Production

- [ ] `VITE_SENTRY_AUTH_TOKEN`
  - **Value:** Sentry auth token for uploading source maps
  - **Where to get:** Sentry → Settings → Auth Tokens
  - **Environment:** Production
  - **⚠️ Keep this secret!** Used only during build

---

## 🔧 How to Configure in Vercel

### Method 1: Vercel Dashboard (Recommended)

1. Go to: https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Click **Add**
5. Enter:
   - **Key:** `VITE_SUPABASE_URL`
   - **Value:** `https://xwvxqhhnozfrjcjmcltv.supabase.co`
   - **Environments:** Check all (Production, Preview, Development)
6. Click **Save**
7. Repeat for `VITE_SUPABASE_ANON_KEY`

### Method 2: Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login
vercel login

# Link project
vercel link

# Add environment variable
vercel env add VITE_SUPABASE_URL production
# Enter value when prompted: https://xwvxqhhnozfrjcjmcltv.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter value when prompted: eyJhbGci...

# Pull environment variables to local .env
vercel env pull .env.local
```

### Method 3: Import from .env file

Create `.env.production` locally:
```env
VITE_SUPABASE_URL=https://xwvxqhhnozfrjcjmcltv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGci...
```

Then in Vercel Dashboard:
1. Settings → Environment Variables
2. Click "Import .env"
3. Paste file contents
4. Click "Import"

---

## 📋 Complete Configuration Template

### Minimum Setup (REQUIRED):
```env
VITE_SUPABASE_URL=https://xwvxqhhnozfrjcjmcltv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Full Setup (with monitoring):
```env
# Supabase (REQUIRED)
VITE_SUPABASE_URL=https://xwvxqhhnozfrjcjmcltv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Sentry (Optional, recommended for production)
VITE_SENTRY_DSN=https://abc123@o123456.ingest.sentry.io/7654321
VITE_SENTRY_ORG=majster-ai
VITE_SENTRY_PROJECT=majster-ai-frontend
VITE_SENTRY_AUTH_TOKEN=sntrys_... # Only for build/deployment
```

---

## ✅ Verification Steps

### 1. Check Variables are Set

In Vercel Dashboard:
```
Settings → Environment Variables
Should see:
✅ VITE_SUPABASE_URL
✅ VITE_SUPABASE_ANON_KEY
```

### 2. Trigger New Deployment

After adding variables, you MUST redeploy:

**Option A: Via Dashboard:**
1. Deployments tab
2. Click "..." on latest deployment
3. Click "Redeploy"

**Option B: Via Git:**
```bash
git commit --allow-empty -m "Trigger redeploy after env vars"
git push
```

**Option C: Via CLI:**
```bash
vercel --prod
```

### 3. Verify in Browser

After deployment, open browser console:
```javascript
// Should NOT be undefined
console.log(import.meta.env.VITE_SUPABASE_URL)
// Output: https://xwvxqhhnozfrjcjmcltv.supabase.co

console.log(import.meta.env.VITE_SUPABASE_ANON_KEY)
// Output: eyJhbGci... (long token)
```

If undefined → variables not loaded, need to redeploy.

### 4. Test Supabase Connection

Try to register/login:
1. Open your app: `https://your-app.vercel.app`
2. Click "Register"
3. Fill form and submit
4. If successful → connection works! ✅
5. If error → check browser console for details

---

## 🚨 Common Issues & Fixes

### Issue 1: Variables are undefined in browser

**Symptom:** `import.meta.env.VITE_SUPABASE_URL` returns `undefined`

**Fix:**
1. Verify variable names start with `VITE_` (case-sensitive!)
2. Redeploy after adding variables
3. Clear browser cache

### Issue 2: "Invalid JWT" or "Unauthorized" errors

**Symptom:** Can't login, get 401 errors

**Fix:**
1. Verify you're using `anon` key, not `service_role`
2. Check key hasn't been rotated in Supabase
3. Regenerate keys if needed:
   - Supabase Dashboard → Settings → API
   - Click "Reset JWT Secret" (⚠️ will invalidate all tokens!)

### Issue 3: CORS errors

**Symptom:** `CORS policy: No 'Access-Control-Allow-Origin' header`

**Fix:**
1. Verify `vercel.json` has correct CSP headers ✅ (already configured)
2. Check Supabase URL in env matches actual Supabase project
3. Verify no typos in URL (trailing slash, etc.)

### Issue 4: Environment variables different between environments

**Symptom:** Works in preview but not production

**Fix:**
1. Go to Vercel → Environment Variables
2. Check which environments each variable is assigned to
3. Ensure Production is checked for all variables
4. Redeploy production

---

## 🎯 Deployment Checklist

Before going live:

- [ ] `VITE_SUPABASE_URL` configured for all environments
- [ ] `VITE_SUPABASE_ANON_KEY` configured for all environments
- [ ] Redeployed after adding variables
- [ ] Tested registration/login flow
- [ ] Tested creating a client/project
- [ ] Tested creating a quote
- [ ] Tested sending an email (requires Supabase secrets configured)
- [ ] Verified no errors in browser console
- [ ] Verified no errors in Vercel deployment logs
- [ ] (Optional) Sentry configured and receiving events

---

## 📊 Environment Comparison

| Environment | When Used | Purpose |
|-------------|-----------|---------|
| **Production** | `main` branch | Live app users access |
| **Preview** | Pull requests | Test changes before merge |
| **Development** | `vercel dev` | Local development |

**Recommendation:** Use same Supabase project for all environments initially. Create separate Supabase projects for staging/production when scaling.

---

## 🔐 Security Best Practices

- ✅ **DO** use `VITE_SUPABASE_ANON_KEY` (public key) in frontend
- ✅ **DO** commit `vercel.json` (no secrets there)
- ✅ **DO** use environment variables for configuration
- ❌ **NEVER** use `SUPABASE_SERVICE_ROLE_KEY` in frontend
- ❌ **NEVER** commit `.env` or `.env.local` to git
- ❌ **NEVER** hardcode API keys in source code

---

## 🌍 Custom Domain Configuration

If you have a custom domain:

1. **Add domain in Vercel:**
   - Settings → Domains
   - Add domain: `majster.ai` or `app.majster.ai`
   - Follow DNS configuration instructions

2. **Update `FRONTEND_URL` in Supabase secrets:**
   ```bash
   supabase secrets set FRONTEND_URL=https://app.majster.ai
   ```

3. **Update allowed URLs in Supabase:**
   - Supabase Dashboard → Authentication → URL Configuration
   - Add to "Site URL": `https://app.majster.ai`
   - Add to "Redirect URLs": `https://app.majster.ai/**`

---

## 📚 Additional Resources

- [Vercel Environment Variables Docs](https://vercel.com/docs/projects/environment-variables)
- [Vite Environment Variables Guide](https://vitejs.dev/guide/env-and-mode.html)
- [Supabase Client Setup](https://supabase.com/docs/reference/javascript/initializing)
- [Sentry Vercel Integration](https://docs.sentry.io/platforms/javascript/guides/react/configuration/integrations/vercel/)

---

**Last Updated:** 2025-12-28
**Status:** Ready for configuration

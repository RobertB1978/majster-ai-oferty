# Vercel Preview Environment Configuration Fix

## Problem
Vercel Preview deployments are showing "SUPABASE CONFIGURATION ERROR" because environment variables are missing for the Preview environment.

**What works**: ✅ Production deployment (has env vars set)
**What's broken**: ❌ Preview deployment (missing env vars)

## Root Cause
The Supabase configuration variables are set for **Production** in Vercel, but NOT for **Preview** environment.

When you build for preview, the build process looks for:
- `VITE_SUPABASE_URL` → **NOT FOUND**
- `VITE_SUPABASE_ANON_KEY` → **NOT FOUND**

Result: App loads but can't initialize Supabase → "SUPABASE CONFIGURATION ERROR"

---

## Solution: Add Environment Variables to Vercel Preview

### Step 1: Get Your Supabase Credentials

1. Go to: https://supabase.com/dashboard
2. Select your Majster.AI project
3. Go to **Settings → API**
4. You'll see:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **Anon public key** (long JWT token starting with `eyJ...`)

**Keep these values handy** - you'll need them in the next step.

### Step 2: Configure Vercel Preview Environment

1. Go to: https://vercel.com/dashboard
2. Click on the **majster-ai-oferty** project
3. Go to **Settings** (gear icon at top)
4. Click **Environment Variables** (left sidebar)

You should see existing variables like:
- `VITE_SUPABASE_URL` (with environment tags: Production, Preview, Development)
- `VITE_SUPABASE_ANON_KEY` (with environment tags: Production, Preview, Development)

### Step 3: Check Variable Configuration

For each variable, check the **Environment** tags:

**CURRENT STATE (Broken)**:
```
VITE_SUPABASE_URL          [✓ Production] [✗ Preview] [✗ Development]
VITE_SUPABASE_ANON_KEY     [✓ Production] [✗ Preview] [✗ Development]
```

**NEEDED STATE (Fixed)**:
```
VITE_SUPABASE_URL          [✓ Production] [✓ Preview] [✓ Development]
VITE_SUPABASE_ANON_KEY     [✓ Production] [✓ Preview] [✓ Development]
```

### Step 4: Update Each Variable

For **VITE_SUPABASE_URL**:
1. Click on the row to edit
2. Check the box for **Preview** (and Development if not already checked)
3. Value should be: `https://your-project.supabase.co`
4. Save

For **VITE_SUPABASE_ANON_KEY**:
1. Click on the row to edit
2. Check the box for **Preview** (and Development if not already checked)
3. Value should be: Your long JWT token from Supabase
4. Save

### Step 5: Redeploy Preview

1. Go to **Deployments** tab in Vercel
2. Find the latest failed preview deployment
3. Click the three-dot menu and select **Redeploy**
4. Wait for build to complete (should take 2-3 minutes)

### Step 6: Verify Fix

1. Click on the newly redeployed preview URL
2. Browser should load WITHOUT "SUPABASE CONFIGURATION ERROR"
3. App should work normally (login screen should load)

---

## Visual Guide (If Stuck)

### Where to Find Environment Variables in Vercel:
```
Vercel Dashboard
    ↓
Project: majster-ai-oferty
    ↓
Settings (gear icon)
    ↓
Environment Variables (left sidebar)
    ↓
Find VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
    ↓
Check that BOTH have "Preview" checkbox enabled
```

### After Making Changes:
1. **Save all changes**
2. **Redeploy the latest commit**
3. **Preview should work** ✅

---

## Troubleshooting

**Still seeing "SUPABASE CONFIGURATION ERROR"?**
- Clear browser cache (Ctrl+Shift+Del or Cmd+Shift+Del)
- Wait 2-3 minutes for cache invalidation
- Try different preview link (recent deployment)

**Variables not showing in Vercel?**
- Log out and back into Vercel
- Try a different browser
- Refresh the page several times

**Value got corrupted somehow?**
- Delete the variable
- Click "Add" to create a new one from scratch
- Paste the exact values from Supabase

---

## Summary

| Step | Action | Time |
|------|--------|------|
| 1 | Get Supabase credentials | 1 min |
| 2 | Open Vercel project settings | 1 min |
| 3 | Find environment variables | 1 min |
| 4 | Enable Preview for both variables | 2 min |
| 5 | Redeploy preview | 3 min |
| 6 | Verify fix in browser | 1 min |
| **TOTAL** | | **9 minutes** |

---

## Why This Happened

Vercel environment variables are scoped to environments:
- **Production** = deployed to production domain
- **Preview** = deployment previews from PRs
- **Development** = local development

You only set Production, so Preview couldn't find Supabase config.

---

**After completing these steps, let me know and I'll verify everything is working!** ✅

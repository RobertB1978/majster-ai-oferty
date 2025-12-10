# Vercel Environment Variables Setup

## ⚠️ MANUAL STEP REQUIRED

I cannot access your Vercel dashboard programmatically.
Please follow these steps manually:

## Steps:

### 1. Open Vercel Dashboard
Go to: https://vercel.com/dashboard

### 2. Select Your Project
Click on: **majster-ai-oferty-foom** (or your project name)

### 3. Go to Settings
Click: **Settings** → **Environment Variables**

### 4. Add These Variables

Click "Add New" and add each variable for **ALL environments** (Production + Preview + Development):

#### Variable 1: VITE_SUPABASE_URL
```
Name: VITE_SUPABASE_URL
Value: https://xwxvqhhnozfrjcjmcltv.supabase.co
Environments: ✅ Production ✅ Preview ✅ Development
```

#### Variable 2: VITE_SUPABASE_ANON_KEY
```
Name: VITE_SUPABASE_ANON_KEY
Value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eHZxaGhub3pmcmpjam1jbHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQwODIsImV4cCI6MjA4MDk1MDA4Mn0.uT8Jzfz96l2AFZ_o-sy2zD_21UGXEO5BYbW0m8xDkFI
Environments: ✅ Production ✅ Preview ✅ Development
```

### 5. Save
Click **"Save"** after each variable

### 6. Redeploy
1. Go to: **Deployments**
2. Click **⋮** (three dots) on latest deployment
3. Click **"Redeploy"**
4. Wait 2-3 minutes

### 7. Verify
Click **"Visit"** - app should load without errors

---

## Alternative: Use Vercel CLI (if installed)

If you have Vercel CLI installed, you can run:

```bash
vercel env add VITE_SUPABASE_URL production
# Enter: https://xwxvqhhnozfrjcjmcltv.supabase.co

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3eHZxaGhub3pmcmpjam1jbHR2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzNzQwODIsImV4cCI6MjA4MDk1MDA4Mn0.uT8Jzfz96l2AFZ_o-sy2zD_21UGXEO5BYbW0m8xDkFI

# Repeat for preview and development
```

Then redeploy:
```bash
vercel --prod
```

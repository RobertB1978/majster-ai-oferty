# 🎯 Single Source of Truth - Supabase Project Configuration

> **Purpose:** Prevent "two Supabase projects mixed" errors and deployment failures by establishing ONE authoritative source for the production project reference.

---

## 📋 Production Project Details

**Project Name:** `majster-ai-prod`
**Project Ref:** `xwvxqhhnozfrjcjmcltv`
**Project URL:** `https://xwvxqhhnozfrjcjmcltv.supabase.co`

**Date Updated:** 2024-12-23
**Updated By:** Claude Code (fix-supabase-config)

---

## 🔐 Where is This Defined?

### 1. **Primary Source of Truth: `supabase/config.toml`**

```toml
project_id = "xwvxqhhnozfrjcjmcltv"
```

**Location:** `/supabase/config.toml` (line 1)
**Why Primary:** This file is version-controlled and used by Supabase CLI for local development and deployments.

### 2. **GitHub Secret: `SUPABASE_PROJECT_REF`**

**Location:** GitHub Repository → Settings → Secrets and variables → Actions
**Name:** `SUPABASE_PROJECT_REF`
**Value:** `xwvxqhhnozfrjcjmcltv` (must match config.toml!)

**Purpose:** Used by GitHub Actions deploy workflow for validation and remote operations.

### 3. **Validation Step**

The GitHub Actions workflow (`.github/workflows/supabase-deploy.yml`) includes automatic validation:
- Reads `project_id` from `config.toml`
- Compares with `SUPABASE_PROJECT_REF` secret
- **Fails deployment if mismatch detected** (exit 1)

---

## ⚠️ "Never Mix Projects" Rule

### What Happened Before?

**OLD (Wrong):** Repository contained references to `zpawgcecwqvypodzvlzy` (Lovable project)
**NEW (Correct):** All references updated to `xwvxqhhnozfrjcjmcltv` (production project)

### Files Updated (2024-12-23):
- ✅ `supabase/config.toml` - project_id
- ✅ `src/components/admin/AdminCronManager.tsx` - hardcoded URL
- ✅ `src/components/seo/SEOHead.tsx` - dns-prefetch URL
- ✅ `docs/MONITORING_SECURITY_SETUP.md` - example URLs
- ✅ `docs/SUPABASE_DEPLOY_GUIDE.md` - example URLs
- ✅ `docs/ROBERT_CHECKLIST_SUPABASE_AUTOPILOT.md` - example URLs
- ✅ `docs/ENVIRONMENT_VARIABLES_CHECKLIST.md` - example URLs
- ✅ `docs/SUPABASE_SETUP_GUIDE.md` - example URLs

---

## 🔄 How to Change/Rotate the Production Project

**⚠️ Only perform this if you're migrating to a NEW production Supabase project!**

### Step-by-Step Process:

1. **Verify New Project Details**
   ```bash
   # Get project ref from Supabase Dashboard:
   # Dashboard → Settings → General → Reference ID
   NEW_PROJECT_REF="your-new-project-ref"
   ```

2. **Update config.toml**
   ```bash
   # Edit supabase/config.toml
   # Change: project_id = "xwvxqhhnozfrjcjmcltv"
   # To:     project_id = "your-new-project-ref"
   ```

3. **Update GitHub Secret**
   ```bash
   # Go to: GitHub Repo → Settings → Secrets → Actions
   # Edit: SUPABASE_PROJECT_REF
   # New value: your-new-project-ref
   ```

4. **Search and Replace Hardcoded URLs** (if any)
   ```bash
   # Search for old project ref:
   grep -r "xwvxqhhnozfrjcjmcltv" . --include="*.ts" --include="*.tsx" --include="*.md"

   # Replace with new ref in found files
   ```

5. **Update This Document**
   - Update "Production Project Details" section with new ref
   - Update "Date Updated" and "Updated By"

6. **Commit and Deploy**
   ```bash
   git add .
   git commit -m "chore: migrate to new Supabase project [ref]"
   git push
   ```

7. **Verify Deployment**
   - GitHub Actions deploy workflow should pass validation
   - Check logs for: "✅ Project ref validation passed"

---

## 🛠️ Troubleshooting

### Error: "Project ref mismatch detected!"

**Cause:** `config.toml` project_id doesn't match `SUPABASE_PROJECT_REF` GitHub secret.

**Solution:**
1. Check Supabase Dashboard to confirm correct production project ref
2. Update EITHER `config.toml` OR GitHub secret to match
3. Re-run deployment workflow

**Command to check current config:**
```bash
# Check config.toml
grep 'project_id' supabase/config.toml

# Check GitHub secret (requires gh CLI and permissions)
gh secret list | grep SUPABASE_PROJECT_REF
```

### Error: "supabase/config.toml not found"

**Cause:** Repository structure issue or wrong working directory.

**Solution:**
1. Verify you're in repository root
2. Confirm `supabase/config.toml` exists
3. Check workflow checkout step succeeded

### How to Find Your Current Production Project Ref

**Method 1: Supabase Dashboard**
1. Go to https://supabase.com/dashboard
2. Select your project (majster-ai-prod)
3. Settings → General → Reference ID
4. Copy the value (e.g., `xwvxqhhnozfrjcjmcltv`)

**Method 2: Project URL**
```
URL format: https://[PROJECT-REF].supabase.co
Example:    https://xwvxqhhnozfrjcjmcltv.supabase.co

Project ref is the subdomain: xwvxqhhnozfrjcjmcltv
```

**Method 3: Check config.toml**
```bash
cat supabase/config.toml | grep project_id
```

---

## 📚 Related Documentation

- **Deploy Guide:** `docs/SUPABASE_DEPLOY_GUIDE.md`
- **Environment Variables:** `docs/ENVIRONMENT_VARIABLES_CHECKLIST.md`
- **Workflow File:** `.github/workflows/supabase-deploy.yml`

---

## 🔍 Quick Reference Commands

```bash
# Check current project ref in config
grep 'project_id' supabase/config.toml

# Search for hardcoded old project refs
grep -r "zpawgcecwqvypodzvlzy" . --include="*.ts" --include="*.tsx" --include="*.md"

# Verify no old refs remain (should return nothing)
grep -r "zpawgcecwqvypodzvlzy" . --include="*.ts" --include="*.tsx" --include="*.md" --include="*.toml"

# Link to production project locally
supabase link --project-ref xwvxqhhnozfrjcjmcltv

# Test deployment (dry run)
supabase db push --dry-run
```

---

## ✅ Validation Checklist

Before deploying to production, ensure:

- [ ] `supabase/config.toml` has correct `project_id`
- [ ] GitHub Secret `SUPABASE_PROJECT_REF` matches `config.toml`
- [ ] No hardcoded old project refs remain in codebase
- [ ] This document is up to date with current project ref
- [ ] Workflow validation step passes (see deploy logs)

---

**Last Updated:** 2024-12-23
**Maintainer:** RobertB1978
**Questions?** See docs/SUPABASE_DEPLOY_GUIDE.md or contact maintainer.

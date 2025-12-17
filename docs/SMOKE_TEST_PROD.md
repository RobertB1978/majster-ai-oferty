# Production Smoke Test Checklist

**Purpose:** Manual verification that critical paths work in production
**Duration:** ~10-15 minutes
**When to run:** After every deployment, before announcing to users

---

## 🔧 Prerequisites

Before starting smoke test, verify:

- [ ] **Deployment Completed**
  - Vercel build successful
  - No build errors in logs
  - Green checkmark on commit in GitHub

- [ ] **Environment Variables Set**
  - `VITE_SUPABASE_URL` configured in Vercel
  - `VITE_SUPABASE_ANON_KEY` configured in Vercel
  - Check: Vercel → Project → Settings → Environment Variables

- [ ] **Supabase Configuration**
  - Site URL matches Vercel deployment URL
  - Redirect URLs include Vercel deployment URL
  - Check: Supabase Dashboard → Authentication → URL Configuration

- [ ] **Production URL Known**
  - Production URL: `https://[YOUR-PROJECT].vercel.app`
  - Preview URL (if testing PR): `https://[YOUR-PROJECT]-[HASH].vercel.app`

---

## ✅ Critical Path Tests

### 1. Static Assets & Page Load

**Goal:** Verify app loads without errors

- [ ] Navigate to production URL
- [ ] Page loads without infinite spinner
- [ ] No console errors (open DevTools → Console)
- [ ] Check Network tab: No 404s, no failed requests
- [ ] Favicon loads correctly
- [ ] App logo/branding displays correctly

**Expected:** App displays login/register page within 2-3 seconds

**Rollback if:** White screen, infinite loading, console errors, 404 errors

---

### 2. User Registration

**Goal:** New user can register

- [ ] Click "Zarejestruj się" / "Register"
- [ ] Fill in registration form:
  - Valid email (use test email you can access)
  - Strong password (8+ chars)
  - Agree to terms
- [ ] Submit registration
- [ ] Check email for confirmation link
- [ ] Click confirmation link in email
- [ ] Redirected back to app
- [ ] See success message or dashboard

**Expected:** Registration completes, email received within 1 minute, can confirm account

**Rollback if:**
- Registration fails with "Invalid credentials"
- No confirmation email received (check spam)
- Confirmation link returns 404 or error
- Supabase auth error in console

---

### 3. User Login

**Goal:** Existing user can log in

- [ ] Navigate to login page
- [ ] Enter registered email and password
- [ ] Click "Zaloguj się" / "Login"
- [ ] Redirected to dashboard
- [ ] See user name/email in header/navbar
- [ ] No console errors

**Expected:** Login completes within 2-3 seconds, redirected to `/dashboard`

**Rollback if:**
- "Invalid login credentials" error
- Infinite loading after login
- Not redirected to dashboard
- Console error: "Invalid API key" or auth error

---

### 4. Dashboard & Navigation

**Goal:** User can navigate the app

- [ ] Dashboard displays (not blank)
- [ ] Sidebar menu renders
- [ ] Click "Projekty" / "Projects" - page loads
- [ ] Click "Oferty" / "Offers" - page loads
- [ ] Click "Klienci" / "Clients" - page loads
- [ ] Click "Kalendarz" / "Calendar" - page loads
- [ ] No 404 errors on navigation
- [ ] No console errors

**Expected:** All pages load within 1-2 seconds

**Rollback if:** Pages show 404, blank screens, or console errors

---

### 5. Project Creation

**Goal:** User can create a project

- [ ] Navigate to "Projekty" / "Projects"
- [ ] Click "Nowy projekt" / "New Project"
- [ ] Fill in project form:
  - Project name: "Test Project PROD"
  - Client name: "Test Client"
  - Address: "ul. Testowa 1, Warszawa"
  - Description: "Test smoke test"
- [ ] Save project
- [ ] Project appears in project list
- [ ] No console errors

**Expected:** Project saved to database, appears in list immediately

**Rollback if:**
- Save fails with database error
- Project doesn't appear in list
- Console error: Supabase connection error

---

### 6. Offer/Quote Creation

**Goal:** User can create an offer

- [ ] Open created project
- [ ] Click "Nowa oferta" / "New Offer"
- [ ] Fill in basic offer details:
  - Title: "Test Offer PROD"
  - Description: "Test description"
  - Add at least one item with price
- [ ] Save offer
- [ ] Offer appears in offers list
- [ ] No console errors

**Expected:** Offer saved, appears in list

**Rollback if:** Save fails, database error

---

### 7. PDF Generation (if configured)

**Goal:** PDF generation works

⚠️ **Skip if Edge Functions not configured with AI provider**

- [ ] Open created offer
- [ ] Click "Generuj PDF" / "Generate PDF"
- [ ] Wait for PDF generation (may take 5-10 seconds)
- [ ] PDF preview displays in modal
- [ ] PDF contains offer details (name, items, prices)
- [ ] PDF download works
- [ ] No console errors

**Expected:** PDF generates and displays within 10 seconds

**Rollback if:**
- PDF generation fails (check Edge Functions logs)
- PDF is blank or malformed
- Console error: AI provider error

---

### 8. Email Sending (if configured)

**Goal:** Email sending works

⚠️ **Skip if Resend API not configured**

- [ ] Open created offer
- [ ] Click "Wyślij email" / "Send Email"
- [ ] Enter test email address
- [ ] Send email
- [ ] Check email inbox (within 1-2 minutes)
- [ ] Email received with offer details
- [ ] Email formatting looks correct
- [ ] Links in email work (if any)

**Expected:** Email delivered within 2 minutes

**Rollback if:**
- Email sending fails (check Edge Functions logs)
- Email not received (check spam)
- Email is malformed or missing content

---

### 9. Logout & Session Handling

**Goal:** User can log out and session persists correctly

- [ ] Click user menu/profile
- [ ] Click "Wyloguj się" / "Logout"
- [ ] Redirected to login page
- [ ] Try accessing `/dashboard` directly (paste URL)
- [ ] Should redirect to `/login` (protected route works)
- [ ] Log in again
- [ ] Session restored correctly

**Expected:** Logout works, protected routes redirect to login

**Rollback if:** Can access protected routes when logged out

---

### 10. Mobile Responsiveness

**Goal:** App works on mobile viewport

- [ ] Open DevTools → Toggle device toolbar (Cmd+Shift+M / Ctrl+Shift+M)
- [ ] Set viewport to iPhone (375x667) or similar
- [ ] Navigation menu works (hamburger menu if applicable)
- [ ] Can navigate pages
- [ ] Forms are usable (not cut off)
- [ ] Buttons are tappable (not too small)
- [ ] Text is readable (not too small)

**Expected:** App is usable on mobile viewport

**Rollback if:** App is unusable on mobile (critical if mobile users expected)

---

## 🚨 Rollback Criteria

**ROLLBACK IMMEDIATELY if:**

1. **Critical Auth Failure**
   - Users cannot register or login
   - Console error: "Invalid API key" or Supabase auth error
   - **Action:** Check ENV variables in Vercel, verify Supabase URL/key

2. **Database Connection Failure**
   - Projects/offers cannot be saved
   - Console error: "Failed to fetch" or network error to Supabase
   - **Action:** Check Supabase status, verify connection

3. **White Screen / Infinite Loading**
   - App doesn't load at all
   - Infinite spinner on login/dashboard
   - **Action:** Check build logs in Vercel, verify static assets

4. **Widespread Console Errors**
   - Multiple red errors in console
   - JavaScript errors breaking functionality
   - **Action:** Check build logs, verify source maps

5. **Security Issue**
   - CSP errors blocking functionality
   - Exposed sensitive data (API keys visible in browser)
   - **Action:** Immediate rollback, investigate

**Rollback command:**
```bash
# In Vercel dashboard:
# Deployments → Previous deployment → "Promote to Production"
# OR revert git commit and push
```

---

## 📊 Post-Test Report

After completing smoke test, document results:

```markdown
## Smoke Test Results

**Date:** YYYY-MM-DD
**Tester:** [Your name]
**Deployment:** [Vercel URL]
**Commit:** [Git commit hash]

### Results:
- [ ] All tests passed ✅
- [ ] Partial pass (list failures) ⚠️
- [ ] Failed (rollback required) ❌

### Failures (if any):
1. [Test name] - [Description of failure]
2. [Test name] - [Description of failure]

### Notes:
[Any observations, performance issues, etc.]

### Decision:
- [ ] APPROVED - Safe for production
- [ ] ROLLBACK REQUIRED - Critical issues found
- [ ] HOLD - Minor issues, needs fix
```

---

## 🔍 Monitoring After Deployment

After smoke test passes, monitor for 30 minutes:

- [ ] Check Vercel logs for errors
- [ ] Check Supabase logs for unusual activity
- [ ] Check Sentry (if configured) for error spikes
- [ ] Monitor user feedback (if users are testing)

**If issues arise:**
1. Document the issue
2. Assess severity (minor vs critical)
3. Decide: hotfix or rollback
4. Communicate to team

---

## 📝 Checklist Template (Copy-Paste for Each Test)

```
## Smoke Test - [Date]

**Deployment URL:** https://[...].vercel.app
**Commit:** [hash]
**Tester:** [name]

### Prerequisites
- [ ] Deployment completed
- [ ] ENV variables set
- [ ] Supabase configured

### Critical Paths
- [ ] 1. Static assets load
- [ ] 2. User registration
- [ ] 3. User login
- [ ] 4. Dashboard navigation
- [ ] 5. Project creation
- [ ] 6. Offer creation
- [ ] 7. PDF generation (if configured)
- [ ] 8. Email sending (if configured)
- [ ] 9. Logout & session
- [ ] 10. Mobile responsive

### Result: [PASS / FAIL / PARTIAL]
### Notes: [...]
```

---

**Remember:** It's better to rollback and fix than to leave broken functionality in production. A 5-minute rollback is better than hours of debugging production issues.

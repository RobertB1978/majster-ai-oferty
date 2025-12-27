# SMOKE TEST PLAN - MAJSTER.AI PRODUKCJA
**Czas:** 5-10 minut  
**Wykonywane:** Po każdym production deployment  
**Cel:** Szybka weryfikacja że critical paths działają

---

## 🎯 PRE-REQUISITES

**Przed testem:**
- [ ] Deployment na Vercel: ✅ Success
- [ ] Database migrations: ✅ Applied
- [ ] Edge Functions: ✅ Deployed
- [ ] Environment Variables: ✅ Set (Vercel Dashboard)

**Test credentials:**
- **Email:** `[email protected]` (lub utwórz nowy)
- **Password:** `TestMajster2025!`

**Environment:**
- **URL:** https://your-app.vercel.app (replace)
- **Stripe:** Test mode (używaj test card: `4242 4242 4242 4242`)

---

## ✅ TEST SCENARIOS

### 1. AUTH FLOW (2 minuty)

#### 1.1 Sign Up (nowy użytkownik)
```
[ ] Idź do /signup
[ ] Wypełnij formularz:
    Email: smoketest+[timestamp]@example.com
    Password: TestMajster2025!
[ ] Kliknij "Sign Up"
[ ] EXPECTED: Redirect do /dashboard
[ ] EXPECTED: Brak błędów w console (F12)
```

#### 1.2 Log Out
```
[ ] Kliknij avatar → "Log Out"
[ ] EXPECTED: Redirect do /login
[ ] EXPECTED: Session cleared
```

#### 1.3 Log In
```
[ ] Wpisz credentials z 1.1
[ ] Kliknij "Log In"
[ ] EXPECTED: Redirect do /dashboard
[ ] EXPECTED: User name widoczny w UI
```

**FAIL CONDITIONS:**
- ❌ "Invalid login credentials" (mimo poprawnych danych)
- ❌ Infinite redirect loop
- ❌ RLS error w console: "new row violates row-level security policy"

---

### 2. CORE FEATURES (3 minuty)

#### 2.1 Create Client
```
[ ] Dashboard → Clients → "Add Client"
[ ] Wypełnij:
    Name: "Smoke Test Client"
    Email: "[email protected]"
    Phone: "+48 123 456 789"
[ ] Kliknij "Save"
[ ] EXPECTED: Client pojawia się w liście
[ ] EXPECTED: Toast: "Client created successfully"
```

#### 2.2 Create Project
```
[ ] Dashboard → Projects → "Add Project"
[ ] Wypełnij:
    Name: "Smoke Test Project"
    Client: [wybierz "Smoke Test Client"]
    Start Date: [dzisiaj]
[ ] Kliknij "Save"
[ ] EXPECTED: Project pojawia się w liście
```

#### 2.3 Generate Quote (AI)
```
[ ] Otwórz "Smoke Test Project"
[ ] Kliknij "Generate Quote" / "New Quote"
[ ] Dodaj pozycję:
    Description: "Malowanie ścian"
    Quantity: 50
    Unit: m²
    Price: 20
[ ] Kliknij "Calculate" / "Generate PDF"
[ ] EXPECTED: PDF preview widoczny
[ ] EXPECTED: Total = 50 * 20 = 1000 PLN
```

#### 2.4 Send Offer Email
```
[ ] W Quote → "Send Offer"
[ ] Wypełnij:
    Recipient: "[email protected]"
    Subject: "Smoke Test Offer"
[ ] Kliknij "Send"
[ ] EXPECTED: Toast: "Offer sent successfully"
[ ] EXPECTED: offer_sends record w DB (sprawdź Supabase Dashboard → offer_sends)
```

**FAIL CONDITIONS:**
- ❌ "Failed to create client" (RLS policy issue)
- ❌ AI quote generation timeout (>30s)
- ❌ PDF generation fails (jsPDF error)
- ❌ Email send fails (Resend API key missing)

---

### 3. PAYMENTS (2 minuty)

#### 3.1 Stripe Checkout
```
[ ] Dashboard → Settings → Billing / Subscription
[ ] Kliknij "Upgrade to Pro" (lub inny plan)
[ ] EXPECTED: Redirect do Stripe Checkout
[ ] EXPECTED: URL: https://checkout.stripe.com/c/pay/...
```

#### 3.2 Test Payment (ONLY in test mode!)
```
[ ] W Stripe Checkout:
    Card: 4242 4242 4242 4242
    Expiry: 12/34
    CVC: 123
    ZIP: 12345
[ ] Kliknij "Subscribe"
[ ] EXPECTED: Success → Redirect z powrotem do app
[ ] EXPECTED: Subscription status = "active" w UI
```

#### 3.3 Webhook Verification
```
[ ] Sprawdź Stripe Dashboard → Developers → Webhooks
[ ] Find endpoint: https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/stripe-webhook
[ ] EXPECTED: Recent events pokazują "succeeded" (200 OK)
[ ] EXPECTED: W Supabase → subscription_events: nowy event_type "checkout.session.completed"
```

**Alternative (bez real payment):**
```bash
# Test webhook endpoint accessibility:
curl -I https://xwvxqhhnozfrjcjmcltv.supabase.co/functions/v1/stripe-webhook
# EXPECTED: HTTP/2 405 (Method Not Allowed - OK dla GET, wymaga POST)
# lub HTTP/2 401 (Missing signature - OK)
```

**FAIL CONDITIONS:**
- ❌ Stripe checkout nie ładuje się (key missing)
- ❌ Webhook returns 500 (DB connection issue)
- ❌ Subscription status nie update'uje się w app

---

### 4. STORAGE (1 minuta)

#### 4.1 Upload Project Photo
```
[ ] Otwórz "Smoke Test Project"
[ ] Kliknij "Upload Photo" / "Add Photo"
[ ] Wybierz plik: <10MB JPEG/PNG
[ ] EXPECTED: Upload progress bar
[ ] EXPECTED: Photo pojawia się w galerii
[ ] EXPECTED: URL: https://xwvxqhhnozfrjcjmcltv.supabase.co/storage/v1/object/public/project-photos/...
```

#### 4.2 View Photo
```
[ ] Kliknij na uploaded photo
[ ] EXPECTED: Pełny rozmiar/lightbox otwiera się
[ ] EXPECTED: Image loads (no 403 Forbidden)
```

#### 4.3 Delete Photo
```
[ ] Kliknij "Delete" na photo
[ ] Confirm
[ ] EXPECTED: Photo znika z listy
[ ] EXPECTED: URL zwraca 404 (jeśli direct access)
```

**FAIL CONDITIONS:**
- ❌ Upload fails: "Failed to upload" (storage policy issue)
- ❌ Photo URL returns 403 Forbidden (RLS/bucket policy)
- ❌ Delete fails: "You don't have permission"

---

### 5. MONITORING (2 minuty)

#### 5.1 Sentry (jeśli skonfigurowany)
```
[ ] Otwórz Sentry Dashboard
[ ] EXPECTED: No new errors w last 10 min (poza intentional test errors)
[ ] Check: Production environment selected
```

#### 5.2 Supabase Logs
```
[ ] Supabase Dashboard → Logs → Database
[ ] EXPECTED: Recent queries visible
[ ] EXPECTED: No "permission denied" errors
[ ] Filter: "error" → EXPECTED: Empty lub tylko known/expected errors
```

#### 5.3 Vercel Deployment
```
[ ] Vercel Dashboard → Deployments
[ ] EXPECTED: Latest deployment = "Ready"
[ ] Check logs: Kliknij deployment → "View Function Logs"
[ ] EXPECTED: No 500 errors
```

**FAIL CONDITIONS:**
- ❌ Sentry: >5 errors w last 10min (nowe, nie historyczne)
- ❌ Supabase: "connection refused" errors
- ❌ Vercel: 500 errors w function logs

---

## 🚨 ROLLBACK TRIGGERS

**Rollback NATYCHMIAST jeśli:**
1. ❌ Auth nie działa (users nie mogą się zalogować)
2. ❌ RLS blokuje wszystkie query (users widzą puste dane)
3. ❌ Stripe webhook returns 100% 500 errors
4. ❌ Critical error rate >10% (Sentry)
5. ❌ Database connections exhausted

**Rollback procedure:** Zobacz `ROLLBACK_PLAN.md`

---

## ✅ SUCCESS CRITERIA

**Test PASSED jeśli:**
- ✅ Wszystkie 5 sekcji: 0 FAIL CONDITIONS
- ✅ Core features działają (auth, CRUD, payments)
- ✅ No critical errors w Sentry/logs
- ✅ Response time <3s dla critical pages

**Test FAILED jeśli:**
- ❌ Jakakolwiek FAIL CONDITION triggered
- ❌ >2 minor issues (np. slow load times)
- ❌ Any blocker dla primary user flow

---

## 📝 TEST REPORT TEMPLATE

```markdown
## Smoke Test Report
**Date:** YYYY-MM-DD HH:MM
**Deployment:** [Vercel deployment URL]
**Tester:** [Your name]

### Results:
- [ ] 1. Auth Flow: PASS / FAIL
- [ ] 2. Core Features: PASS / FAIL
- [ ] 3. Payments: PASS / FAIL
- [ ] 4. Storage: PASS / FAIL
- [ ] 5. Monitoring: PASS / FAIL

### Issues Found:
1. [Issue description] - Severity: P0/P1/P2

### Action Taken:
- [ ] Rollback executed (if FAIL)
- [ ] Hotfix deployed
- [ ] Monitoring continues

### Sign-off:
**Status:** ✅ APPROVED / ❌ ROLLBACK / ⚠️ CONDITIONAL
**Notes:** [Any additional comments]
```

---

## 🔄 AUTOMATION (Future)

**Możliwe automatyzacje:**
```typescript
// tests/smoke/production.spec.ts
import { test } from '@playwright/test';

test.describe('Production Smoke Tests', () => {
  test('auth flow', async ({ page }) => { /* ... */ });
  test('create client', async ({ page }) => { /* ... */ });
  test('generate quote', async ({ page }) => { /* ... */ });
  // ...
});
```

**Run via:**
```bash
# CI/CD post-deployment hook
npx playwright test tests/smoke/ --project=production
```

---

**Czas wykonania:** 5-10 minut  
**Częstotliwość:** Po każdym production deployment  
**Owner:** DevOps / QA / On-call engineer

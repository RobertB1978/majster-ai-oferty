# FIX PACK Δ2 - SECURITY HARDENING (P1)
**Priorytet:** P1 (Zalecane przed produkcją, opcjonalnie w pierwszym tygodniu)  
**Timeline:** 2-4 godziny  
**Audytor:** Majster Auditor

---

## 🔒 SECURITY IMPROVEMENTS

### 1. Stripe Webhook - Error Handling & Retry Logic

**Status:** ⚠️ **PARTIAL IMPLEMENTATION**  
**Severity:** P1  
**Impact:** Możliwa utrata subscription events przy DB failures

**Problem:**
```typescript
// supabase/functions/stripe-webhook/index.ts:145-150
await supabase.from("subscription_events").insert({
  event_type: event.type,
  event_data: event as unknown as Record<string, unknown>,
  processed: true,
  processed_at: new Date().toISOString(),
});
// ❌ Brak sprawdzenia czy insert się powiódł!
// Jeśli DB error, event jest lost
```

**Fix:**

```typescript
// supabase/functions/stripe-webhook/index.ts

// Dodaj retry logic helper
async function retryOperation<T>(
  operation: () => Promise<T>,
  maxRetries = 3,
  delayMs = 1000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      console.warn(`[retry] Attempt ${attempt}/${maxRetries} failed:`, error);
      lastError = error;
      
      if (attempt < maxRetries) {
        // Exponential backoff: 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delayMs * Math.pow(2, attempt - 1)));
      }
    }
  }
  
  throw lastError;
}

// W main handler, zmień:
// PRZED:
await supabase.from("subscription_events").insert({...});

// PO:
const { error: insertError } = await retryOperation(async () => {
  const result = await supabase.from("subscription_events").insert({
    event_type: event.type,
    event_data: event as unknown as Record<string, unknown>,
    processed: true,
    processed_at: new Date().toISOString(),
  });
  
  if (result.error) throw result.error;
  return result;
}, 3, 1000);

if (insertError) {
  console.error("[stripe-webhook] CRITICAL: Failed to log event after retries:", insertError);
  // Stripe will retry the webhook automatically (up to 3 days)
  return new Response(
    JSON.stringify({ error: "Database unavailable, will retry" }),
    { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

**Dlaczego to ważne:**
- Stripe retries webhooks automatycznie, ale tylko jeśli dostanie 5xx response
- Jeśli zwrócimy 200 a DB insert failuje, event jest stracony
- Retry logic + 503 response = bezpieczniejsze

**Timeline:** 30-45 minut  
**Risk:** LOW (dodatkowe zabezpieczenie)

---

### 2. Vite Upgrade (CVE Fix)

**Status:** 🟡 **WYMAGA AKTUALIZACJI**  
**Severity:** P2 (Moderate CVE, dotyczy dev servera)  
**CVE:** GHSA-67mh-4wv8-2f99  
**Impact:** esbuild dev server CORS bypass

**Problem:**
```json
{
  "vite": "^5.4.19",  // Current version
  "vulnerabilities": {
    "moderate": 2  // esbuild + vite
  }
}
```

**Fix:**

**Option A: Major upgrade (Vite 7.x - breaking changes):**
```bash
# Backup
git checkout -b fix/vite-upgrade

# Upgrade
npm install vite@^7.3.0 @vitejs/plugin-react-swc@^4.0.0

# Test
npm run build
npm run dev
npm test

# Check for breaking changes:
# https://vitejs.dev/guide/migration.html
```

**Option B: Stay on Vite 5.x (check for patch):**
```bash
# Check if there's a patched 5.x version
npm outdated vite

# If available:
npm update vite
```

**Breaking changes w Vite 7:**
- ESM by default (prawdopodobnie już używacie)
- Some config changes
- Check plugins compatibility

**Recommendation:** 
- Jeśli produkcja jest pilna: **Option B** (patch 5.x jeśli dostępny)
- Jeśli macie czas na testy: **Option A** (upgrade do 7.x)

**Timeline:** 1-2 godziny (z testami)  
**Risk:** MODERATE (breaking changes możliwe)

---

### 3. Content Security Policy (CSP) Headers

**Status:** ❌ **BRAK**  
**Severity:** P1  
**Impact:** XSS risk (niski dzięki React, ale CSP = defense in depth)

**Problem:**  
Brak CSP headers w production deployment.

**Fix:**

**Krok 1: Utwórz `vercel.json` w root projektu:**
```json
{
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://esm.sh https://*.supabase.co; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co https://*.stripe.com wss://*.supabase.co; frame-src 'self' https://*.stripe.com; object-src 'none'; base-uri 'self'; form-action 'self';"
        },
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "SAMEORIGIN"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        },
        {
          "key": "Referrer-Policy",
          "value": "strict-origin-when-cross-origin"
        },
        {
          "key": "Permissions-Policy",
          "value": "camera=(), microphone=(), geolocation=(self)"
        }
      ]
    }
  ]
}
```

**Krok 2: Test CSP (development):**
```json
// Opcjonalnie: Najpierw test w report-only mode
{
  "key": "Content-Security-Policy-Report-Only",
  "value": "default-src 'self'; ... ; report-uri /api/csp-report"
}
```

**Krok 3: Deploy i verify:**
```bash
git add vercel.json
git commit -m "security: add CSP and security headers"
git push

# Po deployment, sprawdź:
curl -I https://your-app.vercel.app | grep -i "content-security-policy"
```

**CSP Breakdown:**
- `default-src 'self'` - domyślnie tylko z własnej domeny
- `script-src` - React + Supabase + external deps (esm.sh)
- `connect-src` - API calls (Supabase, Stripe)
- `frame-src` - iframes (Stripe Checkout)
- `object-src 'none'` - blokuje Flash/plugins
- `'unsafe-inline'` - potrzebne dla inline styles (Tailwind)
- `'unsafe-eval'` - może być potrzebne dla dev tools

**Uwaga:** Może wymagać tweakowania w zależności od innych third-party services.

**Timeline:** 30-60 minut (z testowaniem)  
**Risk:** MODERATE (może zablokować legit resources, wymaga testów)

---

### 4. Storage - File Size Limits

**Status:** ⚠️ **BRAK LIMITÓW**  
**Severity:** P2  
**Impact:** Upload bombing, quota exhaustion

**Problem:**  
Storage bucket `project-photos` ma policy upload, ale brak limitu rozmiaru pliku.

**Fix:**

**Option A: Edge Function validation (przed upload):**

Utwórz `supabase/functions/upload-project-photo/index.ts`:
```typescript
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { validateBase64, validateUUID } from "../_shared/validation.ts";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Get auth user
  const authHeader = req.headers.get('Authorization');
  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader?.replace('Bearer ', '') || ''
  );

  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { projectId, fileData, fileName, mimeType } = await req.json();

  // Validate
  if (!ALLOWED_TYPES.includes(mimeType)) {
    return new Response(
      JSON.stringify({ error: `File type not allowed. Allowed: ${ALLOWED_TYPES.join(', ')}` }),
      { status: 400 }
    );
  }

  // Check size (base64 to bytes: length * 0.75)
  const fileSize = fileData.length * 0.75;
  if (fileSize > MAX_FILE_SIZE) {
    return new Response(
      JSON.stringify({ error: `File too large. Max: ${MAX_FILE_SIZE / 1024 / 1024}MB` }),
      { status: 400 }
    );
  }

  // Upload to storage
  const filePath = `${user.id}/${projectId}/${Date.now()}-${fileName}`;
  const { data, error } = await supabase.storage
    .from('project-photos')
    .upload(filePath, Buffer.from(fileData, 'base64'), {
      contentType: mimeType,
      upsert: false
    });

  if (error) throw error;

  return new Response(JSON.stringify({ data }), { status: 200 });
});
```

**Option B: Database trigger (nie polecane dla storage, ale dla kompletności):**
```sql
-- Teoretycznie, ale Supabase Storage nie ma bezpośredniego triggera
-- Lepiej walidować w Edge Function (Option A)
```

**Timeline:** 1 godzina  
**Risk:** LOW (dodatkowa walidacja)

---

## 🔍 DODATKOWE ZALECENIA (Optional)

### 5. Database Connection Pooling Check
- Sprawdź Supabase Dashboard → Database → Connection Pooling
- Upewnij się że używacie `pooler` connection string dla high-traffic endpoints
- Session mode vs Transaction mode

### 6. Monitoring & Alerting
- Skonfiguruj Sentry error tracking (jeśli jeszcze nie)
- Dodaj Supabase Database Webhooks dla critical events
- Vercel Log Drains → Datadog/Logtail

### 7. Rate Limiting - IP-based backup
```typescript
// W rate-limiter.ts dodaj fallback na IP jeśli user_id brak:
export function getIdentifier(req: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  
  // Fallback: IP-based (dla anon users)
  const forwardedFor = req.headers.get('x-forwarded-for');
  const realIp = req.headers.get('x-real-ip');
  const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';
  
  return `ip:${ip}`;
}
```

---

## ✅ CHECKLIST FIX PACK Δ2

- [ ] **1. Stripe Webhook:** Dodano retry logic
- [ ] **2. Vite Upgrade:** CVE naprawione (v7.x lub patch 5.x)
- [ ] **3. CSP Headers:** Skonfigurowane w vercel.json
- [ ] **4. Storage Limits:** Edge function z walidacją
- [ ] **VERIFY #1:** Stripe webhook survives DB outage (test z mockiem)
- [ ] **VERIFY #2:** npm audit pokazuje 0 moderate+
- [ ] **VERIFY #3:** CSP headers widoczne: `curl -I https://app.com`
- [ ] **VERIFY #4:** Upload >10MB failuje z proper error

---

## 🎯 SUCCESS CRITERIA

Po wykonaniu FIX PACK Δ2:
- ✅ npm audit: 0 moderate/high/critical
- ✅ CSP headers w production
- ✅ Stripe webhook ma retry logic
- ✅ Storage ma file size validation

**Timeline:** 2-4 godziny  
**Risk:** MODERATE (wymaga testów, możliwe breaking changes w Vite 7)

---

**Następny krok:** FIX PACK Δ3 (Performance & Quality)

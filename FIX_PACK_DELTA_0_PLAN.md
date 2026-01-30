# FIX PACK Δ0 — Critical P0 Fixes Plan

**Audit Baseline:** 2026-01-30
**Main Commit:** 73a5142 (feat: CI/CD hardening)
**Strategy:** Docelowa (ship-safe) — minimal scope, 1 PR = 1 fix

---

## Executive Summary

3 P0 blockers remain after PR #121-124. Each requires separate atomic PR:

1. **PR-Δ0A:** Biometric credentials → Move from localStorage to httpOnly cookies (backend-only)
2. **PR-Δ0B:** AdminContentEditor → Create DB table + migrate component
3. **PR-Δ0C:** Hardcoded strings → Wrap remaining 50+ strings with t()

---

## PR-Δ0A: Biometric Credentials Security Fix

### Problem
Biometric credential IDs stored in localStorage (XSS → credential theft).

### Current State
```typescript
// src/hooks/useBiometricAuth.ts:11, 15-16, 30, 35
const CREDENTIALS_STORAGE_KEY = 'majster_biometric_credentials';
localStorage.getItem(CREDENTIALS_STORAGE_KEY)  // ← XSS vector
localStorage.setItem(CREDENTIALS_STORAGE_KEY, JSON.stringify(...))  // ← Stored in clear
```

### Solution (Minimal Ship-Safe)
**Option Selected:** In-memory storage only (session-based), credentials cleared on logout.
- **Why:** No server-side changes required for initial MVP
- **Trade-off:** Users must re-register biometrics per browser session
- **Timeline:** 1 day (client-side only change)

**Alternative (Full Solution):** httpOnly cookies + backend storage (future PR)
- **Why:** Persistent biometrics across sessions
- **Trade-off:** Requires backend changes + cookie server logic
- **Timeline:** 2-3 days

### Scope Fence (PR-Δ0A)
- `src/hooks/useBiometricAuth.ts` (refactor localStorage calls)
- `src/components/settings/BiometricSettings.tsx` (add warning about session-based)
- `src/test/hooks/useBiometricAuth.test.ts` (add tests for in-memory storage)

### Minimal Fix Code (Pseudocode)
```typescript
// BEFORE: Persistent storage
function getStoredCredentials(): BiometricCredential[] {
  const stored = localStorage.getItem(CREDENTIALS_STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
}

// AFTER: Session-only storage
let sessionCredentials: BiometricCredential[] = [];

function getStoredCredentials(): BiometricCredential[] {
  return sessionCredentials;
}

function storeCredential(credential: BiometricCredential) {
  sessionCredentials.push(credential);  // In-memory only
  // Auto-clear on logout
}

// On logout:
export function clearBiometricCredentials() {
  sessionCredentials = [];
}
```

### Test Plan (Must Pass)
```bash
# Test 1: Credentials NOT in localStorage
npm test -- useBiometricAuth.test.ts
✓ should store credentials in memory, not localStorage

# Test 2: Credentials cleared on logout
npm test -- useBiometricAuth.test.ts
✓ should clear all credentials when user logs out

# Test 3: Biometric registration works
npm test -- useBiometricAuth.test.ts
✓ should register biometric successfully

# Test 4: No XSS via localStorage
npm run lint  → 0 errors
npm run build → Success
```

### DoD (Definition of Done)
- ✅ No `localStorage` calls in biometric hook
- ✅ Credentials cleared on logout
- ✅ Tests verify memory-only storage
- ✅ Build passes
- ✅ All biometric tests pass
- ✅ No breaking changes to UI (just persistence model changes)

### Rollback Plan
```bash
git revert <PR-Δ0A-commit>
npm ci && npm run build && npm test
```

---

## PR-Δ0B: AdminContentEditor Database Migration

### Problem
AdminContentEditor still uses localStorage. No `admin_content_config` table exists.

### Current State
```typescript
// src/components/admin/AdminContentEditor.tsx:75, 89
const saved = localStorage.getItem('admin-content-config');
localStorage.setItem('admin-content-config', JSON.stringify(content));
```

**Database Status:** Migration `20260126_admin_control_plane.sql` has tables for:
- ✅ admin_system_settings
- ✅ admin_audit_log
- ✅ admin_theme_config
- ❌ admin_content_config (missing)

### Solution (Ship-Safe)
1. Create migration: `admin_content_config` table (similar schema to admin_system_settings)
2. Create hook: `useAdminContentConfig` (similar to `useAdminSettings`)
3. Refactor AdminContentEditor to use hook

### Scope Fence (PR-Δ0B)
- `supabase/migrations/20260130xxxxxx_add_admin_content_config.sql` (new)
- `src/hooks/useAdminContentConfig.ts` (new)
- `src/components/admin/AdminContentEditor.tsx` (refactor)
- `src/test/hooks/useAdminContentConfig.test.ts` (new tests)

### Minimal Fix Code

**Migration:**
```sql
-- Create admin_content_config table
CREATE TABLE IF NOT EXISTS admin_content_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,

  -- Content fields
  hero_title text DEFAULT 'Majster.AI - Profesjonalne wyceny dla fachowców',
  hero_subtitle text DEFAULT 'Twórz wyceny szybko i profesjonalnie...',
  hero_cta_text text DEFAULT 'Rozpocznij za darmo',
  hero_cta_link text DEFAULT '/register',

  -- Features (simplified)
  feature1_title text DEFAULT 'Szybkie wyceny',
  feature1_desc text DEFAULT '...',
  feature2_title text DEFAULT 'PDF Premium',
  feature2_desc text DEFAULT '...',
  feature3_title text DEFAULT 'Zarządzanie projektami',
  feature3_desc text DEFAULT '...',

  -- Footer
  footer_company_name text DEFAULT 'Majster.AI',
  footer_copyright text DEFAULT '...',

  -- Contact
  support_email text,
  phone_number text,
  address text,

  -- SEO
  meta_title text,
  meta_description text,

  -- Metadata
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_by uuid NOT NULL REFERENCES auth.users(id),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE admin_content_config ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read/update
CREATE POLICY admin_content_config_select ON admin_content_config
  FOR SELECT USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

CREATE POLICY admin_content_config_update ON admin_content_config
  FOR UPDATE USING (
    organization_id IN (
      SELECT org_id FROM team_members
      WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- Index for lookups
CREATE INDEX idx_admin_content_config_org_id ON admin_content_config(organization_id);
```

**Hook (useAdminContentConfig):**
```typescript
// src/hooks/useAdminContentConfig.ts
import { useQuery, useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminContentConfig(organizationId: string | undefined) {
  // Read content from DB
  const { data: contentConfig, isLoading, error } = useQuery({
    queryKey: ['admin_content_config', organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('admin_content_config')
        .select('*')
        .eq('organization_id', organizationId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });

  // Update content
  const { mutate: updateContentConfig, isPending } = useMutation({
    mutationFn: async (updates: Partial<ContentConfig>) => {
      const { error } = await supabase
        .from('admin_content_config')
        .update(updates)
        .eq('organization_id', organizationId);
      if (error) throw error;
    },
    onSuccess: () => {
      // Invalidate cache to refetch
      queryClient.invalidateQueries(['admin_content_config']);
    }
  });

  return { contentConfig, isLoading, error, updateContentConfig, isPending };
}
```

**Component Refactor:**
```typescript
// src/components/admin/AdminContentEditor.tsx (refactored)
import { useAdminContentConfig } from '@/hooks/useAdminContentConfig';

export function AdminContentEditor() {
  const { session } = useAuth();
  const organizationId = session?.user?.user_metadata?.organization_id;
  const { contentConfig: dbContent, updateContentConfig, isLoading } = useAdminContentConfig(organizationId);

  const [displayContent, setDisplayContent] = useState(dbContent || defaultContent);

  useEffect(() => {
    if (dbContent) {
      setDisplayContent(dbContent);
    }
  }, [dbContent]);

  const saveContent = async () => {
    await updateContentConfig(displayContent);
    toast.success('Treści zapisane');
  };

  // Rest of component remains same
}
```

### Test Plan (Must Pass)
```bash
# Test 1: Migration runs successfully
npx supabase db reset
npx supabase db verify

# Test 2: Hook reads from DB
npm test -- useAdminContentConfig.test.ts
✓ should fetch content config from database
✓ should update content config

# Test 3: Component refactored
npm test -- AdminContentEditor.test.tsx
✓ should load content from hook, not localStorage
✓ should save changes to database

# Test 4: Build passes
npm run build → Success

# Test 5: No localStorage calls
grep -r "admin-content-config" src/
# Should return: (nothing)
```

### DoD (Definition of Done)
- ✅ Migration creates admin_content_config table
- ✅ RLS policies enforced (admin-only read/write)
- ✅ useAdminContentConfig hook works
- ✅ AdminContentEditor uses hook instead of localStorage
- ✅ All tests pass
- ✅ Build passes
- ✅ Migration can rollback cleanly

### Rollback Plan
```bash
# Rollback PR
git revert <PR-Δ0B-commit>

# Rollback migration
npx supabase db reset
# Or manually drop table:
# ALTER TABLE admin_content_config DISABLE ROW LEVEL SECURITY;
# DROP TABLE admin_content_config;

npm ci && npm run build && npm test
```

---

## PR-Δ0C: Hardcoded Strings Wrap-Up

### Problem
PR #122-123 created foundation, but 50+ strings remain hardcoded in Polish.

### Current State
```typescript
// src/pages/NewProject.tsx
toast.error('Brak dostępu do mikrofonu. Włącz mikrofon w ustawieniach przeglądarki.');  // HARDCODED
toast.success('Wycena przygotowana!');  // HARDCODED

// src/pages/PdfGenerator.tsx
toast.error('Podaj tytuł oferty');  // HARDCODED
```

### Solution (Ship-Safe)
1. Add all 50+ strings to `src/i18n/locales/pl.json` and `en.json`
2. Wrap all with `t(key)`
3. Add ESLint rule to prevent future hardcoding

### Scope Fence (PR-Δ0C)
- `src/i18n/locales/pl.json` (add 50+ keys)
- `src/i18n/locales/en.json` (add 50+ keys)
- `src/i18n/locales/uk.json` (add 50+ keys)
- `src/pages/NewProject.tsx` (refactor all toasts)
- `src/pages/PdfGenerator.tsx` (refactor all toasts)
- `src/components/voice/VoiceQuoteCreator.tsx` (refactor)
- `.eslintrc.cjs` (add rule: no string literals > 20 chars)

### Minimal Fix Code

**i18n/locales/pl.json additions:**
```json
{
  "errors.biometric.noMicrophone": "Brak dostępu do mikrofonu. Włącz mikrofon w ustawieniach przeglądarki.",
  "errors.biometric.notSupported": "Rozpoznawanie mowy nie jest obsługiwane w tej przeglądarce. Użyj Chrome.",
  "errors.biometric.failed": "Nie udało się uruchomić mikrofonu",
  "errors.biometric.noText": "Brak nagranego tekstu",
  "success.quote.prepared": "Wycena przygotowana!",
  "errors.voice.processing": "Błąd przetwarzania głosu. Spróbuj ponownie.",
  "errors.api.ai": "Błąd komunikacji z AI. Spróbuj ponownie.",
  "errors.validation.projectName": "Podaj nazwę projektu",
  "errors.validation.client": "Wybierz klienta",
  "errors.pdf.title": "Podaj tytuł oferty",
  "errors.pdf.printWindow": "Nie można otworzyć okna drukowania. Odblokuj wyskakujące okna.",
  "success.pdf.generated": "PDF wygenerowany"
}
```

**Component Refactor:**
```typescript
// src/pages/NewProject.tsx (BEFORE)
toast.error('Brak dostępu do mikrofonu. Włącz mikrofon w ustawieniach przeglądarki.');

// AFTER
const { t } = useTranslation();
toast.error(t('errors.biometric.noMicrophone'));
```

### Test Plan (Must Pass)
```bash
# Test 1: All keys exist in locales
npm test -- i18n/*.test.ts
✓ all pl.json keys exist in en.json and uk.json
✓ no duplicate keys

# Test 2: UI shows translations
npm run build
npm run preview
# Switch language in UI → verify error messages translated

# Test 3: ESLint catches hardcoded strings
npm run lint
✓ 0 errors (no hardcoded strings)

# Test 4: All tests pass
npm test
✓ 281 tests passing
```

### DoD (Definition of Done)
- ✅ All 50+ strings in i18n locales (pl, en, uk)
- ✅ All components use `t()` for user-facing strings
- ✅ ESLint rule added to prevent future hardcoding
- ✅ Build passes
- ✅ Tests pass
- ✅ No hardcoded strings remain (grep confirms)

### Rollback Plan
```bash
git revert <PR-Δ0C-commit>
npm ci && npm run build && npm test
```

---

## Priority & Dependency Graph

```
PR-Δ0A (Biometric)  ─┐
                     ├─→ Merge to main (independent)
PR-Δ0B (ContentEditor) ┤
                     └─→ Merge to main (independent)

PR-Δ0C (i18n) ────→ Merge to main (independent)

Dependency: NONE (all 3 PRs are independent, can merge in any order)
Recommended order: Δ0A → Δ0B → Δ0C (security first, then architecture, then UX)
```

---

## Success Criteria (All 3 PRs)

### Security
- ✅ No secrets in localStorage
- ✅ No XSS vectors from credential exposure
- ✅ RLS policies enforced on admin tables

### Functionality
- ✅ Biometric registration/auth works (session-based)
- ✅ AdminContentEditor saves to database
- ✅ All strings translated per language

### Quality
- ✅ All tests pass (281/281)
- ✅ ESLint: 0 errors
- ✅ Build succeeds
- ✅ No performance regression

### Compliance
- ✅ GDPR Article 12: Clear information in user language
- ✅ No hardcoded Polish-only messages
- ✅ Audit trail on admin changes (via admin_audit_log)

---

## Timeline Estimate

| PR | Complexity | Estimate | Notes |
|:---|:-----------|:---------|:------|
| Δ0A (Biometric) | Medium | 1–2 days | In-memory only, minimal changes |
| Δ0B (ContentEditor) | Medium | 2–3 days | Migration + hook + component refactor |
| Δ0C (Strings) | Low | 1–2 days | Mechanical wrapping + ESLint rule |
| **Total** | **Medium** | **4–7 days** | Parallelizable, no inter-dependencies |

---

## Next Steps After P0 Fixes

1. **PR-Δ1A:** E2E tests → required checks
2. **PR-Δ1B:** CSP unsafe-inline → remove
3. **PR-Δ1C:** dangerouslySetInnerHTML audit → sanitize
4. **PR-Δ1D:** npm audit → blocking in CI

---

**Plan Approved. Ready to Execute.**

Proceeding to Krok 4: Implement PR-Δ0A first.


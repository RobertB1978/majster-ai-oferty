# PR-L2: Terms Acceptance at Signup (Binding)

## Status
**Implemented** — 2026-04-20

## What Changed

### New: `src/lib/legal/acceptance.ts`
Core acceptance library. Responsibilities:
- `fetchSignupRequiredDocs()` — fetches currently published Terms and Privacy Policy from `legal_documents` (anon-readable per RLS `USING (status = 'published')`)
- `storePendingAcceptances(docs)` — persists acceptance evidence to `localStorage` with a 24 h TTL
- `writePendingAcceptances(userId)` — inserts rows into `legal_acceptances` once the user has an authenticated session
- `getPendingAcceptances()` / `clearPendingAcceptances()` — localStorage helpers with TTL check

### Modified: `src/pages/Register.tsx`
- Fetches required legal documents on mount (non-blocking, shows error if unavailable)
- Shows two required checkboxes:
  1. **Regulamin Serwisu** (Terms of Service) — required, links to `/terms`
  2. **Polityka Prywatności** (Privacy Policy) — required, links to `/privacy`
- Each label shows the document version (e.g. `v1.0`) fetched live from DB
- Inline validation error shown per-checkbox if unchecked at submit
- Fetch failure shows an explicit error with retry button (never silently blocked)
- On successful signup: `storePendingAcceptances(legalDocs)` is called, recording the exact timestamp of acceptance

### Modified: `src/contexts/AuthContext.tsx`
- `onAuthStateChange` now observes the `event` parameter
- On `SIGNED_IN` event: calls `writePendingAcceptances(session.user.id)`
- This fires when the user clicks the email confirmation link → they have a real authenticated session → `legal_acceptances_insert_own` RLS policy is satisfied

### Modified: `src/i18n/locales/{pl,en,uk}.json`
Added `auth.legalConsent.*` keys (prefix / linkText / suffix / required / fetchError / retryFetch).

---

## How Acceptance Is Bound to Versioned Documents

1. **On form render**: `fetchSignupRequiredDocs()` queries `legal_documents` WHERE `status = 'published' AND language = 'pl' AND slug IN ('terms', 'privacy')`. Returns the real `id` (UUID) and `version` of each document.

2. **On form submit** (after checkbox validation passes): `storePendingAcceptances(docs)` saves to `localStorage`:
   ```json
   {
     "items": [
       {
         "document_id": "<uuid of published terms row>",
         "slug": "terms",
         "version": "1.0",
         "accepted_at": "2026-04-20T14:23:11.000Z",
         "user_agent": "Mozilla/5.0 ...",
         "acceptance_source": "signup"
       },
       {
         "document_id": "<uuid of published privacy row>",
         "slug": "privacy",
         "version": "1.0",
         "accepted_at": "2026-04-20T14:23:11.000Z",
         "user_agent": "Mozilla/5.0 ...",
         "acceptance_source": "signup"
       }
     ],
     "expires_at": 1745242991000
   }
   ```

3. **On email confirmation**: Supabase fires `onAuthStateChange('SIGNED_IN')` in `AuthContext`. `writePendingAcceptances(userId)` inserts the pending rows.

4. The `legal_document_id` FK in `legal_acceptances` points to the exact, immutable snapshot of the document that was shown to the user (enforced by `trg_legal_documents_immutability` from PR-L1b).

---

## Evidence Stored per Acceptance Row

| Field | Value | Notes |
|-------|-------|-------|
| `user_id` | auth.uid() | FK to auth.users |
| `legal_document_id` | UUID of published doc | FK to legal_documents, NOT NULL |
| `accepted_at` | Timestamp of checkbox submission | Recorded at signup time, not at email confirmation |
| `acceptance_source` | `'signup'` | Distinguishes from in-app re-acceptance flows |
| `user_agent` | `navigator.userAgent` | Browser fingerprint |
| `ip_hash` | `null` | See known limitations below |

---

## Why Two Rows (Not One)

Each document (`terms` and `privacy`) generates a separate row in `legal_acceptances`. This allows:
- Querying "has user accepted terms?" independently from "has user accepted privacy?"
- Future re-acceptance of only one document when one is updated (archive+publish pattern)
- Clearer audit trail per-document

---

## Known Limitations

### ip_hash = null
The browser does not have reliable access to the real client IP:
- NAT, corporate proxies, and CDNs would all return incorrect/intermediate IPs
- Fetching from an external IP-detection API would add latency and a new external dependency
- Current evidence (accepted_at + user_agent + versioned legal_document_id) is sufficient under RODO art. 7(1)

**Future**: A Supabase Edge Function triggered on `auth.users` INSERT (or a backend webhook) could backfill `ip_hash` from the real IP visible server-side.

### Deferred write (localStorage → DB)
The acceptance is stored in `localStorage` immediately at signup form submission and written to `legal_acceptances` after email confirmation (when the user has a real authenticated session).

**Rationale**: `legal_acceptances` INSERT requires `TO authenticated` RLS. After `supabase.auth.signUp()` with email confirmation enabled, the session is `null` — no authenticated context exists until the user clicks the confirmation link.

**Consequence**: If the user abandons signup (never confirms email), the acceptance is never written to DB. This is acceptable — there is no account to attach it to, and the localStorage record expires in 24 h.

**Risk**: If the user confirms email on a different device/browser, `localStorage` from the original device won't carry over. The acceptance rows won't be written. Mitigation: future PR-L3 could add a "re-accept terms" gate that shows on first dashboard load if no acceptances are found for the user.

### OAuth signups (Google, Apple)
OAuth users bypass the Register form entirely. They do not go through the acceptance checkbox flow. This is an **open gap** — out of scope for PR-L2.

### Language (EN/UK documents)
Legal documents are currently seeded only in Polish (`language = 'pl'`). For EN/UK locale users:
- The checkbox labels are translated to the user's language
- The linked document (`/terms`, `/privacy`) renders the Polish canonical text
- The Polish text includes a header note: `legal.plVersionPrevails` — "Ten dokument dostępny jest wyłącznie w języku polskim..."
- The `legal_document_id` always references the Polish canonical version

This is intentional — Polish is the governing legal language. EN/UK translations of the actual legal text are out of scope for PR-L2.

---

## What PR-L3 / PR-L8 Will Build On

- **PR-L3**: "Re-accept gate" — on first dashboard load, check if the authenticated user has `legal_acceptances` rows for all currently published required documents. If not (OAuth users, old accounts, missed write), redirect to a re-acceptance screen.
- **PR-L8**: Admin CMS for publishing new document versions. When a new version is published, all users will need to re-accept (detected by PR-L3's gate checking `accepted_at < effective_at` of the new version).

---

## Fix Pack Δ Format

**Objaw**: Rejestracja w Majster.AI nie wymagała akceptacji dokumentów prawnych; brak dowodu w DB na jaką wersję dokumentu użytkownik wyraził zgodę.

**Dowód**: `src/pages/Register.tsx` — brak checkboxów. `legal_acceptances` — tabela pusta po rejestracji. `legal_documents` — tabela zasilona przez PR-L1 z immutable snapshotami.

**Hipoteza**: Brak warstwy wiążącej formularz rejestracji z wersjonowanymi dokumentami w DB i brak zapisu dowodu akceptacji.

**Minimalny fix**:
1. `fetchSignupRequiredDocs()` — pobranie UUID opublikowanych docs z DB przy renderze formularza
2. Dwa wymagane checkboxy w Register.tsx z walidacją inline
3. `storePendingAcceptances()` — zapis timestampu + doc IDs do localStorage po signUp
4. `writePendingAcceptances()` wywołany z AuthContext `SIGNED_IN` — zapis do DB gdy sesja jest uwierzytelniona

**Test-plan**:
- Jednostkowy: `acceptance.test.ts` (9 testów: store, read, TTL, clear, write, error handling)
- Manualny: zarejestruj konto, potwierdź email, sprawdź `legal_acceptances` — powinny być 2 wiersze z `acceptance_source='signup'` i prawidłowym `legal_document_id`

**Rollback**: Zrevertuj 3 pliki: `src/pages/Register.tsx`, `src/contexts/AuthContext.tsx`, `src/lib/legal/acceptance.ts`. Brak migracji DB w tym PR — rollback jest bezpieczny.

**Evidence Log**: patrz sekcja DoD w raporcie końcowym commita.

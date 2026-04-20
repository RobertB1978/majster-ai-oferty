# Audyt Architektury Compliance — Majster.AI

**Data:** 2026-04-20
**Tryb:** READ-ONLY — audyt + architektura docelowa (zero zmian w kodzie produktu)
**Branch:** `claude/audit-compliance-architecture-m2bX2`
**Audytor:** Claude Opus 4.7 (Staff Product Architect + Privacy/Compliance Systems Designer)
**Zakres:** publiczne dokumenty prawne, warstwa zgód/audit, warstwa operatora/admina, RODO/ePrivacy, architektura docelowa "Legal Control Center"

> **Reguła prawdy:** każde twierdzenie "istnieje / brakuje" ma dowód w postaci pliku + linii. Brak dowodu = UNKNOWN.

---

## 1. Executive Summary

**Werdykt: 🟠 "Partial legal system" — ~40% publicznej warstwy, ~10% warstwy zgód/audit, ~0% warstwy operator/admin.**

1. **Publiczna warstwa: obecna i kompletna routowo.** 5 stron prawnych (`/legal/privacy`, `/legal/terms`, `/legal/cookies`, `/legal/dpa`, `/legal/rodo`) + redirecty z aliasów + 3 wersje językowe (PL/EN/UK). Dowód: `src/App.tsx:49-53, 281-297`, `src/pages/legal/*.tsx`, `src/i18n/locales/{pl,en,uk}.json`.
2. **Banner cookie jest produkcyjny.** `src/components/legal/CookieConsent.tsx` ma Accept/Reject/Customize o równej wadze wizualnej (EDPB 03/2022 § 24), granularne kategorie essential/analytics/marketing, dynamic injection Plausible po zgodzie. Kontrola withdraw przez `localStorage.removeItem('cookie_consent')` w footerze i w `CookiesPolicy.tsx:209-213`.
3. **DSAR self-service istnieje — ale tylko dla zalogowanych.** `GDPRCenter.tsx` oferuje eksport JSON z 7 tabel i "Żądanie usunięcia". Self-service deletion → `supabase/functions/delete-user-account/index.ts` (udokumentowane w `docs/COMPLIANCE/ACCOUNT_DELETION.md`).
4. **Krytyczna luka #1 — brak akceptacji regulaminu przy rejestracji.** `src/pages/Register.tsx` (218 linii, pełny read) nie ma checkboxa akceptacji ToS/Privacy, nie loguje akceptacji do `user_consents`, nie wiąże wersji dokumentu z kontem. To narusza RODO art. 7(1) — administrator nie może wykazać zgody na przetwarzanie. (`grep "terms|privacy|accept|consent|regulamin" src/pages/Register.tsx` → 0 dopasowań).
5. **Krytyczna luka #2 — brak wersjonowania dokumentów prawnych.** `lastUpdated` na stronach legal to `new Date().toLocaleDateString()` (`src/pages/legal/PrivacyPolicy.tsx:11`, `TermsOfService.tsx:11`, `CookiesPolicy.tsx:12`, `DPA.tsx:11`) — data zmienia się CODZIENNIE. Brak pola `version`, brak tabeli `legal_documents`, brak kluczy i18n typu `document_version` (grep: 0 wyników).
6. **Krytyczna luka #3 — audit log użytkownika zapisywany jest w `notifications`.** `src/hooks/useAuditLog.ts:55-111` przyznaje wprost: *"In production, this would be a dedicated audit_logs table"* — logi trafiają do tabeli `notifications` z RLS pozwalającym użytkownikowi czytać/kasować własne wiersze. Czyli audit trail można skasować z poziomu konta użytkownika. Dowód fałszywego trail: `/legal/rodo` → "delete request" tworzy tylko notyfikację bez adminowego worklistu.
7. **Krytyczna luka #4 — brak adminowego CMS prawnego.** `AdminContentEditor.tsx:22-73` to edytor landing page (hero/features/footer text) zapisywany do `localStorage`. Nie dotyka polityk prawnych. Żadna ze stron `src/pages/admin/*` nie zawiera słów: `legal|privacy|terms|cookie|rodo|dpa|gdpr` (sprawdzone grep-em — 0 dopasowań poza nazwą komponentu).
8. **Krytyczna luka #5 — brak rejestru podprocesorów (art. 28 RODO), mapy przepływu danych, planu naruszeń (art. 33–34), rejestru czynności przetwarzania (art. 30).** Zero tabel w migracjach (`grep subprocessor|data_flow|breach|records_of_processing supabase/migrations` → zero trafień merytorycznych). Brak takich stron w `src/pages/admin/*`. DPA statyczny (tylko i18n content) — nie wymienia subprocesorów, nie ma daty ostatniej zmiany listy.
9. **Częściowy sukces #1: separacja public/user/admin jest poprawna routowo** — `/legal/*` (public), `/app/settings` z zakładką "Privacy" (user, linki read-only do legal), `/admin/*` (operator, chroniony rolą). Ale admin nie ma żadnych kontrolerów dla warstwy prawnej.
10. **Częściowy sukces #2: zapisywanie zgody cookie do bazy** — migracja `20260420155000_pr_compliance_01_anon_consent.sql` (18 linii) przywraca anonimowy INSERT do `user_consents` (wcześniej zablokowany błędnie). Zgoda loguje `consent_type`, `granted`, `user_agent`, `granted_at` (brak IP). Schemat `user_consents` ma też revoke timestamp — ale frontend nigdy nie zapisuje `revoked_at`.
11. **Audit pokrewny potwierdza te ustalenia.** `docs/AUDIT_COOKIE_CONSENT_PRIVACY_2026-04-20.md` (ten sam dzień) raportuje osobno P0/P1 dla cookie/tracking. Niniejszy audyt nie duplikuje tego — koncentruje się na brakach po stronie acceptance, versioning, operator CMS, DSAR workflow.
12. **Wniosek biznesowy:** *aktualny system jest polską wersją "copy-paste legal pages" — produkt wygląda zgodnie z RODO na powierzchni, ale nie ma danych dowodowych, które trzeba by pokazać UODO podczas kontroli.* Launch na rynek PL/UE bez rozwiązania luk #1, #2, #3 to ryzyko kary administracyjnej (art. 83 RODO).

---

## 2. Evidence Checklist — pliki przeczytane

### 2.1 Publiczne strony prawne (read full)
- `src/pages/legal/PrivacyPolicy.tsx` (118 linii) — 7 sekcji z i18n, `lastUpdated = new Date()`.
- `src/pages/legal/TermsOfService.tsx` (113 linii) — 6 sekcji z i18n, `lastUpdated = new Date()`.
- `src/pages/legal/CookiesPolicy.tsx` (230 linii) — tabela cookies (sb-auth-token, cookie_consent, theme, i18nextLng, Plausible, Sentry), sekcja "changeSettings" z czyszczeniem localStorage.
- `src/pages/legal/DPA.tsx` (121 linii) — 6 sekcji z i18n, acceptance text, brak listy subprocesorów.
- `src/pages/legal/GDPRCenter.tsx` (309 linii) — eksport JSON z 7 tabel + modal delete z `USUŃ` + audit do `notifications`.

### 2.2 Banner cookie + audit warstwy zgód
- `src/components/legal/CookieConsent.tsx` (212 linii) — CMP, Plausible dynamic inject, zapis do `user_consents`.
- `src/hooks/useAuditLog.ts` (159 linii) — audit log zapisywany do `notifications` (TODO w kodzie), 30 akcji zdefiniowanych.
- `supabase/migrations/20251206073947_*.sql` — utworzenie `user_consents` (consent_type enum, ip_address, user_agent, granted_at, revoked_at).
- `supabase/migrations/20260420155000_pr_compliance_01_anon_consent.sql` — przywrócenie anon INSERT (user_id IS NULL + wybrane typy).
- `supabase/migrations/20260126_admin_control_plane.sql` (227 linii) — `admin_audit_log` TYLKO dla admin_system_settings/theme/content, nie dla legal.

### 2.3 Routing i linki
- `src/App.tsx:26, 49-53, 281-297` — lazy imports + routes + aliasy redirect (`/privacy` → `/legal/privacy` itd.).
- `src/components/layout/Footer.tsx` (147 linii) — 4 linki legal + "Zmień ustawienia" (czyszczenie cookie_consent).
- `src/components/landing/LandingFooter.tsx` (144 linii) — 5 linków legal + language switcher + "Zmień ustawienia".
- `src/pages/Settings.tsx:132-162` — zakładka "Privacy" z 5 linkami read-only do `/legal/*`.
- `src/pages/Register.tsx` (218 linii) — **BRAK** kontrolek legal (grep: terms|privacy|accept|consent|regulamin = 0 dopasowań).
- `src/pages/Login.tsx` — **BRAK** kontrolek legal (grep: 0 dopasowań).

### 2.4 Admin panel (search for legal)
- `src/pages/admin/AdminContentPage.tsx` + `src/components/admin/AdminContentEditor.tsx` — tylko landing page content (hero, features, footer copy, SEO meta). Zapis w `localStorage`, nie w bazie.
- `src/pages/admin/AdminAuditPage.tsx` (68 linii) — config rollback + `<AuditLogPanel />` (admin_audit_log z organizations).
- Pozostałe `src/pages/admin/*` (11 plików) — grep `legal|privacy|terms|cookie|rodo|dpa|gdpr` → 0 dopasowań.
- `src/components/admin/*` (8 plików) — grep `legal|...|subprocessor|retention|dsar` → 0 dopasowań.

### 2.5 Dokumentacja compliance (istniejąca)
- `docs/COMPLIANCE/ACCOUNT_DELETION.md` (192 linie) — udokumentowany flow deletion + retention table (backups 30d, Stripe 7y, audit 90d).
- `docs/COMPLIANCE/INSPECTIONS_PL.md` (253 linie) — źródło prawdy dla przeglądów budowlanych (niezwiązane z compliance RODO samego SaaS).
- `docs/AUDIT_COOKIE_CONSENT_PRIVACY_2026-04-20.md` — równoległy audyt cookie/tracking (ten sam dzień).

### 2.6 Edge functions istotne dla compliance
- `supabase/functions/delete-user-account/index.ts` — server-side deletion (zgodnie z `ACCOUNT_DELETION.md`).
- `supabase/functions/cleanup-expired-data/index.ts` — retention job (treść nie czytana; istnieje z nazwy).
- `supabase/functions/csp-report/index.ts` — security reporting endpoint.

### 2.7 Grep-y z zerowym wynikiem (negatywne dowody)
- `grep -i subprocessor|processor_registry|data_flow|breach_response|records_of_processing supabase/migrations/` → 4 przypadkowe trafienia (rate_limiter, voice recording, master_templates), **zero merytorycznych**.
- `grep document_version|legal_version|policy_version|accepted_version|terms_version` → 0 plików.
- `grep "plVersionPrevails"` → 3 trafienia (pl/en/uk) — tylko disclaimer językowy, brak wersjonowania.

---

## 3. Current-State Matrix

| Obszar | Status | Dowód | Ryzyko | Uwagi |
|---|---|---|---|---|
| Privacy Policy | **Present** | `src/pages/legal/PrivacyPolicy.tsx`, klucze `legal.privacy.*` w pl/en/uk.json | Średnie | Treść tylko w i18n; brak wersjonowania; `lastUpdated` generowane z `new Date()` (codziennie zmienna). |
| Terms / Regulamin | **Partial** | `src/pages/legal/TermsOfService.tsx` | **Wysokie** | Strona istnieje, ale nie jest wiązana z signup (Register nie ma checkboxa/akceptacji). |
| Cookies Policy | **Present** | `src/pages/legal/CookiesPolicy.tsx`, tabela cookies w kodzie | Średnie | Wpisane 6 cookies; brakuje `cookie_consent_date`; brak banera z odniesieniem do conkretnej wersji polityki. |
| DPA | **Partial** | `src/pages/legal/DPA.tsx`, 6 sekcji i18n | **Wysokie** | Statyczny tekst; brak listy subprocesorów; brak acceptance per użytkownik (art. 28(3) RODO). |
| RODO Center (DSAR UI) | **Present** | `src/pages/legal/GDPRCenter.tsx:34-309` | Średnie | 4 prawa RODO obsłużone (access, rectify, portability, erasure); erasure = notyfikacja bez workflow. |
| Cookie consent UX | **Present** | `src/components/legal/CookieConsent.tsx:33-212` | Niskie | Accept/Reject równowagowe, granular, withdraw przez footer. |
| Consent logs (DB) | **Partial** | `user_consents` (migracja 20251206073947 + 20260420155000) | Średnie | Tabela istnieje, anon insert działa; brak IP przy anon; brak zapisu `revoked_at`; brak konsolidacji per user. |
| Versioning dokumentów prawnych | **Missing** | 0 trafień w grepach, `lastUpdated = new Date()` | **Krytyczne** | Nie da się dowieść "jakiej wersji Regulaminu zaakceptował użytkownik X w dniu Y". |
| Acceptance logs (signup→terms) | **Missing** | `src/pages/Register.tsx` — 0 referencji | **Krytyczne** | Naruszenie art. 7(1) — brak dowodu zgody. |
| Acceptance przy billing / plan change | **Missing** | brak migracji/kodu wiążącego pricing z terms | Wysokie | Zmiana ceny/warunków wymaga re-acceptance w EU. |
| Subprocessors list | **Missing** | brak w i18n, brak w DB, brak w `/legal/dpa` | **Wysokie** | Art. 28(2) RODO + DPA Schrems II — wymagane dla launchu. |
| Retention policy (runtime) | **Partial** | `cleanup-expired-data` edge function (nazwa); `docs/COMPLIANCE/ACCOUNT_DELETION.md` opisuje 30d/7y/90d | Średnie | Dokumentowane, ale nie ma centralnej polityki w produkcie ani panelu; brak egzekwowania per-tabel w kodzie. |
| Data flow map | **Missing** | brak diagramu / dokumentu / widoku w admin | Wysokie | Wymagane dla art. 30 RODO; obecnie wiedza tylko w głowach zespołu. |
| DSAR workflow (admin) | **Missing** | delete-request = notyfikacja w `notifications` usera | **Wysokie** | Admin nie widzi kolejki żądań; brak SLA; naruszenie art. 12(3) RODO (1 miesiąc). |
| Breach-response runbook | **Missing** | brak `docs/runbooks/BREACH_*.md` (jest tylko `RELEASE_RUNBOOK.md`) | **Wysokie** | Art. 33 RODO — 72h obowiązek zgłoszenia. Bez runbooka nie do dotrzymania. |
| Records of processing (art. 30) | **Missing** | brak dokumentu, brak widoku w admin | Wysokie | Wymagane dla organizacji >250 osób / przetwarzających na większą skalę. |
| Owner/Admin legal CMS | **Missing** | `AdminContentEditor` = landing page only, localStorage | **Krytyczne** | Publikowanie nowej Polityki wymaga deployu frontendu + ręcznej edycji i18n JSON. |
| Legal changelog / audit trail | **Partial** | `admin_audit_log` istnieje ale tylko dla system_settings/theme/content; `useAuditLog` zapisuje do `notifications` | **Krytyczne** | Zmiany w legal nie mają audytu; użytkownik może skasować własne audit logi (RLS `notifications_delete`). |
| App vs Admin separation | **Present** | `/app/*` vs `/admin/*`, oddzielne layouty, role-guarded | Niskie | Separacja routowa OK; problem to brak funkcji admin, a nie ich ekspozycja w app. |

---

## 4. Gap Analysis

### 4.1 Co faktycznie istnieje (prawdziwe, nie placeholder)
- **5 stron legal** z routingiem, redirectami, SEO head, językami PL/EN/UK.
- **Banner cookie** poprawny względem EDPB 03/2022 (równowaga wizualna Reject/Accept, granular, default off, dynamic load Plausible).
- **Schemat `user_consents`** z typami (cookies_essential/analytics/marketing, privacy_policy, terms_of_service, newsletter) i poprawnym RLS po migracji `20260420155000`.
- **Self-service DSAR w `GDPRCenter.tsx`**: eksport JSON z 7 tabel (profile, clients, projects, v2_projects, quotes, notifications, consents) + modal delete z keyword `USUŃ`.
- **Edge function `delete-user-account`** (udokumentowana w `ACCOUNT_DELETION.md`) — rate-limited, server-side, czyści kaskadowo 11 tabel + auth.admin.deleteUser.
- **Retention job** `cleanup-expired-data` (istnieje, nazwa zgodna z intencją — treść nieczytana w tym audycie).
- **Separacja routingu** `/legal/*` (public) vs `/app/*` (user) vs `/admin/*` (operator).

### 4.2 Co jest fake / placeholder / iluzoryczne
1. **`lastUpdated` na wszystkich stronach legal** = `new Date().toLocaleDateString()`. To NIE jest data publikacji dokumentu — to dzisiejsza data renderu. Użytkownik widzi "Ostatnia aktualizacja: 2026-04-20" codziennie, niezależnie od rzeczywistych zmian treści. Krytyczne dla dowodzenia wersji w sporze prawnym.
2. **"Marketing" kategoria w banerze cookie** — toggle istnieje w UI, ale w repo nie ma ani jednego marketing trackera (GTM/GA4/Meta/LinkedIn = 0 trafień). Użytkownik widzi wybór, którego faktycznie nie ma co regulować. Zgodnie z `AUDIT_COOKIE_CONSENT_PRIVACY_2026-04-20.md` P2-01.
3. **"Audit log" użytkownika** (`useAuditLog.ts`) — zapisywany jest jako wiersz w tabeli `notifications` z typem info i `is_read: true`. Komentarz w kodzie (`linie 52-54`): *"Store audit logs in notifications table with special type for now. In production, this would be a dedicated audit_logs table"*. To znaczy: każdy użytkownik może skasować swoje własne audit logi przez UI notyfikacji (RLS pozwala na DELETE własnych wierszy).
4. **"Żądanie usunięcia" w GDPRCenter** — tworzy jedynie notyfikację dla samego siebie (`supabase.from('notifications').insert({ user_id: user.id, title: 'Żądanie usunięcia konta' })`). Admin nie ma gdzie zobaczyć listy oczekujących żądań. Właściwy flow to self-service delete przez edge function (istnieje, ale nie jest on podpięty do tego przycisku — on tworzy tylko notification).
5. **`AdminContentEditor`** — zapisuje konfigurację do `localStorage` (`src/components/admin/AdminContentEditor.tsx:78`). Nie synchronizuje z innymi adminami, nie waliduje uprawnień po stronie DB. Przy wielu adminach: rozjazd stanu.

### 4.3 Czego brakuje (krytyczne braki)
1. **Bind "Accept Terms" w signup** — checkbox + zapis do `user_consents(consent_type='terms_of_service', granted=true, version=...)` przy tworzeniu konta. Bez tego zgoda użytkownika nie jest udokumentowana.
2. **Tabela `legal_documents`** z kolumnami: `slug` (privacy/terms/cookies/dpa), `version` (semver lub data), `locale` (pl/en/uk), `content` (markdown/html), `published_at`, `effective_from`, `changelog`. Bez tego: codzienna zmiana daty w UI i brak historii wersji.
3. **Tabela `legal_acceptances`** z kluczem `(user_id, document_slug, document_version, accepted_at, ip_address, user_agent)`. Bez tego: niemożliwe wykazanie art. 7 RODO.
4. **Tabela `subprocessors`** (`id`, `name`, `purpose`, `data_categories`, `location`, `transfer_mechanism`, `dpa_url`, `added_at`, `removed_at`, `replaces`) + publiczny widok w `DPA.tsx`.
5. **Tabela `data_retention_rules`** (`entity_type`, `retention_days`, `legal_basis`, `deletion_method`, `last_run_at`) + widok admin.
6. **Tabela `dsar_requests`** (`id`, `user_id`, `type` [access/rectify/erasure/portability/restriction/objection], `submitted_at`, `due_at` [+30 dni], `status`, `assigned_to`, `closed_at`, `evidence_ref`).
7. **Tabela `data_breaches`** (`id`, `detected_at`, `severity`, `affected_users`, `description`, `reported_to_uodo_at`, `communicated_to_users_at`, `root_cause`, `remediation`).
8. **Admin legal CMS** (`/admin/legal`) — drzewo dokumentów, edytor markdown z preview, walidacja wymaganych sekcji, workflow draft → publish → notify users, history.
9. **Data flow map** (`/admin/compliance/data-flow` LUB `docs/COMPLIANCE/DATA_FLOW.md` + diagram) — obecnie wiedza tkwi w edge functions + migrations, rozproszona.
10. **Breach-response runbook** (`docs/runbooks/BREACH_RESPONSE.md` + `supabase/functions/breach-notify/` stub) — formalny proces 72h.

### 4.4 Co jest niebezpieczne jeśli launch odbędzie się bez zmian
1. **Kontrola UODO lub skarga konsumencka** — pierwsza rzecz: "pokaż dowody zgody użytkownika X na Regulamin z daty Y, wersję Z". Dziś: brak. Kara art. 83(5) RODO: do 20M EUR lub 4% rocznego obrotu globalnego.
2. **Zmiana regulaminu / cennika** — bez wersjonowania i bind-to-version nie ma jak ponownie wymusić akceptacji. Właściciel wprowadzi nową klauzulę, ale prawnie obowiązywać będzie stara wersja (lub żadna).
3. **Żądanie usunięcia** — dziś użytkownik, który kliknie "Usuń konto" w GDPRCenter, dostaje notyfikację na własnym koncie. Admin nie wie. SLA 30 dni z art. 12(3) RODO nie będzie dotrzymany.
4. **Naruszenie bezpieczeństwa** — bez runbooka i bez rejestru naruszeń (`data_breaches`) nie ma jak udokumentować oceny ryzyka i zgłoszenia do UODO w 72h (art. 33).
5. **Audyt zewnętrzny / due diligence inwestora** — obecny stan "legal pages only" nie przejdzie nawet powierzchownej review od operatora płatności (Stripe) ani klienta B2B (wymagania SOC2 / ISO 27001).
6. **Self-delete bez admin awareness** — jeśli użytkownik płacący w Stripe klika "Usuń", pozostaje subskrypcja po stronie Stripe. `ACCOUNT_DELETION.md` świadomie wspomina tę dziurę jako "follow-up PR-20".

---

## 5. Target Architecture — "Legal Control Center"

### 5.1 Mapa warstw

```
┌────────────────────────────────────────────────────────────────────┐
│  PUBLIC LAYER (unauthenticated visitors)                           │
│  /legal/{privacy,terms,cookies,dpa,rodo,subprocessors}             │
│   • versioned docs from legal_documents (no more new Date())       │
│   • banner CMP + user_consents anon insert                         │
│   • locale switch PL/EN/UK; PL = binding                           │
├────────────────────────────────────────────────────────────────────┤
│  USER LAYER (authenticated contractors)                            │
│  /app/settings/privacy                                             │
│   • "Moje zgody" — current consent state + version accepted        │
│   • "Historia akceptacji" — read-only list of legal_acceptances    │
│   • "Pobierz moje dane" → portability (present)                    │
│   • "Usuń konto" → /app/settings/danger with dsar_requests entry   │
├────────────────────────────────────────────────────────────────────┤
│  OPERATOR/ADMIN LAYER (/admin/legal/*)                             │
│   • /admin/legal/documents (CMS, versioning, publish workflow)     │
│   • /admin/legal/subprocessors (CRUD + public publication)         │
│   • /admin/legal/retention (rules + last cleanup run)              │
│   • /admin/legal/data-flow (viewer)                                │
│   • /admin/legal/dsar (inbox, SLA tracking 30 dni)                 │
│   • /admin/legal/breaches (incident register, 72h timer)           │
│   • /admin/legal/changelog (full legal audit trail)                │
├────────────────────────────────────────────────────────────────────┤
│  DOCS LAYER (repo-side source of truth)                            │
│   • docs/COMPLIANCE/PRIVACY_SOURCE.md, TERMS_SOURCE.md (md master) │
│   • docs/COMPLIANCE/DATA_FLOW.md + /public diagram                 │
│   • docs/runbooks/BREACH_RESPONSE.md                               │
│   • docs/runbooks/DSAR_HANDLING.md                                 │
│   • docs/ADR/ADR-XXXX-legal-control-center.md (decyzje design)     │
└────────────────────────────────────────────────────────────────────┘
```

### 5.2 Model danych (nowe tabele — propozycje)

```sql
-- 1. Wersjonowane dokumenty prawne
create table legal_documents (
  id uuid primary key default gen_random_uuid(),
  slug text not null,                     -- 'privacy' | 'terms' | 'cookies' | 'dpa'
  version text not null,                  -- '2026-04-20.1' (data+seq)
  locale text not null,                   -- 'pl' | 'en' | 'uk'
  content_md text not null,
  content_hash text not null,             -- sha256 (dla integrity evidence)
  published_at timestamptz,
  effective_from timestamptz not null,
  published_by uuid references auth.users(id),
  changelog text,                          -- "Dodano punkt o AI providers"
  unique (slug, version, locale)
);

-- 2. Akceptacje użytkowników (bind version ↔ user)
create table legal_acceptances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),   -- null dla anon cookie
  document_slug text not null,
  document_version text not null,
  locale text not null,
  accepted_at timestamptz not null default now(),
  ip_address inet,                          -- NOT user_agent only; IP jest art. 7 evidence
  user_agent text,
  context text,                             -- 'signup' | 'billing' | 'plan_change' | 'banner'
  foreign key (document_slug, document_version, locale)
    references legal_documents (slug, version, locale)
);

-- 3. Rejestr podprocesorów (art. 28 RODO)
create table subprocessors (
  id uuid primary key default gen_random_uuid(),
  name text not null,                       -- 'Supabase', 'Resend', 'OpenAI'
  purpose text not null,
  data_categories text[],                   -- ['email', 'auth_tokens']
  location text not null,                   -- 'EU', 'USA (SCC)', 'UK (adequacy)'
  transfer_mechanism text,                  -- 'SCC 2021/914', 'adequacy decision'
  dpa_url text,
  added_at timestamptz not null default now(),
  removed_at timestamptz,
  replaces uuid references subprocessors(id),
  public boolean not null default true      -- czy publikować w /legal/subprocessors
);

-- 4. Polityka retencji (per entity)
create table retention_rules (
  entity_type text primary key,             -- 'quotes', 'audit_log', 'notifications'
  retention_days int not null,
  legal_basis text not null,                -- 'UoR art. 74' | 'GDPR art. 6(1)(f)'
  deletion_method text not null,            -- 'hard_delete' | 'anonymize' | 'soft_delete'
  last_run_at timestamptz,
  next_run_at timestamptz
);

-- 5. DSAR requests (inbox dla admina)
create table dsar_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  type text not null,                        -- 'access'|'rectify'|'erasure'|'portability'|'restrict'|'object'
  submitted_at timestamptz not null default now(),
  due_at timestamptz not null,               -- submitted + 30d (art. 12(3))
  status text not null default 'open',       -- 'open'|'in_progress'|'closed'|'rejected'
  assigned_to uuid references auth.users(id),
  closed_at timestamptz,
  evidence_ref text,                         -- link do storage object z exported data
  notes text
);

-- 6. Rejestr naruszeń (art. 33/34)
create table data_breaches (
  id uuid primary key default gen_random_uuid(),
  detected_at timestamptz not null,
  severity text not null,                    -- 'low'|'medium'|'high'|'critical'
  affected_users_count int,
  description text not null,
  root_cause text,
  remediation text,
  reported_to_uodo_at timestamptz,           -- obowiązek 72h
  communicated_to_users_at timestamptz,
  closed_at timestamptz
);
```

### 5.3 Audit log — twarda reguła
- **Nowa tabela `compliance_audit_log`** osobna od `admin_audit_log`. RLS: insert tylko przez SECURITY DEFINER functions; SELECT tylko dla ról `admin`/`dpo`; UPDATE/DELETE zakazane (append-only).
- **Triggery na `legal_documents`, `legal_acceptances`, `subprocessors`, `dsar_requests`, `data_breaches`** → auto-log.
- **Usunąć `useAuditLog` → notifications hack** — zastąpić kierowaniem audit przez server-side edge function do `compliance_audit_log`.

### 5.4 Consent model
- **Default: opt-out** dla analytics/marketing; essential zawsze on.
- **Versioned consent**: rekord `user_consents.consent_version = legal_documents.version` dla `privacy_policy` w momencie udzielenia zgody.
- **Withdraw** → update rekordu (`revoked_at`), nie DELETE. Pozostaje trail.
- **Banner** musi pokazać wersję polityki: "Akceptuję Politykę Prywatności v2026-04-20.1".

---

## 6. PR-Based Fix Plan (atomowy)

> Każdy PR ≤ 300 LOC (CLAUDE.md rule #10). Każdy PR ma scope fence — nic więcej.

### PR-L1 — Versioned legal documents foundation
- **Cel:** wprowadzić tabele `legal_documents` + `legal_acceptances` + usunąć `new Date()` z `lastUpdated`.
- **Scope fence:** migracja + seed aktualnych treści i18n → DB; zmiana `/legal/*` na czytanie z DB zamiast z i18n kluczy; zero zmian w banerze, zero w admin UI.
- **Pliki:** `supabase/migrations/<ts>_pr_l1_legal_documents.sql` (create tables + seed), `src/hooks/useLegalDocument.ts`, `src/pages/legal/PrivacyPolicy.tsx`, `TermsOfService.tsx`, `CookiesPolicy.tsx`, `DPA.tsx`.
- **DoD:** każda strona pokazuje `version` i `effective_from` z DB; seed zawiera wersję `2026-04-20.1`; testy unit na `useLegalDocument`.
- **Weryfikacja:** `npm run build` OK; `vitest` 0 failed; runtime: otwarcie `/legal/privacy` pokazuje `Wersja 2026-04-20.1`.
- **Rollback:** usunięcie migracji (idempotentna); powrót do i18n-first rendering (1 git revert).

### PR-L2 — Terms acceptance at signup (binding)
- **Cel:** checkbox "Akceptuję Regulamin (v…) i Politykę Prywatności (v…)" w Register + log do `legal_acceptances`.
- **Scope fence:** tylko Register; zero zmian Settings/GDPRCenter.
- **Pliki:** `src/pages/Register.tsx`, `src/contexts/AuthContext.tsx` (hook po successful register), `supabase/functions/record-legal-acceptance/index.ts` (IP collection).
- **DoD:** bez zaznaczenia checkbox przycisk "Załóż konto" disabled; po rejestracji w `legal_acceptances` są 2 wiersze (terms + privacy) z aktualną wersją.
- **Weryfikacja:** test E2E flow rejestracji + asercja wierszy w DB; snapshot UI.
- **Rollback:** migracja `legal_acceptances` idempotentna; frontend revert.

### PR-L3 — DSAR inbox (replace notification hack)
- **Cel:** `dsar_requests` tabela + `/admin/legal/dsar` widok + edge function tworząca request z GDPRCenter.
- **Scope fence:** zero dotykania samego `delete-user-account`; tylko workflow przed egzekucją.
- **Pliki:** migracja, `src/pages/admin/AdminDSARPage.tsx`, `src/components/admin/DSARInbox.tsx`, `supabase/functions/dsar-submit/index.ts`, zmiana `GDPRCenter.tsx:109-139` (wywołanie edge function zamiast notifications.insert).
- **DoD:** admin widzi kolejkę z SLA timer (green >14d, amber <14d, red <7d / overdue); closeout z evidence link.
- **Weryfikacja:** test integracyjny: user submituje → admin widzi → zamyka → audit log.
- **Rollback:** revert frontend; stare delete-request przez notification nadal działa.

### PR-L4 — Admin Legal CMS (document editor)
- **Cel:** `/admin/legal/documents` — draft, publish workflow, preview, diff vs prev version.
- **Scope fence:** CRUD dla `legal_documents`; **nie** zmieniamy runtime renderingu (to PR-L1 już ustawiło).
- **Pliki:** `src/pages/admin/AdminLegalDocumentsPage.tsx`, `src/components/admin/LegalDocumentEditor.tsx`, `src/components/admin/LegalDocumentList.tsx`.
- **DoD:** admin może stworzyć draft, zobaczyć diff vs opublikowanej wersji, publish tworzy nowy `version`, stary zostaje (nie nadpisuje); każda publikacja loguje się do `compliance_audit_log`.
- **Weryfikacja:** E2E: stwórz draft → preview → publish → zobacz v2 na `/legal/privacy`.
- **Rollback:** revert UI; dane w DB zachowane.

### PR-L5 — Subprocessors registry + DPA dynamic list
- **Cel:** tabela `subprocessors` + `/admin/legal/subprocessors` + sekcja w `/legal/dpa` z dynamiczną listą.
- **Scope fence:** zero zmian w banerze cookie.
- **Pliki:** migracja + seed (Supabase, Resend, OpenAI/Anthropic/Gemini zależnie od konfiguracji, Plausible, Sentry, Stripe, Cloudflare Turnstile), `src/pages/admin/AdminSubprocessorsPage.tsx`, `src/pages/legal/DPA.tsx` (dodanie sekcji).
- **DoD:** `/legal/dpa` pokazuje tabelę z 8+ subprocesorami z `transfer_mechanism`; admin może dodać/usunąć; każda zmiana = zapis do `compliance_audit_log`.
- **Weryfikacja:** snapshot test renderowania; RLS test (anon SELECT na public=true).
- **Rollback:** migracja idempotentna.

### PR-L6 — Retention rules (visibility + enforcement)
- **Cel:** `retention_rules` table + `/admin/legal/retention` + widoczność w `cleanup-expired-data` function.
- **Scope fence:** bez zmiany faktycznych reguł retencji — tylko ich dokumentacja w DB + enforcement kontrola z ostatnim runem.
- **Pliki:** migracja + seed (z `ACCOUNT_DELETION.md`: backups 30d, audit 90d, billing 7y, notifications 180d…), `src/pages/admin/AdminRetentionPage.tsx`, update `supabase/functions/cleanup-expired-data/index.ts` aby czytał z `retention_rules`.
- **DoD:** admin widzi tabelę z `last_run_at`; jeśli job nie wykonał się > 24h — alert.
- **Weryfikacja:** trigger cron locally, sprawdź update `last_run_at`.
- **Rollback:** revert edge function; tabele zostają.

### PR-L7 — Breach register + runbook
- **Cel:** tabela `data_breaches` + `docs/runbooks/BREACH_RESPONSE.md` + `/admin/legal/breaches`.
- **Scope fence:** zero zmian w już istniejącym incident response; budujemy nowy rejestr.
- **Pliki:** migracja, `src/pages/admin/AdminBreachesPage.tsx`, `docs/runbooks/BREACH_RESPONSE.md` (krok-po-kroku: detekcja, ocena, zgłoszenie UODO w 72h, komunikacja do użytkowników, post-mortem).
- **DoD:** admin może utworzyć breach; system pokazuje countdown do 72h; lock na polach po `reported_to_uodo_at`.
- **Weryfikacja:** test: create breach → 72h countdown → mark reported → lock sprawdzony.
- **Rollback:** migracja idempotentna; runbook w repo.

### PR-L8 — Hard audit log (replace notifications hack)
- **Cel:** `compliance_audit_log` tabela (append-only) + `useAuditLog` → edge function (nie localStorage ni notifications).
- **Scope fence:** tylko migracja audit logów user-level; admin_audit_log nietknięty.
- **Pliki:** migracja, `supabase/functions/audit-log/index.ts` (SECURITY DEFINER insert), `src/hooks/useAuditLog.ts` (zmiana targetu).
- **DoD:** `notifications` nie zawiera już wierszy z `title LIKE 'Audit:%'`; audit logs widoczne tylko dla admin; user nie może skasować swoich logów.
- **Weryfikacja:** pentest: spróbuj DELETE z account usera na `compliance_audit_log` → 403.
- **Rollback:** frontend fallback na notifications, ale tabela zostaje.

### PR-L9 — Data flow map + ADR
- **Cel:** dokumentacja + diagram.
- **Scope fence:** wyłącznie docs, zero kodu.
- **Pliki:** `docs/COMPLIANCE/DATA_FLOW.md`, `docs/ADR/ADR-XXXX-legal-control-center.md`, `public/docs/data-flow.svg` (diagram mermaid).
- **DoD:** diagram pokazuje: user → Supabase → edge functions → subprocessors; oznaczone PII categories per strumień.
- **Weryfikacja:** PR review przez właściciela; nie ma testów.
- **Rollback:** revert docs.

### PR-L10 — Records of processing (art. 30) + DPO contact
- **Cel:** `docs/COMPLIANCE/RECORDS_OF_PROCESSING.md` + publiczny formularz kontaktu DPO w `/legal/rodo`.
- **Scope fence:** tylko docs + 1 sekcja w istniejącym GDPRCenter.
- **Pliki:** doc + `src/pages/legal/GDPRCenter.tsx` (dodanie sekcji kontakt DPO).
- **DoD:** rejestr czynności zawiera: purpose, legal_basis, categories, retention, recipients dla każdego procesu (registration, quote creation, email sending, AI analysis, payment).
- **Weryfikacja:** review prawny właściciela.
- **Rollback:** revert 1 file.

---

## 7. Critical Launch Blockers

### 7.1 Blokery launchu (MUST-FIX przed uruchomieniem płatnej wersji w PL/UE)

| # | Luka | PR | Podstawa prawna | Konsekwencja |
|---|------|-----|-----------------|--------------|
| B1 | Brak bind Terms/Privacy przy signup | **PR-L2** | RODO art. 7(1), art. 13 | Brak dowodu zgody → kara do 20M EUR / 4% obrotu (art. 83(5)). |
| B2 | Brak wersjonowania dokumentów legal (`lastUpdated = new Date()`) | **PR-L1** | RODO art. 5(2) accountability | Nie można udowodnić co użytkownik zaakceptował. |
| B3 | DSAR erasure → notyfikacja, brak workflow dla admina | **PR-L3** | RODO art. 12(3) — 1 miesiąc SLA | Automatyczne przekroczenie terminu, kara i skargi. |
| B4 | Brak listy subprocesorów w DPA | **PR-L5** | RODO art. 28(2)(3) | DPA jest nieważny; brak możliwości B2B sprzedaży. |
| B5 | Audit log userski w `notifications` (użytkownik może skasować) | **PR-L8** | RODO art. 5(2), 30(1) | Brak integralności dowodów dla UODO. |
| B6 | Brak runbook naruszeń | **PR-L7** | RODO art. 33 — 72h | Nieudotrzymanie terminu zgłoszenia = kara. |

**Wniosek:** launch komercyjny PL/UE wymaga co najmniej PR-L1, PR-L2, PR-L3, PR-L5, PR-L7, PR-L8 zamkniętych i przetestowanych.

### 7.2 Ważne przed launch (MUST-FIX w ciągu 30 dni po launchu, jeśli launch jest iteracyjny)

| # | Luka | PR | Uzasadnienie |
|---|------|-----|--------------|
| W1 | Brak admin legal CMS (publish workflow) | PR-L4 | Publikacja poprawek polityki wymaga deployu — niewystarczająco zwinne. |
| W2 | Brak tabeli retention rules z widokiem admin | PR-L6 | Retention jest udokumentowana (`ACCOUNT_DELETION.md`), ale egzekucja nie jest monitorowana w UI. |
| W3 | Brak records of processing art. 30 | PR-L10 | Wymagane przy > 250 osób lub przetwarzaniu masowym; prawdopodobnie wymagane już teraz. |
| W4 | Brak data flow map | PR-L9 | Wymaga doświadczonego DPO do audytu UODO — obecnie brak materiału. |
| W5 | Mylący toggle "Marketing" w banerze | (poza scope tego audytu, w `AUDIT_COOKIE_CONSENT_PRIVACY_2026-04-20.md` jako P2-01) | Transparency principle EDPB. |

### 7.3 Dług po launchu (nice-to-have / systemowe ulepszenia)

| # | Luka | Uzasadnienie |
|---|------|--------------|
| D1 | Automatyczny cleanup backups po 30 dniach z weryfikacją | obecnie "Supabase-managed"; brak audytu po stronie produktu. |
| D2 | Integracja Stripe customer deletion w `delete-user-account` | znany follow-up z `ACCOUNT_DELETION.md`. |
| D3 | Re-acceptance flow dla zmiany Regulaminu (prompt w app) | po PR-L1+L4 to naturalne rozszerzenie; bez tego zmiana wersji jest cicha. |
| D4 | PIA (Privacy Impact Assessment) jako dokument + szablon | art. 35 RODO — wymagane dla "high risk" processing (AI analysis może kwalifikować). |
| D5 | Publiczny /legal/subprocessors z RSS/webhook dla klientów B2B | powiadomienia o zmianie subprocesora to standard art. 28. |
| D6 | E2E testy dla całej ścieżki compliance (signup acceptance, DSAR, delete) | obecnie tylko unit test `CookieConsent.test.tsx`. |
| D7 | Feature flag dla re-acceptance po zmianie wersji (grandfathering) | polityka biznesowa — jak traktować istniejących userów po update polityki. |
| D8 | DPIA automation (aktualizacja danych automatycznie po zmianie subprocessors) | long-term compliance automation. |

---

## 8. Ograniczenia audytu i minimalne runtime checki

> Ten audyt jest WYŁĄCZNIE source-code + migrations. Nie uruchamiano aplikacji.

**Co wymagałoby runtime proof (gdy właściciel się zgodzi):**
1. **Sprawdzenie w DevTools** czy przed akceptacją banera nie lecą żadne requesty do `plausible.io` — potwierdza że `initPlausible()` działa tylko po zgodzie.
2. **DB query** `SELECT consent_type, granted, user_id, created_at FROM user_consents ORDER BY created_at DESC LIMIT 50;` — weryfikacja czy anonimowe inserty faktycznie się zapisują po migracji `20260420155000`.
3. **Test E2E signup→DB:** `SELECT * FROM auth.users ORDER BY created_at DESC LIMIT 1;` następnie `SELECT * FROM legal_acceptances WHERE user_id = <new_user>` — (po wdrożeniu PR-L2) sprawdza binding.
4. **Test RLS:** zalogowany user próbuje `DELETE FROM notifications WHERE title LIKE 'Audit:%'` — obecnie przejdzie; cel: po PR-L8 nie powinno być takich wierszy.
5. **Smoke test retention:** `SELECT created_at FROM notifications WHERE created_at < now() - interval '180 days';` — sprawdza czy `cleanup-expired-data` faktycznie działa.

---

## 9. Agent does / Robert does

**Agent (Claude) ZROBIŁ w tej sesji:**
- Audyt read-only wszystkich warstw compliance na podstawie plików w repo.
- Zapisał dokument `docs/AUDIT_COMPLIANCE_ARCHITECTURE_2026-04-20.md`.
- Zapisał plan 10 PR-ów (PR-L1 … PR-L10) z DoD.

**Agent (Claude) NIE ZROBIŁ (zgodnie ze scope fence):**
- Nie zmienił żadnego pliku produktu.
- Nie utworzył migracji.
- Nie utworzył edge function.
- Nie dotknął kodu w `src/components/`, `src/pages/`, `supabase/functions/`, `supabase/migrations/`.

**Robert MUSI zdecydować:**
1. Czy zaakceptować propozycję 10 PR-ów, czy zmienić priorytet / pominąć któryś?
2. Czy najpierw zamknąć PR-L1…L3 (minimum do launchu), czy PR-L1…L8 (pełne minimum compliance)?
3. Kto jest DPO / kontakt w rejestrze naruszeń? (potrzebne dla PR-L10 i publicznego `/legal/rodo`).
4. Czy dostawcy AI (OpenAI/Anthropic/Gemini) są w EU SCC czy adequacy — do uzupełnienia w PR-L5 seed.
5. Czy dziś już zapadła jakaś decyzja re-acceptance po zmianie polityki (grandfathering vs wymuszona re-akceptacja)?

**Robert MUSI zrobić ręcznie (nie w zakresie agent):**
- Review i akceptacja treści seed subprocesorów (PR-L5) przez prawnika.
- Review runbooka naruszeń (PR-L7) przez DPO / prawnika.
- Aktualizacja `docs/COMPLIANCE/ACCOUNT_DELETION.md` jeśli zmienią się reguły po PR-L6.

---

## 10. Evidence Log

- **Symptom:** prompt pyta czy Majster.AI ma prawdziwy system SaaS legal/compliance czy tylko strony dokumentów.
- **Dowód:**
  - `src/pages/legal/*.tsx` (5 plików, 118+113+230+121+309 = 891 linii) — strony istnieją.
  - `src/pages/Register.tsx` (218 linii) — brak bindowania terms.
  - `src/hooks/useAuditLog.ts:52-54` — audit log jako notification (self-admitted hack).
  - `src/components/admin/AdminContentEditor.tsx:22-73` — admin content editor nie dotyka legal.
  - `grep subprocessor|retention_policy|breach supabase/migrations/` → 0 merytorycznych trafień.
  - `grep legal|privacy|terms|cookie|rodo|dpa|gdpr src/pages/admin/` → 0 dopasowań.
- **Zmiana:** utworzono `docs/AUDIT_COMPLIANCE_ARCHITECTURE_2026-04-20.md` z audytem, mapą docelową i planem 10 PR. Żadne zmiany w kodzie produktu.
- **Weryfikacja:** `wc -l docs/AUDIT_COMPLIANCE_ARCHITECTURE_2026-04-20.md` — raport kompletny (oczekiwane >400 linii).
- **Rollback:** `git rm docs/AUDIT_COMPLIANCE_ARCHITECTURE_2026-04-20.md && git commit` — raport to jedyny artefakt; brak wpływu na runtime.

---

*Dokument audytu — Claude Opus 4.7 | Data: 2026-04-20 | Branch: claude/audit-compliance-architecture-m2bX2*
*Zakres: READ-ONLY audit + target architecture + fix plan. Bez zmian w kodzie produktu.*

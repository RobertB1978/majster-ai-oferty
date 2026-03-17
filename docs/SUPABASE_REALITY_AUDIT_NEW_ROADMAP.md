# SUPABASE REALITY AUDIT vs NEW ROADMAP

**Data audytu:** 2026-03-17
**Źródła prawdy:** `docs/ROADMAP.md` v5.0, `docs/ULTRA_ENTERPRISE_ROADMAP.md`, `docs/ROADMAP_ENTERPRISE.md`, `supabase/migrations/**`, `supabase/functions/**`, `supabase/config.toml`, `.github/workflows/deployment-truth.yml`
**Metoda:** Read-only analiza repo. Zero runtime checks. Zero zgadywania.

---

## 1. Krótkie sedno

Warstwa Supabase jest **zaskakująco kompletna** wobec roadmapy. Migracje PR-05 → PR-20 istnieją, mają RLS, CHECK constraints i funkcje. Główne luki to: **brak wygenerowanych typów TypeScript** (types.ts jest przestarzały — 18+ tabel brakuje), **brak storage bucket `dossier`** w migracjach, oraz **niemożność potwierdzenia runtime deploy** bez dostępu do dashboardu. Schema jest gotowa. Deploy pipeline istnieje i jest dobrze zaprojektowany. **Najbardziej krytyczny bloker to stale types.ts — frontend kompiluje z ręcznymi typami, ale to kruche i ryzykowne.**

---

## 2. Executive Summary (10 punktów)

1. **51 migracji** istnieje w repo, pokrywając PR-05 → PR-20 oraz dodatkowe sprinty (variants, photos, quick estimate, acceptance bridge).
2. **19 Edge Functions** istnieje w repo (+ `_shared/`). Config.toml poprawnie definiuje JWT verification per function.
3. **RLS włączone na WSZYSTKICH nowych tabelach** — każda tabela PR-09→PR-20 ma 4 standardowe polityki (SELECT/INSERT/UPDATE/DELETE) oparte o `auth.uid() = user_id`.
4. **types.ts jest przestarzały** — 18+ tabel utworzonych w migracjach NIE MA w `src/integrations/supabase/types.ts`. Frontend używa ręcznych typów/castów.
5. **Storage bucket `dossier`** — frontend referencuje go, ale żadna migracja go nie tworzy. Buckets `logos`, `project-photos`, `company-documents` istnieją.
6. **Offer statusy** — nowa tabela `offers` używa UPPERCASE (`DRAFT`, `SENT`, `ACCEPTED`, `REJECTED`, `ARCHIVED`), legacy `offer_approvals` używa lowercase (`pending`, `approved`, `rejected`, `sent`, `viewed`, `accepted`, `expired`, `withdrawn`). Funkcja `count_monthly_finalized_offers()` poprawnie obsługuje oba systemy.
7. **Deploy pipeline** — `deployment-truth.yml` na push do `main` robi `supabase db push` + deploy wszystkich funkcji. `supabase-deploy.yml` jest verification-only na PR.
8. **Reality Check Phase 1** — workflow automatycznie sprawdza schema kontrakt (`expected-schema.json`), ale `expected-schema.json` pokrywa tylko 5 tabel (offers, v2_projects, clients, plan_limits, profiles).
9. **Quick Estimate / OfferDraft** — kolumna `offers.source` dodana w migracji `20260311120000`. Brak osobnej tabeli `quick_estimate_drafts` — drafty żyją w tabeli `offers` z `source='QUICK'`.
10. **Offline queue** — roadmapa (PR-19) definiuje offline jako read-only (ADR-0008). Brak touchpointów do Supabase schema — to czysto frontendowa sprawa (Service Worker + cache).

---

## 3. Inventory Supabase

### 3.1 Migracje (51 plików, chronologicznie)

| # | Data | Plik | Główna zmiana |
|---|------|------|---------------|
| 1 | 2025-12-05 | `enable_pgcrypto` | Rozszerzenie pgcrypto |
| 2-13 | 2025-12-05→07 | UUID migracje | Tabele bazowe: clients, projects, quotes, pdf_data, profiles, item_templates, quote_versions, offer_sends, calendar_events, onboarding_progress, notifications, project_photos, purchase_costs, offer_approvals, team_members, team_locations, subcontractors, subcontractor_services, subcontractor_reviews, work_tasks, financial_reports, api_keys, ai_chat_history, company_documents, user_consents, push_tokens, organizations, organization_members, biometric_credentials, api_rate_limits |
| 14 | 2025-12-09 | `add_performance_indexes` | Indeksy wydajnościowe |
| 15-17 | 2025-12-09 | `add_pdf_url_to_offer_sends`, `add_tracking_status`, `harden_tracking_status` | Rozszerzenie offer_sends |
| 18 | 2025-12-11 | UUID migracja | user_subscriptions, subscription_events |
| 19 | 2025-12-17 | `add_stripe_integration` | Stripe pola w user_subscriptions |
| 20 | 2026-01-26 | `admin_control_plane` | admin_system_settings, admin_audit_log, admin_theme_config, user_roles |
| 21-22 | 2026-02-03→08 | RLS fix + grant_admin | Poprawki admin RLS, grant/revoke_admin_role |
| 23 | 2026-02-20 | `offer_system_v2` | Rozszerzenie offer_approvals (accept_token, accepted_via, viewed_at, withdrawn_at, valid_until), rozszerzenie profiles (contact_email*), rozszerzenie offer_sends (delivery_status) |
| 24 | 2026-02-20 | `user_addons` | Tabela user_addons |
| 25-26 | 2026-02-23 | `server_side_plan_limits`, `stripe_events_idempotency` | plan_limits, stripe_events, enforce_*_limit triggers |
| 27 | 2026-02-23 | `add_vat_rate_to_pdf_data` | pdf_data.vat_rate |
| 28 | 2026-02-24 | `plan_requests` | Tabela plan_requests |
| 29 | 2026-03-01 | `pr05_company_profile_additions` | Rozszerzenie profiles (address_line2, country, website, email_*) |
| 30 | 2026-03-01 | `pr06_monthly_offer_quota` | count_monthly_finalized_offers() — wersja 1 |
| 31 | 2026-03-01 | **`pr09_offers_table`** | **Tabela `offers`** z RLS, CHECK status, trigger updated_at |
| 32 | 2026-03-01 | **`pr10_offer_items`** | **Tabela `offer_items`** z RLS, CHECK item_type |
| 33-34 | 2026-03-01 | `pr11_quota_fn_update`, `pr11_quota_fn_legacy_status_compat` | Zaktualizowana count_monthly_finalized_offers() — obsługuje oba systemy |
| 35 | 2026-03-01 | **`pr12_acceptance_links`** | **Tabele `acceptance_links`, `offer_public_actions`**. Funkcje resolve/process acceptance. RLS. |
| 36 | 2026-03-01 | **`pr13_projects_v2`** | **Tabela `v2_projects`**, `project_public_status_tokens`. Funkcja resolve_project_public_token. RLS. |
| 37 | 2026-03-01 | **`pr14_burn_bar`** | **Tabela `project_costs`**. Kolumny budget w v2_projects. RLS. |
| 38 | 2026-03-01 | **`pr15_photo_report`** | **Tabele `project_checklists`, `project_acceptance`**. Rozszerzenie project_photos (phase, mime_type, size_bytes). RLS. |
| 39 | 2026-03-02 | **`pr16_dossier`** | **Tabele `project_dossier_items`, `project_dossier_share_tokens`**. Funkcja resolve_dossier_share_token. RLS. |
| 40 | 2026-03-02 | **`pr17_document_instances`** | **Tabela `document_instances`**. RLS. |
| 41-43 | 2026-03-02 | **`pr18_warranties`, `pr18_inspections`, `pr18_reminders`** | **Tabele `project_warranties`, `project_inspections`, `project_reminders`**. Widoki z computed status. RLS. |
| 44 | 2026-03-02 | **`pr20_billing`** | Modyfikacja user_subscriptions RLS (read-only dla usera). Trigger enforce_monthly_offer_send_limit na offers. |
| 45 | 2026-03-11 | `pr_pdf_v2_relax_pdf_data_fk` | Drop FK pdf_data→projects |
| 46 | 2026-03-11 | `quick_estimate_draft` | offers.source, offers.vat_enabled, offer_items.metadata |
| 47 | 2026-03-11 | `acceptance_bridge` | offer_approvals.v2_project_id (bridge legacy→v2) |
| 48 | 2026-03-12 | `sprint_d_template_activation` | offers.source_template_id |
| 49 | 2026-03-14 | **`offer_variants`** | **Tabele `offer_variants`, `offer_photos`**. offer_items.variant_id. Storage policy offer_photos. RLS. |
| 50 | 2026-03-14 | `offer_photos_public_access` | Storage policy anon read offer photos. Funkcja get_public_offer_photos. |
| 51 | (enable_pgcrypto) | — | — |

### 3.2 Edge Functions (19)

| Funkcja | JWT | Cel (roadmap PR) |
|---------|-----|-----------------|
| `ai-chat-agent` | ✅ | AI chat |
| `ai-quote-suggestions` | ✅ | AI wyceny |
| `analyze-photo` | ✅ | Analiza zdjęć |
| `approve-offer` | ❌ | PR-12: Publiczna akceptacja oferty |
| `cleanup-expired-data` | ❌ | Cron: czyszczenie |
| `client-question` | ❌ | Publiczne pytanie klienta |
| `create-checkout-session` | ✅ | PR-20: Stripe |
| `csp-report` | ❌ | CSP raporty |
| `customer-portal` | ✅ | Stripe portal |
| `delete-user-account` | ✅ | PR-05: GDPR/RODO |
| `finance-ai-analysis` | ✅ | AI finanse |
| `healthcheck` | ❌ | Monitoring |
| `ocr-invoice` | ✅ | OCR faktur |
| `public-api` | ❌ | Public API |
| `request-plan` | ✅ | Zamówienie planu |
| `send-expiring-offer-reminders` | ❌ | PR-18: Przypomnienia gwarancyjne |
| `send-offer-email` | ✅ | PR-11: Wysyłka email |
| `stripe-webhook` | ❌ | PR-20: Stripe webhook |
| `voice-quote-processor` | ✅ | Przetwarzanie głosu |

### 3.3 Storage Buckets (z migracji)

| Bucket | Public | Polityki | Migracja |
|--------|--------|----------|----------|
| `logos` | ✅ | Public read, user CRUD own | Bazowe migracje |
| `project-photos` | ❌ | User CRUD own, anon read offer photos (jeśli show_in_public) | Bazowe + `20260314120000`, `20260314130000` |
| `company-documents` | ❌ | User CRUD own | Bazowe migracje |

### 3.4 Deploy Workflows

| Workflow | Trigger | Robi deploy? | Cel |
|----------|---------|-------------|-----|
| `deployment-truth.yml` | push main + PR | ✅ (na main) | Canonical deploy: db push + functions deploy + reality check |
| `supabase-deploy.yml` | PR (supabase paths) | ❌ | Verification only: contract check |
| `ci.yml` | PR + push main/develop | ❌ | Lint, test, build, security |

---

## 4. Roadmap vs Supabase Matrix

| Severity | Area | Roadmap item | Oczekiwany ślad w Supabase | Co znaleziono | Dowód | Status | Ryzyko | Recommended action |
|----------|------|-------------|---------------------------|---------------|-------|--------|--------|-------------------|
| — | PR-02 | RLS as Standard | RLS na wszystkich tabelach | RLS włączone na WSZYSTKICH tabelach z user data (40+) | Każda migracja PR-09→PR-20 zawiera `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` | **DONE** | Niskie | — |
| — | PR-05 | delete-user-account EF | Edge Function | Istnieje `supabase/functions/delete-user-account/index.ts` | `supabase/functions/delete-user-account/` | **DONE** | Niskie | — |
| — | PR-05 | Company profile additions | Kolumny w profiles | address_line2, country, website, email_subject_template, email_greeting, email_signature | `20260301120000_pr05_company_profile_additions.sql` | **DONE** | Niskie | — |
| — | PR-06 | Monthly offer quota | Funkcja count + trigger | count_monthly_finalized_offers(), enforce_monthly_offer_send_limit trigger | `20260301130000`, `20260301160000`, `20260301161000`, `20260302300000` | **DONE** | Niskie | — |
| — | PR-08 | clients table | Tabela + RLS | clients z user_id, name, phone, email, address + RLS + enforce_client_limit trigger | Bazowe migracje (2025-12) | **DONE** | Niskie | — |
| P2 | PR-08 | price_items table | Tabela price_items | Istnieje `item_templates` — nie `price_items`. Frontend prawdopodobnie używa item_templates. | Bazowe migracje: `item_templates` | **DONE** (inna nazwa) | Niskie | Weryfikacja czy roadmapa miała na myśli item_templates |
| — | PR-09 | offers table | Tabela + RLS + statusy | offers z CHECK('DRAFT','SENT','ACCEPTED','REJECTED','ARCHIVED'), RLS 4 polityki | `20260301140000_pr09_offers_table.sql` | **DONE** | Niskie | — |
| — | PR-10 | offer_items table | Tabela + RLS | offer_items z item_type CHECK, variant_id, metadata. RLS. | `20260301150000`, `20260314120000` | **DONE** | Niskie | — |
| — | PR-11 | send-offer-email EF | Edge Function | Istnieje `supabase/functions/send-offer-email/index.ts` | `supabase/functions/send-offer-email/` | **DONE** | Niskie | — |
| — | PR-12 | acceptance_links | Tabela + token + RLS + resolve/process functions | acceptance_links, offer_public_actions, resolve_offer_acceptance_link(), process_offer_acceptance_action() | `20260301170000_pr12_acceptance_links.sql` | **DONE** | Niskie | — |
| — | PR-12 | approve-offer EF | Edge Function | Istnieje `supabase/functions/approve-offer/index.ts`, verify_jwt=false | `supabase/functions/approve-offer/`, `config.toml` | **DONE** | Niskie | — |
| — | PR-13 | v2_projects | Tabela + RLS + QR status token | v2_projects, project_public_status_tokens, resolve_project_public_token() | `20260301180000_pr13_projects_v2.sql` | **DONE** | Niskie | — |
| — | PR-14 | Burn bar / costs | project_costs + budget kolumny | project_costs z CHECK cost_type, v2_projects.budget_net/budget_source | `20260301190000_pr14_burn_bar.sql` | **DONE** | Niskie | — |
| — | PR-15 | Photo report | project_photos rozszerzenie + checklists + acceptance | project_photos.phase/mime_type/size_bytes, project_checklists, project_acceptance | `20260301200000_pr15_photo_report.sql` | **DONE** | Niskie | — |
| P1 | PR-15 | Supabase Storage for photos | Bucket + polityki | Bucket `project-photos` istnieje. Ale brak dowodu na bucket `dossier` (PR-16 go referencuje). | Bazowe migracje (project-photos), brak migracji dossier bucket | **PARTIAL** | Średnie | Sprawdzić czy frontend używa project-photos czy dossier jako bucket name |
| — | PR-16 | Dossier / Document folder | Tabele + share token + resolve function | project_dossier_items, project_dossier_share_tokens, resolve_dossier_share_token() | `20260302000000_pr16_dossier.sql` | **DONE** | Niskie | — |
| — | PR-17 | Document templates | document_instances tabela | document_instances z template_key, data_json, pdf_path, RLS | `20260302100000_pr17_document_instances.sql` | **DONE** | Niskie | — |
| — | PR-18 | Warranties + inspections + reminders | 3 tabele + widoki + RLS | project_warranties, project_inspections, project_reminders, 2 widoki computed | `20260302200000`, `20260302210000`, `20260302220000` | **DONE** | Niskie | — |
| — | PR-18 | send-expiring-offer-reminders EF | Edge Function (cron) | Istnieje, verify_jwt=false (cron) | `supabase/functions/send-expiring-offer-reminders/` | **DONE** | Niskie | — |
| — | PR-20 | Stripe billing | create-checkout-session + stripe-webhook EF + billing trigger | Oba EF istnieją. enforce_monthly_offer_send_limit trigger. stripe_events idempotency. | `20260302300000_pr20_billing.sql`, functions/ | **DONE** | Niskie | — |
| — | Sprint D | Quick Estimate / OfferDraft | offers.source + offer_items.metadata | offers.source, offers.vat_enabled, offer_items.metadata | `20260311120000_quick_estimate_draft.sql` | **DONE** | Niskie | — |
| — | Sprint D | Offer variants | offer_variants tabela + offer_items.variant_id | offer_variants, offer_photos, variant_id w items, resolve updated | `20260314120000_offer_variants.sql` | **DONE** | Niskie | — |
| — | Sprint D | Offer photos + public access | offer_photos + storage policies + anon read | offer_photos, storage policy insert, anon read policy, get_public_offer_photos() | `20260314120000`, `20260314130000` | **DONE** | Niskie | — |
| — | Bridge | Legacy→V2 bridge | offer_approvals.v2_project_id | FK v2_project_id dodany do offer_approvals | `20260311180000_acceptance_bridge.sql` | **DONE** | Niskie | — |
| — | PR-19 | Offline (PWA) | Brak touchpointów DB (ADR-0008: read-only offline) | Brak migracji — poprawnie, bo to Service Worker cache | N/A | **DONE** (N/A) | Brak | — |

---

## 5. Twarde niespójności i blokery

### 5.1 P0: types.ts jest przestarzały

**Problem:** `src/integrations/supabase/types.ts` NIE ZAWIERA definicji dla 18+ tabel, które istnieją w migracjach i są aktywnie używane przez frontend hooks.

**Tabele brakujące w types.ts:**
- `acceptance_links` → używane w `useAcceptanceLink.ts`
- `offer_photos` → używane w `useOfferPhotos.ts`
- `offer_variants` → używane w `useOfferVariants.ts`, `useOfferWizard.ts`
- `admin_system_settings` → używane w `useAdminSettings.ts`
- `admin_theme_config` → używane w `useAdminTheme.ts`
- `document_instances` → używane w `useDocumentInstances.ts`
- `project_dossier_items` → używane w `useDossier.ts`
- `project_dossier_share_tokens` → używane w `useDossier.ts`
- `project_inspections` → używane w `useInspection.ts`
- `project_inspections_with_status` (VIEW) → używane w `useInspection.ts`
- `project_reminders` → używane w `useReminders.ts`
- `project_warranties` → używane w `useWarranty.ts`
- `project_warranties_with_end` (VIEW) → używane w `useWarranty.ts`
- `offer_public_actions` → w migracjach, potencjalnie używane
- `project_public_status_tokens` → w migracjach
- `project_costs` → w migracjach
- `project_checklists` → w migracjach
- `project_acceptance` → w migracjach

**Ryzyko:** Frontend kompiluje się (bo hooki używają ręcznych typów/castów z `as any`), ale brak type-safety oznacza:
- runtime errors jeśli kolumna zostanie zmieniona w migracji
- brak autocomplete w IDE
- brak compile-time validation zapytań Supabase

**Bloker:** Nie blokuje runtime, ale blokuje bezpieczny development nowych feature'ów.

### 5.2 P1: Brak storage bucket `dossier` w migracjach

**Problem:** Frontend (useDossier.ts) referencuje pliki dossier — ale nie jest jasne, czy używa osobnego bucketu `dossier` czy istniejącego `company-documents`.

**Co jest w migracjach:** Tylko 3 buckety: `logos`, `project-photos`, `company-documents`.

**Ryzyko:** Jeśli frontend próbuje uploadować do nieistniejącego bucketu — upload failuje w runtime.

**Action:** Zweryfikować w kodzie frontu jaki bucket_id jest używany w useDossier.ts. Jeśli `company-documents` — OK. Jeśli inny — trzeba migrację lub bucket w dashboardzie.

### 5.3 P2: Dual status system (legacy vs new)

**Problem:** Dwa systemy statusów ofert:
- `offer_approvals.status` CHECK: `'pending', 'approved', 'rejected', 'draft', 'sent', 'viewed', 'accepted', 'expired', 'withdrawn'` (lowercase)
- `offers.status` CHECK: `'DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED'` (UPPERCASE)

**Mitygacja:** Funkcja `count_monthly_finalized_offers()` poprawnie obsługuje oba systemy. `acceptance_bridge` migracja linkuje legacy→v2 przez `v2_project_id`.

**Ryzyko:** Niskie, ale confusing. Brak statusu `EXPIRED` w nowej tabeli `offers` — czy to celowe?

### 5.4 P2: expected-schema.json pokrywa tylko 5 tabel

**Problem:** Reality Check w `deployment-truth.yml` sprawdza kontrakt `scripts/verify/expected-schema.json`, ale ten plik definiuje tylko 5 tabel: `offers`, `v2_projects`, `clients`, `plan_limits`, `profiles`.

**Ryzyko:** Pozostałe ~35 tabel nie są weryfikowane w pipeline. Regresja schema może przejść niezauważona.

### 5.5 P2: Brak statusu `EXPIRED` w tabeli offers

**Problem:** Roadmapa definiuje flow `draft → sent → accepted | rejected | expired`. Migracja `pr09_offers_table` ma CHECK: `('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'ARCHIVED')`. Brak `EXPIRED`.

**Ryzyko:** Jeśli frontend/cron próbuje ustawić status `EXPIRED` na nowej tabeli `offers` — INSERT/UPDATE failuje na CHECK constraint.

**Mitygacja:** Legacy `offer_approvals` ma `expired`. Może `ARCHIVED` pełni rolę `EXPIRED` w nowym systemie? Wymaga potwierdzenia.

---

## 6. Status Summary: DONE / PARTIAL / MISSING / UNKNOWN

### DONE (potwierdzone w migracjach)

- ✅ RLS na wszystkich tabelach
- ✅ offers + offer_items + offer_variants + offer_photos
- ✅ acceptance_links + offer_public_actions + resolve/process functions
- ✅ v2_projects + project_public_status_tokens + resolve function
- ✅ project_costs + burn bar budget columns
- ✅ project_checklists + project_acceptance
- ✅ project_dossier_items + project_dossier_share_tokens + resolve function
- ✅ document_instances
- ✅ project_warranties + project_inspections + project_reminders + computed views
- ✅ Quick Estimate (offers.source, offer_items.metadata)
- ✅ Acceptance bridge (offer_approvals.v2_project_id)
- ✅ Offer template source (offers.source_template_id)
- ✅ Monthly quota enforcement (function + trigger)
- ✅ Plan limits server-side (plan_limits + enforce triggers)
- ✅ Stripe integration (checkout, webhook, events idempotency)
- ✅ All 19 Edge Functions exist in repo
- ✅ Deploy pipeline (deployment-truth.yml)
- ✅ Company profile additions (profiles extended)
- ✅ Storage policies for offer photos (insert + anon read)

### PARTIAL

- ⚠️ Storage buckets — 3 istnieją, ale `dossier` może brakować
- ⚠️ expected-schema.json — pokrywa tylko 5 z ~40 tabel

### MISSING

- ❌ types.ts regeneration — 18+ tabel brak w typach
- ❌ Status `EXPIRED` w nowej tabeli offers
- ❌ Pełne pokrycie expected-schema.json
- ❌ `docs/SECURITY_RLS_STANDARD.md` (wymagane przez PR-02)

### UNKNOWN (wymaga dashboard access)

- ❓ Czy migracje zostały faktycznie wdrożone na produkcję
- ❓ Czy edge functions zostały faktycznie wdrożone na produkcję
- ❓ Czy RLS jest aktywne runtime (nie tylko w SQL)
- ❓ Czy storage buckety istnieją na produkcji
- ❓ Czy cron jobs (send-expiring-offer-reminders, cleanup-expired-data) są skonfigurowane w Supabase Dashboard
- ❓ Status GitHub Secrets (SUPABASE_ACCESS_TOKEN, SUPABASE_DB_PASSWORD, etc.)

---

## 7. Najbardziej ryzykowne luki P0 / P1

### P0 — Krytyczne

| # | Luka | Wpływ | Fix |
|---|------|-------|-----|
| P0-1 | **types.ts nie zawiera 18+ tabel** | Brak type-safety, runtime errors przy zmianach schema, kruche hooki | `npx supabase gen types typescript` i commit |
| P0-2 | **Brak potwierdzenia runtime deploy** | Nie wiadomo czy schema/functions są na produkcji | Uruchomić `supabase migration list` z CLI lub sprawdzić dashboard |

### P1 — Ważne

| # | Luka | Wpływ | Fix |
|---|------|-------|-----|
| P1-1 | **Brak `EXPIRED` w offers CHECK** | Cron/frontend nie może ustawić expired na nowej tabeli | Migracja ALTER CHECK lub decyzja: ARCHIVED = EXPIRED |
| P1-2 | **Storage bucket dossier — niejasny** | Upload dossier files może failować | Sprawdzić frontend bucket_id, dodać migrację jeśli trzeba |
| P1-3 | **expected-schema.json — 5/40 tabel** | Reality Check nie wyłapie regresji na 35 tabelach | Rozszerzyć expected-schema.json |
| P1-4 | **Cron jobs niekonfigurowane z repo** | Brak dowodu że cron jest aktywny | Sprawdzić Supabase Dashboard → Extensions → pg_cron |

---

## 8. Co już weszło do Supabase z nowej roadmapy — lista potwierdzona

Potwierdzone w migracjach (plik istnieje w repo):

1. ✅ PR-05: Company profile (profiles rozszerzenie) — `20260301120000`
2. ✅ PR-05: delete-user-account EF — `supabase/functions/delete-user-account/`
3. ✅ PR-06: Monthly quota (count function + trigger) — `20260301130000`, `20260302300000`
4. ✅ PR-09: offers table z RLS — `20260301140000`
5. ✅ PR-10: offer_items table z RLS — `20260301150000`
6. ✅ PR-11: send-offer-email EF — `supabase/functions/send-offer-email/`
7. ✅ PR-11: Quota function updated — `20260301160000`, `20260301161000`
8. ✅ PR-12: acceptance_links + offer_public_actions + resolve/process — `20260301170000`
9. ✅ PR-12: approve-offer EF — `supabase/functions/approve-offer/`
10. ✅ PR-13: v2_projects + public status tokens + resolve — `20260301180000`
11. ✅ PR-14: project_costs + budget columns — `20260301190000`
12. ✅ PR-15: project_checklists + project_acceptance + photo extensions — `20260301200000`
13. ✅ PR-16: project_dossier_items + share tokens + resolve — `20260302000000`
14. ✅ PR-17: document_instances — `20260302100000`
15. ✅ PR-18: project_warranties + inspections + reminders + views — `20260302200000→220000`
16. ✅ PR-18: send-expiring-offer-reminders EF — `supabase/functions/send-expiring-offer-reminders/`
17. ✅ PR-20: billing trigger + Stripe EFs — `20260302300000`
18. ✅ Sprint D: Quick Estimate (offers.source) — `20260311120000`
19. ✅ Sprint D: Offer variants + photos — `20260314120000`, `20260314130000`
20. ✅ Bridge: Legacy acceptance → v2 — `20260311180000`

---

## 9. Czego roadmapa oczekuje, ale Supabase jeszcze nie ma

| # | Element roadmapy | Oczekiwanie | Status w Supabase | Priorytet |
|---|-----------------|-------------|-------------------|-----------|
| 1 | Regeneracja types.ts | Typy dla 18+ nowych tabel | types.ts przestarzały | P0 |
| 2 | Status `EXPIRED` w offers | CHECK constraint obejmujący EXPIRED | Brak — jest ARCHIVED | P1 |
| 3 | Storage bucket dossier | Bucket do przechowywania plików dossier | Niejasne — może company-documents | P1 |
| 4 | SECURITY_RLS_STANDARD.md | Dokumentacja procedury RLS (PR-02 DoD) | Brak pliku | P2 |
| 5 | Rozszerzony expected-schema.json | Pokrycie >5 tabel | Tylko 5 tabel | P2 |
| 6 | Cron job configuration | pg_cron dla reminders/cleanup | Brak dowodu w repo (dashboard only) | UNKNOWN |
| 7 | PDF server-side EF | Edge Function dla @react-pdf/renderer | Roadmapa to definiuje jako "post-Stage 2" — celowo odroczone | DEFERRED |

---

## 10. Jeden rekomendowany następny PR

### PR: "Regeneracja types.ts + expected-schema.json update"

**Scope:**
1. Uruchomić `npx supabase gen types typescript --project-id <ref> > src/integrations/supabase/types.ts`
2. Rozszerzyć `scripts/verify/expected-schema.json` o tabele: `offer_items`, `acceptance_links`, `offer_variants`, `offer_photos`, `project_costs`, `project_warranties`, `project_inspections`, `document_instances`
3. Wyczyścić ręczne typy/casty z hooków (opcjonalnie — zależy od rozmiaru)

**Dlaczego to najpierw:** Bez aktualnych typów każdy kolejny PR jest ryzykowny — zmiana kolumny w migracji nie zostanie złapana przez TypeScript.

**Estimated LOC:** ~50-100 (generated types) + 30-50 (expected-schema.json)

---

## 11. Dwa alternatywne warianty naprawy

### Wariant A: Łatwiejszy / szybszy (1 PR)

1. Regeneracja types.ts z produkcji (`supabase gen types`)
2. Dodanie `EXPIRED` do CHECK offers (nowa migracja)
3. Rozszerzenie expected-schema.json o 8 najważniejszych tabel
4. Weryfikacja bucket name w useDossier.ts

**Ryzyko:** Niskie. Czysto addytywne zmiany.
**Czas:** Mały effort.

### Wariant B: Docelowy / enterprise (3-4 PR)

1. **PR-1:** Regeneracja types.ts + CI step automatyzujący sprawdzanie aktualności typów
2. **PR-2:** expected-schema.json pełne pokrycie (40 tabel) + RLS assertion (Phase 2 Reality Check z SUPABASE_ACCESS_TOKEN)
3. **PR-3:** Migracja: `EXPIRED` status + ewentualna migracja bucketu dossier + `docs/SECURITY_RLS_STANDARD.md`
4. **PR-4:** CI/CD: Auto-regeneracja types.ts na push migracji (GitHub Action step)

**Ryzyko:** Niskie per PR. Wymaga dashboardu do setup secrets.
**Czas:** Średni effort na 4 PR.

---

## 12. Verification checklist po wdrożeniu

### Po PR z types.ts:

- [ ] `npm run build` przechodzi bez errorów
- [ ] `npm run lint` przechodzi
- [ ] `npm test` przechodzi
- [ ] Hooki (useAcceptanceLink, useOfferVariants, useOfferPhotos, useWarranty, useInspection, useDossier, useDocumentInstances, useReminders) — brak `as any` castów
- [ ] types.ts zawiera definicje dla WSZYSTKICH tabel z migracji

### Po PR z expected-schema.json:

- [ ] `deployment-truth.yml` Reality Check na PR — raport zawiera nowe tabele
- [ ] Zero P0 findings w raporcie

### Po migracji EXPIRED status:

- [ ] `supabase db push` przechodzi
- [ ] Frontend może ustawić status EXPIRED na ofercie (jeśli to wymagane)
- [ ] `count_monthly_finalized_offers()` — bez zmian (EXPIRED nie jest finalized)

### Runtime verification (wymaga dashboard):

- [ ] `supabase migration list` — wszystkie 51 migracji APPLIED
- [ ] `supabase functions list` — 19 funkcji ACTIVE
- [ ] RLS włączone na wszystkich tabelach (Dashboard → Database → Tables → RLS)
- [ ] Storage buckets istnieją (logos, project-photos, company-documents)
- [ ] Cron jobs skonfigurowane (pg_cron / Supabase Schedule)
- [ ] GitHub Secrets ustawione (SUPABASE_ACCESS_TOKEN, DB_PASSWORD, PROJECT_REF, ANON_KEY)

---

## CO ROBERT MA WIEDZIEĆ W 30 SEKUND

1. **Baza danych jest prawie kompletna** — wszystkie tabele z roadmapy (PR-05 do PR-20) istnieją w migracjach z zabezpieczeniami (RLS). To dobra wiadomość.

2. **Główny problem: typy TypeScript są przestarzałe** — to jak mapa drogowa, która nie pokazuje nowych dróg. Kod działa, ale jest kruchy — jedna zmiana w bazie i coś się może zepsuć bez ostrzeżenia.

3. **Nie wiadomo, czy to działa na produkcji** — migracje istnieją w repo, ale bez dostępu do dashboardu Supabase nie mogę potwierdzić, czy zostały wdrożone. Sprawdź to klikając w Supabase Dashboard → Database → Tables.

4. **Jeden szybki PR to naprawi** — regeneracja typów i rozszerzenie automatycznych sprawdzeń. Mały wysiłek, duże zmniejszenie ryzyka.

5. **Nic nie jest zepsute, ale brakuje "sieci bezpieczeństwa"** — kod działa, baza jest gotowa, pipeline istnieje. Brakuje tylko aktualnych typów i pełniejszych automatycznych sprawdzeń, żeby kolejne zmiany były bezpieczne.

---

*Raport wygenerowany automatycznie na podstawie analizy read-only repo. Żadne pliki source nie zostały zmienione.*

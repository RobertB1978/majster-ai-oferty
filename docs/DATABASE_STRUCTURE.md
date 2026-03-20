# DATABASE_STRUCTURE.md

Reference documentation for the Majster.AI PostgreSQL schema, derived from
all 55 migration files in `supabase/migrations/`.

> **Last updated:** 2026-03-20
> **RLS:** Enabled on ALL tables — never disable without explicit approval.
> **Migrations:** Immutable once applied — create a new file for any schema change.

---

## Table Count Summary

| Domain | Tables |
|--------|--------|
| Core / Auth | 5 |
| Legacy Offers & Quotes | 7 |
| New Offer System (v2) | 6 |
| Projects V2 | 9 |
| Compliance (Warranties / Inspections) | 3 |
| Finance & Billing | 5 |
| Team & Subcontractors | 5 |
| AI & Integrations | 3 |
| Users & Organisation | 5 |
| Admin | 3 |
| Misc / System | 5 |
| **Total** | **56** |

---

## Tables by Domain

### Core / Auth

| Table | Description |
|-------|-------------|
| `profiles` | Company identity, contact info, email templates. One row per user — auto-created on signup. |
| `user_roles` | RBAC roles (`admin` / `moderator` / `user`) per user |
| `user_consents` | GDPR consent records (cookies, privacy policy, newsletter, etc.) |
| `push_tokens` | Web / iOS / Android push notification tokens |
| `onboarding_progress` | Onboarding wizard step completion state |

### Legacy Offers & Quotes (original flow, still in active use)

| Table | Description |
|-------|-------------|
| `clients` | Client contact book — name, phone, email, address |
| `projects` | Legacy project records linked to clients |
| `quotes` | Quote positions JSONB per project (1:1 per project) |
| `pdf_data` | PDF metadata per legacy project (1:1 per project) |
| `offer_approvals` | E-signature / approval workflow with full lifecycle status |
| `offer_sends` | Email send history with Resend delivery-status tracking |
| `purchase_costs` | OCR-scanned purchase invoices linked to legacy projects |

### New Offer System (Wizard / v2 flow)

| Table | Description |
|-------|-------------|
| `offers` | Standalone offers with full lifecycle status |
| `offer_items` | Line items for offers (labor, material, service, travel, lump_sum) |
| `offer_variants` | Named price variants per offer (max 3) |
| `offer_photos` | Photos attached to offers with PDF / public-page visibility flags |
| `acceptance_links` | Tokenized public acceptance URLs (30-day TTL, 1:1 per offer) |
| `offer_public_actions` | Audit log of client ACCEPT / REJECT events |

### Projects V2

| Table | Description |
|-------|-------------|
| `v2_projects` | Projects hub linked to offers and clients, with stages JSONB |
| `project_public_status_tokens` | QR tokens for public project status page (30-day TTL) |
| `project_costs` | Cost entries per project (MATERIAL / LABOR / TRAVEL / OTHER) |
| `project_photos` | Photos per project with phase tagging (BEFORE / DURING / AFTER / ISSUE) |
| `project_checklists` | Acceptance checklists with template key and items JSONB |
| `project_acceptance` | Client acceptance record with optional signature storage path |
| `project_dossier_items` | Dossier files per project grouped by category |
| `project_dossier_share_tokens` | Share tokens for dossier access scoped to allowed categories |
| `document_instances` | Filled document template instances (contracts, protocols, etc.) |

### Compliance

| Table | Description |
|-------|-------------|
| `project_warranties` | Warranty card per project (1:1) with reminder timestamps |
| `project_inspections` | Periodic inspection records (Polish building law types) |
| `project_reminders` | In-app reminder records for warranties and inspections |

### Finance & Billing

| Table | Description |
|-------|-------------|
| `user_subscriptions` | Stripe subscription state (1:1 per user) |
| `user_addons` | Purchasable add-on packs per user |
| `subscription_events` | Stripe webhook event audit log (idempotency store) |
| `plan_limits` | Authoritative per-plan resource quotas (seeded reference table) |
| `financial_reports` | Cached monthly financial report snapshots |

### Team & Subcontractors

| Table | Description |
|-------|-------------|
| `team_members` | Team members managed by a contractor |
| `team_locations` | GPS location records per team member |
| `subcontractors` | Subcontractor marketplace profiles (public when `is_public = true`) |
| `subcontractor_services` | Services offered by each subcontractor |
| `subcontractor_reviews` | Ratings and reviews for subcontractors |

### AI & Integrations

| Table | Description |
|-------|-------------|
| `ai_chat_history` | AI chat sessions per user |
| `company_documents` | Company credential files (licences, references, certificates) |
| `api_keys` | User-generated API keys for the public API |

### Users & Organisation (multi-tenant)

| Table | Description |
|-------|-------------|
| `organizations` | Multi-tenant organisation records |
| `organization_members` | Organisation membership with role (owner / admin / manager / member) |
| `biometric_credentials` | WebAuthn / passkey credential storage |
| `notifications` | In-app notification records |
| `api_rate_limits` | Request-count windows for Edge Function rate limiting |

### Admin

| Table | Description |
|-------|-------------|
| `admin_system_settings` | Per-org system config (email, feature flags, resource limits) |
| `admin_theme_config` | Per-org UI theme settings |
| `admin_audit_log` | Immutable audit trail for admin setting changes |

### Misc / System

| Table | Description |
|-------|-------------|
| `item_templates` | Reusable line-item templates (contractor's price book) |
| `quote_versions` | Snapshot versions of legacy quotes |
| `work_tasks` | Scheduled work tasks assigned to team members |
| `calendar_events` | Calendar events and deadlines |
| `user_roles` | *(also listed in Core)* |

---

## Major Table Schemas

### `profiles`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid UNIQUE FK→auth.users | One per user |
| `company_name` | text | Default '' |
| `owner_name` | text | |
| `nip` | text | Polish tax identifier (NIP) |
| `street` | text | |
| `address_line2` | text | Optional second address line (added PR-05) |
| `city` | text | |
| `postal_code` | text | |
| `country` | text | Default 'PL' |
| `phone` | text | |
| `email_for_offers` | text | Contact email shown on legacy offers |
| `contact_email` | text | Reply-To on v2 offers; must be verified |
| `contact_email_verified` | boolean | Default false |
| `contact_email_verified_at` | timestamptz | |
| `contact_email_verification_token` | uuid | One-time verification token |
| `contact_email_verification_sent_at` | timestamptz | |
| `bank_account` | text | |
| `logo_url` | text | Supabase Storage URL |
| `website` | text | Added PR-05 |
| `email_subject_template` | text | Default 'Oferta od {company_name}' |
| `email_greeting` | text | |
| `email_signature` | text | |
| `created_at` / `updated_at` | timestamptz | Auto-managed via trigger |

RLS: `auth.uid() = user_id`. Row auto-created on user signup via `handle_new_user()` trigger.

---

### `clients`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `name` | text NOT NULL | |
| `phone` | text | Default '' |
| `email` | text | Default '' |
| `address` | text | Default '' |
| `created_at` | timestamptz | |

RLS: `auth.uid() = user_id`. Insert blocked by `trg_enforce_client_limit` when plan quota reached.

---

### `offers`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `client_id` | uuid FK→clients ON DELETE SET NULL | Nullable |
| `status` | text | `DRAFT \| SENT \| ACCEPTED \| REJECTED \| ARCHIVED` |
| `title` | text | |
| `total_net` | numeric(14,2) | |
| `total_vat` | numeric(14,2) | |
| `total_gross` | numeric(14,2) | |
| `currency` | text | Default 'PLN' |
| `source` | text | `'quick_estimate'` or NULL |
| `vat_enabled` | boolean | VAT toggle state for quick estimate |
| `sent_at` | timestamptz | |
| `accepted_at` | timestamptz | |
| `rejected_at` | timestamptz | |
| `last_activity_at` | timestamptz | Updated on any change |
| `created_at` / `updated_at` | timestamptz | Auto-managed via trigger |

RLS: `auth.uid() = user_id`. BEFORE UPDATE trigger `trg_enforce_monthly_offer_send_limit` blocks free-plan users when 3/month quota is exhausted.

---

### `offer_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `offer_id` | uuid FK→offers ON DELETE CASCADE | |
| `variant_id` | uuid FK→offer_variants ON DELETE CASCADE | NULL = no-variant mode |
| `item_type` | text | `labor \| material \| service \| travel \| lump_sum` |
| `name` | text NOT NULL | |
| `unit` | text | |
| `qty` | numeric | Default 1 |
| `unit_price_net` | numeric | Default 0 |
| `vat_rate` | numeric | |
| `line_total_net` | numeric | Stored computed: `qty × unit_price_net` |
| `metadata` | jsonb | Quick estimate extended fields (`priceMode`, `laborCost`, etc.) |
| `created_at` / `updated_at` | timestamptz | |

RLS: `auth.uid() = user_id`.

---

### `offer_variants`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `offer_id` | uuid FK→offers ON DELETE CASCADE | |
| `user_id` | uuid FK→auth.users | |
| `label` | text | 1–100 chars |
| `sort_order` | int | 0 = first/default |
| `created_at` / `updated_at` | timestamptz | |

Maximum 3 variants per offer (enforced in application layer, not DB). RLS: `auth.uid() = user_id`.

---

### `offer_photos`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `offer_id` | uuid FK→offers ON DELETE CASCADE | |
| `user_id` | uuid FK→auth.users | |
| `storage_path` | text NOT NULL | Path in `project-photos` bucket |
| `show_in_pdf` | boolean | Default false — embed in generated PDF |
| `show_in_public` | boolean | Default false — show on public accept page |
| `caption` | text | Max 200 chars |
| `sort_order` | int | |
| `created_at` | timestamptz | |

RLS: `auth.uid() = user_id`.

---

### `acceptance_links`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `offer_id` | uuid FK→offers ON DELETE CASCADE UNIQUE | One link per offer |
| `token` | uuid UNIQUE | UUID v4 (122-bit entropy) |
| `expires_at` | timestamptz | Default now() + 30 days |
| `created_at` | timestamptz | |

RLS: owner can CRUD own links. Public access through `resolve_offer_acceptance_link(token)` SECURITY DEFINER function only.

---

### `offer_approvals` (legacy flow)

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `project_id` | uuid FK→projects ON DELETE CASCADE | Legacy project FK |
| `user_id` | uuid NOT NULL | |
| `public_token` | uuid UNIQUE | View-only share token |
| `accept_token` | uuid UNIQUE | 1-click email accept token (added sprint 1 v2) |
| `client_name` / `client_email` | text | |
| `status` | text | `pending \| approved \| rejected \| draft \| sent \| viewed \| accepted \| expired \| withdrawn` |
| `signature_data` | text | Base64 signature |
| `client_comment` | text | |
| `accepted_via` | text | `email_1click \| web_button` |
| `viewed_at` | timestamptz | First public URL open |
| `withdrawn_at` | timestamptz | |
| `rejected_reason` | text | |
| `valid_until` | timestamptz | Offer validity deadline |
| `approved_at` | timestamptz | |
| `created_at` | timestamptz | |

RLS: owner SELECT/INSERT/UPDATE/DELETE. BEFORE INSERT trigger `trg_enforce_offer_limit` blocks when plan quota reached.

---

### `v2_projects`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `client_id` | uuid FK→clients ON DELETE SET NULL | Nullable |
| `source_offer_id` | uuid FK→offers ON DELETE SET NULL | Nullable |
| `title` | text NOT NULL | |
| `status` | text | `ACTIVE \| COMPLETED \| ON_HOLD` |
| `start_date` / `end_date` | date | |
| `progress_percent` | integer | 0–100 |
| `stages_json` | jsonb | Array of `{name, due_date, is_done, sort_order}` |
| `total_from_offer` | numeric(14,2) | Stored at creation — NOT exposed in QR view |
| `budget_net` | numeric(14,2) | Editable budget |
| `budget_source` | text | `OFFER_NET \| MANUAL` |
| `budget_updated_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

RLS: `auth.uid() = user_id`.

---

### `project_costs`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `project_id` | uuid FK→v2_projects ON DELETE CASCADE | |
| `cost_type` | text | `MATERIAL \| LABOR \| TRAVEL \| OTHER` |
| `amount_net` | numeric(14,2) | >= 0 |
| `note` | text | |
| `incurred_at` | date | |
| `created_at` / `updated_at` | timestamptz | |

RLS: `auth.uid() = user_id`.

---

### `project_dossier_items`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `project_id` | uuid FK→v2_projects ON DELETE CASCADE | |
| `category` | text | `CONTRACT \| PROTOCOL \| RECEIPT \| PHOTO \| GUARANTEE \| OTHER` |
| `file_path` | text NOT NULL | Path in `dossier` bucket (private) |
| `file_name` | text NOT NULL | |
| `mime_type` | text | |
| `size_bytes` | integer | |
| `source` | text | `MANUAL \| PHOTO_REPORT \| OFFER_PDF \| SIGNATURE` |
| `created_at` | timestamptz | |

RLS: `auth.uid() = user_id`.

---

### `document_instances`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `project_id` | uuid FK→v2_projects ON DELETE SET NULL | Nullable |
| `client_id` | uuid | Soft FK (no constraint) |
| `offer_id` | uuid | Soft FK (no constraint) |
| `template_key` | text NOT NULL | e.g. `contract_fixed_price` |
| `template_version` | text | Default '1.0' |
| `locale` | text | `pl \| en \| uk` |
| `title` | text | User-set custom title |
| `data_json` | jsonb | Filled form field values |
| `references_json` | jsonb | Snapshot of legal references at fill time |
| `pdf_path` | text | Path in dossier bucket after generation; NULL until generated |
| `dossier_item_id` | uuid | Set after save-to-dossier (soft FK) |
| `created_at` / `updated_at` | timestamptz | |

RLS: `auth.uid() = user_id`.

---

### `project_warranties`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `project_id` | uuid FK→v2_projects ON DELETE CASCADE UNIQUE | One warranty per project |
| `client_email` / `client_name` / `contact_phone` | text | |
| `warranty_months` | integer | 1–120; default 24 |
| `start_date` | date | Default CURRENT_DATE |
| `scope_of_work` / `exclusions` | text | |
| `pdf_storage_path` | text | Path in dossier bucket |
| `reminder_30_sent_at` / `reminder_7_sent_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

RLS: `auth.uid() = user_id`. View `project_warranties_with_end` exposes computed `end_date`.

---

### `project_inspections`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid FK→auth.users | |
| `project_id` | uuid FK→v2_projects ON DELETE SET NULL | Nullable |
| `inspection_type` | text | `ANNUAL_BUILDING \| FIVE_YEAR_BUILDING \| FIVE_YEAR_ELECTRICAL \| ANNUAL_GAS_CHIMNEY \| LARGE_AREA_SEMIANNUAL \| OTHER` |
| `object_address` | text | Used when no project_id |
| `due_date` | date NOT NULL | |
| `completed_at` | timestamptz | |
| `status` | text | `PLANNED \| DONE \| OVERDUE` |
| `protocol_pdf_path` | text | |
| `reminder_30_sent_at` / `reminder_7_sent_at` | timestamptz | |
| `notes` | text | |
| `created_at` / `updated_at` | timestamptz | |

RLS: `auth.uid() = user_id`. View `project_inspections_with_status` computes real-time status.

---

### `user_subscriptions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `user_id` | uuid UNIQUE | One row per user |
| `plan_id` | text | `free \| pro \| starter \| business \| enterprise` |
| `status` | text | `active \| cancelled \| expired \| trial` |
| `stripe_customer_id` | text | |
| `stripe_subscription_id` | text | |
| `current_period_start` / `current_period_end` | timestamptz | |
| `cancel_at_period_end` | boolean | |
| `trial_end` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | |

RLS: authenticated users SELECT only. INSERT/UPDATE by service_role only — direct user writes are blocked to prevent self-upgrade.

---

### `plan_limits`

Authoritative per-plan resource quotas. Mirrors `src/hooks/usePlanGate.ts`. Change here first, then update the frontend constant.

| plan_id | max_projects | max_clients | max_offers |
|---------|-------------|-------------|-----------|
| `free` | 3 | 5 | 3 |
| `pro` / `starter` | 15 | 30 | 15 |
| `business` | 100 | 200 | 100 |
| `enterprise` | unlimited | unlimited | unlimited |

RLS: SELECT open to all (not sensitive). Writes via migrations only.

---

## RLS Status

All tables have Row Level Security enabled. The standard policy pattern across all user-owned tables:

```sql
-- User sees and modifies only their own rows
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id)
```

Notable exceptions:

| Table | Special access |
|-------|---------------|
| `plan_limits` | SELECT open to all (config data) |
| `subcontractors` | Public SELECT when `is_public = true` |
| `subcontractor_services` / `subcontractor_reviews` | Public SELECT |
| `user_subscriptions` | Authenticated SELECT only; writes blocked for users |
| `offer_approvals` | Public SELECT/UPDATE via token-validated policies |
| `acceptance_links` + `offer_public_actions` | Public write via SECURITY DEFINER functions only |
| `api_rate_limits` | Service_role manages; no user policies |
| `admin_*` tables | Admin/owner role within `organization_members` |

---

## Key Relationships

```
auth.users
├── profiles                (1:1 — auto-created on signup)
├── user_subscriptions      (1:1)
├── clients                 (1:N)
│     └── offers (v2)  ←── via offers.client_id
│     └── v2_projects  ←── via v2_projects.client_id
├── projects (legacy, 1:N)
│     ├── quotes             (1:1 per project)
│     ├── pdf_data           (1:1 per project)
│     ├── offer_approvals    (1:N — legacy offer flow)
│     └── calendar_events    (1:N)
├── offers (v2, 1:N)
│     ├── offer_items        (1:N) → optional offer_variants grouping
│     ├── offer_variants     (1:N, max 3)
│     ├── offer_photos       (1:N)
│     └── acceptance_links   (1:1 per offer)
│           └── offer_public_actions (1:N — client ACCEPT/REJECT log)
└── v2_projects (1:N)
      ├── source_offer_id  → offers (optional)
      ├── client_id        → clients (optional)
      ├── project_costs              (1:N)
      ├── project_photos             (1:N — extended with phase metadata)
      ├── project_checklists         (1:N per template_key)
      ├── project_acceptance         (1:1)
      ├── project_dossier_items      (1:N)
      ├── project_dossier_share_tokens (1:N)
      ├── project_public_status_tokens (1:1)
      ├── project_warranties         (1:1)
      ├── project_inspections        (1:N)
      └── document_instances         (1:N)
```

---

## SECURITY DEFINER Functions (public-facing)

These functions are callable with the anon key and bypass RLS in a controlled, read-only or audited way:

| Function | Caller | Purpose |
|----------|--------|---------|
| `resolve_offer_acceptance_link(token)` | Browser (anon) | Returns safe offer + items for public acceptance page |
| `process_offer_acceptance_action(token, action, comment)` | Browser (anon) | Records ACCEPT/REJECT and updates offer status |
| `resolve_project_public_token(token)` | Browser (anon) | Returns project status for QR page — no prices |
| `resolve_dossier_share_token(token)` | Browser (anon) | Returns dossier file list scoped to `allowed_categories` |
| `count_monthly_finalized_offers(user_id)` | Trigger / RPC | Monthly sent-offer count for quota enforcement |
| `enforce_monthly_offer_send_limit()` | BEFORE UPDATE trigger on `offers` | Free-plan monthly send gate |
| `enforce_project_limit()` | BEFORE INSERT trigger on `projects` | Project quota gate |
| `enforce_client_limit()` | BEFORE INSERT trigger on `clients` | Client quota gate |
| `enforce_offer_limit()` | BEFORE INSERT trigger on `offer_approvals` | Offer quota gate (legacy) |
| `get_user_plan_limits(user_id)` | Trigger internals | Returns the active `plan_limits` row for a user |
| `save_offer_items(offer_id, user_id, variants, items)` | RPC | Atomic offer save with variant + items replacement |
| `check_and_increment_rate_limit(...)` | Edge Functions | Atomic rate-limit window counter |

---

## Database Views

| View | Source | Purpose |
|------|--------|---------|
| `project_warranties_with_end` | `project_warranties` | Adds computed `end_date` column |
| `project_inspections_with_status` | `project_inspections` | Computes real-time PLANNED / DONE / OVERDUE status |

---

## Storage Buckets

| Bucket | Access | Usage |
|--------|--------|-------|
| `logos` | Public | Company logo images |
| `project-photos` | Private (signed URLs) | Project photos, offer photos, client signatures |
| `company-documents` | Private | Contractor licence / credential files |
| `dossier` | Private | Dossier items, warranty PDFs, document instance PDFs |

---

## Migration Notes

- **55 migration files** in `supabase/migrations/`, ordered by timestamp
- **Migrations are immutable** — never edit an applied file; always create a new one
- **Filename format:** `YYYYMMDDHHMMSS_description.sql` (early files used UUID names)
- Schema evolved from a simple quote builder (Dec 2025) through a full construction management platform with compliance features (Mar 2026)
- Run migrations **before** deploying code changes that depend on new schema

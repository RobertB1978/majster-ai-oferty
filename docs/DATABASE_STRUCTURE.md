# DATABASE_STRUCTURE.md

> **Last updated:** 2026-04-17
> **Total tables:** 53 (public schema)
> **Migrations:** 51 files in `supabase/migrations/` (chronological, immutable)
> **RLS:** Enabled on ALL tables — never disable without explicit approval

---

## Table Count by Domain

| Domain | Tables |
|--------|--------|
| Core / Auth | 4 |
| Client & Project Management | 5 |
| Offers & Quotes | 9 |
| Projects V2 | 9 |
| Finance & Billing | 7 |
| Team & Subcontractors | 5 |
| AI & Integrations | 4 |
| Notifications & Push | 2 |
| Admin & Security | 5 |
| Misc / Onboarding | 3 |
| **TOTAL** | **53** |

---

## Domain: Core / Auth

### `profiles`
User profile and company information.
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → auth.users, PK |
| company_name | text | |
| owner_name | text | |
| phone | text | |
| contact_email | text | |
| email_for_offers | text | |
| street, city, postal_code | text | Address |
| logo_url | text | Supabase Storage URL |
| plan_slug | text | `'free'`, `'starter'`, `'pro'`, `'business'` |
| nip | text | Polish tax ID |
| bank_account | text | |
| signature_url | text | |

### `user_roles`
RBAC roles per user.
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | PK |
| user_id | uuid | FK → auth.users, NOT NULL |
| role | app_role | `'admin'`, `'moderator'`, `'user'`; NOT NULL, default `'user'` |
| created_at | timestamptz | |

UNIQUE `(user_id, role)`. RLS enabled — 2 policies: `Users can view their own roles` (SELECT own `user_id`); `Admins can manage all roles` (ALL via `has_role()`).
Function: `public.has_role(_user_id uuid, _role app_role) → boolean` (SECURITY DEFINER, STABLE).
Bootstrap (service_role only): `grant_admin_role(email)` / `revoke_admin_role(email)`.

### `user_consents`
GDPR consent tracking.
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → auth.users |
| consent_type | text | |
| consented_at | timestamptz | |
| revoked_at | timestamptz | |

### `biometric_credentials`
WebAuthn / passkey credentials.
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → auth.users |
| credential_id | text | WebAuthn credential |
| public_key | text | |
| counter | int | Replay protection |

---

## Domain: Client & Project Management

### `clients`
Client contact book.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users (owner) |
| name | text | Required |
| email | text | |
| phone | text | |
| address | text | |

### `projects` *(legacy — use v2_projects for new features)*
Legacy project table. Still updated for backward compatibility.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| client_id | uuid | FK → clients |
| project_name | text | |
| status | text | `'PENDING'`, `'ACTIVE'`, `'DONE'` |
| start_date, end_date | date | |

### `calendar_events`
Scheduling and deadlines.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| project_id | uuid | FK → projects (nullable) |
| title | text | |
| start_at, end_at | timestamptz | |
| event_type | text | |

### `item_templates`
Reusable line items for quick offer/quote entry.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| name | text | |
| unit | text | |
| unit_price_net | numeric | |
| vat_rate | numeric | |
| item_type | text | `'labor'`, `'material'`, `'service'`, etc. |

### `work_tasks`
Task management within projects.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| project_id | uuid | FK → projects |
| title | text | |
| status | text | |
| due_date | date | |

---

## Domain: Offers & Quotes

### `offers`
Main offer records (PR-09).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| client_id | uuid | FK → clients (nullable) |
| title | text | |
| status | text | `'DRAFT'`, `'SENT'`, `'ACCEPTED'`, `'REJECTED'`, `'EXPIRED'` |
| total_net, total_vat, total_gross | numeric | Calculated totals |
| currency | text | Default `'PLN'` |
| valid_until | date | Offer validity |

### `offer_items`
Line items for an offer (PR-10).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| offer_id | uuid | FK → offers |
| variant_id | uuid | FK → offer_variants (nullable — null = no-variant mode) |
| user_id | uuid | FK → auth.users |
| item_type | text | `'labor'`, `'material'`, `'service'`, `'travel'`, `'lump_sum'` |
| name | text | |
| unit | text | |
| qty | numeric | |
| unit_price_net | numeric | |
| vat_rate | numeric | |
| line_total_net | numeric | `qty * unit_price_net` |

### `offer_variants`
Named price variants for an offer (sprint offer-versioning-7RcU5).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| offer_id | uuid | FK → offers |
| user_id | uuid | FK → auth.users |
| label | text | Variant name, e.g. "Wariant A" |
| sort_order | int | Display order |

### `offer_photos`
Photos attached to offers (show_in_public for client-facing display).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| offer_id | uuid | FK → offers |
| user_id | uuid | FK → auth.users |
| storage_path | text | Supabase Storage path |
| show_in_public | boolean | Visible to client in public accept page |
| caption | text | |

### `offer_sends`
Track each email send of an offer (for analytics and tracking).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| offer_id | uuid | FK → offers |
| user_id | uuid | FK → auth.users |
| sent_to_email | text | |
| tracking_status | text | `'sent'`, `'viewed'`, `'accepted'`, `'rejected'` |
| sent_at | timestamptz | |

### `offer_approvals`
Public acceptance link + lifecycle state (PR-12).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| user_id | uuid | FK → auth.users |
| public_token | uuid | URL-safe share token (122-bit entropy) |
| accept_token | uuid | 1-click email accept token |
| status | text | `'pending'`, `'sent'`, `'viewed'`, `'accepted'`, `'rejected'`, `'expired'`, `'withdrawn'` |
| expires_at | timestamptz | Link expiry |
| valid_until | timestamptz | Offer validity |
| approved_at, accepted_at, rejected_at | timestamptz | |
| v2_project_id | uuid | FK → v2_projects (Acceptance Bridge, idempotency) |
| comment | text | Client rejection reason |

> **TODO(PR-09-fix):** Add `offer_id` FK to link directly to `offers` table for proper analytics.

### `offer_public_actions`
Audit log of all public actions (view, accept, reject).
| Column | Type | Notes |
|--------|------|-------|
| approval_id | uuid | FK → offer_approvals |
| action | text | |
| performed_at | timestamptz | |
| ip_address | text | |

### `acceptance_links` *(legacy, superseded by offer_approvals)*
Old acceptance link table. Kept for backward compatibility.

### `quotes`
Legacy quote/estimate records (attached to projects).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects |
| user_id | uuid | FK → auth.users |
| total | numeric | |
| positions | jsonb | Line items (legacy format) |
| summary_labor, summary_materials | numeric | |

---

## Domain: Projects V2

### `v2_projects`
New project hub (PR-13). Replaces most of `projects` for new UI.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| title | text | |
| status | text | `'ACTIVE'`, `'COMPLETED'`, `'ON_HOLD'`, `'CANCELLED'` |
| source_offer_id | uuid | Reference to creating offer (via offer_approvals.id currently) |
| progress_percent | int | 0–100 |
| stages_json | jsonb | `ProjectStage[]` |
| budget_net | numeric | |
| budget_source | text | `'OFFER_NET'`, `'MANUAL'` |
| budget_updated_at | timestamptz | |

### `project_public_status_tokens`
QR-code tokens for public project status page.

### `project_photos`
Photos associated with a project.

### `project_acceptance`
Client acceptance records (checklist + signature).

### `project_checklists`
Acceptance checklist items per project.

### `project_dossier_items`
Document folder items per project (PR-16).

### `project_dossier_share_tokens`
Secure share tokens for dossier export.

### `project_warranties`
Warranty card management (PR-18).

### `project_inspections`
Periodic technical inspection records (PR-18).

---

## Domain: Finance & Billing

### `purchase_costs`
Material and labor cost tracking.

### `financial_reports`
Periodic financial summary reports.

### `pdf_data`
Generated PDF metadata (quotes, offers, invoices).
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| project_id | uuid | FK → projects (nullable since PR: relax FK) |
| user_id | uuid | FK → auth.users |
| pdf_type | text | `'quote'`, `'offer'`, `'invoice'` |
| pdf_url | text | Supabase Storage URL |
| pdf_generated_at | timestamptz | |
| vat_rate | numeric | VAT snapshot at generation time |

### `user_subscriptions`
Subscription plan records.
| Column | Type | Notes |
|--------|------|-------|
| user_id | uuid | FK → auth.users |
| plan_slug | text | `'free'`, `'starter'`, `'pro'`, `'business'` |
| stripe_subscription_id | text | |
| status | text | `'active'`, `'trialing'`, `'canceled'`, `'past_due'` |
| current_period_end | timestamptz | |

### `user_addons`
Purchasable feature add-ons (e.g. extra PDF credits).

### `plan_limits`
Server-side plan limit configuration table.
| Column | Type | Notes |
|--------|------|-------|
| plan_slug | text | PK |
| max_offers_per_month | int | |
| max_projects | int | |
| max_clients | int | |

### `stripe_events`
Idempotency store for Stripe webhook events (PR-20).

---

## Domain: Team & Subcontractors

### `team_members`
Team members associated with a contractor.

### `team_locations`
GPS/location check-ins for team members.

### `subcontractors`
Subcontractor contact book.

### `subcontractor_services`
Services offered by each subcontractor.

### `subcontractor_reviews`
Reviews/ratings for subcontractors.

---

## Domain: AI & Integrations

### `ai_chat_history`
Conversation history for AI chat agent.

### `api_keys`
API keys for public API access (public-api Edge Function).

### `api_rate_limits`
Rate limiting counters for Edge Functions.
| Column | Type | Notes |
|--------|------|-------|
| identifier | text | `user:<uuid>` or `ip:<ip>` |
| endpoint | text | Edge Function name |
| request_count | int | Atomic via `check_and_increment_rate_limit()` RPC |
| window_start | timestamptz | |

### `document_instances`
Document template instances (PR-17).

---

## Domain: Notifications & Push

### `notifications`
In-app notifications.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| title | text | |
| message | text | |
| type | text | `'info'`, `'success'`, `'warning'`, `'error'` |
| read | boolean | |
| action_url | text | |

### `push_tokens`
FCM/APNS push notification tokens for mobile (Capacitor).

---

## Domain: Admin & Security

### `user_roles` *(see Core section)*

### `admin_system_settings`
Global admin configuration.

### `admin_theme_config`
Admin-configurable UI theme.

### `admin_audit_log`
Audit trail for admin actions.

### `biometric_credentials` *(see Core section)*

---

## Domain: Misc / Onboarding

### `onboarding_progress`
User onboarding step completion tracking.

### `project_reminders`
In-app reminders for warranties and inspections (PR-18).

### `subscription_events`
Stripe subscription lifecycle event log.

---

## Key Relationships

```
auth.users
├── profiles (1:1)
├── clients (1:N)
│   └── offers (N:1)
│       ├── offer_items (1:N)
│       ├── offer_variants (1:N) → offer_items
│       ├── offer_photos (1:N)
│       ├── offer_sends (1:N)
│       └── offer_approvals (1:N)
│           └── v2_projects (created on acceptance)
├── projects (1:N, legacy)
│   ├── quotes (1:1 per project)
│   └── pdf_data (1:N)
├── v2_projects (1:N, new)
│   ├── project_photos
│   ├── project_warranties
│   ├── project_inspections
│   ├── project_dossier_items
│   └── project_acceptance
└── user_subscriptions (1:1)
```

---

## RLS Policies — Naming Convention

All tables have RLS enabled. Policy naming format:
```sql
-- <table>_<action>_<scope>
-- Example: projects_select_own_organization
```

Enforcement rule: users can only access rows where `user_id = auth.uid()`.
Organization members can additionally access shared org data.

---

## Migration Rules (CRITICAL)

1. **NEVER modify** existing migration files — they are immutable once applied
2. **Always create NEW** migration files for schema changes
3. **Filename format:** `YYYYMMDDHHMMSS_<description>.sql`
4. **Run migrations BEFORE** deploying code changes that depend on them
5. **Recent custom functions:**
   - `save_offer_items(p_offer_id, p_user_id, p_variants, p_items)` — atomic offer save (2026-03-20)
   - `check_and_increment_rate_limit(p_identifier, p_endpoint, p_max_requests, p_window_ms)` — atomic rate limiting (2026-03-20)

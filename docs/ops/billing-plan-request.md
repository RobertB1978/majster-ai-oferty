# Billing — Plan Request Flow

## Overview

This document describes how plan upgrade CTAs work in Majster.AI before and after Stripe is configured.

---

## Current State (No Stripe Account Yet)

All "Wybierz plan" buttons on the `/app/plan` page open an **in-app request modal** instead of a mailto link or external payment page.

### User flow

1. User clicks "Wybierz {PlanName}" on the Plan page.
2. A modal appears with optional phone and message fields.
3. The form submits a POST request to the `request-plan` Edge Function (authenticated with the user's JWT).
4. The function:
   - Rate-limits the caller (5 requests/minute/user).
   - Validates `plan_slug` against a whitelist (`starter | pro | business | enterprise`).
   - Inserts a row into the `plan_requests` table using the service role.
5. The modal shows a success message:
   > _"Zgłoszenie zapisane. Skontaktujemy się: kontakt.majster@gmail.com"_

No external application (mail client, browser tab) is opened at any point.

---

## Feature Flag

```env
# .env (frontend)
VITE_STRIPE_ENABLED=false   # default — uses Plan Request flow
VITE_STRIPE_ENABLED=true    # future — routes to Stripe Checkout
```

The flag is evaluated at build time by Vite. When set to `true`, clicking a plan CTA calls the existing `create-checkout-session` Edge Function instead.

---

## Database

Table: `plan_requests`

| Column       | Type        | Notes                                      |
|--------------|-------------|---------------------------------------------|
| `id`         | uuid PK     | Auto-generated                              |
| `created_at` | timestamptz | Auto-set to now()                           |
| `user_id`    | uuid        | References `auth.users(id)` ON DELETE CASCADE |
| `email`      | text        | Copied from `auth.users.email` server-side  |
| `phone`      | text        | Optional, user-provided, max 20 chars       |
| `plan_slug`  | text        | Whitelisted: starter / pro / business / enterprise |
| `locale`     | text        | Derived from Accept-Language header         |
| `message`    | text        | Optional, max 500 chars                     |
| `status`     | text        | `new` → `contacted` → `converted` / `rejected` |

### RLS Policies

- `authenticated` users can **INSERT** their own rows.
- `authenticated` users can **SELECT** their own rows.
- Users with `app_metadata.role = 'admin'` can **SELECT** and **UPDATE** all rows.

---

## Edge Function

**Path:** `supabase/functions/request-plan/index.ts`

**Rate limit:** 5 requests per minute per user (configured in `_shared/rate-limiter.ts`).

**Validation:**
- `plan_slug` — must be one of the allowed slugs.
- `phone` — optional, max 20 characters.
- `message` — optional, max 500 characters.

**Auth:** Requires a valid Supabase JWT (`Authorization: Bearer <token>`). Unauthenticated requests receive HTTP 401.

---

## How to Enable Stripe Later

1. Create a Stripe account and obtain the API keys.
2. Add Stripe secrets to Supabase:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_live_...
   supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_...
   ```
3. Configure your Stripe product/price IDs in the existing `create-checkout-session` function.
4. Set the frontend flag:
   ```env
   VITE_STRIPE_ENABLED=true
   ```
5. Redeploy the frontend. No UI changes are needed — the same CTA buttons will now invoke Stripe Checkout.

---

## Contact

Plan requests are reviewed manually. Contact email: **kontakt.majster@gmail.com**

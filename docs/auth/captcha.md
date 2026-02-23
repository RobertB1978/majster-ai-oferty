# CAPTCHA — Cloudflare Turnstile (Δ8)

## Overview

Cloudflare Turnstile is integrated as a lightweight CAPTCHA to throttle
automated brute-force attacks on authentication endpoints.

**Trigger rules:**

| Flow     | When CAPTCHA appears                              |
|----------|---------------------------------------------------|
| Sign-up  | Always (on every `/register` page load)           |
| Login    | After **3 consecutive failed** login attempts     |

Turnstile is privacy-friendly (no tracking, no image puzzles) and resolves
automatically for most real users ("Managed" mode).

---

## Environment Variables

Set these in Vercel (or `.env` for local dev). **Never commit real values.**

| Variable                  | Required | Description                                      |
|---------------------------|----------|--------------------------------------------------|
| `VITE_TURNSTILE_ENABLED`  | No       | Set to `true` to enable CAPTCHA. Default: off.   |
| `VITE_TURNSTILE_SITE_KEY` | No*      | Public site key from Cloudflare Turnstile dashboard. Required when `VITE_TURNSTILE_ENABLED=true`. |

> *Both vars must be set for the widget to appear.

---

## Rollback

To disable CAPTCHA without a code deploy:

1. Set `VITE_TURNSTILE_ENABLED=` (empty or remove) in Vercel env vars.
2. Redeploy (Vercel rebuilds in ~60 s).

No users are blocked and no code changes are needed.

---

## Local Development

Leave both vars unset (or set `VITE_TURNSTILE_ENABLED=false`).
The widget is hidden and forms submit normally.

For end-to-end testing with a live widget, Cloudflare provides test site keys:

| Site Key                   | Behaviour                  |
|----------------------------|----------------------------|
| `1x00000000000000000000AA` | Always passes              |
| `2x00000000000000000000AB` | Always blocks              |
| `3x00000000000000000000FF` | Forces interactive challenge |

---

## Architecture

```
src/components/auth/TurnstileWidget.tsx   ← React component (CDN script, no npm dep)
src/pages/Login.tsx                       ← Shows widget after 3 failed attempts
src/pages/Register.tsx                    ← Always shows widget
e2e/captcha.spec.ts                       ← Playwright smoke tests
docs/auth/captcha.md                      ← This file
```

The Turnstile script is loaded lazily from the Cloudflare CDN
(`challenges.cloudflare.com`) only when `VITE_TURNSTILE_ENABLED=true`.
No npm package is added.

---

## Cloudflare Dashboard Setup

1. Log in to <https://dash.cloudflare.com> → **Turnstile**.
2. Click **Add widget**.
3. Enter a name (e.g. `majster-ai-prod`).
4. Add your domain (e.g. `majster-ai-oferty.vercel.app`).
5. Choose **Managed** challenge type.
6. Copy the **Site Key** → set as `VITE_TURNSTILE_SITE_KEY`.
7. Copy the **Secret Key** → store in Supabase Edge Function secrets if
   server-side validation is added in the future (not required for the
   current client-side-only integration).

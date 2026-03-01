# AUTH_SETUP.md — Social Login Setup Guide

**Majster.AI — PR-04 Social Login PACK (Google + Apple + email/password)**

> **Audience:** Project owner (non-technical). Steps below are copy-paste ready.
> **Status:** Implemented — requires provider credentials to activate.

---

## Overview

The app supports three login methods:
1. **Email + Password** — already active (no setup needed)
2. **Google OAuth** — requires Google Cloud Console setup
3. **Apple Sign In** — requires Apple Developer Program setup

Both Google and Apple are shown together (Apple Store requirement: if Google is shown, Apple must be too).

---

## Required Redirect URL

All OAuth providers must whitelist this callback URL in their settings:

```
# Production
https://<your-app>.vercel.app/auth/callback

# Local development
http://localhost:8080/auth/callback
```

> Replace `<your-app>` with your actual Vercel project name (e.g., `majster-ai-oferty`).

---

## Part 1 — Google OAuth Setup

### Step 1: Google Cloud Console

1. Go to [https://console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project (or use an existing one)
3. Navigate to **APIs & Services → Credentials**
4. Click **Create Credentials → OAuth 2.0 Client ID**
5. Application type: **Web application**
6. Under **Authorized redirect URIs**, add:
   ```
   https://<your-supabase-project>.supabase.co/auth/v1/callback
   ```
   (Get your Supabase project URL from Supabase Dashboard → Settings → API)
7. Click **Create** — copy the **Client ID** and **Client Secret**

### Step 2: Enable in Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard) → your project
2. Navigate to **Authentication → Providers → Google**
3. Toggle **Enable Google provider** to ON
4. Paste the **Client ID** and **Client Secret** from Step 1
5. Click **Save**

### Required env vars (Google)
None — Google credentials are stored in Supabase, not in the frontend.

---

## Part 2 — Apple Sign In Setup

> **Note:** Apple Sign In requires an active Apple Developer Program membership ($99/year).

### Step 1: Register a Services ID in Apple Developer Console

1. Go to [https://developer.apple.com](https://developer.apple.com) → **Account → Certificates, IDs & Profiles**
2. Navigate to **Identifiers → Services IDs**
3. Click **+** to register a new Services ID
4. Description: `Majster.AI Web Login`
5. Identifier: `com.majsterai.web` (or similar reverse-domain format)
6. Enable **Sign In with Apple**
7. Click **Configure** — add the following:
   - **Primary App ID:** your main App ID (create one if needed)
   - **Domains and Subdomains:** `<your-app>.vercel.app`
   - **Return URLs:**
     ```
     https://<your-supabase-project>.supabase.co/auth/v1/callback
     ```
8. Save and register

### Step 2: Create a Private Key

1. In Apple Developer Console → **Keys**
2. Click **+** to create a new key
3. Key name: `Majster.AI Supabase Key`
4. Enable **Sign In with Apple**
5. Configure → select your primary App ID
6. Register and **download the `.p8` key file** (you can only download once!)
7. Note the **Key ID**

### Step 3: Enable in Supabase Dashboard

1. Go to Supabase Dashboard → **Authentication → Providers → Apple**
2. Toggle **Enable Apple provider** to ON
3. Fill in:
   - **Services ID:** the identifier from Step 1 (e.g., `com.majsterai.web`)
   - **Team ID:** your Apple Team ID (visible in top-right of Developer Console)
   - **Key ID:** from Step 2
   - **Private Key:** open the `.p8` file in a text editor, paste the full content
4. Click **Save**

### Required env vars (Apple)
None — Apple credentials are stored in Supabase, not in the frontend.

---

## Part 3 — Capacitor / Mobile Deep Links

If the app is shipped as a native mobile app via Capacitor, OAuth redirects need a native deep link scheme.

**Required additional steps (not automated — do when mobile build is ready):**

1. Set a custom URL scheme in `capacitor.config.ts`:
   ```typescript
   // Example: majsterai://auth/callback
   server: {
     url: 'majsterai://app',
   }
   ```
2. Register the custom scheme in:
   - iOS: `Info.plist` → `CFBundleURLTypes`
   - Android: `AndroidManifest.xml` → intent filters
3. Update the Supabase redirect URL to include:
   ```
   majsterai://auth/callback
   ```
4. Update `loginWithGoogle` / `loginWithApple` in `AuthContext.tsx` to use:
   ```typescript
   redirectTo: 'majsterai://auth/callback'
   ```
   when running inside Capacitor (`Capacitor.isNativePlatform()`).

---

## Common Failure Modes

| Symptom | Likely Cause | Fix |
|---------|-------------|-----|
| "Provider disabled" error | Provider not enabled in Supabase Dashboard | Enable in Auth → Providers |
| "Redirect URI mismatch" | Callback URL not whitelisted | Add `/auth/callback` URL to provider config |
| Apple Sign In returns error after redirect | Wrong Services ID or Team ID | Double-check all 4 Apple fields in Supabase |
| Google shows "app not verified" warning | OAuth app not verified by Google | For production: verify via Google Console |
| Login works but user stays on callback page | `onAuthStateChange` not firing | Check Supabase client configuration in `client.ts` |
| "Invalid client_id" (Apple) | Services ID mismatch | Ensure Services ID matches exactly what's in Apple Console |
| No user created after Apple login | Apple returns private relay email | Expected — Supabase handles this; user will have a relay email |

---

## Supabase Dashboard — Quick Links

- Auth Providers: `https://supabase.com/dashboard/project/<project-id>/auth/providers`
- Auth Settings: `https://supabase.com/dashboard/project/<project-id>/auth/url-configuration`
- Add your site URL and redirect URL in **URL Configuration** tab

---

## Verification Checklist

After completing setup, verify:

- [ ] Google button appears on `/login`
- [ ] Apple button appears on `/login`
- [ ] Clicking Google redirects to Google consent screen
- [ ] Clicking Apple redirects to Apple sign-in
- [ ] After OAuth consent, user is redirected to `/auth/callback`
- [ ] `/auth/callback` redirects to `/app/dashboard` after successful auth
- [ ] Error state shows on `/auth/callback` if auth fails
- [ ] Email/password login still works as fallback
- [ ] All UI text appears in PL/EN/UK depending on selected language

---

*Document created: 2026-03-01 | PR-04 Social Login PACK*

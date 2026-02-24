# Placeholder Policy — Majster.AI

## Status: RESOLVED (PR3, 2026-02-24)

All `CHANGE-ME` placeholder strings have been removed from the codebase.
The canonical contact email is now: **kontakt.majster@gmail.com**

---

## Before / After (grep evidence)

| Location | Before (PR3) | After (PR3) |
|----------|-------------|-------------|
| `src/components/layout/Footer.tsx` (×4) | `kontakt@CHANGE-ME.example`, `support@CHANGE-ME.example`, `sales@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/components/admin/AdminContentEditor.tsx` (×2) | `support@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/components/admin/AdminSystemSettings.tsx` (×2) | `noreply@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/hooks/useAdminSettings.ts` | `noreply@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/pages/Privacy.tsx` | `privacy@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/pages/Terms.tsx` | `support@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/pages/legal/DPA.tsx` | `dpo@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/pages/legal/GDPRCenter.tsx` | `privacy@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/pages/legal/PrivacyPolicy.tsx` | `privacy@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `src/pages/legal/TermsOfService.tsx` | `legal@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `docs/MANIFESTS.md` | `deleted_${userId}@CHANGE-ME.example` | `deleted_${userId}@deleted.invalid` |
| `docs/STAGING_SETUP.md` | `staging-CHANGE-ME.vercel.app` | `your-staging-deployment.vercel.app` |
| `docs/api/openapi.yaml` | `support@CHANGE-ME.example` | `kontakt.majster@gmail.com` |
| `docs/audit/AUDIT_LOG.md` (×3) | references to `@CHANGE-ME.example` | updated to reflect resolved state |
| `docs/audit/AUDIT_REPORT_2026-02-20.md` (×5) | references to `@CHANGE-ME.example` | updated to reflect resolved state |
| `docs/audit/AUDIT_STATUS.md` (×2) | references to `@CHANGE-ME.example` | updated to reflect resolved state |

**Total occurrences removed: 30**

---

## CI Guard

A guard script prevents future regressions:

```bash
npm run check:placeholders
```

- Script: `scripts/check-placeholders.sh`
- Searches: `src/`, `public/`, `docs/`
- Exit 0 = clean, Exit 1 = found placeholders (CI fails)

Run manually at any time, or add to your CI pipeline after `npm run lint`.

---

## Contact Email

The canonical contact email for all production UI and legal pages:

```
kontakt.majster@gmail.com
```

If this needs to change in the future, update it in all locations listed above
and run `npm run check:placeholders` to confirm no new placeholders were introduced.

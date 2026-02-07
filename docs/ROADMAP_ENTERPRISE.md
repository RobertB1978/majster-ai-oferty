# Majster.AI — ROADMAP ENTERPRISE v2 (SOURCE OF TRUTH)

**Status:** ACTIVE (PR#00 docs-only)
**Właściciel decyzji:** Product Owner + Tech Lead
**Zakres dokumentu:** plan wdrożeniowy i dyscyplina PR dla repozytorium

---

## 0) Inwentarz repo (snapshot)
1. Framework: **Vite + React + TypeScript** (`vite.config.ts`, `package.json` scripts `vite`).
2. Nie jest to Next.js (brak `next.config.*`, brak katalogu root `app/` dla Next).
3. Routing jest po stronie klienta przez **react-router-dom** (`BrowserRouter`, `Routes`, `Route`).
4. Publiczny route oferty: `/offer/:token` w `src/App.tsx`.
5. Rewrite pod SPA jest w `vercel.json` (`/(.*) -> /index.html`).
6. `vercel.json` ma globalne CSP z `frame-ancestors 'none'` oraz osobny blok nagłówków dla `/offer/(.*)`.
7. W repo istnieją migracje Supabase w `supabase/migrations` (22 pliki).
8. Lista Edge Functions (`supabase/functions`): `_shared`, `ai-chat-agent`, `ai-quote-suggestions`, `analyze-photo`, `approve-offer`, `cleanup-expired-data`, `create-checkout-session`, `csp-report`, `delete-user-account`, `finance-ai-analysis`, `healthcheck`, `ocr-invoice`, `public-api`, `send-expiring-offer-reminders`, `send-offer-email`, `stripe-webhook`, `voice-quote-processor`.

---

## 1) Dla laika (bez żargonu)
Ten dokument jest od teraz **jedyną mapą pracy**: co robimy, w jakiej kolejności i po czym poznać, że etap jest skończony.
Najpierw porządkujemy „prawdę wdrożeniową" (Vercel + Supabase), żeby było jasne co naprawdę działa w produkcji, a co tylko lokalnie.
Dopiero potem robimy małe, bezpieczne PR-y: każdy PR ma jeden cel, jasne testy, plan wycofania i brak „dodatkowych poprawek przy okazji".

---

## 2) Najważniejsze ryzyka (z audytu)
1. **Brak jednej prawdy wdrożeniowej Vercel** (co jest ustawione vs co tylko opisane).
2. **Brak jednej prawdy migracji Supabase** (co jest faktycznie zastosowane na środowiskach).
3. **Ryzyko merge/push na `main` bez pełnego review i green checks**.
4. **Hardcoded `ACTION_LABELS` / i18n dług techniczny**.
5. **Polityka CSP:** globalne `frame-ancestors 'none'` może być sprzeczne z potrzebą osadzania widoku oferty.
6. **ESLint warnings** utrzymują się (nie blokują builda, ale zwiększają ryzyko regresji).

---

## 3) Roadmapa realizacji (PR#00–PR#04)

### PR#00 (ten PR) — Instalacja SOURCE OF TRUTH (docs-only)
- **Cel:** ustanowienie dokumentów nadrzędnych + szablonu PR + guardrails pracy.
- **Scope fence:** tylko `docs/**`, `docs/ADR/**`, `.github/**`.
- **DoD:** dokumenty utworzone, spójne i gotowe do użycia operacyjnego.

### PR#01 — Deployment Truth (Vercel + Supabase)
- **Cel:** potwierdzona „prawda" konfiguracji i deploy flow.
- **Zakres:** dokumentacja + dowody; bez zmian produktu.
- **Ryzyka główne:** env drift, rewrites/headers drift, brak dowodów build logs.

### PR#02 — (consolidated into PR#01)

### PR#03 — Governance PR discipline
- **Cel:** egzekwowanie review/green checks/no-direct-main.
- **Zakres:** proces + template + branch protection (operacyjnie).
- **Ryzyka główne:** omijanie procesu w pilnych poprawkach.

### PR#04 — Techniczny cleanup ryzyk z audytu
- **Cel:** zaplanowany backlog napraw (ACTION_LABELS, CSP, lint warnings).
- **Zakres:** atomowe PR-y produktowe po zatwierdzeniu prawdy wdrożeniowej.
- **Ryzyka główne:** scope creep i łączenie wielu fixów naraz.

---

## 4) Definition of Done (globalny)
1. 1 objaw → 1 minimal fix → 1 PR.
2. Te same komendy weryfikacji w każdym PR:
   - `npm run lint`
   - `npm run test`
   - `npm run build`
   - `npm run type-check`
3. W PR musi być: Scope Fence, DoD, testy, rollback, ryzyka i dowody.
4. Brak merge jeśli checks != green.
5. Brak merge bez review.

---

## 5) Plan PR#00–PR#04 (tabela)
| PR | Cel | Scope fence | Testy | DoD | Rollback |
|---|---|---|---|---|---|
| PR#00 | Zainstalować SOURCE OF TRUTH | docs/.github/ADR only | lint/test/build/type-check + review docs | komplet dokumentów | revert commit docs |
| PR#01 | Ustalić prawdę wdrożeniową | docs + dowody, bez runtime zmian | checklista DEPLOYMENT_TRUTH | PASS/FAIL + blockers | powrót do poprzedniego stanu docs |
| PR#03 | Wymusić dyscyplinę PR/merge | .github + docs | walidacja procesu na PR testowym | no direct main, review required | wycofanie zmian procesu |
| PR#04 | Domknąć ryzyka audytowe | atomowe zmiany produktowe | testy modułowe + regresja + CI | każde ryzyko osobny mini-PR | revert per mini-PR |

---

## Related
- ADR: `docs/ADR/ADR-0000-source-of-truth.md`
- Traceability: `docs/TRACEABILITY_MATRIX.md`
- PR Playbook: `docs/PR_PLAYBOOK.md`
- Deployment Truth: `docs/DEPLOYMENT_TRUTH.md`

# Majster.AI — ROADMAP ENTERPRISE v2 (SOURCE OF TRUTH)

**Status:** ACTIVE (PR#00 docs-only)  
**Właściciel decyzji:** Product Owner + Tech Lead  
**Zakres dokumentu:** plan wdrożeniowy i dyscyplina PR dla repozytorium

---

## 0) Inwentarz repo (snapshot, max 25 linii)
1. Framework: **Vite + React + TypeScript** (`vite.config.ts`, `package.json` scripts `vite`).
2. Nie jest to Next.js (brak `next.config.*`, brak katalogu root `app/` dla Next).
3. Routing jest po stronie klienta przez **react-router-dom** (`BrowserRouter`, `Routes`, `Route`).
4. Publiczny route oferty: `/offer/:token` w `src/App.tsx`.
5. Rewrite pod SPA jest w `vercel.json` (`/(.*) -> /index.html`).
6. `vercel.json` ma globalne CSP z `frame-ancestors 'none'` oraz osobny blok nagłówków dla `/offer/(.*)`.
7. W repo istnieją migracje Supabase w `supabase/migrations` (stan: wiele migracji timestamp + UUID).
8. Lista migracji (nazwy):
   - `20251205000000_enable_pgcrypto.sql`
   - `20251205160746_6a58fb47-b2dd-4b92-98f6-ba211dc13689.sql`
   - `20251205164727_c0d6cba6-5adf-4a2e-ad97-db70f142d298.sql`
   - `20251205170743_62650200-473b-4d91-9c2d-d69171409f31.sql`
   - `20251205192507_95697a22-e254-4e2a-ac94-fc2873b81e0a.sql`
   - `20251205220356_a6edf8bd-0a1a-4d88-80d4-79dc3b8cb7ed.sql`
   - `20251205230527_143aedf1-03a7-4204-9a86-f200f74cfa53.sql`
   - `20251206073947_dbba8272-c7ab-422b-b702-a7c8498adc54.sql`
   - `20251206221151_3de2c381-4106-4dfe-b189-85119bb757df.sql`
   - `20251207082500_bedade0c-2e85-41f5-a8a7-3cc2502fa89a.sql`
   - `20251207105202_02089cee-a466-4633-8357-f010f4ce35e7.sql`
   - `20251207110925_fd116312-a252-4680-870a-632e137bf7ef.sql`
   - `20251207123630_7642361c-8055-430b-91c9-3c513940c57a.sql`
   - `20251207123651_686d6de5-61b2-438d-9b7c-d1089353d4a5.sql`
   - `20251209073921_add_performance_indexes.sql`
   - `20251209152221_add_pdf_url_to_offer_sends.sql`
   - `20251209154608_add_tracking_status_to_offer_sends.sql`
   - `20251209154800_harden_tracking_status_not_null.sql`
   - `20251211212307_ff99280e-5828-4d0a-90eb-e69c98f1eeb6.sql`
   - `20251217000000_add_stripe_integration.sql`
   - `20260126_admin_control_plane.sql`
   - `20260203141118_fix_admin_panel_rls_policies.sql`
9. Lista Edge Functions (`supabase/functions`): `_shared`, `ai-chat-agent`, `ai-quote-suggestions`, `analyze-photo`, `approve-offer`, `cleanup-expired-data`, `create-checkout-session`, `csp-report`, `delete-user-account`, `finance-ai-analysis`, `healthcheck`, `ocr-invoice`, `public-api`, `send-expiring-offer-reminders`, `send-offer-email`, `stripe-webhook`, `voice-quote-processor`.

---

## 1) Dla laika (bez żargonu)
Ten dokument jest od teraz **jedyną mapą pracy**: co robimy, w jakiej kolejności i po czym poznać, że etap jest skończony.  
Najpierw porządkujemy „prawdę wdrożeniową” (Vercel + Supabase), żeby było jasne co naprawdę działa w produkcji, a co tylko lokalnie.  
Dopiero potem robimy małe, bezpieczne PR-y: każdy PR ma jeden cel, jasne testy, plan wycofania i brak „dodatkowych poprawek przy okazji”.

---

## 2) Kontekst techniczny i źródła wejściowe
### 2.1 Dokumenty wejściowe
- `docs/ROADMAP.md` (szeroki plan, statusy historyczne i quality gates).
- `ATOMIC_PR_PLAN.md` (atomowe PR-y i podejście 1 PR = 1 cel).
- `docs/BASELINE_AUDIT_CODEX.md` — **brak pliku w repo**; użyto najbliższych zamienników audytowych:
  - `REPO_HEALTH_AUDIT_2025-01-18.md`
  - `docs/COMPREHENSIVE_AUDIT_2026.md`
- `docs/VERCEL_SETUP_CHECKLIST.md` i `vercel.json` (obecny stan wdrożenia).

### 2.2 Streszczenie mapowania (delta, nie rewrite)
| Źródło | Co przejmujemy do v2 | Co dokładamy w PR#00 |
|---|---|---|
| `docs/ROADMAP.md` | quality gates, pre-flight, dyscyplina małych PR | formalna decyzja „source of truth” + matrix + playbook |
| `ATOMIC_PR_PLAN.md` | atomowość, DoD, rollback | twardy scope fence i szablon PR wymuszający dowody |
| Audyty (`REPO_HEALTH...`, `COMPREHENSIVE...`) | ryzyka i luki wdrożeniowe | checklista PASS/FAIL dla Vercel i Supabase z sekcją DOWODY |

---

## 3) Najważniejsze ryzyka (z audytu i bieżącej analizy)
1. **Brak jednej prawdy wdrożeniowej Vercel** (co jest ustawione vs co tylko opisane).
2. **Brak jednej prawdy migracji Supabase** (co jest faktycznie zastosowane na środowiskach).
3. **Ryzyko merge/push na `main` bez pełnego review i green checks**.
4. **Hardcoded `ACTION_LABELS` / i18n dług techniczny**.
5. **Polityka CSP:** globalne `frame-ancestors 'none'` może być sprzeczne z potrzebą osadzania widoku oferty.
6. **ESLint warnings** utrzymują się (nie blokują builda, ale zwiększają ryzyko regresji).
7. **Niezgodność engine Node/npm** między środowiskami (lokalnie/CI/Vercel).

---

## 4) Roadmapa realizacji (PR#00–PR#04)
### PR#00 (ten PR) — Instalacja SOURCE OF TRUTH (docs-only)
- **Cel:** ustanowienie dokumentów nadrzędnych + szablonu PR + guardrails pracy.
- **Scope fence:** tylko `docs/**`, `docs/ADR/**`, `.github/**`, `AGENTS.md|CLAUDE.md|.CODEX.md`.
- **DoD:** dokumenty utworzone, spójne i gotowe do użycia operacyjnego.

### PR#01 — Deployment Truth: Vercel
- **Cel:** potwierdzona „prawda” konfiguracji i deploy flow dla Vercel.
- **Zakres:** dokumentacja + dowody; bez zmian produktu.
- **Ryzyka główne:** env drift, rewrites/headers drift, brak dowodów build logs.

### PR#02 — Deployment Truth: Supabase
- **Cel:** potwierdzony stan migracji, RLS i functions per środowisko.
- **Zakres:** dokumentacja + dowody; bez nowych migracji.
- **Ryzyka główne:** migration drift, brak mapowania schema→repo.

### PR#03 — Governance PR discipline
- **Cel:** egzekwowanie review/green checks/no-direct-main.
- **Zakres:** proces + template + branch protection (operacyjnie).
- **Ryzyka główne:** omijanie procesu w pilnych poprawkach.

### PR#04 — Techniczny cleanup ryzyk z audytu
- **Cel:** zaplanowany backlog napraw (ACTION_LABELS, CSP, lint warnings, engines).
- **Zakres:** atomowe PR-y produktowe po zatwierdzeniu prawdy wdrożeniowej.
- **Ryzyka główne:** scope creep i łączenie wielu fixów naraz.

---

## 5) Definition of Done (globalny dla kolejnych PR)
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

## 6) Plan PR#00–PR#04 (tabela wykonawcza)
| PR | Cel | Scope fence | Testy | DoD | Rollback |
|---|---|---|---|---|---|
| PR#00 | Zainstalować SOURCE OF TRUTH | docs/.github/ADR/AGENTS only | lint/test/build/type-check (sanity) + review docs | komplet dokumentów i template PR | revert commit docs |
| PR#01 | Ustalić prawdę wdrożeniową Vercel | docs + dowody, bez runtime zmian | checklista DEPLOYMENT_TRUTH (Vercel) | PASS/FAIL + blockers + artefakty | powrót do poprzedniego stanu docs |
| PR#02 | Ustalić prawdę wdrożeniową Supabase | docs + dowody, bez migracji | checklista DEPLOYMENT_TRUTH (Supabase) | pełny mapping migracji/RLS/functions | powrót do poprzedniego stanu docs |
| PR#03 | Wymusić dyscyplinę PR/merge | .github + docs + AGENTS | walidacja procesu na PR testowym | no direct main, review required, green checks required | wycofanie zmian procesu |
| PR#04 | Domknąć ryzyka audytowe (technicznie) | atomowe zmiany produktowe per ryzyko | testy modułowe + regresja + CI | każde ryzyko ma osobny mini-PR i dowód | revert per mini-PR |


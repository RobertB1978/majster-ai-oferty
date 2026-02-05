# DEPLOYMENT_TRUTH.md

Cel: operacyjny werdykt **PASS/FAIL** dla P0 „Deployment Truth” oparty wyłącznie o dowody z repo i dashboardów.

## Snapshot repo (P0)
- Stack: **Vite + React + TypeScript** (`vite.config.ts`, brak `next.config.*`).
- Vercel: obecny `vercel.json` (framework `vite`, rewrite SPA, nagłówki bezpieczeństwa).
- Supabase: obecne `supabase/migrations/*.sql`, `supabase/functions/*`, `supabase/config.toml`.
- Workflow Supabase: `.github/workflows/supabase-deploy.yml` istnieje, tryb `workflow_dispatch` (manualny trigger).

---

## A) VERCEL — PASS/FAIL

### 1) Repo-side evidence (to da się sprawdzić lokalnie)
- [x] `vercel.json` istnieje.
- [x] `vercel.json` zawiera rewrite SPA `/(.*) -> /index.html`.
- [x] `vercel.json` deklaruje `framework: "vite"`, `buildCommand`, `outputDirectory`.
- [ ] W repo istnieje workflow GitHub Actions wdrażający na Vercel.
- [ ] W repo istnieje twardy dowód podpięcia projektu Vercel do tego repo (ID projektu / link / status integracji Git).

### 2) Dashboard evidence (do wklejenia przez właściciela)
- [ ] Screen: **Project Settings → General** (Project Name + Git Repository + Production Branch).
- [ ] Screen: **Deployments** (ostatni produkcyjny deploy, status, commit SHA, timestamp).
- [ ] Screen: **Git Integration** (czy auto-deploy dla push/PR jest aktywny).
- [ ] Screen: **Environment Variables** (same nazwy i scope Production/Preview, bez wartości).
- [ ] URL: publiczny Production URL + krótki wynik smoke testu.

**Wynik Vercel:** **FAIL**  
**Blockers:**
1. Brak repo-side dowodu na integrację Git→Vercel (w repo brak workflow deploy Vercel i brak artefaktu mapowania projektu).
2. Brak dashboardowych dowodów z produkcyjnego projektu Vercel.

**Co trzeba dostarczyć, żeby zmienić FAIL -> PASS:**
1. 4 screeny z dashboardu Vercel (General, Deployments, Git Integration, Environment Variables).
2. Potwierdzenie Production URL + SHA ostatniego deploymentu z `main`.
3. Potwierdzenie, że Preview deploye działają dla PR (co najmniej 1 URL preview + status). 

---

## B) SUPABASE — PASS/FAIL

### 1) Repo-side evidence (to da się sprawdzić lokalnie)
- [x] `supabase/migrations` zawiera migracje SQL (repo posiada historię migracji).
- [x] `supabase/functions` zawiera Edge Functions (z katalogiem `_shared` i funkcjami wdrożeniowymi).
- [x] `supabase/config.toml` istnieje.
- [x] `.github/workflows/supabase-deploy.yml` istnieje.
- [x] Workflow Supabase uruchamia `supabase db push` i deploy funkcji.
- [ ] Workflow Supabase uruchamia się automatycznie po merge na `main` (obecnie trigger manualny `workflow_dispatch`).
- [ ] W repo istnieje twardy dowód, że migracje i funkcje zostały wdrożone na produkcyjny projekt.

### 2) Dashboard evidence (do wklejenia przez właściciela)
- [ ] Screen: **Project Settings** (Project ref).
- [ ] Screen: **SQL / Migrations history** (lista migracji + kolejność + status).
- [ ] Screen: **Table Editor** (potwierdzenie istnienia kluczowych tabel, w tym `admin_*` jeśli wymagane).
- [ ] Screen: **Edge Functions** (lista wdrożonych funkcji + status).
- [ ] Screen: **Auth → URL Configuration** (Redirect URLs).
- [ ] Log/artefakt: ostatnie wykonanie `.github/workflows/supabase-deploy.yml` z wynikiem sukces/fail.

**Wynik Supabase:** **FAIL**  
**Blockers:**
1. Brak runtime dowodu, że migracje z repo są zastosowane na projekcie produkcyjnym.
2. Brak runtime dowodu, że Edge Functions z repo są wdrożone i aktywne.
3. Obecny workflow deploy jest manualny (`workflow_dispatch`), więc brak gwarancji ciągłego wdrożenia po merge.

**Co trzeba dostarczyć, żeby zmienić FAIL -> PASS:**
1. Screeny z Supabase Dashboard: Project ref, Migrations history, Edge Functions, Auth redirect URLs, widok tabel (w tym `admin_*`).
2. Link do konkretnego runa workflow `Supabase Deploy Autopilot` + SHA + timestamp.
3. Porównanie 1:1: „migracje w repo” vs „migracje zastosowane” i „funkcje w repo” vs „funkcje wdrożone”.

---

## Evidence log (do uzupełniania)

### Vercel
- Źródło:
- Data:
- Środowisko:
- Wynik:
- Komentarz:

### Supabase
- Źródło:
- Data:
- Środowisko:
- Wynik:
- Komentarz:

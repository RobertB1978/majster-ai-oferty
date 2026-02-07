# DEPLOYMENT_TRUTH.md

## Status P0 Deployment Truth: `UNRESOLVED`

- Evidence Pack: `docs/P0_EVIDENCE_PACK.md`
- Evidence Request (dla właściciela środowisk): `docs/P0_EVIDENCE_REQUEST.md`

> Fakt z repo: obecny frontend to **Vite + React + TypeScript** (m.in. `vite.config.ts`, brak `next.config.*`).

## Jak zebrać dowody w 10 minut (dla laika)
1. Wejdź do **Vercel → Project Settings → Git** i zrób screenshot: repo + production branch.
2. Wejdź do **Vercel → Deployments** i zrób screenshot ostatniego `Ready` na produkcji.
3. Skopiuj URL produkcyjny i URL ostatniego Preview.
4. Otwórz ostatni produkcyjny deployment i skopiuj fragment logu z commit SHA.
5. Wejdź do **Vercel → Settings → Environment Variables** i zrób screenshot samych nazw zmiennych (bez wartości).
6. Wejdź do **Supabase → Project Settings → General** i zrób screenshot `Project ID`.
7. Pobierz listę migracji z produkcji (panel/CLI) i porównaj z `supabase/migrations`.
8. Wejdź do **Supabase → Edge Functions** i zrób screenshot listy wdrożonych funkcji.
9. Uruchom 1 krytyczną funkcję i zapisz status code + timestamp.
10. Wklej wszystko do `docs/P0_EVIDENCE_PACK.md`, oznacz PASS/FAIL i wypisz Blockers.

Cel: jedno źródło prawdy dla P0 „Deployment Truth".

> Zasada: bez twardych dowodów wynik = **FAIL** (nie zgadujemy).

## 1) Vercel — PASS/FAIL

### 1.1 Repo-side evidence (z tego repo)
- [x] `vercel.json` istnieje i deklaruje `framework: "vite"`, `buildCommand: "npm run build"`, `outputDirectory: "dist"`.
- [x] Jest rewrite SPA `/(.*) -> /index.html`.
- [x] W repo brak workflow GitHub Actions, który deployuje na Vercel (jest CI, ale bez kroku `vercel deploy`).
- [x] W `package.json` są jawne wersje runtime: `node 20.x`, `npm 10.x`.
- [x] W dokumentacji repo (`docs/VERCEL_SETUP_CHECKLIST.md`) wskazane są wymagane ENV dla Vercel.

### 1.2 Dashboard evidence (do dostarczenia przez właściciela)
- [ ] Screen: **Project Settings → General → Git** (repo + branch produkcyjny).
- [ ] Screen: **Deployments** z ostatnim produkcyjnym deploymentem i statusem Success.
- [ ] Screen: szczegóły deploya z commit SHA (musi odpowiadać commitowi z GitHub).
- [ ] Screen: **Environment Variables** (same nazwy, bez wartości) dla Production i Preview.
- [ ] Link: produkcyjny URL aplikacji (`*.vercel.app` lub domena custom).

**Wynik: FAIL**

**Blockers:**
- Brak dowodu z panelu Vercel, że projekt jest podpięty do właściwego repo/brancha i że deploy idzie z Git.
- Brak dowodu mapowania commit SHA GitHub -> deployment Vercel.
- Brak dowodu, że ENV w Vercel są ustawione dla obu środowisk (Production + Preview).

**Co trzeba dostarczyć, żeby zmienić FAIL -> PASS:**
1. Screen integracji Git (repo + branch produkcyjny).
2. Screen ostatniego deploymentu produkcyjnego ze statusem Success i datą.
3. Screen szczegółów deploymentu z commit SHA.
4. Screen listy ENV (same nazwy) z zaznaczonym Production + Preview.
5. Produkcyjny URL i krótki test ręczny (otwiera się aplikacja bez błędów konfiguracji).

---

## 2) Supabase — PASS/FAIL

### 2.1 Repo-side evidence (z tego repo)
- [x] `supabase/migrations/` istnieje i zawiera migracje SQL.
- [x] `supabase/functions/` istnieje i zawiera Edge Functions.
- [x] `supabase/config.toml` istnieje (używany przez workflow deploy).
- [x] Jest workflow `.github/workflows/supabase-deploy.yml`, ale uruchamiany **manualnie** (`workflow_dispatch`), nie automatycznie po merge.
- [x] Workflow deklaruje deploy migracji (`supabase db push`) oraz funkcji (`supabase functions deploy ...`).

### 2.2 Dashboard evidence (do dostarczenia przez właściciela)
- [ ] Screen: **Project ref** z Supabase Dashboard (zgodny z repo/workflow).
- [ ] Screen: **Database → Migrations** (pełna lista i kolejność).
- [ ] Screen: **Database → Tables** z potwierdzeniem obecności kluczowych tabel (w tym `admin_*`).
- [ ] Screen: **Edge Functions** z listą wdrożonych funkcji i datami.
- [ ] Screen: **Authentication → URL Configuration** (Site URL + Redirect URLs).
- [ ] Log z ostatniego uruchomienia `supabase-deploy.yml` ze statusem sukces/porażka.

**Wynik: FAIL**

**Blockers:**
- Brak dowodu, że migracje z repo zostały rzeczywiście zastosowane na produkcyjnym projekcie Supabase.
- Brak dowodu, że wszystkie Edge Functions z repo są wdrożone i aktywne.
- Workflow jest manualny, więc bez logu uruchomienia nie ma gwarancji aktualności wdrożenia.

**Co trzeba dostarczyć, żeby zmienić FAIL -> PASS:**
1. Screen Project ref z Supabase.
2. Screen listy migracji w Dashboard (z kolejnością).
3. Log/screen ostatniego przebiegu `supabase-deploy.yml` (sekcje migrations + functions).
4. Screen listy Edge Functions i statusów wdrożeń.
5. Screen Auth URL Configuration (Site URL i Redirect URLs).
6. Potwierdzenie zgodności: liczba migracji i funkcji repo = dashboard.

---

## 3) Status P0 (na teraz)

| Obszar | Wynik | Uzasadnienie skrócone |
|---|---|---|
| Vercel | **FAIL** | Repo potwierdza konfigurację build/rewrite, ale brak dowodów dashboardowych Git integration + deployment trace do commitu. |
| Supabase | **FAIL** | Repo potwierdza obecność migracji/funkcji i workflow, ale brak dowodu wykonania deploya na właściwym projekcie. |

## 4) Dowody operacyjne — format minimalny
Dla każdego dowodu wklej:
- Źródło (Vercel/Supabase/GitHub Actions)
- Datę i strefę czasową
- Środowisko (Production/Preview)
- Krótki werdykt (PASS/FAIL)
- Link lub screen

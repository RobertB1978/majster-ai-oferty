# Majster.AI — ENTERPRISE AUDYT v1 (Full-Stack + CI/CD + Supabase/Vercel)

> Tryb: FAZA 1 (read-only). Zakres zmian w repo ograniczony do `docs/**`.

## 0) Inventory repo (max 30 linii)
1. Stack: **Vite + React + TypeScript** (skrypty `vite`, `vite build`, `vite preview` w `package.json`).
2. Nie jest to Next.js (brak `next.config.*`; obecny `vite.config.ts`).
3. Routing SPA wspierany przez rewrite na `/index.html` w `vercel.json`.
4. Vercel build deklarowany jako `npm run build`, output `dist`, framework `vite` w `vercel.json`.
5. `vercel.json` definiuje CSP z `frame-ancestors 'none'` oraz osobne nagłówki dla `/offer/(.*)`.
6. `supabase/config.toml` istnieje i zawiera `project_id` oraz ustawienia `verify_jwt` dla funkcji.
7. Repo zawiera migracje w `supabase/migrations/` oraz Edge Functions w `supabase/functions/`.
8. CI/CD: workflows w `.github/workflows`: `ci.yml`, `e2e.yml`, `security.yml`, `bundle-analysis.yml`, `supabase-deploy.yml`.
9. `ci.yml` uruchamia `lint`, `test`, `build` (zależność build po lint+test) oraz osobny job `security`.
10. `e2e.yml` uruchamia Playwright z demo credentials Supabase i ignoruje zmiany docs.
11. `security.yml` uruchamia `npm audit` (high) i CodeQL.
12. `supabase-deploy.yml` jest manualny (`workflow_dispatch`) i deployuje migracje + functions przez Supabase CLI.
13. Dokumenty źródłowe: `docs/ROADMAP_ENTERPRISE.md`, `docs/DEPLOYMENT_TRUTH.md`, `docs/TRACEABILITY_MATRIX.md`, `docs/ADR/*`.

## 1) Diagnoza PR#01 i PR#02 (repo/CI-only, bez paneli)
**Stan wiedzy:** NIE WIEM — brak zdalnego repo/PR w konfiguracji lokalnej (brak `git remote`) i brak dostępu do logów CI/PR w samym repo.

### PR#01 — Deployment Truth: Vercel
- **Czy PR istnieje?** NIE WIEM — brak danych w repo.
- **Branch źródłowy?** NIE WIEM.
- **Status checków?** NIE WIEM.
- **Powód fail?** NIE WIEM (brak logów CI w repo).
- **Merge conflicts?** NIE WIEM (brak dostępu do PR/brancha).
- **Co blokuje merge?** NIE WIEM.

### PR#02 — Deployment Truth: Supabase
- **Czy PR istnieje?** NIE WIEM — brak danych w repo.
- **Branch źródłowy?** NIE WIEM.
- **Status checków?** NIE WIEM.
- **Powód fail?** NIE WIEM (brak logów CI w repo).
- **Merge conflicts?** NIE WIEM (brak dostępu do PR/brancha).
- **Co blokuje merge?** NIE WIEM.

## 2) Audyt jakości i ryzyk (repo-based)
### 2.1 CI/CD i quality gates
- CI definiuje lint/test/build/type-check jako wymagane kroki w `ci.yml` (lint+type-check, test, build).
- E2E jest osobnym workflow uruchamianym na PR/push (z ignorowaniem zmian w docs).
- Supabase deploy jest manualny (brak automatu po merge do `main`).
- Brak workflow Vercel deploy w repo (repo-side brak `vercel deploy`).

### 2.2 Testy i skrypty
- `package.json` ma skrypty: `lint`, `test`, `build`, `type-check`, `e2e`.
- Skrypty CI nie wymagają prawdziwych sekretów (w `ci.yml` użyto placeholderów dla `VITE_SUPABASE_*`).
- E2E używa publicznych demo credentials Supabase (repo-side dowód w workflow).

### 2.3 Bezpieczeństwo (czerwone flagi repo-side)
- CSP w `vercel.json` blokuje `frame-ancestors` globalnie (`'none'`), co może kolidować z osadzaniem `/offer/*` (ryzyko biznesowe/UX).
- `security.yml` uruchamia `npm audit --audit-level=high` (może blokować merge przy podatnościach).
- Brak repo-side dowodu na obowiązkowe branch protection (nie da się sprawdzić bez panelu GitHub).

### 2.4 Supabase/Vercel — tylko repo-side
- Supabase: istnieją migracje, functions, config i workflow deploy (manualny).
- Vercel: istnieje `vercel.json` i checklisty ENV w `docs/VERCEL_SETUP_CHECKLIST.md`.
- Nie da się potwierdzić dashboardowych dowodów wdrożeń bez paneli.

## 3) RAPORT AUDYTU (A–D)
### A) Executive Summary (5–10 zdań)
1. Repo to Vite + React + TypeScript z pełnym zestawem CI (lint/test/build/type-check) oraz osobnym E2E i security. 
2. W repo istnieją migracje i Edge Functions Supabase oraz manualny workflow deploy. 
3. Po stronie Vercel istnieje `vercel.json` z buildem i rewritem SPA, ale brak automatycznego deploya w GitHub Actions. 
4. „Deployment Truth” dla Vercel i Supabase w repo jest zdefiniowane jako **FAIL** bez dowodów dashboardowych. 
5. Status PR#01 i PR#02 nie jest weryfikowalny z repo (brak remote i logów CI/PR). 
6. Ryzyka repo-side obejmują m.in. CSP `frame-ancestors 'none'` i zależność od manualnych wdrożeń Supabase. 
7. Quality gates są zdefiniowane, ale brak twardych wyników uruchomienia w tym audycie. 
8. Priorytetem jest zebranie dowodów deployment truth oraz uruchomienie checków CI na PR, zgodnie z ROADMAP ENTERPRISE.

### B) Tabela findings (min. 15 pozycji)
| ID | Obszar | Opis | Dowód (plik/linia/log) | Ryzyko | Koszt naprawy | Blokuje PR? |
|---|---|---|---|---|---|---|
| F-01 | CI | Lint i type-check są w jednym jobie `lint` w CI. | `.github/workflows/ci.yml` | L | S | nie |
| F-02 | CI | Build zależy od sukcesu `lint` i `test`. | `.github/workflows/ci.yml` | L | S | tak |
| F-03 | CI | Testy uruchamiane są z coverage w CI. | `.github/workflows/ci.yml` | L | S | nie |
| F-04 | CI | E2E działa na PR/push, ale ignoruje zmiany w docs (nie uruchomi się w PR docs-only). | `.github/workflows/e2e.yml` | M | S | nie |
| F-05 | CI | Security workflow uruchamia `npm audit --audit-level=high` i może blokować merge. | `.github/workflows/security.yml` | M | M | tak |
| F-06 | Supabase | Workflow deploy Supabase jest manualny (`workflow_dispatch`), brak auto-deploy po merge. | `.github/workflows/supabase-deploy.yml` | M | M | nie |
| F-07 | Supabase | Repo zawiera `supabase/config.toml` z `project_id`, ale bez dowodu zgodności z dashboardem. | `supabase/config.toml` | M | S | tak |
| F-08 | Supabase | Repo zawiera migracje i functions, ale brak dowodu zastosowania na produkcji. | `supabase/migrations/*`, `supabase/functions/*` | H | M | tak |
| F-09 | Vercel | `vercel.json` definiuje build/rewrite, ale brak repo-side dowodu deploya. | `vercel.json` | M | S | tak |
| F-10 | Vercel | CSP blokuje `frame-ancestors` globalnie (`'none'`), ryzyko dla embeda `/offer/*`. | `vercel.json` | M | M | nie |
| F-11 | Docs | `docs/DEPLOYMENT_TRUTH.md` oznacza Vercel jako FAIL bez dowodów z panelu. | `docs/DEPLOYMENT_TRUTH.md` | H | S | tak |
| F-12 | Docs | `docs/DEPLOYMENT_TRUTH.md` oznacza Supabase jako FAIL bez dowodów z panelu. | `docs/DEPLOYMENT_TRUTH.md` | H | S | tak |
| F-13 | Docs | `docs/TRACEABILITY_MATRIX.md` wskazuje PR#01/PR#02 jako IN_PROGRESS, brak dowodów zamknięcia. | `docs/TRACEABILITY_MATRIX.md` | M | S | tak |
| F-14 | Governance | Brak repo-side dowodu na branch protection i required checks. | repo / brak pliku konfiguracyjnego | M | S | tak |
| F-15 | Build | `package.json` ustala engine Node 20 / npm 10, ale brak dowodu zgodności runtime Vercel. | `package.json`, `docs/VERCEL_SETUP_CHECKLIST.md` | M | S | tak |
| F-16 | Test | Skrypty `lint/test/build/type-check` są zdefiniowane, ale brak uruchomionych wyników w tym audycie. | `package.json` | M | S | tak |
| F-17 | Security | E2E używa publicznych demo credentials Supabase (ryzyko: fałszywe poczucie integracji backendu). | `.github/workflows/e2e.yml` | L | S | nie |

### C) Truth table (PASS/FAIL na podstawie realnych wyników)
> **Zasada:** bez twardych dowodów = FAIL.

| Obszar | Wynik | Dowód / uzasadnienie |
|---|---|---|
| Build | FAIL | Nie uruchomiono `npm run build` w tym audycie (brak logu). |
| Test | FAIL | Nie uruchomiono `npm run test` w tym audycie (brak logu). |
| Lint | FAIL | Nie uruchomiono `npm run lint` w tym audycie (brak logu). |
| Type-check | FAIL | Nie uruchomiono `npm run type-check` w tym audycie (brak logu). |
| PR#01 mergeability | FAIL | Brak danych o PR/branch/CI (brak remote i logów). |
| PR#02 mergeability | FAIL | Brak danych o PR/branch/CI (brak remote i logów). |
| Deployment Truth (repo-side) | FAIL | `docs/DEPLOYMENT_TRUTH.md` wskazuje FAIL bez dowodów z dashboardów. |

### D) Co jest NIE DO SPRAWDZENIA bez paneli + jak to obejść „bez klikania”
**NIE DO SPRAWDZENIA bez paneli:**
1. Vercel: powiązanie repo/brancha, status ostatniego produkcyjnego deploya, commit SHA, ENV Production/Preview.
2. Supabase: realny stan migracji w DB, lista wdrożonych functions, Auth URL Configuration.
3. GitHub: rzeczywiste branch protection / required checks.

**Obejście „bez klikania”:**
- Wymaga **PR-a dokumentacyjnego z dowodami** (screeny/logi) załączonymi przez właściciela repo (jako załączniki do PR), lub automatycznych logów z uruchomionych workflowów (np. `supabase-deploy.yml`) — bez wchodzenia w panele przez wykonawcę.

## 4) 3 warianty planu naprawczego (A/B/C)
### Plan A — „Najłatwiejszy / najmniej ryzykowny”
**Cel:** zebrać minimalne dowody deployment truth i domknąć PR#01/PR#02 tylko w docs.
- **PR#03** (docs-only): uzupełnić `docs/DEPLOYMENT_TRUTH.md` o dowody (logi/screeny), zaktualizować `docs/TRACEABILITY_MATRIX.md` na DONE.
  - **Scope fence:** `docs/**`.
  - **Komendy weryfikacji:** `npm run lint`, `npm run test`, `npm run build`, `npm run type-check`.
  - **DoD:** dowody wdrożeniowe w PR + PASS/FAIL z logami; brak zmian runtime.
  - **Rollback:** revert PR#03.

### Plan B — „Średni”
**Cel:** uporządkować prawdę wdrożeniową i proces PR-ów.
- **PR#03** (docs-only): jak w Plan A (dowody Vercel/Supabase).
- **PR#04** (.github + docs): dodać twarde zasady procesu (np. checklisty CI, policy notes).
  - **Scope fence:** `.github/**`, `docs/**`.
  - **Komendy weryfikacji:** `npm run lint`, `npm run test`, `npm run build`, `npm run type-check`.
  - **DoD:** policy i checklisty wdrożeniowe udokumentowane + dowody PASS/FAIL.
  - **Rollback:** revert PR#04.

### Plan C — „Najbardziej twardy / enterprise”
**Cel:** pełne quality gates i audyt dowodów przed jakąkolwiek zmianą produktu.
- **PR#03** (docs-only): dowody Vercel/Supabase + zamknięcie PR#01/#02 w docs.
- **PR#04** (.github + docs): doprecyzowanie procesów i wymaganych checków.
- **PR#05** (scripts/verify + docs): automatyzacja części dowodów (skrypty diagnostyczne, bez runtime changes).
  - **Scope fence:** `scripts/verify/**`, `docs/**`.
  - **Komendy weryfikacji:** `npm run lint`, `npm run test`, `npm run build`, `npm run type-check`.
  - **DoD:** powtarzalny audyt z logami w PR i checklistą; zero zmian w produkcie.
  - **Rollback:** revert PR#05.

## 5) Co mogę zrobić sam (Codex) bez paneli vs czego nie da się
### Mogę zrobić bez paneli
- Analiza repo i CI (workflows, skrypty, config).
- Generowanie raportu audytu i planów naprawczych.
- Uruchomienie lokalnych checków (`npm run lint/test/build/type-check`) o ile nie wymagają sekretów.
- Aktualizacja dokumentacji i skryptów diagnostycznych w repo.

### Nie da się bez paneli
- Potwierdzić rzeczywistego stanu wdrożeń Vercel/Supabase.
- Zweryfikować konfiguracji ENV i URL w Vercel/Supabase.
- Potwierdzić branch protection i required checks w GitHub.

## 6) 10 pytań kontrolnych (sensowne bez paneli)
1. Czy `docs/DEPLOYMENT_TRUTH.md` ma aktualny, repo-side PASS/FAIL dla Vercel i Supabase?
2. Czy `docs/TRACEABILITY_MATRIX.md` ma spójny status PR#01/PR#02 z aktualnym repo?
3. Czy `vercel.json` nadal wskazuje `framework: vite`, `buildCommand`, `outputDirectory`?
4. Czy `package.json` nadal wymusza Node 20 / npm 10?
5. Czy w `ci.yml` nadal są cztery quality gates (lint/test/build/type-check)?
6. Czy `security.yml` nadal blokuje merge przy `npm audit --audit-level=high`?
7. Czy `supabase-deploy.yml` pozostaje manualny (workflow_dispatch)?
8. Czy liczba migracji i funkcji w repo się zmieniła od ostatniego audytu?
9. Czy `e2e.yml` nadal ignoruje zmiany docs (i nie uruchomi się na PR docs-only)?
10. Czy w repo pojawiły się nowe dokumenty źródłowe, które kolidują z `docs/ROADMAP_ENTERPRISE.md`?


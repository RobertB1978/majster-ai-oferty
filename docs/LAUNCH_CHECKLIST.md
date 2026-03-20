# Majster.AI — Launch Checklist (MVP Gate)

**Wersja**: 1.0
**Ostatnia aktualizacja**: 2026-03-19
**Właściciel**: Senior Release Engineer

> Dokument autorytatywny określający co MUSI być ZIELONE zanim push do `main` może trafić na produkcję.
> Każda sekcja ma jasne kryterium: ✅ Automated (CI blokuje merge), ⚠️ Owner Action (wymaga działania właściciela projektu), 🔲 Manual (weryfikacja manualna).

---

## SEKCJA A — Automated CI Gates (blokują merge automatycznie)

Poniższe kroki są wykonywane przez GitHub Actions przy każdym PR. **Merge bez zielonego CI jest niemożliwy.**

| # | Sprawdzenie | Workflow | Status |
|---|-------------|----------|--------|
| A1 | ESLint — 0 errors | `ci.yml` / lint job | ✅ Weryfikowany |
| A2 | TypeScript `tsc --noEmit` — 0 errors | `ci.yml` / lint job | ✅ Weryfikowany |
| A3 | Vitest — wszystkie testy zielone | `ci.yml` / test job | ✅ Weryfikowany |
| A4 | Coverage thresholds nie przebite (lines≥40%, branches≥34%, funcs≥33%) | `ci.yml` / test job | ✅ Dodane 2026-03-19 |
| A5 | Produkcyjny build `npm run build` — bez błędów | `ci.yml` / build job | ✅ Weryfikowany |
| A6 | Build z `FF_NEW_SHELL=true` — bez błędów (ADR-0005) | `ci.yml` / build job | ✅ Weryfikowany |
| A7 | i18n key parity PL/EN/UK — 0 missing keys | `i18n-ci.yml` | ✅ Weryfikowany |
| A8 | Security `npm audit --audit-level=high` — 0 high/critical vulns | `security.yml` | ✅ Weryfikowany |
| A9 | CodeQL scan — bez critical findings | `security.yml` | ✅ Weryfikowany |
| A10 | E2E smoke tests (Playwright, demo creds) — pass | `e2e.yml` | ✅ Weryfikowany |

**Wynik baseline (2026-03-19)**:
- Tests: 1380 passed, 5 skipped (93 test files)
- Lint: 0 errors, 645 warnings (exit 0)
- TypeScript: exit 0
- Coverage: lines 45.96%, branches 39.75%, functions 38.99%

---

## SEKCJA B — Owner Actions przed production deploy

Poniższe **nie są automatyczne** — wymagają działania właściciela projektu w zewnętrznych panelach.

| # | Akcja | Gdzie | Status |
|---|-------|-------|--------|
| B1 | Ustaw `VITE_SUPABASE_URL` i `VITE_SUPABASE_ANON_KEY` w Vercel (env: production, preview, development) | Vercel → Settings → Environment Variables | ⚠️ WYMAGA DZIAŁANIA |
| B2 | Ustaw co najmniej jeden AI key: `OPENAI_API_KEY` lub `ANTHROPIC_API_KEY` lub `GEMINI_API_KEY` w Supabase Secrets | Supabase Dashboard → Edge Functions → Secrets | ⚠️ WYMAGA DZIAŁANIA |
| B3 | Ustaw `RESEND_API_KEY` w Supabase Secrets (email delivery) | Supabase Dashboard → Edge Functions → Secrets | ⚠️ WYMAGA DZIAŁANIA |
| B4 | Ustaw `FRONTEND_URL` w Supabase Secrets (linki w emailach) | Supabase Dashboard → Edge Functions → Secrets | ⚠️ WYMAGA DZIAŁANIA |
| B5 | Ustaw `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DB_PASSWORD`, `ANON_KEY` w GitHub Secrets | GitHub → Repo Settings → Secrets and variables → Actions | ⚠️ WYMAGA DZIAŁANIA |
| B6 | Uruchom migracje bazy danych (`supabase db push` lub przez Supabase Dashboard) | Supabase Dashboard → SQL Editor lub GitHub Actions → `supabase-deploy.yml` | ⚠️ WYMAGA DZIAŁANIA |
| B7 | Zweryfikuj RLS policy na tabeli `user_roles` — SELECT musi wymagać `auth.uid() = user_id` | Supabase Dashboard → Table Editor → user_roles → Policies | ⚠️ WYMAGA DZIAŁANIA |
| B8 | Ustaw domenę produkcyjną: `VITE_PUBLIC_SITE_URL` w Vercel + zaktualizuj Supabase Auth → URL Configuration | Vercel + Supabase Dashboard | ⚠️ WYMAGA DZIAŁANIA |
| B9 | Sprawdź Supabase Auth → URL Configuration: dodaj produkcyjną domenę do Redirect URLs | Supabase Dashboard → Authentication → URL Configuration | ⚠️ WYMAGA DZIAŁANIA |

---

## SEKCJA C — Manual Smoke Test po deployment

Wykonaj po każdym deployu do produkcji (około 15 minut):

| # | Test | Oczekiwany wynik |
|---|------|-----------------|
| C1 | Otwórz `https://[twoja-domena]/` (landing page) | Ładuje się bez błędów JS w konsoli |
| C2 | Otwórz `/login` i zaloguj się | Przekierowanie na `/dashboard` |
| C3 | Dashboard → widoczne statystyki | Bez spinner infinite / błędów sieci |
| C4 | Utwórz klienta → projekt → wycenę | Zapisuje bez błędu |
| C5 | Generuj PDF dla wyceny | PDF generuje się, można pobrać |
| C6 | Wyślij ofertę emailem | Toast "wysłano", email dociera do skrzynki |
| C7 | Otwórz link `/offer/[token]` jako klient | Strona ładuje się bez logowania |
| C8 | Zaakceptuj ofertę przez portal klienta | Status zmienia się na "accepted" |
| C9 | `/api/health` lub `/version.json` — sprawdź wersję buildu | Zwraca JSON z appVersion i buildTimestamp |
| C10 | Wyloguj się | Przekierowanie na `/login`, brak stale state |

---

## SEKCJA D — Launch Gate Decyzja

```
Produkcja MOŻE być wdrożona gdy:
  ✅ WSZYSTKIE pozycje A1–A10 zielone (CI pass)
  ✅ WSZYSTKIE pozycje B1–B9 ukończone przez właściciela
  ✅ WSZYSTKIE pozycje C1–C10 zaliczone manualnie

Produkcja NIE MOŻE być wdrożona gdy:
  ❌ Jakiekolwiek A* czerwone (CI fail)
  ❌ B2 lub B3 nieukończone (brak AI / email nie działa)
  ❌ B6 nieukończone (migracje nie uruchomione)
  ❌ C4, C5, C6 lub C8 fail (core business flow broken)
```

---

## SEKCJA E — Znane Owner Blockers (stan na 2026-03-19)

Poniższe blokery NADAL wymagają działania właściciela — **nie są przeszkodą kodu, są przeszkodą operacyjną**:

1. **[CRITICAL] AI Provider Key** — bez `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / `GEMINI_API_KEY` w Supabase Secrets, funkcja AI Assistant zwraca "błąd komunikacji". Kod jest poprawny (fix: commit `5099064`), tylko secret brakuje.

2. **[CRITICAL] RESEND_API_KEY** — bez tego klucza, wysyłka ofert emailem (core flow) nie działa. Edge Function `send-offer-email` wymaga tego sekretu.

3. **[HIGH] GitHub Secrets dla CI/CD** — `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `DB_PASSWORD`, `ANON_KEY` muszą być ustawione aby workflow `deployment-truth.yml` mógł wdrożyć backend.

4. **[HIGH] Supabase Auth URL Configuration** — po podpięciu własnej domeny, należy zaktualizować Redirect URLs w Supabase Auth, inaczej logowanie OAuth nie działa.

5. **[MEDIUM] user_roles RLS** — UNKNOWN status (nie weryfikowany). Wymaga manualnego sprawdzenia przez właściciela w Supabase Dashboard.

6. **[MEDIUM] VITE_PUBLIC_SITE_URL** — sitemap generuje się z prawidłowym domyślnym URL (`majster-ai-oferty.vercel.app`), ale dla własnej domeny należy ustawić tę zmienną w Vercel przed buildem.

---

## SEKCJA F — Ścieżka naprawy (jeśli coś się posypie)

Patrz: [`docs/runbooks/RELEASE_RUNBOOK.md`](runbooks/RELEASE_RUNBOOK.md) — procedury rollback, hotfix, weryfikacji post-deploy.

---

*Dokument generowany na podstawie audytu 2026-03-19. Aktualizować po każdym sprincie lub major release.*

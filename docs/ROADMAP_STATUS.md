# Majster.AI — Status Roadmapy (Tracker)

> **Źródło prawdy:** [`ROADMAP.md`](./ROADMAP.md) | Aktualizuj ten plik PO KAŻDYM MERGE.
> Format: `docs: aktualizuj status PR-XX w ROADMAP_STATUS`

**Ostatnia aktualizacja:** 2026-03-01 (PR-03 DONE)
**Prowadzi:** Tech Lead (Claude) + Product Owner (Robert B.)

---

## Legenda statusów

| Symbol | Status | Znaczenie |
|--------|--------|-----------|
| ⬜ TODO | Nie rozpoczęty | PR jest zaplanowany, praca nie ruszyła |
| 🔵 IN PROGRESS | W trakcie | Trwa kodowanie / review |
| 🟡 REVIEW | W review | PR otwarto, czeka na approve |
| ✅ DONE | Scalony | PR zmerge'owany do `main` |
| 🔴 BLOCKED | Zablokowany | Czeka na zewnętrzny input |
| ❌ CANCELLED | Anulowany | Zakres usunięty z planu |

---

## Tabela statusów PR-00..PR-20

| PR | Nazwa | Status | Branch / PR Link | Data merge | Uwagi |
|----|-------|--------|-----------------|------------|-------|
| **PR-00** | Roadmap-as-code | 🔵 IN PROGRESS | `claude/pr-00-roadmap-as-code-ZDfe2` | — | Ten PR |
| **PR-01** | Tooling: i18n Gate + Sentry | ✅ DONE | `claude/tooling-fundamentals-pr-01-VoocS` | 2026-03-01 | i18n gate + Sentry release tag + version metadata |
| **PR-02** | Security Baseline + RLS | ✅ DONE | `claude/security-baseline-rls-Ad5Tx` | 2026-03-01 | SECURITY_BASELINE.md + RLS template + IDOR procedure |
| **PR-03** | Design System + UI States | ✅ DONE | `claude/design-system-ui-states-ufHHS` | 2026-03-01 | Tokens (CSS vars), SkeletonBlock/List, EmptyState, ErrorState, touch targets, UI_SYSTEM.md |
| **PR-04** | Social Login PACK | ⬜ TODO | — | — | Wymaga merge PR-03 |
| **PR-05** | Profil firmy + Ustawienia | ⬜ TODO | — | — | Wymaga merge PR-04 |
| **PR-06** | Free plan + paywall | ⬜ TODO | — | — | Wymaga merge PR-05 |
| **PR-07** | Shell (FF_NEW_SHELL) | ⬜ TODO | — | — | **PIVOT** — wymaga PR-06 |
| **PR-08** | CRM + Cennik | ⬜ TODO | — | — | Wymaga merge PR-07 |
| **PR-09** | Oferty A: lista + statusy | ⬜ TODO | — | — | Wymaga merge PR-08 |
| **PR-10** | Oferty B1: Wizard bez PDF | ⬜ TODO | — | — | Wymaga merge PR-09 |
| **PR-11** | Oferty B2: PDF + wysyłka | ⬜ TODO | — | — | Wymaga merge PR-10 |
| **PR-12** | Oferty C: domykanie | ⬜ TODO | — | — | Wymaga merge PR-11 |
| **PR-13** | Projekty + QR status | ⬜ TODO | — | — | Wymaga merge PR-12 |
| **PR-14** | Burn Bar BASIC | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-15** | Fotoprotokół + podpis | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-16** | Teczka dokumentów | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-17** | Wzory dokumentów | ⬜ TODO | — | — | Wymaga merge PR-16 |
| **PR-18** | Gwarancje + przypomnienia | ⬜ TODO | — | — | Wymaga merge PR-13 |
| **PR-19** | PWA Offline minimum | ⬜ TODO | — | — | Wymaga merge PR-07 |
| **PR-20** | Stripe Billing | ⬜ TODO | — | — | Wymaga merge PR-06 i PR-07 |

---

## PR-01 — Tooling Fundamentals: co zostało wdrożone

### i18n Gate
- **Skrypt:** `scripts/i18n/gate-pr-changes.sh`
- **CI step:** `.github/workflows/i18n-ci.yml` — krok "i18n Gate — block new hardcoded strings"
- **Zasada:** Sprawdza TYLKO pliki zmienione w danym PR (vs gałąź bazowa). Nowe polskie znaki diakrytyczne w `src/components/`, `src/pages/`, `src/hooks/` powodują błąd CI (exit 1).
- **Pliki testowe:** wyłączone (`*.test.ts`, `*.spec.tsx`)
- **Legacy violations:** raportowane (krok 2a, `continue-on-error: true`), nie blokują

### Sentry (monitoring błędów)
- **SDK:** `@sentry/react` + `@sentry/vite-plugin` (już w dependencies)
- **Init:** `src/lib/sentry.ts` — `initSentry()` wywoływana z `src/main.tsx`
- **Env vars do ustawienia w Vercel:**
  - `VITE_SENTRY_DSN` — DSN z dashboardu Sentry (wymagane do aktywacji)
  - `VITE_SENTRY_AUTH_TOKEN` — token do uploadu source maps (opcjonalne)
  - `VITE_SENTRY_ORG` — slug organizacji Sentry (opcjonalne)
  - `VITE_SENTRY_PROJECT` — nazwa projektu Sentry (opcjonalne)
- **Graceful degradation:** gdy `VITE_SENTRY_DSN` brak — Sentry wyłączone, app działa normalnie
- **Release tag:** `majster-ai@{APP_VERSION}` — każde zdarzenie tagowane wersją apki

### Wersjonowanie
- **Plik:** `src/lib/version.ts` — eksportuje `APP_VERSION` i `APP_NAME`
- **Źródło:** `package.json` → `version` → injektowane przez Vite `define` jako `__APP_VERSION__`
- **Boot log:** `src/main.tsx` → `logger.info("Majster.AI v{wersja} starting")`
- **Aktualna wersja:** `0.1.0-alpha` (z `package.json`)

---

## PR-02 — Security Baseline + RLS Standard: co zostało wdrożone

### Dokumentacja bezpieczeństwa
- **Główny dokument:** `docs/SECURITY_BASELINE.md` — pełny standard RLS, procedura IDOR, wytyczne logowania, CSP, rate limiting, backup/erasure
- **Szablon polityk:** `supabase/policies/rls_policy_template.sql` — 4 wzorce RLS (prywatny, org, token, systemowy) + helper SQL weryfikujący RLS

### Kluczowe sekcje SECURITY_BASELINE.md
1. **RLS-by-default** — każda tabela musi mieć `user_id` + RLS + 4 polityki
2. **Szablon migracji** — copy/paste snippet dla nowych tabel (wzorzec A i B)
3. **Procedura IDOR** — kroki dla 2 kont testowych: SELECT/UPDATE/DELETE + curl API
4. **Logowanie i higiena** — co logować, co nie (PII), request-id pattern
5. **CSP** — dokumentacja istniejących nagłówków w vercel.json + procedura zmian
6. **Rate limiting** — gdzie stosować, wzorzec kodu (do użycia przy konkretnych PR)
7. **Cookies/sesje** — stan obecny Supabase Auth, uwagi bezpieczeństwa
8. **Backup/erasure** — retencja 30 dni, kaskadowe usunięcie, snapshoty

### Stan istniejącego RLS (audyt przy PR-02)
- Wszystkie tabele core (`clients`, `projects`, `quotes`, `pdf_data`) mają RLS włączone od migracji `20251205160746`
- Tabele admin (`admin_system_settings`, `admin_audit_log`, `admin_theme_config`) mają RLS org-based od `20260203141118`
- `vercel.json` zawiera kompletny zestaw nagłówków bezpieczeństwa (CSP, HSTS, X-Frame-Options)
- Brak tabel bez RLS (weryfikacja SQL w `supabase/policies/rls_policy_template.sql`)

### Co przyszłe PR-y muszą spełniać
Każdy PR tworzący tabele z danymi użytkownika musi użyć szablonu z `SECURITY_BASELINE.md Sekcja 2` i przeprowadzić test IDOR z `Sekcji 3`. Wyniki testu IDOR wklejone w opis PR.

---

## Checklista DoD per PR (skopiuj przy każdym PR)

Przed każdym merge wypełnij i wklej w opis PR:

```markdown
### Checklista DoD — PR-XX [NAZWA]

**CI / No Green No Finish:**
- [ ] `npm run lint` → 0 błędów
- [ ] `npm test` → wszystkie testy zielone
- [ ] `npm run build` → OK
- [ ] `npm run type-check` → 0 błędów TypeScript
- [ ] `npm audit --audit-level=high` → 0 wysokich CVE

**Scope Fence:**
- [ ] Diff zawiera TYLKO pliki z zaplanowanego zakresu
- [ ] Brak zmian "przy okazji"

**Jakość:**
- [ ] i18n: zero hardcoded tekstów (PL/EN/UK)
- [ ] RLS: nowe tabele mają polityki + test IDOR
- [ ] Walidacja Zod na formularzach
- [ ] Typy TypeScript bez `any`

**FF_NEW_SHELL (od PR-07):**
- [ ] Działa przy FF_NEW_SHELL=ON
- [ ] Działa przy FF_NEW_SHELL=OFF

**Dokumentacja:**
- [ ] ROADMAP_STATUS.md zaktualizowany po merge
- [ ] ADR dodany jeśli podjęto istotną decyzję

**Rollback:**
- [ ] Plan rollback opisany w PR
- [ ] Migracje odwracalne (jeśli dotyczy)
```

---

## Historia merge'ów

| Data | PR | Commit | Uwagi |
|------|----|--------|-------|
| 2026-03-01 | PR-00 | *(po merge)* | Roadmap-as-code — źródło prawdy |
| 2026-03-01 | PR-01 | `claude/tooling-fundamentals-pr-01-VoocS` | i18n gate (gate-pr-changes.sh) + Sentry release + version.ts |
| 2026-03-01 | PR-02 | `claude/security-baseline-rls-Ad5Tx` | SECURITY_BASELINE.md + RLS template (4 wzorce) + procedura IDOR |
| 2026-03-01 | PR-03 | `claude/design-system-ui-states-ufHHS` | SkeletonBlock/List, EmptyState (ctaLabel/onCta), ErrorState, .touch-target, UI_SYSTEM.md |

> *Uzupełniaj tabelę po każdym merge. Format: `docs: aktualizuj status PR-XX`*

---

## Wskaźniki postępu

```
Faza 0 (Fundament):     3/3 PR  ██████████  100%
Faza 1 (Dostęp):        0/3 PR  ░░░░░░░░░░  0%
Faza 2 (Shell):         0/1 PR  ░░░░░░░░░░  0%
Faza 3 (Dane/Oferty):   0/2 PR  ░░░░░░░░░░  0%
Faza 4 (Oferty flow):   0/3 PR  ░░░░░░░░░░  0%
Faza 5 (Projekty):      0/6 PR  ░░░░░░░░░░  0%
Faza 6 (Offline+$):     0/2 PR  ░░░░░░░░░░  0%
─────────────────────────────────────────
RAZEM:                  0/20 PR ░░░░░░░░░░  0%
(PR-00 nie wliczany do progresu funkcjonalnego)
```

*Aktualizuj ręcznie po każdym merge.*

---

*Tracker: v1.0 | Data: 2026-03-01 | Właściciel: Robert B. + Claude*

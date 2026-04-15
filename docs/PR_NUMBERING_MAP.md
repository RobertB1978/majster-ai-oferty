# Majster.AI — Mapa Numeracji PR

> **Cel:** Ten dokument wyjaśnia niejednoznaczność numeracji PR między dokumentami projektu.
> Powstał aby zapobiec pomyleniu przez nowego czytelnika starej numeracji archiwalnej
> z nową numeracją wykonawczą.
> Źródło dowodów: `docs/AUDIT_A2_CORE_DOCS_CONSISTENCY_2026-04-14.md` (sprzeczność C-03, C-04).

---

## Problem: te same numery — różne zadania

Historia projektu zawiera **dwa niezależne schematy numeracji PR**:

| Schemat | Notacja | Dokument źródłowy | Stan |
|---------|---------|-------------------|------|
| **Stary** (ROADMAP_ENTERPRISE v4) | `PR#00..PR#06+` | `docs/ROADMAP_ENTERPRISE.md` | ⚠️ ARCHIWUM |
| **Nowy** (ROADMAP.md v5) | `PR-00..PR-20` | `docs/ROADMAP.md` | ✅ AKTYWNY |
| **Post-roadmap** (seria wykonawcza) | `PR-SUPA-xx`, `PR-SEC-xx`, `PR-ARCH-xx`, … | `docs/ROADMAP_STATUS.md` (sekcja post PR-20) | ✅ AKTYWNY |

**⚠️ Kluczowa zasada:** Numery `PR#01..PR#06` ze starej notacji **nie są tożsame**
z numerami `PR-01..PR-06` z nowej notacji. Odnoszą się do zupełnie innych zadań.

---

## Mapa: stara numeracja → nowa numeracja

| Stara notacja (ARCHIWUM) | Zadanie w ROADMAP_ENTERPRISE v4 | Nowa notacja (AKTYWNA) | Zadanie w ROADMAP.md v5 |
|---|---|---|---|
| PR#00 | SOURCE OF TRUTH — instalacja docs | PR-00 | Roadmap-as-code |
| PR#01 | Deployment Truth | PR-01 | Tooling: i18n Gate + Sentry |
| PR#02 | Security Baseline | PR-02 | Security Baseline + RLS |
| PR#03 | Branch Protection | PR-03 | Design System + UI States |
| PR#04 | CRM Clients | PR-04 | Social Login PACK |
| PR#05 | Billing | PR-05 | Profil firmy + Ustawienia |
| PR#06 | AI Quote Generation | PR-06 | Free plan + paywall |

> Stara numeracja była używana w `docs/TRUTH.md` (snapshot 2026-02-18)
> i `docs/ROADMAP_ENTERPRISE.md` (v4, archiwum).
> Nowa numeracja PR-00..PR-20 jest w `docs/ROADMAP_STATUS.md` i `docs/ROADMAP.md`.

---

## Post-Roadmap Executive Series (kwiecień 2026)

Po zamknięciu PR-00..PR-20, nowe PR-y wykonawcze używają notacji
`PR-<SERIA>-<NUM>` i mają przypisane numery GitHub PR:

| PR | GitHub # | Status | Opis | Audyt |
|----|----------|--------|------|-------|
| PR-SUPA-01 | #684 | ✅ MERGED | Supabase types sync (ręczna rekonstrukcja schematu prod) | A3 |
| PR-SUPA-02 | #685 | ✅ MERGED | config.toml: rejestracja 2 brakujących Edge Functions | A3 |
| PR-SEC-01 | #686 | ✅ MERGED | SECURITY DEFINER RPC dla publicznego dostępu do ofert | A3 |
| PR-ARCH-01 | #687 | ✅ MERGED | Kanoniczny flow publiczny oferty (FLOW-B) + ADR-0014 | A3 |
| PR-ARCH-02 | #688 | ✅ MERGED | Usunięcie dead code (5 hooków + 1 komponent) + COMPATIBILITY_MATRIX | A3 |
| PR-INFRA-01 | #689 | 🟡 OPEN | SEO fix: canonical/og:url/sitemap — CI 13/13 green, Vercel preview READY | A4 |
| PR-OPS-01 | #690 | ✅ MERGED | Phantom hash audyt, kolizja ADR→ADR-0014, DOCS_INDEX, banery ARCHIWUM | A4 |
| PR-OPS-02 | #691 | ✅ MERGED | Repo hygiene: runbook + inventory (687 branchy, 68 otwartych PR) | A4 |
| PR-BE-LOW-01 | #692 | ✅ MERGED | Centralizacja bucket names w storage.ts (14 hardcoded stringów) | A4 |
| PR-DOCS-01 | #694 | ✅ MERGED | FF_MODE_B_DOCX_ENABLED gate w ReadyDocuments (foundation only) | A4 |
| PR-A2-FIX | #699 | ✅ MERGED | Naprawiono 3 sprzeczności HIGH z audytu A2: C-01, C-02, C-06 | — |
| BOOKKEEP-01 | *(ten PR)* | 🔵 IN PROGRESS | Bookkeeping: truth/status docs + ta mapa numeracji | — |

> **PR-INFRA-01 (#689):** Czeka na decyzję Roberta (merge lub close).
> CI 13/13 green. Wymaga też weryfikacji `VITE_PUBLIC_SITE_URL=https://majsterai.com`
> w Vercel Dashboard → Settings → Environment Variables → Production scope.

---

## Dokumenty używające starej vs nowej numeracji

| Dokument | Notacja | Uwaga |
|----------|---------|-------|
| `docs/TRUTH.md` | `PR#xx` (stara) | Snapshot 2026-02-18 — ARCHIWUM |
| `docs/ROADMAP_ENTERPRISE.md` | `PR#xx` (stara) | v4 — ARCHIWUM |
| `docs/ROADMAP.md` | `PR-xx` (nowa) | v5 — AKTYWNY SOURCE OF TRUTH |
| `docs/ROADMAP_STATUS.md` | `PR-xx` + `PR-SERIA-xx` | Aktywny tracker — aktualizuj po każdym merge |
| `docs/DECISIONS.md` | `PR-SERIA-xx` | Log decyzji architektonicznych |

---

*Dokument: v1.0 | 2026-04-15 | BOOKKEEP-01 — zapobieganie pomyleniu numeracji*

# Majster.AI — Indeks Dokumentacji (Source-of-Truth Navigation)

> **Cel:** Jeden plik nawigacyjny wskazujący, który dokument jest autorytatywny dla każdego obszaru.
> Patrz też: [`docs/ADR/ADR-0000-source-of-truth.md`](./ADR/ADR-0000-source-of-truth.md)

**Ostatnia aktualizacja:** 2026-04-14 (PR-OPS-01)

---

## Źródła Prawdy (Core Truth Files)

| Dokument | Ścieżka | Co rozstrzyga |
|----------|---------|---------------|
| **Roadmapa (źródło prawdy v5)** | [`docs/ROADMAP.md`](./ROADMAP.md) | Kolejność prac PR-00..PR-20, reguły globalne G1-G10, DoD per PR |
| **Tracker statusów PR** | [`docs/ROADMAP_STATUS.md`](./ROADMAP_STATUS.md) | Aktualny status każdego PR (DONE/IN PROGRESS/TODO) |
| **ADR — decyzje architektoniczne** | [`docs/ADR/`](./ADR/) | Każda kluczowa decyzja techniczna z uzasadnieniem |
| **Stan wdrożenia** | [`docs/DEPLOYMENT_TRUTH.md`](./DEPLOYMENT_TRUTH.md) | PASS/FAIL Vercel + Supabase, ścieżka canonical deploy |
| **Konfiguracja Supabase** | [`docs/SINGLE_SOURCE_OF_TRUTH.md`](./SINGLE_SOURCE_OF_TRUTH.md) | Jedyny `project_id` produkcyjny, jak zmienić |
| **Log decyzji** | [`docs/DECISIONS.md`](./DECISIONS.md) | Append-only log wszystkich decyzji architektonicznych |
| **Mapa numeracji PR** | [`docs/PR_NUMBERING_MAP.md`](./PR_NUMBERING_MAP.md) | Disambiguacja starej numeracji PR#xx (archiwum) vs nowej PR-xx (v5) vs serii post-roadmap |
| **Macierz śledzenia** | [`docs/TRACEABILITY_MATRIX.md`](./TRACEABILITY_MATRIX.md) | Wymaganie → kod → PR → test → status |
| **Playbook PR** | [`docs/PR_PLAYBOOK.md`](./PR_PLAYBOOK.md) | Proces PR: szablon, zasady, workflow |

---

## ADR — Rejestr Decyzji Architektonicznych

| Nr | Plik | Temat | Status |
|----|------|-------|--------|
| ADR-0000 | [`ADR/ADR-0000-source-of-truth.md`](./ADR/ADR-0000-source-of-truth.md) | `ROADMAP.md` jako jedyne źródło prawdy | AKTYWNY |
| ADR-0001 | [`ADR/ADR-0001-current-stack-fact.md`](./ADR/ADR-0001-current-stack-fact.md) | Bieżący stack technologiczny | AKTYWNY |
| ADR-0002 | [`ADR/ADR-0002-csp-frame-ancestors.md`](./ADR/ADR-0002-csp-frame-ancestors.md) | CSP frame-ancestors policy | AKTYWNY |
| ADR-0003 | [`ADR/ADR-0003-field-os-refactor.md`](./ADR/ADR-0003-field-os-refactor.md) | Field OS refactor scope | AKTYWNY |
| ADR-0004 | [`ADR/ADR-0004-free-tier-limit.md`](./ADR/ADR-0004-free-tier-limit.md) | Free tier limit = 3 oferty/miesiąc | AKTYWNY |
| ADR-0005 | [`ADR/ADR-0005-shell-feature-flag.md`](./ADR/ADR-0005-shell-feature-flag.md) | FF_NEW_SHELL feature flag (PR-07) | AKTYWNY |
| ADR-0006 | [`ADR/ADR-0006-qr-status-scope.md`](./ADR/ADR-0006-qr-status-scope.md) | QR status — brak cen dla klienta | AKTYWNY |
| ADR-0007 | [`ADR/ADR-0007-burn-bar-basic.md`](./ADR/ADR-0007-burn-bar-basic.md) | Burn Bar — budżet z oferty netto | AKTYWNY |
| ADR-0008 | [`ADR/ADR-0008-offline-minimum.md`](./ADR/ADR-0008-offline-minimum.md) | PWA offline minimum (read-only) | AKTYWNY |
| ADR-0009 | [`ADR/ADR-0009-onboarding-scope.md`](./ADR/ADR-0009-onboarding-scope.md) | Onboarding scope (3 kroki, raz) | AKTYWNY |
| ADR-0010 | [`ADR/ADR-0010-compliance-inspections-source-of-truth.md`](./ADR/ADR-0010-compliance-inspections-source-of-truth.md) | Przeglądy techniczne — podstawa prawna | AKTYWNY |
| ADR-0011 | *(brak — numer zarezerwowany)* | — | — |
| ADR-0012 | [`ADR/ADR-0012-admin-rbac-route-split.md`](./ADR/ADR-0012-admin-rbac-route-split.md) | Admin RBAC route split | AKTYWNY |
| ADR-0013 | [`ADR/ADR-0013-dynamic-docx-mode-b.md`](./ADR/ADR-0013-dynamic-docx-mode-b.md) | Dynamic DOCX Mode B | AKTYWNY |
| ADR-0014 | [`ADR/ADR-0014-public-offer-canonical-flow.md`](./ADR/ADR-0014-public-offer-canonical-flow.md) | Kanoniczny flow publiczny oferty (PR-ARCH-01) | AKTYWNY |

> **Uwaga ADR-0011:** Numer jest wolny — gap między ADR-0010 a ADR-0012 wynika z wycofania
> roboczego draftu ADR-0011 przed jego zatwierdzeniem (brak zatwierdzonego pliku w historii git).
> Numer **nie zostanie ponownie użyty** (zasada append-only numeracji ADR).
> Następne nowe ADR: **ADR-0015** i dalej.

---

## Pliki Operacyjne (Runbooks)

| Dokument | Ścieżka | Zastosowanie |
|----------|---------|-------------|
| Billing runbook | [`docs/BILLING_RUNBOOK.md`](./BILLING_RUNBOOK.md) | Stripe billing, konfiguracja, troubleshooting |
| Email delivery | [`docs/EMAIL_DELIVERY_RUNBOOK.md`](./EMAIL_DELIVERY_RUNBOOK.md) | Resend, email delivery issues |
| Operator runbook | [`docs/OPERATOR_RUNBOOK.md`](./OPERATOR_RUNBOOK.md) | Ogólne operacje produkcyjne |
| Deploy DB parity | [`docs/DEPLOY_DB_PARITY_RUNBOOK.md`](./DEPLOY_DB_PARITY_RUNBOOK.md) | Migracje DB vs Vercel parity |
| Checklist Supabase | [`docs/SUPABASE_SETUP_CHECKLIST.md`](./SUPABASE_SETUP_CHECKLIST.md) | Setup Supabase krok po kroku |

---

## Bezpieczeństwo i Compliance

| Dokument | Ścieżka | Zastosowanie |
|----------|---------|-------------|
| Security baseline | [`docs/SECURITY_BASELINE.md`](./SECURITY_BASELINE.md) | Standard bezpieczeństwa, RLS template |
| Compatibility matrix | [`docs/COMPATIBILITY_MATRIX.md`](./COMPATIBILITY_MATRIX.md) | Publiczne flow ofert — legacy vs canonical |
| Account deletion | [`docs/COMPLIANCE/ACCOUNT_DELETION.md`](./COMPLIANCE/ACCOUNT_DELETION.md) | RODO, usuwanie kont |
| Inspections PL | [`docs/COMPLIANCE/INSPECTIONS_PL.md`](./COMPLIANCE/INSPECTIONS_PL.md) | Podstawy prawne przeglądów technicznych |

---

## Dokumenty Archiwalne (tylko do odczytu)

Poniższe pliki są zachowane wyłącznie jako historia projektu. Zawierają stan z konkretnej daty.
**Nie aktualizuj.** Dla aktualnego stanu używaj plików z sekcji "Źródła Prawdy" powyżej.

| Dokument archiwalny | Zastąpiony przez | Data snapshotu |
|---------------------|-----------------|----------------|
| `docs/ROADMAP_ENTERPRISE.md` (v4) | `docs/ROADMAP.md` (v5) | 2026-02-08 |
| `docs/ULTRA_ENTERPRISE_ROADMAP.md` | `docs/ROADMAP.md` (v5) | 2026-03 |
| `docs/TRUTH.md` | `docs/ROADMAP_STATUS.md` + `docs/STAN_PROJEKTU.md` | 2026-02-18 |
| `docs/AUDIT_*.md`, `docs/AUDYT_*.md` | `docs/ROADMAP_STATUS.md` | różne daty |
| `docs/FINAL_*.md`, `docs/META_AUDIT_*.md` | `docs/ROADMAP_STATUS.md` | różne daty |
| `docs/COMPREHENSIVE_AUDIT_*.md` | `docs/ROADMAP_STATUS.md` | różne daty |

---

## Aktywne Raporty Audytowe (seria 2026-04)

> Te raporty są **aktywne** — dokumentują zamknięcie i pozostałe issues serii post-roadmap.
> Nie są archiwum — zawierają evidence i macierze statusów do przyszłego użytku.

| Raport | Opis |
|--------|------|
| [`docs/AUDIT_A2_CORE_DOCS_CONSISTENCY_2026-04-14.md`](./AUDIT_A2_CORE_DOCS_CONSISTENCY_2026-04-14.md) | Audyt spójności core docs — 7 sprzeczności C-01..C-07 |
| [`docs/AUDIT_A3_PACK1_CLOSURE_2026-04-14.md`](./AUDIT_A3_PACK1_CLOSURE_2026-04-14.md) | Closure Pack 1: PR-SUPA-01/02, PR-SEC-01, PR-ARCH-01/02 |
| [`docs/AUDIT_A4_PACK2_CLOSURE_2026-04-14.md`](./AUDIT_A4_PACK2_CLOSURE_2026-04-14.md) | Closure Pack 2: PR-INFRA-01 (OPEN), PR-OPS-01/02, PR-BE-LOW-01, PR-DOCS-01 |
| [`docs/AUDIT_A5A_FINAL_STATUS_MATRIX_2026-04-14.md`](./AUDIT_A5A_FINAL_STATUS_MATRIX_2026-04-14.md) | Final status matrix: 8 PASS, 1 CONDITIONAL, 1 OPEN |
| [`docs/AUDIT_A5B1_REMAINING_ISSUES_MATRIX_2026-04-15.md`](./AUDIT_A5B1_REMAINING_ISSUES_MATRIX_2026-04-15.md) | Remaining issues matrix + Deferred work + External decisions |

---

## Sprzeczności Naprawione w PR-OPS-01

Poniższe sprzeczności między core docs zostały naprawione 2026-04-14:

| # | Plik | Problem | Naprawa |
|---|------|---------|---------|
| 1 | `ROADMAP_ENTERPRISE.md:31` | Twierdziło że `ROADMAP.md` jest przestarzały (ODWROTNIE niż rzeczywistość) | Dodano baner ARCHIWUM + korekta fałszywego twierdzenia |
| 2 | `ROADMAP_STATUS.md:28` | PR-00 w statusie 🔵 IN PROGRESS mimo że roadmapa jest w repo od 2026-03-01 | Zmieniono na ✅ DONE z datą 2026-03-01 |
| 3 | `ULTRA_ENTERPRISE_ROADMAP.md:7` | Twierdziło „jedynym źródłem prawdy" — sprzeczne z ADR-0000 | Dodano baner ARCHIWUM + korekta |
| 4 | `TRUTH.md:1` | Stan z 2026-02-18 prezentowany bez ostrzeżenia jako aktualny | Dodano baner SNAPSHOT z linkami do aktualnych docs |
| 5 | `docs/ADR-0005-public-offer-canonical-flow.md` | Błędny numer (ADR-0005 zajęty przez FF_NEW_SHELL) + misplace poza `docs/ADR/` | Przeniesiono jako `docs/ADR/ADR-0014-public-offer-canonical-flow.md` |
| 6 | `COMPATIBILITY_MATRIX.md` + `DECISIONS.md` | Referencja do „ADR-0005 (PR-ARCH-01)" — niejednoznaczna | Zaktualizowano na ADR-0014 |

## Sprzeczności Naprawione w PR#699 (2026-04-14)

| ID | Plik | Problem (z audytu A2) | Naprawa |
|----|------|----------------------|---------|
| C-01 | `ROADMAP_ENTERPRISE.md:229` | Resztka "Superseded" twierdząca że ENTERPRISE zastępuje ROADMAP.md — sprzeczna z banerem ARCHIWUM | Zmieniono na "Superseded by: ROADMAP.md v5" |
| C-02 | `ROADMAP_STATUS.md:416-431` | Wskaźniki postępu 12/20=60% sprzeczne z tabelą 20/20=100% DONE | Zaktualizowano wszystkie wskaźniki do 100% |
| C-06 | `ULTRA_ENTERPRISE_ROADMAP.md:sekcja 31` | Dokument oznaczony archiwum zawierał wykonywalne prompty bez ostrzeżenia | Dodano wyraźne ostrzeżenia archiwalne i przekreślono instrukcje kopiowania |

---

## Audit: Hash `5669817`

**Data audytu:** 2026-04-14 (PR-OPS-01)

Pełne przeszukanie repo dla ciągu `5669817`:
- `grep -r "5669817" .` — **zero trafień**
- `git log --all --oneline | grep "5669817"` — **zero trafień**
- `git show 5669817` — `fatal: ambiguous argument '5669817'` (hash nie istnieje)

**Werdykt:** Referencja `5669817` jest całkowicie fałszywa / fantomowa.
Nigdy nie była zapisana w żadnym pliku ani w historii git.
Żaden plik nie wymaga poprawki. Audit zamknięty — wynik negatywny.

Patrz też: `docs/DECISIONS.md` — wpis z 2026-04-14.

---

*Dokument: v1.2 | 2026-04-15 | BOOKKEEP-01 — dodano PR_NUMBERING_MAP, aktywne raporty audytowe, wpis PR#699*

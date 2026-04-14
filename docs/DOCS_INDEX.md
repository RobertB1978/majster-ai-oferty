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

> **Uwaga ADR-0011:** Numer jest wolny (gap między ADR-0010 a ADR-0012). Następne nowe ADR powinny
> używać ADR-0015 i dalej, chyba że ADR-0011 zostanie celowo wypełniony.

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

## Audyty i Raporty (Archiwum — tylko do odczytu)

Pliki audytów z dat 2026-02-xx do 2026-04-xx mają charakter historyczny.
**Nie aktualizuj** — służą do śledzenia historii projektu.

Aktualne statusy znajdziesz w `ROADMAP_STATUS.md` i `DEPLOYMENT_TRUTH.md`.

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

*Dokument: v1.0 | 2026-04-14 | PR-OPS-01 (docs cleanup)*

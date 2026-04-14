# AUDIT-A3 Closure Audit — Pack 1 (PR-SUPA-01 to PR-ARCH-02)

**Data:** 2026-04-14
**Audytor:** Claude Code Web (Repo Closure Auditor)
**Tryb:** read-only / evidence-first / merged-state verification only
**Branch:** `claude/audit-closure-pack-Gf3U7`

---

## CLAUDE.md Execution Note

CLAUDE.md przeczytany w pełni na początku sesji (załadowany jako kontekst systemowy).
Prompt zadania rozłożony na 13 atomowych wymagań w TodoWrite przed rozpoczęciem pracy.
Zasady przestrzegane: brak zmian implementacyjnych, PASS tylko z dowodem, polski język komunikacji.

---

## Files/Sources Read

### Dokumenty referencyjne (evidence map)
| Plik | Cel lektury |
|------|-------------|
| `CLAUDE.md` | Protokół sesji, zasady operacyjne |
| `docs/DECISIONS.md` | Log decyzji architektonicznych (linie 5-9) |
| `docs/DOCS_INDEX.md` | Nawigacja źródeł prawdy, tabela ADR, naprawione sprzeczności |
| `docs/COMPATIBILITY_MATRIX.md` | Macierz tras/tokenów/statusów public offer |
| `docs/ADR/ADR-0014-public-offer-canonical-flow.md` | Decyzja: FLOW-B jako kanoniczny |
| `docs/ROADMAP_STATUS.md` (linie 1-100) | Tabela statusów PR-00..PR-20 |
| `docs/TRACEABILITY_MATRIX.md` (linie 1-42) | Stary tracker ryzyk (2026-02-07) |
| `docs/SECURITY_BASELINE.md` (linie 1-50) | Standard bezpieczeństwa RLS |

### Pliki kodu (merged-state inspection)
| Plik | Target |
|------|--------|
| `src/integrations/supabase/types.ts` | PR-SUPA-01 |
| `supabase/config.toml` (linie 80-86) | PR-SUPA-02 |
| `supabase/functions/customer-portal/` (istnienie) | PR-SUPA-02 |
| `supabase/functions/request-plan/` (istnienie) | PR-SUPA-02 |
| `supabase/migrations/20260413120000_sec01_harden_offer_approvals_anon_access.sql` | PR-SEC-01 |
| `src/lib/publicOfferApi.ts` (linie 17-18, 63-66, 86) | PR-SEC-01 |
| `src/pages/OfferApproval.tsx` (linie 1-12, 61-74) | PR-SEC-01, PR-ARCH-01 |
| `src/pages/OfferPublicPage.tsx` (linie 1-13, 54, 91, 102) | PR-SEC-01, PR-ARCH-01 |
| `src/pages/OfferPublicAccept.tsx` (linie 1-22) | PR-ARCH-01 |
| `src/App.tsx` (linie 246-263) | PR-ARCH-01, PR-ARCH-02 |
| `src/hooks/useAcceptanceLink.ts` (linie 98-110) | PR-ARCH-01 |
| `src/hooks/useOfferApprovals.ts` (nieistnienie potwierdzone) | PR-ARCH-02 |
| `src/components/offers/OfferTrackingTimeline.tsx` (nieistnienie potwierdzone) | PR-ARCH-02 |
| `src/test/features/arch01-public-offer-canonical-flow.test.ts` | PR-ARCH-01 |
| `src/test/features/arch02-public-offer-phase2.test.ts` | PR-ARCH-02 |
| `src/test/features/sec01-harden-public-offer-access.test.ts` | PR-SEC-01 |

### Git history
| Komenda | Cel |
|---------|-----|
| `git log --oneline -50` | Identyfikacja commitów dla 5 targetów |
| `git show --stat <sha> --no-patch` (×5) | Weryfikacja plików zmienionych w każdym commicie |

---

## Closure Matrix — Pack 1

| Target | Status | Evidence | Files/Sources Read | What Was Done | What Failed / Was Not Done | Remaining Risk |
|--------|--------|----------|-------------------|---------------|---------------------------|----------------|
| **PR-SUPA-01** | **PASS** | Commit `483fec0` merged as #684. `types.ts` zawiera: `acceptance_links` (linia ~1925), `offer_public_actions` (~2285), `offer_variants` (~2320), profiles `address_line2`/`country`/`website`/`contact_email` (~741-814), `clients.nip` (~200), funkcje RPC `resolve_offer_acceptance_link` (~2901), `process_offer_acceptance_action` (~2902), `get_public_offer_photos` (~2906), `get_user_plan_limits` (~2909), enum `quality_tier` (~2913). Brak pliku migracji (zgodne z założeniem — types-only). | `src/integrations/supabase/types.ts`, commit message #684 | Ręczna rekonstrukcja typów z plików migracji SQL. Dwa passy (drugi dodał 6 dodatkowych kolumn: `offers.source`, `offers.vat_enabled`, `offer_items.metadata`, `offer_approvals.offer_id`, `user_subscriptions.cancel_at_period_end`/`trial_end`, `pdf_data.vat_rate`). | Brak — cel PR w pełni zrealizowany. | NISKI. Typy generowane ręcznie mogą dryfować od schematu przy następnych migracjach. Rekomendacja: uruchomić `supabase gen types` gdy CLI dostępne. |
| **PR-SUPA-02** | **PASS** | Commit `c4457b6` merged as #685. `config.toml:80-82` → `[functions.customer-portal]` z `verify_jwt = true`. `config.toml:84-86` → `[functions.request-plan]` z `verify_jwt = true`. Katalogi `supabase/functions/customer-portal/` i `supabase/functions/request-plan/` istnieją. `DECISIONS.md:5` zawiera wpis decyzyjny z datą 2026-04-13. | `supabase/config.toml`, `supabase/functions/customer-portal/`, `supabase/functions/request-plan/`, `docs/DECISIONS.md:5` | Rejestracja 2 brakujących Edge Functions w config. Log decyzji w DECISIONS.md. | Brak — cel PR w pełni zrealizowany. | NISKI. `TRACEABILITY_MATRIX.md:28` sygnalizował "config.toml missing 6/16 Edge Functions" — ten PR naprawił 2 z 6. Pozostałe 4 mogą nadal nie być zarejestrowane (wymaga osobnej weryfikacji). |
| **PR-SEC-01** | **PASS** | Commit `079a81e` merged as #686. Migracja `20260413120000_sec01_*.sql` dropuje 2 anon RLS policies, tworzy `get_offer_approval_by_token(uuid)` SECURITY DEFINER (exact token lookup, minimalne pola, wyklucza `accept_token`/`signature_data`) i `record_offer_viewed_by_token(uuid)`. REVOKE anon EXECUTE na `validate_offer_token`. `publicOfferApi.ts:63-66` używa `supabase.rpc('get_offer_approval_by_token')`. `OfferApproval.tsx:61-66` używa RPC. Typy w `types.ts:2907-2908`. Test suite w `sec01-harden-public-offer-access.test.ts` (20 testów: P1-P4, N1-N6, C1-C4, S1-S2). DECISIONS.md:6 loguje decyzję Option B. | Migracja SQL, `publicOfferApi.ts`, `OfferApproval.tsx`, `OfferPublicPage.tsx`, `types.ts`, test file, `DECISIONS.md:6` | Eliminacja podatności full-row-enumeration. SECURITY DEFINER zamiast RLS anon. Defense-in-depth (revoke validate_offer_token). Testy. | Brak — cel PR w pełni zrealizowany. | NISKI. `SECURITY_BASELINE.md` NIE został zaktualizowany o nowy wzorzec (SECURITY DEFINER zamiast RLS anon dla tokenizowanego dostępu publicznego). |
| **PR-ARCH-01** | **PASS** | Commit `1ce398a` merged as #687. `App.tsx:246-263` — CANONICAL + LEGACY COMPAT komentarze. `OfferPublicPage.tsx:1-8` — LEGACY COMPAT header, query key `['legacyOffer', token]`. `OfferApproval.tsx:1-12` — LEGACY COMPAT header z "DO NOT add new business logic". `OfferPublicAccept.tsx:1-10` — CANONICAL header z referencją do `CANONICAL_PUBLIC_OFFER_ROUTE`. `useAcceptanceLink.ts:102` — `CANONICAL_PUBLIC_OFFER_ROUTE = '/a/:token'`, `:105` — `LEGACY_PUBLIC_OFFER_ROUTES`, `:110` — `CANONICAL_OFFER_PATH_PREFIX`. ADR-0014 w `docs/ADR/`. 32+ testów w `arch01-public-offer-canonical-flow.test.ts`. | `App.tsx`, `OfferPublicPage.tsx`, `OfferApproval.tsx`, `OfferPublicAccept.tsx`, `useAcceptanceLink.ts`, `ADR-0014`, test file | Designacja FLOW-B jako kanoniczny. Fix query key collision. Stałe routów wyeksportowane. ADR opublikowany. Testy smoke. | Brak — cel PR w pełni zrealizowany. | NISKI. ADR-0014 nota: "SHA: do uzupełnienia po merge" (linia 162) — SHA nigdy nie został uzupełniony. |
| **PR-ARCH-02** | **PASS** | Commit `0f7bd19` merged as #688. `useOfferApprovals.ts` — USUNIĘTY (potwierdzone: plik nie istnieje). `OfferTrackingTimeline.tsx` — USUNIĘTY (potwierdzone). ZERO funkcjonalnych importów w codebase (grep potwierdził — jedynie referencje w testach i dokumentach). Legacy routes w `App.tsx:262-263` zachowane. `COMPATIBILITY_MATRIX.md` opublikowany (173 linie). 34 testy w `arch02-public-offer-phase2.test.ts`. `DECISIONS.md:7` — wpis z feature flag decision (brak flagi — uzasadnione: zero behavior change). | `useOfferApprovals.ts` (brak), `OfferTrackingTimeline.tsx` (brak), `App.tsx:262-263`, `COMPATIBILITY_MATRIX.md`, test file, `DECISIONS.md:7`, grep all imports | Usunięcie dead code (5 hooków + 1 komponent). COMPATIBILITY_MATRIX. Feature flag decision. Testy regresyjne. | Brak — cel PR w pełni zrealizowany. | NISKI. 4 legacy readers (`useExpirationMonitor`, `TodayTasks`, `useOfferStats`, `useFreeTierOfferQuota`) nadal czytają z `offer_approvals` (udokumentowane w COMPATIBILITY_MATRIX.md:106-109, priorytety P2-P3, planowane na przyszły sprint). |

---

## Open Issues — Pack 1

| Severity | Area | Finding | Why Still Open | Evidence | Next PR |
|----------|------|---------|----------------|----------|---------|
| P3 | Docs | `SECURITY_BASELINE.md` nie dokumentuje nowego wzorca SECURITY DEFINER dla tokenizowanego dostępu publicznego (wprowadzonego w SEC-01) | Dokument nie był w scope PR-SEC-01 | Grep `SEC-01\|get_offer_approval_by_token` w `SECURITY_BASELINE.md` → 0 trafień | PR-DOCS-xx |
| P3 | Docs | ADR-0014 linia 162: "SHA: do uzupełnienia po merge" — SHA merge nigdy nie uzupełniony | Drobny przeoczenie dokumentacyjne | `docs/ADR/ADR-0014-public-offer-canonical-flow.md:162` | PR-DOCS-xx |
| P3 | Docs | `TRACEABILITY_MATRIX.md` przestarzały (2026-02-07), nie pokrywa PR-SUPA-01/02, SEC-01, ARCH-01/02 | Tracker nie jest aktywnie utrzymywany dla post-roadmap PR-ów | `docs/TRACEABILITY_MATRIX.md:2` ("Last updated: 2026-02-07") | PR-DOCS-xx |
| P3 | Docs | `ROADMAP_STATUS.md` pokrywa tylko PR-00..PR-20 — brak śledzenia PR-SUPA/SEC/ARCH serii | Seria post-roadmap nie ma osobnego trackera | `docs/ROADMAP_STATUS.md:26-48` — tabela kończy się na PR-20 | PR-DOCS-xx |
| P2 | Infra | `config.toml` — TRACEABILITY_MATRIX (2026-02-07) sygnalizował "missing 6/16 Edge Functions". PR-SUPA-02 naprawił 2 z 6. Pozostałe 4 potencjalnie niezarejestrowane | Zakres PR-SUPA-02 obejmował tylko `customer-portal` + `request-plan` | `docs/TRACEABILITY_MATRIX.md:28`, `supabase/config.toml` (do pełnej weryfikacji) | PR-SUPA-xx |
| P2 | Arch | 4 legacy readers (`useExpirationMonitor`, `TodayTasks`, `useOfferStats`, `useFreeTierOfferQuota`) nadal czytają z `offer_approvals` | Celowo odroczone — udokumentowane jako P2/P3 w COMPATIBILITY_MATRIX | `docs/COMPATIBILITY_MATRIX.md:106-109` | PR-ARCH-03+ |
| P1 | Arch | Luki L-1 (auto-create v2_projects) i L-2 (powiadomienia) w FLOW-B blokują deprecację legacy routes | Zaplanowane na PR-ARCH-03 per COMPATIBILITY_MATRIX:141-144 i ADR-0014:123-128 | `docs/COMPATIBILITY_MATRIX.md:141-148`, `docs/ADR/ADR-0014-public-offer-canonical-flow.md:122-128` | PR-ARCH-03 |
| P3 | Types | Typy w `types.ts` generowane ręcznie — mogą dryfować od schematu przy kolejnych migracjach | CLI `supabase gen types` niedostępne w środowisku CCW | Commit message #684: "Supabase CLI unavailable in this environment" | Jednorazowe `supabase gen types` |

---

## Remaining Unknowns

| # | Unknown | Why Unknown | What Would Resolve It |
|---|---------|-------------|----------------------|
| U-1 | Czy 4 pozostałe Edge Functions z TRACEABILITY_MATRIX:28 ("missing 6/16") są teraz zarejestrowane w `config.toml`? | PR-SUPA-02 naprawił tylko 2 z 6. Pełna weryfikacja config vs. functions/ nie była w scope tego audytu | Porównanie `ls supabase/functions/*/index.ts` z sekcjami `[functions.*]` w `config.toml` |
| U-2 | Czy migracja SEC-01 została pomyślnie zastosowana w produkcji (Supabase Dashboard)? | Audyt jest repo-only — nie mamy dostępu do Supabase Dashboard ani logów deploy | Sprawdzenie w Supabase Dashboard → SQL Editor: `SELECT proname FROM pg_proc WHERE proname = 'get_offer_approval_by_token'` |
| U-3 | Czy CI/CD (GitHub Actions) zostało uruchomione i przeszło dla commitów #684-#688? | Brak dostępu do GitHub Actions logs z kontekstu audytu | `gh run list` lub sprawdzenie CI statusów na GitHub |
| U-4 | Czy `healthcheck` i `stripe-webhook` nadal mają `verify_jwt = true` (problem z TRACEABILITY_MATRIX:32)? | Poza scope Pack 1, ale powiązane z PR-SUPA-02 | Odczyt `supabase/config.toml` sekcji tych funkcji + test dostępu bez JWT |

---

## Summary

**Pack 1 overall status: 5/5 PASS**

Wszystkie 5 targetów (PR-SUPA-01, PR-SUPA-02, PR-SEC-01, PR-ARCH-01, PR-ARCH-02) mają potwierdzony merged-state z pełnymi dowodami w repo. Żaden target nie wymaga dodatkowych zmian kodu, aby być uznany za zamknięty.

Zidentyfikowano 8 Open Issues (1×P1, 2×P2, 5×P3) — wszystkie dotyczą dokumentacji lub przyszłych prac, nie blokują closure Pack 1.

4 Remaining Unknowns wymagają weryfikacji poza kontekstem repo (Supabase Dashboard, CI logs).

**Zero zmian implementacyjnych wykonanych w tym audycie.**

---

*Wygenerowano: 2026-04-14 | Audyt A3 Pack 1 | Branch: `claude/audit-closure-pack-Gf3U7`*

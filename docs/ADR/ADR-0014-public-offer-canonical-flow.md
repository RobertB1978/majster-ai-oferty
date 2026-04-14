# ADR-0014 — Canonical Public Offer Flow

**Status:** ACCEPTED
**Date:** 2026-04-13
**PR:** PR-ARCH-01 (`claude/pr-arch-01-public-offer-bxIEp`)
**Author:** Claude Code Web (Senior Staff Architect)

> **Nota (2026-04-14):** Ten ADR był pierwotnie umieszczony jako `docs/ADR-0005-public-offer-canonical-flow.md`
> z błędnym numerem kolidującym z istniejącym `ADR-0005-shell-feature-flag.md`.
> Przeniesiony i przemianowany na ADR-0014 w ramach PR-OPS-01 (docs cleanup).
> Treść merytoryczna bez zmian.

---

## Kontekst

Aplikacja Majster.AI posiada trzy nakładające się publiczne ścieżki przeglądania i akceptacji ofert.
Zostały one zbudowane iteracyjnie w różnych PR-ach i używają dwóch odrębnych systemów tokenów
oraz dwóch różnych tabel bazodanowych jako źródła statusu akceptacji.

Taki stan prowadzi do:
- niezdefiniowanego zachowania (który flow ma precedencję?),
- duplikacji logiki biznesowej (accept/reject zaimplementowane w dwóch miejscach),
- rozbieżności statusów (lowercase vs UPPERCASE, dwie tabele),
- braku jasnego celu dla nowych funkcji.

---

## Inwentarz Flow

| Flow ID | Route | Komponent | Token source | Tabela statusu | Status |
|---------|-------|-----------|--------------|----------------|--------|
| FLOW-A1 | `/offer/:token` | `OfferApproval` | `offer_approvals.public_token` | `offer_approvals.status` (lowercase) | **LEGACY COMPAT** |
| FLOW-A2 | `/oferta/:token` | `OfferPublicPage` | `offer_approvals.public_token` | `offer_approvals.status` (lowercase) | **LEGACY COMPAT** |
| FLOW-B  | `/a/:token` | `OfferPublicAccept` | `acceptance_links.token` | `offers.status` (UPPERCASE) | **CANONICAL** |

### Szczegóły warstw serwisowych

| Warstwa | FLOW A1/A2 (Legacy) | FLOW B (Canonical) |
|---------|---------------------|--------------------|
| Token TTL | 30 dni (`offer_approvals.expires_at`) | 30 dni (`acceptance_links.expires_at`) |
| Read RPC | `get_offer_approval_by_token` | `resolve_offer_acceptance_link` |
| Write action | `approve-offer` Edge Function (Deno) | `process_offer_acceptance_action` RPC |
| Auto-create v2_project | TAK (Acceptance Bridge, idempotentne) | NIE (manualne kliknięcie) |
| Powiadomienia wykonawcy | TAK (viewed, accepted, rejected, cancel) | NIE |
| Cancel window (10 min) | TAK | NIE |
| 1-click accept z emaila | TAK (`?t=acceptToken`) | NIE |
| Warianty oferty | NIE | TAK |
| Audit log | Implicitny (statusy) | `offer_public_actions` (explicitny) |
| Query key | `['legacyOffer', token]` / `['offerApprovalPublic', token]` | `['publicOffer', token]` |
| Service layer | `src/lib/publicOfferApi.ts` | inline w `OfferPublicAccept.tsx` |

---

## Decyzja

**FLOW-B (`/a/:token` + `acceptance_links`) jest wybrany jako kanoniczny flow oferty publicznej.**

### Uzasadnienie

1. **Ścieżka wysyłki już używa FLOW-B.**
   `useSendOffer` (PR-11) tworzy rekord `acceptance_links` i przekazuje token do
   `send-offer-email`, który generuje linki `${FRONTEND_URL}/a/${token}`.
   Każda nowa oferta wysłana przez aplikację trafia do FLOW-B.

2. **Architektura — lepsza izolacja.**
   FLOW-B jest bezpośrednio powiązany z tabelą `offers` (nowa architektura).
   FLOW-A wymaga `projects → quotes → offer_approvals` (legacy chain).

3. **Bezpieczeństwo — mniejszy attack surface.**
   SECURITY DEFINER DB functions zamiast Edge Function eliminują potrzebę
   serwisu Deno dla operacji publicznych.

4. **Explicitny audit log.**
   `offer_public_actions` rejestruje każdą akcję klienta z timestampem.

5. **Warianty oferty.**
   Tylko FLOW-B obsługuje oferty wielowariantowe (PR `offer-versioning-7RcU5`).

6. **Idempotencja na poziomie DB.**
   `UNIQUE (offer_id)` w `acceptance_links` + `ON CONFLICT` w `upsert_acceptance_link`.

---

## Reguły kompatybilności

### Linki już wysłane — FLOW A1/A2

| Reguła | Opis |
|--------|------|
| **ZACHOWAJ trasy legacy** | `/offer/:token` i `/oferta/:token` muszą działać dla istniejących linków |
| **BRAK nowej logiki** | Do `OfferApproval`, `OfferPublicPage` i `publicOfferApi` nie dodajemy nowych features |
| **BRAK przekierowań w Phase 1** | Redirect wymaga najpierw uzupełnienia luk FLOW-B (patrz PR-ARCH-02) |
| **Query key separation** | `OfferPublicPage` używa `['legacyOffer', token]`, `OfferPublicAccept` używa `['publicOffer', token]` |

### Generowanie nowych linków

| Reguła | Opis |
|--------|------|
| **Tylko `/a/:token`** | `useSendOffer` generuje wyłącznie linki canoniczne przez `acceptance_links` |
| **`buildAcceptanceLinkUrl`** | Jedyna dozwolona funkcja budowania publicznych linków oferty |
| **Email handler** | `generateOfferEmailHtml` używa `${frontendUrl}/a/${publicToken}` — nie zmieniać |

---

## Deprecacja i plan wygaszania

| Element | Status | Warunek wygaszenia |
|---------|--------|--------------------|
| `/offer/:token` + `OfferApproval` | LEGACY COMPAT — tymczasowo aktywny | Po wypełnieniu luk FLOW-B (PR-ARCH-02) + 30-dniowe przekierowanie |
| `/oferta/:token` + `OfferPublicPage` | LEGACY COMPAT — tymczasowo aktywny | Jak wyżej |
| `publicOfferApi.ts` | LEGACY SERVICE — brak nowych features | Można usunąć po wygaszeniu FLOW-A |
| `approve-offer` Edge Function | LEGACY — używana tylko przez FLOW-A | Jak wyżej |

---

## Luki FLOW-B do wypełnienia przed wygaszeniem FLOW-A

Zidentyfikowane w audit `docs/ACCEPTANCE_FLOW_MAP_2026-04-04.md`:

| Luka | Priorytet | Opis |
|------|-----------|------|
| L-1: Auto-create v2_project | P0 | `process_offer_acceptance_action` musi tworzyć `v2_projects` przy ACCEPT |
| L-2: Powiadomienia wykonawcy | P0 | INSERT do `notifications` przy ACCEPT/REJECT |
| L-3: Cancel window (10 min) | P2 | Nowa akcja `CANCEL_ACCEPT` |
| L-4: Withdraw przez wykonawcę | P2 | Nowa akcja z JWT verification |
| L-5: Status sync | P1 | `useOffers` musi obsługiwać oba systemy statusów |
| L-6: 1-click accept z emaila | P1 | `accept_token` w `process_offer_acceptance_action` |

**Te luki zostaną zaadresowane w PR-ARCH-02.**

---

## Konsekwencje tej decyzji

### Natychmiastowe (PR-ARCH-01)
- Query key collision między `OfferPublicPage` a `OfferPublicAccept` wyeliminowana
- Komentarze COMPAT w `App.tsx` i `publicOfferApi.ts` jasno dokumentują granicę
- Testy smoke pokrywają oba flow i canonical path

### Następny krok (PR-ARCH-02)
- Wypełnienie luk L-1 i L-2 (P0)
- Po tym: dodanie redirects z legacy → canonical dla nowych klientów
- Legacy routes usunięte po 30 dniach po tym, jak redirect jest aktywny

---

## Rollback

```
git revert <commit-sha-pr-arch-01>
```

Rollback jest bezpieczny — nie zmienia schematu DB ani RLS.
Jedyne efekty cofnięcia:
- Query key wróci do `['publicOffer', token]` w `OfferPublicPage` (potencjalna kolizja cache)
- Komentarze COMPAT znikną z `App.tsx` i `publicOfferApi.ts`
- ADR zostanie usunięty

---

*Wygenerowano: 2026-04-13 | PR-ARCH-01 | SHA: do uzupełnienia po merge*
*Przeniesiono: 2026-04-14 | PR-OPS-01 (docs cleanup) — zmiana numeru z błędnego ADR-0005 na ADR-0014*

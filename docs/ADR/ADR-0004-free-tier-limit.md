# ADR-0004: Limit darmowego planu = 3 oferty/miesiąc

- **Status:** Zaakceptowany
- **Data:** 2026-03-01
- **Decydenci:** Product Owner (Robert B.), Tech Lead (Claude)
- **Związany PR:** PR-06 (Free plan + paywall)

---

## Kontekst

Majster.AI potrzebuje modelu freemium, który:
1. Daje realną wartość (użytkownik może sprawdzić produkt)
2. Zachęca do płatnego planu (wartość PRO jest odczuwalna)
3. Nie zraża użytkownika zbyt wczesnym paywallem
4. Nie powoduje masowego nadużycia (nieskończone darmowe oferty)

Pytanie: jak liczyć limit — po draftach, wysłanych czy wszystkich?

---

## Decyzja

```typescript
// Plik: src/lib/constants/billing.ts
export const FREE_TIER_OFFER_LIMIT = 3; // oferty/miesiąc
```

**Reguły liczenia:**
- Liczymy oferty o statusie: `sent` | `accepted` | `rejected`
- **NIE liczymy** draftów (`draft`)
- **NIE liczymy** ofert z poprzednich miesięcy
- Resetuje się 1. dnia każdego miesiąca (UTC)

**Haczyk retencyjny:**
- CRM (kontakty klientów) — zawsze dostępny, bez limitu
- Historia ofert (podgląd, archiwum) — zawsze dostępny
- Tylko TWORZENIE nowej finalizowanej oferty jest blokowane

---

## Alternatywy rozważane

| Opcja | Powód odrzucenia |
|-------|-----------------|
| Limit 1 oferta/miesiąc | Za niski — użytkownik nie zdąży ocenić wartości |
| Limit 5 ofert/miesiąc | Za wysoki — zmniejsza presję do upgrade |
| Liczenie draftów | Blokuje normalną pracę (zapis tymczasowy) |
| Brak limitu (ads model) | Niezgodny z modelem B2B SaaS |
| Limit po liczbie klientów | Trudniejszy do wytłumaczenia użytkownikowi |

---

## Konsekwencje

### Pozytywne
- Proste do wytłumaczenia: „3 oferty miesięcznie za darmo"
- Drafty nie blokują pracy — użytkownik może tworzyć bez strachu
- CRM jako haczyk retencyjny — nie kasuje apki po limicie
- Resetuje co miesiąc — regularny powrót użytkownika

### Negatywne / ryzyka
- Użytkownik może tworzyć dużo draftów bez wysyłania — edge case do monitorowania
- Jeśli `FREE_TIER_OFFER_LIMIT` się zmieni, wymaga nowego ADR i zmiany stałej

### Implementacja
```typescript
// Sprawdzenie w Edge Function lub src/hooks/useBillingLimits.ts
const thisMonthFinalizedOffers = await countOffersThisMonth(userId, ['sent', 'accepted', 'rejected']);
if (thisMonthFinalizedOffers >= FREE_TIER_OFFER_LIMIT && plan === 'free') {
  throw new PaywallError('FREE_TIER_OFFER_LIMIT_REACHED');
}
```

---

## Zmiana tej decyzji

Aby zmienić limit:
1. Stwórz nowy ADR z uzasadnieniem biznesowym
2. Zaktualizuj stałą `FREE_TIER_OFFER_LIMIT` (tylko w tym miejscu)
3. Zaktualizuj testy
4. Zaktualizuj copy w paywalu (i18n)
5. Poinformuj użytkowników z wyprzedzeniem (email)

---

*ADR-0004 | 2026-03-01 | Majster.AI*

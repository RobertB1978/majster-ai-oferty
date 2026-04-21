# Legal CMS Public Consumption — PR-L4b

## Co było zepsute przed tym PR

PR-L4 zbudował admin CMS do zarządzania dokumentami prawnymi w tabeli `legal_documents`.
Jednak publiczne strony legal nadal pobierały treść ze statycznych plików i18n JSON
(`public/locales/pl/translation.json` → klucze `legal.privacy.*`, `legal.terms.*` etc.).

**Konsekwencja:** Publikowanie w CMS nie miało żadnego efektu na publiczne strony.
Zmiana treści prawnej nadal wymagała edycji pliku JSON + deployu aplikacji.

## Co jest primary source teraz

**Tabela PostgreSQL `legal_documents`**, pole `content`, rekord z `status='published'`
dla pasującego `slug` i `language`.

Publiczna polityka RLS (`SELECT ... WHERE status='published'`) już istniała od PR-L1 —
nie potrzebujemy auth ani dodatkowych migracji do odczytu przez użytkowników.

## Jak działa primary/fallback

Każda strona legal używa hooka `usePublicLegalDocument(slug, language)`:

```typescript
const { doc, isLoading, isFallback, effectiveDate } = usePublicLegalDocument('privacy', i18n.language);
```

**Algorytm decyzji:**
1. Hook odpytuje `legal_documents WHERE slug=X AND language=Y AND status='published'`
2. Jeśli rekord istnieje → `doc` jest niepusty, `isFallback=false` → **primary: DB content**
3. Jeśli brak rekordu (DB puste, brak dla danego języka) → `doc=null`, `isFallback=true` → **fallback: i18n JSON**
4. Jeśli fetch zakończył się błędem → `doc=null`, `isFallback=true` → **fallback: i18n JSON**
5. Podczas ładowania (`isLoading=true`, `isFallback=false`) → wyświetlany skeleton loader

**Nie ma crashu jeśli DB jest niedostępna** — fallback jest zawsze gotowy.

## Renderowanie DB content

Komponent `LegalDocumentContent` (`src/components/legal/LegalDocumentContent.tsx`):
- Renderuje pole `content` jako `whitespace-pre-wrap` — plain text, brak HTML injection
- Brak zewnętrznych zależności (no rich-text engine, no markdown parser)
- Wyświetla szkielet loadera podczas ładowania

## Zachowanie per strona

| Strona | URL | Slug | DB primary content | Zawsze widoczne |
|--------|-----|------|--------------------|-----------------|
| PrivacyPolicy | /legal/privacy | `privacy` | DB content zastępuje 7 sekcji i18n | — |
| TermsOfService | /legal/terms | `terms` | DB content zastępuje 6 sekcji i18n | — |
| CookiesPolicy | /legal/cookies | `cookies` | DB content zastępuje 4 sekcje tekstowe | Tabela cookies + przycisk zarządzania |
| DPA | /legal/dpa | `dpa` | DB content zastępuje sekcje s1-s3, s5-s6 | Lista subprocesorów (dynamic DB) |
| GDPRCenter | /legal/rodo | `rodo` | DB content jako intro section na górze | Cały DSAR UI (wnioski, eksport, usunięcie) |

## Data wejścia w życie

Jeśli rekord z DB ma wypełnione `effective_at` → data wyświetlana na stronie pochodzi z DB.
Jeśli `effective_at` jest null lub brak rekordu DB → fallback na statyczny `LEGAL_VERSIONS` map
z `src/lib/legalVersions.ts`.

## Wielojęzyczność

Hook pobiera rekord dla `language = i18n.language` (pl/en/uk).
Jeśli rekord dla danego języka nie istnieje w DB → `isFallback=true` → i18n JSON.

W praktyce DB zawiera początkowo tylko wersje `pl`. Użytkownicy w trybie en/uk widzą
tłumaczenia i18n JSON do czasu aż admin doda treść w CMS dla tych języków.

## Znane ograniczenia

1. **CookiesPolicy** — tabela cookies (nazwy, typy, dostawcy) jest hardcoded jako dane
   statyczne. Zmiana w CMS nie aktualizuje tabeli cookies — tyko sekcje tekstowe.
   Tabela to dane techniczne (nie tekst prawny), zmiana wymaga kodu.

2. **GDPRCenter** — to aplikacja do obsługi praw RODO (DSAR), nie czysta strona dokumentu.
   DB content wyświetlany jako intro section — reszta UI (wnioski, eksport danych) pozostaje
   statycznie zakodowana. Zmiana labeli przycisków wymaga i18n JSON.

3. **Rendering** — DB content wyświetlany jako plain text (whitespace-pre-wrap).
   Brak parsowania markdown/HTML. Jeśli treść ma formatowanie markdown → będzie widoczna
   jako `**bold**` nie `bold`. Celowa decyzja (no rich-text framework w tym PR).

4. **Cache** — hook ma `staleTime: 5 * 60 * 1000` (5 min). Po publikacji nowej wersji
   w CMS zmiana pojawi się na publicznej stronie w ciągu max 5 minut (lub po hard refresh).

## Rollback

Aby cofnąć PR-L4b:

1. Przywróć pliki do stanu pre-PR-L4b:
   - `src/pages/legal/PrivacyPolicy.tsx`
   - `src/pages/legal/TermsOfService.tsx`
   - `src/pages/legal/CookiesPolicy.tsx`
   - `src/pages/legal/DPA.tsx`
   - `src/pages/legal/GDPRCenter.tsx`
2. Usuń:
   - `src/hooks/usePublicLegalDocument.ts`
   - `src/components/legal/LegalDocumentContent.tsx`

Brak migracji — rollback nie wymaga zmian w bazie danych.
Dane w `legal_documents` pozostają nienaruszone.

## Pliki zmienione / dodane w tym PR

### Nowe
- `src/hooks/usePublicLegalDocument.ts`
- `src/components/legal/LegalDocumentContent.tsx`
- `docs/legal/LEGAL_CMS_PUBLIC_CONSUMPTION.md` (ten plik)

### Zmienione
- `src/pages/legal/PrivacyPolicy.tsx`
- `src/pages/legal/TermsOfService.tsx`
- `src/pages/legal/CookiesPolicy.tsx`
- `src/pages/legal/DPA.tsx`
- `src/pages/legal/GDPRCenter.tsx`

### Niezmienione (celowo)
- `src/lib/legalVersions.ts` — static fallback map; używany gdy DB jest niedostępna
- Pliki i18n JSON — nadal są fallbackiem
- `supabase/migrations/` — brak nowych migracji

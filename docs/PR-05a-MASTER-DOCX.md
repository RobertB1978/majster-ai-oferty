# PR-05a: 5 Umow Master DOCX

## Status: READY FOR MERGE

## Architektura

**Zrodlo prawdy** dla 5 umow budowlanych = **realne pliki DOCX** w bucket `document-masters`.

Podejscie code-generated (z poprzedniej nieudanej proby) zostalo odrzucone i nie istnieje
w tym PR. Nie ma dwoch zrodel prawdy.

## 5 Umow

| # | Nazwa | template_key | quality_tier | DOCX |
|---|-------|-------------|-------------|------|
| 1 | Umowa o roboty budowlane - ryczalt | `contract_fixed_price_standard` | standard | `contract_fixed_price.docx` |
| 2 | Umowa kosztorysowa (koszt + marza) | `contract_cost_plus_standard` | standard | `contract_cost_plus.docx` |
| 3 | Umowa z klauzula materialowa | `contract_with_materials_standard` | standard | `contract_with_materials.docx` |
| 4 | Umowa z zaliczka i etapami | `contract_with_advance_standard` | standard | `contract_with_advance.docx` |
| 5 | Zlecenie / mini-umowa | `contract_simple_order_standard` | standard | `contract_simple_order.docx` |

## Co PR-05a zawiera

### Nowe pliki
- `public/masters/*.docx` - 5 realnych plikow master DOCX (zrodlo prawdy)
- `supabase/migrations/20260407100000_pr05a_seed_master_templates.sql` - seed do DB
- `src/data/modeBContractTemplates.ts` - metadane wyswietlania (tylko display, nie zrodlo prawdy)
- `scripts/gen_docx_*.py` - jednorazowe skrypty generujace DOCX (narzedzie, nie zrodlo prawdy)
- `scripts/upload-masters-to-supabase.sh` - skrypt upload DOCX do bucketu
- `docs/PR-05a-MASTER-DOCX.md` - ta dokumentacja

### Istniejaca infrastruktura (bez zmian)
- Tabela `document_master_templates` (PR-01) - bez zmian
- Tabela `document_instances` rozszerzona (PR-01) - bez zmian
- Bucket `document-masters` (PR-03) - bez zmian
- File flow helpers `modeBFileFlow.ts` (PR-03) - bez zmian
- Hooks `useModeBMasterTemplates`, `useModeBDocumentInstances` (PR-03/04) - bez zmian
- UI `ModeBTemplateSelector`, `ModeBDocumentCard` (PR-04) - bez zmian
- Feature flag `FF_MODE_B_DOCX_ENABLED` (PR-01) - bez zmian

## Jak dziala flow

1. Admin uruchamia migracje seed -> 5 rekordow w `document_master_templates`
2. Admin uploaduje pliki DOCX do bucketu `document-masters` (skrypt `upload-masters-to-supabase.sh`)
3. Uzytkownik wlacza `FF_MODE_B_DOCX_ENABLED=true`
4. Uzytkownik widzi 5 szablonow w Tryb B
5. Uzytkownik wybiera szablon -> tworzona jest instancja (draft)
6. System (future PR) kopiuje master DOCX jako working copy
7. Uzytkownik pobiera DOCX, edytuje, finalizuje

## Co PR-05a jeszcze nie robi

- Edge Function kopiujaca master DOCX do working copy (scope PR-02/future)
- Renderowanie PDF z DOCX (scope przyszly)
- Preview PDF w bibliotece szablonow
- Warianty premium/short_form (scope PR-05b/05c)
- Protokoly, aneksy, compliance (scope PR-05b/05c)

## Operacyjne kroki po merge

1. Uruchom migracje: `supabase db push`
2. Upload plikow DOCX:
   ```bash
   # Uzyj Supabase CLI lub Dashboard:
   # Bucket: document-masters
   # Sciezka: masters/{template_key}/v1.0/{template_key}.docx
   # Pliki zrodlowe: public/masters/*.docx
   ```
3. Wlacz feature flag: `VITE_FF_MODE_B_DOCX_ENABLED=true`

## Tryb A

Tryb A (istniejacy flow z szablonami jako kod) NIE zostal naruszony.
Zaden plik Trybu A nie zostal zmodyfikowany.

## Poprzednie bledne podejscie

W poprzedniej sesji zbudowano code-generated DOCX jako zrodlo prawdy.
To podejscie zostalo odrzucone przez wlasciciela.
W tym PR nie istnieje zadna pozostalosc tamtego podejscia.
Jedyne zrodlo prawdy = pliki DOCX.

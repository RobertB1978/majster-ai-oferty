# Kontakt ds. Prywatności i Danych — Notatki ROPA

**Majster.AI — Privacy Contact & ROPA Decision Notes**
Wersja: 1.0 | Data: 2026-04-21 | Status: DRAFT

---

## 1. Dlaczego używamy nazwy neutralnej zamiast DPO / IOD

### Decyzja

W UI oraz komunikacji Majster.AI używa terminu **"Kontakt ds. prywatności i danych"**
zamiast "Inspektor Ochrony Danych (IOD)" lub angielskiego "DPO (Data Protection Officer)".

### Uzasadnienie

1. **Brak dowodu w repozytorium** — analiza kodu (2026-04-21) nie wykazała żadnego pliku,
   konfiguracji ani dokumentacji potwierdzającej powołanie IOD/DPO przez Administratora.

2. **Wymóg prawny IOD nie jest automatyczny** — Art. 37 RODO wymaga IOD tylko gdy:
   - przetwarzanie odbywa się przez organ publiczny, LUB
   - działalność polega na regularnym i systematycznym monitorowaniu na dużą skalę, LUB
   - przetwarzane są dane wrażliwe na dużą skalę.
   Dla startupu SaaS na wczesnym etapie wymóg często nie zachodzi.

3. **Ryzyko błędnego tytułu** — użycie tytułu "IOD/DPO" bez faktycznego powołania osoby
   na to stanowisko może wprowadzać w błąd organy nadzoru i osoby, których dane dotyczą.

### Konsekwencja

- UI pokazuje: **"Kontakt ds. prywatności i danych"**
- E-mail kontaktowy: `kontakt.majsterai@gmail.com` (potwierdzony w kodzie)
- Jeśli Administrator powoła IOD/DPO w przyszłości: zaktualizować UI + tę dokumentację

---

## 2. Co zostało dodane w PR-L10 w obszarze legal UI

### Zmiany w `src/pages/legal/GDPRCenter.tsx`

Dodano sekcję **"Kontakt ds. prywatności i danych"** jako karta informacyjna na stronie
Centrum RODO. Sekcja zawiera:
- neutralny nagłówek (bez IOD/DPO)
- adres e-mail kontaktowy
- informację o czasie odpowiedzi (30 dni zgodnie z RODO)
- odniesienie do formularza DSAR

### Zmiany w i18n

Dodano klucze do `legal.gdpr.privacyContact` w:
- `src/i18n/locales/pl.json`
- `src/i18n/locales/en.json`

---

## 3. Co w ROPA jest potwierdzone a co UNKNOWN

### ✅ Potwierdzone (dowód w kodzie)

| Element | Dowód |
|---------|-------|
| Supabase jako główny backend | `src/integrations/supabase/client.ts`, liczne migracje |
| Resend jako dostawca e-mail | `supabase/functions/send-offer-email/` |
| OpenAI/Anthropic/Gemini jako AI | `docs/AI_PROVIDERS_REFERENCE.md`, Edge Functions |
| Logi audytowe (tabela `audit_log`) | `src/hooks/useAuditLog.ts`, `HARD_AUDIT_LOG_FOUNDATION.md` |
| DSAR workflow | `src/hooks/useDsarRequests.ts`, `DSAR_INBOX_WORKFLOW.md` |
| Śledzenie akceptacji regulaminów | `TERMS_ACCEPTANCE_BINDING.md` |
| E-mail kontaktowy: `kontakt.majsterai@gmail.com` | `src/i18n/locales/pl.json` (importantText) |
| Przetwarzanie danych klientów użytkowników | `src/components/` (clients, quotes, offers) |
| Dane głosowe przez Edge Function | `supabase/functions/voice-quote-processor/` |

### ❓ UNKNOWN (wymagają uzupełnienia przez Administratora)

| Element | Dlaczego UNKNOWN | Priorytet |
|---------|-----------------|-----------|
| Region Supabase (EU/US?) | Brak konfiguracji regionu w repo | **WYSOKI** |
| DPA z Supabase | Nie widoczne w repo | **WYSOKI** |
| DPA z Resend | Nie widoczne w repo | **WYSOKI** |
| DPA z OpenAI/Anthropic/Gemini | Nie widoczne w repo | **WYSOKI** |
| Powołanie IOD/DPO | Brak dokumentu powołania | ŚREDNI |
| Polityka retencji danych | Brak zdefiniowanej retencji | **WYSOKI** |
| Dostawca płatności | Kod billing bez zidentyfikowanego PSP | **WYSOKI** |
| Umowy powierzenia z użytkownikami-procesorami | Brak w repo | ŚREDNI |
| Hosting Vercel — DPA | Nie widoczne w repo | ŚREDNI |

---

## 4. Jakie kolejne PR-y zależą od tego dokumentu

| Kolejny PR | Zależność od PR-L10 |
|-----------|---------------------|
| PR-L11: Polityka retencji | Opiera się na tabeli czynności z RECORDS_OF_PROCESSING_ART30.md |
| PR-L12: DPA z podprzetwarzającymi | Lista podprzetwarzających z RECORDS_OF_PROCESSING_ART30.md |
| PR-L13: Umowy powierzenia z użytkownikami | Identyfikacja roli procesora z PR-L10 |
| PR-L14: Ocena transferów do krajów trzecich (AI) | Sekcja AI w RECORDS_OF_PROCESSING_ART30.md |
| Ewentualny PR-DPO: Powołanie IOD | Decyzja na podstawie analizy z sekcji 1 tego doc |

---

## 5. Działania wymagane od Administratora (nie od agenta)

1. **Zweryfikować region Supabase** — Panel Supabase → Settings → Infrastructure
2. **Podpisać DPA z Supabase, Resend, Vercel** — wymagane dla RODO compliance
3. **Ocenić konieczność powołania IOD/DPO** — konsultacja z prawnikiem
4. **Zidentyfikować dostawcę płatności** i podpisać DPA
5. **Zdecydować o polityce retencji** — ile miesięcy po zakończeniu konta przechowywać dane
6. **Zatwierdzić ROPA (RECORDS_OF_PROCESSING_ART30.md)** — dokument wymaga podpisu Administratora

---

## Metadata

```
Przygotował:    Claude (PR-L10)
Data:           2026-04-21
Zatwierdził:    [WYMAGANE — Administrator Danych]
Powiązane pliki: docs/legal/RECORDS_OF_PROCESSING_ART30.md
                 docs/legal/SUBPROCESSORS_REGISTRY_AND_DPA.md
                 docs/legal/DATA_FLOW_MAP.md
```

-- ============================================================
-- PR-L1b: Content snapshot — zamiana pointer → immutable text
-- ============================================================
-- Problem (wykryty w pre-merge review PR-L1):
--   Migracja 20260420160000 wstawila wiersze z content =
--   'i18n:legal.<slug>.*' — to WSKAZNIK na plik JSON,
--   nie niemodyfikowalny snapshot tekstu.
--   Edycja pl.json zmienialaby efektywna tresc juz opublikowanej
--   wersji 1.0 bez bumpu wersji i bez audit trail. (Scenario B)
--
-- Fix:
--   1. UPDATE pięciu seedowanych wierszy — zastap pointery
--      prawdziwym tekstem z pl.json (frozen at 2026-04-20).
--   2. Dodaj trigger immutability: blokuje UPDATE content/version
--      na wierszach ze status = 'published'.
--
-- Uwagi:
--   - EN/UK wersje: odroczone (PR-L2). Dokument
--     docs/legal/LEGAL_VERSIONING_FOUNDATION.md zaktualizowany.
--   - Klucz i18n 'legal.rodo.*' nie istnieje w pl.json;
--     poprawny namespace to 'legal.gdpr.*'. Naprawione.
--   - Tresc cookies pochodzi z named keys (brak s1/s2 pattern).
-- ============================================================

-- ----------------------------------------------------------------
-- 1. Zastap pointery rzeczywistym tekstem (snapshot PL v1.0)
-- ----------------------------------------------------------------

UPDATE public.legal_documents
  SET content = $BODY$1. Administrator danych

Administratorem danych jest Majster.AI. Przetwarzamy dane zgodnie z RODO (Rozporządzenie UE 2016/679).

2. Jakie dane zbieramy

Zbieramy:
• Dane konta: email, hasło (zaszyfrowane), nazwa firmy
• Dane firmowe: NIP, adres, telefon, logo
• Dane klientów wprowadzane przez Użytkownika
• Dane projektów i wycen
• Dane techniczne: IP, User Agent, cookies
• Dane analityczne

3. Cele przetwarzania

Dane przetwarzamy w celu:
• Świadczenia usług (podstawa: umowa)
• Obsługi konta
• Generowania wycen
• Analityki i monitoringu wydajności aplikacji (zgoda)
• Wypełnienia obowiązków prawnych

4. Bezpieczeństwo danych

Stosujemy:
• Szyfrowanie SSL/TLS
• Szyfrowanie haseł bcrypt
• Row Level Security (RLS)
• Regularne kopie zapasowe
• Monitoring bezpieczeństwa 24/7
• Ograniczony dostęp do infrastruktury

5. Twoje prawa (RODO)

Masz prawo do:
• Dostępu (art. 15)
• Sprostowania (art. 16)
• Usunięcia (art. 17)
• Ograniczenia przetwarzania (art. 18)
• Przenoszenia danych (art. 20)
• Sprzeciwu (art. 21)
• Wycofania zgody w dowolnym momencie

6. Przekazywanie danych

Dane mogą być przekazywane:
• Dostawcom hostingu i baz danych (Supabase — UE/USA, SCC)
• Dostawcom email (Resend — USA, SCC)
• Dostawcom monitoringu (Sentry — USA, SCC) — za zgodą na analytics
• Dostawcom płatności (Stripe — USA, SCC)
• Organom państwowym (na żądanie prawne)

Wszyscy procesorzy danych posiadają umowy DPA.

7. Kontakt

W sprawach danych osobowych:
• Email: kontakt.majsterai@gmail.com
• Aplikacja: Ustawienia → Centrum RODO

Masz prawo wnieść skargę do Prezesa UODO.$BODY$
  WHERE slug = 'privacy' AND language = 'pl' AND version = '1.0'
    AND content LIKE 'i18n:%';
-- ^ conditional: only replaces pointer rows, idempotent if already snapshot

UPDATE public.legal_documents
  SET content = $BODY$1. Postanowienia ogólne

1.1. Niniejszy Regulamin określa zasady korzystania z serwisu Majster.AI.

1.2. Majster.AI to platforma SaaS umożliwiająca tworzenie wycen, ofert i kosztorysów dla fachowców z branży budowlanej i usługowej.

1.3. Korzystając z serwisu, akceptujesz niniejszy Regulamin oraz Politykę Prywatności.

1.4. Definicje:
• Serwis — aplikacja Majster.AI
• Użytkownik — osoba korzystająca z Serwisu
• Konto — indywidualne konto Użytkownika
• Subskrypcja — płatny plan dostępu do funkcji Serwisu

2. Zakres usług

2.1. Majster.AI oferuje:
• Zarządzanie klientami i projektami
• Tworzenie wycen i kosztorysów
• Generowanie profesjonalnych PDF-ów
• Wysyłkę ofert emailem
• Asystenta AI (plany płatne)
• Kalendarz i harmonogram prac
• Analitykę i raporty

2.2. Dostęp do funkcji zależy od planu subskrypcji.

2.3. Zastrzegamy prawo do modyfikacji zakresu usług z 30-dniowym wyprzedzeniem.

3. Plany i płatności

3.1. Dostępne plany: FREE, PRO, BUSINESS, ENTERPRISE.

3.2. Płatności realizowane z góry za okres rozliczeniowy.

3.3. Ceny w PLN, zawierają VAT 23%.

3.4. Zwroty możliwe w ciągu 14 dni od zakupu.

3.5. Brak płatności powoduje degradację do planu FREE.

4. Ograniczenia i zakazy

4.1. Zabrania się:
• Wykorzystywania niezgodnie z prawem
• Obejścia zabezpieczeń
• Udostępniania konta osobom trzecim
• Automatycznego pobierania danych
• Wysyłania spamu
• Publikowania treści obraźliwych lub nielegalnych

4.2. Naruszenia mogą skutkować ostrzeżeniem, zawieszeniem lub trwałym usunięciem konta.

5. Odpowiedzialność

5.1. Majster.AI nie ponosi odpowiedzialności za:
• Treści Użytkowników
• Przerwy spowodowane siłą wyższą
• Straty z błędów w wycenach
• Problemy techniczne po stronie Użytkownika

5.2. Odpowiedzialność ograniczona do kwoty opłat z ostatnich 12 miesięcy.

5.3. Użytkownik odpowiada za poprawność danych i bezpieczeństwo hasła.

6. Postanowienia końcowe

6.1. Prawem właściwym jest prawo polskie.

6.2. Spory rozstrzygane przez sąd właściwy dla siedziby Majster.AI.

6.3. Regulamin może być zmieniony z 30-dniowym wyprzedzeniem.

6.4. Kontakt: kontakt.majsterai@gmail.com

6.5. Regulamin wchodzi w życie z dniem publikacji.$BODY$
  WHERE slug = 'terms' AND language = 'pl' AND version = '1.0'
    AND content LIKE 'i18n:%';
-- ^ conditional: only replaces pointer rows, idempotent if already snapshot

UPDATE public.legal_documents
  SET content = $BODY$1. Przedmiot umowy

Umowa Powierzenia (DPA) reguluje zasady przetwarzania danych osobowych przez Majster.AI (Procesor) w imieniu Użytkownika (Administrator).

Umowa stanowi integralną część Regulaminu i Polityki Prywatności.

2. Zakres przetwarzania

Procesor przetwarza:
• Dane klientów Administratora
• Dane projektów i wycen
• Dokumenty firmowe

Cel: świadczenie usług platformy.
Czas: przez okres korzystania z usług + 30 dni po zakończeniu.

3. Środki bezpieczeństwa

Środki techniczne i organizacyjne:
• Szyfrowanie TLS 1.3 i AES-256
• Kontrola dostępu RBAC
• Row Level Security (RLS)
• Regularne audyty
• Szkolenia personelu
• Procedury reagowania na incydenty
• Backup z retencją 30 dni

4. Podprzetwarzcy

Korzystamy z:
1. Supabase Inc. (USA) — hosting baz danych i autentykacja, SCC dla transferu UE-USA
2. Resend (USA) — email transakcyjny, SCC dla transferu UE-USA
3. Sentry Inc. (USA) — monitoring błędów i wydajności (tylko przy zgodzie na analytics), SCC dla transferu UE-USA
4. Stripe Inc. (USA) — obsługa płatności i zarządzanie subskrypcjami, SCC dla transferu UE-USA

Administrator zostanie poinformowany o każdym nowym podprzetwarzcy z 14-dniowym wyprzedzeniem.

5. Obowiązki stron

Obowiązki Procesora:
• Przetwarzanie wyłącznie na polecenie Administratora
• Poufność przez personel
• Pomoc w realizacji praw osób
• Powiadomienie o naruszeniu w ciągu 72 godzin
• Usunięcie danych po zakończeniu umowy

Obowiązki Administratora:
• Podstawa prawna przetwarzania
• Informowanie osób, których dane dotyczą
• Realizacja praw osób

6. Audyty i kontrole

Administrator ma prawo do:
• Żądania informacji o przetwarzaniu
• Audytów (raz w roku, 30-dniowe wyprzedzenie)
• Inspekcji dokumentacji

Koszty audytu ponosi strona inicjująca, chyba że wykaże naruszenia.$BODY$
  WHERE slug = 'dpa' AND language = 'pl' AND version = '1.0'
    AND content LIKE 'i18n:%';
-- ^ conditional: only replaces pointer rows, idempotent if already snapshot

UPDATE public.legal_documents
  SET content = $BODY$Czym są pliki cookies?

Pliki cookies to małe pliki tekstowe przechowywane na Twoim urządzeniu. Służą do zapamiętywania preferencji i usprawnienia działania serwisu.

Cookies niezbędne

Niezbędne do prawidłowego działania serwisu. Nie można ich wyłączyć. Używane do autoryzacji i bezpieczeństwa.

Cookies analityczne

Pomagają nam zrozumieć, jak korzystasz z serwisu. Używamy Plausible Analytics (cookieless, anonimowe, EU-hosted) oraz Sentry (monitoring błędów i wydajności — m.in. nagrywanie sesji z błędami). Żadne dane nie są przekazywane reklamodawcom. Możesz je wyłączyć w ustawieniach.

Cookies marketingowe

Cookies marketingowe nie są aktualnie używane w Majster.AI. Kategoria jest zarezerwowana na przyszłość i pojawi się, gdy zostanie wdrożony pierwszy vendor marketingowy.

Jak zarządzać cookies?

Masz kilka sposobów zarządzania cookies:

Więcej informacji o tym, jak używamy plików cookies, znajdziesz w powyższej polityce. Swoje ustawienia możesz zmienić w dowolnym momencie.$BODY$
  WHERE slug = 'cookies' AND language = 'pl' AND version = '1.0'
    AND content LIKE 'i18n:%';
-- ^ conditional: only replaces pointer rows, idempotent if already snapshot

UPDATE public.legal_documents
  SET content = $BODY$Centrum RODO — Majster.AI

Zarządzaj swoimi danymi osobowymi

Ważne informacje
Zgodnie z RODO mamy 30 dni na realizację Twojego żądania. W przypadku skomplikowanych żądań termin może zostać przedłużony o kolejne 60 dni. Kontakt: kontakt.majsterai@gmail.com$BODY$
  WHERE slug = 'rodo' AND language = 'pl' AND version = '1.0'
    AND content LIKE 'i18n:%';
-- ^ conditional: only replaces pointer rows, idempotent if already snapshot

-- ----------------------------------------------------------------
-- 2. Immutability trigger: blokuje zmiane content/version
--    na opublikowanych wierszach
-- ----------------------------------------------------------------
-- Wzorzec enterprise: opublikowany dokument jest frozen.
-- Aby zaktualizowac tresc: zarchiwizuj stary (status='archived'),
-- wstaw nowy wiersz z nowa wersja (status='published').
-- ----------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.guard_legal_document_immutability()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- Blokuj zmiane content lub version na opublikowanym wierszu
  IF OLD.status = 'published' THEN
    IF NEW.content <> OLD.content THEN
      RAISE EXCEPTION
        'legal_documents: cannot mutate content of published document (slug=%, version=%). '
        'Archive and create a new version instead.',
        OLD.slug, OLD.version
        USING ERRCODE = 'check_violation';
    END IF;
    IF NEW.version <> OLD.version THEN
      RAISE EXCEPTION
        'legal_documents: cannot change version of published document (slug=%). '
        'Archive and create a new version instead.',
        OLD.slug
        USING ERRCODE = 'check_violation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_legal_documents_immutability ON public.legal_documents;
CREATE TRIGGER trg_legal_documents_immutability
  BEFORE UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.guard_legal_document_immutability();


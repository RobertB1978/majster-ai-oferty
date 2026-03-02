# Majster.AI — Przeglądy Techniczne Budynków (Polska) — Źródło Prawdy

> **WAŻNE: Ten plik jest źródłem prawdy dla szablonów przeglądów w kategorii Compliance/Inspections.**
> Musi być przeglądany i aktualizowany **każdorazowo po zmianie przepisów prawa budowlanego lub norm**.
> Patrz: [ADR-0010](../ADR/ADR-0010-compliance-inspections-source-of-truth.md)

**Ostatnia weryfikacja:** 2026-03-02
**Weryfikował:** Tech Lead (Claude) + właściciel produktu
**Status prawa:** Stan prawny na dzień 2026-03-02. Przed użyciem w produkcji zweryfikuj aktualność przepisów.

---

## ⚠️ Disclaimer prawny

Szablony generowane przez Majster.AI na podstawie tego pliku mają charakter **pomocniczy i informacyjny**.
Nie zastępują profesjonalnych porad prawnych ani techicznych. Użytkownik jest odpowiedzialny za weryfikację
aktualności przepisów i poprawność wypełnionych dokumentów przed ich użyciem.

---

## 1. Podstawa prawna — przeglady obowiązkowe

### Ustawa Prawo Budowlane

**Ustawa z dnia 7 lipca 1994 r. — Prawo budowlane (Dz.U. 1994 nr 89 poz. 414 ze zm.)**

Kluczowe artykuły dotyczące obowiązkowych przeglądów:

| Artykuł | Treść skrócona |
|---------|----------------|
| **Art. 61** | Właściciel/zarządca obiektu budowlanego jest zobowiązany utrzymywać go w należytym stanie technicznym i estetycznym. |
| **Art. 62 ust. 1 pkt 1** | Przegląd co najmniej raz w roku — sprawdzenie stanu technicznego elementów narażonych na uszkodzenia atmosferyczne i działanie czynników eksploatacyjnych. |
| **Art. 62 ust. 1 pkt 2** | Przegląd co najmniej raz na 5 lat — sprawdzenie stanu technicznego i przydatności do użytkowania całego obiektu. |
| **Art. 62 ust. 1 pkt 1b** | Obiekty wielkopowierzchniowe (>2000 m² pow. zabudowy lub pow. dachu) — dodatkowo przegląd przed 31 maja i 30 listopada każdego roku. |
| **Art. 62 ust. 2** | Właściciel/zarządca może zlecić przegląd osobom uprawnionym (uprawnienia budowlane). |
| **Art. 63** | Obowiązek prowadzenia książki obiektu budowlanego (poza budynkami mieszkalnymi jednorodzinnymi). |
| **Art. 66** | Właściwy organ może nakazać usunięcie stwierdzonych nieprawidłowości. |

> **TODO — DO WERYFIKACJI:** Art. 62 był wielokrotnie nowelizowany. Przed wdrożeniem produkcyjnym sprawdź:
> - aktualny tekst jednolity na stronie Sejm RP: https://isap.sejm.gov.pl/
> - czy nowelizacja z 2022/2023 (m.in. cyfryzacja Dziennika Budowy) zmienia zakres obowiązku.

### Przepisy szczególne — instalacje

| Instalacja | Podstawa | Częstotliwość | Uwagi |
|-----------|----------|---------------|-------|
| **Elektryczna i odgromowa** | Art. 62 ust. 1 pkt 2 Prawa budowlanego + § 3-4 Rozporządzenia MEiB z 17.01.2023 (TODO: zweryfikować nr) | Co 5 lat | Zakres: sprawdzenie stanu instalacji elektrycznych, pomiary ochrony przeciwporażeniowej, sprawdzenie instalacji piorunochronnej. |
| **Gazowa** | Art. 62 ust. 1 pkt 1 Prawa budowlanego + przepisy URE | Co roku | Sprawdzenie szczelności instalacji gazowej, stanu technicznego urządzeń gazowych. |
| **Kominowa (dymowa/spalinowa/wentylacyjna)** | Art. 62 ust. 1 pkt 1 Prawa budowlanego + Rozporządzenie MSWiA dot. ochrony ppoż. | Co roku | Sprawdzenie drożności i stanu technicznego przewodów kominowych. |

> **TODO — DO WERYFIKACJI:** Numery i daty rozporządzeń dla instalacji elektrycznych mogą być nieaktualne.
> Sprawdź aktualne rozporządzenie Ministra Energii / Ministra Klimatu / MEiB na stronie ISAP.

---

## 2. Kto może przeprowadzić przegląd?

### Przegląd budowlany (roczny i 5-letni)

Zgodnie z art. 62 ust. 4 Prawa budowlanego, przeglądy muszą przeprowadzać osoby posiadające:
- **Uprawnienia budowlane** w odpowiedniej specjalności
- Wpis do centralnego rejestru osób posiadających uprawnienia budowlane (PIIB/PZITB)

### Przegląd elektryczny i odgromowy

- Osoba posiadająca **świadectwo kwalifikacyjne SEP** kategorii E lub D, grup 1 (prąd elektryczny)
- TODO: Zweryfikuj aktualne wymagania URE i SEP.

### Przegląd gazowy

- Osoba posiadająca **świadectwo kwalifikacyjne SEP** kategorii E lub D, grup 3 (paliwa gazowe)
- LUB certyfikowany instalator gazowy
- TODO: Zweryfikuj wymagania Prezesa URE.

### Przegląd kominiarski

- Mistrz kominiarski lub osoba z uprawnieniami kominiarskimi (ustawa o rzemiośle)

---

## 3. Definicje szablonów przeglądów — pola wymagane

### 3.1 Przegląd roczny budowlany

**Cel:** Sprawdzenie elementów narażonych na uszkodzenia atmosferyczne i eksploatacyjne (art. 62 ust. 1 pkt 1).

**Wymagane pola formularza:**
1. Dane obiektu: adres, numer ewidencyjny działki, opis (typ, przeznaczenie)
2. Dane właściciela/zarządcy: imię i nazwisko / nazwa, adres, kontakt
3. Dane inspektora: imię i nazwisko, numer uprawnień budowlanych, przynależność do izby
4. Data przeglądu
5. Zakres przeglądu (check-lista):
   - Stan dachu i obróbek blacharskich
   - Stan rynien i rur spustowych
   - Stan elewacji zewnętrznej
   - Stan balkonów i tarasów (jeśli dot.)
   - Stan kominów i wywiewek dachowych
   - Drożność przewodów wentylacyjnych
   - Stan okien i drzwi zewnętrznych
   - Stan instalacji zewnętrznych (jeśli dot.)
6. Stwierdzone usterki / nieprawidłowości (opis + ocena ryzyka + zalecane działania + termin)
7. Załączniki: liczba i opis (zdjęcia, pomiary)
8. Data następnego przeglądu (obliczone +1 rok)
9. Podpis inspektora + data
10. Podpis właściciela/zarządcy + data

**Referencje (do osadzenia w PDF):**
- Ustawa Prawo budowlane, art. 62 ust. 1 pkt 1 (Dz.U. 1994 nr 89 poz. 414 ze zm.)

---

### 3.2 Przegląd pięcioletni budowlany

**Cel:** Sprawdzenie stanu technicznego i przydatności do użytkowania całego obiektu (art. 62 ust. 1 pkt 2).

**Wymagane pola formularza** (wszystkie jak w rocznym PLUS):
- Ocena stanu fundamentów i ścian nośnych (jeśli dostępne)
- Stan instalacji wod-kan (widoczne elementy)
- Stan instalacji c.o. (widoczne elementy)
- Ocena stanu stropów (widoczne elementy)
- Ocena stanu klatki schodowej
- Ocena efektywności energetycznej (opcjonalnie)
- Ocena ogólna: zdatny do użytkowania / wymaga napraw / wymaga rozbiórki
- Zakres zalecanych prac remontowych z szacunkowym kosztem (opcjonalnie)

**Referencje:**
- Ustawa Prawo budowlane, art. 62 ust. 1 pkt 2 (Dz.U. 1994 nr 89 poz. 414 ze zm.)

---

### 3.3 Przegląd pięcioletni — instalacja elektryczna i odgromowa

**Cel:** Sprawdzenie stanu instalacji elektrycznych i odgromowych pod kątem bezpieczeństwa.

**Wymagane pola formularza:**
1. Dane obiektu (jak wyżej)
2. Dane właściciela/zarządcy
3. Dane inspektora: imię i nazwisko, nr świadectwa kwalifikacyjnego SEP, ważność świadectwa
4. Data przeglądu
5. Zakres — instalacja elektryczna (check-lista):
   - Stan rozdzielnicy głównej i tablic piętrowych
   - Stan przewodów i kabli (oględziny)
   - Stan gniazd i łączników
   - Stan opraw oświetleniowych
   - Pomiary: ciągłość obwodów ochronnych [Ω] — wyniki
   - Pomiary: rezystancja izolacji [MΩ] — wyniki
   - Działanie wyłączników różnicowoprądowych (RCD) — wyniki testu
   - Stan instalacji wyrównawczej
6. Zakres — instalacja odgromowa (check-lista):
   - Stan zwodów pionowych i poziomych
   - Stan uziemienia [Ω] — wynik pomiaru
   - Stan połączeń i złączy kontrolnych
7. Stwierdzone usterki + ocena ryzyka + zalecane działania
8. Wyniki pomiarów (tabela)
9. Data następnego przeglądu (+5 lat)
10. Podpis inspektora + pieczęć

**Referencje:**
- Ustawa Prawo budowlane, art. 62 ust. 1 pkt 2 (Dz.U. 1994 nr 89 poz. 414 ze zm.)
- TODO: Aktualne rozporządzenie dot. eksploatacji urządzeń elektrycznych — zweryfikuj na ISAP.
- Norma PN-HD 60364 (instalacje elektryczne niskiego napięcia) — UWAGA: sprawdź aktualną edycję.
- Norma PN-EN 62305 (ochrona odgromowa) — UWAGA: sprawdź aktualną edycję.

---

### 3.4 Przegląd roczny — instalacja gazowa i przewody kominowe

**Cel:** Sprawdzenie instalacji gazowej i drożności/stanu technicznego przewodów kominowych.

**Wymagane pola formularza:**
1. Dane obiektu
2. Dane właściciela/zarządcy
3. Dane inspektora: imię i nazwisko, nr uprawnień / kwalifikacji
4. Data przeglądu

**Instalacja gazowa (check-lista):**
- Sprawdzenie szczelności instalacji gazowej (opis metody i wynik)
- Stan kurków gazowych głównych i przed urządzeniami
- Stan elastycznych węży przyłączeniowych
- Stan urządzeń gazowych (kocioł, kuchenka, piec — lista z numerami seryjnymi)
- Sprawdzenie wentylacji pomieszczenia z instalacją
- Wyniki próby szczelności (ciśnienie, czas, wynik: szczelny/nieszczelny)

**Przewody kominowe (check-lista):**
- Sprawdzenie drożności: przewód dymowy / spalinowy / wentylacyjny (osobno dla każdego)
- Stan techniczny wylotów ponad dachem
- Stan otworów rewizyjnych i wyczystek
- Stwierdzone osady, zawilgocenie, uszkodzenia
- Typ komina: ceramiczny / stalowy / murowany (dla każdego przewodu)

5. Stwierdzone usterki + ocena ryzyka + zalecane działania + termin
6. Data następnego przeglądu (+1 rok)
7. Podpis inspektora + pieczęć

**Referencje:**
- Ustawa Prawo budowlane, art. 62 ust. 1 pkt 1 (Dz.U. 1994 nr 89 poz. 414 ze zm.)
- TODO: Rozporządzenie dot. ochrony ppoż. w odniesieniu do przewodów kominowych — zweryfikuj na ISAP.
- Warunki Techniczne dot. instalacji gazowych — TODO: zweryfikuj aktualny numer i rok rozporządzenia.

---

### 3.5 Przegląd obiektu wielkopowierzchniowego (dwukrotny w roku)

**Podstawa:** Art. 62 ust. 1 pkt 1b Prawa budowlanego.
**Dotyczy:** Obiektów, których powierzchnia zabudowy lub powierzchnia dachu > 2000 m².
**Terminy:** Przed 31 maja (przegląd wiosenny) i przed 30 listopada (przegląd jesienny/zimowy).

**Wymagane pola formularza:**
1. Dane obiektu: adres, typ, pow. zabudowy [m²], pow. dachu [m²]
2. Dane właściciela/zarządcy
3. Dane inspektora z uprawnieniami budowlanymi
4. Data przeglądu + zaznaczenie: Wiosenny (przed 31.05) / Jesienny (przed 30.11)
5. Zakres szczególny dla obiektów wielkopowierzchniowych:
   - Stan całości połaci dachowej (opis, zdjęcia)
   - Nośność dachu — ocena przeciążenia śniegiem (dla przeglądu jesiennego)
   - Stan świetlików i klap dymowych
   - Stan odwodnienia (rynny główne, wpusty dachowe)
   - Stwierdzenie ewentualnych uszkodzeń od wiatru, śniegu, lodu
6. Stwierdzone usterki + ocena krytyczności + zalecane działania doraźne/planowe
7. Podpis inspektora

**Referencje:**
- Ustawa Prawo budowlane, art. 62 ust. 1 pkt 1b (Dz.U. 1994 nr 89 poz. 414 ze zm.)

---

## 4. Procedura aktualizacji tego pliku

1. Każda zmiana przepisów dotyczących obowiązkowych przeglądów MUSI być odzwierciedlona w tym pliku.
2. Aktualizacji dokonuje Tech Lead w porozumieniu z właścicielem produktu.
3. Po każdej aktualizacji: zaktualizuj datę "Ostatnia weryfikacja" i opisz co zmieniono.
4. Jeżeli zmiana przepisów wymaga modyfikacji szablonów: zaktualizuj `src/data/documentTemplates.ts`
   i utwórz nową migrację jeśli zmienią się typy instancji.
5. Commit format: `docs: aktualizuj INSPECTIONS_PL.md — [opis zmiany prawnej]`

---

## 5. Znane luki do uzupełnienia (TODO)

| # | Opis luki | Priorytet | Data dodania |
|---|-----------|-----------|--------------|
| 1 | Zweryfikować aktualne rozporządzenie dot. instalacji elektrycznych (MEiB/MKiŚ) | Wysoki | 2026-03-02 |
| 2 | Zweryfikować aktualne wymagania SEP dla kwalifikacji inspektora el. | Wysoki | 2026-03-02 |
| 3 | Zweryfikować rozporządzenie dot. instalacji gazowych (aktualny numer/rok) | Wysoki | 2026-03-02 |
| 4 | Zweryfikować rozporządzenie dot. kominów i ochrony ppoż. (aktualny nr/rok) | Wysoki | 2026-03-02 |
| 5 | Sprawdzić wpływ nowelizacji PB z 2022/2023 (cyfryzacja Dziennika Budowy) | Średni | 2026-03-02 |
| 6 | Dodać szablony dla obiektów użyteczności publicznej (dodatkowe wymagania) | Niski | 2026-03-02 |
| 7 | Sprawdzić czy wymagana jest rejestracja przeglądu w systemie CEEB | Średni | 2026-03-02 |

---

*Dokument: v1.0 | Data: 2026-03-02 | Autor: Claude (Tech Lead Majster.AI) | Właściciel: Robert B.*
*Patrz ADR-0010 — zasady zarządzania tym dokumentem.*

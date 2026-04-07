#!/usr/bin/env python3
"""Generate contract 4: Umowa z zaliczka i etapami"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gen_docx_part1 import *

def generate_contract_with_advance():
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(4)

    add_header(doc, "UMOWA O ROBOTY BUDOWLANE", "Z zaliczką i rozliczeniem etapowym")

    add_para(doc, "zawarta w dniu [DATA ZAWARCIA UMOWY] w [MIEJSCOWOŚĆ]")
    add_para(doc, "pomiędzy:")
    doc.add_paragraph()
    add_party_block(doc, "ZAMAWIAJĄCY (Inwestor)")
    add_para(doc, "a")
    add_party_block(doc, "WYKONAWCA")
    add_para(doc, "zwanymi dalej łącznie 'Stronami', a każda z osobna 'Stroną',")
    add_para(doc, "o następującej treści:")
    doc.add_paragraph()

    # §1
    add_section_title(doc, 1, "Przedmiot umowy")
    add_para(doc, "1. Wykonawca zobowiązuje się do wykonania robót budowlanych polegających na:")
    add_placeholder(doc, "Szczegółowy opis robót budowlanych")
    add_para(doc, "2. Adres obiektu:")
    add_placeholder(doc, "Adres obiektu / nieruchomości")
    add_para(doc, "3. Szczegółowy zakres robót określa Załącznik nr 1.")

    # §2
    add_section_title(doc, 2, "Termin realizacji i etapy")
    add_para(doc, "1. Rozpoczęcie robót: [DATA ROZPOCZĘCIA]")
    add_para(doc, "2. Zakończenie robót: [DATA ZAKOŃCZENIA]")
    add_para(doc, "3. Realizacja robót podzielona jest na następujące etapy:", bold=True)
    doc.add_paragraph()

    # Tabela etapów
    table = doc.add_table(rows=6, cols=4)
    table.style = 'Table Grid'
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    headers = ['Etap', 'Opis prac', 'Termin zakończenia', '% wartości umowy']
    for i, h in enumerate(headers):
        cell = table.cell(0, i)
        cell.text = h
        for p in cell.paragraphs:
            for r in p.runs:
                r.bold = True

    stages = [
        ('I', '[Opis etapu I — np. roboty ziemne i fundamenty]', '[DATA]', '[%]'),
        ('II', '[Opis etapu II — np. stan surowy otwarty]', '[DATA]', '[%]'),
        ('III', '[Opis etapu III — np. stan surowy zamknięty]', '[DATA]', '[%]'),
        ('IV', '[Opis etapu IV — np. instalacje i wykończenie]', '[DATA]', '[%]'),
        ('V', '[Opis etapu V — np. prace końcowe i odbiór]', '[DATA]', '[%]'),
    ]
    for row_idx, (stage, desc, date, pct) in enumerate(stages, 1):
        table.cell(row_idx, 0).text = stage
        table.cell(row_idx, 1).text = desc
        table.cell(row_idx, 2).text = date
        table.cell(row_idx, 3).text = pct

    doc.add_paragraph()
    add_para(doc, "4. Harmonogram szczegółowy stanowi Załącznik nr 2.")
    add_para(doc, "5. Zmiana etapów lub terminów wymaga pisemnego aneksu.")

    # §3
    add_section_title(doc, 3, "Wynagrodzenie")
    add_para(doc, "1. Łączne wynagrodzenie za wykonanie robót wynosi:")
    add_placeholder(doc, "Kwota netto (słownie i cyfrowo)")
    add_para(doc, "   powiększone o VAT [STAWKA]%, brutto:")
    add_placeholder(doc, "Kwota brutto (słownie i cyfrowo)")

    # §4
    add_section_title(doc, 4, "Zaliczka")
    add_para(doc, "1. Zamawiający wpłaci Wykonawcy zaliczkę w wysokości:", bold=True)
    add_placeholder(doc, "Kwota zaliczki brutto (słownie i cyfrowo)")
    add_para(doc, "   co stanowi [PROCENT]% łącznego wynagrodzenia brutto.")
    add_para(doc, "2. Zaliczka zostanie wpłacona w terminie [LICZBA] dni od podpisania umowy, na rachunek bankowy Wykonawcy:")
    add_placeholder(doc, "Numer rachunku bankowego")
    add_para(doc, "3. Zaliczka przeznaczona jest na pokrycie kosztów zakupu materiałów i przygotowania placu budowy.")
    add_para(doc, "4. Zaliczka zostanie rozliczona (potrącona) proporcjonalnie z faktur za poszczególne etapy, począwszy od faktury za Etap I.")
    add_para(doc, "5. W przypadku odstąpienia od umowy z przyczyn leżących po stronie Wykonawcy, Wykonawca zwróci niewykorzystaną część zaliczki w terminie 14 dni.")
    add_para(doc, "6. W przypadku odstąpienia od umowy z przyczyn leżących po stronie Zamawiającego, zaliczka zostanie rozliczona proporcjonalnie do zaawansowania robót.")
    add_para(doc, "7. Wykonawca wystawia fakturę zaliczkową w dniu otrzymania zaliczki.")

    # §5
    add_section_title(doc, 5, "Rozliczenie etapowe i płatności")
    add_para(doc, "1. Po zakończeniu każdego etapu Wykonawca zgłasza gotowość do odbioru etapowego.")
    add_para(doc, "2. Zamawiający dokonuje odbioru etapowego w ciągu 5 dni roboczych od zgłoszenia.")
    add_para(doc, "3. Z odbioru etapowego sporządza się protokół odbioru częściowego.")
    add_para(doc, "4. Na podstawie protokołu odbioru Wykonawca wystawia fakturę VAT za dany etap.")
    add_para(doc, "5. Wartość faktury za etap = procent wartości umowy przypisany do danego etapu (§ 2 ust. 3), pomniejszony o proporcjonalną część potrącanej zaliczki.")
    add_para(doc, "6. Termin płatności: [LICZBA] dni od doręczenia prawidłowej faktury.")
    add_para(doc, "7. Faktura końcowa (za ostatni etap) zostanie wystawiona po odbiorze końcowym.")
    add_para(doc, "8. Suma wszystkich faktur częściowych i zaliczkowej = łączne wynagrodzenie brutto.")

    # §6
    add_section_title(doc, 6, "Obowiązki Stron")
    add_para(doc, "1. Wykonawca: realizacja robót zgodnie z umową i dokumentacją, informowanie o postępie, nadzór wykwalifikowanych pracowników.")
    add_para(doc, "2. Zamawiający: przekazanie placu budowy, terminowe wpłaty (zaliczka i faktury etapowe), odbiory etapowe w ustalonych terminach.")

    # §7
    add_section_title(doc, 7, "Odbiór końcowy")
    add_para(doc, "1. Odbiór końcowy następuje po zakończeniu wszystkich etapów.")
    add_para(doc, "2. Zamawiający przystępuje do odbioru końcowego w ciągu 7 dni od zgłoszenia.")
    add_para(doc, "3. Protokół odbioru końcowego stanowi podstawę do wystawienia faktury końcowej.")

    # §8
    add_section_title(doc, 8, "Gwarancja i rękojmia")
    add_para(doc, "1. Gwarancja na wykonane roboty:")
    add_placeholder(doc, "Okres gwarancji (np. 36 miesięcy)")
    add_para(doc, "   od daty odbioru końcowego.")
    add_para(doc, "2. Rękojmia za wady na zasadach Kodeksu cywilnego.")
    add_para(doc, "3. Usunięcie wad gwarancyjnych w terminie 14 dni od zgłoszenia.")

    # §9
    add_section_title(doc, 9, "Kary umowne")
    add_para(doc, "1. Za opóźnienie w realizacji etapu — 0,2% wynagrodzenia brutto za każdy dzień.")
    add_para(doc, "2. Za opóźnienie w usunięciu wad — 0,1% wynagrodzenia brutto za każdy dzień.")
    add_para(doc, "3. Za odstąpienie z winy Wykonawcy — 10% wynagrodzenia brutto + zwrot zaliczki.")
    add_para(doc, "4. Za odstąpienie z winy Zamawiającego — 10% wynagrodzenia brutto.")

    # §10
    add_section_title(doc, 10, "Odstąpienie od umowy")
    add_para(doc, "1. Zamawiający może odstąpić od umowy w przypadku opóźnienia etapu przekraczającego 14 dni bez uzasadnionej przyczyny.")
    add_para(doc, "2. Wykonawca może odstąpić w przypadku braku wpłaty zaliczki w terminie lub opóźnienia płatności etapowej przekraczającego 30 dni.")
    add_para(doc, "3. Przy odstąpieniu — rozliczenie na podstawie rzeczywistego zaawansowania robót.")

    # §11
    add_section_title(doc, 11, "Postanowienia końcowe")
    add_para(doc, "1. Zmiany umowy wymagają formy pisemnej.")
    add_para(doc, "2. W sprawach nieuregulowanych — Kodeks cywilny, art. 394 (zaliczka), art. 647–658 (roboty budowlane).")
    add_para(doc, "3. Spory rozstrzyga sąd właściwy dla siedziby Zamawiającego.")
    add_para(doc, "4. Umowę sporządzono w dwóch egzemplarzach.")
    add_para(doc, "5. Załączniki:")
    add_para(doc, "   Załącznik nr 1 — Zakres robót")
    add_para(doc, "   Załącznik nr 2 — Harmonogram etapowy")
    add_para(doc, "   Załącznik nr 3 — Wzór protokołu odbioru etapowego")

    doc.add_paragraph()
    add_para(doc, "Podstawy prawne:", bold=True)
    add_para(doc, "• Kodeks cywilny, art. 394 (zadatek/zaliczka), Dz.U. 1964 nr 16 poz. 93 ze zm.")
    add_para(doc, "• Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.")

    add_signature_block(doc)
    add_disclaimer(doc)

    path = os.path.join(OUTPUT_DIR, 'contract_with_advance.docx')
    doc.save(path)
    print(f"OK: {path}")

if __name__ == '__main__':
    generate_contract_with_advance()

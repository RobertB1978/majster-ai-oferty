#!/usr/bin/env python3
"""Generate contract 2: Umowa kosztorysowa (koszt + marza)"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gen_docx_part1 import *

def generate_contract_cost_plus():
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(4)

    add_header(doc, "UMOWA KOSZTORYSOWA", "Rozliczenie kosztorysowe (koszt + marża)")

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
    add_para(doc, "2. Roboty będą wykonywane pod adresem:")
    add_placeholder(doc, "Adres obiektu / nieruchomości")
    add_para(doc, "3. Szczegółowy zakres robót określa kosztorys ofertowy stanowiący Załącznik nr 1.")
    add_para(doc, "4. Kosztorys ofertowy zawiera wykaz robót z jednostkami obmiarowymi, cenami jednostkowymi oraz wartością poszczególnych pozycji.")

    # §2
    add_section_title(doc, 2, "Termin realizacji")
    add_para(doc, "1. Rozpoczęcie robót: [DATA ROZPOCZĘCIA]")
    add_para(doc, "2. Zakończenie robót: [DATA ZAKOŃCZENIA]")
    add_para(doc, "3. Harmonogram etapów realizacji stanowi Załącznik nr 2 do umowy.")
    add_para(doc, "4. Zmiana terminu realizacji wymaga pisemnego aneksu.")

    # §3
    add_section_title(doc, 3, "Wynagrodzenie kosztorysowe")
    add_para(doc, "1. Wynagrodzenie Wykonawcy ustala się na podstawie kosztorysu powykonawczego, sporządzonego w oparciu o:")
    add_para(doc, "   a) ceny jednostkowe określone w kosztorysie ofertowym (Załącznik nr 1),")
    add_para(doc, "   b) rzeczywiste ilości wykonanych robót potwierdzone przez Zamawiającego lub inspektora nadzoru.")
    add_para(doc, "2. Szacunkowa wartość robót na podstawie kosztorysu ofertowego wynosi:")
    add_placeholder(doc, "Szacunkowa kwota netto")
    add_para(doc, "   powiększona o podatek VAT [STAWKA]%, co daje szacunkową kwotę brutto:")
    add_placeholder(doc, "Szacunkowa kwota brutto")
    add_para(doc, "3. Marża Wykonawcy wynosi [PROCENT MARŻY]% od udokumentowanych kosztów bezpośrednich (materiały, robocizna, sprzęt).")
    add_para(doc, "4. Ostateczna wartość wynagrodzenia zostanie ustalona na podstawie kosztorysu powykonawczego po zakończeniu robót.")
    add_para(doc, "5. W przypadku konieczności wykonania robót nieprzewidzianych w kosztorysie ofertowym, ich wycena nastąpi na podstawie:")
    add_para(doc, "   a) cen jednostkowych z kosztorysu ofertowego dla robót analogicznych,")
    add_para(doc, "   b) cen rynkowych dla robót niemających odpowiednika w kosztorysie, zaakceptowanych pisemnie przez Zamawiającego przed ich realizacją.")

    # §4
    add_section_title(doc, 4, "Rozliczenie i płatności")
    add_para(doc, "1. Rozliczenie robót następuje w okresach miesięcznych na podstawie protokołów częściowego odbioru robót.")
    add_para(doc, "2. Do każdego protokołu Wykonawca dołącza kosztorys częściowy obejmujący roboty wykonane w danym okresie rozliczeniowym.")
    add_para(doc, "3. Zamawiający lub inspektor nadzoru weryfikuje kosztorys częściowy w ciągu 5 dni roboczych.")
    add_para(doc, "4. Po zatwierdzeniu kosztorysu częściowego Wykonawca wystawia fakturę VAT.")
    add_para(doc, "5. Termin płatności: [LICZBA] dni od daty doręczenia prawidłowej faktury.")
    add_para(doc, "6. Płatność przelewem na rachunek:")
    add_placeholder(doc, "Numer rachunku bankowego Wykonawcy")
    add_para(doc, "7. Rozliczenie końcowe nastąpi na podstawie kosztorysu powykonawczego po odbiorze końcowym.")

    # §5
    add_section_title(doc, 5, "Dokumentacja kosztowa")
    add_para(doc, "1. Wykonawca jest zobowiązany do prowadzenia szczegółowej dokumentacji kosztowej obejmującej:")
    add_para(doc, "   a) ewidencję zużytych materiałów z fakturami zakupu,")
    add_para(doc, "   b) ewidencję czasu pracy pracowników z podziałem na poszczególne roboty,")
    add_para(doc, "   c) ewidencję pracy sprzętu i maszyn,")
    add_para(doc, "   d) dziennik robót z wpisami dotyczącymi postępu prac.")
    add_para(doc, "2. Zamawiający ma prawo wglądu do dokumentacji kosztowej w każdym czasie.")
    add_para(doc, "3. Wykonawca przedstawia zestawienie kosztów na żądanie Zamawiającego w terminie 3 dni roboczych.")

    # §6
    add_section_title(doc, 6, "Obowiązki Stron")
    add_para(doc, "1. Obowiązki Wykonawcy:")
    add_para(doc, "   a) wykonanie robót zgodnie z projektem, przepisami i sztuką budowlaną,")
    add_para(doc, "   b) zapewnienie wykwalifikowanego personelu i odpowiedniego nadzoru,")
    add_para(doc, "   c) dostarczenie materiałów zgodnych z wymaganiami jakościowymi,")
    add_para(doc, "   d) utrzymanie porządku na placu budowy,")
    add_para(doc, "   e) bieżące informowanie Zamawiającego o postępie robót i kosztach.")
    add_para(doc, "2. Obowiązki Zamawiającego:")
    add_para(doc, "   a) przekazanie placu budowy i dokumentacji projektowej,")
    add_para(doc, "   b) zapewnienie nadzoru inwestorskiego,")
    add_para(doc, "   c) terminowa weryfikacja kosztorysów częściowych,")
    add_para(doc, "   d) terminowa zapłata wynagrodzenia.")

    # §7
    add_section_title(doc, 7, "Odbiór robót")
    add_para(doc, "1. Odbiory częściowe odbywają się w cyklach miesięcznych zgodnie z § 4.")
    add_para(doc, "2. Odbiór końcowy następuje po zakończeniu wszystkich robót objętych umową.")
    add_para(doc, "3. Z każdego odbioru sporządza się protokół podpisany przez obie Strony.")
    add_para(doc, "4. Zamawiający przystąpi do odbioru końcowego w terminie 7 dni od zgłoszenia gotowości.")

    # §8
    add_section_title(doc, 8, "Gwarancja i rękojmia")
    add_para(doc, "1. Wykonawca udziela gwarancji na wykonane roboty na okres:")
    add_placeholder(doc, "Okres gwarancji (np. 36 miesięcy)")
    add_para(doc, "   od daty odbioru końcowego.")
    add_para(doc, "2. Niezależnie od gwarancji, Zamawiającemu przysługuje rękojmia za wady na zasadach Kodeksu cywilnego.")
    add_para(doc, "3. Wykonawca usunie wady gwarancyjne w terminie 14 dni od zgłoszenia.")

    # §9
    add_section_title(doc, 9, "Kary umowne")
    add_para(doc, "1. Kary umowne:")
    add_para(doc, "   a) za opóźnienie w realizacji — 0,2% szacunkowego wynagrodzenia brutto za każdy dzień opóźnienia,")
    add_para(doc, "   b) za opóźnienie w usunięciu wad — 0,1% szacunkowego wynagrodzenia brutto za każdy dzień,")
    add_para(doc, "   c) za odstąpienie z winy Wykonawcy — 10% szacunkowego wynagrodzenia brutto,")
    add_para(doc, "   d) za odstąpienie z winy Zamawiającego — 10% szacunkowego wynagrodzenia brutto.")
    add_para(doc, "2. Strony zastrzegają prawo dochodzenia odszkodowania uzupełniającego ponad kary umowne.")

    # §10
    add_section_title(doc, 10, "Postanowienia końcowe")
    add_para(doc, "1. Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności.")
    add_para(doc, "2. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego i Prawa budowlanego.")
    add_para(doc, "3. Spory rozstrzyga sąd powszechny właściwy dla siedziby Zamawiającego.")
    add_para(doc, "4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.")
    add_para(doc, "5. Załączniki:")
    add_para(doc, "   Załącznik nr 1 — Kosztorys ofertowy")
    add_para(doc, "   Załącznik nr 2 — Harmonogram realizacji")
    add_para(doc, "   Załącznik nr 3 — Specyfikacja techniczna materiałów")

    doc.add_paragraph()
    add_para(doc, "Podstawy prawne:", bold=True)
    add_para(doc, "• Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.")
    add_para(doc, "• Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.")

    add_signature_block(doc)
    add_disclaimer(doc)

    path = os.path.join(OUTPUT_DIR, 'contract_cost_plus.docx')
    doc.save(path)
    print(f"OK: {path}")
    return path

if __name__ == '__main__':
    generate_contract_cost_plus()

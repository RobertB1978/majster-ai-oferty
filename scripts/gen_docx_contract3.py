#!/usr/bin/env python3
"""Generate contract 3: Umowa z klauzula materialowa"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gen_docx_part1 import *

def generate_contract_with_materials():
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(4)

    add_header(doc, "UMOWA O ROBOTY BUDOWLANE", "Z klauzulą materiałową")

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
    add_para(doc, "3. Zakres robót obejmuje prace opisane w Załączniku nr 1 (Specyfikacja robót).")

    # §2
    add_section_title(doc, 2, "Termin realizacji")
    add_para(doc, "1. Rozpoczęcie robót: [DATA ROZPOCZĘCIA]")
    add_para(doc, "2. Zakończenie robót: [DATA ZAKOŃCZENIA]")
    add_para(doc, "3. Zmiana terminu wymaga pisemnego aneksu do umowy.")

    # §3
    add_section_title(doc, 3, "Klauzula materiałowa — podział odpowiedzialności")
    add_para(doc, "1. Strony ustalają następujący podział odpowiedzialności za materiały budowlane:", bold=True)
    doc.add_paragraph()
    add_para(doc, "MATERIAŁY DOSTARCZANE PRZEZ ZAMAWIAJĄCEGO:", bold=True)
    add_placeholder(doc, "Lista materiałów dostarczanych przez Zamawiającego — np. okna, drzwi, płytki, armatura")
    add_para(doc, "a) Zamawiający zobowiązuje się dostarczyć powyższe materiały na plac budowy w terminach uzgodnionych z Wykonawcą, nie później niż 5 dni roboczych przed planowanym terminem ich wbudowania.")
    add_para(doc, "b) Materiały muszą odpowiadać wymaganiom jakościowym określonym w dokumentacji technicznej.")
    add_para(doc, "c) Wykonawca potwierdza odbiór materiałów protokołem odbioru materiałów (Załącznik nr 3).")
    add_para(doc, "d) Odpowiedzialność za wady materiałów dostarczonych przez Zamawiającego ponosi Zamawiający.")
    add_para(doc, "e) Wykonawca ponosi odpowiedzialność za prawidłowe wbudowanie i przechowywanie materiałów od momentu ich odebrania.")
    doc.add_paragraph()
    add_para(doc, "MATERIAŁY DOSTARCZANE PRZEZ WYKONAWCĘ:", bold=True)
    add_placeholder(doc, "Lista materiałów dostarczanych przez Wykonawcę — np. cement, piasek, kleje, zaprawy, elementy instalacyjne")
    add_para(doc, "a) Wykonawca zobowiązuje się dostarczyć materiały spełniające wymagania jakościowe i normy techniczne.")
    add_para(doc, "b) Na żądanie Zamawiającego, Wykonawca przedstawi certyfikaty jakości, deklaracje zgodności lub karty techniczne materiałów.")
    add_para(doc, "c) Wykonawca ponosi pełną odpowiedzialność za jakość i terminowość dostaw materiałów własnych.")
    add_para(doc, "d) Zamawiający ma prawo odmówić wbudowania materiałów niespełniających wymagań jakościowych.")

    # §4
    add_section_title(doc, 4, "Procedura zmiany materiałów")
    add_para(doc, "1. Zmiana rodzaju lub producenta materiału wymaga pisemnej zgody obu Stron.")
    add_para(doc, "2. W przypadku niedostępności materiału wskazanego w umowie, Wykonawca niezwłocznie informuje Zamawiającego i proponuje zamiennik o parametrach nie gorszych niż materiał pierwotny.")
    add_para(doc, "3. Różnica w cenie materiału zamiennego podlega rozliczeniu na podstawie pisemnego porozumienia Stron.")
    add_para(doc, "4. Wykonawca nie może samodzielnie dokonywać zamiany materiałów bez pisemnej zgody Zamawiającego.")

    # §5
    add_section_title(doc, 5, "Wynagrodzenie")
    add_para(doc, "1. Wynagrodzenie Wykonawcy składa się z:")
    add_para(doc, "   a) wynagrodzenia za robociznę (netto):")
    add_placeholder(doc, "Kwota za robociznę netto")
    add_para(doc, "   b) kosztów materiałów dostarczanych przez Wykonawcę (wg rzeczywistych faktur + marża [PROCENT]%):")
    add_placeholder(doc, "Szacunkowa kwota materiałów Wykonawcy")
    add_para(doc, "   c) łączne szacunkowe wynagrodzenie brutto (robocizna + materiały Wykonawcy + VAT):")
    add_placeholder(doc, "Łączna szacunkowa kwota brutto")
    add_para(doc, "2. Koszty materiałów dostarczanych przez Zamawiającego nie wchodzą w skład wynagrodzenia Wykonawcy.")
    add_para(doc, "3. Rozliczenie materiałów Wykonawcy odbywa się na podstawie faktur zakupu, udostępnianych Zamawiającemu na żądanie.")

    # §6
    add_section_title(doc, 6, "Warunki płatności")
    add_para(doc, "1. Płatność na podstawie faktur VAT w terminie [LICZBA] dni od doręczenia.")
    add_para(doc, "2. Przelew na rachunek bankowy Wykonawcy:")
    add_placeholder(doc, "Numer rachunku bankowego")
    add_para(doc, "3. Faktury częściowe za materiały mogą być wystawiane po dostarczeniu i wbudowaniu materiałów.")

    # §7
    add_section_title(doc, 7, "Obowiązki Stron")
    add_para(doc, "1. Wykonawca: realizacja robót zgodnie z projektem i sztuką budowlaną, prawidłowe wbudowanie materiałów, utrzymanie porządku na budowie.")
    add_para(doc, "2. Zamawiający: terminowe dostarczenie materiałów, przekazanie placu budowy, nadzór inwestorski, terminowe płatności.")

    # §8
    add_section_title(doc, 8, "Odbiór robót")
    add_para(doc, "1. Odbiór końcowy w ciągu 7 dni od zgłoszenia gotowości.")
    add_para(doc, "2. Protokół odbioru obejmuje weryfikację jakości wbudowania materiałów obu Stron.")
    add_para(doc, "3. Niewykorzystane materiały Zamawiającego zostaną zwrócone w stanie niepogorszonym.")

    # §9
    add_section_title(doc, 9, "Gwarancja i rękojmia")
    add_para(doc, "1. Gwarancja Wykonawcy na roboty budowlane:")
    add_placeholder(doc, "Okres gwarancji na roboty (np. 36 miesięcy)")
    add_para(doc, "2. Gwarancja Wykonawcy na materiały dostarczone przez Wykonawcę:")
    add_placeholder(doc, "Okres gwarancji na materiały Wykonawcy (np. 24 miesiące)")
    add_para(doc, "3. Gwarancja na materiały dostarczone przez Zamawiającego — zgodnie z gwarancją producenta.")
    add_para(doc, "4. Wykonawca odpowiada za wady wynikające z nieprawidłowego wbudowania materiałów, niezależnie od tego, kto je dostarczył.")

    # §10
    add_section_title(doc, 10, "Kary umowne i postanowienia końcowe")
    add_para(doc, "1. Kary umowne stosuje się analogicznie do standardowej umowy o roboty budowlane (0,2% za dzień opóźnienia, 10% za odstąpienie).")
    add_para(doc, "2. Opóźnienie w dostawie materiałów przez Zamawiającego skutkuje odpowiednim przesunięciem terminu realizacji.")
    add_para(doc, "3. Zmiany umowy wymagają formy pisemnej.")
    add_para(doc, "4. W sprawach nieuregulowanych stosuje się Kodeks cywilny.")
    add_para(doc, "5. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach.")
    add_para(doc, "6. Załączniki:")
    add_para(doc, "   Załącznik nr 1 — Specyfikacja robót")
    add_para(doc, "   Załącznik nr 2 — Lista materiałów z podziałem odpowiedzialności")
    add_para(doc, "   Załącznik nr 3 — Wzór protokołu odbioru materiałów")

    doc.add_paragraph()
    add_para(doc, "Podstawy prawne:", bold=True)
    add_para(doc, "• Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.")

    add_signature_block(doc)
    add_disclaimer(doc)

    path = os.path.join(OUTPUT_DIR, 'contract_with_materials.docx')
    doc.save(path)
    print(f"OK: {path}")

if __name__ == '__main__':
    generate_contract_with_materials()

#!/usr/bin/env python3
"""Generate contract 5: Zlecenie / mini-umowa"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gen_docx_part1 import *

def generate_contract_simple_order():
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(4)

    add_header(doc, "ZLECENIE WYKONANIA ROBÓT", "Mini-umowa na prace budowlane / remontowe")

    add_para(doc, "zawarte w dniu [DATA ZAWARCIA] w [MIEJSCOWOŚĆ]")
    add_para(doc, "pomiędzy:")
    doc.add_paragraph()
    add_party_block(doc, "ZLECENIODAWCA")
    add_para(doc, "a")
    add_party_block(doc, "ZLECENIOBIORCA (Wykonawca)")
    add_para(doc, "zwanymi dalej łącznie 'Stronami',")
    add_para(doc, "o następującej treści:")
    doc.add_paragraph()

    # §1
    add_section_title(doc, 1, "Przedmiot zlecenia")
    add_para(doc, "1. Zleceniobiorca zobowiązuje się wykonać następujące prace:")
    add_placeholder(doc, "Opis prac — np. malowanie ścian, wymiana podłogi, montaż drzwi, naprawa instalacji")
    add_para(doc, "2. Adres wykonywania prac:")
    add_placeholder(doc, "Adres lokalu / nieruchomości")
    add_para(doc, "3. Prace obejmują:")
    add_placeholder(doc, "Szczegółowa lista czynności do wykonania")

    # §2
    add_section_title(doc, 2, "Termin wykonania")
    add_para(doc, "1. Rozpoczęcie prac: [DATA ROZPOCZĘCIA]")
    add_para(doc, "2. Zakończenie prac: [DATA ZAKOŃCZENIA]")
    add_para(doc, "3. Godziny pracy: od [GODZINA] do [GODZINA], w dniach [DNI TYGODNIA].")

    # §3
    add_section_title(doc, 3, "Wynagrodzenie")
    add_para(doc, "1. Wynagrodzenie za wykonanie zlecenia wynosi:")
    add_placeholder(doc, "Kwota brutto (słownie i cyfrowo)")
    add_para(doc, "2. Wynagrodzenie obejmuje:")
    add_para(doc, "   a) robociznę — TAK / NIE")
    add_para(doc, "   b) materiały — TAK / NIE (jeśli TAK, podać zakres)")
    add_para(doc, "   c) transport — TAK / NIE")
    add_para(doc, "   d) sprzątanie po pracach — TAK / NIE")
    add_para(doc, "3. W przypadku gdy materiały nie są wliczone w wynagrodzenie, Zleceniodawca dostarcza je we własnym zakresie.")

    # §4
    add_section_title(doc, 4, "Płatność")
    add_para(doc, "1. Płatność nastąpi po zakończeniu prac i ich odbiorze przez Zleceniodawcę.")
    add_para(doc, "2. Forma płatności: przelew / gotówka (niepotrzebne skreślić).")
    add_para(doc, "3. W przypadku przelewu — rachunek bankowy Zleceniobiorcy:")
    add_placeholder(doc, "Numer rachunku bankowego")
    add_para(doc, "4. Termin płatności: [LICZBA] dni od odbioru prac.")

    # §5
    add_section_title(doc, 5, "Odbiór prac")
    add_para(doc, "1. Po zakończeniu prac Zleceniobiorca zgłasza gotowość do odbioru.")
    add_para(doc, "2. Zleceniodawca dokonuje odbioru w ciągu 3 dni roboczych.")
    add_para(doc, "3. W przypadku stwierdzenia usterek, Zleceniobiorca usunie je w terminie 5 dni roboczych na własny koszt.")

    # §6
    add_section_title(doc, 6, "Gwarancja")
    add_para(doc, "1. Zleceniobiorca udziela gwarancji na wykonane prace na okres:")
    add_placeholder(doc, "Okres gwarancji (np. 12 miesięcy)")
    add_para(doc, "   od daty odbioru prac.")
    add_para(doc, "2. Gwarancja obejmuje wady wynikające z nieprawidłowego wykonania prac.")
    add_para(doc, "3. Gwarancja nie obejmuje uszkodzeń wynikających z nieprawidłowego użytkowania przez Zleceniodawcę.")

    # §7
    add_section_title(doc, 7, "Odpowiedzialność")
    add_para(doc, "1. Zleceniobiorca ponosi odpowiedzialność za szkody wyrządzone w mieniu Zleceniodawcy podczas wykonywania prac.")
    add_para(doc, "2. Zleceniobiorca zobowiązuje się do zachowania porządku w miejscu pracy i uprzątnięcia po zakończeniu prac.")
    add_para(doc, "3. Zleceniobiorca oświadcza, że posiada umiejętności i doświadczenie niezbędne do prawidłowego wykonania zleconych prac.")

    # §8
    add_section_title(doc, 8, "Postanowienia końcowe")
    add_para(doc, "1. Zmiany zlecenia wymagają formy pisemnej.")
    add_para(doc, "2. Każda ze Stron może rozwiązać zlecenie z 3-dniowym wypowiedzeniem, z rozliczeniem wykonanych prac.")
    add_para(doc, "3. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego, art. 627–646 (umowa o dzieło).")
    add_para(doc, "4. Zlecenie sporządzono w dwóch egzemplarzach, po jednym dla każdej Strony.")

    doc.add_paragraph()
    add_para(doc, "Podstawy prawne:", bold=True)
    add_para(doc, "• Kodeks cywilny, art. 627–646 (umowa o dzieło), Dz.U. 1964 nr 16 poz. 93 ze zm.")

    add_signature_block(doc)
    add_disclaimer(doc)

    path = os.path.join(OUTPUT_DIR, 'contract_simple_order.docx')
    doc.save(path)
    print(f"OK: {path}")

if __name__ == '__main__':
    generate_contract_simple_order()

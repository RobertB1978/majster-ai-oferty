#!/usr/bin/env python3
"""Generate contract 1: Umowa o roboty budowlane - ryczalt"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))
from gen_docx_part1 import *

def generate_contract_fixed_price():
    doc = Document()
    style = doc.styles['Normal']
    style.font.name = 'Calibri'
    style.font.size = Pt(10)
    style.paragraph_format.space_after = Pt(4)

    add_header(doc, "UMOWA O ROBOTY BUDOWLANE", "Rozliczenie ryczałtowe")

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
    add_para(doc, "1. Wykonawca zobowiązuje się do wykonania na rzecz Zamawiającego robót budowlanych polegających na:")
    add_placeholder(doc, "Szczegółowy opis robót budowlanych — rodzaj, charakter i zakres prac")
    add_para(doc, "2. Roboty będą wykonywane w obiekcie/nieruchomości zlokalizowanej pod adresem:")
    add_placeholder(doc, "Dokładny adres obiektu / nieruchomości")
    add_para(doc, "3. Szczegółowy zakres robót określa dokumentacja techniczna stanowiąca Załącznik nr 1 do niniejszej umowy.")
    add_para(doc, "4. Wykonawca oświadcza, że zapoznał się z dokumentacją techniczną oraz miejscem wykonywania robót i nie zgłasza zastrzeżeń co do warunków realizacji.")

    # §2
    add_section_title(doc, 2, "Termin realizacji")
    add_para(doc, "1. Rozpoczęcie robót nastąpi w dniu:")
    add_placeholder(doc, "Data rozpoczęcia robót")
    add_para(doc, "2. Zakończenie robót i zgłoszenie do odbioru nastąpi nie później niż w dniu:")
    add_placeholder(doc, "Data zakończenia robót")
    add_para(doc, "3. Termin realizacji może ulec przedłużeniu wyłącznie w przypadku:")
    add_para(doc, "   a) wystąpienia siły wyższej uniemożliwiającej prowadzenie robót,")
    add_para(doc, "   b) zlecenia przez Zamawiającego robót dodatkowych wpływających na termin,")
    add_para(doc, "   c) wstrzymania robót przez Zamawiającego na okres dłuższy niż 7 dni roboczych,")
    add_para(doc, "   d) niekorzystnych warunków atmosferycznych uniemożliwiających prowadzenie robót zgodnie ze sztuką budowlaną.")
    add_para(doc, "4. Zmiana terminu wymaga formy pisemnej pod rygorem nieważności w postaci aneksu do umowy.")

    # §3
    add_section_title(doc, 3, "Wynagrodzenie ryczałtowe")
    add_para(doc, "1. Strony ustalają wynagrodzenie ryczałtowe za wykonanie całości robót objętych niniejszą umową w wysokości:")
    add_placeholder(doc, "Kwota netto (słownie i cyfrowo)")
    add_para(doc, "   powiększone o podatek VAT w stawce [STAWKA VAT]%, co daje kwotę brutto:")
    add_placeholder(doc, "Kwota brutto (słownie i cyfrowo)")
    add_para(doc, "2. Wynagrodzenie ryczałtowe obejmuje wszelkie koszty związane z realizacją przedmiotu umowy, w tym koszty materiałów, robocizny, sprzętu, transportu, ubezpieczenia oraz wszelkie inne koszty niezbędne do prawidłowego wykonania robót.")
    add_para(doc, "3. Wynagrodzenie ryczałtowe jest stałe i nie podlega waloryzacji, z wyjątkiem przypadków opisanych w § 8 niniejszej umowy.")
    add_para(doc, "4. Wynagrodzenie nie obejmuje robót dodatkowych nieobjętych zakresem umowy, które wymagają odrębnego zlecenia.")

    # §4
    add_section_title(doc, 4, "Warunki płatności")
    add_para(doc, "1. Zapłata wynagrodzenia nastąpi na podstawie faktury VAT wystawionej przez Wykonawcę po dokonaniu odbioru końcowego robót bez zastrzeżeń.")
    add_para(doc, "2. Termin płatności faktury wynosi [LICZBA] dni od daty jej doręczenia Zamawiającemu.")
    add_para(doc, "3. Płatność zostanie dokonana przelewem na rachunek bankowy Wykonawcy:")
    add_placeholder(doc, "Numer rachunku bankowego Wykonawcy")
    add_para(doc, "4. Za dzień zapłaty uważa się dzień obciążenia rachunku bankowego Zamawiającego.")
    add_para(doc, "5. W przypadku opóźnienia w płatności Wykonawcy przysługują odsetki ustawowe za opóźnienie w transakcjach handlowych.")

    # §5
    add_section_title(doc, 5, "Obowiązki Wykonawcy")
    add_para(doc, "1. Wykonawca zobowiązuje się do:")
    add_para(doc, "   a) wykonania robót zgodnie z projektem, pozwoleniem na budowę, przepisami prawa budowlanego, normami technicznymi i sztuką budowlaną,")
    add_para(doc, "   b) zapewnienia odpowiedniego nadzoru nad realizacją robót przez osoby posiadające wymagane uprawnienia,")
    add_para(doc, "   c) dostarczenia materiałów i urządzeń niezbędnych do realizacji robót, spełniających wymagania jakościowe i normy techniczne,")
    add_para(doc, "   d) prowadzenia dziennika budowy (jeśli jest wymagany),")
    add_para(doc, "   e) utrzymania porządku na placu budowy oraz zabezpieczenia terenu robót,")
    add_para(doc, "   f) usunięcia na własny koszt wszelkich odpadów i materiałów rozbiórkowych powstałych w trakcie realizacji robót,")
    add_para(doc, "   g) ubezpieczenia robót od ryzyk budowlanych na czas realizacji umowy,")
    add_para(doc, "   h) niezwłocznego informowania Zamawiającego o wszelkich okolicznościach mogących wpłynąć na termin lub jakość wykonywanych robót.")

    # §6
    add_section_title(doc, 6, "Obowiązki Zamawiającego")
    add_para(doc, "1. Zamawiający zobowiązuje się do:")
    add_para(doc, "   a) przekazania Wykonawcy placu budowy w terminie umożliwiającym rozpoczęcie robót,")
    add_para(doc, "   b) dostarczenia kompletnej dokumentacji projektowej,")
    add_para(doc, "   c) zapewnienia nadzoru inwestorskiego (jeśli jest wymagany),")
    add_para(doc, "   d) terminowej zapłaty wynagrodzenia zgodnie z warunkami umowy,")
    add_para(doc, "   e) przystąpienia do odbioru robót w terminie 7 dni od zgłoszenia gotowości.")

    # §7
    add_section_title(doc, 7, "Odbiór robót")
    add_para(doc, "1. Po zakończeniu robót Wykonawca zgłasza Zamawiającemu gotowość do odbioru końcowego na piśmie.")
    add_para(doc, "2. Zamawiający przystąpi do odbioru w ciągu 7 dni roboczych od otrzymania zgłoszenia.")
    add_para(doc, "3. Z odbioru sporządza się protokół odbioru końcowego, podpisany przez obie Strony.")
    add_para(doc, "4. W przypadku stwierdzenia wad lub usterek Zamawiający wyznaczy Wykonawcy odpowiedni termin na ich usunięcie.")
    add_para(doc, "5. Wykonawca zobowiązany jest usunąć wady i usterki na własny koszt w wyznaczonym terminie.")

    # §8
    add_section_title(doc, 8, "Roboty dodatkowe i zamienne")
    add_para(doc, "1. Roboty dodatkowe nieobjęte zakresem niniejszej umowy mogą być zlecone wyłącznie w formie pisemnego aneksu do umowy.")
    add_para(doc, "2. Wynagrodzenie za roboty dodatkowe będzie ustalone na podstawie odrębnego kosztorysu zaakceptowanego przez obie Strony przed przystąpieniem do ich realizacji.")
    add_para(doc, "3. Roboty zamienne (zmiana technologii lub materiałów) wymagają pisemnej zgody Zamawiającego.")

    # §9
    add_section_title(doc, 9, "Gwarancja i rękojmia")
    add_para(doc, "1. Wykonawca udziela Zamawiającemu gwarancji jakości na wykonane roboty na okres:")
    add_placeholder(doc, "Okres gwarancji (np. 36 miesięcy)")
    add_para(doc, "   licząc od daty podpisania protokołu odbioru końcowego bez zastrzeżeń.")
    add_para(doc, "2. Niezależnie od gwarancji, Zamawiającemu przysługuje rękojmia za wady na zasadach określonych w Kodeksie cywilnym.")
    add_para(doc, "3. W okresie gwarancji Wykonawca zobowiązany jest do nieodpłatnego usunięcia wszelkich wad i usterek ujawnionych w wykonanych robotach w terminie 14 dni od ich zgłoszenia.")
    add_para(doc, "4. W przypadku nieusunięcia wad w wyznaczonym terminie Zamawiający ma prawo zlecić ich usunięcie osobie trzeciej na koszt i ryzyko Wykonawcy.")

    # §10
    add_section_title(doc, 10, "Kary umowne")
    add_para(doc, "1. Wykonawca zapłaci Zamawiającemu kary umowne w następujących przypadkach:")
    add_para(doc, "   a) za opóźnienie w wykonaniu robót — w wysokości 0,2% wynagrodzenia brutto za każdy dzień opóźnienia,")
    add_para(doc, "   b) za opóźnienie w usunięciu wad — w wysokości 0,1% wynagrodzenia brutto za każdy dzień opóźnienia,")
    add_para(doc, "   c) za odstąpienie od umowy z przyczyn leżących po stronie Wykonawcy — w wysokości 10% wynagrodzenia brutto.")
    add_para(doc, "2. Zamawiający zapłaci Wykonawcy karę umowną za odstąpienie od umowy z przyczyn leżących po stronie Zamawiającego — w wysokości 10% wynagrodzenia brutto.")
    add_para(doc, "3. Strony zastrzegają sobie prawo dochodzenia odszkodowania uzupełniającego, przewyższającego wysokość zastrzeżonych kar umownych.")

    # §11
    add_section_title(doc, 11, "Odstąpienie od umowy")
    add_para(doc, "1. Zamawiający może odstąpić od umowy w przypadku:")
    add_para(doc, "   a) opóźnienia Wykonawcy w rozpoczęciu robót przekraczającego 14 dni,")
    add_para(doc, "   b) przerwania robót przez Wykonawcę na okres dłuższy niż 14 dni bez uzasadnionej przyczyny,")
    add_para(doc, "   c) wykonywania robót w sposób wadliwy lub niezgodny z umową pomimo pisemnego wezwania do zmiany sposobu wykonania.")
    add_para(doc, "2. Wykonawca może odstąpić od umowy w przypadku:")
    add_para(doc, "   a) opóźnienia Zamawiającego w płatności wynagrodzenia przekraczającego 30 dni,")
    add_para(doc, "   b) wstrzymania robót przez Zamawiającego na okres dłuższy niż 30 dni bez uzasadnionej przyczyny.")
    add_para(doc, "3. Odstąpienie od umowy wymaga formy pisemnej z podaniem przyczyny.")

    # §12
    add_section_title(doc, 12, "Postanowienia końcowe")
    add_para(doc, "1. Wszelkie zmiany niniejszej umowy wymagają formy pisemnej pod rygorem nieważności.")
    add_para(doc, "2. W sprawach nieuregulowanych niniejszą umową mają zastosowanie przepisy Kodeksu cywilnego, w szczególności art. 647–658 (umowa o roboty budowlane) oraz Prawa budowlanego.")
    add_para(doc, "3. Ewentualne spory wynikające z niniejszej umowy Strony będą starały się rozwiązać polubownie. W przypadku braku porozumienia spory będą rozstrzygane przez sąd powszechny właściwy dla siedziby Zamawiającego.")
    add_para(doc, "4. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron.")
    add_para(doc, "5. Integralną część umowy stanowią następujące załączniki:")
    add_para(doc, "   Załącznik nr 1 — Dokumentacja techniczna / Zakres robót")
    add_para(doc, "   Załącznik nr 2 — Harmonogram rzeczowo-finansowy")

    # References
    doc.add_paragraph()
    add_para(doc, "Podstawy prawne:", bold=True)
    add_para(doc, "• Kodeks cywilny, art. 647–658 (umowa o roboty budowlane), Dz.U. 1964 nr 16 poz. 93 ze zm.")
    add_para(doc, "• Prawo budowlane (Dz.U. 1994 nr 89 poz. 414 ze zm.)")

    add_signature_block(doc)
    add_disclaimer(doc)

    path = os.path.join(OUTPUT_DIR, 'contract_fixed_price.docx')
    doc.save(path)
    print(f"OK: {path}")
    return path

if __name__ == '__main__':
    generate_contract_fixed_price()

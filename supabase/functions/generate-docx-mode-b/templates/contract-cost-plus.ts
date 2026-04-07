/**
 * contract-cost-plus.ts — Umowa kosztorysowa (koszt + marża)
 * template_key: contract_cost_plus_standard
 * quality_tier: standard
 * PR-05a (Mode B Base Contracts)
 */

import { Paragraph, Table } from "npm:docx@8.5.0";
import {
  docTitle, docSubtitle, sectionHeading, para, paraRuns,
  listItem, bulletItem, field, spacer, keyValueTable,
  dataTable, signatureBlock, disclaimer,
} from "../docx-builder.ts";
import type { DocxContext } from "../types.ts";

export function buildContractCostPlus(ctx?: DocxContext): Array<Paragraph | Table> {
  const c  = ctx?.contractor;
  const cl = ctx?.client;
  const p  = ctx?.project;
  const f  = ctx?.finance;
  const d  = ctx?.dates;

  const contractorName  = c?.name           ?? field("pełna nazwa / imię i nazwisko Wykonawcy");
  const contractorAddr  = c?.address        ?? field("adres siedziby Wykonawcy");
  const contractorNip   = c?.nip            ?? field("NIP Wykonawcy");
  const contractorRep   = c?.representedBy  ?? field("imię i nazwisko osoby reprezentującej");

  const clientName      = cl?.name          ?? field("pełna nazwa / imię i nazwisko Zamawiającego");
  const clientAddr      = cl?.address       ?? field("adres Zamawiającego");
  const clientNip       = cl?.nip           ?? field("NIP Zamawiającego (jeśli dotyczy)");
  const clientRep       = cl?.representedBy ?? field("imię i nazwisko reprezentanta, jeśli dotyczy");

  const projectName     = p?.name           ?? field("nazwa projektu / inwestycji");
  const projectAddr     = p?.address        ?? field("adres realizacji");
  const projectDesc     = p?.description    ?? field("opis zakresu prac");

  const vatRate         = f?.vatRate        ?? field("stawka VAT, np. 8%");
  const contractDate    = d?.contractDate   ?? field("data zawarcia umowy");
  const contractPlace   = d?.contractPlace  ?? field("miejscowość");
  const startDate       = d?.startDate      ?? field("planowana data rozpoczęcia");
  const endDate         = d?.endDate        ?? field("szacowany termin zakończenia");

  return [
    disclaimer(),
    ...spacer(1),
    docTitle("UMOWA KOSZTORYSOWA"),
    docSubtitle("Rozliczenie na podstawie kosztu rzeczywistego + marża • Wzór Standardowy • Majster.AI"),
    para(`Zawarta w ${contractPlace}, dnia ${contractDate}, pomiędzy:`, { align: "center" as any }),
    ...spacer(1),

    // ── Strony umowy ──────────────────────────────────────────────────────────
    sectionHeading("§ 1. Strony umowy"),
    para("ZAMAWIAJĄCY:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", clientName],
      ["Adres:", clientAddr],
      ["NIP:", clientNip],
      ["Reprezentowany przez:", clientRep],
    ]),
    ...spacer(1),
    para("WYKONAWCA:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", contractorName],
      ["Adres:", contractorAddr],
      ["NIP:", contractorNip],
      ["Reprezentowany przez:", contractorRep],
    ]),
    ...spacer(1),

    // ── Przedmiot umowy ───────────────────────────────────────────────────────
    sectionHeading("§ 2. Przedmiot umowy"),
    para(`1. Zamawiający zleca, a Wykonawca przyjmuje do wykonania następujące prace: ${projectName}, realizowane pod adresem: ${projectAddr}.`),
    para(`2. Szczegółowy zakres prac: ${projectDesc}`),
    para("3. Wykonawca ma prawo korzystać z podwykonawców wyłącznie za pisemną zgodą Zamawiającego. Wykonawca ponosi pełną odpowiedzialność za działania podwykonawców wobec Zamawiającego."),
    ...spacer(1),

    // ── Zasada rozliczenia ────────────────────────────────────────────────────
    sectionHeading("§ 3. Zasada rozliczenia — koszt rzeczywisty + marża"),
    para("1. Strony ustalają, że wynagrodzenie Wykonawcy będzie obliczone jako suma:"),
    bulletItem(`kosztów rzeczywistych (robocizna, materiały, wynajem sprzętu, koszty podwykonawców, koszty pośrednie) udokumentowanych fakturami, rachunkami lub innymi dowodami księgowymi,`),
    bulletItem(`marży Wykonawcy w wysokości ${field("np. 15")}% (słownie: ${field("piętnaście procent")}) naliczanej od sumy kosztów rzeczywistych netto.`),
    para("2. Do sumy kosztów rzeczywistych i marży zostanie doliczony podatek VAT według stawki właściwej dla danego rodzaju prac (podstawowej lub obniżonej)."),
    para(`3. Koszty rzeczywiste obejmują wyłącznie koszty bezpośrednio związane z realizacją przedmiotu umowy. Koszty ogólne zarządu Wykonawcy są objęte marżą określoną w ust. 1 powyżej.`),
    para("4. Wykonawca zobowiązuje się do ekonomicznego i celowego ponoszenia kosztów, unikania zbędnych wydatków oraz niezwłocznego informowania Zamawiającego o wszelkich okolicznościach mogących spowodować wzrost kosztów."),
    ...spacer(1),

    // ── Kosztorys szacunkowy ──────────────────────────────────────────────────
    sectionHeading("§ 4. Szacunkowy budżet i limit budżetowy"),
    para(`1. Szacunkowy koszt realizacji przedmiotu umowy wynosi ${field("kwota szacunkowa netto")} netto + ${field("np. 15")}% marży, tj. łącznie ${field("kwota szacunkowa brutto z marżą")} netto, do czego dolicza się VAT wg stawki ${vatRate}.`),
    para(`2. Bez pisemnej zgody Zamawiającego Wykonawca nie może przekroczyć limitu budżetowego w wysokości ${field("maksymalna kwota netto")} netto. Przekroczenie limitu bez zgody Zamawiającego następuje na koszt i ryzyko Wykonawcy.`),
    para("3. W przypadku ryzyka przekroczenia limitu budżetowego Wykonawca jest zobowiązany niezwłocznie (najpóźniej na 7 dni przed jego przekroczeniem) powiadomić Zamawiającego na piśmie, wskazując przyczyny i nową prognozę kosztów."),
    para("4. Zamawiający w terminie 5 dni roboczych od otrzymania powiadomienia podejmie decyzję o:"),
    bulletItem("zatwierdzeniu nowego limitu budżetowego (aneks do umowy),"),
    bulletItem("zawężeniu zakresu robót do kwoty mieszczącej się w dotychczasowym limicie,"),
    bulletItem("rozwiązaniu umowy z rozliczeniem robót wykonanych do dnia rozwiązania."),
    ...spacer(1),

    // ── Termin realizacji ─────────────────────────────────────────────────────
    sectionHeading("§ 5. Termin realizacji"),
    para(`1. Planowany termin rozpoczęcia robót: ${startDate}.`),
    para(`2. Szacowany termin zakończenia: ${endDate}. Termin ma charakter orientacyjny i może ulec zmianie w zależności od faktycznie poniesionych kosztów i decyzji Zamawiającego w sprawie zakresu robót.`),
    para("3. Strony dopuszczają etapowanie robót. Harmonogram etapów zostanie uzgodniony w terminie 7 dni od zawarcia umowy i stanowił będzie Załącznik nr 1."),
    ...spacer(1),

    // ── Rozliczenie i fakturowanie ────────────────────────────────────────────
    sectionHeading("§ 6. Rozliczenie i fakturowanie"),
    para(`1. Wykonawca wystawia faktury ${field("np. miesięcznie / po zakończeniu każdego etapu")} na podstawie raportu kosztów zaakceptowanego przez Zamawiającego.`),
    para("2. Raport kosztów zawiera:"),
    dataTable(
      ["Lp.", "Opis kosztu", "Kategoria", "Wartość netto", "Dokument źródłowy"],
      [
        ["1", "Robocizna — murowanie ścian", "Robocizna", field("kwota"), "Lista płac / zlecenie"],
        ["2", "Materiały — bloczki betonowe", "Materiały", field("kwota"), "Faktura nr ..."],
        ["3", "Wynajem rusztowania", "Sprzęt", field("kwota"), "Faktura nr ..."],
        ["...", "...", "...", "...", "..."],
      ],
      [400, 2000, 1200, 1500, 2000],
    ),
    ...spacer(1),
    para("3. Zamawiający akceptuje raport kosztów (lub zgłasza uwagi) w terminie 5 dni roboczych od jego otrzymania."),
    para("4. Brak odpowiedzi w terminie wskazanym w ust. 3 uznaje się za akceptację raportu."),
    para(`5. Termin płatności faktury: ${field("np. 14")} dni od daty doręczenia faktury.`),
    para(`6. Płatność realizowana jest na rachunek bankowy Wykonawcy: ${field("numer rachunku bankowego")}.`),
    ...spacer(1),

    // ── Obowiązki Wykonawcy ───────────────────────────────────────────────────
    sectionHeading("§ 7. Obowiązki Wykonawcy"),
    listItem(1, "Wykonywanie robót zgodnie z zasadami wiedzy technicznej, dokumentacją projektową i obowiązującymi normami."),
    listItem(2, "Prowadzenie szczegółowej ewidencji kosztów i udostępnianie jej Zamawiającemu na każde żądanie."),
    listItem(3, "Przechowywanie oryginałów dokumentów źródłowych (faktury, rachunki) przez okres co najmniej 5 lat od zakończenia robót."),
    listItem(4, "Informowanie Zamawiającego o ryzyku przekroczenia budżetu z wyprzedzeniem co najmniej 7 dni."),
    listItem(5, "Uzyskanie pisemnej zgody Zamawiającego przed każdym zakupem materiałów lub usług przekraczającym ${field(\"np. 2 000,00 zł netto\")} w ramach jednej pozycji."),
    listItem(6, "Przestrzeganie przepisów BHP, ppoż. i ochrony środowiska."),
    ...spacer(1),

    // ── Obowiązki Zamawiającego ───────────────────────────────────────────────
    sectionHeading("§ 8. Obowiązki Zamawiającego"),
    listItem(1, "Zapewnienie Wykonawcy dostępu do placu budowy i niezbędnych mediów."),
    listItem(2, "Terminowe akceptowanie raportów kosztów i regulowanie faktur."),
    listItem(3, "Podejmowanie decyzji dotyczących zakresu robót i budżetu w terminach określonych w umowie."),
    listItem(4, "Dostarczenie dokumentacji projektowej w uzgodnionym terminie."),
    ...spacer(1),

    // ── Kary umowne ──────────────────────────────────────────────────────────
    sectionHeading("§ 9. Kary umowne"),
    para(`1. Wykonawca zapłaci Zamawiającemu karę umowną w wysokości ${field("np. 0,1")}% przekroczonej kwoty dziennie w przypadku przekroczenia limitu budżetowego bez uprzedniej pisemnej zgody Zamawiającego.`),
    para(`2. Zamawiający zapłaci Wykonawcy odsetki ustawowe za opóźnienie w transakcjach handlowych za każdy dzień opóźnienia w zapłacie faktury po upływie terminu płatności.`),
    ...spacer(1),

    // ── Gwarancja ─────────────────────────────────────────────────────────────
    sectionHeading("§ 10. Gwarancja i rękojmia"),
    para(`1. Wykonawca udziela gwarancji na wykonane roboty na okres ${field("np. 24")} miesięcy od daty podpisania protokołu odbioru końcowego.`),
    para("2. Wady i usterki zgłoszone w ramach gwarancji będą usuwane w terminie uzgodnionym przez Strony, nie dłuższym niż 14 dni roboczych od zgłoszenia."),
    para(`3. Rękojmia za wady fizyczne robót wynosi ${field("np. 2 lata")} zgodnie z przepisami Kodeksu cywilnego.`),
    ...spacer(1),

    // ── Postanowienia końcowe ─────────────────────────────────────────────────
    sectionHeading("§ 11. Postanowienia końcowe"),
    para("1. Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności."),
    para("2. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego i ustawy Prawo budowlane."),
    para("3. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron."),
    para("4. Spory rozstrzygać będzie sąd właściwy dla siedziby Wykonawcy."),
    ...spacer(2),

    sectionHeading("Podpisy"),
    para(`Niniejszą umowę podpisano dnia ${contractDate} w ${contractPlace}.`, { before: 120, after: 240 }),
    signatureBlock(),
    ...spacer(2),
    disclaimer(),
  ];
}

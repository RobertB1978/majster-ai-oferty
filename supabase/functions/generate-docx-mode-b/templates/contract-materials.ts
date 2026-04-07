/**
 * contract-materials.ts — Umowa z klauzulą materiałową
 * template_key: contract_materials_standard
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

export function buildContractMaterials(ctx?: DocxContext): Array<Paragraph | Table> {
  const c  = ctx?.contractor;
  const cl = ctx?.client;
  const p  = ctx?.project;
  const f  = ctx?.finance;
  const d  = ctx?.dates;

  const contractorName  = c?.name           ?? field("pełna nazwa / imię i nazwisko Wykonawcy");
  const contractorAddr  = c?.address        ?? field("adres siedziby Wykonawcy");
  const contractorNip   = c?.nip            ?? field("NIP Wykonawcy");
  const contractorRep   = c?.representedBy  ?? field("imię i nazwisko reprezentanta");

  const clientName      = cl?.name          ?? field("pełna nazwa / imię i nazwisko Zamawiającego");
  const clientAddr      = cl?.address       ?? field("adres Zamawiającego");
  const clientNip       = cl?.nip           ?? field("NIP Zamawiającego (jeśli dotyczy)");

  const projectName     = p?.name           ?? field("nazwa / opis przedmiotu umowy");
  const projectAddr     = p?.address        ?? field("adres realizacji");

  const amountNet       = f?.totalAmountNet   ?? field("kwota netto za robociznę");
  const amountGross     = f?.totalAmountGross ?? field("kwota brutto za robociznę");
  const vatRate         = f?.vatRate          ?? field("stawka VAT");

  const contractDate    = d?.contractDate   ?? field("data zawarcia umowy");
  const contractPlace   = d?.contractPlace  ?? field("miejscowość");
  const startDate       = d?.startDate      ?? field("data rozpoczęcia robót");
  const endDate         = d?.endDate        ?? field("termin zakończenia robót");

  return [
    disclaimer(),
    ...spacer(1),
    docTitle("UMOWA O ROBOTY BUDOWLANE"),
    docSubtitle("Z klauzulą materiałową — podział dostaw materiałów • Wzór Standardowy • Majster.AI"),
    para(`Zawarta w ${contractPlace}, dnia ${contractDate}, pomiędzy:`, { align: "center" as any }),
    ...spacer(1),

    // ── Strony umowy ──────────────────────────────────────────────────────────
    sectionHeading("§ 1. Strony umowy"),
    para("ZAMAWIAJĄCY:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", clientName],
      ["Adres:", clientAddr],
      ["NIP:", clientNip],
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
    para(`1. Wykonawca zobowiązuje się do wykonania następujących robót: ${projectName}, pod adresem: ${projectAddr}.`),
    para("2. Szczegółowy zakres prac określa Specyfikacja Techniczna stanowiąca Załącznik nr 1 do niniejszej umowy."),
    ...spacer(1),

    // ── Klauzula materiałowa ──────────────────────────────────────────────────
    sectionHeading("§ 3. Klauzula materiałowa — podział odpowiedzialności za dostawy"),
    para("1. Strony ustalają następujący podział odpowiedzialności za dostarczenie materiałów budowlanych niezbędnych do realizacji przedmiotu umowy:", { before: 80, after: 120 }),
    dataTable(
      ["Lp.", "Rodzaj materiału / grupy materiałów", "Dostarcza", "Uwagi"],
      [
        ["1", field("np. Cement, wapno, piasek, kruszywo"), field("Wykonawca / Zamawiający"), ""],
        ["2", field("np. Bloczki betonowe, cegła ceramiczna"), field("Wykonawca / Zamawiający"), ""],
        ["3", field("np. Instalacja elektryczna — przewody, puszki"), field("Wykonawca / Zamawiający"), ""],
        ["4", field("np. Ceramika łazienkowa, armatura"), field("Zamawiający"), field("Zamawiający dostarcza na plac budowy")],
        ["5", field("np. Okna i drzwi"), field("Zamawiający"), field("Termin dostawy: ...")],
        ["...", "...", "...", "..."],
      ],
      [400, 3200, 1800, 2000],
    ),
    ...spacer(1),
    para("2. Materiały dostarczane przez Zamawiającego muszą być dostarczone na plac budowy w terminie uzgodnionym z Wykonawcą, nie później niż na 3 dni robocze przed planowanym terminem ich wbudowania."),
    para("3. Opóźnienie dostawy materiałów przez Zamawiającego może stanowić podstawę do przedłużenia terminu realizacji robót o czas odpowiadający opóźnieniu (z pisemnym potwierdzeniem obu Stron)."),
    para("4. Wykonawca jest zobowiązany do sprawdzenia jakości i ilości materiałów dostarczonych przez Zamawiającego przed przystąpieniem do ich wbudowania. Stwierdzone braki lub wady Wykonawca niezwłocznie zgłasza Zamawiającemu na piśmie."),
    para("5. Wbudowanie przez Wykonawcę materiałów wadliwych dostarczonych przez Zamawiającego, o których wadliwości Wykonawca wiedział lub przy dołożeniu należytej staranności mógł się dowiedzieć, następuje na ryzyko Wykonawcy."),
    para("6. Wykonawca jest odpowiedzialny za prawidłowe przechowywanie materiałów budowlanych przekazanych mu przez Zamawiającego do czasu ich wbudowania."),
    ...spacer(1),

    // ── Protokół zdawczo-odbiorczy materiałów ─────────────────────────────────
    sectionHeading("§ 4. Protokół zdawczo-odbiorczy materiałów"),
    para("1. Każde przekazanie materiałów przez Zamawiającego Wykonawcy wymaga sporządzenia protokołu zdawczo-odbiorczego, podpisanego przez upoważnione osoby obu Stron."),
    para("2. Protokół zdawczo-odbiorczy zawiera co najmniej:"),
    bulletItem("datę i miejsce przekazania,"),
    bulletItem("wykaz i ilości przekazywanych materiałów,"),
    bulletItem("potwierdzenie stanu technicznego materiałów,"),
    bulletItem("podpisy obu Stron."),
    para("3. Od chwili podpisania protokołu zdawczo-odbiorczego Wykonawca przejmuje odpowiedzialność za powierzone materiały."),
    ...spacer(1),

    // ── Wynagrodzenie ─────────────────────────────────────────────────────────
    sectionHeading("§ 5. Wynagrodzenie za robociznę i koszty Wykonawcy"),
    paraRuns([
      { text: "1. Za wykonanie przedmiotu umowy (bez kosztów materiałów dostarczanych przez Zamawiającego) strony ustalają wynagrodzenie: " },
      { text: amountNet, bold: true },
      { text: " netto / " },
      { text: amountGross, bold: true },
      { text: ` brutto (VAT ${vatRate}).` },
    ]),
    para("2. Wynagrodzenie obejmuje koszty robocizny, sprzętu, transportu, organizacji placu budowy, wywozu odpadów z robót oraz kosztów ogólnych Wykonawcy."),
    para("3. W przypadku gdyby Wykonawca dostarczał materiały wymienione w Tabeli § 3, ich wartość zostanie ujęta w osobnej pozycji faktury na podstawie faktur zakupowych z doliczeniem uzgodnionej przez Strony marży materiałowej w wysokości " + field("np. 5") + "%." ),
    para("4. Wszelkie zmiany wynagrodzenia wymagają pisemnego aneksu do niniejszej umowy."),
    ...spacer(1),

    // ── Warunki płatności ─────────────────────────────────────────────────────
    sectionHeading("§ 6. Warunki płatności"),
    para(`1. Wynagrodzenie płatne jest na podstawie faktury VAT wystawionej po podpisaniu protokołu odbioru.`),
    para(`2. Termin płatności: ${field("np. 14")} dni od daty doręczenia faktury Zamawiającemu.`),
    para(`3. Rachunek bankowy Wykonawcy: ${field("numer rachunku")}.`),
    para("4. Opóźnienie w zapłacie uprawnia Wykonawcę do naliczania odsetek ustawowych za opóźnienie w transakcjach handlowych."),
    ...spacer(1),

    // ── Termin realizacji ─────────────────────────────────────────────────────
    sectionHeading("§ 7. Termin realizacji"),
    para(`1. Termin rozpoczęcia robót: ${startDate}.`),
    para(`2. Termin zakończenia robót: ${endDate}.`),
    para("3. Termin może ulec przesunięciu wyłącznie w przypadkach określonych w § 3 ust. 3 niniejszej umowy lub działania siły wyższej."),
    ...spacer(1),

    // ── Gwarancja i rękojmia ──────────────────────────────────────────────────
    sectionHeading("§ 8. Gwarancja i rękojmia"),
    para(`1. Wykonawca udziela gwarancji na wykonane roboty (robociznę) na okres ${field("np. 24")} miesięcy od daty odbioru końcowego.`),
    para("2. Gwarancja nie obejmuje wad wynikających z błędów w materiałach dostarczonych przez Zamawiającego, o ile Wykonawca zgłosił zastrzeżenia przed ich wbudowaniem."),
    para(`3. Rękojmia za wady robót wynosi ${field("np. 2 lata")} na zasadach ogólnych Kodeksu cywilnego.`),
    ...spacer(1),

    // ── Postanowienia końcowe ─────────────────────────────────────────────────
    sectionHeading("§ 9. Postanowienia końcowe"),
    para("1. Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności."),
    para("2. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego."),
    para("3. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron."),
    para("4. Integralną część umowy stanowią Załącznik nr 1 (Specyfikacja Techniczna) oraz Załącznik nr 2 (Protokoły zdawczo-odbiorcze materiałów)."),
    ...spacer(2),

    sectionHeading("Podpisy"),
    para(`Niniejszą umowę podpisano dnia ${contractDate} w ${contractPlace}.`, { before: 120, after: 240 }),
    signatureBlock(),
    ...spacer(2),
    disclaimer(),
  ];
}

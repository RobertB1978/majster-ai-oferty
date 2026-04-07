/**
 * contract-advance.ts — Umowa z zaliczką i etapami
 * template_key: contract_advance_stages_premium
 * quality_tier: premium
 * PR-05a (Mode B Base Contracts)
 */

import { Paragraph, Table } from "npm:docx@8.5.0";
import {
  docTitle, docSubtitle, sectionHeading, para, paraRuns,
  listItem, bulletItem, field, spacer, keyValueTable,
  dataTable, signatureBlock, disclaimer,
} from "../docx-builder.ts";
import type { DocxContext } from "../types.ts";

export function buildContractAdvance(ctx?: DocxContext): Array<Paragraph | Table> {
  const c  = ctx?.contractor;
  const cl = ctx?.client;
  const p  = ctx?.project;
  const f  = ctx?.finance;
  const d  = ctx?.dates;

  const contractorName  = c?.name           ?? field("pełna nazwa / imię i nazwisko Wykonawcy");
  const contractorAddr  = c?.address        ?? field("adres siedziby Wykonawcy");
  const contractorNip   = c?.nip            ?? field("NIP Wykonawcy");
  const contractorRep   = c?.representedBy  ?? field("imię i nazwisko reprezentanta");
  const contractorEmail = c?.email          ?? field("e-mail Wykonawcy");

  const clientName      = cl?.name          ?? field("pełna nazwa / imię i nazwisko Zamawiającego");
  const clientAddr      = cl?.address       ?? field("adres Zamawiającego");
  const clientNip       = cl?.nip           ?? field("NIP Zamawiającego (jeśli dotyczy)");
  const clientEmail     = cl?.email         ?? field("e-mail Zamawiającego");

  const projectName     = p?.name           ?? field("nazwa / opis inwestycji");
  const projectAddr     = p?.address        ?? field("adres realizacji");
  const projectDesc     = p?.description    ?? field("szczegółowy opis zakresu prac");

  const amountNet       = f?.totalAmountNet      ?? field("całkowita kwota netto");
  const amountGross     = f?.totalAmountGross    ?? field("całkowita kwota brutto");
  const vatRate         = f?.vatRate             ?? field("stawka VAT");
  const advancePct      = f?.advancePercent      ?? field("% zaliczki, np. 20");
  const advanceGross    = f?.advanceAmountGross  ?? field("kwota zaliczki brutto");

  const contractDate    = d?.contractDate   ?? field("data zawarcia umowy");
  const contractPlace   = d?.contractPlace  ?? field("miejscowość");
  const startDate       = d?.startDate      ?? field("data rozpoczęcia robót");
  const endDate         = d?.endDate        ?? field("termin zakończenia całości robót");

  return [
    disclaimer(),
    ...spacer(1),
    docTitle("UMOWA O ROBOTY BUDOWLANE"),
    docSubtitle("Z zaliczką i rozliczeniem etapowym • Wzór Premium • Majster.AI"),
    para(`Zawarta w ${contractPlace}, dnia ${contractDate}, pomiędzy:`, { align: "center" as any }),
    ...spacer(1),

    // ── Strony umowy ──────────────────────────────────────────────────────────
    sectionHeading("§ 1. Strony umowy"),
    para("ZAMAWIAJĄCY:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", clientName],
      ["Adres:", clientAddr],
      ["NIP:", clientNip],
      ["E-mail:", clientEmail],
    ]),
    ...spacer(1),
    para("WYKONAWCA:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", contractorName],
      ["Adres:", contractorAddr],
      ["NIP:", contractorNip],
      ["Reprezentowany przez:", contractorRep],
      ["E-mail:", contractorEmail],
    ]),
    ...spacer(1),

    // ── Przedmiot umowy ───────────────────────────────────────────────────────
    sectionHeading("§ 2. Przedmiot umowy"),
    para(`1. Przedmiotem umowy jest realizacja inwestycji: ${projectName} pod adresem: ${projectAddr}.`),
    para(`2. Szczegółowy zakres robót: ${projectDesc}`),
    para("3. Szczegółowy zakres robót każdego etapu oraz wymagania jakościowe określa dokumentacja projektowa (Załącznik nr 1) i opis techniczny etapów (Załącznik nr 2)."),
    ...spacer(1),

    // ── Etapy realizacji i harmonogram ────────────────────────────────────────
    sectionHeading("§ 3. Etapy realizacji i harmonogram płatności"),
    para("1. Realizacja przedmiotu umowy podzielona jest na następujące etapy:", { after: 120 }),
    dataTable(
      ["Etap", "Opis zakresu robót", "Planowany termin zakończenia", "Wynagrodzenie brutto", "Udział %"],
      [
        ["1", field("np. Roboty ziemne i fundamenty"), field("data"), field("kwota brutto"), field("np. 20%")],
        ["2", field("np. Stan surowy zamknięty"), field("data"), field("kwota brutto"), field("np. 35%")],
        ["3", field("np. Instalacje i tynki"), field("data"), field("kwota brutto"), field("np. 25%")],
        ["4", field("np. Prace wykończeniowe i odbiór"), field("data"), field("kwota brutto"), field("np. 20%")],
        ["ŁĄCZNIE", "", `${startDate} – ${endDate}`, amountGross, "100%"],
      ],
      [600, 2800, 1700, 1800, 900],
    ),
    ...spacer(1),
    para("2. Harmonogram szczegółowy stanowi Załącznik nr 2 do niniejszej umowy i jest wiążący dla obu Stron."),
    para("3. Opóźnienie jednego etapu może skutkować przesunięciem terminów kolejnych etapów wyłącznie za pisemną zgodą Zamawiającego."),
    ...spacer(1),

    // ── Zaliczka ──────────────────────────────────────────────────────────────
    sectionHeading("§ 4. Zaliczka"),
    paraRuns([
      { text: `1. Zamawiający zobowiązuje się do wpłaty zaliczki w wysokości ${advancePct}% wynagrodzenia całkowitego brutto, tj. ` },
      { text: advanceGross, bold: true },
      { text: " brutto (słownie: " + field("kwota zaliczki słownie") + ")." },
    ]),
    para(`2. Zaliczka płatna jest w terminie ${field("np. 7")} dni od daty zawarcia umowy, na rachunek bankowy Wykonawcy: ${field("numer rachunku bankowego")}.`),
    para("3. Zaliczka przeznaczona jest na zakup materiałów i organizację placu budowy dla Etapu 1. Wykonawca zobowiązuje się do przedstawienia Zamawiającemu rozliczenia zaliczki (faktur zakupowych) w terminie 30 dni od jej wpłynięcia."),
    para("4. Zaliczka zostanie zaliczona na poczet płatności za Etap 1 lub rozłożona proporcjonalnie na wszystkie etapy — według wyboru Zamawiającego wskazanego przy zawieraniu umowy."),
    para("5. W przypadku nierozpoczęcia robót przez Wykonawcę w terminie określonym w § 2 z przyczyn leżących po stronie Wykonawcy, Zamawiający ma prawo żądać zwrotu zaliczki w terminie 14 dni."),
    ...spacer(1),

    // ── Wynagrodzenie całkowite ───────────────────────────────────────────────
    sectionHeading("§ 5. Wynagrodzenie całkowite"),
    paraRuns([
      { text: "1. Całkowite wynagrodzenie ryczałtowe za wykonanie przedmiotu umowy wynosi: " },
      { text: amountNet, bold: true },
      { text: " netto / " },
      { text: amountGross, bold: true },
      { text: ` brutto (słownie: ${field("kwota słownie")}), przy stawce VAT ${vatRate}.` },
    ]),
    para("2. Wynagrodzenie jest ryczałtowe — Wykonawca nie może żądać jego zwiększenia, chyba że zakres robót zostanie zmieniony aneksem do umowy."),
    ...spacer(1),

    // ── Warunki płatności etapowych ───────────────────────────────────────────
    sectionHeading("§ 6. Warunki płatności etapowych"),
    para("1. Płatność za każdy etap następuje na podstawie faktury VAT wystawionej przez Wykonawcę po podpisaniu protokołu odbioru częściowego danego etapu bez zastrzeżeń lub z zastrzeżeniami wszystkimi wyeliminowanymi."),
    para("2. Warunkiem wystawienia faktury za dany etap jest:"),
    bulletItem("zakończenie całości robót objętych etapem zgodnie z harmonogramem,"),
    bulletItem("podpisanie przez obie Strony protokołu odbioru częściowego etapu,"),
    bulletItem("dostarczenie atestów i certyfikatów materiałów wbudowanych w danym etapie."),
    para(`3. Termin płatności faktury etapowej: ${field("np. 14")} dni od daty jej doręczenia Zamawiającemu.`),
    para(`4. Rachunek bankowy Wykonawcy: ${field("numer rachunku bankowego")}.`),
    para("5. Ostatnia płatność (za Etap końcowy) nastąpi dopiero po podpisaniu protokołu odbioru końcowego całości robót bez zastrzeżeń lub po usunięciu wszystkich wad stwierdzonych przy odbiorze końcowym."),
    para(`6. Zamawiający zastrzega sobie prawo do zatrzymania ${field("np. 5")}% wartości ostatniej faktury jako kaucję gwarancyjną, zwracaną po upływie ${field("np. 12")} miesięcy okresu gwarancji, pod warunkiem braku wad w tym czasie.`),
    ...spacer(1),

    // ── Odbiory etapowe ───────────────────────────────────────────────────────
    sectionHeading("§ 7. Odbiory częściowe i odbiór końcowy"),
    para(`1. Wykonawca zgłasza gotowość do odbioru etapu pisemnie (e-mail lub pismo) na adres: ${clientEmail} co najmniej ${field("np. 3")} dni roboczych przed proponowaną datą odbioru.`),
    para("2. Zamawiający przystępuje do odbioru etapu w terminie 5 dni roboczych od daty zgłoszenia."),
    para("3. Z czynności każdego odbioru sporządza się protokół odbioru częściowego zawierający:"),
    bulletItem("opis zakresu odebranych robót,"),
    bulletItem("wynik oceny jakości robót,"),
    bulletItem("ewentualne wady z terminami ich usunięcia,"),
    bulletItem("podpisy obu Stron."),
    para("4. Odbiór końcowy następuje po zakończeniu wszystkich etapów. Zasady odbioru końcowego odpowiadają zasadom odbioru etapowego."),
    para("5. Odmowa odbioru jest możliwa wyłącznie w przypadku wad istotnych uniemożliwiających użytkowanie obiektu."),
    ...spacer(1),

    // ── Kary umowne ──────────────────────────────────────────────────────────
    sectionHeading("§ 8. Kary umowne"),
    para("1. Wykonawca zapłaci Zamawiającemu kary umowne:"),
    listItem("a", `za opóźnienie w zakończeniu etapu: ${field("np. 0,1")}% wynagrodzenia brutto za dany etap za każdy dzień opóźnienia, nie więcej niż ${field("np. 10")}% wynagrodzenia za etap,`),
    listItem("b", `za opóźnienie w usunięciu wad z protokołu odbioru: ${field("np. 0,05")}% wynagrodzenia brutto za etap za każdy dzień opóźnienia.`),
    para("2. Zamawiający zapłaci Wykonawcy odsetki ustawowe za opóźnienie w transakcjach handlowych za każdy dzień opóźnienia w płatności faktury."),
    para("3. Strony zastrzegają prawo do dochodzenia odszkodowania uzupełniającego na zasadach ogólnych."),
    ...spacer(1),

    // ── Gwarancja i rękojmia ──────────────────────────────────────────────────
    sectionHeading("§ 9. Gwarancja i rękojmia"),
    para(`1. Wykonawca udziela gwarancji na wykonane roboty na okres ${field("np. 36")} miesięcy od daty podpisania protokołu odbioru końcowego.`),
    para("2. Okres gwarancji dla poszczególnych etapów rozpoczyna bieg od daty podpisania protokołu odbioru końcowego całości robót."),
    para("3. Usterki w ramach gwarancji usuwane będą w terminie nie dłuższym niż 14 dni roboczych od zgłoszenia."),
    para(`4. Rękojmia za wady fizyczne robót wynosi ${field("np. 5 lat")} zgodnie z Kodeksem cywilnym.`),
    ...spacer(1),

    // ── Postanowienia końcowe ─────────────────────────────────────────────────
    sectionHeading("§ 10. Postanowienia końcowe"),
    para("1. Wszelkie zmiany umowy wymagają formy pisemnej pod rygorem nieważności."),
    para("2. W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego i Prawa budowlanego."),
    para("3. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron."),
    para("4. Integralną część umowy stanowią: Załącznik nr 1 (dokumentacja projektowa), Załącznik nr 2 (harmonogram etapów)."),
    ...spacer(2),

    sectionHeading("Podpisy"),
    para(`Niniejszą umowę podpisano dnia ${contractDate} w ${contractPlace}.`, { before: 120, after: 240 }),
    signatureBlock(),
    ...spacer(2),
    disclaimer(),
  ];
}

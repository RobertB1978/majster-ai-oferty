/**
 * contract-simple.ts — Zlecenie / mini-umowa
 * template_key: contract_simple_short
 * quality_tier: short_form
 * PR-05a (Mode B Base Contracts)
 */

import { Paragraph, Table } from "npm:docx@8.5.0";
import {
  docTitle, docSubtitle, sectionHeading, para, paraRuns,
  listItem, bulletItem, field, spacer, keyValueTable,
  signatureBlock, disclaimer,
} from "../docx-builder.ts";
// dataTable nie jest używane w tym szablonie (short_form nie zawiera tabel kosztorysowych)
import type { DocxContext } from "../types.ts";

export function buildContractSimple(ctx?: DocxContext): Array<Paragraph | Table> {
  const c  = ctx?.contractor;
  const cl = ctx?.client;
  const p  = ctx?.project;
  const f  = ctx?.finance;
  const d  = ctx?.dates;

  const contractorName  = c?.name    ?? field("imię i nazwisko / nazwa firmy Wykonawcy");
  const contractorAddr  = c?.address ?? field("adres Wykonawcy");
  const contractorNip   = c?.nip     ?? field("NIP Wykonawcy");
  const contractorPhone = c?.phone   ?? field("telefon Wykonawcy");

  const clientName      = cl?.name    ?? field("imię i nazwisko / nazwa Zamawiającego");
  const clientAddr      = cl?.address ?? field("adres Zamawiającego");
  const clientPhone     = cl?.phone   ?? field("telefon Zamawiającego");

  const projectDesc     = p?.description ?? field("szczegółowy opis zakresu zleconych prac");
  const projectAddr     = p?.address     ?? field("adres wykonania prac");

  const amountGross     = f?.totalAmountGross ?? field("kwota wynagrodzenia brutto");
  const vatRate         = f?.vatRate          ?? field("stawka VAT lub 'bez VAT'");

  const contractDate    = d?.contractDate  ?? field("data zawarcia zlecenia");
  const contractPlace   = d?.contractPlace ?? field("miejscowość");
  const endDate         = d?.endDate       ?? field("termin wykonania prac");

  return [
    disclaimer(),
    ...spacer(1),
    docTitle("ZLECENIE / MINI-UMOWA"),
    docSubtitle("Wariant uproszczony dla drobnych prac budowlanych i remontowych • Majster.AI"),
    para(`Sporządzone w ${contractPlace}, dnia ${contractDate}.`, { align: "center" as any }),
    ...spacer(1),

    // ── Strony ────────────────────────────────────────────────────────────────
    sectionHeading("§ 1. Strony"),
    para("ZAMAWIAJĄCY:", { bold: true }),
    keyValueTable([
      ["Imię i nazwisko / nazwa:", clientName],
      ["Adres:", clientAddr],
      ["Telefon:", clientPhone],
    ]),
    ...spacer(1),
    para("WYKONAWCA:", { bold: true }),
    keyValueTable([
      ["Imię i nazwisko / nazwa:", contractorName],
      ["Adres:", contractorAddr],
      ["NIP:", contractorNip],
      ["Telefon:", contractorPhone],
    ]),
    ...spacer(1),

    // ── Zakres prac ───────────────────────────────────────────────────────────
    sectionHeading("§ 2. Zakres zleconych prac"),
    para(`Zamawiający zleca, a Wykonawca przyjmuje do wykonania następujące prace: ${projectDesc}`),
    para(`Adres wykonania prac: ${projectAddr}`),
    para("Wykonawca oświadcza, że posiada kwalifikacje i doświadczenie niezbędne do wykonania zleconych prac."),
    ...spacer(1),

    // ── Termin ────────────────────────────────────────────────────────────────
    sectionHeading("§ 3. Termin wykonania"),
    para(`Wykonawca zobowiązuje się do zakończenia i przekazania gotowych prac do odbioru przez Zamawiającego w terminie: ${endDate}.`),
    para("Termin może ulec zmianie wyłącznie za pisemną (e-mailową) zgodą obu Stron."),
    ...spacer(1),

    // ── Wynagrodzenie ─────────────────────────────────────────────────────────
    sectionHeading("§ 4. Wynagrodzenie"),
    paraRuns([
      { text: "Zamawiający zapłaci Wykonawcy wynagrodzenie w wysokości: " },
      { text: amountGross, bold: true },
      { text: ` brutto (słownie: ${field("kwota słownie")}), przy stawce VAT: ${vatRate}.` },
    ]),
    para("Wynagrodzenie obejmuje koszty robocizny, materiałów i transportu, chyba że Strony postanowiły inaczej w odrębnym uzgodnieniu."),
    ...spacer(1),

    // ── Płatność ──────────────────────────────────────────────────────────────
    sectionHeading("§ 5. Warunki płatności"),
    para(`Wynagrodzenie płatne jest ${field("np. gotówką przy odbiorze / przelewem w terminie 7 dni od odbioru")} na podstawie faktury VAT lub rachunku.`),
    para(`Rachunek bankowy Wykonawcy (jeśli przelew): ${field("numer rachunku bankowego")}.`),
    para("Opóźnienie w zapłacie uprawnia Wykonawcę do naliczania odsetek ustawowych."),
    ...spacer(1),

    // ── Materiały ─────────────────────────────────────────────────────────────
    sectionHeading("§ 6. Materiały"),
    para(`Materiały niezbędne do wykonania prac dostarcza: ${field("Wykonawca / Zamawiający / obie Strony wg uzgodnienia")}.`),
    para("Wykonawca jest odpowiedzialny za użycie materiałów dobrej jakości, odpowiadających wymaganiom technicznym dla danego rodzaju prac."),
    ...spacer(1),

    // ── Odbiór prac ───────────────────────────────────────────────────────────
    sectionHeading("§ 7. Odbiór prac"),
    para("Po zakończeniu prac Strony dokonają odbioru. Z odbioru może zostać sporządzony krótki protokół odbioru potwierdzony podpisami obu Stron."),
    para("Ewentualne usterki stwierdzone przy odbiorze Wykonawca usunie w terminie uzgodnionym przez Strony."),
    ...spacer(1),

    // ── Gwarancja ─────────────────────────────────────────────────────────────
    sectionHeading("§ 8. Gwarancja"),
    para(`Wykonawca udziela gwarancji na wykonane prace na okres ${field("np. 12")} miesięcy od daty odbioru. Wady zgłoszone w ramach gwarancji będą usunięte w terminie uzgodnionym przez Strony.`),
    ...spacer(1),

    // ── Postanowienia końcowe ─────────────────────────────────────────────────
    sectionHeading("§ 9. Postanowienia końcowe"),
    listItem(1, "Wszelkie zmiany niniejszego zlecenia wymagają pisemnej (e-mailowej) zgody obu Stron."),
    listItem(2, "W sprawach nieuregulowanych stosuje się przepisy Kodeksu cywilnego."),
    listItem(3, "Zlecenie sporządzono w dwóch egzemplarzach, po jednym dla każdej ze Stron."),
    ...spacer(2),

    sectionHeading("Podpisy"),
    para(`Niniejsze zlecenie podpisano dnia ${contractDate} w ${contractPlace}.`, { before: 120, after: 240 }),
    signatureBlock(),
    ...spacer(2),
    disclaimer(),
  ];
}

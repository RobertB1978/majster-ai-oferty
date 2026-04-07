/**
 * contract-fixed-price.ts — Umowa o roboty budowlane — ryczałt
 * template_key: contract_fixed_price_premium
 * quality_tier: premium
 * PR-05a (Mode B Base Contracts)
 */

import { Paragraph, Table } from "npm:docx@8.5.0";
import {
  docTitle, docSubtitle, sectionHeading, para, paraRuns,
  listItem, bulletItem, field, spacer, keyValueTable,
  signatureBlock, disclaimer,
} from "../docx-builder.ts";
import type { DocxContext } from "../types.ts";

export function buildContractFixedPrice(ctx?: DocxContext): Array<Paragraph | Table> {
  const c = ctx?.contractor;
  const cl = ctx?.client;
  const p = ctx?.project;
  const f = ctx?.finance;
  const d = ctx?.dates;

  const contractorName    = c?.name           ?? field("pełna nazwa / imię i nazwisko Wykonawcy");
  const contractorAddr    = c?.address        ?? field("adres siedziby Wykonawcy");
  const contractorNip     = c?.nip            ?? field("NIP Wykonawcy");
  const contractorRegon   = c?.regon          ?? field("REGON Wykonawcy");
  const contractorRep     = c?.representedBy  ?? field("imię i nazwisko osoby reprezentującej");
  const contractorEmail   = c?.email          ?? field("e-mail Wykonawcy");
  const contractorPhone   = c?.phone          ?? field("telefon Wykonawcy");

  const clientName        = cl?.name          ?? field("pełna nazwa / imię i nazwisko Zamawiającego");
  const clientAddr        = cl?.address       ?? field("adres zamieszkania / siedziby Zamawiającego");
  const clientNip         = cl?.nip           ?? field("NIP Zamawiającego (jeśli dotyczy)");
  const clientRep         = cl?.representedBy ?? field("imię i nazwisko osoby reprezentującej, jeśli dotyczy");
  const clientEmail       = cl?.email         ?? field("e-mail Zamawiającego");
  const clientPhone       = cl?.phone         ?? field("telefon Zamawiającego");

  const projectName       = p?.name           ?? field("nazwa / opis projektu");
  const projectAddr       = p?.address        ?? field("adres budowy / lokalizacja inwestycji");
  const projectDesc       = p?.description    ?? field("szczegółowy opis zakresu robót");

  const amountNet         = f?.totalAmountNet   ?? field("kwota netto");
  const amountGross       = f?.totalAmountGross ?? field("kwota brutto");
  const vatRate           = f?.vatRate          ?? field("stawka VAT, np. 8%");

  const contractDate      = d?.contractDate     ?? field("data zawarcia umowy, np. 15 maja 2026 r.");
  const contractPlace     = d?.contractPlace    ?? field("miejscowość");
  const startDate         = d?.startDate        ?? field("data rozpoczęcia robót");
  const endDate           = d?.endDate          ?? field("termin zakończenia robót");

  return [
    disclaimer(),
    ...spacer(1),
    docTitle("UMOWA O ROBOTY BUDOWLANE"),
    docSubtitle("Wynagrodzenie ryczałtowe • Wzór Premium • Majster.AI"),
    para(`Zawarta w ${contractPlace}, dnia ${contractDate},`, { align: "center" as any }),
    para("pomiędzy:", { align: "center" as any }),
    ...spacer(1),

    // ── Strony umowy ────────────────────────────────────────────────────────
    sectionHeading("§ 1. Strony umowy"),
    para("ZAMAWIAJĄCY:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", clientName],
      ["Adres:", clientAddr],
      ["NIP:", clientNip],
      ["Reprezentowany przez:", clientRep],
      ["Telefon:", clientPhone],
      ["E-mail:", clientEmail],
    ]),
    ...spacer(1),
    para("WYKONAWCA:", { bold: true }),
    keyValueTable([
      ["Nazwa / imię i nazwisko:", contractorName],
      ["Adres:", contractorAddr],
      ["NIP:", contractorNip],
      ["REGON:", contractorRegon],
      ["Reprezentowany przez:", contractorRep],
      ["Telefon:", contractorPhone],
      ["E-mail:", contractorEmail],
    ]),
    ...spacer(1),

    // ── Przedmiot ────────────────────────────────────────────────────────────
    sectionHeading("§ 2. Przedmiot umowy"),
    para(`1. Zamawiający zleca, a Wykonawca przyjmuje do wykonania roboty budowlane pod nazwą: ${projectName}, realizowane pod adresem: ${projectAddr}.`),
    para(`2. Szczegółowy zakres robót: ${projectDesc}`),
    para("3. Zakres robót oraz sposób ich wykonania określa dokumentacja techniczna stanowiąca Załącznik nr 1 do niniejszej umowy (jeśli dotyczy)."),
    para("4. Wykonawca oświadcza, że zapoznał się z placem budowy, dokumentacją projektową oraz warunkami realizacji robót i nie wnosi zastrzeżeń co do wykonalności i kompletności przekazanej dokumentacji."),
    para("5. Wszelkie zmiany zakresu robót wymagają pisemnego aneksu do niniejszej umowy, podpisanego przez obie Strony."),
    ...spacer(1),

    // ── Termin ───────────────────────────────────────────────────────────────
    sectionHeading("§ 3. Termin realizacji"),
    para(`1. Wykonawca zobowiązuje się do przystąpienia do robót w dniu: ${startDate}.`),
    para(`2. Termin zakończenia robót i przekazania obiektu Zamawiającemu do odbioru końcowego ustala się na: ${endDate}.`),
    para("3. Termin może ulec zmianie wyłącznie w przypadkach:"),
    bulletItem("działania siły wyższej (klęski żywiołowe, epidemie, katastrofy),"),
    bulletItem("opóźnień w dostarczeniu przez Zamawiającego dokumentacji lub materiałów leżących po jego stronie,"),
    bulletItem("warunków atmosferycznych uniemożliwiających prowadzenie robót przez co najmniej 7 dni roboczych z rzędu,"),
    bulletItem("innych okoliczności niezależnych od Wykonawcy, potwierdzonych pisemnie przez obie Strony."),
    para("4. Zmiana terminu wymaga sporządzenia pisemnego aneksu do umowy. Samo zgłoszenie okoliczności przez Wykonawcę nie jest równoznaczne z przedłużeniem terminu."),
    ...spacer(1),

    // ── Wynagrodzenie ─────────────────────────────────────────────────────────
    sectionHeading("§ 4. Wynagrodzenie ryczałtowe"),
    paraRuns([
      { text: "1. Za wykonanie całości przedmiotu umowy Strony ustalają wynagrodzenie ryczałtowe w kwocie: " },
      { text: amountNet, bold: true },
      { text: " netto, tj. " },
      { text: amountGross, bold: true },
      { text: ` brutto (słownie brutto: ${field("kwota słownie")}), przy stawce VAT ${vatRate}.` },
    ]),
    para("2. Wynagrodzenie ma charakter ryczałtowy. Wykonawca nie może żądać jego podwyższenia nawet w przypadku wzrostu kosztów robocizny, materiałów lub sprzętu, chyba że Strony postanowią inaczej w formie pisemnego aneksu."),
    para("3. Wynagrodzenie obejmuje wszelkie koszty niezbędne do prawidłowego wykonania przedmiotu umowy, w tym koszty materiałów, robocizny, sprzętu, organizacji placu budowy, wywiezienia odpadów budowlanych oraz kosztów ogólnych Wykonawcy, chyba że w § 7 ust. 2 postanowiono inaczej."),
    para("4. Zmiany zakresu robót mogą skutkować zmianą wynagrodzenia wyłącznie na podstawie pisemnego aneksu, po uprzednim sporządzeniu kosztorysu różnicowego zaakceptowanego przez Zamawiającego."),
    ...spacer(1),

    // ── Warunki płatności ─────────────────────────────────────────────────────
    sectionHeading("§ 5. Warunki płatności"),
    para("1. Wynagrodzenie płatne jest na podstawie faktury VAT wystawionej przez Wykonawcę po podpisaniu protokołu odbioru końcowego przez obie Strony bez zastrzeżeń lub z zastrzeżeniami wszystkich wad usuniętymi."),
    para(`2. Termin płatności faktury: ${field("liczba dni, np. 14")} dni od daty doręczenia faktury Zamawiającemu.`),
    para(`3. Płatność realizowana jest przelewem na rachunek bankowy Wykonawcy: ${field("numer rachunku bankowego")}.`),
    para(`4. Strony mogą ustalić zaliczkę w wysokości ${field("np. 20")}% wynagrodzenia brutto, płatną przed rozpoczęciem robót. Zaliczka zostanie zaliczona na poczet końcowego wynagrodzenia.`),
    para("5. Za dzień zapłaty uznaje się dzień uznania rachunku bankowego Wykonawcy. Opóźnienie w płatności uprawnia Wykonawcę do naliczania odsetek ustawowych za opóźnienie w transakcjach handlowych."),
    ...spacer(1),

    // ── Obowiązki Wykonawcy ───────────────────────────────────────────────────
    sectionHeading("§ 6. Obowiązki Wykonawcy"),
    para("Wykonawca zobowiązuje się w szczególności do:"),
    listItem(1, "wykonania przedmiotu umowy zgodnie z dokumentacją projektową, zasadami wiedzy technicznej, obowiązującymi normami i przepisami prawa budowlanego,"),
    listItem(2, "użycia materiałów i wyrobów budowlanych odpowiadających wymaganiom Polskich Norm i posiadających wymagane atesty, certyfikaty lub deklaracje właściwości użytkowych,"),
    listItem(3, "zatrudnienia wykwalifikowanych pracowników posiadających wymagane uprawnienia, w tym kierownika budowy z odpowiednimi uprawnieniami budowlanymi (jeśli wymagany),"),
    listItem(4, "prowadzenia dziennika budowy i dokumentacji fotograficznej postępu robót (jeśli dotyczy),"),
    listItem(5, "przestrzegania przepisów BHP, ppoż. oraz ochrony środowiska na placu budowy,"),
    listItem(6, "utrzymania porządku na placu budowy i w jego otoczeniu przez cały czas trwania robót,"),
    listItem(7, "ubezpieczenia budowy od odpowiedzialności cywilnej w trakcie realizacji robót (jeśli dotyczy),"),
    listItem(8, "niezwłocznego informowania Zamawiającego o wszelkich przeszkodach w realizacji robót, w tym o wadach dokumentacji lub warunkach terenowych odbiegających od przewidywanych,"),
    listItem(9, "przekazania Zamawiającemu dokumentacji powykonawczej, atestów i deklaracji użytkowych materiałów oraz protokołów prób i badań,"),
    listItem(10, "usunięcia wad i usterek ujawnionych przy odbiorze w terminie uzgodnionym przez Strony."),
    ...spacer(1),

    // ── Obowiązki Zamawiającego ───────────────────────────────────────────────
    sectionHeading("§ 7. Obowiązki Zamawiającego"),
    para("Zamawiający zobowiązuje się w szczególności do:"),
    listItem(1, "przekazania placu budowy Wykonawcy w umówionym terminie,"),
    listItem(2, `dostarczenia Wykonawcy dokumentacji projektowej i pozwoleń budowlanych niezbędnych do realizacji robót do dnia: ${field("data")} (jeśli dotyczy),`),
    listItem(3, "zapewnienia dostępu do mediów (energia elektryczna, woda) niezbędnych do prowadzenia robót na warunkach uzgodnionych z Wykonawcą,"),
    listItem(4, "dokonania odbioru robót i zapłaty wynagrodzenia w terminach określonych w umowie,"),
    listItem(5, "współdziałania z Wykonawcą w sprawach związanych z realizacją robót i niezwłocznego odpowiadania na wnioski i zapytania Wykonawcy."),
    ...spacer(1),

    // ── Materiały i sprzęt ────────────────────────────────────────────────────
    sectionHeading("§ 8. Materiały i sprzęt"),
    para("1. Materiały budowlane niezbędne do wykonania robót dostarcza Wykonawca — o ile strony nie postanowiły inaczej w Załączniku nr 2 (Podział dostaw materiałów)."),
    para("2. Wykonawca zobowiązuje się do stosowania materiałów i wyrobów zgodnych ze specyfikacją wskazaną w dokumentacji projektowej lub uzgodnioną z Zamawiającym."),
    para("3. Zamawiający ma prawo weryfikacji certyfikatów i atestów materiałów przed ich wbudowaniem."),
    para("4. Wykonawca jest odpowiedzialny za przechowywanie materiałów w sposób zapewniający ich jakość i zapobiegający kradzieży."),
    ...spacer(1),

    // ── Odbiory robót ─────────────────────────────────────────────────────────
    sectionHeading("§ 9. Odbiory robót"),
    para("1. Strony przewidują następujące etapy odbiorów:"),
    bulletItem("odbiory robót zanikających i ulegających zakryciu — przed zasypaniem lub zakryciem,"),
    bulletItem("odbiory częściowe — po zakończeniu poszczególnych etapów robót (jeśli dotyczy),"),
    bulletItem("odbiór końcowy — po zakończeniu całości robót."),
    para(`2. Wykonawca zgłasza gotowość do odbioru pisemnie (e-mail lub pismo) z wyprzedzeniem co najmniej ${field("np. 3")} dni roboczych.`),
    para("3. Zamawiający zobowiązuje się do przystąpienia do odbioru w terminie nieprzekraczającym 7 dni roboczych od daty zgłoszenia gotowości."),
    para("4. Z czynności odbioru sporządza się protokół odbioru podpisany przez obie Strony. Protokół zawiera listę ewentualnych wad z terminem ich usunięcia."),
    para("5. Odmowa odbioru jest możliwa wyłącznie w przypadku stwierdzenia wad istotnych uniemożliwiających użytkowanie obiektu zgodnie z jego przeznaczeniem."),
    ...spacer(1),

    // ── Kary umowne ──────────────────────────────────────────────────────────
    sectionHeading("§ 10. Kary umowne"),
    para("1. Wykonawca zapłaci Zamawiającemu kary umowne w następujących przypadkach:"),
    listItem("a", `opóźnienia w zakończeniu robót — ${field("np. 0,1")}% wynagrodzenia brutto za każdy dzień opóźnienia, nie więcej jednak niż ${field("np. 10")}% wynagrodzenia brutto,`),
    listItem("b", `opóźnienia w usunięciu wad stwierdzonych w protokole odbioru — ${field("np. 0,05")}% wynagrodzenia brutto za każdy dzień opóźnienia.`),
    para("2. Zamawiający zapłaci Wykonawcy kary umowne w następujących przypadkach:"),
    listItem("a", `opóźnienia w przekazaniu placu budowy — ${field("np. 0,05")}% wynagrodzenia brutto za każdy dzień opóźnienia,`),
    listItem("b", `opóźnienia w zapłacie faktury — odsetki ustawowe za opóźnienie w transakcjach handlowych.`),
    para("3. Łączna suma kar umownych należnych od jednej Strony nie może przekroczyć 20% wynagrodzenia brutto."),
    para("4. Strony zastrzegają sobie prawo do dochodzenia odszkodowania uzupełniającego na zasadach ogólnych Kodeksu cywilnego, o ile rzeczywista szkoda przekroczy wartość zastrzeżonych kar."),
    ...spacer(1),

    // ── Gwarancja i rękojmia ──────────────────────────────────────────────────
    sectionHeading("§ 11. Gwarancja i rękojmia"),
    para(`1. Wykonawca udziela Zamawiającemu gwarancji na wykonane roboty budowlane na okres ${field("np. 36")} miesięcy, licząc od daty podpisania protokołu odbioru końcowego.`),
    para("2. W ramach gwarancji Wykonawca zobowiązuje się do usunięcia wad i usterek zgłoszonych przez Zamawiającego w terminie uzgodnionym przez Strony, nie dłuższym jednak niż 14 dni roboczych od daty zgłoszenia, chyba że charakter wady wymaga dłuższego czasu naprawy."),
    para("3. Wykonawca może wyrazić zgodę na zastąpienie obowiązków gwarancyjnych przez inny podmiot — wyłącznie za pisemną zgodą Zamawiającego."),
    para(`4. Rękojmia za wady fizyczne robót budowlanych wynosi ${field("np. 5 lat")} zgodnie z art. 568 § 1 Kodeksu cywilnego w zw. z art. 638 k.c.`),
    para("5. Zamawiający ma prawo wstrzymania ostatecznej płatności lub zatrzymania zabezpieczenia do czasu usunięcia wad stwierdzonych przy odbiorze."),
    ...spacer(1),

    // ── Ubezpieczenie ─────────────────────────────────────────────────────────
    sectionHeading("§ 12. Ubezpieczenie"),
    para(`1. Wykonawca zobowiązuje się posiadać przez cały czas trwania robót ważne ubezpieczenie odpowiedzialności cywilnej z sumą ubezpieczenia nie niższą niż ${field("np. 200 000,00")} zł.`),
    para("2. Wykonawca przedstawi Zamawiającemu kopię polisy ubezpieczeniowej przed przystąpieniem do robót."),
    para("3. Strony wyłączają odpowiedzialność Wykonawcy za szkody wyrządzone przez podwykonawców niezaakceptowanych przez Zamawiającego."),
    ...spacer(1),

    // ── Zmiana umowy ──────────────────────────────────────────────────────────
    sectionHeading("§ 13. Zmiany umowy"),
    para("1. Wszelkie zmiany niniejszej umowy wymagają formy pisemnej pod rygorem nieważności."),
    para("2. Zmiany zakresu robót możliwe są wyłącznie na podstawie pisemnego aneksu, sporządzonego przed przystąpieniem do dodatkowych lub zamiennych robót."),
    para("3. Wykonawca nie jest uprawniony do wykonywania robót dodatkowych ani zamiennych bez uprzedniej pisemnej zgody Zamawiającego."),
    ...spacer(1),

    // ── Rozwiązanie umowy ─────────────────────────────────────────────────────
    sectionHeading("§ 14. Rozwiązanie umowy"),
    para("1. Każda ze Stron może rozwiązać umowę ze skutkiem natychmiastowym w przypadku rażącego naruszenia jej postanowień przez drugą Stronę, po uprzednim bezskutecznym wezwaniu do zaprzestania naruszenia w terminie 14 dni."),
    para("2. Zamawiający może odstąpić od umowy, jeśli Wykonawca:"),
    bulletItem("opóźnia się z realizacją robót o więcej niż 30 dni w stosunku do zatwierdzonego harmonogramu,"),
    bulletItem("przerwał realizację robót na okres dłuższy niż 14 dni bez uzasadnionej przyczyny,"),
    bulletItem("wykonuje roboty w sposób niezgodny z dokumentacją i nie reaguje na wezwania Zamawiającego."),
    para("3. W przypadku odstąpienia od umowy Strony sporządzają protokół inwentaryzacji zaawansowania robót, a Wykonawca otrzymuje wynagrodzenie za faktycznie wykonane i odebrane prace."),
    para("4. Ewentualne spory wynikłe z realizacji niniejszej umowy Strony zobowiązują się rozwiązywać polubownie, a w przypadku braku porozumienia — poddają je pod rozstrzygnięcie właściwego sądu powszechnego."),
    ...spacer(1),

    // ── Postanowienia końcowe ─────────────────────────────────────────────────
    sectionHeading("§ 15. Postanowienia końcowe"),
    para("1. W sprawach nieuregulowanych niniejszą umową stosuje się przepisy Kodeksu cywilnego, ustawy Prawo budowlane oraz innych powszechnie obowiązujących przepisów prawa."),
    para("2. Umowę sporządzono w dwóch jednobrzmiących egzemplarzach, po jednym dla każdej ze Stron."),
    para("3. Integralną część umowy stanowią następujące załączniki:"),
    listItem("1", "Dokumentacja projektowa lub opis techniczny zakresu robót,"),
    listItem("2", "Kosztorys ofertowy / przedmiar robót (jeśli dotyczy),"),
    listItem("3", "Harmonogram rzeczowo-finansowy (jeśli dotyczy),"),
    listItem("4", "Podział dostaw materiałów (jeśli dotyczy)."),
    ...spacer(2),

    // ── Podpisy ───────────────────────────────────────────────────────────────
    sectionHeading("Podpisy"),
    para(`Niniejszą umowę podpisano dnia ${contractDate} w ${contractPlace}.`, { before: 120, after: 240 }),
    signatureBlock(),
    ...spacer(2),
    disclaimer(),
  ];
}

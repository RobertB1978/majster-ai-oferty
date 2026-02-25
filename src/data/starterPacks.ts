/**
 * Starter packs for the trade catalog.
 * Generic trade-typical item names with placeholder default prices.
 * Prices are editable by the user at any time.
 *
 * NOT copied from any licensed price catalog (KNR etc.).
 * All names and prices are generic industry-common descriptions.
 */

export interface StarterPackItem {
  name: string;
  unit: string;
  qty: number;
  price: number;
  category: 'Materiał' | 'Robocizna';
}

export interface StarterPack {
  id: string;
  tradeName: string;
  description: string;
  items: StarterPackItem[];
}

export const starterPacks: StarterPack[] = [
  // ─── 1. GLAZURNIK (Tiler) ────────────────────────────────────────────────
  {
    id: 'glazurnik',
    tradeName: 'Glazurnik',
    description: 'Układanie płytek ceramicznych i gresowych',
    items: [
      { name: 'Płytki podłogowe gresowe 60×60', unit: 'm²', qty: 10, price: 89, category: 'Materiał' },
      { name: 'Płytki ścienne ceramiczne 30×60', unit: 'm²', qty: 10, price: 65, category: 'Materiał' },
      { name: 'Klej do płytek elastyczny C2TE', unit: 'worek', qty: 5, price: 45, category: 'Materiał' },
      { name: 'Klej do płytek wielkoformatowych S1', unit: 'worek', qty: 3, price: 65, category: 'Materiał' },
      { name: 'Fuga cementowa standard', unit: 'kg', qty: 10, price: 12, category: 'Materiał' },
      { name: 'Fuga epoksydowa wodoodporna', unit: 'kg', qty: 3, price: 35, category: 'Materiał' },
      { name: 'Silikon sanitarny bezbarwny', unit: 'szt.', qty: 3, price: 25, category: 'Materiał' },
      { name: 'Taśma uszczelniająca narożna', unit: 'mb', qty: 5, price: 8, category: 'Materiał' },
      { name: 'Krzyżyki dystansowe 2 mm', unit: 'op.', qty: 2, price: 8, category: 'Materiał' },
      { name: 'Środek do impregnacji fugi', unit: 'l', qty: 1, price: 35, category: 'Materiał' },
      { name: 'Układanie płytek podłogowych', unit: 'm²', qty: 10, price: 120, category: 'Robocizna' },
      { name: 'Układanie płytek ściennych', unit: 'm²', qty: 10, price: 130, category: 'Robocizna' },
      { name: 'Demontaż starych płytek', unit: 'm²', qty: 10, price: 35, category: 'Robocizna' },
      { name: 'Wyrównanie podłoża pod płytki', unit: 'm²', qty: 10, price: 45, category: 'Robocizna' },
      { name: 'Fugowanie i wykończenie', unit: 'm²', qty: 10, price: 30, category: 'Robocizna' },
      { name: 'Uszczelnienie narożników i ościeży', unit: 'mb', qty: 5, price: 25, category: 'Robocizna' },
    ],
  },

  // ─── 2. MALARZ (Painter) ─────────────────────────────────────────────────
  {
    id: 'malarz',
    tradeName: 'Malarz',
    description: 'Malowanie ścian i sufitów wewnątrz',
    items: [
      { name: 'Farba lateksowa zmywalna biała', unit: 'l', qty: 20, price: 45, category: 'Materiał' },
      { name: 'Farba akrylowa do ścian', unit: 'l', qty: 15, price: 35, category: 'Materiał' },
      { name: 'Farba do sufitu biała', unit: 'l', qty: 10, price: 40, category: 'Materiał' },
      { name: 'Grunt głęboko penetrujący', unit: 'l', qty: 10, price: 25, category: 'Materiał' },
      { name: 'Gładź polimerowa szpachlowa', unit: 'kg', qty: 25, price: 2.2, category: 'Materiał' },
      { name: 'Siatka zbrojąca do gładzi', unit: 'm²', qty: 10, price: 4, category: 'Materiał' },
      { name: 'Taśma malarska papierowa 48 mm', unit: 'szt.', qty: 3, price: 12, category: 'Materiał' },
      { name: 'Folia malarska ochronna', unit: 'm²', qty: 20, price: 2, category: 'Materiał' },
      { name: 'Papier ścierny różne granulacje', unit: 'szt.', qty: 10, price: 5, category: 'Materiał' },
      { name: 'Malowanie ścian (2× + grunt)', unit: 'm²', qty: 40, price: 25, category: 'Robocizna' },
      { name: 'Malowanie sufitu (2× + grunt)', unit: 'm²', qty: 15, price: 30, category: 'Robocizna' },
      { name: 'Nakładanie gładzi gipsowej', unit: 'm²', qty: 40, price: 40, category: 'Robocizna' },
      { name: 'Szlifowanie gładzi', unit: 'm²', qty: 40, price: 15, category: 'Robocizna' },
      { name: 'Tapetowanie ścian', unit: 'm²', qty: 20, price: 45, category: 'Robocizna' },
      { name: 'Przygotowanie i ochrona powierzchni', unit: 'm²', qty: 40, price: 10, category: 'Robocizna' },
      { name: 'Malowanie farbą zmywalną (2×)', unit: 'm²', qty: 20, price: 35, category: 'Robocizna' },
    ],
  },

  // ─── 3. HYDRAULIK (Plumber) ──────────────────────────────────────────────
  {
    id: 'hydraulik',
    tradeName: 'Hydraulik',
    description: 'Instalacja wod-kan i montaż urządzeń sanitarnych',
    items: [
      { name: 'Umywalka podwieszana ceramiczna', unit: 'szt.', qty: 1, price: 350, category: 'Materiał' },
      { name: 'Bateria umywalkowa jednouchwytowa', unit: 'szt.', qty: 1, price: 350, category: 'Materiał' },
      { name: 'Miska WC podwieszana', unit: 'szt.', qty: 1, price: 850, category: 'Materiał' },
      { name: 'Stelaż podtynkowy do WC', unit: 'szt.', qty: 1, price: 550, category: 'Materiał' },
      { name: 'Deska sedesowa wolnoopadająca', unit: 'szt.', qty: 1, price: 150, category: 'Materiał' },
      { name: 'Kabina prysznicowa 90×90 szkło', unit: 'kpl.', qty: 1, price: 1200, category: 'Materiał' },
      { name: 'Brodzik akrylowy 90×90', unit: 'szt.', qty: 1, price: 350, category: 'Materiał' },
      { name: 'Bateria prysznicowa termostatyczna', unit: 'szt.', qty: 1, price: 650, category: 'Materiał' },
      { name: 'Rura instalacyjna PEX 16 mm', unit: 'mb', qty: 20, price: 8, category: 'Materiał' },
      { name: 'Rura kanalizacyjna PVC 110 mm', unit: 'mb', qty: 6, price: 25, category: 'Materiał' },
      { name: 'Montaż umywalki z podłączeniem', unit: 'szt.', qty: 1, price: 180, category: 'Robocizna' },
      { name: 'Montaż WC podwieszanego ze stelażem', unit: 'kpl.', qty: 1, price: 550, category: 'Robocizna' },
      { name: 'Montaż kabiny prysznicowej z brodzkiem', unit: 'kpl.', qty: 1, price: 450, category: 'Robocizna' },
      { name: 'Punkt wod-kan (zasilanie + odpływ)', unit: 'szt.', qty: 3, price: 250, category: 'Robocizna' },
      { name: 'Prowadzenie rur pod zabudowę', unit: 'mb', qty: 15, price: 45, category: 'Robocizna' },
      { name: 'Montaż zaworu odcinającego', unit: 'szt.', qty: 4, price: 80, category: 'Robocizna' },
    ],
  },

  // ─── 4. ELEKTRYK (Electrician) ───────────────────────────────────────────
  {
    id: 'elektryk',
    tradeName: 'Elektryk',
    description: 'Instalacja elektryczna wewnętrzna',
    items: [
      { name: 'Przewód YDYp 3×2,5 mm²', unit: 'mb', qty: 50, price: 8, category: 'Materiał' },
      { name: 'Przewód YDYp 3×1,5 mm²', unit: 'mb', qty: 30, price: 5, category: 'Materiał' },
      { name: 'Gniazdko podtynkowe pojedyncze', unit: 'szt.', qty: 10, price: 25, category: 'Materiał' },
      { name: 'Gniazdko podtynkowe podwójne', unit: 'szt.', qty: 6, price: 35, category: 'Materiał' },
      { name: 'Włącznik podtynkowy pojedynczy', unit: 'szt.', qty: 6, price: 20, category: 'Materiał' },
      { name: 'Włącznik schodowy', unit: 'szt.', qty: 2, price: 28, category: 'Materiał' },
      { name: 'Wyłącznik nadprądowy B16', unit: 'szt.', qty: 6, price: 25, category: 'Materiał' },
      { name: 'Wyłącznik różnicowoprądowy 30 mA', unit: 'szt.', qty: 2, price: 180, category: 'Materiał' },
      { name: 'Rozdzielnica podtynkowa 12 modułów', unit: 'szt.', qty: 1, price: 120, category: 'Materiał' },
      { name: 'Oprawa sufitowa LED panel 30 W', unit: 'szt.', qty: 4, price: 120, category: 'Materiał' },
      { name: 'Puszka podtynkowa 60 mm', unit: 'szt.', qty: 15, price: 5, category: 'Materiał' },
      { name: 'Punkt gniazdkowy (z przewodem)', unit: 'szt.', qty: 10, price: 100, category: 'Robocizna' },
      { name: 'Punkt oświetleniowy (z przewodem)', unit: 'szt.', qty: 6, price: 120, category: 'Robocizna' },
      { name: 'Montaż i podłączenie rozdzielnicy', unit: 'szt.', qty: 1, price: 350, category: 'Robocizna' },
      { name: 'Pomiary elektryczne i protokół', unit: 'kpl.', qty: 1, price: 250, category: 'Robocizna' },
      { name: 'Kucie bruzd pod instalację', unit: 'mb', qty: 30, price: 15, category: 'Robocizna' },
    ],
  },

  // ─── 5. PODŁOGARZ (Flooring specialist) ─────────────────────────────────
  {
    id: 'podlogarz',
    tradeName: 'Podłogarz',
    description: 'Układanie podłóg drewnianych, paneli i wykładzin',
    items: [
      { name: 'Panele laminowane 8 mm AC4', unit: 'm²', qty: 20, price: 55, category: 'Materiał' },
      { name: 'Panele winylowe SPC 5 mm', unit: 'm²', qty: 20, price: 95, category: 'Materiał' },
      { name: 'Podkład akustyczny XPS 3 mm', unit: 'm²', qty: 22, price: 8, category: 'Materiał' },
      { name: 'Folia paroizolacyjna PE', unit: 'm²', qty: 22, price: 2, category: 'Materiał' },
      { name: 'Listwy przypodłogowe MDF 60 mm', unit: 'mb', qty: 20, price: 12, category: 'Materiał' },
      { name: 'Narożnik do listew przypodłogowych', unit: 'szt.', qty: 8, price: 5, category: 'Materiał' },
      { name: 'Deska trójwarstwowa dębowa', unit: 'm²', qty: 15, price: 180, category: 'Materiał' },
      { name: 'Klej do desek parkietowych', unit: 'l', qty: 5, price: 35, category: 'Materiał' },
      { name: 'Lakier poliuretanowy do parkietu', unit: 'l', qty: 5, price: 120, category: 'Materiał' },
      { name: 'Masa samopoziomująca', unit: 'kg', qty: 25, price: 12, category: 'Materiał' },
      { name: 'Układanie paneli (z podkładem)', unit: 'm²', qty: 20, price: 35, category: 'Robocizna' },
      { name: 'Układanie desek klejonych', unit: 'm²', qty: 15, price: 55, category: 'Robocizna' },
      { name: 'Cyklinowanie i lakierowanie parkietu', unit: 'm²', qty: 15, price: 75, category: 'Robocizna' },
      { name: 'Wylewka samopoziomująca', unit: 'm²', qty: 20, price: 40, category: 'Robocizna' },
      { name: 'Montaż listew przypodłogowych', unit: 'mb', qty: 20, price: 8, category: 'Robocizna' },
      { name: 'Demontaż starej podłogi', unit: 'm²', qty: 20, price: 20, category: 'Robocizna' },
    ],
  },

  // ─── 6. SUCHA ZABUDOWA (Drywall) ─────────────────────────────────────────
  {
    id: 'sucha-zabudowa',
    tradeName: 'Sucha zabudowa',
    description: 'Sufity podwieszane i ścianki działowe GK',
    items: [
      { name: 'Płyta GK standard 12,5 mm', unit: 'szt.', qty: 10, price: 38, category: 'Materiał' },
      { name: 'Płyta GK wodoodporna zielona 12,5 mm', unit: 'szt.', qty: 5, price: 55, category: 'Materiał' },
      { name: 'Profil CD 60 mm nośny', unit: 'mb', qty: 30, price: 8, category: 'Materiał' },
      { name: 'Profil UD 30 mm obwodowy', unit: 'mb', qty: 15, price: 6, category: 'Materiał' },
      { name: 'Profil CW 75 mm do ścianek', unit: 'mb', qty: 20, price: 12, category: 'Materiał' },
      { name: 'Profil UW 75 mm poziomy', unit: 'mb', qty: 10, price: 10, category: 'Materiał' },
      { name: 'Wełna mineralna akustyczna 50 mm', unit: 'm²', qty: 15, price: 18, category: 'Materiał' },
      { name: 'Zawiesia do konstrukcji sufitu', unit: 'szt.', qty: 20, price: 3, category: 'Materiał' },
      { name: 'Wkręty do GK 3,5×35', unit: 'op.', qty: 2, price: 15, category: 'Materiał' },
      { name: 'Masa szpachlowa do spoin', unit: 'l', qty: 5, price: 25, category: 'Materiał' },
      { name: 'Taśma papierowa do spoin', unit: 'mb', qty: 20, price: 3, category: 'Materiał' },
      { name: 'Sufit podwieszany na konstrukcji GK', unit: 'm²', qty: 15, price: 85, category: 'Robocizna' },
      { name: 'Ścianka działowa 1× GK (obie strony)', unit: 'm²', qty: 15, price: 75, category: 'Robocizna' },
      { name: 'Ścianka działowa 2× GK z izolacją', unit: 'm²', qty: 10, price: 95, category: 'Robocizna' },
      { name: 'Obudowa rur/szachtu z GK', unit: 'mb', qty: 5, price: 120, category: 'Robocizna' },
      { name: 'Szpachlowanie i szlifowanie spoin', unit: 'm²', qty: 20, price: 30, category: 'Robocizna' },
    ],
  },

  // ─── 7. DEKARZ (Roofer) ──────────────────────────────────────────────────
  {
    id: 'dekarz',
    tradeName: 'Dekarz',
    description: 'Pokrycia dachowe i odwodnienie dachu',
    items: [
      { name: 'Blachodachówka powlekana', unit: 'm²', qty: 50, price: 55, category: 'Materiał' },
      { name: 'Dachówka betonowa', unit: 'm²', qty: 50, price: 65, category: 'Materiał' },
      { name: 'Membrana dachowa paroprzepuszczalna', unit: 'm²', qty: 55, price: 12, category: 'Materiał' },
      { name: 'Łata dachowa sosnowa 4×5 cm', unit: 'mb', qty: 100, price: 6, category: 'Materiał' },
      { name: 'Kontrłata sosnowa 2,5×5 cm', unit: 'mb', qty: 60, price: 4, category: 'Materiał' },
      { name: 'Rynna PVC 125 mm z hakami', unit: 'mb', qty: 20, price: 35, category: 'Materiał' },
      { name: 'Rura spustowa PVC 90 mm', unit: 'mb', qty: 12, price: 28, category: 'Materiał' },
      { name: 'Kolektor rynny narożnik', unit: 'szt.', qty: 4, price: 25, category: 'Materiał' },
      { name: 'Taśma kalenicowa samoprzylepna', unit: 'mb', qty: 15, price: 15, category: 'Materiał' },
      { name: 'Gwoździe ocynkowane do łat', unit: 'kg', qty: 3, price: 12, category: 'Materiał' },
      { name: 'Pokrycie blachodachówką', unit: 'm²', qty: 50, price: 65, category: 'Robocizna' },
      { name: 'Pokrycie dachówką betonową', unit: 'm²', qty: 50, price: 90, category: 'Robocizna' },
      { name: 'Montaż membrany i łat dachowych', unit: 'm²', qty: 55, price: 40, category: 'Robocizna' },
      { name: 'Montaż rynien i rur spustowych', unit: 'mb', qty: 20, price: 45, category: 'Robocizna' },
      { name: 'Obróbki blacharskie dachu', unit: 'mb', qty: 15, price: 80, category: 'Robocizna' },
      { name: 'Impregnacja więźby dachowej', unit: 'm²', qty: 60, price: 25, category: 'Robocizna' },
    ],
  },

  // ─── 8. ELEWACJA (Facade & Insulation) ──────────────────────────────────
  {
    id: 'elewacja',
    tradeName: 'Elewacja i ocieplenie',
    description: 'Ocieplenie budynku metodą BSO i tynki elewacyjne',
    items: [
      { name: 'Styropian fasadowy EPS 100 10 cm', unit: 'm²', qty: 50, price: 35, category: 'Materiał' },
      { name: 'Styropian fasadowy EPS 100 15 cm', unit: 'm²', qty: 50, price: 52, category: 'Materiał' },
      { name: 'Klej klejąco-szpachlowy do styropianu', unit: 'worek', qty: 15, price: 35, category: 'Materiał' },
      { name: 'Siatka zbrojąca z włókna szklanego 160 g', unit: 'm²', qty: 55, price: 8, category: 'Materiał' },
      { name: 'Kołek talerzowy do styropianu', unit: 'szt.', qty: 300, price: 1.5, category: 'Materiał' },
      { name: 'Profil startowy cokołowy', unit: 'mb', qty: 20, price: 12, category: 'Materiał' },
      { name: 'Tynk silikonowy baranek', unit: 'm²', qty: 50, price: 25, category: 'Materiał' },
      { name: 'Farba silikonowa elewacyjna', unit: 'l', qty: 20, price: 45, category: 'Materiał' },
      { name: 'Grunt pod tynk elewacyjny', unit: 'l', qty: 15, price: 18, category: 'Materiał' },
      { name: 'Narożnik PVC ze siatką', unit: 'mb', qty: 20, price: 6, category: 'Materiał' },
      { name: 'Przyklejenie i kołkowanie styropianu', unit: 'm²', qty: 50, price: 45, category: 'Robocizna' },
      { name: 'Nakładanie warstwy zbrojnej z siatką', unit: 'm²', qty: 50, price: 35, category: 'Robocizna' },
      { name: 'Wykonanie tynku dekoracyjnego', unit: 'm²', qty: 50, price: 35, category: 'Robocizna' },
      { name: 'Malowanie elewacji (2×)', unit: 'm²', qty: 50, price: 25, category: 'Robocizna' },
      { name: 'Obróbki narożników i ościeży', unit: 'mb', qty: 20, price: 30, category: 'Robocizna' },
      { name: 'Wynajem rusztowania (miesięcznie)', unit: 'm²', qty: 50, price: 15, category: 'Robocizna' },
    ],
  },

  // ─── 9. STOLARZ / MONTAŻYSTA (Carpenter & Installer) ────────────────────
  {
    id: 'stolarz',
    tradeName: 'Stolarz / Montażysta',
    description: 'Montaż okien, drzwi i stolarki budowlanej',
    items: [
      { name: 'Drzwi wewnętrzne z ościeżnicą 80 cm', unit: 'kpl.', qty: 3, price: 650, category: 'Materiał' },
      { name: 'Drzwi zewnętrzne antywłamaniowe', unit: 'szt.', qty: 1, price: 2200, category: 'Materiał' },
      { name: 'Okno PCV 120×150 cm dwuszybowe', unit: 'szt.', qty: 4, price: 850, category: 'Materiał' },
      { name: 'Okno dachowe z kołnierzem 78×118', unit: 'kpl.', qty: 1, price: 1500, category: 'Materiał' },
      { name: 'Parapet wewnętrzny konglomerat', unit: 'mb', qty: 8, price: 85, category: 'Materiał' },
      { name: 'Parapet zewnętrzny aluminiowy', unit: 'mb', qty: 8, price: 65, category: 'Materiał' },
      { name: 'Pianka montażowa poliuretanowa', unit: 'szt.', qty: 5, price: 25, category: 'Materiał' },
      { name: 'Uszczelka okienna EPDM', unit: 'mb', qty: 20, price: 5, category: 'Materiał' },
      { name: 'Klamka do drzwi z rozetą', unit: 'kpl.', qty: 3, price: 85, category: 'Materiał' },
      { name: 'Zawias do drzwi stalowy 3D', unit: 'szt.', qty: 9, price: 15, category: 'Materiał' },
      { name: 'Montaż drzwi wewnętrznych', unit: 'szt.', qty: 3, price: 180, category: 'Robocizna' },
      { name: 'Montaż drzwi zewnętrznych', unit: 'szt.', qty: 1, price: 350, category: 'Robocizna' },
      { name: 'Montaż okna PCV', unit: 'szt.', qty: 4, price: 250, category: 'Robocizna' },
      { name: 'Montaż okna dachowego', unit: 'kpl.', qty: 1, price: 500, category: 'Robocizna' },
      { name: 'Montaż parapetów wewnętrznych i zewnętrznych', unit: 'mb', qty: 8, price: 55, category: 'Robocizna' },
      { name: 'Demontaż starej stolarki', unit: 'szt.', qty: 4, price: 80, category: 'Robocizna' },
    ],
  },

  // ─── 10. MURARZ (Mason) ──────────────────────────────────────────────────
  {
    id: 'murarz',
    tradeName: 'Murarz',
    description: 'Murowanie ścian, tynkowanie i betonowanie',
    items: [
      { name: 'Pustak ceramiczny 25 cm', unit: 'szt.', qty: 100, price: 8, category: 'Materiał' },
      { name: 'Bloczek betonu komórkowego 24 cm', unit: 'szt.', qty: 80, price: 7, category: 'Materiał' },
      { name: 'Zaprawa murarska tradycyjna', unit: 'worek', qty: 10, price: 18, category: 'Materiał' },
      { name: 'Klej do betonu komórkowego cienkowarstwowy', unit: 'worek', qty: 8, price: 28, category: 'Materiał' },
      { name: 'Zaprawa tynkarska standardowa', unit: 'worek', qty: 15, price: 22, category: 'Materiał' },
      { name: 'Siatka zbrojąca do tynków', unit: 'm²', qty: 20, price: 6, category: 'Materiał' },
      { name: 'Kołek rozporowy z wkrętem 10×80', unit: 'szt.', qty: 50, price: 0.8, category: 'Materiał' },
      { name: 'Profil aluminiowy tynkarski 3 m', unit: 'mb', qty: 20, price: 8, category: 'Materiał' },
      { name: 'Beton C20/25 gotowy', unit: 'm³', qty: 2, price: 380, category: 'Materiał' },
      { name: 'Zbrojenie stalowe fi 10 mm', unit: 'mb', qty: 30, price: 12, category: 'Materiał' },
      { name: 'Murowanie ścian nośnych z pustaków', unit: 'm²', qty: 20, price: 95, category: 'Robocizna' },
      { name: 'Murowanie ścian działowych z BK', unit: 'm²', qty: 15, price: 75, category: 'Robocizna' },
      { name: 'Tynkowanie ścian jednowarstwowe', unit: 'm²', qty: 30, price: 45, category: 'Robocizna' },
      { name: 'Tynkowanie ścian dwuwarstwowe', unit: 'm²', qty: 20, price: 65, category: 'Robocizna' },
      { name: 'Betonowanie (wylewki, fundamenty)', unit: 'm³', qty: 2, price: 350, category: 'Robocizna' },
      { name: 'Kucie otworów drzwiowych / okiennych', unit: 'szt.', qty: 2, price: 350, category: 'Robocizna' },
    ],
  },
];

/** Lookup helper: find a pack by its id. */
export function getStarterPack(id: string): StarterPack | undefined {
  return starterPacks.find((p) => p.id === id);
}

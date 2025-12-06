export interface DefaultTemplate {
  name: string;
  unit: string;
  default_qty: number;
  default_price: number;
  category: 'Materiał' | 'Robocizna';
  description: string;
  trade?: string;
}

export const defaultTemplates: DefaultTemplate[] = [
  // ===================
  // GLAZURNIK / PŁYTKARZ
  // ===================
  { name: 'Płytki ceramiczne 60x60', unit: 'm²', default_qty: 1, default_price: 89, category: 'Materiał', description: 'Płytki gresowe podłogowe PEI 4', trade: 'Glazurnik' },
  { name: 'Płytki ścienne 30x60', unit: 'm²', default_qty: 1, default_price: 65, category: 'Materiał', description: 'Płytki ceramiczne satynowe', trade: 'Glazurnik' },
  { name: 'Płytki mozaika', unit: 'm²', default_qty: 1, default_price: 120, category: 'Materiał', description: 'Mozaika szklana 2x2cm', trade: 'Glazurnik' },
  { name: 'Klej do płytek elastyczny', unit: 'worek', default_qty: 1, default_price: 45, category: 'Materiał', description: 'Klej C2TE 25kg', trade: 'Glazurnik' },
  { name: 'Klej do płytek wielkoformatowych', unit: 'worek', default_qty: 1, default_price: 65, category: 'Materiał', description: 'Klej S1 25kg', trade: 'Glazurnik' },
  { name: 'Fuga epoksydowa', unit: 'kg', default_qty: 1, default_price: 35, category: 'Materiał', description: 'Fuga wodoodporna', trade: 'Glazurnik' },
  { name: 'Fuga cementowa', unit: 'kg', default_qty: 1, default_price: 12, category: 'Materiał', description: 'Fuga elastyczna 5kg', trade: 'Glazurnik' },
  { name: 'Silikon sanitarny', unit: 'szt.', default_qty: 1, default_price: 25, category: 'Materiał', description: 'Silikon do łazienek 310ml', trade: 'Glazurnik' },
  { name: 'Układanie płytek podłogowych', unit: 'm²', default_qty: 1, default_price: 120, category: 'Robocizna', description: 'Z przygotowaniem i fugowaniem', trade: 'Glazurnik' },
  { name: 'Układanie płytek ściennych', unit: 'm²', default_qty: 1, default_price: 130, category: 'Robocizna', description: 'Z przygotowaniem i fugowaniem', trade: 'Glazurnik' },
  { name: 'Układanie mozaiki', unit: 'm²', default_qty: 1, default_price: 180, category: 'Robocizna', description: 'Mozaika dekoracyjna', trade: 'Glazurnik' },
  { name: 'Demontaż starych płytek', unit: 'm²', default_qty: 1, default_price: 35, category: 'Robocizna', description: 'Z utylizacją gruzu', trade: 'Glazurnik' },

  // ===================
  // MALARZ
  // ===================
  { name: 'Farba lateksowa', unit: 'l', default_qty: 10, default_price: 45, category: 'Materiał', description: 'Farba zmywalna biała', trade: 'Malarz' },
  { name: 'Farba akrylowa', unit: 'l', default_qty: 10, default_price: 35, category: 'Materiał', description: 'Farba do ścian biała', trade: 'Malarz' },
  { name: 'Farba ceramiczna', unit: 'l', default_qty: 5, default_price: 85, category: 'Materiał', description: 'Farba do kuchni i łazienek', trade: 'Malarz' },
  { name: 'Grunt głęboko penetrujący', unit: 'l', default_qty: 5, default_price: 25, category: 'Materiał', description: 'Grunt akrylowy', trade: 'Malarz' },
  { name: 'Gładź szpachlowa', unit: 'kg', default_qty: 25, default_price: 55, category: 'Materiał', description: 'Gładź polimerowa 25kg', trade: 'Malarz' },
  { name: 'Taśma malarska', unit: 'szt.', default_qty: 1, default_price: 12, category: 'Materiał', description: 'Taśma 48mm x 50m', trade: 'Malarz' },
  { name: 'Folia malarska', unit: 'm²', default_qty: 1, default_price: 2, category: 'Materiał', description: 'Folia ochronna', trade: 'Malarz' },
  { name: 'Malowanie ścian', unit: 'm²', default_qty: 1, default_price: 25, category: 'Robocizna', description: '2x malowanie z gruntowaniem', trade: 'Malarz' },
  { name: 'Malowanie sufitu', unit: 'm²', default_qty: 1, default_price: 30, category: 'Robocizna', description: '2x malowanie z gruntowaniem', trade: 'Malarz' },
  { name: 'Gładź gipsowa ścian', unit: 'm²', default_qty: 1, default_price: 40, category: 'Robocizna', description: 'Szpachlowanie i szlifowanie', trade: 'Malarz' },
  { name: 'Tapetowanie ścian', unit: 'm²', default_qty: 1, default_price: 45, category: 'Robocizna', description: 'Z przygotowaniem podłoża', trade: 'Malarz' },

  // ===================
  // HYDRAULIK
  // ===================
  { name: 'Umywalka nablatowa', unit: 'szt.', default_qty: 1, default_price: 450, category: 'Materiał', description: 'Umywalka ceramiczna', trade: 'Hydraulik' },
  { name: 'Bateria umywalkowa', unit: 'szt.', default_qty: 1, default_price: 350, category: 'Materiał', description: 'Bateria jednouchwytowa chrom', trade: 'Hydraulik' },
  { name: 'WC kompakt', unit: 'kpl.', default_qty: 1, default_price: 650, category: 'Materiał', description: 'Miska WC + deska wolnoopadająca', trade: 'Hydraulik' },
  { name: 'WC podwieszane', unit: 'szt.', default_qty: 1, default_price: 850, category: 'Materiał', description: 'Miska WC podwieszana', trade: 'Hydraulik' },
  { name: 'Stelaż podtynkowy WC', unit: 'szt.', default_qty: 1, default_price: 550, category: 'Materiał', description: 'Stelaż do WC podwieszanego', trade: 'Hydraulik' },
  { name: 'Kabina prysznicowa 90x90', unit: 'kpl.', default_qty: 1, default_price: 1200, category: 'Materiał', description: 'Kabina kwadratowa szkło', trade: 'Hydraulik' },
  { name: 'Brodzik prysznicowy', unit: 'szt.', default_qty: 1, default_price: 350, category: 'Materiał', description: 'Brodzik akrylowy 90x90', trade: 'Hydraulik' },
  { name: 'Wanna akrylowa 170x70', unit: 'szt.', default_qty: 1, default_price: 850, category: 'Materiał', description: 'Wanna prostokątna z nogami', trade: 'Hydraulik' },
  { name: 'Bateria wannowa z prysznicem', unit: 'szt.', default_qty: 1, default_price: 450, category: 'Materiał', description: 'Bateria ścienna + prysznic', trade: 'Hydraulik' },
  { name: 'Rura PEX 16mm', unit: 'mb', default_qty: 1, default_price: 8, category: 'Materiał', description: 'Rura wielowarstwowa', trade: 'Hydraulik' },
  { name: 'Rura kanalizacyjna 110mm', unit: 'mb', default_qty: 1, default_price: 25, category: 'Materiał', description: 'Rura PVC', trade: 'Hydraulik' },
  { name: 'Bojler elektryczny 80L', unit: 'szt.', default_qty: 1, default_price: 1200, category: 'Materiał', description: 'Podgrzewacz wody', trade: 'Hydraulik' },
  { name: 'Montaż umywalki', unit: 'szt.', default_qty: 1, default_price: 180, category: 'Robocizna', description: 'Z podłączeniem', trade: 'Hydraulik' },
  { name: 'Montaż WC', unit: 'szt.', default_qty: 1, default_price: 250, category: 'Robocizna', description: 'Z podłączeniem', trade: 'Hydraulik' },
  { name: 'Montaż kabiny prysznicowej', unit: 'kpl.', default_qty: 1, default_price: 450, category: 'Robocizna', description: 'Z brodzkiem', trade: 'Hydraulik' },
  { name: 'Montaż wanny', unit: 'szt.', default_qty: 1, default_price: 350, category: 'Robocizna', description: 'Z obudową', trade: 'Hydraulik' },
  { name: 'Punkt wod-kan', unit: 'szt.', default_qty: 1, default_price: 250, category: 'Robocizna', description: 'Punkt podłączeniowy', trade: 'Hydraulik' },
  { name: 'Montaż bojlera', unit: 'szt.', default_qty: 1, default_price: 300, category: 'Robocizna', description: 'Z podłączeniem', trade: 'Hydraulik' },

  // ===================
  // ELEKTRYK
  // ===================
  { name: 'Gniazdko pojedyncze', unit: 'szt.', default_qty: 1, default_price: 25, category: 'Materiał', description: 'Gniazdko podtynkowe', trade: 'Elektryk' },
  { name: 'Gniazdko podwójne', unit: 'szt.', default_qty: 1, default_price: 35, category: 'Materiał', description: 'Gniazdko podtynkowe 2x', trade: 'Elektryk' },
  { name: 'Włącznik pojedynczy', unit: 'szt.', default_qty: 1, default_price: 20, category: 'Materiał', description: 'Włącznik światła', trade: 'Elektryk' },
  { name: 'Włącznik podwójny', unit: 'szt.', default_qty: 1, default_price: 28, category: 'Materiał', description: 'Włącznik schodowy', trade: 'Elektryk' },
  { name: 'Przewód YDYp 3x2.5', unit: 'mb', default_qty: 1, default_price: 8, category: 'Materiał', description: 'Przewód instalacyjny', trade: 'Elektryk' },
  { name: 'Przewód YDYp 3x1.5', unit: 'mb', default_qty: 1, default_price: 5, category: 'Materiał', description: 'Przewód oświetleniowy', trade: 'Elektryk' },
  { name: 'Rozdzielnica 12 modułów', unit: 'szt.', default_qty: 1, default_price: 120, category: 'Materiał', description: 'Rozdzielnica podtynkowa', trade: 'Elektryk' },
  { name: 'Wyłącznik różnicowoprądowy', unit: 'szt.', default_qty: 1, default_price: 180, category: 'Materiał', description: 'Wyłącznik 30mA', trade: 'Elektryk' },
  { name: 'Wyłącznik nadprądowy B16', unit: 'szt.', default_qty: 1, default_price: 25, category: 'Materiał', description: 'Bezpiecznik automatyczny', trade: 'Elektryk' },
  { name: 'Oprawa LED panel 60x60', unit: 'szt.', default_qty: 1, default_price: 120, category: 'Materiał', description: 'Panel LED 40W', trade: 'Elektryk' },
  { name: 'Oprawa downlight LED', unit: 'szt.', default_qty: 1, default_price: 45, category: 'Materiał', description: 'Oczko LED 7W', trade: 'Elektryk' },
  { name: 'Punkt oświetleniowy', unit: 'szt.', default_qty: 1, default_price: 120, category: 'Robocizna', description: 'Montaż z przewodami', trade: 'Elektryk' },
  { name: 'Punkt gniazdkowy', unit: 'szt.', default_qty: 1, default_price: 100, category: 'Robocizna', description: 'Montaż z przewodami', trade: 'Elektryk' },
  { name: 'Montaż rozdzielnicy', unit: 'szt.', default_qty: 1, default_price: 350, category: 'Robocizna', description: 'Z osprzętem', trade: 'Elektryk' },
  { name: 'Pomiary elektryczne', unit: 'kpl.', default_qty: 1, default_price: 250, category: 'Robocizna', description: 'Protokół pomiarowy', trade: 'Elektryk' },

  // ===================
  // PODŁOGARZ / PARKIECIARZ
  // ===================
  { name: 'Panele podłogowe AC5', unit: 'm²', default_qty: 1, default_price: 75, category: 'Materiał', description: 'Panele 10mm', trade: 'Podłogarz' },
  { name: 'Panele winylowe SPC', unit: 'm²', default_qty: 1, default_price: 95, category: 'Materiał', description: 'Panele wodoodporne', trade: 'Podłogarz' },
  { name: 'Podkład pod panele XPS', unit: 'm²', default_qty: 1, default_price: 8, category: 'Materiał', description: 'Podkład 5mm', trade: 'Podłogarz' },
  { name: 'Folia PE', unit: 'm²', default_qty: 1, default_price: 2, category: 'Materiał', description: 'Folia paroizolacyjna', trade: 'Podłogarz' },
  { name: 'Listwy przypodłogowe', unit: 'mb', default_qty: 1, default_price: 12, category: 'Materiał', description: 'Listwy MDF', trade: 'Podłogarz' },
  { name: 'Deska barlinecka', unit: 'm²', default_qty: 1, default_price: 180, category: 'Materiał', description: 'Deska trójwarstwowa dąb', trade: 'Podłogarz' },
  { name: 'Parkiet dębowy', unit: 'm²', default_qty: 1, default_price: 250, category: 'Materiał', description: 'Parkiet lity 22mm', trade: 'Podłogarz' },
  { name: 'Lakier do parkietu', unit: 'l', default_qty: 5, default_price: 120, category: 'Materiał', description: 'Lakier poliuretanowy', trade: 'Podłogarz' },
  { name: 'Montaż paneli', unit: 'm²', default_qty: 1, default_price: 35, category: 'Robocizna', description: 'Z podkładem i listwami', trade: 'Podłogarz' },
  { name: 'Montaż desek', unit: 'm²', default_qty: 1, default_price: 55, category: 'Robocizna', description: 'Klejenie lub pływające', trade: 'Podłogarz' },
  { name: 'Cyklinowanie parkietu', unit: 'm²', default_qty: 1, default_price: 45, category: 'Robocizna', description: 'Z lakierowaniem', trade: 'Podłogarz' },
  { name: 'Układanie wykładziny', unit: 'm²', default_qty: 1, default_price: 25, category: 'Robocizna', description: 'Z klejeniem', trade: 'Podłogarz' },

  // ===================
  // SUCHA ZABUDOWA / GIPS-KARTON
  // ===================
  { name: 'Płyta GK 12.5mm', unit: 'szt.', default_qty: 1, default_price: 38, category: 'Materiał', description: 'Płyta 120x260cm', trade: 'Sucha zabudowa' },
  { name: 'Płyta GK wodoodporna', unit: 'szt.', default_qty: 1, default_price: 55, category: 'Materiał', description: 'Płyta zielona 120x260cm', trade: 'Sucha zabudowa' },
  { name: 'Płyta GK ognioodporna', unit: 'szt.', default_qty: 1, default_price: 52, category: 'Materiał', description: 'Płyta różowa 120x260cm', trade: 'Sucha zabudowa' },
  { name: 'Profil CD 60', unit: 'mb', default_qty: 1, default_price: 8, category: 'Materiał', description: 'Profil nośny', trade: 'Sucha zabudowa' },
  { name: 'Profil UD 30', unit: 'mb', default_qty: 1, default_price: 6, category: 'Materiał', description: 'Profil obwodowy', trade: 'Sucha zabudowa' },
  { name: 'Profil CW 75', unit: 'mb', default_qty: 1, default_price: 12, category: 'Materiał', description: 'Profil do ścianek', trade: 'Sucha zabudowa' },
  { name: 'Profil UW 75', unit: 'mb', default_qty: 1, default_price: 10, category: 'Materiał', description: 'Profil poziomy', trade: 'Sucha zabudowa' },
  { name: 'Wełna mineralna 50mm', unit: 'm²', default_qty: 1, default_price: 18, category: 'Materiał', description: 'Izolacja akustyczna', trade: 'Sucha zabudowa' },
  { name: 'Wełna mineralna 100mm', unit: 'm²', default_qty: 1, default_price: 28, category: 'Materiał', description: 'Izolacja termiczna', trade: 'Sucha zabudowa' },
  { name: 'Sufit podwieszany', unit: 'm²', default_qty: 1, default_price: 85, category: 'Robocizna', description: 'GK na konstrukcji', trade: 'Sucha zabudowa' },
  { name: 'Ścianka działowa 1x GK', unit: 'm²', default_qty: 1, default_price: 75, category: 'Robocizna', description: 'Jedna warstwa', trade: 'Sucha zabudowa' },
  { name: 'Ścianka działowa 2x GK', unit: 'm²', default_qty: 1, default_price: 95, category: 'Robocizna', description: 'Z izolacją', trade: 'Sucha zabudowa' },
  { name: 'Obudowa rur/szachtów', unit: 'mb', default_qty: 1, default_price: 120, category: 'Robocizna', description: 'Z GK', trade: 'Sucha zabudowa' },

  // ===================
  // DEKARZ
  // ===================
  { name: 'Dachówka ceramiczna', unit: 'm²', default_qty: 1, default_price: 85, category: 'Materiał', description: 'Dachówka karpiówka', trade: 'Dekarz' },
  { name: 'Blachodachówka', unit: 'm²', default_qty: 1, default_price: 55, category: 'Materiał', description: 'Blacha powlekana', trade: 'Dekarz' },
  { name: 'Membrana dachowa', unit: 'm²', default_qty: 1, default_price: 12, category: 'Materiał', description: 'Membrana paroprzepuszczalna', trade: 'Dekarz' },
  { name: 'Łaty dachowe 4x5', unit: 'mb', default_qty: 1, default_price: 6, category: 'Materiał', description: 'Łaty sosnowe', trade: 'Dekarz' },
  { name: 'Kontrłaty 2.5x5', unit: 'mb', default_qty: 1, default_price: 4, category: 'Materiał', description: 'Kontrłaty sosnowe', trade: 'Dekarz' },
  { name: 'Rynna PVC 125mm', unit: 'mb', default_qty: 1, default_price: 35, category: 'Materiał', description: 'Rynna z hakami', trade: 'Dekarz' },
  { name: 'Rura spustowa 90mm', unit: 'mb', default_qty: 1, default_price: 28, category: 'Materiał', description: 'Rura z mocowaniami', trade: 'Dekarz' },
  { name: 'Pokrycie dachówką', unit: 'm²', default_qty: 1, default_price: 120, category: 'Robocizna', description: 'Z łatami i membraną', trade: 'Dekarz' },
  { name: 'Pokrycie blachodachówką', unit: 'm²', default_qty: 1, default_price: 65, category: 'Robocizna', description: 'Z membraną', trade: 'Dekarz' },
  { name: 'Montaż rynien', unit: 'mb', default_qty: 1, default_price: 45, category: 'Robocizna', description: 'Z hakami i rurami', trade: 'Dekarz' },

  // ===================
  // ELEWACJA / OCIEPLENIE
  // ===================
  { name: 'Styropian EPS 100 10cm', unit: 'm²', default_qty: 1, default_price: 35, category: 'Materiał', description: 'Styropian fasadowy', trade: 'Elewacja' },
  { name: 'Styropian EPS 100 15cm', unit: 'm²', default_qty: 1, default_price: 52, category: 'Materiał', description: 'Styropian fasadowy', trade: 'Elewacja' },
  { name: 'Styropian grafitowy 15cm', unit: 'm²', default_qty: 1, default_price: 75, category: 'Materiał', description: 'Styropian o niskim lambda', trade: 'Elewacja' },
  { name: 'Klej do styropianu', unit: 'worek', default_qty: 1, default_price: 35, category: 'Materiał', description: 'Klej klejąco-szpachlowy 25kg', trade: 'Elewacja' },
  { name: 'Siatka zbrojąca', unit: 'm²', default_qty: 1, default_price: 8, category: 'Materiał', description: 'Siatka 160g/m²', trade: 'Elewacja' },
  { name: 'Kołki do styropianu', unit: 'szt.', default_qty: 1, default_price: 1.5, category: 'Materiał', description: 'Kołek z trzpieniem', trade: 'Elewacja' },
  { name: 'Tynk silikonowy', unit: 'm²', default_qty: 1, default_price: 25, category: 'Materiał', description: 'Tynk elewacyjny baranek', trade: 'Elewacja' },
  { name: 'Ocieplenie ścian', unit: 'm²', default_qty: 1, default_price: 85, category: 'Robocizna', description: 'BSO kompletny system', trade: 'Elewacja' },
  { name: 'Tynkowanie elewacji', unit: 'm²', default_qty: 1, default_price: 35, category: 'Robocizna', description: 'Tynk dekoracyjny', trade: 'Elewacja' },

  // ===================
  // STOLARZ / MONTAŻYSTA
  // ===================
  { name: 'Drzwi wewnętrzne', unit: 'szt.', default_qty: 1, default_price: 450, category: 'Materiał', description: 'Drzwi 80cm z ościeżnicą', trade: 'Stolarz' },
  { name: 'Drzwi zewnętrzne', unit: 'szt.', default_qty: 1, default_price: 1800, category: 'Materiał', description: 'Drzwi antywłamaniowe', trade: 'Stolarz' },
  { name: 'Okno PCV 120x150', unit: 'szt.', default_qty: 1, default_price: 850, category: 'Materiał', description: 'Okno dwuszybowe', trade: 'Stolarz' },
  { name: 'Okno dachowe 78x118', unit: 'szt.', default_qty: 1, default_price: 1200, category: 'Materiał', description: 'Okno obrotowe', trade: 'Stolarz' },
  { name: 'Parapet wewnętrzny', unit: 'mb', default_qty: 1, default_price: 85, category: 'Materiał', description: 'Parapet konglomerat', trade: 'Stolarz' },
  { name: 'Parapet zewnętrzny', unit: 'mb', default_qty: 1, default_price: 65, category: 'Materiał', description: 'Parapet aluminiowy', trade: 'Stolarz' },
  { name: 'Montaż drzwi wewnętrznych', unit: 'szt.', default_qty: 1, default_price: 180, category: 'Robocizna', description: 'Z regulacją', trade: 'Stolarz' },
  { name: 'Montaż drzwi zewnętrznych', unit: 'szt.', default_qty: 1, default_price: 350, category: 'Robocizna', description: 'Z uszczelnieniem', trade: 'Stolarz' },
  { name: 'Montaż okna PCV', unit: 'szt.', default_qty: 1, default_price: 250, category: 'Robocizna', description: 'Z uszczelnieniem', trade: 'Stolarz' },
  { name: 'Montaż okna dachowego', unit: 'szt.', default_qty: 1, default_price: 450, category: 'Robocizna', description: 'Z kołnierzem', trade: 'Stolarz' },

  // ===================
  // MURARZ
  // ===================
  { name: 'Pustak ceramiczny 25cm', unit: 'szt.', default_qty: 1, default_price: 8, category: 'Materiał', description: 'Pustak Porotherm', trade: 'Murarz' },
  { name: 'Beton komórkowy 24cm', unit: 'm³', default_qty: 1, default_price: 380, category: 'Materiał', description: 'Bloczek Solbet/Ytong', trade: 'Murarz' },
  { name: 'Zaprawa murarska', unit: 'worek', default_qty: 1, default_price: 18, category: 'Materiał', description: 'Zaprawa 25kg', trade: 'Murarz' },
  { name: 'Klej do betonu komórkowego', unit: 'worek', default_qty: 1, default_price: 28, category: 'Materiał', description: 'Klej cienkowarstwowy', trade: 'Murarz' },
  { name: 'Murowanie ścian nośnych', unit: 'm²', default_qty: 1, default_price: 95, category: 'Robocizna', description: 'Z zaprawą', trade: 'Murarz' },
  { name: 'Murowanie ścian działowych', unit: 'm²', default_qty: 1, default_price: 75, category: 'Robocizna', description: 'Beton komórkowy', trade: 'Murarz' },

  // ===================
  // TRANSPORT I INNE
  // ===================
  { name: 'Transport materiałów', unit: 'kpl.', default_qty: 1, default_price: 300, category: 'Robocizna', description: 'Dostawa i wniesienie', trade: 'Transport' },
  { name: 'Wywóz gruzu', unit: 'kpl.', default_qty: 1, default_price: 400, category: 'Robocizna', description: 'Kontener + wywóz', trade: 'Transport' },
  { name: 'Wynajem rusztowania', unit: 'm²', default_qty: 1, default_price: 15, category: 'Materiał', description: 'Wynajem miesięczny', trade: 'Wynajem' },
  { name: 'Sprzątanie po remoncie', unit: 'm²', default_qty: 1, default_price: 12, category: 'Robocizna', description: 'Sprzątanie gruntowne', trade: 'Inne' },
  { name: 'Nadzór budowlany', unit: 'godz.', default_qty: 1, default_price: 150, category: 'Robocizna', description: 'Kierownik budowy', trade: 'Nadzór' },
  { name: 'Kosztorys', unit: 'szt.', default_qty: 1, default_price: 500, category: 'Robocizna', description: 'Kosztorys inwestorski', trade: 'Projektowanie' },
  { name: 'Projekt wnętrza', unit: 'm²', default_qty: 1, default_price: 80, category: 'Robocizna', description: 'Projekt aranżacji', trade: 'Projektowanie' },
];

export const trades = [
  'Glazurnik',
  'Malarz', 
  'Hydraulik',
  'Elektryk',
  'Podłogarz',
  'Sucha zabudowa',
  'Dekarz',
  'Elewacja',
  'Stolarz',
  'Murarz',
  'Transport',
  'Wynajem',
  'Nadzór',
  'Projektowanie',
  'Inne',
];
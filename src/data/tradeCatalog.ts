/**
 * Trade catalog taxonomy:
 * 12 top-level categories → subcategories → trades (referencing starter pack IDs).
 */

export interface CatalogTrade {
  packId: string;
  name: string;
  description: string;
}

export interface CatalogSubcategory {
  id: string;
  name: string;
  trades: CatalogTrade[];
}

export interface CatalogCategory {
  id: string;
  name: string;
  /** Lucide icon component name */
  icon: string;
  subcategories: CatalogSubcategory[];
}

export const tradeCategories: CatalogCategory[] = [
  // ── 1. Wykończenie łazienki i WC ─────────────────────────────────────────
  {
    id: 'lazienka',
    name: 'Wykończenie łazienki i WC',
    icon: 'Droplets',
    subcategories: [
      {
        id: 'lazienka-plytki',
        name: 'Płytki i okładziny',
        trades: [
          {
            packId: 'glazurnik',
            name: 'Glazurnik',
            description: 'Układanie płytek ceramicznych i gresowych',
          },
        ],
      },
      {
        id: 'lazienka-sanitariaty',
        name: 'Sanitariaty i armatura',
        trades: [
          {
            packId: 'hydraulik',
            name: 'Hydraulik — montaż urządzeń',
            description: 'Montaż umywalki, WC, kabiny prysznicowej',
          },
        ],
      },
    ],
  },

  // ── 2. Malowanie i tynkowanie ────────────────────────────────────────────
  {
    id: 'malowanie',
    name: 'Malowanie i tynkowanie',
    icon: 'Paintbrush',
    subcategories: [
      {
        id: 'malowanie-wnetrz',
        name: 'Malowanie wnętrz',
        trades: [
          {
            packId: 'malarz',
            name: 'Malarz',
            description: 'Malowanie ścian i sufitów, gładzie, tapetowanie',
          },
        ],
      },
      {
        id: 'tynki-wewnetrzne',
        name: 'Tynki wewnętrzne',
        trades: [
          {
            packId: 'murarz',
            name: 'Murarz — tynkowanie',
            description: 'Tynki jedno- i dwuwarstwowe na ścianach',
          },
        ],
      },
    ],
  },

  // ── 3. Podłogi ───────────────────────────────────────────────────────────
  {
    id: 'podlogi',
    name: 'Podłogi',
    icon: 'Layers',
    subcategories: [
      {
        id: 'podlogi-drewniane',
        name: 'Podłogi drewniane i panele',
        trades: [
          {
            packId: 'podlogarz',
            name: 'Podłogarz',
            description: 'Panele, deski, parkiet, cyklinowanie',
          },
        ],
      },
      {
        id: 'podlogi-posadzki',
        name: 'Posadzki i wylewki',
        trades: [
          {
            packId: 'podlogarz',
            name: 'Podłogarz — wylewki',
            description: 'Masy samopoziomujące i przygotowanie podłoża',
          },
        ],
      },
    ],
  },

  // ── 4. Sufity i ścianki działowe ─────────────────────────────────────────
  {
    id: 'sucha-zabudowa',
    name: 'Sufity i ścianki działowe',
    icon: 'Square',
    subcategories: [
      {
        id: 'sufity-gk',
        name: 'Sufity podwieszane GK',
        trades: [
          {
            packId: 'sucha-zabudowa',
            name: 'Sucha zabudowa',
            description: 'Sufity podwieszane i ścianki z płyt GK',
          },
        ],
      },
      {
        id: 'scianki-dzialowe',
        name: 'Ścianki działowe',
        trades: [
          {
            packId: 'sucha-zabudowa',
            name: 'Sucha zabudowa — ścianki',
            description: 'Ścianki jedno- i dwuwarstwowe z izolacją',
          },
        ],
      },
    ],
  },

  // ── 5. Instalacje elektryczne ────────────────────────────────────────────
  {
    id: 'elektryka',
    name: 'Instalacje elektryczne',
    icon: 'Zap',
    subcategories: [
      {
        id: 'elektryka-instalacja',
        name: 'Instalacja wewnętrzna',
        trades: [
          {
            packId: 'elektryk',
            name: 'Elektryk',
            description: 'Okablowanie, gniazdka, rozdzielnica, pomiary',
          },
        ],
      },
      {
        id: 'elektryka-oswietlenie',
        name: 'Oświetlenie',
        trades: [
          {
            packId: 'elektryk',
            name: 'Elektryk — oświetlenie',
            description: 'Punkty oświetleniowe, oprawy LED',
          },
        ],
      },
    ],
  },

  // ── 6. Instalacje sanitarne i ogrzewanie ─────────────────────────────────
  {
    id: 'hydraulika',
    name: 'Instalacje sanitarne i ogrzewanie',
    icon: 'Wrench',
    subcategories: [
      {
        id: 'hydraulika-wodkan',
        name: 'Wod-kan — instalacja',
        trades: [
          {
            packId: 'hydraulik',
            name: 'Hydraulik',
            description: 'Rury PEX, kanalizacja, punkty podłączeniowe',
          },
        ],
      },
      {
        id: 'hydraulika-armatura',
        name: 'Armatura i urządzenia sanitarne',
        trades: [
          {
            packId: 'hydraulik',
            name: 'Hydraulik — armatura',
            description: 'Montaż umywalki, WC, kabiny, wanny',
          },
        ],
      },
    ],
  },

  // ── 7. Ściany murowane ───────────────────────────────────────────────────
  {
    id: 'murarstwo',
    name: 'Ściany murowane i betonowanie',
    icon: 'Hammer',
    subcategories: [
      {
        id: 'murarstwo-sciany',
        name: 'Murowanie ścian',
        trades: [
          {
            packId: 'murarz',
            name: 'Murarz',
            description: 'Ściany nośne i działowe, beton komórkowy, pustaki',
          },
        ],
      },
      {
        id: 'murarstwo-wyburzenia',
        name: 'Wyburzenia i przebicia',
        trades: [
          {
            packId: 'murarz',
            name: 'Murarz — wyburzenia',
            description: 'Kucie otworów drzwiowych i okiennych',
          },
        ],
      },
    ],
  },

  // ── 8. Dach ──────────────────────────────────────────────────────────────
  {
    id: 'dach',
    name: 'Dach i więźba dachowa',
    icon: 'Home',
    subcategories: [
      {
        id: 'dach-pokrycia',
        name: 'Pokrycia dachowe',
        trades: [
          {
            packId: 'dekarz',
            name: 'Dekarz',
            description: 'Blachodachówka, dachówka betonowa, membrana',
          },
        ],
      },
      {
        id: 'dach-odwodnienie',
        name: 'Odwodnienie dachu',
        trades: [
          {
            packId: 'dekarz',
            name: 'Dekarz — rynny',
            description: 'Montaż rynien, rur spustowych, obróbki',
          },
        ],
      },
    ],
  },

  // ── 9. Elewacja i ocieplenie ─────────────────────────────────────────────
  {
    id: 'elewacja',
    name: 'Elewacja i ocieplenie',
    icon: 'Building2',
    subcategories: [
      {
        id: 'elewacja-ocieplenie',
        name: 'Ocieplenie metodą BSO',
        trades: [
          {
            packId: 'elewacja',
            name: 'Elewacja i ocieplenie',
            description: 'Styropian, warstwa zbrojna, tynk elewacyjny',
          },
        ],
      },
      {
        id: 'elewacja-tynki',
        name: 'Tynki i farby elewacyjne',
        trades: [
          {
            packId: 'elewacja',
            name: 'Tynkarz elewacyjny',
            description: 'Tynk silikonowy, farba silikonowa elewacyjna',
          },
        ],
      },
    ],
  },

  // ── 10. Stolarka okienna i drzwiowa ──────────────────────────────────────
  {
    id: 'stolarka',
    name: 'Stolarka okienna i drzwiowa',
    icon: 'DoorOpen',
    subcategories: [
      {
        id: 'stolarka-montaz',
        name: 'Montaż okien i drzwi',
        trades: [
          {
            packId: 'stolarz',
            name: 'Stolarz / Montażysta',
            description: 'Okna PCV, drzwi wewnętrzne i zewnętrzne, parapety',
          },
        ],
      },
      {
        id: 'stolarka-renowacja',
        name: 'Renowacja i wymiana stolarki',
        trades: [
          {
            packId: 'stolarz',
            name: 'Montażysta — wymiana',
            description: 'Demontaż starej stolarki i montaż nowej',
          },
        ],
      },
    ],
  },

  // ── 11. Transport i wywóz odpadów ────────────────────────────────────────
  {
    id: 'transport',
    name: 'Transport i wywóz odpadów',
    icon: 'Truck',
    subcategories: [
      {
        id: 'transport-materialy',
        name: 'Transport materiałów',
        trades: [
          {
            packId: 'elewacja',
            name: 'Transport i dostawa',
            description: 'Dostawa i wniesienie materiałów budowlanych',
          },
        ],
      },
      {
        id: 'transport-gruz',
        name: 'Wywóz gruzu i odpadów',
        trades: [
          {
            packId: 'murarz',
            name: 'Wywóz gruzu',
            description: 'Kontener na gruz i wywóz odpadów budowlanych',
          },
        ],
      },
    ],
  },

  // ── 12. Nadzór i projektowanie ───────────────────────────────────────────
  {
    id: 'nadzor',
    name: 'Nadzór i projektowanie',
    icon: 'ClipboardList',
    subcategories: [
      {
        id: 'nadzor-budowlany',
        name: 'Nadzór budowlany',
        trades: [
          {
            packId: 'murarz',
            name: 'Kierownik budowy',
            description: 'Nadzór inwestorski i kierownik budowy',
          },
        ],
      },
      {
        id: 'nadzor-projektowanie',
        name: 'Projektowanie i kosztorysy',
        trades: [
          {
            packId: 'elewacja',
            name: 'Projektant / Kosztorysant',
            description: 'Projekt wnętrza, kosztorys inwestorski',
          },
        ],
      },
    ],
  },
];

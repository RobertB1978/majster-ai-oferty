// src/config/plans.ts
// Single source of truth for subscription plans.
//
// Imported by:
//   - src/pages/Plany.tsx          (public plans page)
//   - src/pages/PlanyDetail.tsx    (via Plany.tsx re-export)
//   - src/components/landing/PricingSection.tsx

export const PLANS = [
  {
    slug: 'darmowy',
    name: 'Darmowy',
    pricePLN: 0,
    highlighted: false,
    description: 'Idealne do zaczęcia i sprawdzenia platformy.',
    features: [
      '3 projekty',
      '5 klientów',
      '100 MB zdjęć',
      'Generowanie ofert PDF',
      'Podstawowe szablony',
    ],
    faq: [
      { q: 'Jak długo działa plan darmowy?', a: 'Plan darmowy jest bezpłatny przez pierwsze 30 dni. Po tym czasie możesz wybrać płatny plan lub kontynuować z ograniczonymi funkcjami.' },
      { q: 'Czy mogę zmienić na płatny plan?', a: 'Tak, w każdej chwili. Dane są zachowane.' },
      { q: 'Czy pokazują się reklamy?', a: 'W planie darmowym mogą pojawiać się banery informacyjne.' },
    ],
  },
  {
    slug: 'pro',
    name: 'Pro',
    pricePLN: 49,
    highlighted: true,
    description: 'Dla aktywnych fachowców. Więcej projektów, więcej klientów, eksport Excel.',
    features: [
      '15 projektów',
      '30 klientów',
      '1 GB zdjęć',
      'Eksport Excel',
      'Własne szablony',
      'Bez reklam',
    ],
    faq: [
      { q: 'Czy mogę anulować?', a: 'Tak — płatność można anulować w dowolnym momencie.' },
      { q: 'Czy jest faktura VAT?', a: 'Tak, wystawiamy fakturę VAT do każdego zakupu.' },
      { q: 'Co się stanie po anulowaniu?', a: 'Masz dostęp do końca opłaconego okresu.' },
    ],
  },
  {
    slug: 'biznes',
    name: 'Biznes',
    pricePLN: 99,
    highlighted: false,
    description: 'Dla firm z zespołem. AI, dyktowanie głosem, synchronizacja kalendarza.',
    features: [
      'Nieograniczone projekty',
      'Nieograniczeni klienci',
      '5 GB zdjęć',
      'Asystent AI',
      'Dyktowanie głosem',
      'Dokumenty firmowe',
      'Synchronizacja kalendarza',
      'Priorytetowe wsparcie',
    ],
    faq: [
      { q: 'Ile osób może pracować?', a: 'Do 5 członków zespołu. Można dokupić więcej.' },
      { q: 'Czy AI jest wliczone?', a: 'Tak — asystent AI i wycena ze zdjęcia wliczone w plan.' },
      { q: 'Jak dodać zespół?', a: 'W panelu → Zespół → Zaproś członka.' },
    ],
  },
  {
    slug: 'enterprise',
    name: 'Enterprise',
    pricePLN: 199,
    highlighted: false,
    description: 'Dla dużych firm. Nieograniczone wszystko, API, dedykowany opiekun.',
    features: [
      'Wszystko z Biznes',
      'Nieograniczona liczba członków zespołu',
      'Nieograniczone miejsce na zdjęcia',
      'Dostęp do API',
      'Dedykowany opiekun konta',
      'Własne integracje (na zapytanie)',
    ],
    faq: [
      { q: 'Czy jest umowa SLA?', a: 'Tak — dla planów Enterprise dostępna jest umowa SLA.' },
      { q: 'Czy cena jest negocjowalna?', a: 'Tak — przy większych zespołach zapraszamy do kontaktu.' },
      { q: 'Jak uzyskać dostęp do API?', a: 'Po zakupie klucze API dostępne są w Ustawieniach → API.' },
    ],
  },
] as const;

export type Plan = (typeof PLANS)[number];

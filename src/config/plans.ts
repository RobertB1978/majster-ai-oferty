// src/config/plans.ts
// Single source of truth for subscription plans.
//
// Imported by:
//   - src/pages/Plany.tsx          (public plans page)
//   - src/pages/PlanyDetail.tsx    (via Plany.tsx re-export)
//   - src/pages/Billing.tsx        (internal billing tab)
//   - src/components/billing/PricingPlans.tsx
//   - src/components/landing/PricingSection.tsx

export interface PlanLimits {
  /** 9999 = unlimited */
  maxProjects: number;
  /** 9999 = unlimited */
  maxClients: number;
  maxTeamMembers: number;
  maxStorageMB: number;
}

export interface PlanConfig {
  /** URL slug used in public pages: 'darmowy' | 'pro' | 'biznes' | 'enterprise' */
  slug: string;
  /** Internal id matching defaultConfig tiers: 'free' | 'pro' | 'business' | 'enterprise' */
  id: string;
  /** i18n key for plan display name, e.g. 'billing.plans.free.name' */
  displayNameKey: string;
  /** i18n key for plan description */
  descriptionKey: string;
  /** i18n keys for feature list items */
  featuresKeys: string[];
  /** Fallback display name (Polish) for non-i18n consumers */
  name: string;
  /** Fallback description (Polish) */
  description: string;
  /** Fallback feature strings (Polish) */
  features: string[];
  limits: PlanLimits;
  pricePLN: number;
  highlighted: boolean;
  /** Stripe price ID — null until Stripe account is configured */
  stripePriceId: string | null;
  faq: Array<{ q: string; a: string }>;
  /** i18n keys for FAQ items */
  faqKeys: Array<{ qKey: string; aKey: string }>;
}

export const PLANS: PlanConfig[] = [
  {
    slug: 'darmowy',
    id: 'free',
    displayNameKey: 'billing.plans.free.name',
    descriptionKey: 'billing.plans.free.description',
    featuresKeys: [
      'billing.plans.free.features.projects',
      'billing.plans.free.features.clients',
      'billing.plans.free.features.basicQuotes',
      'billing.plans.free.features.simplePdf',
    ],
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
    limits: {
      maxProjects: 3,
      maxClients: 5,
      maxTeamMembers: 0,
      maxStorageMB: 100,
    },
    stripePriceId: null,
    faq: [
      { q: 'Jak długo działa plan darmowy?', a: 'Plan darmowy jest bezpłatny bez limitu czasu. Możesz korzystać z niego tak długo, jak chcesz.' },
      { q: 'Czy mogę zmienić na płatny plan?', a: 'Tak, w każdej chwili. Dane są zachowane.' },
      { q: 'Czy pokazują się reklamy?', a: 'W planie darmowym mogą pojawiać się banery informacyjne.' },
    ],
    faqKeys: [
      { qKey: 'billing.plans.free.faq.q1', aKey: 'billing.plans.free.faq.a1' },
      { qKey: 'billing.plans.free.faq.q2', aKey: 'billing.plans.free.faq.a2' },
      { qKey: 'billing.plans.free.faq.q3', aKey: 'billing.plans.free.faq.a3' },
    ],
  },
  {
    slug: 'pro',
    id: 'pro',
    displayNameKey: 'billing.plans.pro.name',
    descriptionKey: 'billing.plans.pro.description',
    featuresKeys: [
      'billing.plans.pro.features.projects',
      'billing.plans.pro.features.clients',
      'billing.plans.pro.features.noAds',
      'billing.plans.pro.features.allPdfTemplates',
      'billing.plans.pro.features.emailSupport',
    ],
    name: 'Pro',
    pricePLN: 49,
    highlighted: true,
    description: 'Dla aktywnych fachowców. Więcej projektów, więcej klientów, własne szablony.',
    features: [
      '15 projektów',
      '30 klientów',
      '1 GB zdjęć',
      'Własne szablony',
      'Bez reklam',
    ],
    limits: {
      maxProjects: 15,
      maxClients: 30,
      maxTeamMembers: 2,
      maxStorageMB: 1024,
    },
    stripePriceId: null,
    faq: [
      { q: 'Czy mogę anulować?', a: 'Tak — płatność można anulować w dowolnym momencie.' },
      { q: 'Czy jest faktura VAT?', a: 'Tak, wystawiamy fakturę VAT do każdego zakupu.' },
      { q: 'Co się stanie po anulowaniu?', a: 'Masz dostęp do końca opłaconego okresu.' },
    ],
    faqKeys: [
      { qKey: 'billing.plans.pro.faq.q1', aKey: 'billing.plans.pro.faq.a1' },
      { qKey: 'billing.plans.pro.faq.q2', aKey: 'billing.plans.pro.faq.a2' },
      { qKey: 'billing.plans.pro.faq.q3', aKey: 'billing.plans.pro.faq.a3' },
    ],
  },
  {
    slug: 'biznes',
    id: 'business',
    displayNameKey: 'billing.plans.business.name',
    descriptionKey: 'billing.plans.business.description',
    featuresKeys: [
      'billing.plans.business.features.unlimitedProjects',
      'billing.plans.business.features.unlimitedClients',
      'billing.plans.business.features.aiAssistant',
      'billing.plans.business.features.voiceQuotes',
      'billing.plans.business.features.calendarIntegration',
      'billing.plans.business.features.companyDocuments',
      'billing.plans.business.features.prioritySupport',
    ],
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
    limits: {
      maxProjects: 9999,
      maxClients: 9999,
      maxTeamMembers: 10,
      maxStorageMB: 5120,
    },
    stripePriceId: null,
    faq: [
      { q: 'Ile osób może pracować?', a: 'Do 10 członków zespołu w planie Biznes.' },
      { q: 'Czy AI jest wliczone?', a: 'Tak — asystent AI i wycena ze zdjęcia wliczone w plan.' },
      { q: 'Czy zarządzanie zespołem jest już dostępne?', a: 'Moduł Zespół jest w przygotowaniu i będzie dostępny w kolejnej aktualizacji.' },
    ],
    faqKeys: [
      { qKey: 'billing.plans.business.faq.q1', aKey: 'billing.plans.business.faq.a1' },
      { qKey: 'billing.plans.business.faq.q2', aKey: 'billing.plans.business.faq.a2' },
      { qKey: 'billing.plans.business.faq.q3', aKey: 'billing.plans.business.faq.a3' },
    ],
  },
  {
    slug: 'enterprise',
    id: 'enterprise',
    displayNameKey: 'billing.plans.enterprise.name',
    descriptionKey: 'billing.plans.enterprise.description',
    featuresKeys: [
      'billing.plans.enterprise.features.allBusiness',
      'billing.plans.enterprise.features.unlimitedAi',
      'billing.plans.enterprise.features.customTemplates',
      'billing.plans.enterprise.features.apiAccess',
      'billing.plans.enterprise.features.dedicatedManager',
      'billing.plans.enterprise.features.sla',
      'billing.plans.enterprise.features.teamTraining',
      'billing.plans.enterprise.features.priorityFeatures',
    ],
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
    limits: {
      maxProjects: 9999,
      maxClients: 9999,
      maxTeamMembers: 9999,
      maxStorageMB: 999999,
    },
    stripePriceId: null,
    faq: [
      { q: 'Czy jest umowa SLA?', a: 'Tak — dla planów Enterprise dostępna jest umowa SLA.' },
      { q: 'Czy cena jest negocjowalna?', a: 'Tak — przy większych zespołach zapraszamy do kontaktu.' },
      { q: 'Jak uzyskać dostęp do API?', a: 'Po zakupie klucze API dostępne są w Ustawieniach → API.' },
    ],
    faqKeys: [
      { qKey: 'billing.plans.enterprise.faq.q1', aKey: 'billing.plans.enterprise.faq.a1' },
      { qKey: 'billing.plans.enterprise.faq.q2', aKey: 'billing.plans.enterprise.faq.a2' },
      { qKey: 'billing.plans.enterprise.faq.q3', aKey: 'billing.plans.enterprise.faq.a3' },
    ],
  },
];

export type Plan = PlanConfig;

/** Lookup a plan by its internal id (matches defaultConfig tier ids). */
export function getPlanById(id: string): PlanConfig | undefined {
  return PLANS.find((p) => p.id === id);
}

/** Lookup a plan by its public slug. */
export function getPlanBySlug(slug: string): PlanConfig | undefined {
  return PLANS.find((p) => p.slug === slug);
}

// ---------------------------------------------------------------------------
// Legacy alias resolution
// ---------------------------------------------------------------------------

/**
 * Canonical mapping of legacy plan ids to current canonical ids.
 *
 * 'starter' was an early internal identifier used before the user-facing 'pro'
 * plan was established. Some existing DB rows in user_subscriptions may still
 * carry plan_id = 'starter'. It is functionally identical to 'pro'.
 *
 * This map is the single place where that alias is declared — all runtime
 * consumers must use normalizePlanId() before limit/feature lookups.
 */
export const PLAN_ID_ALIASES: Readonly<Record<string, string>> = {
  starter: 'pro',
} as const;

/**
 * Resolve a plan id to its canonical form.
 * Converts known legacy aliases (e.g. 'starter' → 'pro').
 * Any unrecognised id is returned unchanged.
 */
export function normalizePlanId(planId: string): string {
  return PLAN_ID_ALIASES[planId] ?? planId;
}

/**
 * Get PlanLimits for a plan id.
 * Handles legacy aliases via normalizePlanId().
 * Falls back to free plan limits for any unrecognised id.
 */
export function getLimitsForPlan(planId: string): PlanLimits {
  const canonical = normalizePlanId(planId);
  return getPlanById(canonical)?.limits ?? PLANS[0].limits;
}

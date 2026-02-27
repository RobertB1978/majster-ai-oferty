import { Helmet } from 'react-helmet-async';
import {
  LandingHeader,
  HeroSection,
  TrustBar,
  FeaturesGrid,
  HowItWorksSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';

const SITE_URL = 'https://majster-ai-oferty.vercel.app';

const structuredData = [
  {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Majster.AI',
    url: SITE_URL,
    logo: `${SITE_URL}/icon-512.png`,
    description: 'Platforma SaaS dla fachowców i wykonawców budowlanych — wyceny PDF, zarządzanie projektami, AI.',
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      email: 'kontakt.majsterai@gmail.com',
      availableLanguage: ['Polish', 'English', 'Ukrainian'],
    },
    sameAs: [],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Majster.AI',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web, iOS, Android',
    url: SITE_URL,
    description: 'Narzędzie do tworzenia wycen PDF, zarządzania projektami i klientami dla firm budowlanych i remontowych.',
    offers: {
      '@type': 'AggregateOffer',
      priceCurrency: 'PLN',
      lowPrice: '0',
      highPrice: '99',
      offerCount: '4',
    },
    screenshot: `${SITE_URL}/icon-512.png`,
    featureList: [
      'Generowanie ofert PDF',
      'Zarządzanie projektami',
      'Baza klientów',
      'Asystent AI',
      'Dyktowanie głosowe',
      'Analiza OCR faktur',
      'Marketplace dla fachowców',
    ],
    inLanguage: ['pl', 'en', 'uk'],
  },
  {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Czy Majster.AI jest bezpłatny?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tak, Majster.AI oferuje darmowy plan startowy bez karty kredytowej. Możesz zacząć bez opłat.',
        },
      },
      {
        '@type': 'Question',
        name: 'Dla kogo jest Majster.AI?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Majster.AI jest przeznaczony dla firm budowlanych, remontowych, elektryków, hydraulików i innych fachowców, którzy chcą profesjonalizować swój biznes.',
        },
      },
      {
        '@type': 'Question',
        name: 'Czy mogę wygenerować ofertę PDF?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Tak, Majster.AI umożliwia generowanie profesjonalnych ofert w formacie PDF z logo firmy, pozycjami kosztorysowymi i warunkami płatności.',
        },
      },
    ],
  },
];

export default function Landing() {
  return (
    <>
      <Helmet>
        <title>Majster.AI — Wyceny PDF i zarządzanie projektami dla fachowców</title>
        <meta
          name="description"
          content="Platforma dla majstrów i wykonawców. Wyceny PDF, projekty, baza klientów, asystent AI. Zacznij bezpłatnie — bez karty kredytowej."
        />
        <meta name="keywords" content="wyceny PDF, generator ofert, fachowcy, firma budowlana, kosztorys, zarządzanie projektami, majster, elektryk, hydraulik" />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:title" content="Majster.AI — Wyceny PDF i zarządzanie projektami dla fachowców" />
        <meta property="og:description" content="Platforma dla majstrów i wykonawców. Wyceny PDF, projekty, baza klientów. Zacznij bezpłatnie — bez karty kredytowej." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        <meta property="og:image" content={`${SITE_URL}/icon-512.png`} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:site_name" content="Majster.AI" />
        <meta property="og:locale" content="pl_PL" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="uk_UA" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Majster.AI — Wyceny PDF dla fachowców" />
        <meta name="twitter:description" content="Profesjonalne wyceny, zarządzanie projektami i AI dla firm remontowych." />
        <meta name="twitter:image" content={`${SITE_URL}/icon-512.png`} />

        {/* hreflang — multilingual support */}
        <link rel="alternate" hrefLang="pl" href={SITE_URL} />
        <link rel="alternate" hrefLang="en" href={`${SITE_URL}?lang=en`} />
        <link rel="alternate" hrefLang="uk" href={`${SITE_URL}?lang=uk`} />
        <link rel="alternate" hrefLang="x-default" href={SITE_URL} />

        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
        <meta name="author" content="Majster.AI" />

        {/* Structured Data */}
        {structuredData.map((schema, i) => (
          <script key={i} type="application/ld+json">
            {JSON.stringify(schema)}
          </script>
        ))}
      </Helmet>

      <div className="min-h-screen bg-white dark:bg-[#0F0F0F]">
        {/* Sticky header — fixed position, not in page flow */}
        <LandingHeader />

        <main>
          {/* 1. Hero — cinematic dark grid + amber glow */}
          <HeroSection />

          {/* 1b. Trust bar — truth-gated proof signals (languages, PDF, mobile, plan) */}
          <TrustBar />

          {/* 2. Live features grid */}
          <FeaturesGrid />

          {/* 3. How it works */}
          <HowItWorksSection />

          {/* 4. Testimonials — after features (proof sequence) */}
          <TestimonialsSection />

          {/* 5. Pricing */}
          <PricingSection />

          {/* 6. FAQ — removes objections before final CTA */}
          <FAQSection />

          {/* 7. Final CTA strip */}
          <CTASection />
        </main>

        {/* Footer — ONLY on landing page, never inside /app/* */}
        <LandingFooter />
      </div>
    </>
  );
}

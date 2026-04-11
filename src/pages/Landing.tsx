import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  LandingHeader,
  HeroSection,
  TrustBar,
  FeaturesGrid,
  HowItWorksSection,
  BeforeAfterSection,
  TestimonialsSection,
  PricingSection,
  FAQSection,
  CTASection,
  LandingFooter,
} from '@/components/landing';
import { getSiteUrl } from '@/lib/siteUrl';

const SITE_URL = getSiteUrl();

export default function Landing() {
  const { t } = useTranslation();

  const structuredData = [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      name: 'Majster.AI',
      url: SITE_URL,
      logo: `${SITE_URL}/icon-512.png`,
      description: t('seoStructuredData.orgDescription'),
      contactPoint: {
        '@type': 'ContactPoint',
        contactType: 'customer support',
        email: 'kontakt.majsterai@gmail.com',
        availableLanguage: ['Polish', 'English', 'Ukrainian'],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'Majster.AI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE_URL,
      description: t('seoStructuredData.appDescription'),
      offers: {
        '@type': 'AggregateOffer',
        priceCurrency: 'PLN',
        lowPrice: '0',
        highPrice: '199',
        offerCount: '4',
      },
      screenshot: `${SITE_URL}/icon-512.png`,
      featureList: [
        t('seoStructuredData.features.pdfOffers'),
        t('seoStructuredData.features.projectMgmt'),
        t('seoStructuredData.features.clientDb'),
        t('seoStructuredData.features.aiAssistant'),
        t('seoStructuredData.features.voiceDictation'),
        t('seoStructuredData.features.ocrInvoice'),
        t('seoStructuredData.features.marketplace'),
      ],
      inLanguage: ['pl', 'en', 'uk'],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: t('seoStructuredData.faq1q'),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t('seoStructuredData.faq1a'),
          },
        },
        {
          '@type': 'Question',
          name: t('seoStructuredData.faq2q'),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t('seoStructuredData.faq2a'),
          },
        },
        {
          '@type': 'Question',
          name: t('seoStructuredData.faq3q'),
          acceptedAnswer: {
            '@type': 'Answer',
            text: t('seoStructuredData.faq3a'),
          },
        },
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>{t('seo.landing.title')}</title>
        <meta
          name="description"
          content={t('seo.landing.description')}
        />
        <meta name="keywords" content={t('seo.landing.keywords')} />
        <link rel="canonical" href={SITE_URL} />

        {/* Open Graph */}
        <meta property="og:title" content={t('seo.landing.title')} />
        <meta property="og:description" content={t('seo.landing.ogDescription')} />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={SITE_URL} />
        {/* TODO: Zamień na dedykowany plik og-image.png (1200x630) gdy będzie gotowy */}
        <meta property="og:image" content={`${SITE_URL}/icon-512.png`} />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="Majster.AI — profesjonalne wyceny dla fachowców" />
        <meta property="og:site_name" content="Majster.AI" />
        <meta property="og:locale" content="pl_PL" />
        <meta property="og:locale:alternate" content="en_US" />
        <meta property="og:locale:alternate" content="uk_UA" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={t('seo.landing.twitterTitle')} />
        <meta name="twitter:description" content={t('seo.landing.twitterDescription')} />
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

      <div className="min-h-screen bg-white dark:bg-brand-dark">
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

          {/* 3b. Before/After — Excel vs Majster.AI contrast */}
          <BeforeAfterSection />

          {/* 4. Expected results — honest framing, no fake testimonials */}
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

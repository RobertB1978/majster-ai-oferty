import { Helmet } from 'react-helmet-async';
import { getSiteUrl } from '@/lib/siteUrl';

interface SEOHeadProps {
  title: string;
  description: string;
  keywords?: string;
  ogImage?: string;
  ogType?: 'website' | 'article' | 'product';
  canonicalUrl?: string;
  noIndex?: boolean;
  structuredData?: Record<string, unknown>;
  lang?: string;
  alternateLanguages?: { lang: string; url: string }[];
}

export function SEOHead({
  title,
  description,
  keywords,
  ogImage = '/icon-512.png',
  ogType = 'website',
  canonicalUrl,
  noIndex = false,
  structuredData,
  lang = 'pl',
  alternateLanguages,
}: SEOHeadProps) {
  const fullTitle = `${title} | Majster.AI`;
  const siteUrl = getSiteUrl();
  // Use siteUrl (from VITE_PUBLIC_SITE_URL env) as the origin so that canonical
  // and og:url always reflect the production domain, even when the page is
  // accessed via a Vercel preview URL. Falls back to window.location.origin
  // only when siteUrl is empty (local dev without VITE_PUBLIC_SITE_URL set).
  const origin = siteUrl || (typeof window !== 'undefined' ? window.location.origin : '');
  const cleanUrl = origin + (typeof window !== 'undefined' ? window.location.pathname : '');
  const canonical = canonicalUrl || cleanUrl;

  const defaultStructuredData = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Majster.AI',
    description: 'Profesjonalne wyceny dla fachowców - szybko, łatwo, profesjonalnie',
    url: siteUrl,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web Browser',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'PLN',
      description: 'Darmowy plan startowy',
    },
    creator: {
      '@type': 'Organization',
      name: 'Majster.AI',
    },
  };

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <html lang={lang} />
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      
      {/* Robots */}
      {noIndex ? (
        <meta name="robots" content="noindex, nofollow" />
      ) : (
        <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />
      )}
      
      {/* Canonical */}
      <link rel="canonical" href={canonical} />
      
      {/* Open Graph */}
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={ogType} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={`${siteUrl}${ogImage}`} />
      <meta property="og:image:alt" content={description} />
      <meta property="og:site_name" content="Majster.AI" />
      <meta property="og:locale" content={lang === 'en' ? 'en_US' : lang === 'uk' ? 'uk_UA' : 'pl_PL'} />
      
      {/* Twitter Card — użyj summary_large_image gdy dostępny jest właściwy obraz OG 1200x630 */}
      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${siteUrl}${ogImage}`} />
      
      {/* Alternate Languages */}
      {alternateLanguages?.map(({ lang, url }) => (
        <link key={lang} rel="alternate" hrefLang={lang} href={url} />
      ))}
      <link rel="alternate" hrefLang="x-default" href={canonical} />
      
      {/* Mobile Optimization */}
      <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
      <meta name="theme-color" content="#9b5208" />
      <meta name="mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-capable" content="yes" />
      <meta name="apple-mobile-web-app-status-bar-style" content="default" />
      
      {/* Performance */}
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      {import.meta.env.VITE_SUPABASE_URL && (
        <link rel="dns-prefetch" href={new URL(import.meta.env.VITE_SUPABASE_URL as string).origin} />
      )}
      
      {/* Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify(structuredData || defaultStructuredData)}
      </script>
    </Helmet>
  );
}

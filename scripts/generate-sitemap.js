/**
 * Sitemap Generation Script
 *
 * Generates public/sitemap.xml with correct domain from environment.
 * Runs during build process (npm run build).
 *
 * Usage: node scripts/generate-sitemap.js
 */

import { writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL =
  process.env.VITE_PUBLIC_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  "https://majster-ai-oferty.vercel.app";

// Get base URL from environment or use fallback
const getBaseUrl = () => {
  // Check various possible env vars
  const envUrl =
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.VITE_APP_URL ||
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null ||
    process.env.URL;

  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Default fallback
  console.warn('⚠️  No VITE_PUBLIC_SITE_URL found, using default: ' + BASE_URL);
  return BASE_URL;
};

const generateSitemap = (baseUrl) => {
  const lastmod = new Date().toISOString().split('T')[0];

  // Pages with hreflang support (multilingual)
  const multilingualEntries = [
    { path: '/', changefreq: 'weekly', priority: 1.0, multilingual: true },
    { path: '/plany', changefreq: 'weekly', priority: 0.9, multilingual: true },
  ];

  // Pages without hreflang (auth, legal — same content regardless of language)
  const standardEntries = [
    { path: '/login', changefreq: 'monthly', priority: 0.8 },
    { path: '/register', changefreq: 'monthly', priority: 0.9 },
    { path: '/plany/starter', changefreq: 'monthly', priority: 0.7 },
    { path: '/plany/business', changefreq: 'monthly', priority: 0.7 },
    { path: '/plany/enterprise', changefreq: 'monthly', priority: 0.6 },
    { path: '/legal/privacy', changefreq: 'monthly', priority: 0.5 },
    { path: '/legal/terms', changefreq: 'monthly', priority: 0.5 },
    { path: '/legal/cookies', changefreq: 'monthly', priority: 0.4 },
    { path: '/legal/dpa', changefreq: 'yearly', priority: 0.3 },
    { path: '/legal/rodo', changefreq: 'yearly', priority: 0.4 },
  ];

  const renderHreflang = (path, baseUrl) => {
    return `    <xhtml:link rel="alternate" hreflang="pl" href="${baseUrl}${path}"/>
    <xhtml:link rel="alternate" hreflang="en" href="${baseUrl}${path}?lang=en"/>
    <xhtml:link rel="alternate" hreflang="uk" href="${baseUrl}${path}?lang=uk"/>
    <xhtml:link rel="alternate" hreflang="x-default" href="${baseUrl}${path}"/>`;
  };

  const multilingualUrls = multilingualEntries
    .map(
      (entry) => `  <url>
    <loc>${baseUrl}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
${renderHreflang(entry.path, baseUrl)}
  </url>`
    )
    .join('\n');

  const standardUrls = standardEntries
    .map(
      (entry) => `  <url>
    <loc>${baseUrl}${entry.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${multilingualUrls}
${standardUrls}
</urlset>
`;
};

// Main execution
try {
  const baseUrl = getBaseUrl();
  const sitemap = generateSitemap(baseUrl);
  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');

  console.log('✅ Sitemap generated successfully!');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`📄 Output: ${outputPath}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}

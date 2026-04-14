/**
 * Sitemap Generation Script
 *
 * Generates public/sitemap.xml with correct domain from environment.
 * Runs during build process (npm run build).
 *
 * Usage: node scripts/generate-sitemap.js
 */

import { writeFileSync, readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BASE_URL =
  process.env.VITE_PUBLIC_SITE_URL ||
  process.env.PUBLIC_SITE_URL ||
  "https://majsterai.com";

// Get base URL from environment or use fallback
const getBaseUrl = () => {
  // Priority: explicit site URL → hardcoded production domain.
  // NOTE: VERCEL_URL is intentionally excluded — Vercel injects it automatically
  // on every deployment (including preview builds), which would cause the sitemap
  // to be generated with a preview hostname (e.g. majster-ai-oferty-abc.vercel.app)
  // instead of the canonical production domain. This creates SEO domain leakage.
  const envUrl =
    process.env.VITE_PUBLIC_SITE_URL ||
    process.env.PUBLIC_SITE_URL ||
    null;

  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash
  }

  // Default fallback — used when no env vars are set (e.g. local dev without .env)
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

/**
 * Update the Sitemap directive in public/robots.txt to match the build-time base URL.
 * Only the Sitemap line is replaced — all other directives are preserved.
 */
const updateRobotsTxt = (baseUrl) => {
  const robotsPath = join(__dirname, '..', 'public', 'robots.txt');
  try {
    const content = readFileSync(robotsPath, 'utf-8');
    const updated = content.replace(
      /^Sitemap:.*$/m,
      `Sitemap: ${baseUrl}/sitemap.xml`
    );
    writeFileSync(robotsPath, updated, 'utf-8');
    console.log(`🤖 robots.txt updated: Sitemap → ${baseUrl}/sitemap.xml`);
  } catch (err) {
    // Non-fatal: robots.txt may not exist in all environments
    console.warn('⚠️  Could not update robots.txt:', err.message);
  }
};

// Main execution
try {
  const baseUrl = getBaseUrl();
  const sitemap = generateSitemap(baseUrl);
  const outputPath = join(__dirname, '..', 'public', 'sitemap.xml');

  writeFileSync(outputPath, sitemap, 'utf-8');
  updateRobotsTxt(baseUrl);

  console.log('✅ Sitemap generated successfully!');
  console.log(`📍 Base URL: ${baseUrl}`);
  console.log(`📄 Output: ${outputPath}`);
} catch (error) {
  console.error('❌ Error generating sitemap:', error);
  process.exit(1);
}

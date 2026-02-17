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

  const entries = [
    { path: '/', changefreq: 'weekly', priority: 1.0 },
    { path: '/login', changefreq: 'monthly', priority: 0.8 },
    { path: '/register', changefreq: 'monthly', priority: 0.8 },
    { path: '/legal/privacy', changefreq: 'monthly', priority: 0.5 },
    { path: '/legal/terms', changefreq: 'monthly', priority: 0.5 },
    { path: '/legal/cookies', changefreq: 'monthly', priority: 0.4 },
    { path: '/legal/dpa', changefreq: 'yearly', priority: 0.3 },
    { path: '/legal/rodo', changefreq: 'yearly', priority: 0.4 },
  ];

  const urls = entries
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
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
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

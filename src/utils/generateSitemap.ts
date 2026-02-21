/**
 * Sitemap Generator Utility
 *
 * Generates sitemap.xml content with the correct base URL from environment.
 * Used during build to create SEO-friendly sitemap with proper domain.
 */

export interface SitemapEntry {
  path: string;
  lastmod: string;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  priority: number;
}

export function generateSitemap(baseUrl: string, entries: SitemapEntry[]): string {
  const urls = entries.map((entry) => `  <url>
    <loc>${baseUrl}${entry.path}</loc>
    <lastmod>${entry.lastmod}</lastmod>
    <changefreq>${entry.changefreq}</changefreq>
    <priority>${entry.priority}</priority>
  </url>`).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}

/**
 * Get base URL from environment or fallback
 */
export function getBaseUrl(): string {
  // Priority: env var → window.location.origin → fallback
  if (typeof import.meta.env.VITE_PUBLIC_SITE_URL === 'string' && import.meta.env.VITE_PUBLIC_SITE_URL) {
    return import.meta.env.VITE_PUBLIC_SITE_URL.replace(/\/$/, ''); // Remove trailing slash
  }

  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Fallback for SSR/build time (shouldn't normally happen)
  return 'https://majster-ai-oferty.vercel.app'; // TEMP: use Vercel URL until custom domain is configured
}

/**
 * Default sitemap entries for Majster.AI
 */
export function getDefaultSitemapEntries(): SitemapEntry[] {
  const lastmod = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

  return [
    {
      path: '/',
      lastmod,
      changefreq: 'weekly',
      priority: 1.0,
    },
    {
      path: '/login',
      lastmod,
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      path: '/register',
      lastmod,
      changefreq: 'monthly',
      priority: 0.8,
    },
    {
      path: '/legal/privacy',
      lastmod,
      changefreq: 'monthly',
      priority: 0.5,
    },
    {
      path: '/legal/terms',
      lastmod,
      changefreq: 'monthly',
      priority: 0.5,
    },
    {
      path: '/legal/cookies',
      lastmod,
      changefreq: 'monthly',
      priority: 0.4,
    },
    {
      path: '/legal/dpa',
      lastmod,
      changefreq: 'yearly',
      priority: 0.3,
    },
    {
      path: '/legal/rodo',
      lastmod,
      changefreq: 'yearly',
      priority: 0.4,
    },
  ];
}

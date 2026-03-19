/**
 * getSiteUrl — single source of truth for the public site URL.
 *
 * Priority:
 *   1. VITE_PUBLIC_SITE_URL (set in Vercel environment variables)
 *   2. window.location.origin (runtime fallback — only available in browser)
 *   3. '' (empty string — SSR / build-time paths that should not happen at runtime)
 *
 * Usage:
 *   import { getSiteUrl } from '@/lib/siteUrl';
 *   const url = `${getSiteUrl()}/offer/...`;
 */
export function getSiteUrl(): string {
  const envUrl = import.meta.env.VITE_PUBLIC_SITE_URL as string | undefined;
  if (envUrl) return envUrl.replace(/\/$/, '');

  if (typeof window !== 'undefined') return window.location.origin;

  return '';
}

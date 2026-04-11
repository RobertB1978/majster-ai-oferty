import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export interface BackNavigationResult {
  /** Parent route to navigate to, or null when there is no logical parent. */
  backTo: string | null;
  /** Translated label of the destination (e.g. "Dashboard", "Projekty"). */
  backLabel: string;
}

/**
 * Maps the current pathname to its logical parent in the navigation hierarchy.
 *
 * Hierarchy:
 *   /app/dashboard              → null (top-level home, no back)
 *   /app/projects/:id/quote     → /app/projects/:id
 *   /app/projects/:id/pdf       → /app/projects/:id
 *   /app/projects/*             → /app/projects
 *   /app/offers/*               → /app/offers
 *   /app/* (any other)          → /app/dashboard
 *   /admin/dashboard            → /app/dashboard  (exit admin back to app)
 *   /admin/* (any other)        → /admin/dashboard
 */
function resolveParentRoute(pathname: string): { to: string | null; labelKey: string } {
  // === APP ZONE ===
  if (pathname.startsWith('/app/')) {
    // Top-level: no back
    if (pathname === '/app/dashboard') return { to: null, labelKey: '' };

    // Level 3: project sub-pages (quote, pdf) → specific project hub
    const projectSubMatch = pathname.match(/^(\/app\/projects\/[^/]+)\/(quote|pdf)$/);
    if (projectSubMatch) {
      return { to: projectSubMatch[1], labelKey: 'nav.project' };
    }

    // Level 2: any path under /app/projects/ → projects list
    if (pathname.startsWith('/app/projects/')) {
      return { to: '/app/projects', labelKey: 'nav.projects' };
    }

    // Level 2: any path under /app/offers/ → offers list
    if (pathname.startsWith('/app/offers/')) {
      return { to: '/app/offers', labelKey: 'nav.offers' };
    }

    // Level 1: all other app pages → dashboard
    return { to: '/app/dashboard', labelKey: 'nav.dashboard' };
  }

  // === ADMIN ZONE ===
  if (pathname.startsWith('/admin/')) {
    // Admin dashboard → back to customer app
    if (pathname === '/admin/dashboard') {
      return { to: '/app/dashboard', labelKey: 'adminNav.backToApp' };
    }
    // Other admin pages → admin dashboard
    return { to: '/admin/dashboard', labelKey: 'nav.dashboard' };
  }

  return { to: null, labelKey: '' };
}

export function useBackNavigation(): BackNavigationResult {
  const { pathname } = useLocation();
  const { t } = useTranslation();

  const { to, labelKey } = resolveParentRoute(pathname);

  return {
    backTo: to,
    backLabel: labelKey ? t(labelKey) : '',
  };
}

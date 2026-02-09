import { describe, it, expect } from 'vitest';

/**
 * Performance regression guard.
 *
 * These tests verify structural properties of the codebase that affect
 * page navigation performance. They run in CI and catch regressions.
 */

describe('Performance Regression Guards', () => {
  describe('Lazy-loaded routes', () => {
    it('App.tsx uses React.lazy for all app pages', async () => {
      const fs = await import('fs');
      const appContent = fs.readFileSync('src/App.tsx', 'utf-8');

      // All major app pages should be lazy-loaded
      const lazyPages = [
        'Dashboard', 'Clients', 'Projects', 'NewProject', 'ProjectDetail',
        'QuoteEditor', 'CompanyProfile', 'ItemTemplates', 'Settings',
        'PdfGenerator', 'Calendar', 'Analytics', 'Team', 'Finance',
        'Marketplace', 'Billing', 'OfferApproval',
        // Admin zone: individually lazy-loaded for separate chunk splitting
        'AdminDashboardPage', 'AdminUsersPage', 'AdminThemePage',
      ];

      for (const page of lazyPages) {
        expect(appContent).toContain(`const ${page} = lazy(`);
      }
    });

    it('Auth pages are NOT lazy-loaded (critical path)', async () => {
      const fs = await import('fs');
      const appContent = fs.readFileSync('src/App.tsx', 'utf-8');

      // Auth pages should be eager-loaded for fast login experience
      expect(appContent).toContain('import Login from');
      expect(appContent).toContain('import Register from');
    });
  });

  describe('AppLayout performance', () => {
    it('AiChatAgent is lazy-loaded in AppLayout', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

      // AiChatAgent should be lazy-loaded to avoid blocking route transitions
      expect(content).toContain("lazy(() => import('@/components/ai/AiChatAgent')");
      expect(content).toContain('<Suspense fallback={null}>');
    });

    it('OnboardingModal is lazy-loaded in AppLayout', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

      expect(content).toContain("lazy(() => import('@/components/onboarding/OnboardingModal')");
    });

    it('no artificial delay before showing content', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('src/components/layout/AppLayout.tsx', 'utf-8');

      // Should NOT have setTimeout for showContent
      expect(content).not.toContain('setTimeout(() => setShowContent(true)');
    });
  });

  describe('PageTransition performance', () => {
    it('animation durations are under 200ms', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('src/components/layout/PageTransition.tsx', 'utf-8');

      // Extract duration values with regex
      const durations = [...content.matchAll(/duration:\s*([\d.]+)/g)].map(m => parseFloat(m[1]));

      for (const duration of durations) {
        expect(duration).toBeLessThanOrEqual(0.2);
      }
    });
  });

  describe('Query caching', () => {
    it('financial hooks have staleTime configured', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('src/hooks/useFinancialReports.ts', 'utf-8');

      // Both useFinancialReports and useFinancialSummary should have staleTime
      const staleTimeCount = (content.match(/staleTime:/g) || []).length;
      expect(staleTimeCount).toBeGreaterThanOrEqual(2);
    });

    it('AI chat hooks have staleTime configured', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('src/hooks/useAiChatHistory.ts', 'utf-8');

      const staleTimeCount = (content.match(/staleTime:/g) || []).length;
      expect(staleTimeCount).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Bundle structure', () => {
    it('vite config has manual chunks for vendor splitting', async () => {
      const fs = await import('fs');
      const content = fs.readFileSync('vite.config.ts', 'utf-8');

      expect(content).toContain("'react-vendor'");
      expect(content).toContain("'ui-vendor'");
      expect(content).toContain("'supabase-vendor'");
      expect(content).toContain("'form-vendor'");
      expect(content).toContain("'charts-vendor'");
    });
  });
});

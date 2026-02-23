/**
 * E2E — CAPTCHA (Cloudflare Turnstile) — Δ8
 *
 * Deterministic approach:
 * - Block the Turnstile CDN so the widget never loads in CI.
 * - Verify that the CAPTCHA container (data-testid="turnstile-widget") is
 *   rendered on the Register page (it is always mounted so the widget can
 *   be injected when VITE_TURNSTILE_ENABLED=true in production).
 * - Verify that the CAPTCHA container is NOT present on the Login page
 *   before any failed attempts.
 *
 * When VITE_TURNSTILE_ENABLED is falsy (the default in dev/CI), the
 * TurnstileWidget component renders as a hidden placeholder and
 * immediately calls onVerify('bypass'), so forms remain fully functional.
 */

import { test, expect, Page } from '@playwright/test';

test.setTimeout(120000);

async function waitForReactHydration(page: Page) {
  page.setDefaultTimeout(20000);
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector('#root');
        return root && root.children.length > 0;
      },
      { timeout: 15000 },
    )
    .catch(() => {
      console.warn('⚠️ React app did not mount within timeout');
    });

  const delay = process.env.CI ? 2000 : 500;
  await page.waitForTimeout(delay);
}

test.describe('CAPTCHA — Turnstile widget placement', () => {
  test.beforeEach(async ({ page }) => {
    page.setDefaultTimeout(20000);

    // Block Cloudflare Turnstile CDN — widget renders as container-only in tests
    await page.route('**/challenges.cloudflare.com/**', (route) => {
      route.fulfill({ status: 200, body: '' });
    });

    // Standard: block analytics that cause network noise
    await page.route('**/*', (route) => {
      const url = route.request().url();
      const { hostname } = new URL(url);
      const isLocal =
        hostname === 'localhost' || hostname === '127.0.0.1';
      const shouldBlock =
        !isLocal &&
        /(sentry|analytics|google-analytics|gtag|facebook|tracking)/i.test(
          url,
        );
      if (shouldBlock) route.abort();
      else route.continue();
    });

    await page.route('https://fonts.googleapis.com/**', (route) => {
      route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    });
    await page.route('https://fonts.gstatic.com/**', (route) => {
      route.fulfill({ status: 200, body: '' });
    });
  });

  test('CAPTCHA container is present on /register', async ({ page }) => {
    console.log('🧪 CAPTCHA: widget container on Register page');

    await page.goto('/register', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await waitForReactHydration(page);

    // The TurnstileWidget mounts unconditionally on Register.
    // In test mode (disabled) it renders a hidden div; in prod it renders the
    // Turnstile iframe inside it. Either way the container must be in DOM.
    const widget = page.locator('[data-testid="turnstile-widget"]');
    await expect(widget).toBeAttached({ timeout: 10000 });

    console.log('✅ CAPTCHA container is in DOM on /register');
  });

  test('CAPTCHA container is absent on /login with 0 failed attempts', async ({
    page,
  }) => {
    console.log('🧪 CAPTCHA: no widget on fresh /login');

    await page.goto('/login', {
      waitUntil: 'domcontentloaded',
      timeout: 60000,
    });

    await waitForReactHydration(page);

    // The TurnstileWidget is only mounted on Login after 3 failed attempts.
    const widget = page.locator('[data-testid="turnstile-widget"]');
    await expect(widget).not.toBeAttached({ timeout: 5000 });

    console.log('✅ No CAPTCHA widget on fresh /login (expected)');
  });
});

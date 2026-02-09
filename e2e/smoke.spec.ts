/**
 * E2E Smoke Tests - Security Pack Δ1 - PROMPT 3/10
 * Rewritten for CI stability and CodeQL compliance
 * Uses role-based selectors (Playwright best practices)
 *
 * React Hydration Fix: Based on Playwright community best practices
 * - https://betterstack.com/community/guides/testing/avoid-flaky-playwright-tests/
 * - https://refine.dev/blog/playwright-react/
 */

import { test, expect, Page } from '@playwright/test';

// Increase timeout for all tests
test.setTimeout(180000); // 3 minutes per test (increased for CI)

/**
 * Helper: Wait for React hydration to complete
 * React apps render static HTML first, then "hydrate" with JS event listeners.
 * Playwright can be too fast and interact before hydration completes, especially in CI.
 *
 * CRITICAL FIX: Explicit timeout to prevent infinite hanging
 * - https://github.com/microsoft/playwright/issues/19835
 */
async function waitForReactHydration(page: Page) {
  // CRITICAL: Set page timeout FIRST to prevent infinite hanging
  page.setDefaultTimeout(20000); // 20s max per operation

  // Wait for DOM to be ready (with explicit timeout)
  await page.waitForLoadState('domcontentloaded', { timeout: 15000 });

  // Wait for React app to mount (with EXPLICIT timeout)
  // CRITICAL: waitForFunction default timeout is 0 (infinite) if not specified!
  const hasRoot = await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return root && root.children.length > 0;
  }, { timeout: 15000 }) // EXPLICIT timeout
    .then(() => true)
    .catch(() => false);

  if (!hasRoot) {
    console.warn('⚠️ React app did not mount within timeout');
  }

  // Extra wait in CI (CI environments are slower)
  if (process.env.CI) {
    await page.waitForTimeout(2000);
  } else {
    await page.waitForTimeout(500);
  }
}

test.describe('Smoke Tests', () => {

  // Helper: Add page error listener and block analytics to all tests
  test.beforeEach(async ({ page }) => {
    // CRITICAL: Set default timeout to prevent infinite hanging
    page.setDefaultTimeout(20000); // 20s max per operation

    // CRITICAL: Block external analytics/tracking requests that can cause infinite network activity
    // Only block non-localhosts to avoid killing local assets like /src/lib/sentry.ts
    await page.route('**/*', (route) => {
      const url = route.request().url();
      const { hostname } = new URL(url);
      const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
      const shouldBlock = !isLocal && /(sentry|analytics|google-analytics|gtag|facebook|tracking)/i.test(url);

      if (shouldBlock) {
        route.abort();
      } else {
        route.continue();
      }
    });
    await page.route('https://fonts.googleapis.com/**', route => {
      route.fulfill({ status: 200, contentType: 'text/css', body: '' });
    });
    await page.route('https://fonts.gstatic.com/**', route => {
      route.fulfill({ status: 200, body: '' });
    });

    // Also block common tracking pixels/beacons
    await page.route('**/*.{gif,png}?*{track,pixel,beacon}*', route => {
      route.abort();
    });

    page.on('pageerror', (error) => {
      // Log JS errors but redact potential secrets
      const message = error.message.replace(/password|token|secret|key/gi, '[REDACTED]');
      console.error('❌ Page JavaScript Error:', message);
      throw new Error(`Page error: ${message}`);
    });

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        const text = msg.text().replace(/password|token|secret|key/gi, '[REDACTED]');
        console.error('Console error:', text);
      }
    });
  });

  test('unauthenticated user sees landing page at root', async ({ page }) => {
    console.log('🧪 Test: Redirect to login for unauthenticated user');

    // Go to root - should show public Landing page (no auth required)
    await page.goto('/', {
      waitUntil: 'domcontentloaded', // Changed from networkidle (faster in CI)
      timeout: 90000
    });

    // Wait for React hydration
    await waitForReactHydration(page);

    // Verify landing page loaded (public, no redirect)
    const heading = page.getByRole('heading', { name: /cyfrowe narzędzie/i });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify login link is available
    const loginLink = page.getByRole('link', { name: /zaloguj się/i });
    await expect(loginLink).toBeVisible({ timeout: 15000 });

    console.log('✅ Landing page visible for unauthenticated user');
  });

  test('login page renders with accessible form', async ({ page }) => {
    console.log('🧪 Test: Login page accessibility');

    await page.goto('/login', {
      waitUntil: 'domcontentloaded', // Changed from networkidle
      timeout: 90000
    });

    // Wait for React hydration (CRITICAL for CI)
    await waitForReactHydration(page);

    // Take screenshot for debugging (safe - no form values captured)
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });

    // Check for heading first (proves page loaded)
    const heading = page.getByRole('heading', { name: /majster\.ai/i });
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Check for email input using label (WCAG compliant)
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible({ timeout: 15000 });
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Check for password input using label (WCAG compliant)
    const passwordInput = page.getByLabel(/hasło/i);
    await expect(passwordInput).toBeVisible({ timeout: 15000 });
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Check for submit button
    const submitButton = page.getByRole('button', { name: /zaloguj się/i });
    await expect(submitButton).toBeVisible({ timeout: 15000 });
    await expect(submitButton).toHaveAttribute('type', 'submit');

    console.log('✅ Login page renders with accessible form');
  });

  test('protected route redirects to login', async ({ page }) => {
    console.log('🧪 Test: Protected route redirect');

    await page.goto('/dashboard', {
      waitUntil: 'domcontentloaded', // Changed from networkidle
      timeout: 90000
    });

    // Wait for React hydration
    await waitForReactHydration(page);

    // Wait for redirect to login (AppLayout auth guard)
    await page.waitForFunction(() => window.location.pathname.includes('/login'), { timeout: 45000 });

    console.log('Current URL:', page.url());
    expect(page.url()).toMatch(/\/login/);

    // Verify we're on login page
    const heading = page.getByRole('heading', { name: /majster\.ai/i });
    await expect(heading).toBeVisible({ timeout: 15000 });

    console.log('✅ Protected route redirects to login');
  });

  test('app serves static assets correctly', async ({ page }) => {
    console.log('🧪 Test: Static assets');

    const response = await page.goto('/login', {
      waitUntil: 'domcontentloaded', // Changed from networkidle
      timeout: 90000
    });

    expect(response?.status()).toBe(200);

    // Wait for React hydration
    await waitForReactHydration(page);

    // Check that React app mounted by verifying root element exists
    const root = page.locator('#root');
    await expect(root).toBeAttached({ timeout: 15000 });

    // Verify root has content (React rendered)
    const rootHTML = await root.innerHTML();
    expect(rootHTML.length).toBeGreaterThan(100);

    console.log('✅ App serves static assets correctly');
  });
});

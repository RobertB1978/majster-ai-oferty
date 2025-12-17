/**
 * E2E Smoke Tests - MINIMAL CORE PACK
 * Stabilized for production CI gate
 *
 * PRINCIPLES:
 * - No sleep/waitForTimeout
 * - Fast fail (30s test timeout, 5s expect timeout)
 * - Only critical business paths
 * - No test dependencies
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Smoke Tests - Core Business Paths', () => {

  test.beforeEach(async ({ page }) => {
    // Block analytics to prevent networkidle delays
    await page.route('**/*{sentry,analytics,google-analytics,gtag,facebook,tracking}*', route => {
      route.abort();
    });
    await page.route('**/*.{gif,png}?*{track,pixel,beacon}*', route => {
      route.abort();
    });

    // Fail on JS errors
    page.on('pageerror', (error) => {
      const message = error.message.replace(/password|token|secret|key/gi, '[REDACTED]');
      console.error('❌ Page JavaScript Error:', message);
      throw new Error(`Page error: ${message}`);
    });
  });

  test('app boots without JS errors', async ({ page }) => {
    console.log('🧪 Test: App boots');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Verify React app mounted
    const root = page.locator('#root');
    await expect(root).toBeAttached();

    // Verify root has content (React rendered)
    await expect(root).not.toBeEmpty();

    console.log('✅ App boots without errors');
  });

  test('unauthenticated user redirects to login', async ({ page }) => {
    console.log('🧪 Test: Auth guard redirect');

    await page.goto('/', { waitUntil: 'domcontentloaded' });

    // Should redirect to /login
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);

    // Verify login page loaded
    const heading = page.getByRole('heading', { name: /majster\.ai/i });
    await expect(heading).toBeVisible();

    console.log('✅ Auth guard redirect works');
  });

  test('login page renders with accessible form', async ({ page }) => {
    console.log('🧪 Test: Login page UI');

    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Check heading
    const heading = page.getByRole('heading', { name: /majster\.ai/i });
    await expect(heading).toBeVisible();

    // Check email input (WCAG compliant)
    const emailInput = page.getByLabel(/email/i);
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute('type', 'email');

    // Check password input (WCAG compliant)
    const passwordInput = page.getByLabel(/hasło/i);
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Check submit button
    const submitButton = page.getByRole('button', { name: /zaloguj się/i });
    await expect(submitButton).toBeVisible();
    await expect(submitButton).toHaveAttribute('type', 'submit');

    console.log('✅ Login page UI renders correctly');
  });

  test('protected route enforces auth guard', async ({ page }) => {
    console.log('🧪 Test: Protected route guard');

    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

    // Should redirect to login
    await page.waitForURL(/\/login/);
    expect(page.url()).toMatch(/\/login/);

    // Verify we're on login page
    const heading = page.getByRole('heading', { name: /majster\.ai/i });
    await expect(heading).toBeVisible();

    console.log('✅ Protected route guard works');
  });
});

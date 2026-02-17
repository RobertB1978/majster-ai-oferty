/**
 * MVP Gate — P0-LOGOUT E2E Test
 *
 * Validates:
 *  AC1: Logout button triggers signOut + redirects to /login
 *  AC2: After logout, /app/* routes redirect to /login (guard)
 *
 * OWNER_ACTION_REQUIRED:
 *   Full integration test (login → logout → verify) requires:
 *     TEST_EMAIL and TEST_PASSWORD set as env vars or CI secrets.
 *   Without credentials, only the auth-guard path is validated.
 */

import { test, expect, type Page } from '@playwright/test';

// ──────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────

async function waitForReactApp(page: Page) {
  page.setDefaultTimeout(20_000);
  await page.waitForLoadState('domcontentloaded', { timeout: 15_000 });
  await page
    .waitForFunction(
      () => {
        const root = document.querySelector('#root');
        return root && root.children.length > 0;
      },
      { timeout: 15_000 },
    )
    .catch(() => {
      /* app may not have mounted yet */
    });
  if (process.env.CI) await page.waitForTimeout(2_000);
}

async function blockExternalRequests(page: Page) {
  await page.route('**/*', (route) => {
    const url = route.request().url();
    const { hostname } = new URL(url);
    const isLocal = hostname === 'localhost' || hostname === '127.0.0.1';
    if (
      !isLocal &&
      /(sentry|analytics|google-analytics|gtag|facebook|tracking)/i.test(url)
    ) {
      return route.abort();
    }
    return route.continue();
  });
}

// ──────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────

test.describe('P0-LOGOUT', () => {
  test.beforeEach(async ({ page }) => {
    await blockExternalRequests(page);
  });

  /**
   * AC2: Unauthenticated access to /app/* must redirect to /login.
   * This proves the route guard is active and reactive to missing auth.
   */
  test('protected routes redirect to /login when unauthenticated', async ({
    page,
  }) => {
    const protectedPaths = ['/app/dashboard', '/app/jobs', '/app/customers'];

    for (const path of protectedPaths) {
      await page.goto(path, {
        waitUntil: 'domcontentloaded',
        timeout: 60_000,
      });
      await waitForReactApp(page);

      await page.waitForFunction(
        () => window.location.pathname.includes('/login'),
        { timeout: 30_000 },
      );

      expect(page.url()).toContain('/login');
    }
  });

  /**
   * AC1 + AC4 (integration): Log in, click Logout, verify redirect + guard.
   *
   * Requires TEST_EMAIL / TEST_PASSWORD env vars.
   * If missing, the test is skipped (not failed) and marked
   * OWNER_ACTION_REQUIRED.
   */
  test('logout clears session and redirects to /login', async ({ page }) => {
    const email = process.env.TEST_EMAIL;
    const password = process.env.TEST_PASSWORD;

    if (!email || !password) {
      test.skip(
        true,
        'OWNER_ACTION_REQUIRED: set TEST_EMAIL and TEST_PASSWORD env vars to run this test',
      );
      return;
    }

    // --- Login ---
    await page.goto('/login', {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await waitForReactApp(page);

    await page.getByLabel(/email/i).fill(email);
    await page.getByLabel(/has/i).fill(password); // "hasło" in PL
    await page.getByRole('button', { name: /zaloguj|log\s*in|sign\s*in/i }).click();

    // Wait for dashboard (successful login)
    await page.waitForURL('**/app/dashboard**', { timeout: 30_000 });

    // --- Logout ---
    const logoutBtn =
      page.getByTestId('logout-button').or(
        page.getByTestId('logout-button-mobile'),
      );
    await logoutBtn.first().click();

    // AC1: Should redirect to /login within 2 seconds
    await page.waitForURL('**/login**', { timeout: 2_000 });
    expect(page.url()).toContain('/login');

    // AC2: Trying to visit a protected route should bounce back to /login
    await page.goto('/app/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 30_000,
    });
    await waitForReactApp(page);

    await page.waitForFunction(
      () => window.location.pathname.includes('/login'),
      { timeout: 15_000 },
    );
    expect(page.url()).toContain('/login');
  });
});

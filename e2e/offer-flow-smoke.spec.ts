import { test, expect, type Page } from '@playwright/test';

async function waitForHydration(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForFunction(() => {
    const root = document.querySelector('#root');
    return Boolean(root && root.children.length > 0);
  });
}

test.describe('Offer flow smoke', () => {
  test('redirects unauthenticated user from offer wizard to login', async ({ page }) => {
    await page.goto('/app/offers/new', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    await page.waitForFunction(() => window.location.pathname.includes('/login'));
    await expect(page).toHaveURL(/\/login/);
  });

  test('redirects unauthenticated user from offer detail route to login', async ({ page }) => {
    await page.goto('/app/offers/test-offer-id', { waitUntil: 'domcontentloaded' });
    await waitForHydration(page);

    await page.waitForFunction(() => window.location.pathname.includes('/login'));
    await expect(page).toHaveURL(/\/login/);
  });
});

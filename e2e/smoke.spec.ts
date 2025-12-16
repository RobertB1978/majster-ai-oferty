/**
 * E2E Smoke Tests - Security Pack Δ1 - PROMPT 3/10
 * Critical user flows that must work in production
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app loads without blank screen', async ({ page }) => {
    await page.goto('/');

    // App should render something (not blank)
    const body = await page.locator('body');
    await expect(body).toBeVisible();

    // Check for root div
    const root = await page.locator('#root');
    await expect(root).toBeVisible();

    // Should not show fatal error
    const errorText = await page.textContent('body');
    expect(errorText).not.toContain('Application Error');
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL(/\/(login|auth)/);

    // Login form should be visible
    const loginForm = page.locator('form');
    await expect(loginForm).toBeVisible();
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Check for email input
    const emailInput = page.locator('input[type="email"], input[name="email"]');
    await expect(emailInput).toBeVisible();

    // Check for password input
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    await expect(passwordInput).toBeVisible();

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();
  });

  test('navigation works', async ({ page }) => {
    await page.goto('/');

    // Page should load
    await expect(page).toHaveURL(/\//);

    // No console errors (except expected network errors)
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    await page.waitForTimeout(1000);

    // Filter out expected errors
    const unexpectedErrors = errors.filter(err =>
      !err.includes('Failed to fetch') &&
      !err.includes('NetworkError')
    );

    expect(unexpectedErrors.length).toBe(0);
  });
});

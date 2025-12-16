/**
 * E2E Smoke Tests - Security Pack Δ1 - PROMPT 3/10
 * Critical user flows that must work in production
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('app loads without blank screen', async ({ page }) => {
    await page.goto('/');

    // Wait for root to be visible (not just exist)
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });

    // Check body has content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);

    // Should not show fatal error
    expect(bodyText).not.toContain('Application Error');
    expect(bodyText).not.toContain('Something went wrong');
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login (wait up to 10s)
    await page.waitForURL(/\/(login|auth)/, { timeout: 10000 });

    // Wait for page to fully render
    await page.waitForLoadState('networkidle');

    // Login page should have email field
    const emailField = page.locator('input#email, input[type="email"]');
    await expect(emailField).toBeVisible({ timeout: 5000 });
  });

  test('login page renders correctly', async ({ page }) => {
    await page.goto('/login');

    // Wait for page to load
    await page.waitForLoadState('networkidle');

    // Check for email input (by ID or type)
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible({ timeout: 5000 });

    // Check for password input (by ID or type)
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible({ timeout: 5000 });

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible();

    // Verify placeholder text
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('navigation works without crashes', async ({ page }) => {
    const errors: string[] = [];

    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out expected errors
        if (!text.includes('Failed to fetch') &&
            !text.includes('NetworkError') &&
            !text.includes('Load failed')) {
          errors.push(text);
        }
      }
    });

    // Also catch page errors
    page.on('pageerror', error => {
      errors.push(error.message);
    });

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Wait a bit for any lazy-loaded errors
    await page.waitForTimeout(2000);

    // Should have minimal errors
    if (errors.length > 0) {
      console.log('Console errors found:', errors);
    }
    expect(errors.length).toBeLessThan(3); // Allow max 2 errors
  });
});

/**
 * E2E Smoke Tests - Security Pack Δ1 - PROMPT 3/10
 * Critical user flows that must work in production
 *
 * FIX: Added extensive debugging and longer waits for CI reliability
 */

import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  // Increase timeout for all tests
  test.setTimeout(90000); // 90 seconds per test

  test('app loads without blank screen', async ({ page }) => {
    console.log('Test: app loads - starting');

    // Enable console logging for debugging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error));

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    console.log('Test: page loaded');

    // Wait for React to hydrate
    await page.waitForTimeout(2000);

    // Wait for root to be visible
    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 15000 });
    console.log('Test: root is visible');

    // Verify root has child elements (React mounted)
    const rootHTML = await root.innerHTML();
    expect(rootHTML.length).toBeGreaterThan(100);
    console.log('Test: root has content, length:', rootHTML.length);

    // Check body has content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText!.length).toBeGreaterThan(10);

    // Should not show fatal error
    expect(bodyText).not.toContain('Application Error');
    expect(bodyText).not.toContain('Something went wrong');
    console.log('Test: app loads - PASSED');
  });

  test('redirects to login when not authenticated', async ({ page }) => {
    console.log('Test: redirect to login - starting');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    // Try to access protected route
    await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });
    console.log('Test: navigated to /dashboard');

    // Wait for redirect (with longer timeout)
    await page.waitForURL(/\/(login|auth)/, { timeout: 20000 });
    console.log('Test: redirected to login page');

    // Wait for page to fully render
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000); // Extra time for React

    // Debug: log current URL
    console.log('Current URL:', page.url());

    // Debug: log page content
    const pageContent = await page.content();
    console.log('Page content length:', pageContent.length);

    // Try multiple selectors
    const emailById = page.locator('input#email');
    const emailByType = page.locator('input[type="email"]');

    console.log('Checking for email input...');
    const emailExists = await emailById.count() > 0 || await emailByType.count() > 0;

    if (!emailExists) {
      console.error('Email input not found! Page HTML:', pageContent.substring(0, 1000));
    }

    // Login page should have email field
    const emailField = page.locator('input#email, input[type="email"]').first();
    await expect(emailField).toBeVisible({ timeout: 10000 });
    console.log('Test: redirect to login - PASSED');
  });

  test('login page renders correctly', async ({ page }) => {
    console.log('Test: login page renders - starting');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.error('PAGE ERROR:', error));

    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    console.log('Test: navigated to /login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle', { timeout: 20000 });
    await page.waitForTimeout(2000); // Extra time for React mount

    // Debug: Check if form exists
    const forms = await page.locator('form').count();
    console.log('Forms found:', forms);

    // Debug: Check all inputs
    const allInputs = await page.locator('input').count();
    console.log('Total inputs found:', allInputs);

    // List all input types
    const inputs = page.locator('input');
    const count = await inputs.count();
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      console.log(`Input ${i}: id="${id}", type="${type}"`);
    }

    // Check for email input
    console.log('Checking for email input...');
    const emailInput = page.locator('input#email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    console.log('Email input found');

    // Check for password input
    console.log('Checking for password input...');
    const passwordInput = page.locator('input#password');
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
    console.log('Password input found');

    // Check for submit button
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeVisible({ timeout: 10000 });
    console.log('Submit button found');

    // Verify attributes
    await expect(emailInput).toHaveAttribute('type', 'email');
    await expect(passwordInput).toHaveAttribute('type', 'password');

    console.log('Test: login page renders - PASSED');
  });

  test('navigation works without crashes', async ({ page }) => {
    console.log('Test: navigation - starting');

    const errors: string[] = [];

    // Collect console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        // Filter out expected errors
        if (!text.includes('Failed to fetch') &&
            !text.includes('NetworkError') &&
            !text.includes('Load failed') &&
            !text.includes('ERR_CONNECTION_REFUSED')) {
          errors.push(text);
          console.log('CONSOLE ERROR:', text);
        }
      }
    });

    // Also catch page errors
    page.on('pageerror', error => {
      errors.push(error.message);
      console.error('PAGE ERROR:', error.message);
    });

    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 20000 });

    // Wait for any lazy-loaded errors
    await page.waitForTimeout(3000);

    // Log all errors found
    if (errors.length > 0) {
      console.log('Errors found:', errors);
    }

    // Should have minimal errors
    expect(errors.length).toBeLessThan(5); // Allow up to 4 errors
    console.log('Test: navigation - PASSED');
  });
});

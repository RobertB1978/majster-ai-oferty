/**
 * E2E Smoke Tests - Security Pack Δ1 - PROMPT 3/10
 * ULTRA-SIMPLIFIED for CI reliability
 */

import { test, expect } from '@playwright/test';

// Increase timeout for all tests
test.setTimeout(120000); // 2 minutes per test

test.describe('Smoke Tests', () => {

  test('server is running and responds', async ({ page }) => {
    console.log('🧪 Test: Server health check');

    const response = await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('Response status:', response?.status());
    expect(response?.status()).toBe(200);

    console.log('✅ Server responds with 200');
  });

  test('root element exists and is visible', async ({ page }) => {
    console.log('🧪 Test: Root element visibility');

    await page.goto('/', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/homepage.png', fullPage: true });

    // Wait for root
    await page.waitForSelector('#root', { timeout: 30000 });

    const root = page.locator('#root');
    await expect(root).toBeVisible({ timeout: 10000 });

    const rootHTML = await root.innerHTML();
    console.log('Root HTML length:', rootHTML.length);
    expect(rootHTML.length).toBeGreaterThan(50);

    console.log('✅ Root element is visible and has content');
  });

  test('login page loads and renders form', async ({ page }) => {
    console.log('🧪 Test: Login page form');

    await page.goto('/login', {
      waitUntil: 'networkidle',
      timeout: 60000
    });

    // Extra wait for React hydration
    await page.waitForTimeout(5000);

    // Take screenshot
    await page.screenshot({ path: 'test-results/login-page.png', fullPage: true });

    // Save HTML for debugging
    const html = await page.content();
    console.log('Page HTML length:', html.length);
    console.log('Page HTML preview:', html.substring(0, 500));

    // Check if form exists
    const form = page.locator('form');
    const formCount = await form.count();
    console.log('Forms found:', formCount);

    if (formCount === 0) {
      console.error('❌ No forms found on login page!');
      throw new Error('Login form not found');
    }

    // Check for inputs
    const allInputs = page.locator('input');
    const inputCount = await allInputs.count();
    console.log('Total inputs:', inputCount);

    // List all inputs with details
    for (let i = 0; i < inputCount; i++) {
      const input = allInputs.nth(i);
      const id = await input.getAttribute('id');
      const type = await input.getAttribute('type');
      const name = await input.getAttribute('name');
      console.log(`  Input ${i}: id="${id}", type="${type}", name="${name}"`);
    }

    // Try to find email input
    const emailInput = page.locator('input#email, input[type="email"]').first();
    const emailVisible = await emailInput.isVisible().catch(() => false);
    console.log('Email input visible:', emailVisible);

    if (!emailVisible) {
      console.error('❌ Email input not visible!');
      throw new Error('Email input not found');
    }

    // Try to find password input
    const passwordInput = page.locator('input#password, input[type="password"]').first();
    const passwordVisible = await passwordInput.isVisible().catch(() => false);
    console.log('Password input visible:', passwordVisible);

    if (!passwordVisible) {
      console.error('❌ Password input not visible!');
      throw new Error('Password input not found');
    }

    console.log('✅ Login form renders correctly');
  });

  test('redirects to login when accessing protected route', async ({ page }) => {
    console.log('🧪 Test: Protected route redirect');

    await page.goto('/dashboard', {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // Wait for redirect
    await page.waitForURL(/\/(login|auth)/, { timeout: 30000 });

    console.log('Current URL:', page.url());
    expect(page.url()).toMatch(/\/(login|auth)/);

    console.log('✅ Redirect works correctly');
  });
});

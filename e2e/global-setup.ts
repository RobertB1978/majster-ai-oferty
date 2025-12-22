/**
 * Global Setup - Ensures dev server is ready before tests run
 * Based on Playwright CI best practices from community
 *
 * CRITICAL FIX: Explicit timeouts to prevent infinite hanging
 * - https://github.com/microsoft/playwright/issues/19835
 * - https://momentic.ai/blog/playwright-pitfalls
 * - https://www.lambdatest.com/blog/playwright-timeouts/
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL || 'http://localhost:8080';
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
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

  // CRITICAL: Set default timeout to prevent infinite hanging
  // Playwright default is 30s, but page.waitForFunction default is 0 (infinite)!
  page.setDefaultTimeout(10000); // 10s per operation

  console.log(`🔍 Waiting for dev server at ${baseURL}...`);

  let ready = false;
  let attempts = 0;
  const maxAttempts = 30; // 1 minute total (30 * 2s) - reduced for faster failure

  while (!ready && attempts < maxAttempts) {
    try {
      // CRITICAL: Explicit timeout on goto (even though setDefaultTimeout is set)
      const response = await page.goto(baseURL, {
        waitUntil: 'domcontentloaded', // Faster than 'load' or 'networkidle'
        timeout: 10000
      });

      if (response && response.ok()) {
        // CRITICAL: waitForFunction with explicit timeout
        const hasRoot = await page.waitForFunction(() => {
          const root = document.querySelector('#root');
          return root && root.children.length > 0;
        }, { timeout: 8000 }) // Explicit timeout (not relying on default)
          .then(() => true)
          .catch(() => false);

        if (hasRoot) {
          // CRITICAL: innerHTML() can hang without timeout
          const innerHTML = await page.locator('#root')
            .innerHTML({ timeout: 5000 })
            .catch(() => '');

          if (innerHTML.length > 100) {
            console.log('✅ Dev server is ready and React app hydrated!');
            console.log(`   Root element has ${innerHTML.length} characters`);
            ready = true;
          }
        }
      }
    } catch (error) {
      // Ignore errors during warmup - server may still be starting
      // Only log every 10 attempts to reduce noise
      if (attempts > 0 && attempts % 10 === 0) {
        console.log(`⏳ Still waiting for server... (${attempts}/${maxAttempts})`);
      }
    }

    if (!ready) {
      attempts++;
      await page.waitForTimeout(2000); // 2s between retries
    }
  }

  await context.close();
  await browser.close();

  if (!ready) {
    console.error('❌ Dev server health check failed!');
    throw new Error(`Dev server failed to start after ${maxAttempts * 2} seconds`);
  }

  console.log('🚀 Global setup complete - tests can now run!\n');
}

export default globalSetup;

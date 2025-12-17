/**
 * Global Setup - Ensures dev server is ready before tests run
 * Based on Playwright CI best practices from community
 */

import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL || 'http://localhost:8080';
  const browser = await chromium.launch();
  const page = await browser.newPage();

  console.log(`🔍 Waiting for dev server at ${baseURL}...`);

  let ready = false;
  let attempts = 0;
  const maxAttempts = 60; // 2 minutes (60 * 2s)

  while (!ready && attempts < maxAttempts) {
    try {
      const response = await page.goto(baseURL, {
        waitUntil: 'domcontentloaded',
        timeout: 5000
      });

      if (response && response.ok()) {
        // Wait for React app to mount and hydrate
        await page.waitForFunction(() => {
          const root = document.querySelector('#root');
          return root && root.children.length > 0;
        }, { timeout: 5000 }).catch(() => false);

        const rootCount = await page.locator('#root').count();
        if (rootCount > 0) {
          const innerHTML = await page.locator('#root').innerHTML();
          if (innerHTML.length > 100) {
            console.log('✅ Dev server is ready and React app hydrated!');
            console.log(`   Root element has ${innerHTML.length} characters`);
            ready = true;
          }
        }
      }
    } catch (error) {
      // Ignore errors during warmup - server may still be starting
    }

    if (!ready) {
      attempts++;
      if (attempts % 10 === 0) {
        console.log(`⏳ Still waiting for server... (${attempts}/${maxAttempts})`);
      }
      await page.waitForTimeout(2000);
    }
  }

  await browser.close();

  if (!ready) {
    throw new Error(`❌ Dev server failed to start after ${maxAttempts * 2} seconds`);
  }

  console.log('🚀 Global setup complete - ready to run tests!\n');
}

export default globalSetup;

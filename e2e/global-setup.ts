/**
 * Global Setup - Wait for dev server to be ready
 */
import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  const baseURL = config.use?.baseURL || 'http://localhost:8080';

  console.log(`Waiting for dev server at ${baseURL}...`);

  const browser = await chromium.launch();
  const page = await browser.newPage();

  let retries = 30; // 30 retries = 60 seconds
  let ready = false;

  while (retries > 0 && !ready) {
    try {
      const response = await page.goto(baseURL, {
        waitUntil: 'domcontentloaded',
        timeout: 5000
      });

      if (response && response.ok()) {
        // Check if root element exists
        const root = await page.locator('#root').count();
        if (root > 0) {
          console.log('✅ Dev server is ready!');
          ready = true;
        } else {
          console.log('⏳ Root element not found, waiting...');
        }
      }
    } catch (error) {
      console.log(`⏳ Server not ready yet, retrying... (${retries} attempts left)`);
    }

    if (!ready) {
      retries--;
      await page.waitForTimeout(2000); // Wait 2 seconds between retries
    }
  }

  await browser.close();

  if (!ready) {
    throw new Error('Dev server failed to start after 60 seconds');
  }
}

export default globalSetup;

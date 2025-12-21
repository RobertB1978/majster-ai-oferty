import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: process.env.CI ? false : true, // Sequential in CI, parallel locally
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Single retry in CI to catch real flakes
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 30000, // 30s per test - forces test stability
  expect: {
    timeout: 5000, // 5s for assertions - fail fast on issues
  },

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    // Removed actionTimeout and navigationTimeout - rely on global timeout
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        headless: true,
      },
    },
  ],

  webServer: {
    command: 'npm run dev',
    port: 8080, // CRITICAL: Use 'port' not 'url' - faster and more reliable in CI
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup - ensures server is ready and React hydrated
  globalSetup: './e2e/global-setup.ts',
});

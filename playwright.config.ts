import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially in CI for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0, // Hard cap retries to avoid long CI hangs
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 120000, // 2 minutes per test to enforce a hard cap

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10000, // 10s per action to prevent hangs
    navigationTimeout: 30000, // 30s for navigation
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
    timeout: 120000, // 2 minutes to start server to fail fast
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup - ensures server is ready and React hydrated
  globalSetup: './e2e/global-setup.ts',
});

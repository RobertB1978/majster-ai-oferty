import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Run sequentially in CI for stability
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 5 : 0, // More retries in CI (increased from 3)
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  timeout: 180000, // 3 minutes per test (increased for CI)

  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:8080',
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'on',
    actionTimeout: 45000, // 45s for each action (increased for CI)
    navigationTimeout: 90000, // 90s for navigation (increased for CI)
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
    timeout: 300000, // 5 minutes to start server (increased for CI)
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup - ensures server is ready and React hydrated
  globalSetup: './e2e/global-setup.ts',
});

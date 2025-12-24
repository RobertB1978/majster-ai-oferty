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
    env: {
      HOST: '127.0.0.1',
      PORT: '8080',
      // Safe demo defaults to avoid Supabase client throwing during CI/local runs without .env
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || 'https://demo.supabase.co',
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
    },
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start server to fail fast
    stdout: 'pipe',
    stderr: 'pipe',
  },

  // Global setup - ensures server is ready and React hydrated
  globalSetup: './e2e/global-setup.ts',
});

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  // Mirror the Vite define so __APP_VERSION__ is available in tests
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0-test'),
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'supabase/functions/**/*.test.ts', // Phase 7C: Include Edge Function tests
    ],
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'supabase/functions/_shared/validation.test.ts', // Deno test - run separately with Deno runtime
    ],
    coverage: {
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/integrations/supabase/types.ts',
      ],
      // MINIMUM FLOOR THRESHOLDS — do not lower these values.
      //
      // Purpose: Prevent coverage regression. A CI run that drops below any of
      // these values fails, signalling that tests were removed or code was added
      // without corresponding tests.
      //
      // Baseline established 2026-03-19 (actual coverage at that date):
      //   lines 45.96%  →  floor set at 40  (5pp headroom)
      //   branches 39.75% → floor set at 34
      //   functions 38.99% → floor set at 33
      //   statements 44.56% → floor set at 39
      //
      // These are the current actual coverage levels — not aspirational targets.
      // Raising a threshold before the tests actually reach that level will break CI.
      //
      // Target for next quarter (Q2 2026): lines 60%, branches 55%, functions 55%
      // When actual coverage consistently meets a target, raise the floor to match.
      thresholds: {
        lines: 40,
        branches: 34,
        functions: 33,
        statements: 39,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

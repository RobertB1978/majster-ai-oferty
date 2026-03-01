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
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        'src/integrations/supabase/types.ts',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});

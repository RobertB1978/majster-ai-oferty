import { defineConfig, PluginOption } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { sentryVitePlugin } from "@sentry/vite-plugin";
import { visualizer } from "rollup-plugin-visualizer";
import type { Connect } from "vite";

type RuntimeVersionPayload = {
  appVersion: string;
  commitSha: string;
  buildTimestamp: string;
  supabaseHost: string | null;
  supabaseProjectRefMasked: string | null;
  environment: string | null;
};

function toShortCommit(value: string | undefined): string {
  if (!value) return "unknown";
  return value.slice(0, 7);
}

function toSupabaseHost(value: string | undefined): string | null {
  if (!value) return null;

  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
}

function maskProjectRef(hostname: string | null): string | null {
  if (!hostname) return null;

  const projectRef = hostname.split(".")[0] ?? "";
  if (!projectRef) return null;
  if (projectRef.length <= 4) return `${projectRef[0] ?? ""}***`;

  return `${projectRef.slice(0, 4)}***${projectRef.slice(-2)}`;
}

function runtimeVersionPlugin(payload: RuntimeVersionPayload): PluginOption {
  return {
    name: "runtime-version-json",
    configureServer(server) {
      const handler: Connect.NextHandleFunction = (_req, res) => {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
        res.end(`${JSON.stringify(payload, null, 2)}\n`);
      };

      server.middlewares.use("/version.json", handler);
    },
    generateBundle() {
      this.emitFile({
        type: "asset",
        fileName: "version.json",
        source: `${JSON.stringify(payload, null, 2)}\n`,
      });
    },
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const appVersion = process.env.npm_package_version ?? "0.0.0";
  const commitSha = toShortCommit(
    process.env.VERCEL_GIT_COMMIT_SHA ?? process.env.GITHUB_SHA ?? process.env.COMMIT_SHA,
  );
  const buildTimestamp = new Date().toISOString();
  const supabaseHost = toSupabaseHost(process.env.VITE_SUPABASE_URL);
  const supabaseProjectRefMasked = maskProjectRef(supabaseHost);
  const environment = process.env.VERCEL_ENV ?? process.env.NODE_ENV ?? mode ?? null;

  const runtimeVersion: RuntimeVersionPayload = {
    appVersion,
    commitSha,
    buildTimestamp,
    supabaseHost,
    supabaseProjectRefMasked,
    environment,
  };

  const plugins: PluginOption[] = [
    react(),
    runtimeVersionPlugin(runtimeVersion),
  ];

  if (mode === "production" && process.env.VITE_SENTRY_AUTH_TOKEN) {
    plugins.push(sentryVitePlugin({
      org: process.env.VITE_SENTRY_ORG,
      project: process.env.VITE_SENTRY_PROJECT,
      authToken: process.env.VITE_SENTRY_AUTH_TOKEN,
      sourcemaps: {
        assets: "./dist/**",
      },
      telemetry: false,
    }));
  }

  // Bundle analysis - Security Pack Δ1 - PROMPT 7/10
  if (process.env.ANALYZE_BUNDLE === 'true') {
    plugins.push(visualizer({
      filename: './dist/stats.html',
      open: true,
      gzipSize: true,
      brotliSize: true,
    }));
  }

  return {
    // Inject package.json version at build time — consumed by src/lib/version.ts
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? '0.0.0'),
    },
    server: {
      host: "::",
      port: 8080,
    },
    plugins,
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
        "@supabase/supabase-js": path.resolve(__dirname, "./node_modules/@supabase/supabase-js/dist/main/index.js"),
      },
    },
    build: {
      // 'hidden' generates .map files for Sentry error tracking but does NOT
      // append sourceMappingURL comments to JS files, so source code is not
      // publicly accessible via browser DevTools in production.
      sourcemap: mode === "production" ? "hidden" : false,
      target: "esnext",
      minify: "esbuild",
      cssMinify: true,
      rollupOptions: {
        output: {
          manualChunks(id) {
            // ── Vendor chunks ──
            if (id.includes('node_modules')) {
              if (id.includes('react-dom') || id.includes('react-router-dom')) return 'react-vendor';
              if (id.includes('@radix-ui')) return 'ui-vendor';
              if (id.includes('@supabase')) return 'supabase-vendor';
              if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) return 'form-vendor';
              if (id.includes('recharts') || id.includes('d3-')) return 'charts-vendor';
              if (id.includes('framer-motion')) return 'framer-motion-vendor';
              if (id.includes('leaflet')) return 'leaflet-vendor';
              if (id.includes('jspdf')) return 'pdf-vendor';
              if (id.includes('html2canvas')) return 'html2canvas-vendor';
              if (id.includes('i18next')) return 'i18n-vendor';
              if (id.includes('@tanstack')) return 'query-vendor';
              if (id.includes('react-helmet')) return 'helmet-vendor';
              if (id.includes('lucide-react')) return 'icons-vendor';
              if (id.includes('date-fns')) return 'date-vendor';
              if (id.includes('dompurify')) return 'purify-vendor';
              if (id.includes('sonner')) return 'sonner-vendor';
              if (id.includes('@sentry')) return 'sentry-vendor';
              if (id.includes('qrcode')) return 'qrcode-vendor';
              if (id.includes('cmdk')) return 'cmdk-vendor';
            }
            // ── App code splitting — break up the main bundle ──
            if (id.includes('/src/components/landing/')) return 'landing';
            if (id.includes('/src/components/admin/')) return 'admin';
            if (id.includes('/src/components/calendar/')) return 'calendar';
            if (id.includes('/src/components/marketplace/')) return 'marketplace';
            if (id.includes('/src/components/documents/')) return 'documents';
            if (id.includes('/src/components/team/')) return 'team';
            if (id.includes('/src/components/finance/')) return 'finance';
            if (id.includes('/src/components/illustrations/')) return 'illustrations';
            if (id.includes('/src/components/settings/')) return 'settings';
            if (id.includes('/src/components/onboarding/')) return 'onboarding';
            if (id.includes('/src/components/billing/')) return 'billing';
            if (id.includes('/src/components/map/')) return 'map-components';
            if (id.includes('/src/components/photos/')) return 'photos';
            if (id.includes('/src/components/voice/')) return 'voice';
          },
          // Optimize chunk file naming for better caching
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js',
          assetFileNames: ({ name }) => {
            if (/\.(gif|jpe?g|png|svg|webp)$/.test(name ?? '')) {
              return 'assets/images/[name]-[hash][extname]';
            }
            if (/\.css$/.test(name ?? '')) {
              return 'assets/css/[name]-[hash][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
  };
});

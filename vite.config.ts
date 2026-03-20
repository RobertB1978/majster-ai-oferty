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
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'ui-vendor': [
              '@radix-ui/react-dialog',
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-tabs',
              '@radix-ui/react-toast',
            ],
            'supabase-vendor': ['@supabase/supabase-js'],
            'form-vendor': ['react-hook-form', 'zod', '@hookform/resolvers'],
            'charts-vendor': ['recharts'],
            // Performance pack: isolate heavy libs that are loaded on-demand
            'framer-motion-vendor': ['framer-motion'],
            'leaflet-vendor': ['leaflet'],
            'pdf-vendor': ['jspdf', 'jspdf-autotable'],
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

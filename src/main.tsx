import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/sentry";
import { APP_VERSION, APP_NAME } from "./lib/version";
import { logger } from "./lib/logger";
import { registerSink, plausibleSink } from "./lib/analytics";

// Boot checkpoint helper (splash-guard.js defines window.__BOOT)
const win = typeof window !== 'undefined' ? window as Window & { __BOOT?: (c: string, d?: string) => void } : null;
const boot = win?.__BOOT ?? ((_c: string, _d?: string) => {});

boot('BOOT_1', 'main.tsx module loaded');

// Log app version on boot (PR-01 versioning metadata)
logger.info(`${APP_NAME} v${APP_VERSION} starting`);

// Render first, initialize monitoring async to avoid blocking critical render path
try {
  const rootEl = document.getElementById("root")!;
  const root = createRoot(rootEl);
  boot('BOOT_2', 'React root created');
  root.render(<App />);
} catch (err) {
  boot('BOOT_FATAL', String(err));
  logger.error('Fatal: failed to render app', err);
  // Remove splash so user sees the error
  const splash = document.getElementById('app-splash');
  if (splash && splash.parentNode) splash.parentNode.removeChild(splash);
  const root = document.getElementById("root");
  if (root) {
    root.innerHTML = '<div style="padding:2rem;text-align:center"><h1>Majster.AI</h1><p>Wystąpił błąd podczas uruchamiania aplikacji. Odśwież stronę.</p></div>';
  }
}

// Register Plausible analytics sink AFTER render (roadmap §23.2 — ETAP 4 Hard Stop Gate)
// Plausible script loaded via index.html; sink silently no-ops in dev/localhost.
registerSink(plausibleSink);

// Initialize Sentry after first paint
// Note: Static import used here because ErrorBoundary already statically imports sentry,
// so it's already in the main bundle. Dynamic import would not reduce bundle size
// and creates build warnings.
setTimeout(() => {
  initSentry();
}, 0);

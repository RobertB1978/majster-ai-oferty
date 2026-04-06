import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import i18n, { loadLocaleAsync } from "./i18n";
import { APP_VERSION, APP_NAME } from "./lib/version";
import { logger } from "./lib/logger";
import { registerSink, plausibleSink } from "./lib/analytics";

// Boot checkpoint helper (splash-guard.js defines window.__BOOT)
const win = typeof window !== 'undefined' ? window as Window & { __BOOT?: (c: string, d?: string) => void } : null;
const boot = win?.__BOOT ?? ((_c: string, _d?: string) => {});

boot('BOOT_1', 'main.tsx module loaded');

// Log app version on boot (PR-01 versioning metadata)
logger.info(`${APP_NAME} v${APP_VERSION} starting`);

function renderApp() {
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
      root.textContent = '';
      const wrapper = document.createElement('div');
      wrapper.style.cssText = 'padding:2rem;text-align:center';
      const h1 = document.createElement('h1');
      h1.textContent = 'Majster.AI';
      const p = document.createElement('p');
      p.textContent = 'Wystąpił błąd podczas uruchamiania aplikacji. Odśwież stronę.';
      wrapper.appendChild(h1);
      wrapper.appendChild(p);
      root.appendChild(wrapper);
    }
  }
}

// Load the detected locale before rendering to avoid "flash of Polish" for EN/UK users.
// PL is always available synchronously (static import); EN/UK load as separate chunks.
const detectedLang = i18n.language;
if (detectedLang && detectedLang !== 'pl') {
  loadLocaleAsync(detectedLang).then(renderApp, renderApp);
} else {
  renderApp();
}

// Register Plausible analytics sink AFTER render (roadmap §23.2 — ETAP 4 Hard Stop Gate)
// Plausible script loaded via index.html; sink silently no-ops in dev/localhost.
registerSink(plausibleSink);

// Initialize Sentry after first paint via dynamic import.
// Sentry (~80-100 kB) is loaded asynchronously to reduce the main entry chunk.
setTimeout(() => {
  import('./lib/sentry').then(m => m.initSentry()).catch(() => {
    // Sentry init failed — non-critical, app continues without monitoring
  });
}, 0);

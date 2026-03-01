import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/sentry";
import { APP_VERSION, APP_NAME } from "./lib/version";
import { logger } from "./lib/logger";

// Log app version on boot (PR-01 versioning metadata)
logger.info(`${APP_NAME} v${APP_VERSION} starting`);

// Render first, initialize monitoring async to avoid blocking critical render path
createRoot(document.getElementById("root")!).render(<App />);

// Initialize Sentry after first paint
// Note: Static import used here because ErrorBoundary already statically imports sentry,
// so it's already in the main bundle. Dynamic import would not reduce bundle size
// and creates build warnings.
setTimeout(() => {
  initSentry();
}, 0);

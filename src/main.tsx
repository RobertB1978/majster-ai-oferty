import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { APP_VERSION, APP_NAME } from "./lib/version";
import { logger } from "./lib/logger";

// Log app version on boot (PR-01 versioning metadata)
logger.info(`${APP_NAME} v${APP_VERSION} starting`);

// Render first, initialize monitoring async to avoid blocking critical render path
createRoot(document.getElementById("root")!).render(<App />);

// Initialize Sentry after first paint — dynamic import keeps sentry out of main chunk
setTimeout(() => {
  import("./lib/sentry").then(({ initSentry }) => initSentry());
}, 0);

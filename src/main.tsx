import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/sentry";

// Render first, initialize monitoring async to avoid blocking critical render path
createRoot(document.getElementById("root")!).render(<App />);

// Initialize Sentry after first paint
// Note: Static import used here because ErrorBoundary already statically imports sentry,
// so it's already in the main bundle. Dynamic import would not reduce bundle size
// and creates build warnings.
setTimeout(() => {
  initSentry();
}, 0);

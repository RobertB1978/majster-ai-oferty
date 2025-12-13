import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";

// Render first, initialize monitoring async to avoid blocking critical render path
createRoot(document.getElementById("root")!).render(<App />);

// Lazy load Sentry AFTER first paint to improve Core Web Vitals (FCP, LCP)
setTimeout(async () => {
  const { initSentry } = await import("./lib/sentry");
  initSentry();
}, 0);

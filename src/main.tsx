import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { initSentry } from "./lib/sentry";

// Inicjalizuj Sentry przed renderowaniem aplikacji
initSentry();

createRoot(document.getElementById("root")!).render(<App />);

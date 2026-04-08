/**
 * Feature Flags — Majster.AI
 *
 * FF_NEW_SHELL:
 *   - false (domyślnie): stary shell (AppLayout + TopBar + Navigation + MobileBottomNav)
 *   - true: nowy shell (NewShellLayout + BottomNav5 + FAB + HomeLoby + MoreScreen)
 *
 * Jak włączyć:
 *   Ustaw w localStorage: localStorage.setItem('FF_NEW_SHELL', 'true') + odśwież stronę
 *   LUB zmień DEFAULT poniżej na true (rebuild wymagany).
 *   LUB ustaw zmienną środowiskową: VITE_FF_NEW_SHELL=true
 *
 * REGUŁA (ROADMAP G6): od PR-07 każdy kolejny PR musi działać przy FF_NEW_SHELL=ON i OFF.
 */

// One-time migration (2026-03 global rollout):
// Users who previously set FF_NEW_SHELL=false in localStorage would be permanently
// stuck on the legacy shell even after the rollout. Clear that stale value once so
// the new default (true) takes effect. The migration marker prevents re-running.
const ROLLOUT_MIGRATION_KEY = 'FF_NEW_SHELL_rollout_v1';
try {
  if (!localStorage.getItem(ROLLOUT_MIGRATION_KEY)) {
    if (localStorage.getItem('FF_NEW_SHELL') === 'false') {
      localStorage.removeItem('FF_NEW_SHELL');
    }
    localStorage.setItem(ROLLOUT_MIGRATION_KEY, '1');
  }
} catch {
  // SSR / privacy mode — ignorujemy
}

const ENV_FLAG = import.meta.env.VITE_FF_NEW_SHELL;

function resolveFlag(envValue: string | undefined, lsKey: string, defaultValue: boolean): boolean {
  // 1. Zmienna środowiskowa ma pierwszeństwo (build-time)
  if (envValue === 'true') return true;
  if (envValue === 'false') return false;
  // 2. localStorage (runtime toggle, bez rebuildu)
  try {
    const lsVal = localStorage.getItem(lsKey);
    if (lsVal === 'true') return true;
    if (lsVal === 'false') return false;
  } catch {
    // SSR / privacy mode — ignorujemy
  }
  return defaultValue;
}

export const FF_NEW_SHELL: boolean = resolveFlag(ENV_FLAG, 'FF_NEW_SHELL', true);

/**
 * CANONICAL_HOME — kanoniczny URL ekranu głównego po zalogowaniu.
 *
 * Dashboard (/app/dashboard) jest jedynym ekranem domowym.
 * HomeLobby (/app/home) przekierowuje na dashboard (P9 — placeholder
 * neutralized until "Kontynuuj" persistence is implemented).
 *
 * Używaj tej stałej wszędzie tam, gdzie po udanym zalogowaniu /
 * rejestracji / resecie hasła następuje przekierowanie do aplikacji.
 * Dzięki temu istnieje JEDEN punkt prawdy dla trasy domowej.
 */
export const CANONICAL_HOME = '/app/dashboard';

// ─────────────────────────────────────────────────────────────────────────────
// SECURITY NOTE: localStorage flags are ONLY for UI/UX experimentation.
//
// ⚠️  NEVER use localStorage-backed flags for:
//   - Feature gating by subscription plan (Pro/Business)
//   - Permission checks (admin, owner, etc.)
//   - Hiding/showing paid features
//
// For plan-gated features, read the plan from the database (profiles.plan_slug)
// or from the AuthContext — never from localStorage.
// ─────────────────────────────────────────────────────────────────────────────

// Audit of existing flags:
//   FF_NEW_SHELL — controls UI shell layout (AppLayout vs NewShellLayout).
//                  Pure UI/UX flag. Safe to gate via localStorage.
//                  No billing, permission, or plan implications.
//
//   FF_MODE_B_DOCX_ENABLED — ukrywa Tryb B (DOCX-based documents) do czasu
//                  stabilizacji pilota (PR-02+). Domyślnie false w PR-01
//                  (fundament danych gotowy, pilot DOCX jeszcze nie istnieje).
//                  Włącz lokalnie: localStorage.setItem('FF_MODE_B_DOCX_ENABLED', 'true')
//                  LUB: VITE_FF_MODE_B_DOCX_ENABLED=true (build-time)
//                  UWAGA: flag kontroluje tylko widoczność UI. Tabele DB istnieją
//                  niezależnie od flagi — bezpiecznie dla backward-compatibility.
//
//   FF_READY_DOCUMENTS_ENABLED — kontroluje widoczność wpisu nawigacyjnego /app/ready-documents.
//                  Domyślnie true od PR-B6 — moduł gotowy do produkcji (PR-B1…PR-B5 merged).
//                  Wyłącz lokalnie: localStorage.setItem('FF_READY_DOCUMENTS_ENABLED', 'false')
//                  LUB: VITE_FF_READY_DOCUMENTS_ENABLED=false (build-time)
//
//   FF_OWNER_DIAGNOSTIC — włącza panel diagnostyczny właściciela w /app/ready-documents.
//                  Pokazuje stan inventory vs. publish-safe templates (PR-B5).
//                  DOMYŚLNIE WYŁĄCZONE — panel diagnostyczny NIE jest widoczny dla
//                  zwykłych użytkowników. Włącz tylko lokalnie lub na potrzeby debugowania.
//                  Włącz lokalnie: localStorage.setItem('FF_OWNER_DIAGNOSTIC', 'true')
//                  LUB: VITE_FF_OWNER_DIAGNOSTIC=true (build-time)

/**
 * FF_MODE_B_DOCX_ENABLED — PR-01 (Mode B Foundation)
 *
 * false (domyślnie): Tryb B ukryty — widoczny tylko Tryb A (istniejący przepływ)
 * true:              Tryb B widoczny — aktywuje pilot DOCX-based documents (PR-02+)
 *
 * W PR-01 zawsze false — fundament danych jest gotowy, ale brak pilota DOCX.
 * Zmiana na true nastąpi w PR-02 po dostarczeniu end-to-end pilota.
 */
export const FF_MODE_B_DOCX_ENABLED: boolean = resolveFlag(
  import.meta.env.VITE_FF_MODE_B_DOCX_ENABLED,
  'FF_MODE_B_DOCX_ENABLED',
  false, // domyślnie OFF — pilot DOCX nie istnieje w PR-01
);

/**
 * FF_READY_DOCUMENTS_ENABLED — PR-B1 (Variant B Shell)
 *
 * false: wpis "Gotowe dokumenty" ukryty w nawigacji
 * true (domyślnie): wpis widoczny w sidebarze desktopowym
 *
 * Trasa /app/ready-documents jest zawsze zarejestrowana — ukrywana jest TYLKO
 * pozycja nawigacyjna. Strona obsługuje empty state samodzielnie bez danych.
 *
 * Włączone globalnie od PR-B6 (audit deploy) — moduł gotowy do produkcji.
 */
export const FF_READY_DOCUMENTS_ENABLED: boolean = resolveFlag(
  import.meta.env.VITE_FF_READY_DOCUMENTS_ENABLED,
  'FF_READY_DOCUMENTS_ENABLED',
  true, // ON — moduł gotowych dokumentów aktywny w nawigacji
);

/**
 * FF_OWNER_DIAGNOSTIC — PR-B5 (Owner Content Pipeline)
 *
 * false (domyślnie): diagnostyka właściciela ukryta — widok standardowy dla użytkowników
 * true:              panel diagnostyczny widoczny w /app/ready-documents
 *
 * Panel diagnostyczny pokazuje:
 *   - Stan inventory (src/data/premiumTemplateInventory.ts) vs. publish-safe templates
 *   - Które szablony czekają na upload DOCX lub aktywację
 *   - Oczekiwane ścieżki Storage dla każdego brakującego szablonu
 *
 * WAŻNE: Ta flaga NIE zmienia żadnych danych, uprawnień ani zabezpieczeń.
 * Panel diagnostyczny jest read-only i widoczny tylko lokalnie.
 * NIGDY nie włączać produkcyjnie dla zwykłych użytkowników.
 *
 * Włącz lokalnie: localStorage.setItem('FF_OWNER_DIAGNOSTIC', 'true')
 * LUB: VITE_FF_OWNER_DIAGNOSTIC=true (build-time)
 */
export const FF_OWNER_DIAGNOSTIC: boolean = resolveFlag(
  import.meta.env.VITE_FF_OWNER_DIAGNOSTIC,
  'FF_OWNER_DIAGNOSTIC',
  false, // domyślnie OFF — panel diagnostyczny nie jest widoczny publicznie
);

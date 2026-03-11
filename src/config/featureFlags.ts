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
 * Tymczasowo ustawiony na /app/dashboard (Dashboard) zamiast /app/home (HomeLobby),
 * ponieważ Dashboard jest bogatszym i bardziej wartościowym ekranem dla użytkownika.
 * HomeLobby pozostaje dostępna pod /app/home, ale nie jest domyślnym lądowiskiem.
 *
 * Używaj tej stałej wszędzie tam, gdzie po udanym zalogowaniu /
 * rejestracji / resecie hasła następuje przekierowanie do aplikacji.
 * Dzięki temu istnieje JEDEN punkt prawdy dla trasy domowej.
 */
export const CANONICAL_HOME = '/app/dashboard';

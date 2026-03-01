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

export const FF_NEW_SHELL: boolean = resolveFlag(ENV_FLAG, 'FF_NEW_SHELL', false);

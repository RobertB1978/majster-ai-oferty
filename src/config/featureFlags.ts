/**
 * Feature Flags — Majster.AI
 *
 * FF_NEW_SHELL:
 *   - true (default — PR-07..PR-20 all merged, new shell is production):
 *       NewShellLayout + BottomNav5 + FAB + HomeLobby + MoreScreen
 *   - false (legacy): AppLayout + TopBar + Navigation + MobileBottomNav
 *
 * Override:
 *   localStorage.setItem('FF_NEW_SHELL', 'false') + reload — reverts to legacy shell
 *   VITE_FF_NEW_SHELL=false — build-time override
 *
 * REGUŁA (ROADMAP G6): every PR-07..PR-20 must work with FF_NEW_SHELL=ON and OFF.
 */

const ENV_FLAG = import.meta.env.VITE_FF_NEW_SHELL;

function resolveFlag(envValue: string | undefined, lsKey: string, defaultValue: boolean): boolean {
  // 1. Build-time env var takes precedence
  if (envValue === 'true') return true;
  if (envValue === 'false') return false;
  // 2. localStorage runtime toggle (no rebuild needed)
  try {
    const lsVal = localStorage.getItem(lsKey);
    if (lsVal === 'true') return true;
    if (lsVal === 'false') return false;
  } catch {
    // SSR / privacy mode — ignore
  }
  return defaultValue;
}

// Default: true — all roadmap PRs 07-20 are merged and production-ready (2026-03-07)
export const FF_NEW_SHELL: boolean = resolveFlag(ENV_FLAG, 'FF_NEW_SHELL', true);

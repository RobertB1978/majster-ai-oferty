/**
 * Dense Office Mode hook — roadmap §9 / ETAP 6 (P2)
 *
 * Dense mode is an opt-in display preference for office/desktop users:
 * - Spacing: 24px → 16px
 * - Row height: 56px → 44px
 * - DISABLED on mobile (< 768px) regardless of setting
 *
 * Persisted in localStorage key "majster_dense_mode".
 * Adds/removes `data-dense="true"` attribute on <html> element —
 * CSS classes can then use `[data-dense] .selector { ... }` selectors.
 */
import { useState, useEffect, useCallback } from 'react';

const LS_KEY = 'majster_dense_mode';

function isDesktop(): boolean {
  return window.matchMedia('(min-width: 768px)').matches;
}

export function useDenseMode() {
  const [dense, setDenseState] = useState<boolean>(() => {
    try {
      return localStorage.getItem(LS_KEY) === 'true';
    } catch {
      return false;
    }
  });

  // Apply/remove data-dense attribute — CSS reads this
  useEffect(() => {
    const effectiveDense = dense && isDesktop();
    document.documentElement.setAttribute('data-dense', effectiveDense ? 'true' : 'false');
  }, [dense]);

  // Also react to viewport resize — disable dense visually on mobile
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 768px)');
    const handler = () => {
      const effectiveDense = dense && mq.matches;
      document.documentElement.setAttribute('data-dense', effectiveDense ? 'true' : 'false');
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [dense]);

  const toggleDense = useCallback(() => {
    setDenseState((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(LS_KEY, String(next));
      } catch {
        // private mode — ignore
      }
      return next;
    });
  }, []);

  /** Effective dense state — false when on mobile even if toggle is on */
  const effectiveDense = dense && (typeof window !== 'undefined' ? isDesktop() : false);

  return { dense, effectiveDense, toggleDense };
}

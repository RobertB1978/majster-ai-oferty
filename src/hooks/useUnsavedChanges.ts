/**
 * useUnsavedChanges — ochrona przed utratą niezapisanych zmian.
 *
 * Używa:
 *  - beforeunload — chroni przed zamknięciem karty / odświeżeniem strony
 *
 * UWAGA: useBlocker z React Router wymaga DataRouterContext (createBrowserRouter
 * + RouterProvider). Aplikacja używa <BrowserRouter>, więc useBlocker rzuca
 * "invariant(false)" w produkcji → crash ErrorBoundary.  Blokada SPA nawigacji
 * jest wyłączona do czasu migracji routera.  Zamknięcie karty/odświeżenie
 * jest nadal chronione przez beforeunload.
 *
 * Użycie:
 *   const { isDirty, setDirty, blocker } = useUnsavedChanges(hasChanges);
 *   // blocker.state jest zawsze 'unblocked' (SPA nawigacja nie jest blokowana)
 */
import { useEffect, useCallback, useRef } from 'react';
import type { Blocker } from 'react-router-dom';

/** Static idle blocker — safe replacement for useBlocker when DataRouterContext
 *  is not available (i.e. when using <BrowserRouter>). */
const IDLE_BLOCKER: Blocker = {
  state: 'unblocked',
  reset: undefined,
  proceed: undefined,
  location: undefined,
} as unknown as Blocker;

interface UseUnsavedChangesReturn {
  /** Czy są niezapisane zmiany */
  isDirty: boolean;
  /** Ustaw stan zmian (true = brudny) */
  setDirty: (dirty: boolean) => void;
  /** Blocker z React Router – użyj do wyświetlenia dialogu */
  blocker: Blocker;
}

export function useUnsavedChanges(dirty: boolean): UseUnsavedChangesReturn {
  const dirtyRef = useRef(dirty);
  dirtyRef.current = dirty;

  // Ochrona przed zamknięciem karty / odświeżeniem
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      e.preventDefault();
      // Chrome wymaga returnValue
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, []);

  const setDirty = useCallback((_dirty: boolean) => {
    dirtyRef.current = _dirty;
  }, []);

  return { isDirty: dirty, setDirty, blocker: IDLE_BLOCKER };
}

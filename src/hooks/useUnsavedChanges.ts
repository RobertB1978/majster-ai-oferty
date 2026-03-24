/**
 * useUnsavedChanges — ochrona przed utratą niezapisanych zmian.
 *
 * Używa:
 *  - beforeunload — chroni przed zamknięciem karty / odświeżeniem strony
 *
 * UWAGA: useBlocker (blokada nawigacji wewnątrz SPA) celowo nie jest używany,
 * ponieważ wymaga data routera (createBrowserRouter + RouterProvider).
 * Aplikacja używa BrowserRouter, który nie dostarcza DataRouterContext.
 * Wywołanie useBlocker z BrowserRouter rzuca Error("") w produkcji (invariant
 * bez wiadomości w zminifikowanym bundlu), co powoduje crash ErrorBoundary.
 *
 * Użycie:
 *   const { isDirty, setDirty, blocker } = useUnsavedChanges(hasChanges);
 *   // blocker.state jest zawsze 'unblocked' — dialog nigdy nie pojawia się
 */
import { useEffect, useCallback, useRef } from 'react';
import type { Blocker } from 'react-router-dom';

// Statyczny blocker zwracany gdy useBlocker nie jest dostępny (BrowserRouter)
const IDLE_BLOCKER: Blocker = {
  state: 'unblocked',
  proceed: undefined,
  reset: undefined,
  location: undefined,
};

interface UseUnsavedChangesReturn {
  /** Czy są niezapisane zmiany */
  isDirty: boolean;
  /** Ustaw stan zmian (true = brudny) */
  setDirty: (dirty: boolean) => void;
  /** Blocker – zawsze 'unblocked' (BrowserRouter nie wspiera useBlocker) */
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

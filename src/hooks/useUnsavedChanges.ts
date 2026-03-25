/**
 * useUnsavedChanges — ochrona przed utratą niezapisanych zmian.
 *
 * Używa:
 *  - useBlocker (React Router v6.4+) — blokuje nawigację wewnątrz SPA
 *  - beforeunload — chroni przed zamknięciem karty / odświeżeniem strony
 *
 * Użycie:
 *   const { isDirty, setDirty, blocker } = useUnsavedChanges(hasChanges);
 *   // renderuj <UnsavedChangesDialog blocker={blocker} /> jeśli blocker.state === 'blocked'
 */
import { useEffect, useCallback, useRef } from 'react';
import { useBlocker, type Blocker } from 'react-router-dom';

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

  // Blokada nawigacji wewnątrz SPA
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      dirtyRef.current && currentLocation.pathname !== nextLocation.pathname,
  );

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

  return { isDirty: dirty, setDirty, blocker };
}

/**
 * usePrefetchOnHover — Dense Office Mode pre-fetch (roadmap §12)
 *
 * Returns `{ onMouseEnter, onMouseLeave }` event handlers for nav links.
 * After hovering for DELAY ms it calls the supplied prefetch function.
 * Only active when `effectiveDense = true` (§12: "tylko Dense Mode").
 *
 * Usage:
 *   const prefetch = usePrefetchOnHover(() => queryClient.prefetchQuery(...));
 *   <a {...prefetch} href="..." />
 */

import { useCallback, useRef } from 'react';

const DELAY = 200; // ms — roadmap §12

export function usePrefetchOnHover(
  prefetch: () => void,
  effectiveDense: boolean,
): {
  onMouseEnter: React.MouseEventHandler;
  onMouseLeave: React.MouseEventHandler;
} {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onMouseEnter = useCallback(() => {
    if (!effectiveDense) return;
    timerRef.current = setTimeout(prefetch, DELAY);
  }, [effectiveDense, prefetch]);

  const onMouseLeave = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  return { onMouseEnter, onMouseLeave };
}

import { lazy, Suspense } from 'react';
import { ReactNode } from 'react';
import { useReducedMotion, useBatterySaver } from '@/hooks/useFieldSafety';

// Lazy-load framer-motion to keep it out of the initial bundle.
// framer-motion is ~100 kB uncompressed; deferring it saves parse time on first load.
const PageTransitionAnimated = lazy(() => import('./PageTransitionAnimated'));

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  const reducedMotion = useReducedMotion();
  const batterySaver = useBatterySaver();

  // Field-Safe: skip animation entirely when battery is low or motion is reduced.
  // Avoids Framer Motion parse cost on low-end devices.
  if (reducedMotion || batterySaver) {
    return <div className="w-full">{children}</div>;
  }

  return (
    <Suspense fallback={<div className="w-full">{children}</div>}>
      <PageTransitionAnimated>{children}</PageTransitionAnimated>
    </Suspense>
  );
}

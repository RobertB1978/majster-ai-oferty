import { lazy, Suspense } from 'react';
import { ReactNode } from 'react';

// Lazy-load framer-motion to keep it out of the initial bundle.
// framer-motion is ~100 kB uncompressed; deferring it saves parse time on first load.
const PageTransitionAnimated = lazy(() => import('./PageTransitionAnimated'));

interface PageTransitionProps {
  children: ReactNode;
}

export function PageTransition({ children }: PageTransitionProps) {
  return (
    <Suspense fallback={<div className="w-full">{children}</div>}>
      <PageTransitionAnimated>{children}</PageTransitionAnimated>
    </Suspense>
  );
}

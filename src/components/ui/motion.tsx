/**
 * Motion components — Faza 5 Micro-Interactions
 * Source of truth: docs/ULTRA_ENTERPRISE_ROADMAP.md §8
 *
 * Components:
 * - PageTransition: Wraps page content with fade+slide in/out
 * - StaggerChildren: Staggers animation of child elements
 * - MotionCard: Card with hover translateY(-2px) + shadow
 * - CountUp: Animated number counter (1200ms ease-out)
 * - SkeletonPremium: Shimmer skeleton placeholder
 *
 * All respect prefers-reduced-motion.
 */

import { type ReactNode, useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { cn } from '@/lib/utils';

// ── PageTransition ────────────────────────────────────────────────────────────

interface PageTransitionProps {
  children: ReactNode;
  /** Key should change when route changes to trigger animation */
  routeKey?: string;
  className?: string;
}

export function PageTransition({
  children,
  routeKey,
  className,
}: PageTransitionProps) {
  const shouldReduce = useReducedMotion();

  const variants = shouldReduce
    ? { initial: {}, animate: {}, exit: {} }
    : {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        exit: { opacity: 0, y: -6 },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={routeKey}
        initial="initial"
        animate="animate"
        exit="exit"
        variants={variants}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className={className}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

// ── StaggerChildren ───────────────────────────────────────────────────────────

interface StaggerChildrenProps {
  children: ReactNode;
  className?: string;
  /** Delay between each child in seconds (default 0.06) */
  stagger?: number;
  /** Initial animation delay in seconds (default 0) */
  delay?: number;
}

const staggerContainer = (stagger: number, delay: number) => ({
  animate: {
    transition: {
      staggerChildren: stagger,
      delayChildren: delay,
    },
  },
});

const staggerItem = {
  initial: { opacity: 0, y: 16 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.16, 1, 0.3, 1] },
  },
};

export function StaggerChildren({
  children,
  className,
  stagger = 0.06,
  delay = 0,
}: StaggerChildrenProps) {
  const shouldReduce = useReducedMotion();

  if (shouldReduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      variants={staggerContainer(stagger, delay)}
      initial="initial"
      animate="animate"
      className={className}
    >
      {children}
    </motion.div>
  );
}

/**
 * StaggerItem — must be a direct child of StaggerChildren
 */
export function StaggerItem({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const shouldReduce = useReducedMotion();
  if (shouldReduce) return <div className={className}>{children}</div>;

  return (
    <motion.div variants={staggerItem} className={className}>
      {children}
    </motion.div>
  );
}

// ── MotionCard ────────────────────────────────────────────────────────────────

interface MotionCardProps {
  children: ReactNode;
  className?: string;
  /** Elevation on hover: translateY amount in px (default -2) */
  hoverY?: number;
  onClick?: () => void;
}

export function MotionCard({
  children,
  className,
  hoverY = -2,
  onClick,
}: MotionCardProps) {
  const shouldReduce = useReducedMotion();

  return (
    <motion.div
      className={cn('cursor-pointer', className)}
      whileHover={
        shouldReduce
          ? undefined
          : { y: hoverY, boxShadow: 'var(--shadow-card-hover)' }
      }
      whileTap={shouldReduce ? undefined : { scale: 0.98 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      onClick={onClick}
    >
      {children}
    </motion.div>
  );
}

// ── CountUp ───────────────────────────────────────────────────────────────────

interface CountUpProps {
  /** Target value */
  value: number;
  /** Animation duration in ms (default 1200) */
  duration?: number;
  /** Optional formatter (e.g. currency) */
  format?: (n: number) => string;
  className?: string;
}

export function CountUp({
  value,
  duration = 1200,
  format,
  className,
}: CountUpProps) {
  const shouldReduce = useReducedMotion();
  const [display, setDisplay] = useState(shouldReduce ? value : 0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (shouldReduce) {
      setDisplay(value);
      return;
    }

    const startTime = performance.now();
    const startVal = 0;

    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (value - startVal) * eased));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [value, duration, shouldReduce]);

  const text = format ? format(display) : String(display);

  return (
    <span className={cn('tabular-nums', className)} aria-live="polite">
      {text}
    </span>
  );
}

// ── SkeletonPremium ──────────────────────────────────────────────────────────

interface SkeletonPremiumProps {
  /** Width class, e.g. "w-full", "w-48" */
  width?: string;
  /** Height class, e.g. "h-4", "h-10" */
  height?: string;
  /** Rounded variant */
  rounded?: 'sm' | 'md' | 'lg' | 'full';
  className?: string;
}

/**
 * Premium skeleton with shimmer effect.
 * Falls back to static placeholder when prefers-reduced-motion is set.
 * Source of truth: §8 — SkeletonPremium (shimmer)
 */
export function SkeletonPremium({
  width = 'w-full',
  height = 'h-4',
  rounded = 'md',
  className,
}: SkeletonPremiumProps) {
  const shouldReduce = useReducedMotion();

  const radiusMap = {
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  } as const;

  return (
    <div
      role="status"
      aria-label="Loading…"
      className={cn(
        width,
        height,
        radiusMap[rounded],
        'overflow-hidden',
        className,
      )}
      style={
        shouldReduce
          ? { background: 'var(--bg-surface-raised, #F5F3EF)' }
          : {
              background:
                'linear-gradient(90deg, var(--bg-surface-raised, #F5F3EF) 25%, var(--bg-surface, #FFFFFF) 50%, var(--bg-surface-raised, #F5F3EF) 75%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }
      }
    >
      <span className="sr-only">Loading…</span>
    </div>
  );
}

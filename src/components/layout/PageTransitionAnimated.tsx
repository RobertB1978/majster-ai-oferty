import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { ReactNode } from 'react';

interface PageTransitionAnimatedProps {
  children: ReactNode;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 4,
  },
  enter: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.15,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    y: -4,
    transition: {
      duration: 0.08,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export default function PageTransitionAnimated({ children }: PageTransitionAnimatedProps) {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={location.pathname}
        initial="initial"
        animate="enter"
        exit="exit"
        variants={pageVariants}
        className="w-full"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

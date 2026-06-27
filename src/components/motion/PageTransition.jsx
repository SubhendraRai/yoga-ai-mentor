import { motion, AnimatePresence } from 'framer-motion';

/**
 * PageTransition — wraps each page in App.jsx's currentPage switch.
 * Soft cross-fade + rise, keyed on the page id so AnimatePresence can
 * detect the swap. Mirrors a slow exhale: fade out down, fade in up.
 */
export default function PageTransition({ pageKey, children }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pageKey}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.4, ease: [0.45, 0, 0.2, 1] }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

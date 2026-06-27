import { motion } from 'framer-motion';

/**
 * Reveal — scroll/mount-triggered entrance for sections and cards.
 * Fast, decisive curve (not the ambient breathing curve) so reveals feel
 * responsive rather than sluggish.
 */
export default function Reveal({
  children,
  delay = 0,
  y = 16,
  duration = 0.55,
  once = true,
  className = '',
  as: Component = motion.div,
}) {
  return (
    <Component
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: '-40px' }}
      transition={{ duration, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Component>
  );
}

/** Stagger container — wrap a list of <Reveal> or motion children */
export function RevealGroup({ children, className = '', stagger = 0.08, delayChildren = 0 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-40px' }}
      variants={{
        hidden: {},
        show: {
          transition: { staggerChildren: stagger, delayChildren },
        },
      }}
    >
      {children}
    </motion.div>
  );
}

export const revealItemVariants = {
  hidden: { opacity: 0, y: 14 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

import { motion } from 'framer-motion';

/**
 * BreathDot — a small ambient indicator that pulses on the shared 4.5s
 * breathing rhythm. Used in the header as a quiet "the system is alive"
 * signal, echoing meditation breath-pacing cues without being literal.
 */
export default function BreathDot({ size = 8, color = 'var(--color-moss)', className = '' }) {
  return (
    <span className={`relative inline-flex ${className}`} style={{ width: size, height: size }}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 1.8, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
      />
      <span className="relative rounded-full w-full h-full" style={{ background: color }} />
    </span>
  );
}

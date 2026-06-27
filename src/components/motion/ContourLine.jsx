import { motion } from 'framer-motion';

/**
 * ContourLine — the signature device for Yogtatva.
 * One continuous bezier path, like a slow exhale traced by hand.
 * Reused at three scales: hero illustration, divider/underline, ambient backdrop.
 * The WellnessScore ring is a *separate* perfect circle (it must stay numerically
 * accurate as a progress indicator) but shares the same draw-on easing and stroke
 * language as this path, so the two read as one family.
 */

const PATHS = {
  // wide, calm single-stroke wave — used as section divider / underline
  divider: 'M2 12 C 40 2, 70 22, 110 10 S 180 4, 220 14 S 290 20, 328 8',
  // taller, looser flourish — used in hero / empty states
  flourish:
    'M10 90 C 30 40, 60 10, 100 30 C 140 50, 120 90, 150 100 C 190 112, 210 60, 250 50 C 280 42, 300 70, 290 100',
};

export default function ContourLine({
  variant = 'divider',
  className = '',
  color = 'var(--color-moss)',
  strokeWidth = 2,
  duration = 1.8,
  delay = 0,
  loop = false,
  viewBox,
}) {
  const d = PATHS[variant] || PATHS.divider;
  const defaultViewBox = variant === 'flourish' ? '0 0 300 120' : '0 0 330 24';

  return (
    <svg
      className={className}
      viewBox={viewBox || defaultViewBox}
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <motion.path
        d={d}
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={
          loop
            ? { pathLength: 1, opacity: [0, 1, 1, 0.7], pathOffset: [0, 0, 0, 0] }
            : { pathLength: 1, opacity: 1 }
        }
        transition={
          loop
            ? { duration: duration * 2, delay, repeat: Infinity, ease: 'easeInOut' }
            : { duration, delay, ease: [0.45, 0, 0.2, 1] }
        }
      />
    </svg>
  );
}

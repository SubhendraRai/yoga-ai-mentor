import { useEffect, useState, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import AnimatedCounter from './motion/AnimatedCounter';

/**
 * WellnessScore — the dashboard hero. Same props as before (score, breakdown)
 * so Dashboard.jsx requires zero contract changes. Visually: a large
 * Fraunces numeral inside a breathing contour ring, with the three
 * sub-scores reading as a quiet flowing-line bar set beneath.
 */
export default function WellnessScore({ score, breakdown }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const [drawn, setDrawn] = useState(false);

  useEffect(() => {
    if (inView) {
      const t = setTimeout(() => setDrawn(true), 80);
      return () => clearTimeout(t);
    }
  }, [inView]);

  const radius = 78;
  const circumference = 2 * Math.PI * radius;
  const target = Math.max(0, Math.min(100, score || 0));
  const offset = circumference - (target / 100) * circumference;

  const tone =
    target >= 70 ? 'var(--color-moss)' : target >= 40 ? 'var(--color-mist)' : 'var(--color-clay)';

  const getBreakdownLabel = (key) => {
    switch (key) {
      case 'physical':
        return 'Physical activity';
      case 'mental':
        return 'Mental balance';
      case 'consistency':
        return 'Consistency';
      default:
        return key;
    }
  };

  return (
    <div
      ref={ref}
      className="relative rounded-[28px] bg-white/95 border border-canvas-deep px-8 py-9 overflow-hidden shadow-[0_8px_32px_rgba(31,43,34,0.06)]"
    >
      {/* ambient breathing wash behind the ring */}
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-16 w-64 h-64 rounded-full blur-3xl"
        style={{ background: 'radial-gradient(circle, rgba(74,107,82,0.12), transparent 70%)' }}
        animate={{ scale: [1, 1.08, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
      />

      <p className="text-[12px] uppercase tracking-[0.18em] text-moss-deep/70 font-medium mb-7 relative z-10">
        Wellness score
      </p>

      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 relative z-10">
        {/* Ring */}
        <div className="relative shrink-0" style={{ width: 176, height: 176 }}>
          <svg width="176" height="176" viewBox="0 0 176 176" className="-rotate-90">
            <circle cx="88" cy="88" r={radius} fill="none" stroke="var(--color-canvas-deep)" strokeWidth="10" />
            <motion.circle
              cx="88"
              cy="88"
              r={radius}
              fill="none"
              stroke={tone}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: drawn ? offset : circumference }}
              transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
            />
          </svg>

          {/* breathing glow ring, very soft, behind the number */}
          <motion.div
            aria-hidden="true"
            className="absolute inset-6 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(74,107,82,0.08), transparent 75%)' }}
            animate={{ scale: [1, 1.06, 1] }}
            transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
          />

          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span
              className="font-display font-medium text-ink leading-none"
              style={{ fontSize: 52 }}
            >
              <AnimatedCounter value={target} />
            </span>
            <span className="text-[11px] uppercase tracking-[0.14em] text-text-secondary mt-1">
              out of 100
            </span>
          </div>
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="flex-1 w-full flex flex-col gap-4 justify-center">
            {Object.entries(breakdown).map(([key, val], i) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 10 }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="flex items-center gap-3"
              >
                <span className="text-[12px] text-text-secondary w-[108px] shrink-0">
                  {getBreakdownLabel(key)}
                </span>
                <div className="flex-1 h-[6px] rounded-full bg-canvas-deep overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: `linear-gradient(90deg, var(--color-moss), var(--color-mist))` }}
                    initial={{ width: 0 }}
                    animate={{ width: inView ? `${val}%` : 0 }}
                    transition={{ duration: 1.2, delay: 0.4 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
                <span className="text-[12px] font-mono text-moss-deep w-[28px] text-right">
                  {val}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

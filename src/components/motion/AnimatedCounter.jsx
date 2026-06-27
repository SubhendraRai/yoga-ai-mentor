import { useEffect, useRef, useState } from 'react';
import { useSpring, useInView } from 'framer-motion';

/**
 * AnimatedCounter — counts up from 0 to `value` with a spring, triggered
 * once when scrolled into view. Used for the wellness score numeral,
 * streak days, and any other stat.
 */
export default function AnimatedCounter({ value = 0, className = '', suffix = '' }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-10% 0px' });
  const spring = useSpring(0, { stiffness: 60, damping: 18, mass: 0.6 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) spring.set(value);
  }, [inView, value, spring]);

  useEffect(() => {
    const unsub = spring.on('change', (v) => setDisplay(Math.round(v)));
    return unsub;
  }, [spring]);

  return (
    <span ref={ref} className={className}>
      {display}
      {suffix}
    </span>
  );
}

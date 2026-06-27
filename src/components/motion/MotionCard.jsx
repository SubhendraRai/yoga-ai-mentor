import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * MotionCard — interactive surface used for dashboard cards.
 * Subtle 3D tilt on mouse move, soft elevation on hover, animated gradient
 * border glow that breathes gently even at rest.
 */
export default function MotionCard({
  children,
  className = '',
  tilt = true,
  glow = true,
  onClick,
  as = 'div',
}) {
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rx = useSpring(useTransform(my, [0, 1], [6, -6]), { stiffness: 150, damping: 18 });
  const ry = useSpring(useTransform(mx, [0, 1], [-6, 6]), { stiffness: 150, damping: 18 });

  const handleMouseMove = (e) => {
    if (!tilt) return;
    const rect = e.currentTarget.getBoundingClientRect();
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };

  const handleMouseLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  const Component = motion[as] || motion.div;

  return (
    <Component
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={tilt ? { rotateX: rx, rotateY: ry, transformPerspective: 800 } : undefined}
      whileHover={{ y: -4 }}
      transition={{ duration: 0.3, ease: [0.45, 0, 0.2, 1] }}
      className={`group relative rounded-3xl bg-white/90 border border-canvas-deep shadow-[0_4px_24px_rgba(31,43,34,0.05)] hover:shadow-[0_16px_44px_rgba(31,43,34,0.1)] transition-shadow duration-500 ${className}`}
    >
      {glow && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -inset-px rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          style={{
            background:
              'linear-gradient(135deg, rgba(74,107,82,0.18), rgba(169,198,204,0.18), rgba(201,139,107,0.12))',
            zIndex: -1,
            filter: 'blur(8px)',
          }}
        />
      )}
      {children}
    </Component>
  );
}

import { motion } from 'framer-motion';
import { useState, useRef } from 'react';

/**
 * MotionButton — the premium interactive button used across the app.
 * Gentle scale + soft glow on hover, liquid ripple on click, smooth press.
 * variant: 'primary' (moss gradient fill) | 'outline' (quiet, border-led) | 'ghost'
 */
export default function MotionButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
  className = '',
  fullWidth = false,
  icon = null,
}) {
  const [ripples, setRipples] = useState([]);
  const idRef = useRef(0);

  const handleClick = (e) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = idRef.current++;
    setRipples((r) => [...r, { id, x, y }]);
    setTimeout(() => setRipples((r) => r.filter((rip) => rip.id !== id)), 650);
    onClick?.(e);
  };

  const sizes = {
    sm: 'px-4 py-2 text-[13px]',
    md: 'px-6 py-3 text-[14px]',
    lg: 'px-8 py-4 text-[15px]',
  };

  const base =
    'relative overflow-hidden font-medium tracking-wide rounded-full inline-flex items-center justify-center gap-2 select-none transition-colors duration-300 disabled:opacity-45 disabled:cursor-not-allowed';

  const variants = {
    primary:
      'text-canvas bg-gradient-to-br from-moss to-moss-deep shadow-[0_4px_20px_rgba(74,107,82,0.28)] hover:shadow-[0_8px_28px_rgba(74,107,82,0.4)]',
    outline:
      'text-moss-deep bg-transparent border border-moss/30 hover:border-moss hover:bg-moss/5',
    ghost: 'text-moss-deep bg-transparent hover:bg-moss/8',
  };

  return (
    <motion.button
      type={type}
      onClick={handleClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      whileHover={disabled ? {} : { scale: 1.02, y: -1 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      transition={{ duration: 0.2, ease: [0.45, 0, 0.2, 1] }}
    >
      {/* soft ambient glow, breathing while idle (primary only) */}
      {variant === 'primary' && !disabled && (
        <motion.span
          className="absolute inset-0 rounded-full bg-mist/30 blur-md"
          style={{ zIndex: 0 }}
          animate={{ opacity: [0.15, 0.35, 0.15] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
        />
      )}

      <span className="relative z-10 inline-flex items-center gap-2">
        {icon}
        {children}
      </span>

      {/* liquid ripple on click */}
      {ripples.map((r) => (
        <motion.span
          key={r.id}
          className="absolute rounded-full bg-white/35 pointer-events-none"
          style={{ left: r.x, top: r.y, x: '-50%', y: '-50%' }}
          initial={{ width: 0, height: 0, opacity: 0.6 }}
          animate={{ width: 240, height: 240, opacity: 0 }}
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />
      ))}
    </motion.button>
  );
}

import { motion } from 'framer-motion';

export default function SkeletonLoader({ type = 'text', count = 1 }) {
  const sizes = {
    title: 'h-8 w-3/5 rounded-lg',
    text: 'h-4 w-full rounded-md mb-2',
    card: 'h-[200px] w-full rounded-2xl mb-4',
    pose: 'h-[120px] w-full rounded-2xl mb-3',
  };
  const cls = sizes[type] || 'h-5 w-full rounded-md';

  return (
    <div className="w-full">
      {[...Array(count)].map((_, i) => (
        <motion.div
          key={i}
          className={`relative overflow-hidden bg-canvas-deep ${cls}`}
        >
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(74,107,82,0.14), transparent)',
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
          />
        </motion.div>
      ))}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Play, Info } from 'lucide-react';
import MotionCard from './motion/MotionCard';
import MotionButton from './motion/MotionButton';
import { RevealGroup, revealItemVariants } from './motion/Reveal';

export default function WellnessPlan({ plan, onRegenerate, onStartSession, onLearnMore }) {
  const [parsedPlan, setParsedPlan] = useState(null);
  const [recommendedPoses, setRecommendedPoses] = useState([]);

  useEffect(() => {
    if (plan) {
      try {
        // AI returns raw JSON string, sometimes wrapped in markdown block
        const cleanJson = plan.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        setParsedPlan(data);

        // Support both old format (poseIds) and new dynamic format (poses)
        if (data.poses) {
          // New dynamic format
          const posesWithImages = data.poses.map(pose => ({
            ...pose,
            id: pose.sanskritName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
            imageUrl: `https://placehold.co/800x600/F0EBE0/2E4A36?text=${encodeURIComponent(pose.englishName)}&font=raleway`
          }));
          setRecommendedPoses(posesWithImages);
        } else if (data.poseIds) {
          // Fallback if AI hasn't been refreshed
          setRecommendedPoses([]);
        }
      } catch (e) {
        console.error("Failed to parse plan JSON:", e);
      }
    }
  }, [plan]);

  if (!parsedPlan) return null;

  return (
    <div>
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-canvas-deep to-canvas px-7 py-7 mb-7"
      >
        <h3 className="font-display text-[22px] text-moss-deep mb-3">Today&rsquo;s guidance</h3>
        <p className="text-[15px] leading-relaxed text-text-body mb-6">{parsedPlan.message}</p>
        <MotionButton fullWidth onClick={() => onStartSession(recommendedPoses)} icon={<Play size={16} />}>
          Start full AI routine
        </MotionButton>
      </motion.div>

      <h3 className="font-display text-[19px] text-ink mb-5">Recommended flow</h3>

      <RevealGroup className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" stagger={0.1}>
        {recommendedPoses.map((pose) => (
          <motion.div key={pose.id} variants={revealItemVariants}>
            <MotionCard className="overflow-hidden flex flex-col h-full">
              <div className="relative h-[150px] w-full overflow-hidden">
                <img
                  src={pose.imageUrl}
                  alt={pose.englishName}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <span className="absolute top-3 right-3 bg-white/90 text-ink text-[11px] font-semibold px-2.5 py-1 rounded-full">
                  {pose.duration} min
                </span>
              </div>

              <div className="p-5 flex flex-col flex-1">
                <h4 className="font-display text-[19px] text-ink mb-0.5">{pose.englishName}</h4>
                <p className="text-text-secondary text-[12px] mb-3">{pose.sanskritName}</p>

                <ul className="text-[13px] text-text-body space-y-1 mb-5 flex-1 list-disc pl-4">
                  {pose.shortBenefits.map((benefit, i) => (
                    <li key={i}>{benefit}</li>
                  ))}
                </ul>

                <div className="grid grid-cols-2 gap-2">
                  <MotionButton size="sm" onClick={() => onStartSession(pose)} icon={<Play size={13} />}>
                    Start
                  </MotionButton>
                  <MotionButton size="sm" variant="outline" onClick={() => onLearnMore(pose)} icon={<Info size={13} />}>
                    Learn more
                  </MotionButton>
                </div>
              </div>
            </MotionCard>
          </motion.div>
        ))}
      </RevealGroup>

      {onRegenerate && (
        <div className="mt-8 text-center">
          <MotionButton variant="ghost" onClick={onRegenerate} icon={<RefreshCw size={14} />}>
            Generate new plan
          </MotionButton>
        </div>
      )}
    </div>
  );
}

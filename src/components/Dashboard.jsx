import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateMorningGreeting } from '../lib/ai';
import { generateRuleBasedPlan } from '../lib/rulesEngine';
import WellnessScore from './WellnessScore';
import MoodTracker from './MoodTracker';
import WellnessPlan from './WellnessPlan';
import SkeletonLoader from './SkeletonLoader';
import FeatureWalkthrough from './FeatureWalkthrough';
import MotionButton from './motion/MotionButton';
import Reveal, { RevealGroup, revealItemVariants } from './motion/Reveal';
import BreathDot from './motion/BreathDot';
import { Sparkles, Sun, Moon, Flower2, Camera, MessageCircle, MoonStar, Flame } from 'lucide-react';

export default function Dashboard({ onNavigate, onStartSession, onLearnMore }) {
  const [greeting, setGreeting] = useState('');
  const [plan, setPlan] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showSleepLogger, setShowSleepLogger] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [showWalkthrough, setShowWalkthrough] = useState(false);

  const profile = WellnessMemory.getProfile();
  const score = WellnessMemory.calculateWellnessScore();
  const streak = WellnessMemory.getStreak();
  const observations = WellnessMemory.getObservations();
  const latestObservation = observations.length > 0 ? observations[observations.length - 1].text : "You're doing great! Keep up the consistency.";

  const isAM = new Date().getHours() < 12;

  useEffect(() => {
    loadDashboardData();

    // Re-render when cloud sync finishes pulling new data
    const handleSync = () => {
      // Force a re-fetch of local data by re-running loadDashboardData
      loadDashboardData();
    };
    window.addEventListener('wellness_synced', handleSync);

    // Check if user has seen the walkthrough
    if (!localStorage.getItem('wellness_has_seen_tour')) {
      setShowWalkthrough(true);
    }

    return () => window.removeEventListener('wellness_synced', handleSync);
  }, []);

  const handleWalkthroughComplete = () => {
    localStorage.setItem('wellness_has_seen_tour', 'true');
    setShowWalkthrough(false);
  };

  const loadDashboardData = async () => {
    const context = WellnessMemory.getContextForAI();

    // Greeting (Daily Cache)
    const todayStr = new Date().toISOString().split('T')[0];
    const cachedGreeting = localStorage.getItem('wellness_greeting');
    const greetingDate = localStorage.getItem('wellness_greeting_date');

    if (cachedGreeting && greetingDate === todayStr) {
      setGreeting(cachedGreeting);
    } else {
      generateMorningGreeting(context).then(res => {
        if (res.success) {
          setGreeting(res.text);
          localStorage.setItem('wellness_greeting', res.text);
          localStorage.setItem('wellness_greeting_date', todayStr);
        } else {
          setGreeting(`Good ${isAM ? 'morning' : 'evening'}, ${profile?.name || 'Om'}. Ready for your practice?`);
        }
      });
    }

    // Plan
    const savedPlan = WellnessMemory.getDailyPlan();
    if (savedPlan) {
      setPlan(savedPlan);
    } else {
      handleGeneratePlan(profile);
    }
  };

  const handleGeneratePlan = (currentProfile = profile) => {
    setLoadingPlan(true);
    // Use deterministic rules engine instead of AI!
    const sleepHist = WellnessMemory.getSleepHistory(7);
    const moodHist = WellnessMemory.getMoodHistory(7);

    const ruleBasedPlan = generateRuleBasedPlan(currentProfile, moodHist, sleepHist);
    const planString = JSON.stringify(ruleBasedPlan);

    setPlan(planString);
    WellnessMemory.saveDailyPlan(planString);

    // Simulate slight loading delay for UX
    setTimeout(() => {
      setLoadingPlan(false);
    }, 500);
  };

  const handleLogSleep = () => {
    WellnessMemory.logSleep(sleepHours, sleepQuality);
    setShowSleepLogger(false);
  };

  const quickActions = [
    { id: 'yoga', label: 'Start yoga', icon: Flower2, action: () => onNavigate('yoga') },
    { id: 'pose', label: 'Pose check', icon: Camera, action: () => onNavigate('pose') },
    { id: 'chat', label: 'Talk to mentor', icon: MessageCircle, action: () => onNavigate('chat') },
    { id: 'sleep', label: 'Log sleep', icon: MoonStar, action: () => setShowSleepLogger(true) },
  ];

  return (
    <div className="relative pb-10">
      {showWalkthrough && <FeatureWalkthrough onComplete={handleWalkthroughComplete} />}

      {/* Greeting */}
      <Reveal>
        <div className="flex items-center justify-between gap-4 mb-7">
          <h1 className="flex items-center gap-3 font-display text-[28px] sm:text-[32px] font-medium text-ink">
            <motion.span
              animate={{ rotate: isAM ? [0, 8, 0] : [0, -6, 0] }}
              transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
              className={isAM ? 'text-clay' : 'text-mist'}
            >
              {isAM ? <Sun size={26} /> : <Moon size={26} />}
            </motion.span>
            {greeting || <SkeletonLoader type="title" />}
          </h1>
          <div className="hidden sm:flex items-center gap-2 text-[12px] text-text-secondary shrink-0">
            <BreathDot />
            present &amp; synced
          </div>
        </div>
      </Reveal>

      {/* Hero row: score (left, 2/3) + streak/insight rail (right, 1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-5">
        <Reveal delay={0.05} className="lg:col-span-2">
          <WellnessScore
            score={score.total}
            breakdown={{ physical: score.activityScore, mental: score.moodScore, consistency: score.sleepScore }}
          />
        </Reveal>

        <div className="flex flex-col gap-5">
          <Reveal delay={0.1}>
            <div className="relative overflow-hidden rounded-[28px] bg-white/95 border border-canvas-deep px-6 py-6 text-center shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
              <p className="text-[12px] uppercase tracking-[0.18em] text-moss-deep/70 font-medium mb-3">
                Current streak
              </p>
              <motion.div
                animate={{ scale: [1, 1.06, 1] }}
                transition={{ duration: 4.5, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
                className="inline-flex"
              >
                <Flame size={40} className={streak > 0 ? 'text-clay' : 'text-canvas-deep'} />
              </motion.div>
              <div className="font-display text-[34px] text-ink mt-2 leading-none">{streak}</div>
              <div className="text-[11px] text-text-secondary uppercase tracking-[0.1em] mt-1">days active</div>
            </div>
          </Reveal>

          <Reveal delay={0.15}>
            <MoodTracker compact={true} />
          </Reveal>
        </div>
      </div>

      {/* Quick actions */}
      <RevealGroup className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {quickActions.map(({ id, label, icon: Icon, action }) => (
          <motion.button
            key={id}
            variants={revealItemVariants}
            onClick={action}
            whileHover={{ y: -3, scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.45, 0, 0.2, 1] }}
            className="flex flex-col items-center gap-2 rounded-2xl bg-white/90 border border-canvas-deep px-4 py-5 text-text-secondary hover:text-moss-deep hover:border-moss/30 transition-colors duration-300 shadow-[0_4px_16px_rgba(31,43,34,0.04)]"
          >
            <Icon size={22} />
            <span className="text-[12px] font-medium">{label}</span>
          </motion.button>
        ))}
      </RevealGroup>

      {/* Sleep logger inline */}
      {showSleepLogger && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.35, ease: [0.45, 0, 0.2, 1] }}
          className="rounded-[24px] bg-white/95 border border-canvas-deep p-6 mb-6 overflow-hidden shadow-[0_8px_32px_rgba(31,43,34,0.06)]"
        >
          <h3 className="font-display text-[19px] text-moss-deep mb-4">Log last night&rsquo;s sleep</h3>
          <div className="grid sm:grid-cols-2 gap-5 mb-5">
            <div>
              <label className="block text-[11px] uppercase tracking-[0.1em] text-text-secondary mb-2">
                Hours slept: {sleepHours}h
              </label>
              <input
                type="range" min="1" max="14" step="0.5" value={sleepHours}
                onChange={e => setSleepHours(Number(e.target.value))}
                className="w-full accent-moss"
              />
            </div>
            <div>
              <label className="block text-[11px] uppercase tracking-[0.1em] text-text-secondary mb-2">
                Quality (1–5): {sleepQuality}
              </label>
              <input
                type="range" min="1" max="5" value={sleepQuality}
                onChange={e => setSleepQuality(Number(e.target.value))}
                className="w-full accent-moss"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <MotionButton variant="outline" onClick={() => setShowSleepLogger(false)}>Cancel</MotionButton>
            <MotionButton onClick={handleLogSleep}>Save sleep log</MotionButton>
          </div>
        </motion.div>
      )}

      {/* Mentor insight */}
      <Reveal delay={0.1}>
        <div className="rounded-[24px] bg-moss/5 border border-moss/15 px-6 py-5 mb-6 flex gap-3 items-start">
          <Sparkles size={16} className="text-moss mt-0.5 shrink-0" />
          <div>
            <p className="text-[13px] font-medium text-moss-deep mb-1">Your mentor noticed…</p>
            <p className="text-[14px] leading-relaxed text-text-body">{latestObservation}</p>
          </div>
        </div>
      </Reveal>

      {/* Today's plan */}
      <Reveal delay={0.15}>
        <div className="rounded-[28px] bg-white/95 border border-canvas-deep p-6 sm:p-8 shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
          <h2 className="flex items-center gap-2 font-display text-[22px] text-ink mb-6">
            <Sparkles size={18} className="text-clay" /> Today&rsquo;s recommended flow
          </h2>
          {loadingPlan ? (
            <div>
              <SkeletonLoader type="text" count={2} />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                <SkeletonLoader type="pose" />
                <SkeletonLoader type="pose" />
              </div>
            </div>
          ) : plan ? (
            <WellnessPlan
              plan={plan}
              onRegenerate={() => handleGeneratePlan()}
              onStartSession={onStartSession}
              onLearnMore={onLearnMore}
            />
          ) : (
            <div className="text-center py-6">
              <p className="text-text-secondary mb-4">We couldn&rsquo;t generate your plan right now.</p>
              <MotionButton onClick={() => handleGeneratePlan()}>Try again</MotionButton>
            </div>
          )}
        </div>
      </Reveal>
    </div>
  );
}

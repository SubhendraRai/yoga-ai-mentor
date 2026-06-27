import { motion } from 'framer-motion';
import { Lock, CheckCircle2, Circle, ArrowLeft, Flame, Rocket, Sparkles } from 'lucide-react';
import MotionButton from './motion/MotionButton';

export default function CameraLockScreen({ profile, onBack }) {
  const currentStreak = profile?.current_streak || 0;
  const completedSessions = profile?.completed_sessions || 0;
  const assessmentCompleted = !!profile?.wellness_assessment_completed;

  const streakDaysTarget = 7;
  const sessionsTarget = 10;

  const streakRemaining = Math.max(0, streakDaysTarget - currentStreak);
  const sessionsRemaining = Math.max(0, sessionsTarget - completedSessions);
  
  const isStreakComplete = currentStreak >= streakDaysTarget;
  const isSessionsComplete = completedSessions >= sessionsTarget;

  // Calculate estimated unlock days (maximum of remaining streak or sessions, assuming 1 per day)
  const estimatedDays = Math.max(streakRemaining, sessionsRemaining);

  // Motivational message
  let motivationalMessage = 'Keep practicing daily to unlock Early Access.';
  let MotivationIcon = Sparkles;
  let motivationColor = 'var(--accent-gold)';

  if (currentStreak === 5) {
    motivationalMessage = "You're only 2 days away from unlocking AI Pose Detection Early Access.";
    MotivationIcon = Flame;
    motivationColor = '#e07070'; // Soft warm coral/red
  } else if (currentStreak === 6) {
    motivationalMessage = "One more day! Complete tomorrow's session to unlock AI Pose Detection.";
    MotivationIcon = Rocket;
    motivationColor = 'var(--accent-gold)';
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8 relative">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[540px] bg-white/95 dark:bg-[#13131a] border border-canvas-deep dark:border-[#2a2a35] rounded-[28px] p-8 sm:p-10 shadow-[0_24px_64px_rgba(0,0,0,0.15)] relative overflow-hidden"
      >
        {/* Subtle background glow */}
        <div className="absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl bg-accent-gold/10 pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-48 h-48 rounded-full blur-3xl bg-moss/10 pointer-events-none" />

        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs text-text-secondary hover:text-accent-gold transition-colors mb-6 group"
        >
          <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
          Back to Dashboard
        </button>

        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-full bg-accent-gold-dim flex items-center justify-center mx-auto mb-5 border border-accent-gold/20 relative">
            <Lock size={28} className="text-accent-gold" />
            <motion.div 
              animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border-2 border-accent-gold/30"
            />
          </div>
          
          <h2 className="font-display text-2xl sm:text-3xl font-medium text-ink dark:text-text-primary mb-3">
            AI Pose Detection
          </h2>
          <p className="text-sm text-text-secondary max-w-[380px] mx-auto leading-relaxed">
            You're very close to unlocking this feature. Maintain your consistency and build a daily habit to earn early access.
          </p>
        </div>

        <div className="bg-canvas dark:bg-[#1c1c24] border border-canvas-deep dark:border-[#2a2a35] rounded-2xl p-6 mb-6">
          <h3 className="text-xs uppercase tracking-wider font-semibold text-accent-gold mb-4">
            Requirements Status
          </h3>

          <div className="space-y-4">
            {/* Wellness Onboarding */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {assessmentCompleted ? (
                  <CheckCircle2 size={20} className="text-success-color" />
                ) : (
                  <Circle size={20} className="text-clay" />
                )}
                <span className={`text-[14px] ${assessmentCompleted ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  Wellness Assessment
                </span>
              </div>
              <span className={`text-[13px] font-medium ${assessmentCompleted ? 'text-success-color' : 'text-clay'}`}>
                {assessmentCompleted ? 'Completed' : 'Pending'}
              </span>
            </div>

            {/* Yoga Sessions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isSessionsComplete ? (
                  <CheckCircle2 size={20} className="text-success-color" />
                ) : (
                  <Circle size={20} className="text-clay" />
                )}
                <span className={`text-[14px] ${isSessionsComplete ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  Yoga Sessions
                </span>
              </div>
              <span className={`text-[13px] font-mono font-medium ${isSessionsComplete ? 'text-success-color' : 'text-text-secondary'}`}>
                {completedSessions}/{sessionsTarget}
              </span>
            </div>

            {/* Streak Days */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isStreakComplete ? (
                  <CheckCircle2 size={20} className="text-success-color" />
                ) : (
                  <Circle size={20} className="text-clay" />
                )}
                <span className={`text-[14px] ${isStreakComplete ? 'text-text-primary font-medium' : 'text-text-secondary'}`}>
                  Streak Days
                </span>
              </div>
              <span className={`text-[13px] font-mono font-medium ${isStreakComplete ? 'text-success-color' : 'text-text-secondary'}`}>
                {currentStreak}/{streakDaysTarget}
              </span>
            </div>
          </div>
        </div>

        {/* Motivational Card */}
        <div 
          className="border rounded-2xl p-5 mb-8 flex gap-4 items-start"
          style={{ 
            borderColor: `${motivationColor}25`, 
            backgroundColor: `${motivationColor}08` 
          }}
        >
          <MotivationIcon size={20} style={{ color: motivationColor }} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-[14px] leading-relaxed font-medium text-text-primary" style={{ color: currentStreak === 5 || currentStreak === 6 ? motivationColor : 'inherit' }}>
              {motivationalMessage}
            </p>
          </div>
        </div>

        {estimatedDays > 0 && (
          <div className="text-center mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-accent-gold-dim text-accent-gold font-mono text-[11px] font-semibold uppercase tracking-wider">
              Estimated unlock: {estimatedDays} more day{estimatedDays > 1 ? 's' : ''}
            </span>
          </div>
        )}

        <MotionButton 
          fullWidth 
          onClick={onBack}
        >
          Keep Practicing
        </MotionButton>
      </motion.div>
    </div>
  );
}

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateOnboardingProfile } from '../lib/ai';
import { ChevronRight, Check } from 'lucide-react';
import MotionButton from './motion/MotionButton';
import ContourLine from './motion/ContourLine';

export default function Onboarding({ user, onComplete }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [aiProfile, setAiProfile] = useState('');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    age: '',
    occupation: '',
    schedule: '',
    bedtime: '22:00',
    wakeTime: '06:00',
    goals: [],
    otherGoals: '',
    fitnessLevel: 'beginner',
    yogaExperience: 'none',
    healthConditions: '',
    timePerDay: '15',
    preferredTime: 'morning',
    daysPerWeek: '5',
    stressLevel: '5'
  });

  const goalsList = [
    'Stress Relief', 'Flexibility', 'Weight Management',
    'Better Focus', 'Pain Relief', 'Build Strength',
    'Better Sleep', 'More Energy', 'Meditation', 'Anxiety Management'
  ];

  const updateForm = (key, value) => setFormData(prev => ({ ...prev, [key]: value }));

  const toggleGoal = (goal) => {
    setFormData(prev => {
      const current = prev.goals;
      if (current.includes(goal)) return { ...prev, goals: current.filter(g => g !== goal) };
      return { ...prev, goals: [...current, goal] };
    });
  };

  const handleNext = async () => {
    if (step < 6) {
      setStep(step + 1);
      if (step + 1 === 6) {
        await generateProfile();
      }
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const generateProfile = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await generateOnboardingProfile(formData);
      if (response.success) {
        setAiProfile(response.text);
      } else {
        setError(response.error || 'Failed to generate profile. Please try again.');
        setStep(5); // Go back on error
      }
    } catch (err) {
      setError(err.message);
      setStep(5);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    WellnessMemory.completeOnboarding({ ...formData, aiAssessment: aiProfile });
    onComplete();
  };

  const StepActions = ({ nextLabel = 'Next', showBack = true }) => (
    <div className="flex gap-3 mt-7">
      {showBack && (
        <MotionButton variant="outline" onClick={handleBack} className="flex-1">
          Back
        </MotionButton>
      )}
      <MotionButton onClick={handleNext} className={showBack ? 'flex-[2]' : 'w-full'}>
        {nextLabel}
      </MotionButton>
    </div>
  );

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-5 py-16 bg-canvas overflow-hidden">
      <div className="ambient-bg">
        <div className="ambient-orb ambient-orb--mist" />
        <div className="ambient-orb ambient-orb--moss" />
      </div>

      <div className="relative z-10 w-full max-w-[520px] mb-8">
        <div className="w-full h-[3px] bg-canvas-deep rounded-full overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-moss to-mist"
            initial={{ width: 0 }}
            animate={{ width: `${(step / 6) * 100}%` }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>
        <p className="text-[11px] text-text-secondary uppercase tracking-[0.12em] text-center">
          Step {step} of 6
        </p>
      </div>

      <div className="relative z-10 w-full max-w-[520px] bg-white/95 border border-canvas-deep rounded-[28px] p-8 sm:p-9 shadow-[0_24px_64px_rgba(31,43,34,0.08)] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.35, ease: [0.45, 0, 0.2, 1] }}
          >
            {step === 1 && (
              <div className="text-center">
                <h2 className="font-display text-[30px] sm:text-[34px] font-medium text-ink mb-3 leading-tight">
                  Welcome to your sanctuary, {formData.name}
                </h2>
                <ContourLine variant="divider" className="w-[180px] h-4 mx-auto mb-5" />
                <p className="text-text-secondary text-[14px] leading-relaxed mb-8 max-w-[400px] mx-auto">
                  I am your new AI Wellness Mentor. I will learn about your lifestyle, body, and goals to craft a personalized journey just for you.
                </p>
                <MotionButton onClick={handleNext} icon={<ChevronRight size={18} />}>
                  Let&rsquo;s begin
                </MotionButton>
              </div>
            )}

            {step === 2 && (
              <div>
                <h3 className="font-display text-[20px] text-moss-deep mb-5">About you</h3>
                <div className="grid grid-cols-2 gap-4">
                  <OField label="Age">
                    <input type="number" value={formData.age} onChange={e => updateForm('age', e.target.value)} placeholder="e.g. 28" className="o-input" />
                  </OField>
                  <OField label="Occupation">
                    <input type="text" value={formData.occupation} onChange={e => updateForm('occupation', e.target.value)} placeholder="e.g. Software Engineer" className="o-input" />
                  </OField>
                </div>
                <OField label="Daily Schedule">
                  <textarea value={formData.schedule} onChange={e => updateForm('schedule', e.target.value)} placeholder="e.g. Desk job 9-5, active on weekends..." className="o-input min-h-[80px] resize-y" />
                </OField>
                <div className="grid grid-cols-2 gap-4">
                  <OField label="Typical Bedtime">
                    <input type="time" value={formData.bedtime} onChange={e => updateForm('bedtime', e.target.value)} className="o-input" />
                  </OField>
                  <OField label="Typical Wake Time">
                    <input type="time" value={formData.wakeTime} onChange={e => updateForm('wakeTime', e.target.value)} className="o-input" />
                  </OField>
                </div>
                <StepActions />
              </div>
            )}

            {step === 3 && (
              <div>
                <h3 className="font-display text-[20px] text-moss-deep mb-1.5">Your goals</h3>
                <p className="text-[13px] text-text-secondary mb-4">What do you want to achieve?</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {goalsList.map((goal, i) => {
                    const selected = formData.goals.includes(goal);
                    return (
                      <motion.button
                        type="button"
                        key={goal}
                        onClick={() => toggleGoal(goal)}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.97 }}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03, duration: 0.3 }}
                        className={`flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-[13px] transition-colors duration-200 ${
                          selected ? 'bg-moss/12 border border-moss text-moss-deep' : 'bg-canvas border border-canvas-deep text-text-body hover:border-moss/30'
                        }`}
                      >
                        {selected && <Check size={14} />} {goal}
                      </motion.button>
                    );
                  })}
                </div>
                <OField label="Other goals?" className="mt-4">
                  <input type="text" value={formData.otherGoals} onChange={e => updateForm('otherGoals', e.target.value)} placeholder="Anything else?" className="o-input" />
                </OField>
                <StepActions />
              </div>
            )}

            {step === 4 && (
              <div>
                <h3 className="font-display text-[20px] text-moss-deep mb-5">Your body</h3>
                <div className="grid grid-cols-2 gap-4">
                  <OField label="Fitness Level">
                    <select value={formData.fitnessLevel} onChange={e => updateForm('fitnessLevel', e.target.value)} className="o-input o-select">
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </OField>
                  <OField label="Yoga Experience">
                    <select value={formData.yogaExperience} onChange={e => updateForm('yogaExperience', e.target.value)} className="o-input o-select">
                      <option value="none">None</option>
                      <option value="some">A little</option>
                      <option value="regular">Regular practice</option>
                      <option value="advanced">Advanced practice</option>
                    </select>
                  </OField>
                </div>
                <OField label="Health Conditions / Limitations (Optional)">
                  <textarea value={formData.healthConditions} onChange={e => updateForm('healthConditions', e.target.value)} placeholder="e.g. Lower back pain, recovering from knee surgery..." className="o-input min-h-[80px] resize-y" />
                </OField>
                <StepActions />
              </div>
            )}

            {step === 5 && (
              <div>
                <h3 className="font-display text-[20px] text-moss-deep mb-5">Your routine</h3>
                <div className="grid grid-cols-2 gap-4">
                  <OField label="Time per Day">
                    <select value={formData.timePerDay} onChange={e => updateForm('timePerDay', e.target.value)} className="o-input o-select">
                      <option value="10">10 mins</option>
                      <option value="15">15 mins</option>
                      <option value="20">20 mins</option>
                      <option value="30">30 mins</option>
                      <option value="45">45 mins</option>
                      <option value="60">60 mins</option>
                    </select>
                  </OField>
                  <OField label="Preferred Time">
                    <select value={formData.preferredTime} onChange={e => updateForm('preferredTime', e.target.value)} className="o-input o-select">
                      <option value="early morning">Early Morning</option>
                      <option value="morning">Morning</option>
                      <option value="afternoon">Afternoon</option>
                      <option value="evening">Evening</option>
                      <option value="night">Night</option>
                    </select>
                  </OField>
                </div>
                <OField label="Days per week">
                  <select value={formData.daysPerWeek} onChange={e => updateForm('daysPerWeek', e.target.value)} className="o-input o-select">
                    <option value="3">3 days</option>
                    <option value="4">4 days</option>
                    <option value="5">5 days</option>
                    <option value="6">6 days</option>
                    <option value="7">Every day</option>
                  </select>
                </OField>
                <OField label={`Current Stress Level: ${formData.stressLevel}/10`}>
                  <input type="range" min="1" max="10" value={formData.stressLevel} onChange={e => updateForm('stressLevel', e.target.value)} className="w-full accent-moss" />
                </OField>
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-clay text-[13px] bg-clay/8 border border-clay/20 rounded-xl py-2.5 px-3 mt-2"
                    >
                      {error}
                    </motion.div>
                  )}
                </AnimatePresence>
                <StepActions nextLabel="Generate profile" />
              </div>
            )}

            {step === 6 && (
              <div>
                {loading ? (
                  <div className="flex flex-col items-center gap-4 py-16">
                    <motion.div
                      className="w-10 h-10 rounded-full border-2 border-canvas-deep border-t-moss"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                    <motion.span
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2.2, repeat: Infinity, ease: [0.45, 0, 0.2, 1] }}
                      className="text-[13px] text-text-secondary"
                    >
                      Your mentor is analyzing your profile…
                    </motion.span>
                  </div>
                ) : (
                  <div>
                    <h3 className="font-display text-[20px] text-moss-deep text-center mb-6">Your wellness profile</h3>
                    <div className="bg-canvas border border-canvas-deep rounded-2xl p-5 max-h-[300px] overflow-y-auto mb-6 text-[14px] leading-[1.8] text-text-body whitespace-pre-wrap">
                      {aiProfile}
                    </div>
                    <MotionButton fullWidth onClick={handleComplete} icon={<ChevronRight size={18} />}>
                      Enter your sanctuary
                    </MotionButton>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

function OField({ label, children, className = '' }) {
  return (
    <div className={`mb-5 ${className}`}>
      <label className="block text-[11px] uppercase tracking-[0.1em] text-moss-deep font-medium mb-2">
        {label}
      </label>
      {children}
    </div>
  );
}

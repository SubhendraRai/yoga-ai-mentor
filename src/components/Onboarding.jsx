import { useState } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateOnboardingProfile } from '../lib/ai';
import { ChevronRight, Check } from 'lucide-react';

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

  return (
    <div className="app-fullscreen" style={{ justifyContent: 'center' }}>
      <div className="onboarding-progress">
        <div className="onboarding-progress-bar">
          <div className="onboarding-progress-fill" style={{ width: `${(step / 6) * 100}%` }} />
        </div>
        <div className="onboarding-step-label">Step {step} of 6</div>
      </div>

      <div className="onboarding-card">
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <h2 className="hero-title" style={{ fontSize: '32px' }}>Welcome to your sanctuary, {formData.name}</h2>
            <p className="hero-sub" style={{ marginBottom: '32px' }}>
              I am your new AI Wellness Mentor. I will learn about your lifestyle, body, and goals to craft a personalized journey just for you.
            </p>
            <button className="submit-btn" onClick={handleNext}>
              Let's Begin <ChevronRight size={18} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <div className="card-header">About You</div>
            <div className="row">
              <div className="field">
                <label>Age</label>
                <input 
                  type="number" 
                  min="1" 
                  max="150" 
                  value={formData.age} 
                  onChange={e => {
                    const val = parseInt(e.target.value, 10);
                    if (!e.target.value || (val > 0 && val <= 150)) {
                      updateForm('age', e.target.value);
                    } else if (val > 150) {
                      updateForm('age', '150');
                    }
                  }} 
                  placeholder="e.g. 28" 
                />
              </div>
              <div className="field">
                <label>Occupation</label>
                <input type="text" value={formData.occupation} onChange={e => updateForm('occupation', e.target.value)} placeholder="e.g. Software Engineer" />
              </div>
            </div>
            <div className="field">
              <label>Daily Schedule</label>
              <textarea value={formData.schedule} onChange={e => updateForm('schedule', e.target.value)} placeholder="e.g. Desk job 9-5, active on weekends..." />
            </div>
            <div className="row">
              <div className="field">
                <label>Typical Bedtime</label>
                <input type="time" value={formData.bedtime} onChange={e => updateForm('bedtime', e.target.value)} />
              </div>
              <div className="field">
                <label>Typical Wake Time</label>
                <input type="time" value={formData.wakeTime} onChange={e => updateForm('wakeTime', e.target.value)} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBack}>Back</button>
              <button className="submit-btn" style={{ flex: 2, marginTop: 0 }} onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <div className="card-header">Your Goals</div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>What do you want to achieve?</p>
            <div className="goals-grid">
              {goalsList.map(goal => (
                <div
                  key={goal}
                  className={`goal-chip ${formData.goals.includes(goal) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(goal)}
                >
                  {formData.goals.includes(goal) && <Check size={14} />} {goal}
                </div>
              ))}
            </div>
            <div className="field" style={{ marginTop: '16px' }}>
              <label>Other goals?</label>
              <input type="text" value={formData.otherGoals} onChange={e => updateForm('otherGoals', e.target.value)} placeholder="Anything else?" />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBack}>Back</button>
              <button className="submit-btn" style={{ flex: 2, marginTop: 0 }} onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {step === 4 && (
          <div>
            <div className="card-header">Your Body</div>
            <div className="row">
              <div className="field">
                <label>Fitness Level</label>
                <select value={formData.fitnessLevel} onChange={e => updateForm('fitnessLevel', e.target.value)}>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
              <div className="field">
                <label>Yoga Experience</label>
                <select value={formData.yogaExperience} onChange={e => updateForm('yogaExperience', e.target.value)}>
                  <option value="none">None</option>
                  <option value="some">A little</option>
                  <option value="regular">Regular practice</option>
                  <option value="advanced">Advanced practice</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Health Conditions / Limitations (Optional)</label>
              <textarea value={formData.healthConditions} onChange={e => updateForm('healthConditions', e.target.value)} placeholder="e.g. Lower back pain, recovering from knee surgery..." />
            </div>
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBack}>Back</button>
              <button className="submit-btn" style={{ flex: 2, marginTop: 0 }} onClick={handleNext}>Next</button>
            </div>
          </div>
        )}

        {step === 5 && (
          <div>
            <div className="card-header">Your Routine</div>
            <div className="row">
              <div className="field">
                <label>Time per Day</label>
                <select value={formData.timePerDay} onChange={e => updateForm('timePerDay', e.target.value)}>
                  <option value="10">10 mins</option>
                  <option value="15">15 mins</option>
                  <option value="20">20 mins</option>
                  <option value="30">30 mins</option>
                  <option value="45">45 mins</option>
                  <option value="60">60 mins</option>
                </select>
              </div>
              <div className="field">
                <label>Preferred Time</label>
                <select value={formData.preferredTime} onChange={e => updateForm('preferredTime', e.target.value)}>
                  <option value="early morning">Early Morning</option>
                  <option value="morning">Morning</option>
                  <option value="afternoon">Afternoon</option>
                  <option value="evening">Evening</option>
                  <option value="night">Night</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Days per week</label>
              <select value={formData.daysPerWeek} onChange={e => updateForm('daysPerWeek', e.target.value)}>
                <option value="3">3 days</option>
                <option value="4">4 days</option>
                <option value="5">5 days</option>
                <option value="6">6 days</option>
                <option value="7">Every day</option>
              </select>
            </div>
            <div className="field">
              <label>Current Stress Level: {formData.stressLevel}/10</label>
              <input type="range" min="1" max="10" value={formData.stressLevel} onChange={e => updateForm('stressLevel', e.target.value)} style={{ width: '100%' }} />
            </div>
            {error && <div className="error">{error}</div>}
            <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
              <button className="btn-outline" style={{ flex: 1, justifyContent: 'center' }} onClick={handleBack}>Back</button>
              <button className="submit-btn" style={{ flex: 2, marginTop: 0 }} onClick={handleNext}>Generate Profile</button>
            </div>
          </div>
        )}

        {step === 6 && (
          <div>
            {loading ? (
              <div className="loading-wrap" style={{ padding: '60px 0' }}>
                <div className="spinner" />
                <span style={{ marginTop: '16px' }}>Your mentor is analyzing your profile...</span>
              </div>
            ) : (
              <div>
                <div className="card-header" style={{ justifyContent: 'center', marginBottom: '24px' }}>Your Wellness Profile</div>
                <div className="result-body" style={{ background: 'var(--bg-primary)', padding: '20px', borderRadius: '12px', border: '0.5px solid var(--border-color)', maxHeight: '300px', overflowY: 'auto', marginBottom: '24px' }}>
                  {aiProfile}
                </div>
                <button className="submit-btn" onClick={handleComplete}>
                  Enter Your Sanctuary <ChevronRight size={18} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

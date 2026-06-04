import { useState, useEffect } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateWellnessPlan, generateMorningGreeting } from '../lib/gemini';
import WellnessScore from './WellnessScore';
import MoodTracker from './MoodTracker';
import WellnessPlan from './WellnessPlan';
import { Sparkles, Sun, Moon, Flower2, Camera, MessageCircle, MoonStar, Flame } from 'lucide-react';

export default function Dashboard({ onNavigate }) {
  const [greeting, setGreeting] = useState('');
  const [plan, setPlan] = useState('');
  const [loadingPlan, setLoadingPlan] = useState(false);
  const [showSleepLogger, setShowSleepLogger] = useState(false);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  
  const profile = WellnessMemory.getProfile();
  const score = WellnessMemory.calculateWellnessScore();
  const streak = WellnessMemory.getStreak();
  const observations = WellnessMemory.getObservations();
  const latestObservation = observations.length > 0 ? observations[observations.length - 1].text : "You're doing great! Keep up the consistency.";

  const isAM = new Date().getHours() < 12;

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    const context = WellnessMemory.getContextForAI();
    
    // Greeting
    generateMorningGreeting(context).then(res => {
      if (res.success) setGreeting(res.text);
      else setGreeting(`Good ${isAM ? 'morning' : 'evening'}, ${profile?.name}. Ready for your practice?`);
    });

    // Plan
    const savedPlan = WellnessMemory.getDailyPlan();
    if (savedPlan) {
      setPlan(savedPlan);
    } else {
      handleGeneratePlan(context);
    }
  };

  const handleGeneratePlan = async (context = WellnessMemory.getContextForAI()) => {
    setLoadingPlan(true);
    const res = await generateWellnessPlan(context);
    if (res.success) {
      setPlan(res.text);
      WellnessMemory.saveDailyPlan(res.text);
    }
    setLoadingPlan(false);
  };

  const handleLogSleep = () => {
    WellnessMemory.logSleep(sleepHours, sleepQuality);
    setShowSleepLogger(false);
  };

  return (
    <div className="dashboard-grid">
      {/* Greeting Banner */}
      <div className="dashboard-greeting">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAM ? <Sun style={{ color: '#e8c44a' }} /> : <Moon style={{ color: '#8892b0' }} />}
          {greeting || 'Loading...'}
        </h2>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <WellnessScore score={score.total} breakdown={{ physical: score.activityScore, mental: score.moodScore, consistency: score.sleepScore }} />
        <MoodTracker compact={true} />
        
        <div className="card-sm" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div className="card-header" style={{ fontSize: '15px', marginBottom: '8px' }}>Current Streak</div>
          <Flame size={48} style={{ color: streak > 0 ? '#e07070' : 'var(--border-color)', margin: '16px 0' }} />
          <div style={{ fontSize: '32px', fontFamily: "'Cormorant Garamond', serif", color: 'var(--accent-gold)' }}>{streak}</div>
          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Days Active</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button className="action-btn" onClick={() => onNavigate('yoga')}>
          <Flower2 size={24} />
          <span>Start Yoga</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('pose')}>
          <Camera size={24} />
          <span>Pose Check</span>
        </button>
        <button className="action-btn" onClick={() => onNavigate('chat')}>
          <MessageCircle size={24} />
          <span>Talk to Mentor</span>
        </button>
        <button className="action-btn" onClick={() => setShowSleepLogger(true)}>
          <MoonStar size={24} />
          <span>Log Sleep</span>
        </button>
      </div>

      {/* Sleep Logger Inline Modal */}
      {showSleepLogger && (
        <div className="card" style={{ animation: 'fadeUp 0.3s ease' }}>
          <div className="card-header">Log Last Night's Sleep</div>
          <div className="row">
            <div className="field">
              <label>Hours Slept: {sleepHours}h</label>
              <input type="range" min="1" max="14" step="0.5" value={sleepHours} onChange={e => setSleepHours(Number(e.target.value))} />
            </div>
            <div className="field">
              <label>Quality (1-5): {sleepQuality}</label>
              <input type="range" min="1" max="5" value={sleepQuality} onChange={e => setSleepQuality(Number(e.target.value))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button className="btn-outline" onClick={() => setShowSleepLogger(false)}>Cancel</button>
            <button className="submit-btn" style={{ marginTop: 0 }} onClick={handleLogSleep}>Save Sleep Log</button>
          </div>
        </div>
      )}

      {/* AI Insight */}
      <div className="card" style={{ background: 'linear-gradient(to right, var(--bg-secondary), var(--bg-tertiary))' }}>
        <div className="card-header" style={{ fontSize: '16px' }}>
          <Sparkles size={16} /> Your mentor noticed...
        </div>
        <p style={{ color: 'var(--text-body)', fontSize: '14px', lineHeight: '1.6' }}>
          {latestObservation}
        </p>
      </div>

      {/* Plan */}
      {loadingPlan ? (
        <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '60px 0' }}>
          <div className="spinner" />
        </div>
      ) : (
        <WellnessPlan plan={plan} onRegenerate={() => handleGeneratePlan()} />
      )}
    </div>
  );
}

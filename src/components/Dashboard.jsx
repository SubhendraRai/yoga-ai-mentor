import { useState, useEffect } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { generateMorningGreeting } from '../lib/ai';
import { generateRuleBasedPlan } from '../lib/rulesEngine';
import WellnessScore from './WellnessScore';
import MoodTracker from './MoodTracker';
import WellnessPlan from './WellnessPlan';
import SkeletonLoader from './SkeletonLoader';
import FeatureWalkthrough from './FeatureWalkthrough';
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
    if (!WellnessMemory.getItem('has_seen_tour')) {
      setShowWalkthrough(true);
    }

    return () => window.removeEventListener('wellness_synced', handleSync);
  }, []);

  const handleWalkthroughComplete = () => {
    WellnessMemory.setItem('has_seen_tour', 'true');
    setShowWalkthrough(false);
  };

  const loadDashboardData = async () => {
    const context = WellnessMemory.getContextForAI();
    const todayStr = new Date().toISOString().split('T')[0];
    
    // Greeting (Daily Cache)
    const cachedGreeting = WellnessMemory.getItem('greeting');
    const greetingDate = WellnessMemory.getItem('greeting_date');
    
    if (cachedGreeting && greetingDate === todayStr) {
      setGreeting(cachedGreeting);
    } else {
      generateMorningGreeting(context).then(res => {
        if (res.success) {
          setGreeting(res.text);
          WellnessMemory.setItem('greeting', res.text);
          WellnessMemory.setItem('greeting_date', todayStr);
        } else {
          setGreeting(`Good ${isAM ? 'morning' : 'evening'}, ${profile?.name || 'Om'}. Ready for your practice?`);
        }
      });
    }

    // Plan — regenerate daily OR when profile changes
    const profileFingerprint = JSON.stringify({
      goals: profile?.goals,
      fitnessLevel: profile?.fitnessLevel,
      timePerDay: profile?.timePerDay,
      healthConditions: profile?.healthConditions,
    });
    const savedPlan = WellnessMemory.getDailyPlan();
    const planDate = WellnessMemory.getItem('plan_date');
    const savedFingerprint = WellnessMemory.getItem('plan_fingerprint');

    const needsNewPlan = !savedPlan
      || planDate !== todayStr
      || savedFingerprint !== profileFingerprint;

    if (!needsNewPlan) {
      setPlan(savedPlan);
    } else {
      handleGeneratePlan(profile, todayStr, profileFingerprint);
    }
  };

  const handleGeneratePlan = (currentProfile = profile, todayStr = new Date().toISOString().split('T')[0], fingerprint = '') => {
    setLoadingPlan(true);
    const sleepHist = WellnessMemory.getSleepHistory(7);
    const moodHist = WellnessMemory.getMoodHistory(7);
    
    const ruleBasedPlan = generateRuleBasedPlan(currentProfile, moodHist, sleepHist);
    const planString = JSON.stringify(ruleBasedPlan);
    
    setPlan(planString);
    WellnessMemory.saveDailyPlan(planString);
    WellnessMemory.setItem('plan_date', todayStr);
    WellnessMemory.setItem('plan_fingerprint', fingerprint || JSON.stringify({
      goals: currentProfile?.goals,
      fitnessLevel: currentProfile?.fitnessLevel,
      timePerDay: currentProfile?.timePerDay,
      healthConditions: currentProfile?.healthConditions,
    }));
    
    setTimeout(() => {
      setLoadingPlan(false);
    }, 500);
  };


  const handleLogSleep = () => {
    WellnessMemory.logSleep(sleepHours, sleepQuality);
    setShowSleepLogger(false);
  };

  return (
    <div style={{ animation: 'fadeIn 0.5s ease', paddingBottom: '40px', position: 'relative' }}>
      
      {showWalkthrough && (
        <FeatureWalkthrough onComplete={handleWalkthroughComplete} />
      )}

      {/* Header */}
      <div className="dashboard-grid">
      {/* Greeting Banner */}
      <div className="dashboard-greeting">
        <h2 style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {isAM ? <Sun style={{ color: '#e8c44a' }} /> : <Moon style={{ color: '#8892b0' }} />}
          {greeting || <SkeletonLoader type="title" />}
        </h2>
      </div>

      {/* Stats Row */}
      <div className="stats-row">
        <WellnessScore score={score.total} breakdown={{ physical: score.activityScore, mental: score.moodScore, sleep: score.sleepScore, consistency: score.streakScore }} />
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
        <div className="card-header" style={{ fontSize: '16px' }}>
          <Sparkles size={16} /> Your mentor noticed...
        </div>
        <p style={{ color: 'var(--text-body)', fontSize: '14px', lineHeight: '1.6' }}>
          {latestObservation}
        </p>
      </div>

      {/* Plan */}
      <div className="card plan-card" style={{ gridColumn: '1 / -1' }}>
        <div className="card-header">
          <h3><Sparkles size={20} className="icon-gold" /> Today's Recommended Flow</h3>
        </div>
        {loadingPlan ? (
          <div style={{ padding: '20px' }}>
            <SkeletonLoader type="text" count={2} />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '24px' }}>
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
          <div style={{ padding: '24px', textAlign: 'center' }}>
            <p style={{ marginBottom: '16px', color: 'var(--text-secondary)' }}>We couldn't generate your plan right now.</p>
            <button className="submit-btn" onClick={() => handleGeneratePlan()} style={{ maxWidth: '200px', margin: '0 auto' }}>
              Try Again
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

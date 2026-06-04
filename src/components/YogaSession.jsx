import { useState, useEffect, useRef, useCallback } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { playSound } from '../lib/audio';
import { Play, Pause, SkipForward, SkipBack, Camera, Check } from 'lucide-react';

export default function YogaSession({ session, onComplete, onStartPoseCheck }) {
  const defaultSession = [
    { name: "Child's Pose", duration: 2, description: "Resting pose that gently stretches the hips, thighs, and ankles.", benefits: "Relieves back and neck pain, calms the brain." },
    { name: "Cat-Cow Stretch", duration: 3, description: "Gentle flow between two poses that warms the body and brings flexibility to the spine.", benefits: "Improves posture and balance, strengthens and stretches the spine and neck." },
    { name: "Downward-Facing Dog", duration: 2, description: "Inverted V-shape that builds strength while stretching the whole body.", benefits: "Energizes the body, stretches shoulders, hamstrings, and calves." },
    { name: "Warrior II", duration: 2, description: "Standing pose with legs wide apart, front knee bent, arms parallel to floor.", benefits: "Strengthens and stretches legs and ankles, increases stamina." },
    { name: "Savasana", duration: 5, description: "Final relaxation pose lying flat on the back.", benefits: "Relaxes the whole body, reduces headache, fatigue, and insomnia." }
  ];

  const poses = session || defaultSession;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeLeft, setTimeLeft] = useState(poses[0].duration * 60);
  const [isFinished, setIsFinished] = useState(false);
  
  const timerRef = useRef(null);
  const currentPose = poses[currentIndex];

  const handleNext = useCallback(() => {
    if (currentIndex < poses.length - 1) {
      playSound.chime();
      setCurrentIndex(prev => prev + 1);
      setTimeLeft(poses[currentIndex + 1].duration * 60);
      setIsPlaying(true);
    } else {
      playSound.success();
      setIsPlaying(false);
      setIsFinished(true);
      WellnessMemory.logActivity(`yoga_${Date.now()}`, 'Yoga Session', 'Completed guided session', poses.reduce((acc, p) => acc + p.duration, 0));
    }
  }, [currentIndex, poses]);

  useEffect(() => {
    if (isPlaying && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      handleNext();
    }
    
    return () => clearInterval(timerRef.current);
  }, [isPlaying, timeLeft, handleNext]);

  const handlePlayPause = () => setIsPlaying(!isPlaying);

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setTimeLeft(poses[currentIndex - 1].duration * 60);
      setIsPlaying(false); // Pause on manual nav
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  if (isFinished) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '40px auto', textAlign: 'center', padding: '60px 40px' }}>
        <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(112, 184, 112, 0.1)', color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
          <Check size={32} />
        </div>
        <h2 className="hero-title" style={{ fontSize: '36px' }}>Session Complete</h2>
        <p className="hero-sub">You've successfully completed {poses.length} poses.</p>
        <button className="submit-btn" style={{ maxWidth: '200px', margin: '32px auto 0' }} onClick={onComplete}>
          Return to Dashboard
        </button>
      </div>
    );
  }

  // Timer SVG calcs
  const totalSeconds = currentPose.duration * 60;
  const radius = 76;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (timeLeft / totalSeconds) * circumference;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-gold" style={{ marginBottom: '16px' }}>Pose {currentIndex + 1} of {poses.length}</div>
        <h2 className="hero-title" style={{ fontSize: '42px', marginBottom: '16px' }}>{currentPose.name}</h2>
        <button 
          className="btn-outline" 
          style={{ background: 'var(--bg-secondary)' }}
          onClick={() => onStartPoseCheck(currentPose.name)}
        >
          <Camera size={14} /> Check My Pose
        </button>
      </div>

      <div className="card" style={{ padding: '48px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div className="session-timer">
          <svg>
            <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--bg-tertiary)" strokeWidth="6" />
            <circle 
              cx="80" cy="80" r={radius} fill="none" stroke="var(--accent-gold)" 
              strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} 
              strokeDashoffset={strokeDashoffset} 
              style={{ transition: 'stroke-dashoffset 1s linear' }} 
            />
          </svg>
          <div className="session-timer-text">{formatTime(timeLeft)}</div>
        </div>

        <div className="session-controls">
          <button className="session-control-btn" onClick={handlePrev} disabled={currentIndex === 0}><SkipBack size={20} /></button>
          <button className="session-control-btn primary" onClick={handlePlayPause}>
            {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" style={{ marginLeft: '4px' }} />}
          </button>
          <button className="session-control-btn" onClick={handleNext}><SkipForward size={20} /></button>
        </div>

        <div style={{ marginTop: '48px', width: '100%', maxWidth: '500px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-primary)', fontSize: '16px', lineHeight: '1.6', marginBottom: '16px' }}>
            {currentPose.description}
          </p>
          <div className="info-alert" style={{ textAlign: 'left' }}>
            <strong style={{ color: 'var(--accent-gold)' }}>Benefits:</strong> {currentPose.benefits}
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';

export default function WellnessScore({ score, breakdown }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    // Animate score from 0 to actual value
    const duration = 1500; // ms
    const steps = 60;
    const stepTime = duration / steps;
    const increment = score / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setAnimatedScore(score);
        clearInterval(timer);
      } else {
        setAnimatedScore(Math.floor(current));
      }
    }, stepTime);

    return () => clearInterval(timer);
  }, [score]);

  // SVG Ring calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  const getColor = (val) => {
    if (val >= 70) return 'var(--accent-gold)';
    if (val >= 40) return 'rgba(196, 169, 106, 0.7)';
    return 'rgba(196, 169, 106, 0.4)';
  };

  const getBreakdownLabel = (key) => {
    switch (key) {
      case 'physical': return 'Physical Activity';
      case 'mental': return 'Mental Balance';
      case 'consistency': return 'Consistency';
      default: return key;
    }
  };

  return (
    <div className="card-sm">
      <div className="card-header" style={{ fontSize: '15px', marginBottom: '16px' }}>Wellness Score</div>
      
      <div className="score-ring-container">
        <div className="score-ring">
          <svg>
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke="var(--bg-tertiary)"
              strokeWidth="8"
            />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={getColor(animatedScore)}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              style={{ transition: 'stroke-dashoffset 0.1s linear, stroke 0.3s ease' }}
            />
          </svg>
          <div className="score-ring-value">
            {animatedScore}
          </div>
        </div>

        {breakdown && (
          <div className="score-breakdown">
            {Object.entries(breakdown).map(([key, val]) => {
              const pct = Math.min(100, Math.max(0, (val / 25) * 100));
              return (
                <div key={key} className="score-bar-row">
                  <span style={{ width: '90px' }}>{getBreakdownLabel(key)}</span>
                  <div className="score-bar-track">
                    <div 
                      className="score-bar-fill" 
                      style={{ 
                        width: `${pct}%`, 
                        background: getColor(pct),
                        transitionDuration: '1.5s'
                      }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

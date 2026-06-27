import { useState } from 'react';
import { Camera, Activity, Sparkles, ChevronRight, Check } from 'lucide-react';

const SLIDES = [
  {
    id: 1,
    icon: <Camera size={48} color="var(--accent-gold)" />,
    title: "Meet Your AI Coach",
    description: "YogTatva now features live computer vision. Simply step back from your camera, and the AI will analyze your joint angles in real-time to ensure you are practicing safely."
  },
  {
    id: 2,
    icon: <Activity size={48} color="#4caf50" />,
    title: "Smart Posture Timers",
    description: "Every pose has a required hold time. Our dynamic timer ensures quality over speed—it only counts down while you maintain at least 85% posture accuracy!"
  },
  {
    id: 3,
    icon: <Sparkles size={48} color="#9c27b0" />,
    title: "Personalized Insights",
    description: "After every session, your AI Mentor generates detailed feedback based on your common mistakes and historical trends, helping you improve day by day."
  }
];

export default function FeatureWalkthrough({ onComplete }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const slide = SLIDES[currentSlide];

  return (
    <div style={{
      position: 'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '24px'
    }}>
      <div className="card" style={{
        maxWidth: '500px',
        width: '100%',
        backgroundColor: 'var(--bg-primary)',
        textAlign: 'center',
        padding: '40px 32px',
        position: 'relative',
        animation: 'fadeUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}>
        
        {/* Skip button */}
        <button 
          onClick={onComplete}
          style={{
            position: 'absolute',
            top: '16px',
            right: '24px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            fontSize: '14px',
            cursor: 'pointer'
          }}
        >
          Skip Tour
        </button>

        {/* Icon */}
        <div style={{
          height: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '24px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            padding: '24px',
            borderRadius: '50%',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          }}>
            {slide.icon}
          </div>
        </div>

        {/* Text */}
        <h2 style={{
          fontFamily: "'Fraunces', serif",
          fontSize: '32px',
          color: 'var(--text-primary)',
          marginBottom: '16px'
        }}>
          {slide.title}
        </h2>
        
        <p style={{
          color: 'var(--text-body)',
          fontSize: '16px',
          lineHeight: '1.6',
          marginBottom: '40px',
          minHeight: '80px' // Prevent layout shift between slides
        }}>
          {slide.description}
        </p>

        {/* Dots & Next Button Container */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          
          {/* Dots Indicator */}
          <div style={{ display: 'flex', gap: '8px' }}>
            {SLIDES.map((_, idx) => (
              <div 
                key={idx}
                style={{
                  width: idx === currentSlide ? '24px' : '8px',
                  height: '8px',
                  borderRadius: '4px',
                  backgroundColor: idx === currentSlide ? 'var(--accent-gold)' : 'var(--border-color)',
                  transition: 'all 0.3s ease'
                }}
              />
            ))}
          </div>

          {/* Action Button */}
          <button 
            className="submit-btn" 
            onClick={handleNext}
            style={{ 
              margin: 0, 
              width: 'auto', 
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            {currentSlide === SLIDES.length - 1 ? (
              <>Let's Begin <Check size={18} /></>
            ) : (
              <>Next <ChevronRight size={18} /></>
            )}
          </button>

        </div>
      </div>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { RefreshCw, Play, Info } from 'lucide-react';

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
            imageUrl: `https://placehold.co/800x600/13131a/c4a96a?text=${encodeURIComponent(pose.englishName)}&font=Playfair+Display`
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
    <div style={{ animation: 'fadeUp 0.5s ease both' }}>
      <div className="card" style={{ marginBottom: '24px', background: 'var(--bg-secondary)' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Today's Guidance
        </h3>
        <p style={{ color: 'var(--text-body)', fontSize: '15px', lineHeight: '1.6' }}>
          {parsedPlan.message}
        </p>
      </div>

      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>
        Recommended Flow
      </h3>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
        {recommendedPoses.map(pose => (
          <div key={pose.id} className="card" style={{ padding: '0', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ height: '160px', width: '100%', position: 'relative' }}>
              <img 
                src={pose.imageUrl} 
                alt={pose.englishName} 
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(255,255,255,0.9)', color: '#0d0d0f', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold' }}>
                {pose.duration} mins
              </div>
            </div>
            
            <div style={{ padding: '20px', flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: 'var(--text-primary)', marginBottom: '4px' }}>
                {pose.englishName}
              </h4>
              <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginBottom: '16px' }}>
                {pose.sanskritName}
              </p>
              
              <ul style={{ paddingLeft: '16px', color: 'var(--text-body)', fontSize: '13px', marginBottom: '24px', flex: 1 }}>
                {pose.shortBenefits.map((benefit, i) => (
                  <li key={i} style={{ marginBottom: '4px' }}>{benefit}</li>
                ))}
              </ul>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <button 
                  className="submit-btn" 
                  style={{ marginTop: 0, padding: '10px', fontSize: '13px' }}
                  onClick={() => onStartSession(pose)}
                >
                  <Play size={14} /> Start Session
                </button>
                <button 
                  className="btn-outline" 
                  style={{ padding: '10px', fontSize: '13px', justifyContent: 'center' }}
                  onClick={() => onLearnMore(pose)}
                >
                  <Info size={14} /> Learn More
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {onRegenerate && (
        <div style={{ marginTop: '32px', textAlign: 'center' }}>
          <button className="btn-outline" onClick={onRegenerate}>
            <RefreshCw size={14} /> Generate New Plan
          </button>
        </div>
      )}
    </div>
  );
}

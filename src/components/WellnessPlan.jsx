import { useState, useEffect } from 'react';
import { RefreshCw, Play, Info } from 'lucide-react';
import { getPoseImageUrl } from '../lib/poseImages';

export default function WellnessPlan({ plan, onRegenerate, onStartSession, onLearnMore }) {
  const [parsedPlan, setParsedPlan] = useState(null);
  const [recommendedPoses, setRecommendedPoses] = useState([]);

  useEffect(() => {
    if (plan) {
      try {
        const cleanJson = plan.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJson);
        setParsedPlan(data);
        
        if (data.poses && data.poses.length > 0) {
          const posesWithImages = data.poses.map(pose => {
            const englishName = pose.englishName || pose.name || 'Yoga Pose';
            return {
              id: pose.id || englishName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
              englishName,
              sanskritName: pose.sanskritName || '',
              duration: pose.duration || pose.duration_mins || 3,
              shortBenefits: pose.shortBenefits || pose.benefits || [],
              imageUrl: getPoseImageUrl(englishName) || pose.imageUrl
            };
          });
          setRecommendedPoses(posesWithImages);
        } else if (data.poseIds) {
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
      <div className="card" style={{ marginBottom: '24px', background: 'var(--bg-secondary)', position: 'relative' }}>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: 'var(--accent-gold)', marginBottom: '12px' }}>
          Today's Guidance
        </h3>
        <p style={{ color: 'var(--text-body)', fontSize: '15px', lineHeight: '1.6', marginBottom: '24px' }}>
          {parsedPlan.message}
        </p>
        <button 
          className="submit-btn" 
          onClick={() => onStartSession(recommendedPoses)}
          style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
        >
          <Play size={18} /> Start Full AI Routine
        </button>
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

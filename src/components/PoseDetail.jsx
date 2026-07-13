import { ArrowLeft, Play, AlertCircle, Sparkles } from 'lucide-react';
import { getPoseImageUrl } from '../lib/poseImages';

export default function PoseDetail({ pose, onBack, onStartSession }) {
  if (!pose) return null;

  const displayImageUrl = getPoseImageUrl(pose.englishName || pose.name) || pose.imageUrl;

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', animation: 'fadeUp 0.4s ease both' }}>
      <button 
        className="btn-outline" 
        onClick={onBack}
        style={{ marginBottom: '24px', border: 'none', padding: '8px 0' }}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px' }}>
        <div style={{ height: '300px', width: '100%', position: 'relative' }}>
          <img 
            src={displayImageUrl} 
            alt={pose.englishName} 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }} />
          <div style={{ position: 'absolute', bottom: '32px', left: '32px', color: '#fff' }}>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '42px', fontWeight: 300, marginBottom: '8px' }}>
              {pose.englishName}
            </h1>
            <h2 style={{ fontSize: '18px', opacity: 0.8, letterSpacing: '0.05em' }}>
              {pose.sanskritName}
            </h2>
          </div>
        </div>

        <div style={{ padding: '32px' }}>
          <div style={{ display: 'flex', gap: '12px', marginBottom: '32px' }}>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '13px' }}>
              Difficulty: {pose.difficulty}
            </span>
            <span className="badge" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', padding: '6px 12px', borderRadius: '4px', fontSize: '13px' }}>
              Duration: {pose.duration} mins
            </span>
          </div>

          <p style={{ color: 'var(--text-body)', fontSize: '16px', lineHeight: '1.8', marginBottom: '32px' }}>
            {pose.fullBenefits}
          </p>

          <button className="submit-btn" onClick={() => onStartSession(pose)} style={{ maxWidth: '250px', marginBottom: '40px' }}>
            <Play size={16} /> Start This Pose
          </button>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
            
            <div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', color: 'var(--accent-gold)', marginBottom: '16px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
                Step-by-Step Instructions
              </h3>
              <ol style={{ paddingLeft: '20px', color: 'var(--text-body)', fontSize: '15px', lineHeight: '1.8' }}>
                {pose.steps.map((step, idx) => (
                  <li key={idx} style={{ marginBottom: '12px' }}>{step}</li>
                ))}
              </ol>
            </div>

            <div>
              <div style={{ background: 'var(--accent-gold-dim)', border: '1px solid var(--accent-gold)', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: 'var(--accent-gold)', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Sparkles size={18} /> AI Coach Tip
                </h3>
                <p style={{ color: 'var(--text-primary)', fontSize: '14px', lineHeight: '1.6' }}>
                  "{pose.aiTip}"
                </p>
              </div>

              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                Common Mistakes
              </h3>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-body)', fontSize: '14px', lineHeight: '1.6', marginBottom: '24px' }}>
                {pose.mistakes.map((mistake, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{mistake}</li>
                ))}
              </ul>

              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '20px', color: 'var(--error-color)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <AlertCircle size={18} /> Precautions
              </h3>
              <ul style={{ paddingLeft: '20px', color: 'var(--text-body)', fontSize: '14px', lineHeight: '1.6' }}>
                {pose.precautions.map((precaution, idx) => (
                  <li key={idx} style={{ marginBottom: '8px' }}>{precaution}</li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

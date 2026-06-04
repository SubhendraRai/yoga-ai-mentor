import { useState, useEffect } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { analyzeMood } from '../lib/gemini';
import { Check, Sparkles } from 'lucide-react';

export default function MoodTracker({ onMoodLogged, compact = false }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [insight, setInsight] = useState('');
  const [history, setHistory] = useState([]);

  const moods = [
    { level: 1, emoji: '😢', label: 'Rough' },
    { level: 2, emoji: '😔', label: 'Low' },
    { level: 3, emoji: '😐', label: 'Okay' },
    { level: 4, emoji: '🙂', label: 'Good' },
    { level: 5, emoji: '😊', label: 'Great' }
  ];

  useEffect(() => {
    setHistory(WellnessMemory.getMoodHistory(7));
  }, [success]);

  const handleLogMood = async () => {
    if (!selectedMood) return;
    
    setLoading(true);
    WellnessMemory.logMood(selectedMood, note);
    setSuccess(true);
    
    // Generate AI Insight
    try {
      const context = WellnessMemory.getContextForAI();
      const updatedHistory = WellnessMemory.getMoodHistory(14);
      if (updatedHistory.length > 2) { // Only analyze if we have some history
        const response = await analyzeMood(context, updatedHistory);
        if (response.success) {
          setInsight(response.text);
          WellnessMemory.addObservation(`Mood insight: ${response.text}`);
        }
      }
    } catch (e) {
      console.error("Failed to generate mood insight", e);
    }
    
    setLoading(false);
    if (onMoodLogged) onMoodLogged();
    
    // Reset form after a delay
    setTimeout(() => {
      setSuccess(false);
      setSelectedMood(null);
      setNote('');
    }, 5000);
  };

  const getDotColor = (level) => {
    switch (level) {
      case 5: return 'var(--accent-gold)';
      case 4: return 'rgba(196, 169, 106, 0.8)';
      case 3: return 'rgba(196, 169, 106, 0.5)';
      case 2: return 'rgba(196, 169, 106, 0.3)';
      case 1: return 'rgba(196, 169, 106, 0.15)';
      default: return 'var(--border-color)';
    }
  };

  if (compact) {
    return (
      <div className="card-sm" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="card-header" style={{ fontSize: '15px', marginBottom: '8px' }}>Today's Mood</div>
        {success ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success-color)', fontSize: '13px', gap: '8px' }}>
            <Check size={16} /> Logged successfully
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <div className="mood-emojis" style={{ gap: '4px', margin: '8px 0' }}>
              {moods.map(m => (
                <div 
                  key={m.level} 
                  className={`mood-emoji ${selectedMood === m.level ? 'selected' : ''}`}
                  style={{ padding: '8px', fontSize: '20px' }}
                  onClick={() => setSelectedMood(m.level)}
                >
                  {m.emoji}
                </div>
              ))}
            </div>
            {selectedMood && (
              <button 
                className="submit-btn" 
                style={{ padding: '8px', fontSize: '12px', marginTop: 'auto' }}
                onClick={handleLogMood}
                disabled={loading}
              >
                {loading ? 'Logging...' : 'Save Mood'}
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <div className="card-header">
        How are you feeling today?
      </div>
      
      {success ? (
        <div style={{ padding: '32px 0', textAlign: 'center' }}>
          <div style={{ 
            width: '48px', height: '48px', borderRadius: '50%', background: 'rgba(112, 184, 112, 0.1)', 
            color: 'var(--success-color)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px'
          }}>
            <Check size={24} />
          </div>
          <h3 style={{ color: 'var(--text-primary)', marginBottom: '8px' }}>Mood Logged</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>Thank you for checking in.</p>
          
          {insight && (
            <div className="info-alert" style={{ textAlign: 'left', display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-gold)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <strong style={{ display: 'block', color: 'var(--accent-gold)', marginBottom: '4px' }}>AI Insight</strong>
                {insight}
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="mood-emojis">
            {moods.map(m => (
              <div 
                key={m.level} 
                className={`mood-emoji ${selectedMood === m.level ? 'selected' : ''}`}
                onClick={() => setSelectedMood(m.level)}
              >
                {m.emoji}
                <span>{m.label}</span>
              </div>
            ))}
          </div>

          {selectedMood && (
            <div style={{ animation: 'fadeUp 0.3s ease both' }}>
              <div className="field">
                <label>Add a note (Optional)</label>
                <textarea 
                  value={note} 
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What's making you feel this way?"
                  style={{ minHeight: '80px' }}
                />
              </div>
              <button 
                className="submit-btn"
                onClick={handleLogMood}
                disabled={loading}
              >
                {loading ? 'Logging...' : 'Save Check-in'}
              </button>
            </div>
          )}
        </>
      )}

      {history.length > 0 && (
        <div style={{ marginTop: '32px', borderTop: '0.5px solid var(--border-color)', paddingTop: '16px' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', textAlign: 'center' }}>
            Recent Moods
          </div>
          <div className="mood-dots">
            {history.slice(0, 7).reverse().map((entry, i) => (
              <div 
                key={i} 
                className="mood-dot" 
                style={{ background: getDotColor(entry.level) }} 
                title={`${new Date(entry.timestamp).toLocaleDateString()}: Level ${entry.level}`}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

import { useState, useEffect } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { Check, RefreshCw } from 'lucide-react';

export default function WellnessPlan({ plan, onRegenerate }) {
  const [sections, setSections] = useState([]);
  const [completedItems, setCompletedItems] = useState([]);

  useEffect(() => {
    if (plan) {
      parsePlan(plan);
    }
  }, [plan]);

  const parsePlan = (text) => {
    const lines = text.split('\n');
    let parsedSections = [];
    let currentSection = null;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      if (trimmed.startsWith('##')) {
        if (currentSection) parsedSections.push(currentSection);
        currentSection = {
          title: trimmed.replace(/^#+\s*/, ''),
          items: []
        };
      } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
        if (currentSection) {
          currentSection.items.push({
            id: `item_${Math.random().toString(36).substr(2, 9)}`,
            text: trimmed.replace(/^[-*]\s*/, '').replace(/\*\*/g, ''), // Remove markdown bold for simplicity
            completed: false
          });
        }
      } else {
        if (currentSection) {
          currentSection.items.push({
            id: `item_${Math.random().toString(36).substr(2, 9)}`,
            text: trimmed.replace(/\*\*/g, ''),
            completed: false,
            isParagraph: true
          });
        } else {
          // If no section yet, create a default one (usually Morning Message)
          currentSection = {
            title: "Morning Message",
            items: [{
              id: `item_${Math.random().toString(36).substr(2, 9)}`,
              text: trimmed.replace(/\*\*/g, ''),
              completed: false,
              isParagraph: true
            }]
          };
        }
      }
    });

    if (currentSection) parsedSections.push(currentSection);
    setSections(parsedSections);
  };

  const toggleItem = (sectionIdx, itemIdx) => {
    const newSections = [...sections];
    const item = newSections[sectionIdx].items[itemIdx];
    
    // Don't toggle paragraphs unless they look like actionable items
    if (item.isParagraph && !item.text.includes('min')) return;

    item.completed = !item.completed;
    setSections(newSections);

    if (item.completed) {
      WellnessMemory.logActivity(`act_${Date.now()}`, newSections[sectionIdx].title, item.text, 15);
      if (!completedItems.includes(item.id)) {
        setCompletedItems([...completedItems, item.id]);
      }
    } else {
      setCompletedItems(completedItems.filter(id => id !== item.id));
    }
  };

  if (!plan) return null;

  // Calculate progress
  const actionableItems = sections.flatMap(s => s.items).filter(i => !i.isParagraph || i.text.includes('min'));
  const progress = actionableItems.length > 0 ? (completedItems.length / actionableItems.length) * 100 : 0;

  return (
    <div className="result-card">
      <div className="result-header">
        <span>Today's Wellness Plan</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', fontFamily: "'DM Sans', sans-serif", color: 'var(--text-secondary)' }}>
          {Math.round(progress)}% Complete
          <div style={{ width: '60px', height: '4px', background: 'var(--border-color)', borderRadius: '2px', overflow: 'hidden' }}>
            <div style={{ width: `${progress}%`, height: '100%', background: 'var(--accent-gold)', transition: 'width 0.3s ease' }} />
          </div>
        </div>
      </div>

      <div className="result-body">
        {sections.map((section, sIdx) => (
          <div key={sIdx}>
            <div className="section-head">{section.title}</div>
            {section.items.map((item, iIdx) => (
              <div 
                key={item.id} 
                className={`activity-item ${item.isParagraph && !item.text.includes('min') ? '' : 'actionable'}`}
                onClick={() => toggleItem(sIdx, iIdx)}
                style={{ cursor: (item.isParagraph && !item.text.includes('min')) ? 'default' : 'pointer' }}
              >
                {(!item.isParagraph || item.text.includes('min')) && (
                  <div className={`activity-checkbox ${item.completed ? 'checked' : ''}`}>
                    {item.completed && <Check size={12} color="var(--bg-primary)" strokeWidth={3} />}
                  </div>
                )}
                <div className={`activity-text ${item.completed ? 'completed' : ''}`}>
                  {item.text}
                </div>
              </div>
            ))}
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

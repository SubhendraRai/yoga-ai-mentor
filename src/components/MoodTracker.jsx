import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WellnessMemory } from '../lib/wellnessMemory';
import { analyzeMood } from '../lib/ai';
import { Check, Sparkles } from 'lucide-react';
import MotionButton from './motion/MotionButton';

export default function MoodTracker({ onMoodLogged, compact = false }) {
  const [selectedMood, setSelectedMood] = useState(null);
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [insight, setInsight] = useState('');
  const [history, setHistory] = useState([]);
  const [alreadyLogged, setAlreadyLogged] = useState(false);

  const moods = [
    { level: 1, emoji: '😢', label: 'Rough' },
    { level: 2, emoji: '😔', label: 'Low' },
    { level: 3, emoji: '😐', label: 'Okay' },
    { level: 4, emoji: '🙂', label: 'Good' },
    { level: 5, emoji: '😊', label: 'Great' }
  ];

  useEffect(() => {
    const hist = WellnessMemory.getMoodHistory(7);
    setHistory(hist);

    // Lock for 24 hours if already logged today
    const todayStr = new Date().toISOString().split('T')[0];
    const todayLog = hist.find(h => h.timestamp.startsWith(todayStr));

    if (todayLog && !success) {
      setAlreadyLogged(true);
      setSuccess(true);
    }
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

    // Don't reset if we want to keep the 24hr lock visible
    setAlreadyLogged(true);
  };

  const getDotColor = (level) => {
    switch (level) {
      case 5: return 'var(--color-moss)';
      case 4: return 'rgba(74, 107, 82, 0.7)';
      case 3: return 'rgba(74, 107, 82, 0.45)';
      case 2: return 'rgba(74, 107, 82, 0.25)';
      case 1: return 'rgba(74, 107, 82, 0.12)';
      default: return 'var(--border-color)';
    }
  };

  if (compact) {
    return (
      <div className="rounded-[28px] bg-white/95 border border-canvas-deep px-6 py-6 h-full flex flex-col shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
        <p className="text-[12px] uppercase tracking-[0.18em] text-moss-deep/70 font-medium mb-4">
          Today&rsquo;s mood
        </p>

        <AnimatePresence mode="wait">
          {success || alreadyLogged ? (
            <motion.div
              key="logged"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center gap-2 text-moss-deep"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 16, delay: 0.1 }}
                className="w-9 h-9 rounded-full bg-moss/10 flex items-center justify-center"
              >
                <Check size={16} />
              </motion.div>
              <span className="text-[13px]">Logged for today</span>
            </motion.div>
          ) : (
            <motion.div key="picker" className="flex flex-col flex-1">
              <div className="flex justify-center gap-1.5 my-2">
                {moods.map((m) => (
                  <motion.button
                    key={m.level}
                    type="button"
                    onClick={() => setSelectedMood(m.level)}
                    whileHover={{ scale: 1.12, y: -2 }}
                    whileTap={{ scale: 0.94 }}
                    className={`text-[20px] rounded-2xl p-2 transition-colors duration-200 ${
                      selectedMood === m.level ? 'bg-moss/12 ring-1 ring-moss/40' : 'hover:bg-canvas-deep'
                    }`}
                  >
                    {m.emoji}
                  </motion.button>
                ))}
              </div>
              {selectedMood && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-auto pt-2">
                  <MotionButton size="sm" fullWidth onClick={handleLogMood} disabled={loading}>
                    {loading ? 'Logging…' : 'Save mood'}
                  </MotionButton>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="rounded-[28px] bg-white/95 border border-canvas-deep p-8 max-w-[600px] mx-auto shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
      <h3 className="font-display text-[22px] text-moss-deep mb-6">
        {alreadyLogged ? "Today's check-in is complete" : 'How are you feeling today?'}
      </h3>

      <AnimatePresence mode="wait">
        {success || alreadyLogged ? (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-6 text-center"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 16 }}
              className="w-12 h-12 rounded-full bg-moss/10 text-moss flex items-center justify-center mx-auto mb-4"
            >
              <Check size={22} />
            </motion.div>
            <h4 className="text-ink mb-1.5 font-medium">Mood logged</h4>
            <p className="text-text-secondary text-[14px] mb-6">Thank you for checking in.</p>

            {insight && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="text-left flex gap-3 items-start bg-moss/5 border border-moss/15 rounded-2xl p-4 text-[13px] leading-relaxed text-text-body"
              >
                <Sparkles size={16} className="text-moss mt-0.5 shrink-0" />
                <div>
                  <strong className="block text-moss-deep mb-1">Mentor insight</strong>
                  {insight}
                </div>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div key="form">
            <div className="flex justify-center gap-3 my-4">
              {moods.map((m) => (
                <motion.button
                  key={m.level}
                  type="button"
                  onClick={() => setSelectedMood(m.level)}
                  whileHover={{ scale: 1.1, y: -3 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex flex-col items-center gap-1 rounded-2xl px-4 py-3 text-[28px] transition-colors duration-200 ${
                    selectedMood === m.level ? 'bg-moss/12 ring-1 ring-moss/40' : 'bg-canvas hover:bg-canvas-deep'
                  }`}
                >
                  {m.emoji}
                  <span className="text-[10px] uppercase tracking-[0.08em] text-text-secondary">{m.label}</span>
                </motion.button>
              ))}
            </div>

            {selectedMood && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="mb-5">
                  <label className="block text-[11px] uppercase tracking-[0.12em] text-moss-deep font-medium mb-2">
                    Add a note (optional)
                  </label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What's making you feel this way?"
                    className="w-full min-h-[80px] bg-canvas border border-canvas-deep rounded-xl px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/10 transition-all duration-300 resize-y"
                  />
                </div>
                <MotionButton fullWidth onClick={handleLogMood} disabled={loading}>
                  {loading ? 'Logging…' : 'Save check-in'}
                </MotionButton>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {history.length > 0 && (
        <div className="mt-8 pt-4 border-t border-canvas-deep">
          <p className="text-[11px] text-text-secondary uppercase tracking-[0.1em] text-center mb-3">
            Recent moods
          </p>
          <div className="flex gap-1.5 justify-center">
            {history.slice(0, 7).reverse().map((entry, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.05, type: 'spring', stiffness: 300, damping: 18 }}
                className="w-2 h-2 rounded-full"
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

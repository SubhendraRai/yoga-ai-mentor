import { useState, useEffect, useRef } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { chatWithMentor } from '../lib/ai';
import { getChatHistory, saveChatMessage, getUserMemories, extractAndSaveMemories } from '../lib/supabaseMemory';
import { playSound } from '../lib/audio';
import { Send, Trash2, Compass, CheckCircle2 } from 'lucide-react';
import { getPoseImageUrl } from '../lib/poseImages';

// ─── Parse and apply an UPDATE_ROUTINE JSON action block from AI response ─────
function parseAndApplyRoutineUpdate(rawResponse) {
  const jsonRegex = /```json([\s\S]*?)```/;
  const match = rawResponse.match(jsonRegex);
  let routineApplied = false;

  if (match && match[1]) {
    try {
      const toolCall = JSON.parse(match[1].trim());
      if (toolCall.action === 'UPDATE_ROUTINE' && toolCall.payload) {
        const { message, poses } = toolCall.payload;
        // Map to the format WellnessMemory / WellnessPlan expect
        const normalizedPoses = (poses || []).map(p => ({
          englishName: p.name,
          sanskritName: p.sanskritName || '',
          duration: p.duration_mins || 3,
          shortBenefits: p.benefits || [],
          imageUrl: getPoseImageUrl(p.name),
          id: p.id || p.name.toLowerCase().replace(/[^a-z0-9]/g, '_')
        }));
        const planPayload = JSON.stringify({ message: message || 'Your personalised AI routine.', poses: normalizedPoses });
        WellnessMemory.saveDailyPlan(planPayload);
        // Notify Dashboard to reload
        window.dispatchEvent(new Event('wellness_synced'));
        routineApplied = true;
      }
    } catch (e) {
      console.error('Error parsing AI tool call:', e);
    }
  }

  // Return clean text (strip the JSON block)
  const cleanText = rawResponse.replace(jsonRegex, '').trim();
  return { cleanText, routineApplied };
}

export default function MentorChat({ currentUser, onNavigate }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMemories, setUserMemories] = useState('');
  const [routineToast, setRoutineToast] = useState(false);
  const messagesEndRef = useRef(null);

  const suggestionChips = [
    "How am I progressing?",
    "I'm feeling stressed",
    "Change today's plan",
    "Recommend a session",
    "I have back pain"
  ];

  useEffect(() => {
    async function loadData() {
      if (!currentUser?.id) return;
      
      const memories = await getUserMemories(currentUser.id);
      setUserMemories(memories);
      
      const history = await getChatHistory(currentUser.id);
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        const initialMessage = {
          role: 'mentor',
          text: `Hello ${currentUser.name || 'there'}. I'm your AI Wellness Mentor. I remember your goals and adapt to your progress. How can I support you today?`,
          timestamp: Date.now()
        };
        setMessages([initialMessage]);
        await saveChatMessage(currentUser.id, 'model', initialMessage.text);
      }
    }
    loadData();
  }, [currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim()) return;

    playSound.pop(); // Sound effect when user sends

    const userMsg = { role: 'user', text: text.trim(), timestamp: Date.now() };
    const updatedMessages = [...messages, userMsg];
    
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);
    
    if (currentUser?.id) {
      await saveChatMessage(currentUser.id, 'user', text.trim());
      
      // Check for AI Mood Override in the background
      extractAndSaveMemories(currentUser.id, text.trim()).then(result => {
        if (result && result.moodOverride) {
          console.log("AI Overriding Mood from Chat:", result.moodOverride);
          WellnessMemory.logMood(result.moodOverride, "AI Detected Mood Shift");
          window.dispatchEvent(new Event('wellness_synced')); // Trigger UI refresh
        }
      });
    }

    try {
      const baseContext = WellnessMemory.getContextForAI();
      const fullContext = `${baseContext}\n\nImportant User Memories:\n${userMemories || 'None yet.'}`;
      
      const response = await chatWithMentor(fullContext, updatedMessages, text.trim());
      
      if (response.success) {
        playSound.chime();
        // ── Parse JSON tool call and apply routine update if present ──
        const { cleanText, routineApplied } = parseAndApplyRoutineUpdate(response.text);
        const mentorMsg = { role: 'mentor', text: cleanText, timestamp: Date.now() };
        setMessages([...updatedMessages, mentorMsg]);
        if (routineApplied) {
          setRoutineToast(true);
          setTimeout(() => setRoutineToast(false), 4000);
        }
        if (currentUser?.id) {
          await saveChatMessage(currentUser.id, 'model', cleanText);
        }
      } else {
        playSound.error();
        const errorText = response.error ? `Error: ${response.error}` : "I'm having trouble connecting right now. Let's try again in a moment.";
        const errorMsg = { role: 'mentor', text: errorText, timestamp: Date.now(), isError: true };
        setMessages([...updatedMessages, errorMsg]);
      }
    } catch (e) {
      console.error("Chat error:", e);
      playSound.error();
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    // We don't delete from Supabase to preserve data, but we reset the UI
    const initialMessage = {
      role: 'mentor',
      text: "Chat window cleared. What's on your mind?",
      timestamp: Date.now()
    };
    setMessages([initialMessage]);
  };

  return (
    <div className="chat-container" style={{ position: 'relative' }}>
      {/* Routine update toast notification */}
      {routineToast && (
        <div style={{
          position: 'absolute', top: '12px', left: '50%', transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, #2a7a4f, #1a5c38)',
          color: '#fff', padding: '10px 18px', borderRadius: '24px',
          display: 'flex', alignItems: 'center', gap: '8px',
          fontSize: '13px', fontWeight: '600', zIndex: 100,
          boxShadow: '0 4px 20px rgba(0,0,0,0.4)', animation: 'fadeUp 0.3s ease'
        }}>
          <CheckCircle2 size={16} /> Routine updated! Check your dashboard.
        </div>
      )}
      <div className="chat-header">
        <h3 style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: 0 }}>
          <Compass size={20} /> Talk to Mentor
        </h3>
        <button className="btn-icon" onClick={clearChat} title="Clear Chat" style={{ border: 'none' }}>
          <Trash2 size={16} />
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`} style={{ opacity: msg.isError ? 0.7 : 1 }}>
            {msg.text}
          </div>
        ))}
        {isLoading && (
          <div className="typing-indicator">
            <div className="typing-dot" />
            <div className="typing-dot" />
            <div className="typing-dot" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div>
        {currentUser?.id === 'guest' && messages.filter(m => m.role === 'user').length >= 4 ? (
          <div className="card" style={{ padding: '24px 20px', textAlign: 'center', borderColor: 'var(--accent-gold-dim)', background: 'var(--bg-secondary)', borderRadius: '12px' }}>
            <p style={{ color: 'var(--text-primary)', marginBottom: '16px', fontFamily: "'Cormorant Garamond', serif", fontSize: '18px' }}>
              ✨ You have completed your 4 free guest chats. Sign up or log in to unlock unlimited conversations with your AI Mentor.
            </p>
            <button className="submit-btn" onClick={() => onNavigate('settings')} style={{ maxWidth: '240px', margin: '0 auto' }}>
              Sign Up / Register Account →
            </button>
          </div>
        ) : (
          <>
            <div className="chat-chips">
              {suggestionChips.map(chip => (
                <button key={chip} className="chat-chip" onClick={() => handleSend(chip)} disabled={isLoading}>
                  {chip}
                </button>
              ))}
            </div>
            
            <div className="chat-input-area">
              <input
                className="chat-input"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask your mentor anything..."
                disabled={isLoading}
              />
              <button 
                className="chat-send-btn" 
                onClick={() => handleSend()}
                disabled={!input.trim() || isLoading}
              >
                <Send size={18} style={{ marginLeft: '-2px' }} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

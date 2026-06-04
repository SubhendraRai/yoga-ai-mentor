import { useState, useEffect, useRef } from 'react';
import { WellnessMemory } from '../lib/wellnessMemory';
import { chatWithMentor } from '../lib/ai';
import { getChatHistory, saveChatMessage, getUserMemories, extractAndSaveMemories } from '../lib/supabaseMemory';
import { playSound } from '../lib/audio';
import { Send, Trash2, Compass } from 'lucide-react';

export default function MentorChat({ currentUser }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userMemories, setUserMemories] = useState('');
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
      extractAndSaveMemories(currentUser.id, text.trim());
    }

    try {
      const baseContext = WellnessMemory.getContextForAI();
      const fullContext = `${baseContext}\n\nImportant User Memories:\n${userMemories || 'None yet.'}`;
      
      const response = await chatWithMentor(fullContext, updatedMessages, text.trim());
      
      if (response.success) {
        playSound.chime(); // Sound effect when AI replies
        const mentorMsg = { role: 'mentor', text: response.text, timestamp: Date.now() };
        setMessages([...updatedMessages, mentorMsg]);
        if (currentUser?.id) {
          await saveChatMessage(currentUser.id, 'model', response.text);
        }
      } else {
        playSound.error();
        const errorMsg = { role: 'mentor', text: "I'm having trouble connecting right now. Let's try again in a moment.", timestamp: Date.now(), isError: true };
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
    <div className="chat-container">
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
      </div>
    </div>
  );
}

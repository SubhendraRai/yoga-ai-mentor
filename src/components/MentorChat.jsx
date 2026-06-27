import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
        playSound.chime(); // Sound effect when AI replies
        const mentorMsg = { role: 'mentor', text: response.text, timestamp: Date.now() };
        setMessages([...updatedMessages, mentorMsg]);
        if (currentUser?.id) {
          await saveChatMessage(currentUser.id, 'model', response.text);
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
    <div className="flex flex-col h-[calc(100vh-64px)] max-h-[860px] rounded-[28px] bg-white/95 border border-canvas-deep overflow-hidden shadow-[0_8px_32px_rgba(31,43,34,0.06)]">
      <div className="flex items-center justify-between px-6 py-4 border-b border-canvas-deep shrink-0">
        <h3 className="flex items-center gap-2 font-display text-[19px] text-moss-deep m-0">
          <motion.span
            animate={{ rotate: [0, 360] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
          >
            <Compass size={19} />
          </motion.span>
          Talk to Mentor
        </h3>
        <motion.button
          whileHover={{ scale: 1.08, rotate: -6 }}
          whileTap={{ scale: 0.92 }}
          onClick={clearChat}
          title="Clear Chat"
          className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary hover:text-clay hover:bg-clay/8 transition-colors duration-200"
        >
          <Trash2 size={15} />
        </motion.button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={msg.timestamp || i}
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: msg.isError ? 0.7 : 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className={`max-w-[80%] px-4 py-3 rounded-2xl text-[14px] leading-relaxed ${
                msg.role === 'user'
                  ? 'self-end bg-gradient-to-br from-moss to-moss-deep text-canvas rounded-br-md'
                  : 'self-start bg-canvas text-text-body rounded-bl-md'
              }`}
            >
              {msg.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="self-start flex items-center gap-1.5 bg-canvas px-4 py-3 rounded-2xl rounded-bl-md"
          >
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-moss/60"
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.15, ease: [0.45, 0, 0.2, 1] }}
              />
            ))}
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="shrink-0 border-t border-canvas-deep px-5 py-4">
        <div className="flex gap-2 overflow-x-auto pb-3 -mx-1 px-1">
          {suggestionChips.map((chip, i) => (
            <motion.button
              key={chip}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileHover={{ scale: 1.04, y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => handleSend(chip)}
              disabled={isLoading}
              className="shrink-0 whitespace-nowrap text-[12px] text-moss-deep bg-moss/8 hover:bg-moss/14 border border-moss/15 rounded-full px-3.5 py-2 transition-colors duration-200 disabled:opacity-40"
            >
              {chip}
            </motion.button>
          ))}
        </div>

        <div className="flex items-center gap-2.5">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Ask your mentor anything..."
            disabled={isLoading}
            className="flex-1 bg-canvas border border-canvas-deep rounded-full px-4 py-3 text-[14px] text-ink outline-none focus:border-moss focus:ring-2 focus:ring-moss/10 transition-all duration-300"
          />
          <motion.button
            whileHover={!input.trim() || isLoading ? {} : { scale: 1.06 }}
            whileTap={!input.trim() || isLoading ? {} : { scale: 0.92 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || isLoading}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-moss to-moss-deep text-canvas flex items-center justify-center shrink-0 disabled:opacity-35 disabled:cursor-not-allowed shadow-[0_4px_16px_rgba(74,107,82,0.28)]"
          >
            <Send size={17} className="-ml-0.5" />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

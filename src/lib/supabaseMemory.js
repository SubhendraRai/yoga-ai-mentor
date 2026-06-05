// src/lib/supabaseMemory.js
import { supabase } from './supabase';
import { callAI } from './ai';

/**
 * Saves a single chat message to Supabase.
 */
export async function saveChatMessage(userId, role, content) {
  if (!userId) return;
  const { error } = await supabase
    .from('chat_history')
    .insert([{ user_id: userId, role, content }]);
  
  if (error) console.error("Error saving chat message:", error);
}

/**
 * Fetches the recent chat history for the user.
 */
export async function getChatHistory(userId, limit = 20) {
  if (!userId) return [];
  const { data, error } = await supabase
    .from('chat_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);
  
  if (error) {
    console.error("Error fetching chat history:", error);
    return [];
  }
  
  return data.reverse().map(msg => ({
    role: msg.role === 'model' ? 'mentor' : msg.role,
    text: msg.content
  }));
}

/**
 * Fetches all memories for a user as a formatted string.
 */
export async function getUserMemories(userId) {
  if (!userId) return "";
  const { data, error } = await supabase
    .from('memories')
    .select('memory')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
    
  if (error || !data || data.length === 0) return "";
  
  return data.map(m => `- ${m.memory}`).join('\n');
}

/**
 * Extracts facts from a user message in the background and saves to Supabase.
 */
export async function extractAndSaveMemories(userId, userMessage) {
  if (!userId || !userMessage || userMessage.length < 5) return null;

  const systemPrompt = `You are a data extractor. Analyze the user's message and determine if it contains any NEW, IMPORTANT personal facts.
Examples of important facts:
- Physical conditions (e.g., "I have lower back pain", "I injured my knee")
- Current life events (e.g., "I have exams next week", "I just had a baby")
- Preferences (e.g., "I prefer morning workouts")

Also, detect if the user is expressing an extreme shift in mood (e.g., "I am very sad", "I feel awful", "I am so happy").

Respond ONLY in valid JSON format:
{
  "fact": "A concise bulleted fact or null",
  "moodOverride": Number (1 for very sad/rough, 2 for sad/low, 3 for okay, 4 for good, 5 for great. Use null if no explicit mood is stated.)
}`;

  try {
    const res = await callAI(systemPrompt, [{ role: 'user', content: userMessage }]);
    if (res.success && res.text) {
      const text = res.text.trim();
      let parsed = null;
      try {
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        parsed = JSON.parse(jsonMatch ? jsonMatch[0] : text);
      } catch (e) {
        console.error("Failed to parse memory JSON", e);
        return null;
      }
      
      if (parsed.fact && parsed.fact !== 'null' && parsed.fact !== 'NONE') {
        const cleanMemory = parsed.fact.replace(/^[-*•]\s*/, '').trim();
        await supabase.from('memories').insert([{ user_id: userId, memory: cleanMemory }]);
        console.log("Memory Extracted & Saved:", cleanMemory);
      }
      
      return parsed;
    }
    return null;
  } catch (err) {
    console.error("Failed to extract memory:", err);
    return null;
  }
}

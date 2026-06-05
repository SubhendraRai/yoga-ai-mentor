// ─────────────────────────────────────────────────────────────
// gemini.js — Centralized Gemini REST API Helper
// All functions return { success: true, text } or { success: false, error }
// ─────────────────────────────────────────────────────────────

let currentApiKey = import.meta.env.VITE_GEMINI_API_KEY;
const altApiKey = import.meta.env.VITE_GEMINI_API_KEY_ALT;
const anthropicApiKey = import.meta.env.VITE_ANTHROPIC_API_KEY;
const MODEL = 'gemini-2.0-flash';
const ANTHROPIC_MODEL = 'claude-3-5-haiku-20241022';

const getGeminiEndpoint = (key) => `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`;
const ANTHROPIC_ENDPOINT = '/api/anthropic'; // Rewritten by vite config / vercel

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

async function callGeminiFallback(systemInstruction, contents) {
  const keyToUse = currentApiKey || altApiKey;
  if (!keyToUse) return { success: false, error: 'No fallback AI keys available.' };
  
  try {
    const geminiContents = contents.map(c => ({
      role: c.role === 'assistant' ? 'model' : 'user',
      parts: c.parts || [{ text: c.content }]
    }));
    
    if (systemInstruction) {
      geminiContents.unshift(
        { role: 'user', parts: [{ text: `System Instruction: ${systemInstruction}` }] },
        { role: 'model', parts: [{ text: 'Understood.' }] }
      );
    }
    
    const res = await fetch(getGeminiEndpoint(keyToUse), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: geminiContents })
    });
    
    if (res.ok) {
      const data = await res.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return { success: true, text };
    }
    
    return { success: false, error: `Gemini fallback failed: ${await res.text()}` };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

/**
 * Low-level call to Groq Llama 3 API (via Vercel Serverless Route or direct fallback).
 */
export async function callAI(systemInstruction, contents) {
  // Format messages for Groq
  const messages = contents.map(c => ({
    role: c.role === 'model' || c.role === 'assistant' ? 'assistant' : 'user',
    content: c.parts ? c.parts.map(p => p.text).join('\n') : c.content
  }));

  try {
    // 1. Try hitting the server-side API Route (Vercel)
    // This is more secure as it hides the API key
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemPrompt: systemInstruction,
        messages: messages
      })
    });

    if (res.ok) {
      const data = await res.json();
      return { success: true, text: data.text };
    }
    
    // Check if it's a 429 rate limit or 500 missing key from server
    if (res.status === 429 || res.status === 500) {
      console.warn(`/api/chat failed with ${res.status}, falling back to Gemini...`);
      return await callGeminiFallback(systemInstruction, contents);
    }
    
    console.warn("/api/chat failed, falling back to direct Groq call...", await res.text());
  } catch (err) {
    console.warn("/api/chat not reachable, falling back to direct Groq call...");
  }

  // 2. Direct Fallback to Groq API (Local Dev)
  if (GROQ_API_KEY) {
    try {
      const groqMessages = [];
      if (systemInstruction) groqMessages.push({ role: 'system', content: systemInstruction });
      groqMessages.push(...messages);

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: groqMessages,
          temperature: 0.7,
          max_tokens: 2048
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          console.warn("Groq rate limit hit. Falling back to Gemini...");
          return await callGeminiFallback(systemInstruction, contents);
        }
        return { success: false, error: `Groq direct API error: ${await response.text()}` };
      }

      const data = await response.json();
      return { success: true, text: data.choices[0]?.message?.content || '' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  // 3. Final Fallback if no Groq keys
  return await callGeminiFallback(systemInstruction, contents);
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────



/**
 * Generate a warm, personalized morning greeting (2-3 sentences).
 */
export async function generateMorningGreeting(userContext) {
  const system = `You are a warm, caring AI Wellness Mentor. Generate a brief, personalized morning greeting. Keep it to 2-3 sentences maximum. Be encouraging and reference specific details from the user's data. Do not use generic greetings.`;

  const prompt = `Here is the user's current wellness context:

${userContext}

Generate a warm, personalized morning greeting for today. Reference their name, recent mood, sleep quality, streak, or today's focus. Keep it concise — 2-3 sentences only. Make them feel seen and motivated.`;

  return callAI(system, [{ role: 'user', parts: [{ text: prompt }] }]);
}

/**
 * Analyze mood history and surface insights about patterns.
 */
export async function analyzeMood(userContext, moodHistory) {
  const system = `You are an empathetic AI Wellness Mentor skilled in mood pattern analysis. Provide brief, actionable insights about the user's emotional patterns. Be warm and constructive — never clinical or judgmental. Keep your response to 2-4 sentences.`;

  const moodData = moodHistory
    .map((m) => `${m.date}: level ${m.level}/5${m.note ? ` — "${m.note}"` : ''}`)
    .join('\n');

  const prompt = `User context:
${userContext}

Mood history to analyze:
${moodData}

Provide a brief insight (2-4 sentences) about patterns you notice. For example, correlations between mood and activities, sleep, or time of week. Offer one gentle suggestion.`;

  return callAI(system, [{ role: 'user', parts: [{ text: prompt }] }]);
}

/**
 * Generate a detailed yoga session with specific poses, timings, and instructions.
 */
export async function generateYogaSession(userContext, duration = 20, focusArea = 'full body') {
  const system = `You are an expert yoga instructor and AI Wellness Mentor. Design safe, effective yoga sessions tailored to the user's experience level, physical considerations, and goals. Always prioritize safety and proper alignment.`;

  const prompt = `User context:
${userContext}

Generate a detailed yoga session with the following parameters:
- Duration: ${duration} minutes
- Focus Area: ${focusArea}

Structure the session as:

### Warm-Up (2-3 minutes)
List warm-up movements with brief instructions.

### Main Sequence
For each pose provide:
- **Pose Name** (English + Sanskrit)
- **Hold Duration**: specific timing
- **Instructions**: 2-3 alignment cues
- **Modification**: easier variation if needed
- **Benefit**: why this pose is included

### Cool-Down (2-3 minutes)
Closing stretches and savasana guidance.

### Breathing Integration
When to inhale/exhale during transitions.

Tailor difficulty to their experience level. If they have health conditions, provide appropriate modifications.`;

  return callAI(system, [{ role: 'user', parts: [{ text: prompt }] }]);
}

/**
 * Conversational AI mentor. Full context + chat history + new message.
 */
export async function chatWithMentor(userContext, conversationHistory = [], userMessage) {
  const system = `You are a trusted AI wellness mentor. You know the user deeply through the context provided below. You are warm, encouraging, and practical. You remember everything about them. You are NOT a chatbot — you are a mentor who evolves with them. Never give generic advice. Always reference their specific goals, challenges, and progress.

Here is everything you know about the user:
${userContext}

Guidelines:
- Be conversational and warm, like a caring friend who also happens to be a wellness expert
- Reference specific details from their profile, mood, sleep, and activity data
- If they seem stressed or low, acknowledge it empathetically before offering guidance
- Celebrate their wins, even small ones
- Keep responses concise but meaningful (2-5 sentences usually)
- If they ask about yoga or exercises, provide specific, actionable guidance
- If they share a struggle, validate their feelings first`;

  // Build conversation contents for Gemini multi-turn format
  const contents = [];

  // Add conversation history
  if (conversationHistory.length > 0) {
    // Keep last 6 messages to stay within token context limits and reduce costs
    const recent = conversationHistory.slice(-6);
    for (const msg of recent) {
      contents.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || msg.text || '' }],
      });
    }
  }

  // Add the new user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  return callAI(system, contents);
}

export async function generateOnboardingProfile(onboardingData) {
  // Replace 2000-token AI generation with deterministic rules engine!
  const name = onboardingData.name || 'Friend';
  const level = onboardingData.experience || 'Beginner';
  const goals = onboardingData.goals ? onboardingData.goals.join(', ') : 'wellness';

  const text = `## 🙏 Welcome Message
Welcome to YogTatva, ${name}! I'm thrilled you've decided to start this journey. Together, we will build a sustainable and fulfilling practice tailored just for you.

## 📋 Initial Assessment
As a ${level} looking to focus on ${goals}, you are in a perfect starting position. We will gently build your foundation and gradually introduce flows that challenge your physical and mental stamina, respecting your body's current state.

## 🎯 Recommended Focus Areas
- **Foundational Alignment**: Ensuring safety in core poses.
- **Breath Connection**: Linking movement with steady inhales and exhales.
- **Consistency**: Building a small, daily habit rather than exhausting yourself.

## 📅 First Week Plan Overview
Your first week will focus on exploration and building the habit. We will keep sessions relatively short and focus heavily on restorative and foundational postures so your body can adapt smoothly to the new routine. I am here to support you every step of the way!`;

  return { success: true, text };
}

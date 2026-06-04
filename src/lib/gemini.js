// ─────────────────────────────────────────────────────────────
// gemini.js — Centralized Gemini REST API Helper
// All functions return { success: true, text } or { success: false, error }
// ─────────────────────────────────────────────────────────────

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const MODEL = 'gemini-2.0-flash';
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;

/**
 * Low-level call to Gemini generateContent.
 * @param {string} systemInstruction - System-level instruction for the model.
 * @param {Array<{role:string, parts:Array}>} contents - The conversation contents.
 * @returns {Promise<{success:boolean, text?:string, error?:string}>}
 */
async function callGemini(systemInstruction, contents) {
  try {
    const body = {
      contents,
      generationConfig: {
        temperature: 0.8,
        topP: 0.95,
        topK: 40,
        maxOutputTokens: 4096,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return { success: false, error: `Gemini API error ${res.status}: ${errBody}` };
    }

    const data = await res.json();

    const text = data?.candidates?.[0]?.content?.parts
      ?.map((p) => p.text)
      .filter(Boolean)
      .join('');

    if (!text) {
      return { success: false, error: 'Gemini returned an empty response.' };
    }

    return { success: true, text };
  } catch (err) {
    return { success: false, error: err.message || 'Unknown error calling Gemini.' };
  }
}

// ─────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────

/**
 * Generate a structured daily wellness plan.
 */
export async function generateWellnessPlan(userContext) {
  const system = `You are an expert AI Wellness Mentor who creates deeply personalized daily wellness plans. You know the user intimately through the context provided. Generate plans that feel crafted specifically for this individual, not generic templates.`;

  const prompt = `Based on the following user profile and wellness data, create a comprehensive and personalized daily wellness plan.

${userContext}

Structure the plan with these sections (use clear markdown headers):

## ☀️ Morning Message
A warm, motivating message that references their current state and goals (2-3 sentences).

## 🧘 Yoga Session
Recommend 3-5 specific yoga poses. For each pose include:
- Pose name (Sanskrit and English)
- Duration/hold time
- Brief instruction or alignment cue
- Why this pose benefits them specifically

## 🌬️ Breathing Practice
A specific pranayama technique with step-by-step instructions and duration.

## 🧘‍♀️ Meditation
A guided meditation theme with duration and technique suited to their level.

## 🧠 Focus Exercise
A mindfulness or cognitive exercise for mental clarity.

## 💡 Wellness Tip
One actionable wellness tip personalized to their goals and recent data.

## 📅 Weekly Outlook
Brief overview of suggested focus areas for the coming days based on their trends.

Make everything feel personal, warm, and encouraging. Reference their specific data.`;

  return callGemini(system, [{ role: 'user', parts: [{ text: prompt }] }]);
}

/**
 * Generate a warm, personalized morning greeting (2-3 sentences).
 */
export async function generateMorningGreeting(userContext) {
  const system = `You are a warm, caring AI Wellness Mentor. Generate a brief, personalized morning greeting. Keep it to 2-3 sentences maximum. Be encouraging and reference specific details from the user's data. Do not use generic greetings.`;

  const prompt = `Here is the user's current wellness context:

${userContext}

Generate a warm, personalized morning greeting for today. Reference their name, recent mood, sleep quality, streak, or today's focus. Keep it concise — 2-3 sentences only. Make them feel seen and motivated.`;

  return callGemini(system, [{ role: 'user', parts: [{ text: prompt }] }]);
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

  return callGemini(system, [{ role: 'user', parts: [{ text: prompt }] }]);
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

  return callGemini(system, [{ role: 'user', parts: [{ text: prompt }] }]);
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
    // Keep last 20 messages to stay within context limits
    const recent = conversationHistory.slice(-20);
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

  return callGemini(system, contents);
}

/**
 * Generate an initial AI assessment from onboarding data.
 */
export async function generateOnboardingProfile(onboardingData) {
  const system = `You are a warm, expert AI Wellness Mentor meeting a new user for the first time. Create an encouraging, personalized welcome assessment. Be specific about their goals and create a sense of partnership.`;

  const dataStr = typeof onboardingData === 'string'
    ? onboardingData
    : JSON.stringify(onboardingData, null, 2);

  const prompt = `A new user just completed their onboarding. Here is their data:

${dataStr}

Generate a warm, personalized response with these sections:

## 🙏 Welcome Message
A heartfelt 2-3 sentence welcome that uses their name and acknowledges their decision to start this journey.

## 📋 Initial Assessment
Based on their experience level, goals, and any health considerations, provide a brief honest assessment of where they are and where they can go (3-4 sentences).

## 🎯 Recommended Focus Areas
List 3-4 specific focus areas based on their goals and current state. Explain why each matters for them.

## 📅 First Week Plan Overview
A high-level overview of what their first week will look like. Day-by-day is not necessary — just themes and expectations.

Make them feel excited and supported. This is the start of a meaningful journey.`;

  return callGemini(system, [{ role: 'user', parts: [{ text: prompt }] }]);
}

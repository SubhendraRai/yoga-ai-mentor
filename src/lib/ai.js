// src/lib/ai.js
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

const ALLOWED_YOGA_POSES = [
  "Akarna Dhanurasana",
  "Bharadvaja's Twist Pose (or Bharadvajasana I)",
  "Boat Pose (or Paripurna Navasana)",
  "Bound Angle Pose (or Baddha Konasana)",
  "Bow Pose (or Dhanurasana)",
  "Bridge Pose (or Setu Bandha Sarvangasana)",
  "Camel Pose (or Ustrasana)",
  "Cat Cow Pose (or Marjaryasana)",
  "Chair Pose (or Utkatasana)",
  "Child Pose (or Balasana)",
  "Cobra Pose (or Bhujangasana)",
  "Cockerel Pose",
  "Corpse Pose (or Savasana)",
  "Cow Face Pose (or Gomukhasana)",
  "Crane (Crow) Pose (or Bakasana)",
  "Dolphin Plank Pose (or Makara Adho Mukha Svanasana)",
  "Dolphin Pose (or Ardha Pincha Mayurasana)",
  "Downward-Facing Dog Pose (or Adho Mukha Svanasana)",
  "Eagle Pose (or Garudasana)",
  "Eight-Angle Pose (or Astavakrasana)",
  "Extended Puppy Pose (or Uttana Shishosana)",
  "Extended Revolved Side Angle Pose (or Utthita Parsvakonasana)",
  "Extended Revolved Triangle Pose (or Utthita Trikonasana)",
  "Feathered Peacock Pose (or Pincha Mayurasana)",
  "Firefly Pose (or Tittibhasana)",
  "Fish Pose (or Matsyasana)",
  "Four-Limbed Staff Pose (or Chaturanga Dandasana)",
  "Frog Pose (or Bhekasana)",
  "Garland Pose (or Malasana)",
  "Gate Pose (or Parighasana)",
  "Half Lord Of The Fishes Pose (or Ardha Matsyendrasana)",
  "Half Moon Pose (or Ardha Chandrasana)",
  "Handstand Pose (or Adho Mukha Vrksasana)",
  "Happy Baby Pose (or Ananda Balasana)",
  "Head-To-Knee Forward Bend Pose (or Janu Sirsasana)",
  "Heron Pose (or Krounchasana)",
  "Intense Side Stretch Pose (or Parsvottanasana)",
  "Legs-Up-The-Wall Pose (or Viparita Karani)",
  "Locust Pose (or Salabhasana)",
  "Lord Of The Dance Pose (or Natarajasana)",
  "Low Lunge Pose (or Anjaneyasana)",
  "Noose Pose (or Pasasana)",
  "Peacock Pose (or Mayurasana)",
  "Pigeon Pose (or Kapotasana)",
  "Plank Pose (or Kumbhakasana)",
  "Plow Pose (or Halasana)",
  "Pose Dedicated To The Sage Koundinya (or Eka Pada Koundinyanasana I And II)",
  "Rajakapotasana",
  "Reclining Hand-To-Big-Toe Pose (or Supta Padangusthasana)",
  "Revolved Head-To-Knee Pose (or Parivrtta Janu Sirsasana)",
  "Scale Pose (or Tolasana)",
  "Scorpion Pose (or Vrischikasana)",
  "Seated Forward Bend Pose (or Paschimottanasana)",
  "Shoulder-Pressing Pose (or Bhujapidasana)",
  "Side-Reclining Leg Lift Pose (or Anantasana)",
  "Side Crane (Crow) Pose (or Parsva Bakasana)",
  "Side Plank Pose (or Vasisthasana)",
  "Sitting Pose 1 (Normal)",
  "Split Pose",
  "Staff Pose (or Dandasana)",
  "Standing Forward Bend Pose (or Uttanasana)",
  "Standing Split Pose (or Urdhva Prasarita Eka Padasana)",
  "Standing Big Toe Hold Pose (or Utthita Padangusthasana)",
  "Supported Headstand Pose (or Salamba Sirsansana)",
  "Supported Shoulderstand Pose (or Salamba Sarvangasana)",
  "Supta Baddha Konasana",
  "Supta Virasana Vajrasana",
  "Tortoise Pose",
  "Tree Pose (or Vrksasana)",
  "Upward Bow (Wheel) Pose (or Urdhva Dhanurasana)",
  "Upward Facing Two-Foot Staff Pose (or Dwi Pada Viparita Dandasana)",
  "Upward Plank Pose (or Purvottanasana)",
  "Virasana Or Vajrasana",
  "Warrior III Pose (or Virabhadrasana III)",
  "Warrior II Pose (or Virabhadrasana II)",
  "Warrior I Pose (or Virabhadrasana I)",
  "Wide-Angle Seated Forward Bend Pose (or Upavistha Konasana)",
  "Wide-Legged Forward Bend Pose (or Prasarita Padottanasana)",
  "Wild Thing Pose (or Camatkarasana)",
  "Wind Relieving Pose (or Pawanmuktasana)",
  "Yogic Sleep Pose",
  "Viparita Virabhadrasana (or Reverse Warrior Pose)"
];

const POSE_LIMITATION_INSTRUCTION = `
CRITICAL CONSTRAINT: You MUST ONLY recommend, reference, guide, or design routines for the user using yoga poses that are explicitly listed below. Never invent, suggest, or mention any yoga poses outside of this list:
${ALLOWED_YOGA_POSES.map(p => `- ${p}`).join('\n')}
`;

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
  const messages = contents.map(c => ({
    role: c.role === 'model' || c.role === 'assistant' ? 'assistant' : 'user',
    content: c.parts ? c.parts.map(p => p.text).join('\n') : c.content
  }));

  try {
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
    
    if (res.status === 429 || res.status === 500) {
      console.warn(`/api/chat failed with ${res.status}, falling back to Gemini...`);
      return await callGeminiFallback(systemInstruction, contents);
    }
  } catch (err) {
    console.warn("/api/chat not reachable, falling back to direct Groq call...");
  }

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

  return await callGeminiFallback(systemInstruction, contents);
}

/**
 * Generate a warm, personalized morning greeting (2-3 sentences).
 */
export async function generateMorningGreeting(userContext) {
  const system = `You are a warm, caring AI Wellness Mentor. Generate a brief, personalized morning greeting. Keep it to 2-3 sentences maximum. Be encouraging and reference specific details from the user's data. Do not use generic greetings.\n${POSE_LIMITATION_INSTRUCTION}`;

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
  const system = `You are an expert yoga instructor and AI Wellness Mentor. Design safe, effective yoga sessions tailored to the user's experience level, physical considerations, and goals. Always prioritize safety and proper alignment.\n${POSE_LIMITATION_INSTRUCTION}`;

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
  const system = `You are a trusted AI wellness mentor for YogTatva. You know the user deeply through the context provided below. You are warm, encouraging, and practical.
${POSE_LIMITATION_INSTRUCTION}

ROUTINE UPDATE CAPABILITY:
When the user asks you to change, update, modify, create, or personalise their yoga routine or plan, you MUST:
1. Respond with your warm mentor message as normal text.
2. Then append a JSON block at the END of your response using EXACTLY this format (no extra text after the JSON):

\`\`\`json
{
  "action": "UPDATE_ROUTINE",
  "payload": {
    "message": "A short description of why you chose this sequence.",
    "poses": [
      { "id": "cat_cow", "name": "Cat-Cow Stretch", "sanskritName": "Marjaryasana", "duration_mins": 3, "benefits": ["Spinal flexibility", "Stress relief"] },
      { "id": "downward_dog", "name": "Downward-Facing Dog Pose", "sanskritName": "Adho Mukha Svanasana", "duration_mins": 2, "benefits": ["Builds strength", "Energizes body"] },
      { "id": "corpse_pose", "name": "Corpse Pose", "sanskritName": "Savasana", "duration_mins": 5, "benefits": ["Deep relaxation", "Lowers blood pressure"] }
    ]
  }
}
\`\`\`

The pose ids must be snake_case versions of the english name. Only use poses from the allowed list above.

Guidelines:
- Be conversational and warm, like a caring friend who also happens to be a wellness expert
- Reference specific details from their profile, mood, sleep, and activity data
- If they seem stressed or low, acknowledge it empathetically before offering guidance
- Celebrate their wins, even small ones
- Keep responses concise but meaningful (2-5 sentences usually)
- If they ask about yoga or exercises, provide specific, actionable guidance
- If they share a struggle, validate their feelings first

User context:
${userContext}`;

  const contents = [];

  if (conversationHistory.length > 0) {
    const recent = conversationHistory.slice(-6);
    for (const msg of recent) {
      contents.push({
        role: msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content || msg.text || '' }],
      });
    }
  }

  contents.push({
    role: 'user',
    parts: [{ text: userMessage }],
  });

  return callAI(system, contents);
}

export async function generateOnboardingProfile(onboardingData) {
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

/**
 * Generate Post-Session Mentor Analysis.
 */
export async function generateSessionSummary(sessionData, previousSessions = []) {
  let improvementContext = "This is their first session.";
  if (previousSessions.length > 0) {
    const avgPast = Math.round(previousSessions.reduce((acc, s) => acc + s.average_accuracy, 0) / previousSessions.length);
    const diff = sessionData.average_accuracy - avgPast;
    improvementContext = `Past average accuracy was ${avgPast}%. Today's accuracy was ${sessionData.average_accuracy}%. ${diff > 0 ? `Improvement of +${diff}%` : `Drop of ${diff}%`}.`;
  }

  const system = `You are an expert yoga mentor. Analyze this yoga session data and provide:
1. Positive feedback.
2. Key improvement areas.
3. One motivational observation.
4. One specific suggestion for next session.

Keep response under 60 words.

Historical context: ${improvementContext}
Session Data: ${JSON.stringify(sessionData)}`;

  const result = await callAI(system, [{ role: 'user', content: "Analyze my session." }]);
  if (result.success) return result.text;
  
  return `You completed ${sessionData.completed_poses} poses today with ${sessionData.average_accuracy}% accuracy! Keep practicing consistently to see continuous improvements in your form and balance.`;
}

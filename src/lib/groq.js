// src/lib/groq.js

const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

/**
 * Sends a structured pose state to Groq to generate real-time coaching feedback.
 * @param {string} targetPose - The name of the pose they are trying to do (e.g., "Tree Pose")
 * @param {Object} poseState - The JSON summary from poseAnalysis.js
 * @returns {Promise<string>} The verbal coaching advice
 */
export async function getPoseFeedback(targetPose, poseState) {
  if (!GROQ_API_KEY) {
    console.warn("Missing VITE_GROQ_API_KEY");
    return "API key missing. Keep breathing and hold the pose.";
  }

  const systemPrompt = `You are a world-class, encouraging Yoga Instructor. 
You are observing a student trying to perform: "${targetPose}".
I will provide you with a JSON object describing their current physical posture angles and alignment.

Your job:
1. Analyze if their arms, legs, or shoulders are in the correct position for "${targetPose}".
2. Output exactly ONE short sentence (max 15 words) of verbal feedback to speak to them.
3. If their pose looks generally correct based on the data, encourage them (e.g., "Perfect alignment, hold it there.").
4. If something is off, give a gentle correction (e.g., "Level your shoulders and straighten your right leg.").
5. DO NOT use markdown, emojis, or punctuation that sounds weird when spoken out loud by a robot. Keep it conversational.`;

  try {
    const response = await fetch(GROQ_ENDPOINT, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile', // Groq's fastest large model
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: JSON.stringify(poseState) }
        ],
        temperature: 0.5,
        max_tokens: 50
      })
    });

    if (!response.ok) {
      console.error("Groq API Error", await response.text());
      return "Keep your focus steady.";
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  } catch (err) {
    console.error("Failed to fetch from Groq", err);
    return "Remember to breathe deeply.";
  }
}

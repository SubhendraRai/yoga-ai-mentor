// src/lib/speech.js

let lastSpokenText = "";
let lastSpokenTime = 0;
const COOLDOWN_MS = 3000; // Wait 3 seconds before repeating the exact same phrase
const OVERALL_COOLDOWN_MS = 2000; // Wait 2 seconds before saying anything new

export const speechHelper = {
  speak: (text, force = false) => {
    if (!window.speechSynthesis) return;

    const now = Date.now();
    
    // If it's the same text, apply a longer cooldown
    if (text === lastSpokenText && (now - lastSpokenTime) < COOLDOWN_MS && !force) {
      return;
    }
    
    // Global cooldown to prevent rapid-fire speaking of different texts
    if ((now - lastSpokenTime) < OVERALL_COOLDOWN_MS && !force) {
      return;
    }

    // Cancel any currently playing speech to ensure immediate feedback
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Try to find a pleasant female voice (like an AI mentor)
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => 
      v.name.includes('Samantha') || 
      v.name.includes('Karen') || 
      v.name.includes('Google US English') ||
      (v.lang === 'en-US' && v.name.includes('Female'))
    );
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    utterance.rate = 0.95; // Slightly slower, calmer
    utterance.pitch = 1.0; 

    window.speechSynthesis.speak(utterance);
    
    lastSpokenText = text;
    lastSpokenTime = now;
  },
  
  cancel: () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }
};

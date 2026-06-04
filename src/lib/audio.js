// src/lib/audio.js

// Minimal, synthesized UI sounds in base64 format (Web Audio API synthetic beeps)
// We use a small audio context synthesizer instead of large base64 files for speed and crispness.

const getAudioContext = () => {
  if (typeof window === 'undefined') return null;
  window.audioCtx = window.audioCtx || new (window.AudioContext || window.webkitAudioContext)();
  return window.audioCtx;
};

const playTone = (frequency, type, duration, volume = 0.1) => {
  const ctx = getAudioContext();
  if (!ctx) return;
  
  if (ctx.state === 'suspended') {
    ctx.resume();
  }

  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();

  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  
  // Envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.02);
  gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);

  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
};

export const playSound = {
  pop: () => {
    // Gentle low pop for sending messages
    playTone(350, 'sine', 0.1, 0.05);
  },
  
  chime: () => {
    // Soft high chime for receiving messages
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(880, 'sine', 0.3, 0.03); // A5
    setTimeout(() => playTone(1108.73, 'sine', 0.4, 0.03), 100); // C#6
  },
  
  success: () => {
    // Melodic chord for completing tasks/onboarding
    const ctx = getAudioContext();
    if (!ctx) return;
    playTone(523.25, 'sine', 0.4, 0.04); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.4, 0.04), 100); // E5
    setTimeout(() => playTone(783.99, 'sine', 0.6, 0.04), 200); // G5
  },
  
  error: () => {
    playTone(200, 'square', 0.2, 0.02);
    setTimeout(() => playTone(150, 'square', 0.3, 0.02), 150);
  }
};

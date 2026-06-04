import { useState, useEffect } from "react";
import { Settings, LogOut, Sparkles, Compass, Check, AlertCircle, RefreshCw } from "lucide-react";

// Local dynamic plan generator for premium instant mock mode
function generateMockPlan(form) {
  const name = form.name || 'Seeker';
  const goal = form.goal.toLowerCase();
  const time = parseInt(form.time) || 20;
  const level = form.level;
  const health = form.health || 'none';

  let poses = [];
  let breathing = [];
  let tip = "";
  let morningMessage = "";
  let weekExpectation = "";

  if (goal.includes('stress') || goal.includes('anxiety') || goal.includes('calm') || goal.includes('relax') || goal.includes('mind')) {
    morningMessage = `Namaste ${name}. Today, we focus on slowing down, grounding your energy, and releasing mental tension. Remember that your breath is an anchor you can always return to when the mind wanders.`;
    poses = [
      { name: "Child's Pose (Balasana)", duration: `${Math.round(time * 0.2)} mins`, desc: "Focus on deep belly breathing and releasing the lower back." },
      { name: "Cat-Cow Stretch (Marjaryasana-Bitilasana)", duration: `${Math.round(time * 0.25)} mins`, desc: "Moving with the breath to release spinal tension." },
      { name: "Legs-Up-The-Wall Pose (Viparita Karani)", duration: `${Math.round(time * 0.3)} mins`, desc: "Excellent for calming the nervous system and restoring circulation." },
      { name: "Corpse Pose (Savasana)", duration: `${Math.round(time * 0.25)} mins`, desc: "Final conscious relaxation to integrate the practice." }
    ];
    breathing = [
      { name: "Nadi Shodhana (Alternate Nostril Breathing)", desc: "Balances left and right hemispheres of the brain, inducing deep calm. Practice for 3-5 minutes." }
    ];
    tip = "When stress arises during the day, pause and take three slow, deep breaths, making your exhalations twice as long as your inhalations.";
    weekExpectation = "This week, you may notice a subtle shift in how you respond to stressors. Focus on consistency rather than duration. Even 10 minutes daily will build resilience in your nervous system.";
  } else if (goal.includes('back') || goal.includes('spine') || goal.includes('pain') || goal.includes('neck') || goal.includes('shoulder')) {
    morningMessage = `Namaste ${name}. We are focusing on gentle spinal decompression, core stability, and opening the hips to relieve tension in your back. Please move mindfully and never force any pose.`;
    poses = [
      { name: "Cat-Cow Stretch", duration: `${Math.round(time * 0.25)} mins`, desc: "Warms up the spine and increases synovial fluid circulation." },
      { name: "Downward-Facing Dog (Adho Mukha Svanasana)", duration: `${Math.round(time * 0.2)} mins`, desc: "Keep knees bent if hamstrings are tight to keep length in the spine." },
      { name: "Sphinx Pose (Salamba Bhujangasana)", duration: `${Math.round(time * 0.25)} mins`, desc: "Gentle backbend to restore the natural curve of the lower back." },
      { name: "Supine Spinal Twist (Supta Matsyendrasana)", duration: `${Math.round(time * 0.3)} mins`, desc: "Releases tension along the entire length of the spine." }
    ];
    breathing = [
      { name: "Dirga Pranayama (Three-Part Breath)", desc: "Fills the abdomen, rib cage, and upper chest, encouraging full posture alignment. Practice for 3 minutes." }
    ];
    tip = "Avoid sitting for more than 45 minutes at a time. Set a gentle timer to stand, stretch your arms overhead, and do a micro-gentle backbend.";
    weekExpectation = "By practicing these specific spinal releases, your back muscles will begin to unclench. Expect some mild release soreness, but stop if you feel any sharp pain. Consistently lengthening your spine will improve your posture.";
  } else if (goal.includes('flexibility') || goal.includes('stretch') || goal.includes('stiff') || goal.includes('tight')) {
    morningMessage = `Namaste ${name}. Today's sequence is dedicated to creating space in the hamstrings, hips, and shoulders. Approach each stretch with patience—flexibility is a journey of letting go, not forcing.`;
    poses = [
      { name: "Downward-Facing Dog (Adho Mukha Svanasana)", duration: `${Math.round(time * 0.2)} mins`, desc: "Pedal out the feet to stretch calves and hamstrings." },
      { name: "Low Lunge (Anjaneyasana)", duration: `${Math.round(time * 0.25)} mins`, desc: "Deep stretch for the hip flexors and psoas." },
      { name: "Seated Forward Bend (Paschimottanasana)", duration: `${Math.round(time * 0.25)} mins`, desc: "Lengthens the entire back body. Use a strap if needed." },
      { name: "Half Pigeon Pose (Ardha Kapotasana)", duration: `${Math.round(time * 0.3)} mins`, desc: "Deep hip opener to release stored emotional and physical tension." }
    ];
    breathing = [
      { name: "Ujjayi Pranayama (Victorious Breath)", desc: "Create a soft constriction in the throat to warm the body from the inside, helping muscles relax deeper into stretches. Practice throughout the session." }
    ];
    tip = "Warm muscles stretch safer. Do a few gentle movements before going into deep stretches, and never stretch to the point of pain—aim for a 7/10 sensation.";
    weekExpectation = "You will begin to feel more space in your joints and less morning stiffness. Flexibility comes from nervous system safety; as your body learns it is safe to stretch, it will naturally yield more depth.";
  } else {
    // Default / Energy / Focus / Strength
    morningMessage = `Namaste ${name}. Welcome to your practice. Today we focus on building mental clarity, core stability, and vitality. Let's move with intention and awaken your inner fire.`;
    poses = [
      { name: "Sun Salutations (Surya Namaskar)", duration: `${Math.round(time * 0.3)} mins`, desc: "Flowing movement to heat the body and sync movement with breath." },
      { name: "Warrior II (Virabhadrasana II)", duration: `${Math.round(time * 0.2)} mins`, desc: "Builds lower body strength, stamina, and fierce focus." },
      { name: "Tree Pose (Vrksasana)", duration: `${Math.round(time * 0.2)} mins`, desc: "Aids concentration, balance, and grounds your energy." },
      { name: "Plank Pose to Cobra Flow", duration: `${Math.round(time * 0.3)} mins`, desc: "Strengthens core, arms, and opens the chest for energy." }
    ];
    breathing = [
      { name: "Kapalabhati (Breath of Fire)", desc: "Invigorating breath that boosts oxygen levels, clarifies the mind, and stimulates digestive fire. Practice 2 rounds of 30 breaths." }
    ];
    tip = "Start your day with a glass of warm lemon water before your practice to stimulate digestion and awaken hydration.";
    weekExpectation = "Expect a steady rise in your daily energy levels and clearer focus. Aligning movement with deep pranayama acts as a natural charging station for your mind and body.";
  }

  let output = `## Good Morning Message\n${morningMessage}\n\n`;
  output += `## Today's Yoga Session\n`;
  poses.forEach(p => {
    output += `* **${p.name}** (${p.duration}): ${p.desc}\n`;
  });
  output += `\n## Breathing Practice\n`;
  breathing.forEach(b => {
    output += `* **${b.name}**: ${b.desc}\n`;
  });
  output += `\n## Wellness Tip\n• ${tip}\n\n`;
  output += `## What to Expect This Week\n${weekExpectation}`;

  return output;
}

function parseResponse(text) {
  const sections = [];
  const lines = text.split('\n');
  let current = null;
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.startsWith('##') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
      if (current) sections.push(current);
      current = { heading: trimmed.replace(/\*\*/g,'').replace(/##/g,'').trim(), lines: [] };
    } else {
      if (!current) current = { heading: null, lines: [] };
      current.lines.push(trimmed.replace(/\*\*/g,'').replace(/^\*/,'•'));
    }
  }
  if (current) sections.push(current);
  return sections;
}

export default function YogaAIMentor({ user, onLogout }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    age: '',
    goal: '',
    time: '20',
    level: 'beginner',
    health: '',
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [provider, setProvider] = useState(localStorage.getItem("yoga_provider") || import.meta.env.VITE_DEFAULT_PROVIDER || "gemini");
  const [geminiKey, setGeminiKey] = useState(localStorage.getItem("yoga_gemini_key") || import.meta.env.VITE_GEMINI_API_KEY || "");
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem("yoga_anthropic_key") || "");
  const [showSettings, setShowSettings] = useState(false);
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    setShowWelcome(true);
    const timer = setTimeout(() => setShowWelcome(false), 5000);
    return () => clearTimeout(timer);
  }, []);

  // Sync form name with user name if it changes
  useEffect(() => {
    if (user?.name) {
      setForm(f => ({ ...f, name: user.name }));
    }
  }, [user]);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSaveSettings = (e) => {
    e.preventDefault();
    localStorage.setItem("yoga_provider", provider);
    localStorage.setItem("yoga_gemini_key", geminiKey.trim());
    localStorage.setItem("yoga_anthropic_key", anthropicKey.trim());
    setSettingsSaved(true);
    setTimeout(() => {
      setSettingsSaved(false);
      setShowSettings(false);
    }, 1000);
  };

  async function generate() {
    if (!form.goal.trim()) return;
    setLoading(true);
    setResult(null);
    setError('');

    const prompt = `You are an expert personal yoga and wellness AI mentor.

Create a personalized daily wellness plan for this user:
- Name: ${form.name || 'the user'}
- Age: ${form.age || 'not specified'}
- Primary goal: ${form.goal}
- Available time: ${form.time} minutes
- Fitness level: ${form.level}
- Health notes: ${form.health || 'none'}

Write a warm, personal response directly addressing them by name. Structure your plan with these sections:
## Good Morning Message
## Today's Yoga Session (list 3-5 specific asanas with duration)
## Breathing Practice (1-2 pranayama techniques)
## Wellness Tip
## What to Expect This Week

Be specific, encouraging, and practical. Use their goal to customize every recommendation.`;

    if (provider === "mock") {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      try {
        const text = generateMockPlan(form);
        setResult(text);
      } catch (e) {
        setError('Something went wrong generating your mock plan.');
      }
      setLoading(false);
      return;
    }

    if (provider === "gemini") {
      const activeGeminiKey = geminiKey.trim() || import.meta.env.VITE_GEMINI_API_KEY;
      if (!activeGeminiKey) {
        setError("Gemini API Key is missing. Configure it in Settings or switch to Mock Mode.");
        setLoading(false);
        return;
      }

      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${activeGeminiKey}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
          })
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Gemini HTTP Error ${res.status}`);
        }

        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
        if (!text) throw new Error("Received empty response from Gemini API");
        setResult(text);
      } catch (e) {
        console.error(e);
        setError(`Gemini API Error: ${e.message}. (You can switch to Mock Mode in Settings if your key is invalid.)`);
      }
      setLoading(false);
      return;
    }

    if (provider === "anthropic") {
      const activeAnthropicKey = anthropicKey.trim();
      if (!activeAnthropicKey) {
        setError("Anthropic API Key is missing. Configure it in Settings or switch to Mock Mode.");
        setLoading(false);
        return;
      }

      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'x-api-key': activeAnthropicKey,
            'anthropic-version': '2023-06-01',
            'anthropic-dangerous-direct-to-browser': 'true'
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1000,
            messages: [{ role: 'user', content: prompt }],
          }),
        });

        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error?.message || `Anthropic HTTP Error ${res.status}`);
        }

        const data = await res.json();
        const text = data.content?.map(b => b.text || '').join('') || '';
        setResult(text);
      } catch (e) {
        console.error(e);
        setError(`Anthropic API Error: ${e.message}. (Standard browser CORS policies may block direct Claude API requests. You can clear keys in settings to use Mock Mode!)`);
      }
      setLoading(false);
      return;
    }
  }

  const sections = result ? parseResponse(result) : [];

  return (
    <div className="app">
      {/* Welcome Onboard Toast */}
      {showWelcome && (
        <div className="welcome-toast">
          <Sparkles size={15} style={{ color: "var(--accent-gold)" }} />
          <span>Hello {user?.name || "Seeker"}, welcome onboard!</span>
          <button className="toast-close" onClick={() => setShowWelcome(false)}>✕</button>
        </div>
      )}

      {/* Header Profile Navigation */}
      <div className="user-header-nav">
        <div className="user-pill" onClick={() => setShowSettings(true)}>
          <Compass size={14} style={{ color: "var(--accent-gold)" }} />
          <span>Namaste, {user?.name || "Seeker"}</span>
        </div>
        <button className="btn-icon" title="API Settings" onClick={() => setShowSettings(true)}>
          <Settings size={15} />
        </button>
        <button className="btn-icon" title="Log Out" onClick={onLogout}>
          <LogOut size={15} />
        </button>
      </div>

      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: 12 }}>
        <Compass size={18} style={{ color: "var(--accent-gold)" }} />
        <span>Yoga AI Mentor</span>
      </div>
      
      <h1 className="hero-title">
        Your <em>personal</em> wellness plan, built for you
      </h1>
      <p className="hero-sub">
        Tell your mentor about your current energy — receive a curated plan.
      </p>

      {/* Main Form */}
      <div className="form-card">
        <div className="row">
          <div className="field">
            <label>Your name</label>
            <input placeholder="Om" value={form.name} onChange={e => set('name', e.target.value)} />
          </div>
          <div className="field">
            <label>Age</label>
            <input placeholder="20" type="number" value={form.age} onChange={e => set('age', e.target.value)} />
          </div>
        </div>

        <div className="field">
          <label>Your primary goal</label>
          <input
            placeholder="e.g. reduce stress, better focus, flexibility, back pain relief..."
            value={form.goal}
            onChange={e => set('goal', e.target.value)}
          />
        </div>

        <div className="row">
          <div className="field">
            <label>Available time</label>
            <select value={form.time} onChange={e => set('time', e.target.value)}>
              <option value="10">10 minutes</option>
              <option value="15">15 minutes</option>
              <option value="20">20 minutes</option>
              <option value="30">30 minutes</option>
              <option value="45">45 minutes</option>
              <option value="60">1 hour</option>
            </select>
          </div>
          <div className="field">
            <label>Fitness level</label>
            <select value={form.level} onChange={e => set('level', e.target.value)}>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>

        <div className="field">
          <label>Health notes (optional)</label>
          <textarea
            placeholder="e.g. lower back pain, anxiety, sitting 8hrs/day, exam stress..."
            value={form.health}
            onChange={e => set('health', e.target.value)}
          />
        </div>

        <button
          className="submit-btn"
          disabled={!form.goal.trim() || loading}
          onClick={generate}
        >
          {loading ? (
            <>
              <div className="spinner" style={{ width: 16, height: 16, borderTopColor: "#0d0d0f" }} />
              <span>Crafting Wellness Plan...</span>
            </>
          ) : (
            <>
              <Sparkles size={16} />
              <span>Generate My Wellness Plan →</span>
            </>
          )}
        </button>
        {error && <p className="error">{error}</p>}
      </div>

      {/* Loading Block */}
      {loading && (
        <div className="result-card">
          <div className="loading-wrap">
            <div className="spinner" />
            <span>Your AI mentor is tuning into your profile and crafting your flow...</span>
          </div>
        </div>
      )}

      {/* Result Display */}
      {result && !loading && (
        <div className="result-card">
          <div className="result-header">
            <span>Your Personalized Wellness Plan</span>
            <span className="badge badge-gold" style={{ fontSize: 9 }}>
              {provider === "gemini" ? "Gemini Live" : provider === "anthropic" ? "Claude Live" : "AI Local"}
            </span>
          </div>
          <div className="result-body">
            {sections.map((s, i) => (
              <div key={i}>
                {s.heading && <div className="section-head">{s.heading}</div>}
                {s.lines.map((l, j) => <p key={j} style={{ marginBottom: '6px' }}>{l}</p>)}
              </div>
            ))}
          </div>
          <button className="reset-btn" onClick={() => { setResult(null); setForm(f => ({ ...f, goal: '', health: '' })); }}>
            ← Generate another plan
          </button>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-backdrop" onClick={() => setShowSettings(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            <h2 className="modal-title">AI Mentor Settings</h2>
            
            <div className="field">
              <label>Preferred AI Provider</label>
              <select value={provider} onChange={(e) => setProvider(e.target.value)}>
                <option value="gemini">Gemini AI (Direct Browser Call)</option>
                <option value="anthropic">Claude AI (Anthropic Direct API)</option>
                <option value="mock">Local Mock Mode (No Key Required)</option>
              </select>
            </div>

            <div className="info-alert" style={{ fontSize: "12px" }}>
              {provider === "gemini" && (
                "Gemini AI Mode: Directly calls Google's Gemini model. Gemini supports direct client-side calls without CORS restrictions, ensuring a seamless experience."
              )}
              {provider === "anthropic" && (
                "Claude AI Mode: Calls Anthropic API directly. Note: Direct client-side browser requests are typically blocked by CORS security policies."
              )}
              {provider === "mock" && (
                "Mock Mode: Dynamically generates plans locally in your browser. Perfect for testing without sharing any API keys."
              )}
            </div>

            <form onSubmit={handleSaveSettings}>
              {provider === "gemini" && (
                <div className="field">
                  <label>Gemini API Key</label>
                  <input
                    type="password"
                    placeholder={import.meta.env.VITE_GEMINI_API_KEY ? "••••••••••••••••••••••••" : "AIzaSy..."}
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                  />
                  {import.meta.env.VITE_GEMINI_API_KEY && !geminiKey && (
                    <p style={{ fontSize: "11px", color: "var(--success-color)", marginTop: "4px" }}>
                      ✓ Pre-configured key found in environment variables.
                    </p>
                  )}
                </div>
              )}

              {provider === "anthropic" && (
                <div className="field">
                  <label>Anthropic API Key</label>
                  <input
                    type="password"
                    placeholder="sk-ant-..."
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  type="button"
                  className="reset-btn"
                  style={{ margin: 0, flex: 1 }}
                  onClick={() => {
                    if (provider === "gemini") {
                      setGeminiKey("");
                      localStorage.removeItem("yoga_gemini_key");
                    } else if (provider === "anthropic") {
                      setAnthropicKey("");
                      localStorage.removeItem("yoga_anthropic_key");
                    }
                    localStorage.setItem("yoga_provider", "mock");
                    setProvider("mock");
                    setShowSettings(false);
                  }}
                >
                  Clear Key
                </button>
                <button type="submit" className="submit-btn" style={{ margin: 0, flex: 2 }}>
                  {settingsSaved ? (
                    <>
                      <Check size={16} />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <span>Save Settings</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, Sparkles, Compass } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function Auth({ onLoginSuccess }) {
  const [activeTab, setActiveTab] = useState("signin"); // "signin" or "signup"
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const handleInputChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setError("");
  };

  const validateForm = () => {
    if (activeTab === "signup" && !form.name.trim()) {
      setError("Please enter your name.");
      return false;
    }
    if (!form.email.trim()) {
      setError("Please enter your email.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (!form.password) {
      setError("Please enter a password.");
      return false;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return false;
    }
    if (activeTab === "signup" && form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setSuccessMsg("");

    const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || 
                          import.meta.env.VITE_SUPABASE_URL.includes('placeholder.supabase.co') ||
                          !import.meta.env.VITE_SUPABASE_ANON_KEY ||
                          import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    try {
      if (activeTab === "signup") {
        if (isPlaceholder) {
          setSuccessMsg("Account created successfully (Local-only mode)! Elevating your experience...");
          const userData = {
            id: 'mock_' + Math.random().toString(36).substr(2, 9),
            email: form.email.toLowerCase(),
            name: form.name.trim() || 'User',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem("yoga_current_user", JSON.stringify(userData));
          setTimeout(() => onLoginSuccess(userData), 1000);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email: form.email.toLowerCase(),
          password: form.password,
          options: {
            data: {
              name: form.name.trim()
            }
          }
        });

        if (error) {
          setError(error.message);
          return;
        }

        // If email confirmation is required by Supabase settings, data.session might be null
        if (data.user && !data.session) {
          setSuccessMsg("Account created! Please check your email to verify your account.");
          return;
        }

        if (data.user) {
          setSuccessMsg("Account created successfully! Elevating your experience...");

          // Store basic info for the app
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: form.name.trim(),
            createdAt: data.user.created_at
          };
          localStorage.setItem("yoga_current_user", JSON.stringify(userData));
          
          setTimeout(() => onLoginSuccess(userData), 800);
        }
      } else {
        // Sign In
        if (isPlaceholder) {
          setSuccessMsg("Signed in successfully (Local-only mode)!");
          const userData = {
            id: 'mock_user',
            email: form.email.toLowerCase(),
            name: form.email.split('@')[0] || 'User',
            createdAt: new Date().toISOString()
          };
          localStorage.setItem("yoga_current_user", JSON.stringify(userData));
          setTimeout(() => onLoginSuccess(userData), 1000);
          return;
        }

        const { data, error } = await supabase.auth.signInWithPassword({
          email: form.email.toLowerCase(),
          password: form.password
        });

        if (error) {
          setError(error.message);
          return;
        }

        if (data.user) {
          const userData = {
            id: data.user.id,
            email: data.user.email,
            name: data.user.user_metadata?.name || 'User',
            createdAt: data.user.created_at
          };
          localStorage.setItem("yoga_current_user", JSON.stringify(userData));
          onLoginSuccess(userData);
        }
      }
    } catch (err) {
      let friendlyError = "An unexpected error occurred. Please try again.";
      if (err.message?.includes('Load failed') || err.message?.includes('Failed to fetch')) {
        friendlyError = "Connection Error: Unable to reach the authentication server. Please check your network connection or configure Supabase.";
      } else if (err.message) {
        friendlyError = err.message;
      }
      setError(friendlyError);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setLoading(true);
    setError("");
    setSuccessMsg("");

    const isPlaceholder = !import.meta.env.VITE_SUPABASE_URL || 
                          import.meta.env.VITE_SUPABASE_URL.includes('placeholder.supabase.co') ||
                          !import.meta.env.VITE_SUPABASE_ANON_KEY ||
                          import.meta.env.VITE_SUPABASE_ANON_KEY === 'placeholder_key';

    if (isPlaceholder) {
      setTimeout(() => {
        setSuccessMsg(`Signed in with ${provider} (Local-only mode)!`);
        const userData = {
          id: `mock_${provider}_` + Math.random().toString(36).substr(2, 9),
          email: `${provider}_user@yogtatva.local`,
          name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
          createdAt: new Date().toISOString()
        };
        localStorage.setItem("yoga_current_user", JSON.stringify(userData));
        setTimeout(() => onLoginSuccess(userData), 1000);
      }, 600);
      return;
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.origin
        }
      });
      if (error) throw error;
    } catch (err) {
      let friendlyError = "An unexpected error occurred. Please try again.";
      if (err.message?.includes('Load failed') || err.message?.includes('Failed to fetch')) {
        friendlyError = `Connection Error: Unable to reach the authentication server for ${provider} login. Check your internet connection.`;
      } else if (err.message) {
        friendlyError = err.message;
      }
      setError(friendlyError);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-fullscreen">
      <div className="user-header-nav">
        <span className="badge badge-gold">
          <Sparkles size={11} style={{ marginRight: 4 }} /> Cloud Sync Active
        </span>
      </div>

      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 32 }}>
        <Compass className="spinner-slow" size={20} style={{ color: "var(--accent-gold)" }} />
        <span>Yogtatva</span>
      </div>

      <h1 className="hero-title">
        Begin your <em>journey</em> to mindfulness
      </h1>
      <p className="hero-sub" style={{ marginBottom: 32 }}>
        Sign in to create, track, and save your daily personalized wellness plan across all your devices.
      </p>

      <div className="form-card">
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${activeTab === "signin" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("signin");
              setError("");
              setSuccessMsg("");
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${activeTab === "signup" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("signup");
              setError("");
              setSuccessMsg("");
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuthSubmit}>
          {activeTab === "signup" && (
            <div className="field">
              <label>Your Name</label>
              <div style={{ position: "relative" }}>
                <input
                  type="text"
                  placeholder="Om"
                  value={form.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  style={{ paddingLeft: "40px" }}
                  required
                />
                <User
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                  }}
                />
              </div>
            </div>
          )}

          <div className="field">
            <label>Email Address</label>
            <div style={{ position: "relative" }}>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                style={{ paddingLeft: "40px" }}
                required
              />
              <Mail
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
            </div>
          </div>

          <div className="field">
            <label>Password</label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                value={form.password}
                onChange={(e) => handleInputChange("password", e.target.value)}
                style={{ paddingLeft: "40px", paddingRight: "40px" }}
                required
              />
              <Lock
                size={16}
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "var(--text-secondary)",
                }}
              />
              <button
                type="button"
                className="btn-icon"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: "10px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  border: "none",
                  background: "none",
                  padding: "4px",
                }}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {activeTab === "signup" && (
            <div className="field">
              <label>Confirm Password</label>
              <div style={{ position: "relative" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••"
                  value={form.confirmPassword}
                  onChange={(e) => handleInputChange("confirmPassword", e.target.value)}
                  style={{ paddingLeft: "40px" }}
                  required
                />
                <Lock
                  size={16}
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "var(--text-secondary)",
                  }}
                />
              </div>
            </div>
          )}

          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? (
              <>
                <div className="spinner" style={{ width: 16, height: 16, borderTopColor: "#0d0d0f" }} />
                <span>Synchronizing...</span>
              </>
            ) : activeTab === "signin" ? (
              "Sign In to Your Sanctuary →"
            ) : (
              "Register & Begin Plan →"
            )}
          </button>

          {error && <p className="error">{error}</p>}
          {successMsg && (
            <p className="error" style={{ color: "var(--success-color)", borderColor: "rgba(112, 184, 112, 0.2)", background: "rgba(112, 184, 112, 0.08)", marginTop: '12px' }}>
              {successMsg}
            </p>
          )}

          <div style={{ marginTop: '24px', textAlign: 'center', position: 'relative' }}>
            <hr style={{ borderColor: 'var(--border-color)', margin: '0' }} />
            <span style={{ position: 'absolute', top: '-10px', left: '50%', transform: 'translateX(-50%)', background: 'var(--bg-primary)', padding: '0 12px', fontSize: '12px', color: 'var(--text-secondary)' }}>OR</span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              className="btn-outline"
              disabled={loading}
              onClick={() => handleSocialLogin('google')}
              style={{ justifyContent: 'center', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <svg style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24">
                <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.65l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.42 3.66 1.5 7.55l3.86 3C6.27 7.53 8.91 5.04 12 5.04z" />
                <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.44c-.28 1.48-1.12 2.73-2.38 3.58v2.98h3.84c2.24-2.06 3.59-5.09 3.59-8.66z" />
                <path fill="#FBBC05" d="M5.36 14.55C5.12 13.83 5 13.06 5 12.27c0-.79.12-1.56.36-2.28V6.99H1.5C.54 8.91 0 11.04 0 13.27s.54 4.36 1.5 6.28l3.86-3z" />
                <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.92l-3.84-2.98c-1.06.71-2.42 1.14-4.12 1.14-3.09 0-5.73-2.49-6.64-5.51l-3.86 3C3.42 19.84 7.37 23 12 23z" />
              </svg>
              Google
            </button>
            <button
              type="button"
              className="btn-outline"
              disabled={loading}
              onClick={() => handleSocialLogin('apple')}
              style={{ justifyContent: 'center', padding: '10px 14px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
            >
              <svg style={{ width: '15px', height: '15px' }} viewBox="0 0 24 24" fill="currentColor">
                <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.51-.62.72-1.16 1.86-1.01 2.98 1.12.09 2.28-.62 2.96-1.43z" />
              </svg>
              Apple
            </button>
          </div>

          <button 
            type="button" 
            className="btn-outline" 
            style={{ width: '100%', marginTop: '16px', justifyContent: 'center' }}
            onClick={() => {
              const guestData = { id: 'guest', email: 'guest@yogtatva.local', name: 'Guest' };
              localStorage.setItem("yoga_current_user", JSON.stringify(guestData));
              onLoginSuccess(guestData);
            }}
          >
            Continue as Guest (Local Only)
          </button>
        </form>
      </div>
    </div>
  );
}

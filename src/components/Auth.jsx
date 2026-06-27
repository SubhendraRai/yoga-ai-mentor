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

    try {
      if (activeTab === "signup") {
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
      setError("An unexpected error occurred. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin,
        },
      });
      if (error) {
        setError(error.message);
      }
    } catch (err) {
      setError("An error occurred during Google Sign In.");
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

          <button 
            type="button" 
            className="btn-outline" 
            style={{ width: '100%', marginTop: '24px', justifyContent: 'center', display: 'flex', alignItems: 'center', gap: '8px' }}
            onClick={handleGoogleSignIn}
            disabled={loading}
          >
            <GoogleIcon />
            <span>{activeTab === "signin" ? "Sign In with Google" : "Sign Up with Google"}</span>
          </button>

          <button 
            type="button" 
            className="btn-outline" 
            style={{ width: '100%', marginTop: '12px', justifyContent: 'center' }}
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

const GoogleIcon = () => (
  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" style={{ width: 16, height: 16 }}>
    <path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      fill="#FBBC05"
    />
    <path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </svg>
);

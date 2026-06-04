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

  const handleSocialMock = (platform) => {
    setError(`Sign in with ${platform} is mocked. Please use the standard Sign Up or Sign In flow.`);
  };

  return (
    <div className="app">
      <div className="user-header-nav">
        <span className="badge badge-gold">
          <Sparkles size={11} style={{ marginRight: 4 }} /> Cloud Sync Active
        </span>
      </div>

      <div className="brand" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: 32 }}>
        <Compass className="spinner-slow" size={20} style={{ color: "var(--accent-gold)" }} />
        <span>Yoga AI Mentor</span>
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
        </form>
      </div>
    </div>
  );
}

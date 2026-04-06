import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";

function TradeSharpLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 2L58 17V47L32 62L6 47V17L32 2Z" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M32 10L50 21V43L32 54L14 43V21L32 10Z" stroke="#22d3ee" strokeWidth="1" fill="rgba(34,211,238,0.03)" />
      <line x1="20" y1="32" x2="44" y2="32" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      <line x1="32" y1="20" x2="32" y2="44" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      <path d="M32 26L38 32L32 38L26 32Z" fill="#22d3ee" opacity="0.85" />
      <line x1="20" y1="20" x2="24" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="20" x2="20" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="20" x2="40" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="20" x2="44" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="44" x2="24" y2="44" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="44" x2="20" y2="40" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="44" x2="40" y2="44" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="44" x2="44" y2="40" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <circle cx="32" cy="32" r="28" stroke="#22d3ee" strokeWidth="0.5" opacity="0.12" />
    </svg>
  );
}

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("signin"); // "signin" | "signup" | "forgot" | "reset"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [signupDone, setSignupDone] = useState(false);
  const [forgotDone, setForgotDone] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [focused, setFocused] = useState(null);

  // Redirect if already logged in, or handle password recovery link
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && mode !== "reset") navigate("/app", { replace: true });
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") {
        // User clicked the reset link in their email
        setMode("reset");
        setError("");
      } else if (session?.user && mode !== "reset") {
        navigate("/app", { replace: true });
      }
    });
    return () => subscription.unsubscribe();
  }, [navigate, mode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (mode === "signup") {
      const { error: err } = await supabase.auth.signUp({ email, password });
      if (err) { setError(err.message); setLoading(false); }
      else setSignupDone(true);
    } else if (mode === "forgot") {
      const redirectTo = `${window.location.origin}/login`;
      const { error: err } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
      setLoading(false);
      if (err) setError(err.message);
      else setForgotDone(true);
    } else if (mode === "reset") {
      if (newPassword.length < 6) {
        setError("Password must be at least 6 characters.");
        setLoading(false);
        return;
      }
      const { error: err } = await supabase.auth.updateUser({ password: newPassword });
      setLoading(false);
      if (err) setError(err.message);
      else setResetDone(true);
    } else {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password });
      if (err) { setError(err.message); setLoading(false); }
      // success: onAuthStateChange will redirect
    }
  };

  const switchMode = (m) => {
    setMode(m);
    setError("");
    setSignupDone(false);
    setForgotDone(false);
    setResetDone(false);
    setNewPassword("");
  };

  const inputStyle = (name) => ({
    width: "100%",
    padding: "12px 14px",
    borderRadius: 8,
    background: "rgba(255,255,255,0.05)",
    border: `1px solid ${focused === name ? "#22d3ee" : "rgba(255,255,255,0.1)"}`,
    boxShadow: focused === name ? "0 0 0 3px rgba(34,211,238,0.1)" : "none",
    color: "#eaebf0",
    fontSize: 15,
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    boxSizing: "border-box",
  });

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0d13",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: "24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0b0d13; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        input:-webkit-autofill,
        input:-webkit-autofill:hover,
        input:-webkit-autofill:focus {
          -webkit-box-shadow: 0 0 0px 1000px rgba(255,255,255,0.05) inset !important;
          -webkit-text-fill-color: #eaebf0 !important;
          caret-color: #eaebf0;
          transition: background-color 5000s ease-in-out 0s;
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "0%", right: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
      </div>

      {/* Back to home */}
      <button
        onClick={() => navigate("/")}
        style={{
          position: "absolute", top: 24, left: 24,
          background: "transparent", border: "none",
          color: "#6b6e84", fontSize: 14, fontWeight: 500,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 0", transition: "color 0.2s",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#a0a3b5"}
        onMouseLeave={e => e.currentTarget.style.color = "#6b6e84"}
      >
        ← Back
      </button>

      {/* Card */}
      <div style={{
        width: "100%",
        maxWidth: 420,
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: 16,
        padding: "40px 36px",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4), 0 0 40px rgba(34,211,238,0.04)",
        position: "relative",
        zIndex: 1,
      }}>
        {/* Logo + brand */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", marginBottom: 14 }}>
            <TradeSharpLogo size={44} />
          </div>
          <div style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaebf0" }}>
            Trade<span style={{ color: "#22d3ee" }}>Sharp</span>
          </div>
          <div style={{ fontSize: 13, color: "#6b6e84", marginTop: 4 }}>
            {mode === "signin" ? "Sign in to your account"
              : mode === "signup" ? "Create your account"
              : mode === "forgot" ? "Reset your password"
              : "Set a new password"}
          </div>
        </div>

        {/* Mode toggle — hide on forgot/reset screens */}
        {(mode === "signin" || mode === "signup") && (
          <div style={{
            display: "flex",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 8,
            padding: 3,
            marginBottom: 28,
          }}>
            {[["signin", "Sign In"], ["signup", "Create Account"]].map(([m, label]) => (
              <button
                key={m}
                onClick={() => switchMode(m)}
                style={{
                  flex: 1, padding: "8px 0", borderRadius: 6,
                  border: "none", cursor: "pointer",
                  fontSize: 13, fontWeight: 600,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.18s",
                  background: mode === m ? "rgba(34,211,238,0.12)" : "transparent",
                  color: mode === m ? "#22d3ee" : "#6b6e84",
                  boxShadow: mode === m ? "0 0 12px rgba(34,211,238,0.1)" : "none",
                }}
              >{label}</button>
            ))}
          </div>
        )}

        {/* Signup success */}
        {signupDone ? (
          <div style={{
            textAlign: "center", padding: "20px 0",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✉️</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#eaebf0", marginBottom: 8 }}>
              Check your email
            </div>
            <div style={{ fontSize: 13, color: "#6b6e84", lineHeight: 1.6 }}>
              We sent a confirmation link to <span style={{ color: "#a0a3b5" }}>{email}</span>. Click it to activate your account.
            </div>
            <button
              onClick={() => switchMode("signin")}
              style={{
                marginTop: 20, padding: "10px 24px", borderRadius: 7,
                background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                color: "#a0a3b5", fontSize: 13, fontWeight: 600,
                cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.color = "#eaebf0"; }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a0a3b5"; }}
            >Back to Sign In</button>
          </div>
        ) : mode === "forgot" ? (
          /* ── Forgot Password screen ── */
          forgotDone ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>📬</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#eaebf0", marginBottom: 8 }}>
                Check your inbox
              </div>
              <div style={{ fontSize: 13, color: "#6b6e84", lineHeight: 1.6 }}>
                We sent a password reset link to{" "}
                <span style={{ color: "#a0a3b5" }}>{email}</span>. It expires in 1 hour.
              </div>
              <button
                onClick={() => switchMode("signin")}
                style={{
                  marginTop: 20, padding: "10px 24px", borderRadius: 7,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a0a3b5", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.color = "#eaebf0"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a0a3b5"; }}
              >Back to Sign In</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: "#6b6e84", lineHeight: 1.6, marginBottom: 4 }}>
                Enter your email and we'll send you a link to reset your password.
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#a0a3b5", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  onFocus={() => setFocused("email")}
                  onBlur={() => setFocused(null)}
                  placeholder="you@example.com"
                  required
                  style={inputStyle("email")}
                />
              </div>
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 7,
                  background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)",
                  fontSize: 13, color: "#fb7185", lineHeight: 1.5,
                }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, padding: "13px", borderRadius: 8,
                  background: loading ? "rgba(34,211,238,0.4)" : "linear-gradient(135deg, #0891b2, #22d3ee)",
                  border: "none", color: "#0b0d13", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: loading ? "none" : "0 0 24px rgba(34,211,238,0.25)",
                  transition: "all 0.2s",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  width: "100%",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 0 36px rgba(34,211,238,0.4)"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = "0 0 24px rgba(34,211,238,0.25)"; }}
              >
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
              <button
                type="button"
                onClick={() => switchMode("signin")}
                style={{
                  background: "transparent", border: "none",
                  color: "#6b6e84", fontSize: 13, fontWeight: 500,
                  cursor: "pointer", textAlign: "center",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "color 0.2s", padding: "4px 0",
                }}
                onMouseEnter={e => e.currentTarget.style.color = "#a0a3b5"}
                onMouseLeave={e => e.currentTarget.style.color = "#6b6e84"}
              >← Back to Sign In</button>
            </form>
          )
        ) : mode === "reset" ? (
          /* ── Set New Password screen (user arrived from reset email) ── */
          resetDone ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 32, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "#eaebf0", marginBottom: 8 }}>
                Password updated!
              </div>
              <div style={{ fontSize: 13, color: "#6b6e84", lineHeight: 1.6 }}>
                Your password has been changed. You can now sign in.
              </div>
              <button
                onClick={() => switchMode("signin")}
                style={{
                  marginTop: 20, padding: "10px 24px", borderRadius: 7,
                  background: "transparent", border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a0a3b5", fontSize: 13, fontWeight: 600,
                  cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.color = "#eaebf0"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a0a3b5"; }}
              >Sign In →</button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ fontSize: 13, color: "#6b6e84", lineHeight: 1.6, marginBottom: 4 }}>
                Choose a new password for your account.
              </div>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#a0a3b5", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  onFocus={() => setFocused("newPassword")}
                  onBlur={() => setFocused(null)}
                  placeholder="Min. 6 characters"
                  required
                  style={inputStyle("newPassword")}
                />
              </div>
              {error && (
                <div style={{
                  padding: "10px 14px", borderRadius: 7,
                  background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)",
                  fontSize: 13, color: "#fb7185", lineHeight: 1.5,
                }}>{error}</div>
              )}
              <button
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 4, padding: "13px", borderRadius: 8,
                  background: loading ? "rgba(34,211,238,0.4)" : "linear-gradient(135deg, #0891b2, #22d3ee)",
                  border: "none", color: "#0b0d13", fontSize: 15, fontWeight: 700,
                  cursor: loading ? "not-allowed" : "pointer",
                  letterSpacing: "0.01em",
                  boxShadow: loading ? "none" : "0 0 24px rgba(34,211,238,0.25)",
                  transition: "all 0.2s",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  width: "100%",
                }}
                onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 0 36px rgba(34,211,238,0.4)"; }}
                onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = "0 0 24px rgba(34,211,238,0.25)"; }}
              >
                {loading ? "Saving…" : "Set New Password →"}
              </button>
            </form>
          )
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Email */}
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: "#a0a3b5", letterSpacing: "0.06em", textTransform: "uppercase", display: "block", marginBottom: 7 }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onFocus={() => setFocused("email")}
                onBlur={() => setFocused(null)}
                placeholder="you@example.com"
                required
                style={inputStyle("email")}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 7 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "#a0a3b5", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                  Password
                </label>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    style={{
                      background: "transparent", border: "none",
                      color: "#22d3ee", fontSize: 12, fontWeight: 600,
                      cursor: "pointer", padding: 0, opacity: 0.8,
                      fontFamily: "'Plus Jakarta Sans', sans-serif",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                    onMouseLeave={e => e.currentTarget.style.opacity = "0.8"}
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onFocus={() => setFocused("password")}
                onBlur={() => setFocused(null)}
                placeholder={mode === "signup" ? "Min. 6 characters" : "••••••••"}
                required
                style={inputStyle("password")}
              />
            </div>

            {/* Error */}
            {error && (
              <div style={{
                padding: "10px 14px", borderRadius: 7,
                background: "rgba(251,113,133,0.08)", border: "1px solid rgba(251,113,133,0.2)",
                fontSize: 13, color: "#fb7185", lineHeight: 1.5,
              }}>{error}</div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: 4,
                padding: "13px", borderRadius: 8,
                background: loading ? "rgba(34,211,238,0.4)" : "linear-gradient(135deg, #0891b2, #22d3ee)",
                border: "none", color: "#0b0d13", fontSize: 15, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.01em",
                boxShadow: loading ? "none" : "0 0 24px rgba(34,211,238,0.25)",
                transition: "all 0.2s",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                width: "100%",
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.boxShadow = "0 0 36px rgba(34,211,238,0.4)"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.boxShadow = "0 0 24px rgba(34,211,238,0.25)"; }}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In →" : "Create Account →"}
            </button>
          </form>
        )}
      </div>

      {/* Bottom tagline */}
      <p style={{ marginTop: 24, fontSize: 13, color: "#6b6e84", position: "relative", zIndex: 1 }}>
        Sharpen your edge. Track your path.
      </p>
    </div>
  );
}

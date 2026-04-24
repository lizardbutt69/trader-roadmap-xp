import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import SEOHead from "../components/SEOHead.jsx";

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
  const [resendDone, setResendDone] = useState(false);
  const [focused, setFocused] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const authError = params.get("error");
    if (authError) {
      setError(authError);
      window.history.replaceState({}, "", "/login");
    }
  }, []);

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

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    }
    // On success, browser redirects to Google → back to /app
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (mode === "signup") {
      const redirectTo = `${window.location.origin}/auth/callback`;
      const { error: err } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: redirectTo },
      });
      setLoading(false);
      if (err) setError(err.message);
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
    setResendDone(false);
    setNewPassword("");
  };

  const handleResendConfirmation = async () => {
    setError("");
    setResendDone(false);
    setLoading(true);
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error: err } = await supabase.auth.resend({
      type: "signup",
      email,
      options: { emailRedirectTo: redirectTo },
    });
    setLoading(false);
    if (err) setError(err.message);
    else setResendDone(true);
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

  const featureItems = [
    "Structured trade journaling",
    "Performance dashboard and account tracking",
    "Roadmap quests for discipline and consistency",
    "AI-assisted trade review and reflection",
  ];

  const metricItems = [
    ["Win Rate", "58%"],
    ["Avg R", "1.42"],
    ["Rules Followed", "84%"],
    ["Journal Streak", "12d"],
  ];

  const workflowItems = ["Pre-market plan", "Log execution", "Review mistakes", "Track progress"];

  return (
    <>
    <SEOHead title="Sign In" description="Sign in to TradeSharp to access your trading journal, performance tracker, and quest roadmap." noIndex={true} />
    <div className="auth-page-root" style={{
      minHeight: "100vh",
      background: "#0b0d13",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "32px",
      position: "relative",
      overflow: "auto",
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
        .auth-shell {
          width: 100%;
          max-width: 1120px;
          min-height: 680px;
          display: grid;
          grid-template-columns: minmax(0, 1.08fr) minmax(390px, 0.92fr);
          border: 1px solid rgba(255,255,255,0.08);
          background: rgba(255,255,255,0.025);
          box-shadow: 0 24px 72px rgba(0,0,0,0.44), 0 0 60px rgba(34,211,238,0.04);
          position: relative;
          z-index: 1;
        }
        .auth-left-panel {
          position: relative;
          overflow: hidden;
          padding: 52px;
          border-right: 1px solid rgba(255,255,255,0.08);
          background:
            linear-gradient(135deg, rgba(34,211,238,0.12), rgba(52,211,153,0.05) 38%, rgba(11,13,19,0.2)),
            #0b0d13;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 36px;
        }
        .auth-left-panel::before {
          content: "";
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255,255,255,0.035) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.035) 1px, transparent 1px);
          background-size: 44px 44px;
          mask-image: linear-gradient(120deg, rgba(0,0,0,0.85), transparent 78%);
          pointer-events: none;
        }
        .auth-card {
          background: rgba(11,13,19,0.72);
          padding: 48px 42px;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .auth-metrics-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
        }
        @media (max-width: 900px) {
          .auth-shell {
            grid-template-columns: 1fr;
            min-height: auto;
          }
          .auth-left-panel {
            border-right: none;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            padding: 34px 28px;
          }
          .auth-card {
            padding: 36px 28px;
          }
        }
        @media (max-width: 560px) {
          .auth-page-root {
            padding: 18px !important;
            align-items: flex-start !important;
          }
          .auth-shell {
            margin-top: 46px;
          }
          .auth-left-panel {
            display: none;
          }
          .auth-card {
            padding: 34px 22px;
          }
        }
      `}</style>

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

      <div className="auth-shell">
        <section className="auth-left-panel">
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 36 }}>
              <TradeSharpLogo size={36} />
              <div style={{ fontSize: 18, fontWeight: 800, color: "#eaebf0", letterSpacing: "-0.02em" }}>
                Trade<span style={{ color: "#22d3ee" }}>Sharp</span>
              </div>
            </div>

            <div style={{ maxWidth: 520 }}>
              <div style={{ fontSize: 44, lineHeight: 1.05, fontWeight: 600, color: "#f4f7fb", letterSpacing: 0, marginBottom: 18 }}>
                Turn every trade into sharper execution.
              </div>
              <div style={{ fontSize: 15, color: "#a8b0c2", lineHeight: 1.75, maxWidth: 470 }}>
                Journal trades, review patterns, track funded accounts, and build discipline through a trader-first roadmap.
              </div>
            </div>

            <div style={{ display: "grid", gap: 12, marginTop: 34, maxWidth: 500 }}>
              {featureItems.map((item) => (
                <div key={item} style={{ display: "flex", alignItems: "center", gap: 12, color: "#d8dee9", fontSize: 13, fontWeight: 400 }}>
                  <span style={{ width: 18, height: 18, borderRadius: 4, background: "rgba(34,211,238,0.12)", border: "1px solid rgba(34,211,238,0.28)", color: "#22d3ee", display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✓</span>
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div style={{ position: "relative", zIndex: 1 }}>
            <div className="auth-metrics-grid" style={{ marginBottom: 18 }}>
              {metricItems.map(([label, value]) => (
                <div key={label} style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(255,255,255,0.04)", padding: "16px 18px", minHeight: 74 }}>
                  <div style={{ color: "#6f7890", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 800, marginBottom: 8 }}>{label}</div>
                  <div style={{ color: "#f3f7fb", fontSize: 26, lineHeight: 1, fontWeight: 850, letterSpacing: 0 }}>{value}</div>
                </div>
              ))}
            </div>

            <div style={{ border: "1px solid rgba(255,255,255,0.09)", background: "rgba(0,0,0,0.18)", padding: 18 }}>
              <div style={{ color: "#22d3ee", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 850, marginBottom: 14 }}>Daily Review Loop</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
                {workflowItems.map((item, index) => (
                  <div key={item} style={{ color: "#b8c0d2", fontSize: 12, lineHeight: 1.35 }}>
                    <div style={{ color: index === 3 ? "#34d399" : "#7d879b", fontSize: 11, fontWeight: 850, marginBottom: 5 }}>0{index + 1}</div>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

      {/* Card */}
      <div className="auth-card">
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
            {resendDone && (
              <div style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 7,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.2)",
                fontSize: 13,
                color: "#22c55e",
                lineHeight: 1.5,
              }}>
                Confirmation email resent. Check spam or promotions too.
              </div>
            )}
            {error && (
              <div style={{
                marginTop: 14,
                padding: "10px 14px",
                borderRadius: 7,
                background: "rgba(251,113,133,0.08)",
                border: "1px solid rgba(251,113,133,0.2)",
                fontSize: 13,
                color: "#fb7185",
                lineHeight: 1.5,
              }}>{error}</div>
            )}
            <button
              onClick={handleResendConfirmation}
              disabled={loading}
              style={{
                marginTop: 20, padding: "10px 24px", borderRadius: 7,
                background: loading ? "rgba(34,211,238,0.4)" : "linear-gradient(135deg, #0891b2, #22d3ee)",
                border: "none", color: "#0b0d13", fontSize: 13, fontWeight: 700,
                cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
              }}
            >{loading ? "Sending..." : "Resend confirmation email"}</button>
            <button
              onClick={() => switchMode("signin")}
              style={{
                marginTop: 12, padding: "10px 24px", borderRadius: 7,
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
          <>
            {/* Google OAuth button */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: 8,
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                color: "#eaebf0",
                fontSize: 14,
                fontWeight: 600,
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 10,
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                transition: "all 0.2s",
                marginBottom: 14,
              }}
              onMouseEnter={e => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)"; } }}
              onMouseLeave={e => { if (!loading) { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; } }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
              </svg>
              Continue with Google
            </button>

            {/* Divider */}
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
              <span style={{ fontSize: 11, color: "#6b6e84", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>or</span>
              <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.08)" }} />
            </div>

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
          </>
        )}
      </div>
      </div>
    </div>
    </>
  );
}

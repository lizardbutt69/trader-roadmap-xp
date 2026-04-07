import { useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, useScroll, useTransform } from "framer-motion";

// ─── LOGO ─────────────────────────────────────────────────────────────────────

function TradeSharpLogo({ size = 32 }) {
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

// ─── CONSTANTS ────────────────────────────────────────────────────────────────

const FEATURES = [
  {
    icon: "🗺️",
    title: "Mission Roadmap",
    desc: "Track and level up every stage of your trading journey — from Funded Trader to full-time Independent.",
    accent: "#22d3ee",
  },
  {
    icon: "📋",
    title: "A+ Trade Checklist",
    desc: "10-point pre-trade system with a built-in 10-second reflection timer. Only take trades that meet every criteria.",
    accent: "#34d399",
  },
  {
    icon: "📈",
    title: "Trade Journal",
    desc: "Log every trade with chart screenshots, equity curve, P&L calendar, and CSV export.",
    accent: "#a78bfa",
  },
  {
    icon: "🎯",
    title: "TradeSharp Score",
    desc: "7-pillar spider chart scoring your Win Rate, Profit Factor, Consistency, A+ Discipline, and more monthly.",
    accent: "#fbbf24",
  },
  {
    icon: "📚",
    title: "Education Library",
    desc: "Curated YouTube resources, screenshot galleries, session notes, and category filters — all in one place.",
    accent: "#f472b6",
  },
  {
    icon: "🤖",
    title: "AI Performance Coach",
    desc: "Get brutally honest AI-powered summaries of your trading patterns, psychological leaks, and rule violations — monthly.",
    accent: "#fb923c",
  },
];

const STAGES = [
  { id: 1, name: "Foundation", subtitle: "Build the Process", icon: "📐", color: "#56b886", xp: "0 XP" },
  { id: 2, name: "Evaluation", subtitle: "Pass Evals & Get Funded", icon: "⚙️", color: "#d4b862", xp: "375 XP" },
  { id: 3, name: "Funded", subtitle: "Consistent Payouts", icon: "🛡️", color: "#5b8dd9", xp: "1,150 XP" },
  { id: 4, name: "Scaling", subtitle: "Personal Capital Online", icon: "🏛️", color: "#9b7de8", xp: "2,275 XP" },
  { id: 5, name: "Independent", subtitle: "Full-Time Trader", icon: "👑", color: "#e8748a", xp: "3,575 XP" },
];

// ─── EQUITY CURVE ─────────────────────────────────────────────────────────────

function EquityCurve() {
  const pts = [
    [0, 72], [12, 68], [24, 74], [36, 62], [48, 58], [60, 52], [72, 56],
    [84, 44], [96, 40], [108, 35], [120, 42], [132, 30], [144, 26], [156, 22],
    [168, 28], [180, 18], [192, 14], [204, 20], [216, 10], [228, 7], [240, 4],
  ];
  const path = pts
    .map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`))
    .join(" ");
  const fill = pts.map((p, i) => (i === 0 ? `M ${p[0]},${p[1]}` : `L ${p[0]},${p[1]}`)).join(" ") +
    ` L 240,90 L 0,90 Z`;

  return (
    <svg viewBox="0 0 240 90" style={{ width: "100%", height: 56 }} preserveAspectRatio="none">
      <defs>
        <linearGradient id="ecGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fill} fill="url(#ecGrad)" />
      <path d={path} fill="none" stroke="#34d399" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

// ─── MOCK DASHBOARD ───────────────────────────────────────────────────────────

function MockDashboard() {
  const checkItems = [
    { label: "CIC — SMT/PSP Confirmed", done: true },
    { label: "Key Level / Liquidity", done: true },
    { label: "Timeframe Alignment", done: true },
    { label: "CISD Confirmed", done: true },
    { label: "TTFM — Fractal Model", done: false },
    { label: "Session / Time of Day", done: false },
  ];

  return (
    <div style={{
      background: "rgba(11,13,19,0.95)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 24px 80px rgba(0,0,0,0.6), 0 0 60px rgba(34,211,238,0.06)",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      userSelect: "none",
    }}>
      {/* Browser chrome */}
      <div style={{
        background: "rgba(255,255,255,0.04)",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        padding: "10px 14px",
        display: "flex",
        alignItems: "center",
        gap: 8,
      }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#ff5f57","#febc2e","#28c840"].map((c, i) => (
            <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{
          flex: 1, height: 22, background: "rgba(255,255,255,0.06)",
          borderRadius: 4, display: "flex", alignItems: "center",
          padding: "0 10px", gap: 6, marginLeft: 8,
        }}>
          <span style={{ fontSize: 9, color: "rgba(34,211,238,0.6)", fontWeight: 600 }}>🔒</span>
          <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", letterSpacing: "0.02em" }}>
            app.tradesharp.io
          </span>
        </div>
      </div>

      {/* App layout */}
      <div style={{ display: "flex", height: 400 }}>
        {/* Sidebar */}
        <div style={{
          width: 44,
          background: "rgba(255,255,255,0.02)",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          paddingTop: 14,
          gap: 4,
        }}>
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: "rgba(34,211,238,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 12, marginBottom: 8,
          }}>⚡</div>
          {["🗺️","📋","📔","📊","📚","🎯"].map((icon, i) => (
            <div key={i} style={{
              width: 30, height: 30, borderRadius: 6,
              background: i === 0 ? "rgba(34,211,238,0.1)" : "transparent",
              border: i === 0 ? "1px solid rgba(34,211,238,0.2)" : "1px solid transparent",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, cursor: "pointer",
            }}>{icon}</div>
          ))}
        </div>

        {/* Main content */}
        <div style={{ flex: 1, padding: "14px 14px", overflowY: "hidden", display: "flex", flexDirection: "column", gap: 10 }}>

          {/* Header */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "#eaebf0" }}>The Grinder</div>
              <div style={{ fontSize: 9.5, color: "#6b6e84", letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600 }}>Stage 2 · Evaluation Phase</div>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <div style={{
                padding: "3px 8px", borderRadius: 20,
                background: "rgba(34,211,238,0.1)", border: "1px solid rgba(34,211,238,0.2)",
                fontSize: 9.5, color: "#22d3ee", fontWeight: 700, letterSpacing: "0.04em",
              }}>⚡ 890 XP</div>
              <div style={{
                padding: "3px 8px", borderRadius: 20,
                background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)",
                fontSize: 9.5, color: "#34d399", fontWeight: 700,
              }}>🔥 14d</div>
            </div>
          </div>

          {/* XP progress bar */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
              <span style={{ fontSize: 8.5, color: "#6b6e84", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Stage Progress</span>
              <span style={{ fontSize: 8.5, color: "#a0a3b5" }}>890 / 1,150 XP</span>
            </div>
            <div style={{ height: 5, background: "rgba(255,255,255,0.06)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{
                width: "77%", height: "100%",
                background: "linear-gradient(90deg, #0891b2, #22d3ee)",
                borderRadius: 3,
                boxShadow: "0 0 8px rgba(34,211,238,0.4)",
              }} />
            </div>
          </div>

          {/* Stats row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
            {[
              { label: "Win Rate", value: "68%", color: "#34d399" },
              { label: "Net P&L", value: "+$3,240", color: "#34d399" },
              { label: "Prof. Factor", value: "2.31", color: "#22d3ee" },
            ].map((s, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 7, padding: "7px 8px",
              }}>
                <div style={{ fontSize: 8.5, color: "#6b6e84", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 3 }}>{s.label}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
              </div>
            ))}
          </div>

          {/* Equity curve */}
          <div style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 7, padding: "8px 10px",
          }}>
            <div style={{ fontSize: 8.5, color: "#6b6e84", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>Equity Curve — April</div>
            <EquityCurve />
          </div>

          {/* Bottom row: checklist + roadmap */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, flex: 1 }}>
            {/* Checklist */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 7, padding: "8px 10px",
            }}>
              <div style={{ fontSize: 8.5, color: "#6b6e84", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>A+ Checklist</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                {checkItems.map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <div style={{
                      width: 11, height: 11, borderRadius: 3, flexShrink: 0,
                      background: item.done ? "rgba(52,211,153,0.2)" : "rgba(255,255,255,0.05)",
                      border: `1px solid ${item.done ? "rgba(52,211,153,0.5)" : "rgba(255,255,255,0.12)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 7,
                    }}>{item.done ? "✓" : ""}</div>
                    <span style={{ fontSize: 8.5, color: item.done ? "#a0a3b5" : "#6b6e84" }}>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Roadmap levels */}
            <div style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 7, padding: "8px 10px",
            }}>
              <div style={{ fontSize: 8.5, color: "#6b6e84", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 7 }}>Roadmap</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                {[
                  { name: "Foundation", done: true, color: "#56b886" },
                  { name: "Evaluation", done: false, active: true, color: "#d4b862" },
                  { name: "Funded", done: false, color: "#5b8dd9" },
                  { name: "Scaling", done: false, color: "#9b7de8" },
                  { name: "Independent", done: false, color: "#e8748a" },
                ].map((lvl, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{
                      width: 10, height: 10, borderRadius: "50%", flexShrink: 0,
                      background: lvl.done ? lvl.color : lvl.active ? "transparent" : "rgba(255,255,255,0.06)",
                      border: lvl.active ? `2px solid ${lvl.color}` : lvl.done ? "none" : "1px solid rgba(255,255,255,0.1)",
                      boxShadow: lvl.active ? `0 0 6px ${lvl.color}60` : lvl.done ? `0 0 4px ${lvl.color}40` : "none",
                    }} />
                    <span style={{
                      fontSize: 8.5,
                      color: lvl.done ? "#a0a3b5" : lvl.active ? "#eaebf0" : "#6b6e84",
                      fontWeight: lvl.active ? 600 : 400,
                    }}>{lvl.name}</span>
                    {lvl.done && <span style={{ fontSize: 7.5, color: "#34d399", marginLeft: "auto" }}>✓</span>}
                    {lvl.active && <span style={{ fontSize: 7.5, color: "#d4b862", marginLeft: "auto" }}>→</span>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FLOATING BADGE ───────────────────────────────────────────────────────────

function FloatingBadge({ children, style }) {
  return (
    <motion.div
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      style={{
        position: "absolute",
        background: "rgba(11,13,19,0.9)",
        backdropFilter: "blur(16px)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderRadius: 10,
        padding: "8px 12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        fontSize: 11,
        fontWeight: 600,
        color: "#eaebf0",
        display: "flex",
        alignItems: "center",
        gap: 7,
        whiteSpace: "nowrap",
        zIndex: 10,
        ...style,
      }}
    >
      {children}
    </motion.div>
  );
}

// ─── SECTION WRAPPER ──────────────────────────────────────────────────────────

function FadeInSection({ children, delay = 0, style }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1], delay }}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── LANDING PAGE ─────────────────────────────────────────────────────────────

export default function LandingPage() {
  const navigate = useNavigate();
  const heroRef = useRef(null);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 60]);

  return (
    <div style={{
      background: "#0b0d13",
      minHeight: "100vh",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      color: "#eaebf0",
      overflowX: "hidden",
    }}>
      <style>{`
        html, body { overflow-x: hidden; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0b0d13; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) #0b0d13; }

        .ts-nav-links { display: flex; }
        .ts-nav-signin { display: flex; }
        .ts-hero { flex-direction: row; gap: 56px; }
        .ts-hero-copy { width: 440px; }
        .ts-hero-dash { display: block; width: 520px; flex-shrink: 0; }
        .ts-hero-btns { flex-direction: row; }
        .ts-stats-strip { grid-template-columns: repeat(4, 1fr); padding: 36px 48px; }
        .ts-features-section { padding: 80px 48px; }
        .ts-features-grid { grid-template-columns: repeat(3, 1fr); }
        .ts-path-section { padding: 80px 48px; }
        .ts-stages { flex-direction: row; }
        .ts-score-section { padding: 80px 48px; }
        .ts-score-inner { flex-direction: row; gap: 64px; }
        .ts-cta-section { padding: 80px 48px; }
        .ts-footer { flex-direction: row; gap: 0; }

        @media (max-width: 900px) {
          .ts-nav-links { display: none !important; }
          .ts-nav-signin { display: none !important; }
          .ts-hero { flex-direction: column !important; gap: 40px !important; align-items: flex-start !important; padding: 88px 24px 48px !important; }
          .ts-hero-copy { width: 100% !important; }
          .ts-hero-dash { display: none !important; }
          .ts-hero-btns { flex-direction: column !important; gap: 10px !important; }
          .ts-hero-btns button, .ts-hero-btns a { width: 100% !important; text-align: center !important; justify-content: center !important; box-sizing: border-box !important; }
          .ts-stats-strip { grid-template-columns: repeat(2, 1fr) !important; padding: 32px 24px !important; gap: 20px !important; }
          .ts-features-section { padding: 60px 24px !important; }
          .ts-features-grid { grid-template-columns: 1fr !important; }
          .ts-path-section { padding: 60px 24px !important; }
          .ts-stages { flex-direction: column !important; align-items: center !important; gap: 28px !important; }
          .ts-stages > div { padding: 0 !important; }
          .ts-score-section { padding: 60px 24px !important; }
          .ts-score-inner { flex-direction: column !important; gap: 36px !important; align-items: flex-start !important; }
          .ts-spider-wrap { width: 100% !important; max-width: 300px !important; }
          .ts-cta-section { padding: 60px 24px !important; }
          .ts-footer { flex-direction: column !important; gap: 12px !important; text-align: center !important; padding: 24px !important; }
        }
      `}</style>
      {/* Ambient bg orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0, overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-20%", left: "-10%",
          width: 700, height: 700, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8,145,178,0.07) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", top: "10%", right: "-15%",
          width: 600, height: 600, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", left: "30%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(34,211,238,0.04) 0%, transparent 70%)",
          filter: "blur(60px)",
        }} />
      </div>

      {/* ── NAVBAR ── */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
          background: "rgba(11,13,19,0.8)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          padding: "0 32px",
          height: 70,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}
      >
        {/* Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TradeSharpLogo size={34} />
          <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaebf0" }}>
            Trade<span style={{ color: "#22d3ee" }}>Sharp</span>
          </span>
        </div>

        {/* Nav links */}
        <div className="ts-nav-links" style={{ alignItems: "center", gap: 32 }}>
          {["Features", "The Path", "Score"].map((link) => (
            <a key={link} href={`#${link.toLowerCase().replace(" ", "-")}`} style={{
              fontSize: 15, fontWeight: 500, color: "#a0a3b5",
              textDecoration: "none", letterSpacing: "0.01em",
              transition: "color 0.2s",
            }}
              onMouseEnter={e => e.target.style.color = "#eaebf0"}
              onMouseLeave={e => e.target.style.color = "#a0a3b5"}
            >{link}</a>
          ))}
        </div>

        {/* CTAs */}
        <div className="ts-nav-signin" style={{ alignItems: "center", gap: 12 }}>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "9px 22px", borderRadius: 7,
              background: "transparent", border: "1px solid rgba(255,255,255,0.14)",
              color: "#a0a3b5", fontSize: 15, fontWeight: 600, cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(34,211,238,0.3)"; e.currentTarget.style.color = "#eaebf0"; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.14)"; e.currentTarget.style.color = "#a0a3b5"; }}
          >Sign In</button>
          <button
            onClick={() => navigate("/login")}
            style={{
              padding: "9px 22px", borderRadius: 7,
              background: "linear-gradient(135deg, #0891b2, #22d3ee)",
              border: "none", color: "#0b0d13", fontSize: 15, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.01em",
              boxShadow: "0 0 20px rgba(34,211,238,0.2)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = "0 0 28px rgba(34,211,238,0.35)"}
            onMouseLeave={e => e.currentTarget.style.boxShadow = "0 0 20px rgba(34,211,238,0.2)"}
          >Start Journaling →</button>
        </div>
      </motion.nav>

      {/* ── HERO ── */}
      <section ref={heroRef} className="ts-hero-section" style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", padding: "104px 48px 56px" }}>
        <motion.div className="ts-hero" style={{ opacity: heroOpacity, y: heroY, width: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>

          {/* Left copy */}
          <div className="ts-hero-copy" style={{ flexShrink: 0 }}>
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "5px 14px", borderRadius: 20,
                background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.2)",
                marginBottom: 24,
              }}
            >
              <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                ⚡ Futures Trader's OS
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              style={{
                fontSize: 44, fontWeight: 800, lineHeight: 1.1,
                letterSpacing: "-0.03em", margin: "0 0 16px",
              }}
            >
              Trade Like a Professional<br />
              <span style={{
                background: "linear-gradient(90deg, #22d3ee, #818cf8)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>Not Like Everyone Else.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              style={{ fontSize: 15.5, lineHeight: 1.65, color: "#a0a3b5", margin: "0 0 28px", fontWeight: 400 }}
            >
              A structured trading journal built to expose your mistakes, refine your edge, and actually improve your P&L.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.45 }}
              className="ts-hero-btns" style={{ display: "flex", gap: 12 }}
            >
              <button
                onClick={() => navigate("/app")}
                style={{
                  padding: "13px 28px", borderRadius: 8,
                  background: "linear-gradient(135deg, #0891b2, #22d3ee)",
                  border: "none", color: "#0b0d13", fontSize: 15, fontWeight: 700,
                  cursor: "pointer", letterSpacing: "0.01em",
                  boxShadow: "0 0 28px rgba(34,211,238,0.25), 0 4px 16px rgba(0,0,0,0.3)",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => e.currentTarget.style.transform = "translateY(-1px)"}
                onMouseLeave={e => e.currentTarget.style.transform = "translateY(0)"}
              >Start Journaling →</button>
              <a href="#features" style={{
                padding: "13px 24px", borderRadius: 8,
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                color: "#a0a3b5", fontSize: 15, fontWeight: 600,
                cursor: "pointer", textDecoration: "none", display: "inline-flex", alignItems: "center",
                transition: "all 0.2s",
              }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)"; e.currentTarget.style.color = "#eaebf0"; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "#a0a3b5"; }}
              >See Features</a>
            </motion.div>

          </div>

          {/* Right — mock dashboard */}
          <motion.div
            className="ts-hero-dash"
            initial={{ opacity: 0, x: 40, scale: 0.97 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            style={{ position: "relative" }}
          >
            <MockDashboard />

            {/* Floating badges */}
            <FloatingBadge style={{ bottom: -18, left: -20 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(52,211,153,0.15)", border: "1px solid rgba(52,211,153,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>🔥</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#34d399" }}>14-Day Streak</div>
                <div style={{ fontSize: 10, color: "#6b6e84", fontWeight: 400 }}>No missed sessions</div>
              </div>
            </FloatingBadge>

            <FloatingBadge style={{ top: -14, right: -20 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(34,211,238,0.15)", border: "1px solid rgba(34,211,238,0.3)",
                display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
              }}>📊</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#22d3ee" }}>Score: 74 — Solid</div>
                <div style={{ fontSize: 10, color: "#6b6e84", fontWeight: 400 }}>TradeSharp Score</div>
              </div>
            </FloatingBadge>
          </motion.div>
        </motion.div>
      </section>

      {/* ── STATS STRIP ── */}
      <FadeInSection>
        <div className="ts-stats-strip" style={{
          position: "relative", zIndex: 1,
          borderTop: "1px solid rgba(255,255,255,0.06)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
          background: "rgba(255,255,255,0.02)",
          display: "grid",
          gap: 24,
        }}>
          {[
            { value: "5", label: "Quest Stages", sub: "Foundation → Independent" },
            { value: "26", label: "Achievements", sub: "XP across 4 types" },
            { value: "10", label: "A+ Criteria", sub: "Per-trade checklist" },
            { value: "7", label: "Score Pillars", sub: "Monthly performance" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{
                fontSize: 42, fontWeight: 800, letterSpacing: "-0.04em",
                background: "linear-gradient(135deg, #eaebf0, #a0a3b5)",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                lineHeight: 1,
              }}>{s.value}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "#eaebf0", marginTop: 6 }}>{s.label}</div>
              <div style={{ fontSize: 11.5, color: "#6b6e84", marginTop: 3 }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </FadeInSection>

      {/* ── FEATURES ── */}
      <section id="features" className="ts-features-section" style={{ position: "relative", zIndex: 1 }}>
        <FadeInSection style={{ textAlign: "center", marginBottom: 56 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 20,
            background: "rgba(34,211,238,0.08)", border: "1px solid rgba(34,211,238,0.18)",
            marginBottom: 18,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#22d3ee", letterSpacing: "0.08em", textTransform: "uppercase" }}>Features</span>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
            Every tool a serious trader needs
          </h2>
          <p style={{ fontSize: 16, color: "#a0a3b5", maxWidth: 520, margin: "0 auto" }}>
            One app to run your entire trading operation — from planning to execution to review.
          </p>
        </FadeInSection>

        <div className="ts-features-grid" style={{
          display: "grid", gridAutoRows: "1fr",
          gap: 16, maxWidth: 1100, margin: "0 auto",
        }}>
          {FEATURES.map((f, i) => (
            <FadeInSection key={i} delay={i * 0.07} style={{ height: "100%", display: "flex" }}>
              <div style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: 12, padding: "24px 22px",
                transition: "all 0.25s",
                cursor: "default",
                height: "100%",
                display: "flex", flexDirection: "column",
                boxSizing: "border-box",
              }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.05)";
                  e.currentTarget.style.borderColor = `${f.accent}30`;
                  e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px ${f.accent}20`;
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(255,255,255,0.03)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)";
                  e.currentTarget.style.boxShadow = "none";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, marginBottom: 16, flexShrink: 0,
                  background: `${f.accent}15`, border: `1px solid ${f.accent}25`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20,
                }}>{f.icon}</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#eaebf0", marginBottom: 8 }}>{f.title}</div>
                <div style={{ fontSize: 13.5, color: "#6b6e84", lineHeight: 1.6, flex: 1 }}>{f.desc}</div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── THE PATH ── */}
      <section id="the-path" className="ts-path-section" style={{ position: "relative", zIndex: 1, background: "rgba(255,255,255,0.015)" }}>
        <FadeInSection style={{ textAlign: "center", marginBottom: 60 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "4px 14px", borderRadius: 20,
            background: "rgba(167,139,250,0.08)", border: "1px solid rgba(167,139,250,0.2)",
            marginBottom: 18,
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#a78bfa", letterSpacing: "0.08em", textTransform: "uppercase" }}>The Path</span>
          </div>
          <h2 style={{ fontSize: 38, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 14px" }}>
            Five stages. One destination.
          </h2>
          <p style={{ fontSize: 16, color: "#a0a3b5", maxWidth: 480, margin: "0 auto" }}>
            Map your entire career progression from first principles to full-time independence.
          </p>
        </FadeInSection>

        <div className="ts-stages" style={{
          display: "flex", alignItems: "stretch", justifyContent: "center",
          gap: 0, maxWidth: 1000, margin: "0 auto", position: "relative",
        }}>
          {/* Connector line */}
          <div style={{
            position: "absolute", top: 36, left: "10%", right: "10%", height: 1,
            background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.08) 20%, rgba(255,255,255,0.08) 80%, transparent)",
          }} />

          {STAGES.map((stage, i) => (
            <FadeInSection key={stage.id} delay={i * 0.1} style={{ flex: 1, padding: "0 8px" }}>
              <div style={{ textAlign: "center" }}>
                {/* Icon circle */}
                <div style={{
                  width: 64, height: 64, borderRadius: "50%",
                  background: `rgba(${hexToRgb(stage.color)},0.1)`,
                  border: `2px solid ${stage.color}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 26, margin: "0 auto 14px",
                  boxShadow: `0 0 20px ${stage.color}20`,
                  position: "relative", zIndex: 1,
                }}>{stage.icon}</div>

                <div style={{
                  display: "inline-block", padding: "2px 10px", borderRadius: 4,
                  background: `${stage.color}15`, border: `1px solid ${stage.color}30`,
                  fontSize: 10, fontWeight: 700, color: stage.color,
                  letterSpacing: "0.06em", marginBottom: 8,
                  textTransform: "uppercase",
                }}>Stage {stage.id}</div>

                <div style={{ fontSize: 13, fontWeight: 700, color: "#eaebf0", marginBottom: 4 }}>{stage.name}</div>
                <div style={{ fontSize: 11.5, color: "#6b6e84", marginBottom: 6 }}>{stage.subtitle}</div>
                <div style={{ fontSize: 11, color: "#a78bfa", fontWeight: 600 }}>{stage.xp}</div>
              </div>
            </FadeInSection>
          ))}
        </div>
      </section>

      {/* ── SCORE SECTION ── */}
      <section id="score" className="ts-score-section" style={{ position: "relative", zIndex: 1 }}>
        <div className="ts-score-inner" style={{ maxWidth: 1000, margin: "0 auto", display: "flex", alignItems: "center" }}>
          <FadeInSection style={{ flex: 1 }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "4px 14px", borderRadius: 20,
              background: "rgba(251,191,36,0.08)", border: "1px solid rgba(251,191,36,0.2)",
              marginBottom: 18,
            }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: "#fbbf24", letterSpacing: "0.08em", textTransform: "uppercase" }}>TradeSharp Score</span>
            </div>
            <h2 style={{ fontSize: 36, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 16px" }}>
              Know exactly where you stand. Every month.
            </h2>
            <p style={{ fontSize: 16, color: "#a0a3b5", lineHeight: 1.65, marginBottom: 28 }}>
              Seven performance pillars — Win Rate, Profit Factor, Consistency, A+ Discipline, Win/Loss Size Ratio, Drawdown Recovery — scored into a single composite grade with a spider chart breakdown.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[
                { label: "Elite", range: "≥ 80", color: "#22d3ee" },
                { label: "Solid", range: "≥ 60", color: "#34d399" },
                { label: "Developing", range: "≥ 40", color: "#f59e0b" },
                { label: "Needs Work", range: "< 40", color: "#fb7185" },
              ].map((tier, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{
                    width: 10, height: 10, borderRadius: "50%",
                    background: tier.color, boxShadow: `0 0 8px ${tier.color}60`,
                  }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: tier.color, width: 90 }}>{tier.label}</span>
                  <span style={{ fontSize: 13, color: "#6b6e84" }}>Score {tier.range}</span>
                </div>
              ))}
            </div>
          </FadeInSection>

          {/* Spider chart placeholder */}
          <FadeInSection delay={0.2} style={{ flexShrink: 0 }}>
            <div className="ts-spider-wrap" style={{
              width: 300, height: 300,
              background: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative", overflow: "hidden",
            }}>
              <SpiderChartMock />
            </div>
          </FadeInSection>
        </div>
      </section>

      {/* ── CTA ── */}
      <FadeInSection>
        <section className="ts-cta-section" style={{
          position: "relative", zIndex: 1,
          background: "rgba(255,255,255,0.015)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          textAlign: "center",
        }}>
          {/* Glow */}
          <div style={{
            position: "absolute", top: "50%", left: "50%",
            transform: "translate(-50%, -50%)",
            width: 400, height: 200,
            background: "radial-gradient(ellipse, rgba(34,211,238,0.08) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />
          <h2 style={{
            fontSize: 44, fontWeight: 800, letterSpacing: "-0.03em",
            margin: "0 0 16px", position: "relative",
          }}>
            Ready to sharpen your edge?
          </h2>
          <p style={{ fontSize: 17, color: "#a0a3b5", maxWidth: 440, margin: "0 auto 36px", position: "relative" }}>
            Join the path from breakeven to full independence. Track every trade, every quest, every milestone.
          </p>
          <button
            onClick={() => navigate("/app")}
            style={{
              padding: "15px 36px", borderRadius: 8,
              background: "linear-gradient(135deg, #0891b2, #22d3ee)",
              border: "none", color: "#0b0d13", fontSize: 16, fontWeight: 700,
              cursor: "pointer", letterSpacing: "0.01em", position: "relative",
              boxShadow: "0 0 40px rgba(34,211,238,0.3), 0 4px 20px rgba(0,0,0,0.4)",
              transition: "all 0.2s",
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 0 56px rgba(34,211,238,0.4), 0 8px 24px rgba(0,0,0,0.5)"; }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 0 40px rgba(34,211,238,0.3), 0 4px 20px rgba(0,0,0,0.4)"; }}
          >Start Journaling →</button>
          <p style={{ fontSize: 12, color: "#6b6e84", marginTop: 14, position: "relative" }}>
            Free. No credit card required.
          </p>
        </section>
      </FadeInSection>

      {/* ── FOOTER ── */}
      <footer className="ts-footer" style={{
        position: "relative", zIndex: 1,
        borderTop: "1px solid rgba(255,255,255,0.06)",
        padding: "32px 48px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <TradeSharpLogo size={28} />
          <span style={{ fontSize: 16, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaebf0" }}>
            Trade<span style={{ color: "#22d3ee" }}>Sharp</span>
          </span>
        </div>
        <p style={{ fontSize: 14, color: "#6b6e84", margin: 0 }}>
          © {new Date().getFullYear()} TradeSharp. Sharpen your edge. Track your path.
        </p>
        <div style={{ display: "flex", gap: 24 }}>
          <Link to="/privacy" style={{ fontSize: 13, color: "#6b6e84", textDecoration: "none" }}
            onMouseEnter={e => e.target.style.color = "#22d3ee"}
            onMouseLeave={e => e.target.style.color = "#6b6e84"}
          >Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: 13, color: "#6b6e84", textDecoration: "none" }}
            onMouseEnter={e => e.target.style.color = "#22d3ee"}
            onMouseLeave={e => e.target.style.color = "#6b6e84"}
          >Terms & Conditions</Link>
        </div>
      </footer>
    </div>
  );
}

// ─── SPIDER CHART MOCK ────────────────────────────────────────────────────────

function SpiderChartMock() {
  const cx = 150, cy = 150, r = 100;
  const pillars = ["Win Rate", "Profit Factor", "Consistency", "A+ Discipline", "W/L Ratio", "Recovery", "Drawdown"];
  const scores = [0.78, 0.82, 0.65, 0.90, 0.72, 0.68, 0.74];
  const n = pillars.length;

  const getPoint = (angle, radius) => ({
    x: cx + radius * Math.cos(angle - Math.PI / 2),
    y: cy + radius * Math.sin(angle - Math.PI / 2),
  });

  const rings = [0.25, 0.5, 0.75, 1.0];
  const dataPoints = scores.map((s, i) => getPoint((2 * Math.PI * i) / n, s * r));
  const dataPath = dataPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ") + " Z";

  const labelPoints = pillars.map((_, i) => getPoint((2 * Math.PI * i) / n, r + 22));
  const axisPoints = pillars.map((_, i) => getPoint((2 * Math.PI * i) / n, r));

  return (
    <svg viewBox="0 0 300 300" style={{ width: 280, height: 280 }}>
      {/* Rings */}
      {rings.map((ring, i) => {
        const pts = pillars.map((_, j) => {
          const p = getPoint((2 * Math.PI * j) / n, ring * r);
          return `${j === 0 ? "M" : "L"} ${p.x},${p.y}`;
        }).join(" ") + " Z";
        return <path key={i} d={pts} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={1} />;
      })}
      {/* Axes */}
      {axisPoints.map((p, i) => (
        <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(255,255,255,0.07)" strokeWidth={1} />
      ))}
      {/* Data fill */}
      <path d={dataPath} fill="rgba(34,211,238,0.1)" stroke="#22d3ee" strokeWidth={1.5} />
      {/* Data dots */}
      {dataPoints.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={4} fill="#22d3ee" style={{ filter: "drop-shadow(0 0 4px #22d3ee)" }} />
      ))}
      {/* Labels */}
      {labelPoints.map((p, i) => (
        <text key={i} x={p.x} y={p.y + 4} textAnchor="middle"
          style={{ fontSize: 9, fill: "rgba(160,163,181,0.9)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
          {pillars[i]}
        </text>
      ))}
      {/* Score badge */}
      <rect x={cx - 26} y={cy - 16} width={52} height={32} rx={6}
        fill="rgba(11,13,19,0.9)" stroke="rgba(34,211,238,0.3)" strokeWidth={1} />
      <text x={cx} y={cy + 3} textAnchor="middle"
        style={{ fontSize: 16, fill: "#22d3ee", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800 }}>
        74
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle"
        style={{ fontSize: 7.5, fill: "#34d399", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, letterSpacing: "0.05em" }}>
        SOLID
      </text>
    </svg>
  );
}

// ─── UTIL ─────────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r},${g},${b}`;
}

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./src/supabase.js";
import { ChecklistView, JournalView, TradeStatsView, TradingStatsView, AccountsView, DashboardView, WatchlistView, EducationView, NotebookView, PageBanner, QuickLogModal } from "./src/trading.jsx";

// ─── THEME ──────────────────────────────────────────────────────────────────

const LIGHT_THEME = {
  "--bg-primary": "#f8f9fc",
  "--bg-secondary": "#ffffff",
  "--bg-tertiary": "#f0f1f6",
  "--bg-input": "#f0f1f6",
  "--border-primary": "#dddfe8",
  "--border-secondary": "#e8eaf0",
  "--border-glow": "#d0d2dc",
  "--border-glow-shadow": "none",
  "--text-primary": "#0f1029",
  "--text-secondary": "#4a4c6a",
  "--text-tertiary": "#9496ae",
  "--text-accent": "#0891b2",
  "--accent": "#0891b2",
  "--accent-dim": "rgba(8,145,178,0.10)",
  "--accent-glow": "rgba(8,145,178,0.05)",
  "--accent-glow-strong": "rgba(8,145,178,0.12)",
  "--accent-secondary": "#6366f1",
  "--card-shadow": "0 1px 3px rgba(0,0,0,0.04)",
  "--card-glow": "0 1px 3px rgba(0,0,0,0.04)",
  "--glass-blur": "none",
  "--bg-glass": "#ffffff",
  "--bg-glass-hover": "#f5f6fa",
  "--green": "#059669",
  "--red": "#e11d48",
  "--gold": "#d97706",
  "--purple": "#7c3aed",
  "--hud-grid": "rgba(0,0,0,0.015)",
};

const DARK_THEME = {
  "--bg-primary": "#0b0d13",
  "--bg-secondary": "rgba(255,255,255,0.04)",
  "--bg-tertiary": "rgba(255,255,255,0.06)",
  "--bg-input": "rgba(255,255,255,0.05)",
  "--bg-glass": "rgba(255,255,255,0.04)",
  "--bg-glass-hover": "rgba(255,255,255,0.07)",
  "--border-primary": "rgba(255,255,255,0.08)",
  "--border-secondary": "rgba(255,255,255,0.05)",
  "--border-glow": "rgba(255,255,255,0.12)",
  "--border-glow-shadow": "0 0 12px rgba(34,211,238,0.06)",
  "--text-primary": "#eaebf0",
  "--text-secondary": "#a0a3b5",
  "--text-tertiary": "#6b6e84",
  "--text-accent": "#22d3ee",
  "--accent": "#22d3ee",
  "--accent-dim": "rgba(34,211,238,0.12)",
  "--accent-glow": "rgba(34,211,238,0.06)",
  "--accent-glow-strong": "rgba(34,211,238,0.18)",
  "--accent-secondary": "#818cf8",
  "--card-shadow": "0 2px 16px rgba(0,0,0,0.25)",
  "--card-glow": "0 2px 20px rgba(0,0,0,0.2)",
  "--glass-blur": "blur(20px)",
  "--green": "#34d399",
  "--red": "#fb7185",
  "--gold": "#fbbf24",
  "--purple": "#a78bfa",
  "--hud-grid": "rgba(255,255,255,0.015)",
};

// ─── DATA ────────────────────────────────────────────────────────────────────

const LEVELS = [
  {
    id: 1,
    name: "Foundation",
    subtitle: "Build the Process",
    icon: "📐",
    tier: "STAGE 1",
    accent: "#56b886",
    accentLight: "#d0f5e0",
    bg: "linear-gradient(135deg, #e8fdf1 0%, #d0f5e0 100%)",
    cardBg: "#f0faf5",
    xpRequired: 0,
    description: "Define the model, build the habits, and develop the discipline to execute.",
    achievements: [
      { id: "a1", name: "Model Defined", desc: "Document your trading model and rules in writing", xp: 50, type: "process" },
      { id: "a2", name: "10-Day Journal Streak", desc: "Journal every session for 10 consecutive days", xp: 75, type: "process" },
      { id: "a3", name: "Session Discipline", desc: "Trade NY session only for 2 full weeks", xp: 100, type: "discipline" },
      { id: "a4", name: "Pre-Trade Process", desc: "Complete pre-trade checklist on 20 consecutive trades", xp: 100, type: "process" },
      { id: "a5", name: "A+ Criteria Locked", desc: "Define and commit your A+ trade criteria to paper", xp: 50, type: "process" },
    ],
  },
  {
    id: 2,
    name: "Evaluation",
    subtitle: "Pass Evals & Get Funded",
    icon: "📊",
    tier: "STAGE 2",
    accent: "#e8a838",
    accentLight: "#fdf0d0",
    bg: "linear-gradient(135deg, #fdf5e6 0%, #fce8c3 100%)",
    cardBg: "#fdf8f0",
    xpRequired: 375,
    description: "Prove the edge under evaluation pressure. Get funded and receive your first payout.",
    achievements: [
      { id: "b1", name: "Evaluation Passed", desc: "Pass your first prop firm evaluation", xp: 150, type: "milestone" },
      { id: "b2", name: "A+ Only Week", desc: "Take only A+ setups for a full trading week", xp: 100, type: "discipline" },
      { id: "b3", name: "2-Trade Discipline", desc: "Respect 2-trade daily max for 10 consecutive sessions", xp: 100, type: "discipline" },
      { id: "b4", name: "First Payout", desc: "Receive your first funded account payout", xp: 200, type: "payout", amount: "1st Payout" },
      { id: "b5", name: "No Revenge Trading", desc: "Walk away after a loss — 10 times without revenge trading", xp: 100, type: "discipline" },
      { id: "b6", name: "Execution Trust", desc: "Hold to take-profit without moving stop — 5 times", xp: 125, type: "discipline" },
    ],
  },
  {
    id: 3,
    name: "Funded",
    subtitle: "Consistent Payouts",
    icon: "📈",
    tier: "STAGE 3",
    accent: "#4a8fe7",
    accentLight: "#d0e4fd",
    bg: "linear-gradient(135deg, #e6f0fd 0%, #c8ddfa 100%)",
    cardBg: "#f0f6fd",
    xpRequired: 1150,
    description: "Multiple accounts running. Consistent payouts proving the edge is repeatable.",
    achievements: [
      { id: "c1", name: "3 Active Accounts", desc: "Manage 3+ funded accounts simultaneously", xp: 150, type: "milestone" },
      { id: "c2", name: "Payout Consistency", desc: "Receive payouts 3 consecutive cycles", xp: 200, type: "payout" },
      { id: "c3", name: "$1K Month", desc: "Monthly payouts exceed $1,000", xp: 150, type: "payout", amount: "$1K/mo" },
      { id: "c4", name: "$5K Lifetime", desc: "Lifetime payouts reach $5,000", xp: 200, type: "payout", amount: "$5K" },
      { id: "c5", name: "5 Active Accounts", desc: "Manage 5+ funded accounts simultaneously", xp: 175, type: "milestone" },
      { id: "c6", name: "$5K Month", desc: "Monthly payouts exceed $5,000", xp: 250, type: "payout", amount: "$5K/mo" },
    ],
  },
  {
    id: 4,
    name: "Scaling",
    subtitle: "Personal Capital Online",
    icon: "🏦",
    tier: "STAGE 4",
    accent: "#9b6fe0",
    accentLight: "#ead8fd",
    bg: "linear-gradient(135deg, #f3ecfd 0%, #e2d4f8 100%)",
    cardBg: "#f8f4fd",
    xpRequired: 2275,
    description: "Funded payouts fuel personal accounts. Building real capital from proven results.",
    achievements: [
      { id: "d1", name: "Personal Account Funded", desc: "Seed personal account from payouts ($2,500+)", xp: 200, type: "payout", amount: "$2.5K seed" },
      { id: "d2", name: "$10K Month", desc: "Combined income hits $10K/month", xp: 300, type: "payout", amount: "$10K/mo" },
      { id: "d3", name: "3-Month Personal Streak", desc: "Personal account profitable 3 consecutive months", xp: 250, type: "milestone" },
      { id: "d4", name: "$25K Lifetime", desc: "Lifetime trading income reaches $25K", xp: 250, type: "payout", amount: "$25K" },
      { id: "d5", name: "$20K Month", desc: "Combined monthly income hits $20K", xp: 300, type: "payout", amount: "$20K/mo" },
    ],
  },
  {
    id: 5,
    name: "Independent",
    subtitle: "Full-Time Trader",
    icon: "💼",
    tier: "STAGE 5",
    accent: "#e05a6d",
    accentLight: "#fdd8dd",
    bg: "linear-gradient(135deg, #fde8ec 0%, #f8cdd4 100%)",
    cardBg: "#fdf2f4",
    xpRequired: 3575,
    description: "Personal capital is primary. Trading is the career. Full financial independence.",
    achievements: [
      { id: "e1", name: "$100K Portfolio", desc: "Personal trading account reaches $100K+", xp: 400, type: "milestone", amount: "$100K" },
      { id: "e2", name: "$25K Month", desc: "Monthly income exceeds $25,000", xp: 350, type: "payout", amount: "$25K/mo" },
      { id: "e3", name: "12-Month Consistency", desc: "12 consecutive profitable months", xp: 400, type: "milestone" },
      { id: "e4", name: "Financially Independent", desc: "Trading fully replaces all other income", xp: 500, type: "milestone" },
    ],
  },
];

const ALL_ACH = LEVELS.flatMap((l) => l.achievements.map((a) => ({ ...a, levelId: l.id, levelName: l.name, levelAccent: l.accent })));
const TOTAL_XP = ALL_ACH.reduce((s, a) => s + a.xp, 0);

const TYPE_META = {
  process: { icon: "📋", label: "Process", color: "#4a8fe7" },
  discipline: { icon: "🎯", label: "Discipline", color: "#e8a838" },
  milestone: { icon: "⭐", label: "Milestone", color: "#9b6fe0" },
  payout: { icon: "💰", label: "Payout", color: "#56b886" },
};

// ─── COMPONENTS ──────────────────────────────────────────────────────────────

function ProgressRing({ pct, size = 52, stroke = 5, color = "#4a8fe7", children }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border-primary)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 0.8s cubic-bezier(.4,0,.2,1)" }}
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        {children}
      </div>
    </div>
  );
}

function XPBar({ current, max, color = "#4a8fe7", height = 10 }) {
  const pct = max > 0 ? Math.min((current / max) * 100, 100) : 0;
  return (
    <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height, overflow: "hidden", position: "relative", border: "1px solid var(--border-primary)" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          borderRadius: 4,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          position: "relative",
          boxShadow: pct > 0 ? `0 0 8px ${color}60` : "none",
        }}
      />
    </div>
  );
}

function Card({ children, style = {}, onClick, hoverable = false, className = "" }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      className={className}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "var(--bg-secondary)",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
        borderRadius: 10,
        border: "1px solid var(--border-primary)",
        boxShadow: hovered && hoverable
          ? "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px var(--border-glow)"
          : "var(--card-shadow)",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        transform: hovered && hoverable ? "translateY(-2px)" : "none",
        cursor: onClick ? "pointer" : "default",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function Chip({ label, color, icon }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        color: color,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        padding: "2px 8px",
        borderRadius: 4,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {label}
    </span>
  );
}

function LevelMapCard({ level, isActive, isCurrent, allDone, isPast, done, total, pct, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => isActive && setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        flex: 1,
        padding: "16px 18px",
        paddingLeft: 15,
        borderRadius: 8,
        background: isCurrent
          ? `${level.accent}10`
          : hov
          ? "var(--bg-tertiary)"
          : isActive
          ? "var(--bg-secondary)"
          : "var(--bg-tertiary)",
        border: isCurrent
          ? `1px solid ${level.accent}50`
          : allDone
          ? `1px solid ${level.accent}40`
          : `1px solid var(--border-primary)`,
        borderLeft: isCurrent
          ? `3px solid ${level.accent}`
          : allDone
          ? `3px solid ${level.accent}60`
          : "3px solid transparent",
        cursor: isActive ? "pointer" : "default",
        opacity: isActive ? 1 : 0.5,
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        transform: hov && isActive ? "translateY(-1px)" : "none",
        boxShadow: isCurrent
          ? `0 0 24px ${level.accent}18, var(--card-shadow)`
          : hov
          ? "0 4px 20px rgba(0,0,0,0.12)"
          : "var(--card-shadow)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <ProgressRing pct={pct} size={48} stroke={4} color={level.accent}>
          <span style={{ fontSize: 20 }}>{allDone ? "⭐" : level.icon}</span>
        </ProgressRing>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: isActive ? "var(--text-primary)" : "var(--text-tertiary)" }}>
              {level.name}
            </span>
            <Chip label={level.tier} color={level.accent} />
            {isCurrent && <Chip label="YOU ARE HERE" color={level.accent} />}
          </div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 7 }}>{level.subtitle}</div>
          <XPBar current={done} max={total} color={level.accent} height={5} />
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, textAlign: "right" }}>
            {done}/{total} quests · {pct}%
          </div>
        </div>
        {isActive && (
          <div style={{
            fontSize: 14, color: hov ? level.accent : "var(--text-tertiary)",
            flexShrink: 0, transition: "all 0.2s",
            transform: hov ? "translateX(2px)" : "none",
          }}>›</div>
        )}
      </div>
    </div>
  );
}

function LevelNode({ level, completedIds, isActive, isCurrent, onClick, index }) {
  const done = level.achievements.filter((a) => completedIds.has(a.id)).length;
  const total = level.achievements.length;
  const allDone = done === total;
  const pct = Math.round((done / total) * 100);

  return (
    <div
      onClick={isActive ? onClick : undefined}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 20,
        padding: "18px 20px",
        borderRadius: 6,
        background: isCurrent ? level.bg : isActive ? "var(--bg-secondary)" : "var(--bg-tertiary)",
        border: isCurrent ? `2px solid ${level.accent}` : allDone ? `2px solid ${level.accent}66` : "2px solid transparent",
        cursor: isActive ? "pointer" : "default",
        opacity: isActive ? 1 : 0.45,
        transition: "all 0.3s",
        position: "relative",
        animation: `fadeSlideIn 0.4s ease ${index * 0.08}s both`,
      }}
    >
      <ProgressRing pct={pct} size={56} stroke={5} color={level.accent}>
        <span style={{ fontSize: 24 }}>{allDone ? "⭐" : level.icon}</span>
      </ProgressRing>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: isActive ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            {level.name}
          </span>
          <Chip label={level.tier} color={level.accent} />
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
          {level.subtitle}
        </div>
        <XPBar current={done} max={total} color={level.accent} height={8} />
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginTop: 5, textAlign: "right" }}>
          {done}/{total} quests · {pct}%
        </div>
      </div>

      {isActive && (
        <div style={{ fontSize: 18, color: "var(--text-tertiary)", flexShrink: 0 }}>›</div>
      )}
    </div>
  );
}

function AchievementRow({ ach, completed, proof, onToggle, delay = 0 }) {
  const meta = TYPE_META[ach.type];
  const [hov, setHov] = useState(false);
  return (
    <div
      onClick={onToggle}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        paddingLeft: 13,
        borderRadius: 8,
        background: completed ? `${meta.color}08` : hov ? "var(--bg-tertiary)" : "var(--bg-secondary)",
        border: `1px solid ${completed ? `${meta.color}30` : "var(--border-primary)"}`,
        borderLeft: `3px solid ${completed ? meta.color : hov ? "var(--border-glow)" : "transparent"}`,
        cursor: "pointer",
        transition: "all 0.2s cubic-bezier(.4,0,.2,1)",
        transform: hov ? "translateY(-1px)" : "none",
        boxShadow: hov ? "0 4px 16px rgba(0,0,0,0.12)" : "none",
        animation: `fadeSlideIn 0.35s ease ${delay}s both`,
      }}
    >
      {/* Check circle */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: "50%",
          border: `2px solid ${completed ? meta.color : "var(--border-primary)"}`,
          background: completed ? meta.color : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.25s",
          boxShadow: completed ? `0 0 10px ${meta.color}50` : "none",
        }}
      >
        {completed && <span style={{ color: "#fff", fontSize: 13, lineHeight: 1, fontWeight: 700 }}>✓</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
              fontSize: 14,
              color: completed ? meta.color : "var(--text-primary)",
            }}
          >
            {ach.name}
          </span>
          <Chip label={meta.label} color={meta.color} icon={meta.icon} />
          {ach.amount && <Chip label={ach.amount} color="var(--gold)" icon="💰" />}
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
          {ach.desc}
        </div>
        {completed && proof && (
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 6, fontStyle: "italic" }}>
            "{proof.note.length > 60 ? proof.note.slice(0, 60) + "..." : proof.note}"
            {" · "}
            <span style={{ color: "var(--accent-secondary)", fontStyle: "normal" }}>view proof</span>
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700,
          fontSize: 12,
          color: completed ? meta.color : "var(--gold)",
          flexShrink: 0,
          background: completed ? `${meta.color}15` : "rgba(251,191,36,0.1)",
          border: `1px solid ${completed ? `${meta.color}35` : "rgba(251,191,36,0.25)"}`,
          padding: "4px 10px",
          borderRadius: 20,
          whiteSpace: "nowrap",
          letterSpacing: "0.02em",
        }}
      >
        {completed ? "✓ " : "+"}
        {ach.xp} XP
      </div>
    </div>
  );
}

// ─── JOURNAL + CHECKLIST COMBINED ────────────────────────────────────────────

function JournalWithChecklist({ supabase, user, loadTrades, syncToSheets, gsUrl, setGsUrl, privacyMode }) {
  const [checklistOpen, setChecklistOpen] = useState(() => {
    const stored = sessionStorage.getItem("checklistOpen");
    return stored === null ? true : stored === "true";
  });
  const toggleChecklist = (val) => {
    setChecklistOpen(val);
    sessionStorage.setItem("checklistOpen", val);
  };
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Collapsible Checklist */}
      <div style={{ marginBottom: 20 }}>
        <button
          onClick={() => toggleChecklist(!checklistOpen)}
          style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            width: "100%", padding: "12px 18px", marginBottom: checklistOpen ? 12 : 0,
            background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
            borderRadius: checklistOpen ? "8px 8px 0 0" : 8,
            cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11, fontWeight: 700, color: "var(--accent)",
            textTransform: "uppercase", letterSpacing: "0.12em",
            backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
          }}
        >
          <span>☑ A+ Checklist</span>
          <span style={{ fontSize: 14, color: "var(--text-tertiary)", transition: "transform 0.2s", display: "inline-block", transform: checklistOpen ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
        </button>
        {checklistOpen && (
          <div style={{ border: "1px solid var(--border-primary)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
            <ChecklistView supabase={supabase} user={user} embedded />
          </div>
        )}
      </div>
      {/* Journal */}
      <JournalView supabase={supabase} user={user} loadTrades={loadTrades} syncToSheets={syncToSheets} gsUrl={gsUrl} setGsUrl={setGsUrl} privacyMode={privacyMode} />
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function TraderRoadmapXP() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authMode, setAuthMode] = useState("login"); // "login" or "signup"

  // Mobile menu
  const [mobileMenu, setMobileMenu] = useState(false);

  // NYSE Clock
  const [nyClock, setNyClock] = useState(() => new Date());
  const bellPlayedRef = useRef(null); // tracks which date's bell already rang
  useEffect(() => {
    const id = setInterval(() => setNyClock(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const nyOpts = { timeZone: "America/New_York" };
  const nyTime = nyClock.toLocaleTimeString("en-US", { ...nyOpts, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });
  const nyDate = nyClock.toLocaleDateString("en-US", { ...nyOpts, weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const nyHour = parseInt(nyClock.toLocaleTimeString("en-US", { ...nyOpts, hour: "numeric", hour12: false }));
  const nyMin = parseInt(nyClock.toLocaleTimeString("en-US", { ...nyOpts, minute: "numeric" }));
  const nySec = parseInt(nyClock.toLocaleTimeString("en-US", { ...nyOpts, second: "numeric" }));
  const nyTotalMin = nyHour * 60 + nyMin;
  const nyDay = nyClock.toLocaleDateString("en-US", { ...nyOpts, weekday: "long" });
  const isWeekday = nyDay !== "Saturday" && nyDay !== "Sunday";
  const isMarketOpen = isWeekday && nyTotalMin >= 570 && nyTotalMin < 960; // 9:30 AM - 4:00 PM ET
  const isPreMarket = isWeekday && nyTotalMin >= 240 && nyTotalMin < 570; // 4:00 AM - 9:30 AM ET

  // NYSE Opening Bell chime at 9:30 AM ET
  useEffect(() => {
    if (!isWeekday) return;
    const dateKey = nyClock.toLocaleDateString("en-US", nyOpts);
    if (nyHour === 9 && nyMin === 30 && nySec < 3 && bellPlayedRef.current !== dateKey) {
      bellPlayedRef.current = dateKey;
      try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const playTone = (freq, startTime, duration, vol) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = "sine";
          osc.frequency.setValueAtTime(freq, ctx.currentTime);
          gain.gain.setValueAtTime(0, ctx.currentTime + startTime);
          gain.gain.linearRampToValueAtTime(vol, ctx.currentTime + startTime + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startTime + duration);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start(ctx.currentTime + startTime);
          osc.stop(ctx.currentTime + startTime + duration);
        };
        // Three-tone NYSE-style bell chime
        playTone(830, 0, 1.8, 0.15);    // high bell
        playTone(1245, 0, 1.4, 0.08);   // harmonic shimmer
        playTone(622, 0.05, 2.0, 0.12); // lower resonance
        playTone(830, 0.6, 1.5, 0.10);  // second strike
        playTone(1245, 0.6, 1.2, 0.06);
        playTone(622, 0.65, 1.8, 0.08);
        playTone(830, 1.2, 2.0, 0.08);  // third strike (softer)
        playTone(1245, 1.2, 1.6, 0.04);
        setTimeout(() => ctx.close(), 4000);
      } catch (e) { /* AudioContext not available */ }
    }
  }, [nyClock]);

  // Privacy mode
  const [privacyMode, setPrivacyMode] = useState(() => { try { return localStorage.getItem("privacyMode") === "true"; } catch { return false; } });
  useEffect(() => { try { localStorage.setItem("privacyMode", privacyMode); } catch {} }, [privacyMode]);

  // Dark mode
  const [dark, setDark] = useState(() => { try { const t = localStorage.getItem("theme"); return t === "light" ? false : true; } catch { return true; } });

  useEffect(() => {
    const root = document.documentElement;
    const vars = dark ? DARK_THEME : LIGHT_THEME;
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    try { localStorage.setItem("theme", dark ? "dark" : "light"); } catch {}
  }, [dark]);

  // completed is a Map: quest_id -> { note, link, completedAt }
  const [completed, setCompleted] = useState(new Map());
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [view, setView] = useState("map");
  const [confirm, setConfirm] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [viewingProof, setViewingProof] = useState(null);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ display_name: "", avatar_url: "" });
  const [showProfileEditor, setShowProfileEditor] = useState(false);
  const [showTilt, setShowTilt] = useState(false);
  const [showQuickLog, setShowQuickLog] = useState(false);
  const [showFocus, setShowFocus] = useState(false);
  const [focusSecs, setFocusSecs] = useState(180);
  const focusTimerRef = useRef(null);

  // Focus Mode timer — must be after showFocus/focusSecs/focusTimerRef declarations
  useEffect(() => {
    if (showFocus && focusSecs > 0) {
      focusTimerRef.current = setInterval(() => setFocusSecs(s => s - 1), 1000);
    } else {
      clearInterval(focusTimerRef.current);
    }
    return () => clearInterval(focusTimerRef.current);
  }, [showFocus]);

  const [editName, setEditName] = useState("");
  const [editGsUrl, setEditGsUrl] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const avatarInputRef = useRef(null);

  // Trading app state
  const [trades, setTrades] = useState([]);
  const [gsUrl, setGsUrl] = useState(() => { try { return localStorage.getItem("gsUrl") || ""; } catch { return ""; } });
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem("aiApiKey") || ""; } catch { return ""; } });

  const syncToSheets = useCallback(async (data) => {
    const url = gsUrl || (() => { try { return localStorage.getItem("gsUrl") || ""; } catch { return ""; } })();
    if (!url) return;
    try {
      await fetch(url, { method: "POST", body: JSON.stringify(data), mode: "no-cors" });
    } catch (e) {
      console.error("[Sheets] Sync error:", e.message);
    }
  }, [gsUrl]);

  // Auth listener
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Load completions from Supabase when user logs in
  const loadCompletions = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("quest_completions")
      .select("quest_id, note, link, completed_at")
      .eq("user_id", user.id);
    if (!error && data) {
      const map = new Map();
      data.forEach((row) => {
        map.set(row.quest_id, {
          note: row.note,
          link: row.link || "",
          completedAt: row.completed_at,
        });
      });
      setCompleted(map);
    }
  }, [user]);

  useEffect(() => { loadCompletions(); }, [loadCompletions]);

  // Load profile
  const loadProfile = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("profiles").select("display_name, avatar_url").eq("id", user.id).single();
    if (data) setProfile({ display_name: data.display_name || "", avatar_url: data.avatar_url || "" });
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Load trades from Supabase
  const loadTrades = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("trades")
      .select("*")
      .eq("user_id", user.id)
      .order("dt", { ascending: false });
    if (data) setTrades(data);
  }, [user]);

  useEffect(() => { loadTrades(); }, [loadTrades]);

  const prevUser = useRef(null);
  useEffect(() => {
    prevUser.current = user;
  }, [user, completed.size, authLoading]);

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");
    const { error } = authMode === "signup"
      ? await supabase.auth.signUp({ email: authEmail, password: authPassword })
      : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
    if (error) setAuthError(error.message);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setCompleted(new Map());
    setProfile({ display_name: "", avatar_url: "" });
  };

  const saveProfile = async () => {
    if (!user) return;
    await supabase.from("profiles").upsert({ id: user.id, display_name: editName.trim(), avatar_url: profile.avatar_url, updated_at: new Date().toISOString() });
    setProfile((p) => ({ ...p, display_name: editName.trim() }));
    // Save integrations to localStorage
    const trimmedGs = editGsUrl.trim();
    const trimmedKey = editApiKey.trim();
    setGsUrl(trimmedGs);
    setApiKey(trimmedKey);
    try { localStorage.setItem("gsUrl", trimmedGs); } catch {}
    try { localStorage.setItem("aiApiKey", trimmedKey); } catch {}
    // Show confirmation
    setProfileSaved(true);
    setTimeout(() => { setProfileSaved(false); setShowProfileEditor(false); }, 1200);
  };

  const uploadAvatar = async (file) => {
    if (!user || !file) return;
    const ext = file.name.split(".").pop();
    const path = `${user.id}/avatar.${ext}`;
    const { error } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const url = publicUrl + "?t=" + Date.now();
      await supabase.from("profiles").upsert({ id: user.id, avatar_url: url, updated_at: new Date().toISOString() });
      setProfile((p) => ({ ...p, avatar_url: url }));
    }
  };

  const displayName = profile.display_name || user?.email?.split("@")[0] || "Trader";

  const currentXP = ALL_ACH.filter((a) => completed.has(a.id)).reduce((s, a) => s + a.xp, 0);
  const currentLevel = [...LEVELS].reverse().find((l) => currentXP >= l.xpRequired) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.xpRequired > currentXP);
  const selectedData = LEVELS.find((l) => l.id === selectedLevel);

  const handleToggle = (id) => {
    if (completed.has(id)) {
      setViewingProof(id);
    } else {
      setConfirm(id);
      setProofNote("");
      setProofLink("");
    }
  };
  const confirmToggle = async () => {
    if (!confirm || !proofNote.trim() || !user) return;
    setSaving(true);
    const { error } = await supabase.from("quest_completions").insert({
      user_id: user.id,
      quest_id: confirm,
      note: proofNote.trim(),
      link: proofLink.trim(),
    });
    if (!error) {
      setCompleted((prev) => {
        const n = new Map(prev);
        n.set(confirm, {
          note: proofNote.trim(),
          link: proofLink.trim(),
          completedAt: new Date().toISOString(),
        });
        return n;
      });
    }
    setSaving(false);
    setConfirm(null);
    setProofNote("");
    setProofLink("");
  };
  const undoQuest = async (id) => {
    if (!user) return;
    setSaving(true);
    const { error } = await supabase
      .from("quest_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("quest_id", id);
    if (!error) {
      setCompleted((prev) => {
        const n = new Map(prev);
        n.delete(id);
        return n;
      });
    }
    setSaving(false);
    setViewingProof(null);
  };


  const globalStyles = `
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(10px); } to { opacity:1; transform:translateY(0); } }
    @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
    @keyframes hudPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    @keyframes subtleGlow { 0%,100% { box-shadow: 0 0 0 0 var(--accent-glow); } 50% { box-shadow: 0 0 20px 0 var(--accent-glow); } }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background: var(--bg-primary); color: var(--text-primary); font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; }
    ::-webkit-scrollbar { width: 5px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb { background: var(--border-primary); border-radius: 3px; }
    ::-webkit-scrollbar-thumb:hover { background: var(--border-glow); }
    button, input, textarea, select { font-family: inherit; }
    textarea:focus, input:focus, select:focus { border-color: var(--accent) !important; box-shadow: 0 0 0 3px var(--accent-glow) !important; outline: none; }
    ::selection { background: var(--accent-dim); color: var(--text-primary); }
    .sidebar-nav { transition: width 0.2s ease; }
    .sidebar-nav button:hover { background: var(--bg-tertiary) !important; }
    .nav-tab:hover { background: var(--bg-tertiary) !important; }
    @media (max-width: 768px) {
      .sidebar-nav { display: none !important; }
      .mobile-hamburger { display: flex !important; }
      .mobile-sidebar-overlay { display: block !important; }
      .header-bar { padding: 12px 16px !important; }
      .main-content { padding: 16px 16px 32px !important; }
      .edu-grid { grid-template-columns: 1fr 1fr !important; }
      .edu-controls { flex-direction: row !important; flex-wrap: wrap !important; }
      .edu-controls input { max-width: none !important; min-width: 0 !important; flex: 1 1 100% !important; }
      .edu-status-row { flex-wrap: wrap !important; }
      .edu-modal-inner { max-width: 100% !important; border-radius: 0 !important; max-height: 100vh !important; height: 100vh !important; }
      .acct-summary { grid-template-columns: repeat(3, 1fr) !important; }
      .acct-summary-2 { grid-template-columns: 1fr 1fr !important; }
      .payout-form-grid { grid-template-columns: 1fr 1fr !important; }
    }
    @media (min-width: 769px) {
      .mobile-hamburger { display: none !important; }
      .mobile-sidebar-overlay { display: none !important; }
    }
    @media (max-width: 640px) {
      .grid-4 { grid-template-columns: 1fr 1fr !important; }
      .grid-5 { grid-template-columns: repeat(2, 1fr) !important; }
      .grid-week { grid-template-columns: repeat(5, 1fr) !important; gap: 4px !important; }
      .card-pad { padding: 12px !important; }
      .form-grid { grid-template-columns: 1fr !important; }
      .modal-card { max-width: 100% !important; padding: 16px !important; margin: 8px !important; }
      .stat-val { font-size: 16px !important; }
      .cal-grid { gap: 2px !important; }
      .cal-day { min-height: 48px !important; padding: 3px !important; font-size: 10px !important; }
      .cal-day-num { font-size: 10px !important; }
      .cal-pnl { font-size: 9px !important; }
      .cal-count { font-size: 8px !important; }
      .section-title { font-size: 11px !important; }
      .drawdown-popup { width: calc(100vw - 24px) !important; right: 12px !important; bottom: 20px !important; padding: 14px !important; }
      .header-bar .header-right { gap: 6px !important; }
      .mood-grid { gap: 4px !important; }
      .mood-grid button { padding: 6px 8px !important; font-size: 10px !important; min-height: 40px !important; }
      .news-channels { gap: 3px !important; }
      .news-channels button { padding: 5px 8px !important; font-size: 9px !important; }
      .tilt-modal { padding: 20px !important; }
      .tilt-modal h2 { font-size: 16px !important; }
      .trade-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .trade-table table { min-width: 600px; }
      .quick-log-modal { max-width: 100% !important; border-radius: 8px !important; margin: 8px !important; max-height: calc(100vh - 16px) !important; }
      .review-modal-inner { width: calc(100vw - 16px) !important; max-width: 100% !important; border-radius: 8px !important; max-height: 96vh !important; }
      .review-modal-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .review-modal-table table { min-width: 700px; }
      .tag-picker { gap: 4px !important; }
      .log-form-btn { font-size: 11px !important; padding: "0 8px" !important; }
      .edu-grid { grid-template-columns: 1fr !important; }
      .edu-cat-chips { gap: 4px !important; }
      .edu-cat-chips button { padding: 4px 10px !important; font-size: 9px !important; }
      .acct-summary { grid-template-columns: 1fr 1fr !important; }
      .acct-card-stats { flex-direction: column !important; gap: 12px !important; }
      .payout-form-grid { grid-template-columns: 1fr !important; }
      .welcome-title { font-size: 24px !important; }
    }
    @media (max-width: 420px) {
      .grid-4 { grid-template-columns: 1fr !important; }
      .grid-5 { grid-template-columns: 1fr 1fr !important; }
      .acct-summary { grid-template-columns: 1fr !important; }
      .main-content { padding: 12px 12px 32px !important; }
    }
  `;

  // ── TRADESHARP LOGO (SVG) ───
  const TradeSharpLogo = ({ size = 64 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagon */}
      <path d="M32 2L58 17V47L32 62L6 47V17L32 2Z" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.5" />
      {/* Inner hexagon */}
      <path d="M32 10L50 21V43L32 54L14 43V21L32 10Z" stroke="#22d3ee" strokeWidth="1" fill="rgba(34,211,238,0.03)" />
      {/* Crosshair horizontal */}
      <line x1="20" y1="32" x2="44" y2="32" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      {/* Crosshair vertical */}
      <line x1="32" y1="20" x2="32" y2="44" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      {/* Center diamond */}
      <path d="M32 26L38 32L32 38L26 32Z" fill="#22d3ee" opacity="0.85" />
      {/* Corner ticks */}
      <line x1="20" y1="20" x2="24" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="20" x2="20" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="20" x2="40" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="20" x2="44" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="44" x2="24" y2="44" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="44" x2="20" y2="40" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="44" x2="40" y2="44" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="44" x2="44" y2="40" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      {/* Subtle pulse ring */}
      <circle cx="32" cy="32" r="28" stroke="#22d3ee" strokeWidth="0.5" opacity="0.12">
        <animate attributeName="r" values="28;29;28" dur="4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.12;0.04;0.12" dur="4s" repeatCount="indefinite" />
      </circle>
    </svg>
  );

  // ── LOADING ───
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#06070a", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          <div style={{ marginBottom: 16 }}><TradeSharpLogo size={48} /></div>
          <div style={{ fontSize: 13, color: "#52546a", letterSpacing: "0.15em", textTransform: "uppercase" }}>ESTABLISHING SECURE CONNECTION...</div>
        </div>
      </div>
    );
  }

  // ── LANDING PAGE ───
  if (!user) {
    const accent = "#22d3ee";
    const accentDim = "rgba(34,211,238,0.12)";
    const accentGlow = "rgba(34,211,238,0.06)";
    const sectionStyle = { maxWidth: 1100, margin: "0 auto", padding: "0 24px" };
    const mono = "'Plus Jakarta Sans', sans-serif";

    const features = [
      { icon: "📋", title: "A+ Trade Checklist", desc: "10-point pre-trade confirmation system with a built-in 10-second honesty timer. Never take a B-grade setup again." },
      { icon: "📊", title: "Trade Journal", desc: "Log every trade with entry details, P&L tracking for personal and funded accounts, TradingView links, and post-trade reflections." },
      { icon: "📅", title: "P&L Calendar", desc: "Visual monthly calendar showing daily profit and loss at a glance. Click any day to drill into individual trades." },
      { icon: "📈", title: "Equity Curve", desc: "Track your cumulative performance over time with a dynamic equity curve that highlights green and red zones." },
      { icon: "🤖", title: "AI Trading Coach", desc: "Get brutally honest AI-powered performance reviews. Identifies patterns, psychological leaks, and rule violations." },
      { icon: "🏆", title: "XP & Progression", desc: "RPG-style leveling system with badges, streaks, weekly challenges, and a 5-stage roadmap from breakeven to independence." },
      { icon: "💰", title: "Account Tracker", desc: "Monitor funded accounts, evaluations, and personal capital. Track drawdowns with real-time warning thresholds." },
      { icon: "🔗", title: "Google Sheets Sync", desc: "Auto-sync every trade and plan to your Google Sheet for backup, custom analysis, or sharing with mentors." },
    ];

    return (
      <div style={{ minHeight: "100vh", background: "#06070a", fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: "hidden" }}>
        <style>{globalStyles}{`
          .auth-input:focus {
            border-color: #22d3ee !important;
            box-shadow: 0 0 0 2px rgba(34,211,238,0.12) !important;
          }
          .landing-btn:hover {
            background: rgba(34,211,238,0.06) !important;
            transform: translateY(-1px);
          }
          .landing-btn { transition: all 0.25s ease !important; }
          .feature-card {
            transition: all 0.25s ease;
            cursor: default;
          }
          .feature-card:hover {
            border-color: #2a2d3a !important;
            transform: translateY(-2px);
          }
          .landing-nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 50;
            background: rgba(6,7,10,0.88); backdrop-filter: blur(20px);
            border-bottom: 1px solid #1c1e2a;
          }
          .landing-section { scroll-margin-top: 80px; }
          @keyframes heroFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-6px); }
          }
          @media (max-width: 768px) {
            .features-grid { grid-template-columns: 1fr !important; }
            .hero-content { flex-direction: column !important; text-align: center !important; }
            .hero-text h1 { font-size: 32px !important; }
            .hero-text .hero-sub { font-size: 16px !important; }
            .landing-nav-links { display: none !important; }
            .cta-row { flex-direction: column !important; }
          }
        `}</style>

        {/* ── Nav ── */}
        <nav className="landing-nav">
          <div style={{ ...sectionStyle, display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <TradeSharpLogo size={32} />
              <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: "#e8e8ed", letterSpacing: 3, textTransform: "uppercase" }}>TRADESHARP</span>
            </div>
            <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <a href="#features" style={{ fontFamily: mono, fontSize: 11, color: "#52546a", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseOver={(e) => e.target.style.color = accent} onMouseOut={(e) => e.target.style.color = "#52546a"}>Features</a>
              <a href="#auth-section" style={{ fontFamily: mono, fontSize: 11, color: "#52546a", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseOver={(e) => e.target.style.color = accent} onMouseOut={(e) => e.target.style.color = "#52546a"}>Get Started</a>
              <button onClick={() => document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" })}
                style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, padding: "8px 18px", background: "transparent", border: `1px solid ${accentDim}`, color: accent, borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s" }}
              >Sign In</button>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ paddingTop: 140, paddingBottom: 100, position: "relative" }}>
          {/* Subtle radial glow */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(ellipse at 50% 0%, rgba(34,211,238,0.04) 0%, transparent 50%)", pointerEvents: "none" }} />

          <div className="hero-content" style={{ ...sectionStyle, display: "flex", alignItems: "center", gap: 60, position: "relative" }}>
            <div className="hero-text" style={{ flex: 1 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20, opacity: 0.8 }}>
                TRADING PERFORMANCE SYSTEM
              </div>
              <h1 style={{ fontFamily: mono, fontSize: 44, fontWeight: 700, color: "#e8e8ed", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.5px" }}>
                Trade with<br />
                <span style={{ color: accent }}>Precision.</span><br />
                Journal with<br />
                <span style={{ color: accent }}>Purpose.</span>
              </h1>
              <p className="hero-sub" style={{ fontSize: 18, color: "#8b8d9e", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
                The all-in-one trading journal built for futures traders who take their edge seriously. A+ checklist, AI-powered reviews, P&L tracking, and RPG-style progression.
              </p>
              <div className="cta-row" style={{ display: "flex", gap: 14 }}>
                <button
                  className="landing-btn"
                  onClick={() => document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    fontFamily: mono, fontSize: 13, fontWeight: 700, padding: "14px 32px",
                    background: "transparent", border: `1.5px solid ${accent}`, color: accent,
                    borderRadius: 4, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase",
                    boxShadow: "none",
                  }}
                >GET STARTED FREE</button>
                <button
                  className="landing-btn"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    fontFamily: mono, fontSize: 13, fontWeight: 600, padding: "14px 32px",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#8b8d9e",
                    borderRadius: 4, cursor: "pointer", letterSpacing: "0.1em", textTransform: "uppercase",
                  }}
                >SEE FEATURES</button>
              </div>
            </div>
            <div style={{ flex: "0 0 auto", animation: "heroFloat 4s ease-in-out infinite" }}>
              <TradeSharpLogo size={200} />
            </div>
          </div>
        </section>

        {/* ── Stats Banner ── */}
        <section style={{ borderTop: "1px solid #1c1e2a", borderBottom: "1px solid #1c1e2a", padding: "40px 0", background: "rgba(34,211,238,0.02)" }}>
          <div style={{ ...sectionStyle, display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
            {[
              ["10-Point", "A+ Checklist"],
              ["AI-Powered", "Trade Reviews"],
              ["Real-Time", "P&L Calendar"],
              ["5-Stage", "Progression Map"],
            ].map(([val, label], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: accent, marginBottom: 4 }}>{val}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: "#52546a", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="landing-section" style={{ padding: "100px 0" }}>
          <div style={sectionStyle}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</div>
              <h2 style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: "#e8e8ed", letterSpacing: "-0.3px", marginBottom: 12 }}>Everything You Need to Level Up</h2>
              <p style={{ fontSize: 16, color: "#52546a", maxWidth: 540, margin: "0 auto" }}>Built by a trader, for traders. Every feature exists because the process demanded it.</p>
            </div>
            <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {features.map((f, i) => (
                <div key={i} className="feature-card" style={{
                  background: "rgba(12,13,18,0.9)", borderRadius: 8, padding: 28,
                  border: `1px solid ${accentDim}`,
                  boxShadow: "0 1px 2px rgba(0,0,0,0.3)",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: "#e8e8ed", marginBottom: 8, letterSpacing: "0.03em" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#8b8d9e", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section style={{ padding: "80px 0", borderTop: "1px solid #1c1e2a" }}>
          <div style={sectionStyle}>
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>HOW IT WORKS</div>
              <h2 style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: "#e8e8ed", letterSpacing: "-0.3px" }}>Your Daily Trading Workflow</h2>
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: 40, flexWrap: "wrap" }}>
              {[
                ["01", "Plan", "Set your bias, key levels, and session plan before the market opens."],
                ["02", "Confirm", "Run every setup through the 10-point A+ checklist. No shortcuts."],
                ["03", "Log", "Record the trade with P&L, charts, and honest notes about what happened."],
                ["04", "Review", "Let the AI coach analyze your patterns, then level up your progression."],
              ].map(([num, title, desc], i) => (
                <div key={i} style={{ flex: "1 1 220px", maxWidth: 240, textAlign: "center" }}>
                  <div style={{ fontFamily: mono, fontSize: 36, fontWeight: 700, color: accentDim, marginBottom: 12 }}>{num}</div>
                  <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: "#e8e8ed", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
                  <p style={{ fontSize: 13, color: "#52546a", lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Auth / Get Started ── */}
        <section id="auth-section" className="landing-section" style={{ padding: "100px 0", borderTop: "1px solid #1c1e2a" }}>
          <div style={{ ...sectionStyle, maxWidth: 440 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ display: "inline-block", marginBottom: 16 }}><TradeSharpLogo size={56} /></div>
              <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: "#e8e8ed", letterSpacing: "0.05em", marginBottom: 8 }}>
                {authMode === "signup" ? "Create Your Account" : "Welcome Back"}
              </h2>
              <p style={{ fontSize: 14, color: "#52546a" }}>
                {authMode === "signup" ? "Start journaling your trades in under 60 seconds." : "Sign in to pick up where you left off."}
              </p>
            </div>

            <div style={{
              background: "#0c0d12", borderRadius: 8,
              border: "1px solid #1c1e2a",
              padding: 32,
              boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
            }}>
              <form onSubmit={handleAuth}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#52546a", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.15em" }}>Email</label>
                  <input
                    className="auth-input"
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 14,
                      border: `1px solid ${accentDim}`, borderRadius: 4,
                      outline: "none", background: "#141520",
                      color: "#e8e8ed", fontFamily: mono, transition: "all 0.2s ease",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#52546a", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.15em" }}>Password</label>
                  <input
                    className="auth-input"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={authMode === "signup" ? 12 : 1}
                    placeholder={authMode === "signup" ? "Min 12 characters" : "••••••••"}
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 14,
                      border: `1px solid ${accentDim}`, borderRadius: 4,
                      outline: "none", background: "#141520",
                      color: "#e8e8ed", fontFamily: mono, transition: "all 0.2s ease",
                    }}
                  />
                </div>
                {authError && (
                  <div style={{
                    fontSize: 12, color: "#fb7185", marginBottom: 16, padding: "10px 14px",
                    background: "rgba(251,113,133,0.06)", borderRadius: 4, border: "1px solid rgba(251,113,133,0.15)",
                    fontFamily: mono,
                  }}>
                    {authError}
                  </div>
                )}
                <button
                  className="landing-btn"
                  type="submit"
                  style={{
                    width: "100%", fontSize: 13, fontWeight: 700, padding: "14px 20px",
                    background: "transparent", border: `1.5px solid ${accent}`, color: accent,
                    borderRadius: 4, cursor: "pointer",
                    boxShadow: "none",
                    fontFamily: mono, letterSpacing: "0.12em", textTransform: "uppercase",
                  }}
                >
                  {authMode === "signup" ? "Create Account" : "Sign In"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                  style={{ fontSize: 12, color: "#52546a", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: mono }}
                >
                  {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: "1px solid #1c1e2a", padding: "40px 0" }}>
          <div style={{ ...sectionStyle, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TradeSharpLogo size={24} />
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#52546a", letterSpacing: 2, textTransform: "uppercase" }}>TRADESHARP</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#4a4c6a", letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Built for traders, by a trader // {new Date().getFullYear()}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // ── MAIN UI ───
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-primary)",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      <style>{globalStyles}</style>

      {/* ── Proof Submission Modal ── */}
      {confirm && (() => {
        const ach = ALL_ACH.find((a) => a.id === confirm);
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              animation: "fadeSlideIn 0.2s ease",
            }}
            onClick={(e) => e.target === e.currentTarget && setConfirm(null)}
          >
            <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Submit Proof
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {ach?.name}
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--gold)", marginTop: 4 }}>
                  +{ach?.xp} XP
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  What did you do? *
                </label>
                <textarea
                  value={proofNote}
                  onChange={(e) => setProofNote(e.target.value)}
                  placeholder="Describe how you completed this quest..."
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 14,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    border: "1.5px solid var(--border-primary)",
                    borderRadius: 4,
                    outline: "none",
                    resize: "vertical",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "var(--text-secondary)", display: "block", marginBottom: 6 }}>
                  Link / Evidence (optional)
                </label>
                <input
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                  placeholder="URL to screenshot, journal, spreadsheet..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 14,
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    border: "1.5px solid var(--border-primary)",
                    borderRadius: 4,
                    outline: "none",
                    background: "var(--bg-input)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirm(null)}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: 600,
                    padding: "12px 20px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmToggle}
                  disabled={!proofNote.trim() || saving}
                  style={{
                    flex: 1,
                    fontSize: 14,
                    fontWeight: 700,
                    padding: "12px 20px",
                    background: proofNote.trim() && !saving ? "transparent" : "var(--bg-tertiary)",
                    border: proofNote.trim() && !saving ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                    color: proofNote.trim() && !saving ? "var(--accent)" : "var(--text-tertiary)",
                    borderRadius: 4,
                    cursor: proofNote.trim() && !saving ? "pointer" : "not-allowed",
                    boxShadow: proofNote.trim() && !saving ? "none" : "none",
                    transition: "all 0.2s",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  {saving ? "Saving..." : "Complete Quest"}
                </button>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ── Proof Viewer Modal ── */}
      {viewingProof && (() => {
        const ach = ALL_ACH.find((a) => a.id === viewingProof);
        const proof = completed.get(viewingProof);
        const meta = TYPE_META[ach?.type];
        return (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(8px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              animation: "fadeSlideIn 0.2s ease",
            }}
            onClick={(e) => e.target === e.currentTarget && setViewingProof(null)}
          >
            <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 16, color: meta?.color || "var(--text-primary)" }}>
                  {ach?.name}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Completed {proof?.completedAt ? new Date(proof.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                </div>
              </div>

              <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Proof
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {proof?.note || "(no note)"}
                </div>
              </div>

              {proof?.link && (
                <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Evidence Link
                  </div>
                  <a
                    href={(() => { try { const u = new URL(proof.link); return ["http:", "https:"].includes(u.protocol) ? u.href : "#"; } catch { return "#"; } })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 15, color: "var(--accent-secondary)", wordBreak: "break-all" }}
                  >
                    {proof.link}
                  </a>
                </div>
              )}

              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => undoQuest(viewingProof)}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "12px 20px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--red)",
                    color: "var(--red)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Undo Quest
                </button>
                <button
                  onClick={() => setViewingProof(null)}
                  style={{
                    flex: 1,
                    fontSize: 13,
                    fontWeight: 700,
                    padding: "12px 20px",
                    background: "var(--bg-tertiary)",
                    border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)",
                    borderRadius: 4,
                    cursor: "pointer",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                  }}
                >
                  Close
                </button>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ── Quick Log Modal ── */}
      {showQuickLog && (
        <QuickLogModal supabase={supabase} user={user} onClose={() => setShowQuickLog(false)} syncToSheets={syncToSheets} />
      )}

      {/* ── Tilt Alert Modal ── */}
      {showTilt && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setShowTilt(false)}
        >
          <div style={{
            maxWidth: 420, width: "100%", background: "#0c0a14", borderRadius: 8,
            border: "1px solid rgba(251,113,133,0.2)", padding: 36, textAlign: "center",
            boxShadow: "0 8px 40px rgba(0,0,0,0.6)",
            animation: "fadeSlideIn 0.3s ease",
          }} className="tilt-modal">
            <div style={{ fontSize: 48, marginBottom: 20 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#fb7185" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 4L44 40H4L24 4Z" fill="rgba(251,113,133,0.08)" />
                <line x1="24" y1="18" x2="24" y2="28" />
                <circle cx="24" cy="33" r="1" fill="#fb7185" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700,
              color: "#fb7185", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16,
            }}>TILT DETECTED</h2>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "#fb7185",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20,
              padding: "8px 16px", background: "rgba(251,113,133,0.06)", borderRadius: 4,
              border: "1px solid rgba(251,113,133,0.15)",
            }}>PROTOCOL ACTIVATED</div>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: "#ccc",
              lineHeight: 1.8, marginBottom: 12,
            }}>
              You are emotional. You are not thinking clearly.
            </p>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: "#ccc",
              lineHeight: 1.8, marginBottom: 12,
            }}>
              <strong style={{ color: "#fb7185" }}>Close the charts. Step away from the screen.</strong>
            </p>
            <p style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, color: "#ccc",
              lineHeight: 1.8, marginBottom: 28,
            }}>
              No trade is worth your account. No revenge trade has ever ended well. Protect your capital — come back tomorrow with a clear head.
            </p>
            <div style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#666",
              letterSpacing: "0.1em", marginBottom: 24,
            }}>
              "Discipline is choosing between what you want now and what you want most."
            </div>
            <button
              onClick={() => setShowTilt(false)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700,
                padding: "14px 32px", background: "transparent",
                border: "1px solid rgba(251,113,133,0.4)", color: "#fb7185",
                borderRadius: 4, cursor: "pointer", letterSpacing: "0.1em",
                textTransform: "uppercase", transition: "all 0.2s",
              }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {/* ── Focus Mode Modal ── */}
      {showFocus && (
        <div
          onClick={() => { clearInterval(focusTimerRef.current); setShowFocus(false); }}
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 18, padding: "44px 40px", maxWidth: 420, width: "100%", boxShadow: "0 0 60px rgba(34,211,238,0.10)", display: "flex", flexDirection: "column", alignItems: "center", gap: 28, textAlign: "center" }}
          >
            <TradeSharpLogo size={52} />
            <div style={{ fontSize: 56, fontWeight: 800, fontVariantNumeric: "tabular-nums", letterSpacing: 3, color: "var(--accent)", lineHeight: 1, fontFamily: "ui-monospace, monospace" }}>
              {String(Math.floor(focusSecs / 60)).padStart(2, "0")}:{String(focusSecs % 60).padStart(2, "0")}
            </div>
            <div style={{ color: "var(--text-secondary)", fontSize: 14, lineHeight: 1.85, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ margin: 0 }}>You don't need to catch every move.</p>
              <p style={{ margin: 0 }}>You need to catch <em>your</em> move.</p>
              <p style={{ margin: 0 }}>The market will do what it does.</p>
              <p style={{ margin: "8px 0 0" }}>Your only job is to wait for the one thing you recognize — and execute it cleanly.</p>
              <p style={{ margin: "16px 0 0", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em" }}>Not faster. Not smarter. Just disciplined.</p>
            </div>
            <button
              onClick={() => { clearInterval(focusTimerRef.current); setShowFocus(false); }}
              style={{ padding: "11px 32px", borderRadius: 6, background: "var(--accent)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              I'm Ready
            </button>
          </div>
        </div>
      )}

      {/* ── Profile Editor Modal ── */}
      {showProfileEditor && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setShowProfileEditor(false)}
        >
          <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 8px 32px rgba(0,0,0,0.5)" }}>
            {/* Saved confirmation overlay */}
            {profileSaved && (
              <div style={{
                position: "absolute", inset: 0, zIndex: 10, borderRadius: 10,
                background: dark ? "rgba(11,13,19,0.95)" : "rgba(255,255,255,0.95)",
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                animation: "fadeSlideIn 0.2s ease",
              }}>
                <div style={{ width: 48, height: 48, borderRadius: "50%", background: "var(--accent-dim)", border: "2px solid var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 12 }}>
                  <span style={{ fontSize: 22, color: "var(--accent)" }}>✓</span>
                </div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>Settings Saved</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>All changes confirmed</div>
              </div>
            )}

            {/* Profile section */}
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Profile & Settings</div>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px",
                  background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `linear-gradient(135deg, ${currentLevel.accent}, ${currentLevel.accent}cc)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", border: "3px solid var(--border-primary)", position: "relative",
                  overflow: "hidden",
                }}
              >
                {!profile.avatar_url && <span style={{ fontSize: 32, color: "var(--bg-primary)" }}>{displayName[0]?.toUpperCase()}</span>}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0,
                  background: "rgba(0,0,0,0.5)", color: "#fff", fontSize: 10, padding: "4px 0",
                  textAlign: "center", fontWeight: 600,
                }}>
                  Upload
                </div>
              </div>
              <input ref={avatarInputRef} type="file" accept="image/*" style={{ display: "none" }}
                onChange={(e) => { if (e.target.files?.[0]) uploadAvatar(e.target.files[0]); }}
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Display Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your trader name..."
                style={{ width: "100%", padding: "10px 14px", fontSize: 13, border: "1px solid var(--border-primary)", borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box" }}
              />
            </div>

            {/* Integrations divider */}
            <div style={{ borderTop: "1px solid var(--border-primary)", margin: "20px 0 16px", position: "relative" }}>
              <span style={{
                position: "absolute", top: -8, left: 12, padding: "0 8px",
                background: "var(--bg-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em",
              }}>Integrations</span>
            </div>

            {/* Google Sheets */}
            <div style={{ marginBottom: 14 }}>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <span style={{ fontSize: 13 }}>📊</span> Google Sheets URL
                {gsUrl && <span style={{ fontSize: 9, color: "var(--green)", fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: "rgba(5,150,105,0.12)" }}>CONNECTED</span>}
              </label>
              <input
                value={editGsUrl}
                onChange={(e) => setEditGsUrl(e.target.value)}
                placeholder="Paste your Apps Script URL here..."
                style={{ width: "100%", padding: "10px 14px", fontSize: 12, border: "1px solid var(--border-primary)", borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', sans-serif", boxSizing: "border-box" }}
              />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                Syncs trade data to Google Sheets on each journal entry.
              </div>
            </div>

            {/* Anthropic API Key */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "flex", alignItems: "center", gap: 6, marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                <span style={{ fontSize: 13 }}>🔑</span> Anthropic API Key
                {apiKey && <span style={{ fontSize: 9, color: "var(--green)", fontWeight: 700, padding: "1px 6px", borderRadius: 10, background: "rgba(5,150,105,0.12)" }}>ACTIVE</span>}
              </label>
              <input
                type="password"
                value={editApiKey}
                onChange={(e) => setEditApiKey(e.target.value)}
                placeholder="sk-ant-..."
                style={{ width: "100%", padding: "10px 14px", fontSize: 12, border: "1px solid var(--border-primary)", borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "'Plus Jakarta Sans', monospace", boxSizing: "border-box", letterSpacing: editApiKey ? 1 : 0 }}
              />
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 4, lineHeight: 1.5 }}>
                Powers AI trading summaries on the Stats page. Stored locally only.
              </div>
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowProfileEditor(false)}
                style={{ flex: 1, fontSize: 13, fontWeight: 600, padding: "12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Cancel
              </button>
              <button onClick={saveProfile}
                style={{ flex: 1, fontSize: 13, fontWeight: 700, padding: "12px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "none", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                Save
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Sidebar + Content Layout ── */}
      <div style={{ display: "flex", minHeight: "calc(100vh)" }}>

        {/* ── Sidebar Nav ── */}
        <div className="sidebar-nav" style={{
          width: 240, flexShrink: 0,
          background: "rgba(255,255,255,0.03)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--border-primary)",
          position: "sticky", top: 0, height: "100vh", overflowY: "auto",
          display: "flex", flexDirection: "column",
          padding: "20px 0",
        }}>
          {/* Logo + Brand */}
          <div style={{ padding: "0 20px 24px", borderBottom: "1px solid var(--border-primary)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <TradeSharpLogo size={28} />
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", letterSpacing: 2 }}>TRADESHARP</span>
            </div>
            {/* NYSE Clock */}
            <div style={{
              background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
              backdropFilter: "var(--glass-blur)",
              WebkitBackdropFilter: "var(--glass-blur)",
              borderRadius: 8,
              padding: "12px 10px",
              border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
              position: "relative",
              overflow: "hidden",
            }}>
              <div style={{
                position: "absolute", top: 0, left: 0, right: 0, height: 2,
                background: isMarketOpen
                  ? "linear-gradient(90deg, #059669, #22d3ee)"
                  : isPreMarket
                    ? "linear-gradient(90deg, #d97706, #f59e0b)"
                    : "linear-gradient(90deg, var(--text-tertiary), transparent)",
                opacity: isMarketOpen ? 1 : 0.5,
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 1.5,
                  textTransform: "uppercase", color: "var(--text-tertiary)",
                }}>NYSE</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                  padding: "2px 6px", borderRadius: 4,
                  background: isMarketOpen
                    ? "rgba(5,150,105,0.15)"
                    : isPreMarket
                      ? "rgba(217,119,6,0.15)"
                      : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  color: isMarketOpen ? "#059669" : isPreMarket ? "#d97706" : "var(--text-tertiary)",
                }}>
                  {isMarketOpen ? "OPEN" : isPreMarket ? "PRE-MKT" : "CLOSED"}
                </span>
              </div>
              <div style={{
                fontSize: 20, fontWeight: 700, fontVariantNumeric: "tabular-nums",
                letterSpacing: -0.5, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 4,
              }}>
                {nyTime}
              </div>
              <div style={{ fontSize: 10, fontWeight: 500, color: "var(--text-tertiary)", letterSpacing: 0.3 }}>
                {nyDate} · ET
              </div>
            </div>
          </div>

          {/* Nav Items */}
          <div style={{ padding: "16px 12px", flex: 1 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", padding: "0 8px 8px", marginBottom: 4 }}>Navigation</div>
            {[
              { key: "map", label: "Dashboard", icon: "⊡", reset: false },
              { key: "roadmap", label: "Roadmap", icon: "◆", reset: true },
              { key: "journal", label: "Journal", icon: "⊟", reset: false },
              { key: "notebook", label: "Notebook", icon: "✎", reset: false },
              { key: "watchlist", label: "Watchlist", icon: "◎", reset: false },
              { key: "accounts", label: "Accounts", icon: "⊞", reset: false },
              { key: "stats", label: "Stats", icon: "◧", reset: false },
              { key: "education", label: "Education", icon: "◈", reset: false },
            ].map((tab) => (
              <button
                key={tab.key}
                className="nav-tab"
                onClick={() => { setView(tab.key); if (tab.reset) setSelectedLevel(null); }}
                style={{
                  display: "flex", alignItems: "center", gap: 10,
                  width: "100%", textAlign: "left",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: view === tab.key ? 600 : 400,
                  padding: "9px 12px",
                  paddingLeft: view === tab.key ? 10 : 12,
                  background: view === tab.key ? "var(--accent-dim)" : "transparent",
                  border: "none",
                  borderLeft: view === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                  color: view === tab.key ? "var(--accent)" : "var(--text-secondary)",
                  borderRadius: 6,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  marginBottom: 2,
                }}
              >
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, opacity: view === tab.key ? 1 : 0.5 }}>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Focus Mode trigger */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-primary)" }}>
            <button
              onClick={() => { setFocusSecs(180); setShowFocus(true); }}
              title="Focus Mode"
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                background: "transparent", border: "none", cursor: "pointer",
                padding: "9px 12px", borderRadius: 6,
                color: "var(--text-secondary)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
                transition: "all 0.15s",
              }}
            >
              <TradeSharpLogo size={18} />
              <span style={{ fontWeight: 500 }}>Focus Mode</span>
            </button>
          </div>

          {/* User Profile */}
          <div style={{
            padding: "14px 12px",
            borderTop: "1px solid var(--border-primary)",
            borderBottom: "1px solid var(--border-primary)",
          }}>
            <div
              onClick={() => { setEditName(profile.display_name); setEditGsUrl(gsUrl); setEditApiKey(apiKey); setProfileSaved(false); setShowProfileEditor(true); }}
              style={{ cursor: "pointer", padding: "10px 12px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
            >
              {/* Avatar + name row */}
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 34, height: 34, borderRadius: 7, flexShrink: 0,
                  background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `linear-gradient(135deg, ${currentLevel.accent}, ${currentLevel.accent}cc)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {!profile.avatar_url && <span style={{ fontSize: 13, color: "var(--bg-primary)", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{displayName}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 20, background: `${currentLevel.accent}20`, color: currentLevel.accent, border: `1px solid ${currentLevel.accent}40` }}>{currentLevel.tier}</span>
                  </div>
                </div>
              </div>
              {/* XP progress */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)", fontWeight: 600 }}>{currentXP.toLocaleString()} XP</span>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)" }}>{nextLevel ? `${nextLevel.xpRequired.toLocaleString()} to ${nextLevel.name}` : "MAX LEVEL"}</span>
                </div>
                <XPBar
                  current={nextLevel ? currentXP - currentLevel.xpRequired : 1}
                  max={nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1}
                  color={currentLevel.accent}
                  height={4}
                />
              </div>
            </div>
          </div>

          {/* Bottom actions */}
          <div style={{ padding: "16px 12px", borderTop: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: 4 }}>
            <button
              onClick={() => setPrivacyMode(p => !p)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                fontSize: 13, padding: "9px 12px",
                background: privacyMode ? "var(--accent-dim)" : "transparent", border: "none",
                color: privacyMode ? "var(--accent)" : "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 14 }}>{privacyMode ? "◉" : "◎"}</span>
              {privacyMode ? "Privacy On" : "Privacy Mode"}
            </button>
            <button
              onClick={() => setDark(d => !d)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                fontSize: 13, padding: "9px 12px",
                background: "transparent", border: "none",
                color: "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 14 }}>{dark ? "☀" : "☾"}</span>
              {dark ? "Light mode" : "Dark mode"}
            </button>
            <button
              onClick={() => setShowTilt(true)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                fontSize: 13, padding: "9px 12px",
                background: "transparent", border: "none",
                color: "var(--red)", borderRadius: 6, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 14 }}>⚠</span>
              Tilt Protocol
            </button>
            <button
              onClick={handleSignOut}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                width: "100%", textAlign: "left",
                fontSize: 13, padding: "9px 12px",
                background: "transparent", border: "none",
                color: "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              <span style={{ fontSize: 14 }}>↗</span>
              Sign out
            </button>
          </div>
        </div>

        {/* Mobile Slide-in Sidebar */}
        {mobileMenu && (
          <div className="mobile-sidebar-overlay" style={{
            display: "none", position: "fixed", inset: 0, zIndex: 300,
            background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)",
          }} onClick={() => setMobileMenu(false)}>
            <div onClick={(e) => e.stopPropagation()} style={{
              position: "absolute", top: 0, left: 0, bottom: 0, width: 260,
              background: dark ? "rgba(11,13,19,0.97)" : "rgba(255,255,255,0.97)",
              border: "none", borderRight: "1px solid var(--border-primary)",
              backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
              boxShadow: "8px 0 40px rgba(0,0,0,0.3)",
              display: "flex", flexDirection: "column",
              overflowY: "auto",
              animation: "slideInLeft 0.2s ease",
            }}>
              {/* Logo + Clock */}
              <div style={{ padding: "20px 20px 16px", borderBottom: "1px solid var(--border-primary)" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <TradeSharpLogo size={24} />
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-primary)", letterSpacing: 2 }}>TRADESHARP</span>
                  </div>
                  <button onClick={() => setMobileMenu(false)} style={{
                    background: "none", border: "none", color: "var(--text-tertiary)",
                    fontSize: 18, cursor: "pointer", padding: "4px",
                  }}>✕</button>
                </div>
                {/* NYSE Clock */}
                <div style={{
                  background: dark ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.02)",
                  borderRadius: 8, padding: "10px 10px",
                  border: `1px solid ${dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}`,
                  position: "relative", overflow: "hidden",
                }}>
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, height: 2,
                    background: isMarketOpen ? "linear-gradient(90deg, #059669, #22d3ee)" : isPreMarket ? "linear-gradient(90deg, #d97706, #f59e0b)" : "linear-gradient(90deg, var(--text-tertiary), transparent)",
                    opacity: isMarketOpen ? 1 : 0.5,
                  }} />
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-tertiary)" }}>NYSE</span>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: 0.5, padding: "2px 6px", borderRadius: 4,
                      background: isMarketOpen ? "rgba(5,150,105,0.15)" : isPreMarket ? "rgba(217,119,6,0.15)" : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                      color: isMarketOpen ? "#059669" : isPreMarket ? "#d97706" : "var(--text-tertiary)",
                    }}>{isMarketOpen ? "OPEN" : isPreMarket ? "PRE-MKT" : "CLOSED"}</span>
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 2 }}>{nyTime}</div>
                  <div style={{ fontSize: 9, fontWeight: 500, color: "var(--text-tertiary)", letterSpacing: 0.3 }}>{nyDate} · ET</div>
                </div>
              </div>

              {/* Nav Items */}
              <div style={{ padding: "12px 10px", flex: 1 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", padding: "0 8px 8px", marginBottom: 4 }}>Navigation</div>
                {[
                  { key: "map", label: "Dashboard", icon: "⊡" },
                  { key: "roadmap", label: "Roadmap", icon: "◆", reset: true },
                  { key: "journal", label: "Journal", icon: "⊟" },
                  { key: "notebook", label: "Notebook", icon: "✎" },
                  { key: "watchlist", label: "Watchlist", icon: "◎" },
                  { key: "accounts", label: "Accounts", icon: "⊞" },
                  { key: "stats", label: "Stats", icon: "◧" },
                  { key: "education", label: "Education", icon: "◈" },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => { setView(tab.key); if (tab.reset) setSelectedLevel(null); setMobileMenu(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10, width: "100%",
                      background: view === tab.key ? "var(--accent-dim)" : "transparent",
                      border: "none", borderLeft: view === tab.key ? "2px solid var(--accent)" : "2px solid transparent",
                      color: view === tab.key ? "var(--accent)" : "var(--text-secondary)",
                      fontSize: 13, fontWeight: view === tab.key ? 600 : 400,
                      fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "10px 12px",
                      borderRadius: 6, cursor: "pointer", textAlign: "left",
                      marginBottom: 2,
                    }}
                  >
                    <span style={{ fontSize: 14, opacity: view === tab.key ? 1 : 0.5, width: 18, textAlign: "center" }}>{tab.icon}</span>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Profile */}
              <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border-primary)" }}>
                <div
                  onClick={() => { setEditName(profile.display_name); setEditGsUrl(gsUrl); setEditApiKey(apiKey); setProfileSaved(false); setShowProfileEditor(true); setMobileMenu(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 10px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `linear-gradient(135deg, ${currentLevel.accent}, ${currentLevel.accent}cc)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {!profile.avatar_url && <span style={{ fontSize: 11, color: "var(--bg-primary)", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>}
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{displayName}</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)" }}>{currentXP.toLocaleString()} XP</div>
                  </div>
                </div>
              </div>

              {/* Bottom actions */}
              <div style={{ padding: "8px 10px 16px", borderTop: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", gap: 2 }}>
                <button onClick={() => { setPrivacyMode(p => !p); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: privacyMode ? "var(--accent-dim)" : "transparent", border: "none",
                  color: privacyMode ? "var(--accent)" : "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ fontSize: 13 }}>{privacyMode ? "◉" : "◎"}</span>
                  {privacyMode ? "Privacy On" : "Privacy Mode"}
                </button>
                <button onClick={() => { setDark(d => !d); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ fontSize: 13 }}>{dark ? "☀" : "☾"}</span>
                  {dark ? "Light mode" : "Dark mode"}
                </button>
                <button onClick={() => { setShowTilt(true); setMobileMenu(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "var(--red)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ fontSize: 13 }}>⚠</span>
                  Tilt Protocol
                </button>
                <button onClick={() => { handleSignOut(); setMobileMenu(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ fontSize: 13 }}>↗</span>
                  Sign out
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Main Content ── */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {/* Top bar — minimal */}
          <div className="header-bar" style={{
            background: dark ? "rgba(11,13,19,0.75)" : "rgba(248,249,252,0.85)",
            borderBottom: "1px solid var(--border-primary)",
            backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            boxShadow: dark ? "0 1px 12px rgba(0,0,0,0.2)" : "0 1px 8px rgba(0,0,0,0.06)",
            padding: "16px 32px", position: "sticky", top: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "space-between",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Mobile hamburger */}
              <button
                className="mobile-hamburger"
                onClick={() => setMobileMenu(v => !v)}
                style={{
                  display: "none", alignItems: "center", justifyContent: "center",
                  width: 36, height: 36, borderRadius: 8,
                  background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                  color: "var(--text-primary)", fontSize: 18, cursor: "pointer",
                  flexShrink: 0,
                }}
              >☰</button>
              <h1 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                {view === "map" ? "Dashboard" : view === "roadmap" ? "Roadmap" : view === "journal" ? "Journal" : view === "notebook" ? "Notebook" : view === "watchlist" ? "Watchlist" : view === "accounts" ? "Accounts" : view === "stats" ? "Stats" : view === "education" ? "Education" : view === "level" ? selectedData?.name || "Level" : "TradeSharp"}
              </h1>
            </div>
            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button onClick={() => setShowQuickLog(true)} title="Quick log trade" style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                display: "flex", alignItems: "center", gap: 5,
                height: 32, padding: "0 12px", borderRadius: 6,
                background: "var(--accent-dim)", border: "1px solid var(--accent)",
                color: "var(--accent)", fontSize: 11, fontWeight: 700,
                cursor: "pointer", letterSpacing: "0.07em", textTransform: "uppercase",
                flexShrink: 0, transition: "all 0.15s",
              }}>+ LOG</button>
              {[
                { icon: privacyMode ? "◉" : "◎", title: privacyMode ? "Privacy On" : "Privacy Mode", onClick: () => setPrivacyMode(p => !p), active: privacyMode, color: "var(--accent)" },
                { icon: dark ? "☀" : "☾", title: dark ? "Light mode" : "Dark mode", onClick: () => setDark(d => !d), active: dark, color: null },
                { icon: "⚠", title: "Tilt Protocol", onClick: () => setShowTilt(true), active: false, color: "var(--red)" },
              ].map(({ icon, title, onClick, active, color }) => (
                <button key={title} onClick={onClick} title={title} style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6,
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                  color: active ? "var(--accent)" : (color || "var(--text-tertiary)"),
                  fontSize: 14, cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                }}>{icon}</button>
              ))}
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6,
                  background: "transparent", border: "1px solid var(--border-primary)",
                  color: "var(--text-tertiary)", fontSize: 14, cursor: "pointer",
                  transition: "all 0.15s", flexShrink: 0,
                }}
              >↗</button>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="main-content" style={{ maxWidth: 960, margin: "0 auto", padding: "28px 32px 60px" }}>

        {/* HOME — default view */}
        {view === "map" && (
          <DashboardView supabase={supabase} user={user} trades={trades} syncToSheets={syncToSheets} displayName={displayName} privacyMode={privacyMode} />
        )}

        {/* MAP VIEW — Trail Style */}
        {view === "roadmap" && !selectedLevel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            <PageBanner
              label="TRADER ROADMAP"
              title="From breakeven to independence."
              subtitle="Complete quests, earn XP, and level up through 5 stages of your trading journey."
            />
            {LEVELS.map((level, i) => {
              const isActive = currentXP >= level.xpRequired || i === 0;
              const isCurrent = level.id === currentLevel.id;
              const done = level.achievements.filter((a) => completed.has(a.id)).length;
              const total = level.achievements.length;
              const allDone = done === total;
              const pct = Math.round((done / total) * 100);
              const isPast = currentXP >= level.xpRequired && !isCurrent;
              const isLast = i === LEVELS.length - 1;

              return (
                <div key={level.id} style={{ animation: `fadeSlideIn 0.4s ease ${i * 0.1}s both` }}>
                  {/* Node row: dot + card */}
                  <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                    {/* Dot */}
                    <div style={{
                      width: 26, height: 26, borderRadius: "50%", flexShrink: 0,
                      background: allDone ? level.accent : isCurrent ? "var(--bg-secondary)" : isPast ? level.accent + "88" : "var(--bg-tertiary)",
                      border: `3px solid ${allDone ? level.accent : isCurrent ? level.accent : isPast ? level.accent + "66" : "var(--border-primary)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isCurrent ? `0 0 0 4px ${level.accent}20, 0 0 12px ${level.accent}30` : allDone ? `0 0 8px ${level.accent}40` : "none",
                      transition: "all 0.3s",
                    }}>
                      {allDone && <span style={{ fontSize: 11, color: "#fff", lineHeight: 1, fontWeight: 700 }}>✓</span>}
                      {isCurrent && !allDone && <div style={{ width: 10, height: 10, borderRadius: "50%", background: level.accent, animation: "pulse 2s infinite" }} />}
                    </div>

                    {/* Card */}
                    <LevelMapCard
                      level={level}
                      isActive={isActive}
                      isCurrent={isCurrent}
                      allDone={allDone}
                      isPast={isPast}
                      done={done}
                      total={total}
                      pct={pct}
                      onClick={isActive ? () => { setSelectedLevel(level.id); setView("level"); } : undefined}
                    />
                  </div>

                  {/* Connector line between nodes */}
                  {!isLast && (
                    <div style={{ display: "flex", alignItems: "stretch", gap: 16 }}>
                      <div style={{ width: 26, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 2, height: 20,
                          background: allDone
                            ? `linear-gradient(to bottom, ${level.accent}, ${LEVELS[i + 1]?.accent || level.accent})`
                            : isCurrent
                            ? `linear-gradient(to bottom, ${level.accent}80, var(--border-primary))`
                            : "var(--border-secondary)",
                          borderRadius: 2,
                          transition: "background 0.3s",
                        }} />
                      </div>
                      <div style={{ flex: 1 }} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* QUEST STATS + TRADING PERFORMANCE (shown on roadmap tab, map sub-view) */}
        {view === "roadmap" && !selectedLevel && (
          <div style={{ marginTop: 28 }}>
            {/* Quest Progress Summary */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 24 }}>
              {[
                { label: "Total XP", value: currentXP.toLocaleString(), sub: `/ ${TOTAL_XP.toLocaleString()}`, color: "var(--gold)", icon: "⚡" },
                { label: "Level", value: `${currentLevel.id} / 5`, sub: currentLevel.name, color: currentLevel.accent, icon: currentLevel.icon },
                { label: "Quests", value: `${completed.size} / ${ALL_ACH.length}`, sub: `${Math.round((completed.size / ALL_ACH.length) * 100)}% done`, color: "var(--green)", icon: "✅" },
                { label: "Next Goal", value: nextLevel ? nextLevel.name : "MAX!", sub: nextLevel ? `${(nextLevel.xpRequired - currentXP).toLocaleString()} XP away` : "You made it", color: nextLevel?.accent || "var(--red)", icon: nextLevel?.icon || "👑" },
              ].map((s, i) => (
                <Card key={i} style={{ padding: 0, overflow: "hidden", animation: `fadeSlideIn 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ height: 3, background: s.color, opacity: 0.7 }} />
                  <div style={{ padding: "16px 18px" }}>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
                      {s.icon} {s.label}
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 20, color: s.color, marginBottom: 3, letterSpacing: "-0.02em" }}>
                      {s.value}
                    </div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>{s.sub}</div>
                  </div>
                </Card>
              ))}
            </div>

            {/* Trading Performance */}
            {trades.length > 0 && (
              <TradingStatsView trades={trades} privacyMode={privacyMode} />
            )}
          </div>
        )}

        {/* LEVEL DETAIL VIEW */}
        {view === "level" && selectedData && (
          <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
            <button
              onClick={() => { setView("roadmap"); setSelectedLevel(null); }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 12,
                color: "var(--text-tertiary)",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-primary)",
                cursor: "pointer",
                marginBottom: 20,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                padding: "7px 14px",
                borderRadius: 6,
                transition: "all 0.15s",
              }}
            >
              ← Roadmap
            </button>

            <Card style={{ padding: 0, marginBottom: 20, overflow: "hidden", border: `1px solid ${selectedData.accent}35` }}>
              {/* Accent top bar */}
              <div style={{ height: 3, background: `linear-gradient(90deg, ${selectedData.accent}, ${selectedData.accent}40)` }} />
              <div style={{ padding: 24 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 14 }}>
                  {/* Icon in colored circle */}
                  <div style={{
                    width: 56, height: 56, borderRadius: 14,
                    background: `${selectedData.accent}18`,
                    border: `1.5px solid ${selectedData.accent}35`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <span style={{ fontSize: 28 }}>{selectedData.icon}</span>
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 800, fontSize: 18, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                        {selectedData.name}
                      </span>
                      <Chip label={selectedData.tier} color={selectedData.accent} />
                    </div>
                    <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{selectedData.subtitle}</div>
                  </div>
                </div>
                <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.65, marginBottom: 16 }}>
                  {selectedData.description}
                </div>
                <XPBar
                  current={selectedData.achievements.filter((a) => completed.has(a.id)).length}
                  max={selectedData.achievements.length}
                  color={selectedData.accent}
                  height={8}
                />
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textAlign: "right", marginTop: 6 }}>
                  {selectedData.achievements.filter((a) => completed.has(a.id)).length}/{selectedData.achievements.length} quests complete
                </div>
              </div>
            </Card>

            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "var(--text-tertiary)", marginBottom: 12, textTransform: "uppercase", letterSpacing: "0.12em" }}>
              Quests
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {selectedData.achievements.map((a, i) => (
                <AchievementRow
                  key={a.id}
                  ach={a}
                  completed={completed.has(a.id)}
                  proof={completed.get(a.id)}
                  onToggle={() => handleToggle(a.id)}
                  delay={i * 0.05}
                />
              ))}
            </div>
          </div>
        )}

        {/* JOURNAL VIEW (with collapsible checklist) */}
        {view === "journal" && (
          <JournalWithChecklist supabase={supabase} user={user} loadTrades={loadTrades} syncToSheets={syncToSheets} gsUrl={gsUrl} setGsUrl={setGsUrl} privacyMode={privacyMode} />
        )}

        {/* STATS VIEW — Trade performance data */}
        {view === "stats" && (
          <TradeStatsView supabase={supabase} user={user} trades={trades} loadTrades={loadTrades} privacyMode={privacyMode} />
        )}

        {/* WATCHLIST VIEW */}
        {view === "watchlist" && (
          <WatchlistView supabase={supabase} user={user} />
        )}

        {/* ACCOUNTS VIEW */}
        {view === "accounts" && (
          <AccountsView supabase={supabase} user={user} privacyMode={privacyMode} />
        )}

        {/* NOTEBOOK VIEW */}
        {view === "notebook" && (
          <NotebookView supabase={supabase} user={user} trades={trades} syncToSheets={syncToSheets} />
        )}

        {/* EDUCATION VIEW */}
        {view === "education" && (
          <EducationView supabase={supabase} user={user} />
        )}

          </div>{/* close main-content */}

          {/* Footer */}
          <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 500, fontSize: 10, color: "var(--text-tertiary)", letterSpacing: 3, textTransform: "uppercase", opacity: 0.6 }}>
              TRADESHARP
            </span>
          </div>
        </div>{/* close flex:1 wrapper */}
      </div>{/* close flex container */}
    </div>
  );
}

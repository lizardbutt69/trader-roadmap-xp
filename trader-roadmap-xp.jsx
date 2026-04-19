import { useState, useEffect, useRef, useCallback } from "react";
import { Navigate } from "react-router-dom";
import { supabase } from "./src/supabase.js";
import { ChecklistView, JournalView, TradeStatsView, TradingStatsView, AccountsView, DashboardView, WatchlistView, EducationView, NotebookView, PageBanner, QuickLogModal, AIHubView, EdgeChatView, TradeReplayView, useToast } from "./src/trading.jsx";
import { checkNewsAlerts } from "./src/utils/newsAlerts.js";
import RoadmapModern from "./src/components/RoadmapModern.jsx";

// ─── THEME ──────────────────────────────────────────────────────────────────

const LIGHT_THEME = {
  "--bg-primary": "#eaecf4",
  "--bg-secondary": "#ffffff",
  "--bg-tertiary": "rgba(230,232,242,0.80)",
  "--bg-input": "#ffffff",
  "--border-primary": "#d2d5e2",
  "--border-secondary": "#dcdfe8",
  "--border-glow": "#b8bccf",
  "--border-glow-shadow": "none",
  "--text-primary": "#0f1029",
  "--text-secondary": "#4a4c6a",
  "--text-tertiary": "#72748e",
  "--text-accent": "#0891b2",
  "--accent": "#0891b2",
  "--accent-dim": "rgba(8,145,178,0.10)",
  "--accent-glow": "rgba(8,145,178,0.06)",
  "--accent-glow-strong": "rgba(8,145,178,0.14)",
  "--accent-secondary": "#6366f1",
  "--card-shadow": "0 4px 24px rgba(15,16,41,0.10), 0 1px 4px rgba(15,16,41,0.06)",
  "--card-glow": "0 4px 24px rgba(15,16,41,0.10), 0 1px 4px rgba(15,16,41,0.06)",
  "--card-bg": "linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(255,255,255,0.90) 100%)",
  "--glass-blur": "blur(12px)",
  "--bg-glass": "rgba(255,255,255,0.85)",
  "--bg-glass-hover": "rgba(255,255,255,0.95)",
  "--green": "#059669",
  "--red": "#e11d48",
  "--gold": "#d97706",
  "--purple": "#7c3aed",
  "--hud-grid": "rgba(0,0,0,0.02)",
  "--modal-overlay": "rgba(15,16,41,0.45)",
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
  "--card-glow": "0 2px 20px rgba(0,0,0,0.25), 0 0 16px rgba(34,211,238,0.05)",
  "--card-bg": "linear-gradient(145deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 100%)",
  "--glass-blur": "blur(20px)",
  "--green": "#34d399",
  "--red": "#fb7185",
  "--gold": "#fbbf24",
  "--purple": "#a78bfa",
  "--hud-grid": "rgba(255,255,255,0.015)",
  "--modal-overlay": "rgba(0,0,0,0.70)",
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
        background: "var(--card-bg, var(--bg-secondary))",
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

function JournalWithChecklist({ supabase, user, loadTrades, privacyMode, prefs }) {
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
      <PageBanner
        label="TRADE JOURNAL"
        title="Track every session, grow every week."
        subtitle="Log your trades, review your equity curve, and hold yourself accountable to the process."
      />
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)", transition: "transform 0.2s", transform: checklistOpen ? "rotate(180deg)" : "rotate(0deg)", flexShrink: 0 }}><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        {checklistOpen && (
          <div style={{ border: "1px solid var(--border-primary)", borderTop: "none", borderRadius: "0 0 8px 8px", overflow: "hidden" }}>
            <ChecklistView supabase={supabase} user={user} embedded />
          </div>
        )}
      </div>
      {/* Journal */}
      <JournalView supabase={supabase} user={user} loadTrades={loadTrades} privacyMode={privacyMode} prefs={prefs} />
    </div>
  );
}

// ─── SETTINGS VIEW ───────────────────────────────────────────────────────────

function SettingsView({ supabase, user, profile, setProfile, apiKey, setApiKey, dark, setDark, privacyMode, setPrivacyMode, userPrefs, setUserPrefs, uploadAvatar, handleSignOut, currentXP, currentLevel, nextLevel, levels, completed, onNavigate }) {
  const addToast = useToast();
  const avatarRef = useRef(null);

  // Section: Profile
  const [editName, setEditName] = useState(profile.display_name || "");
  const [editBio, setEditBio] = useState(profile.bio || "");
  const [editEmail, setEditEmail] = useState(user?.email || "");
  const [savingProfile, setSavingProfile] = useState(false);

  // Section: Trading Profile
  const [expLevel, setExpLevel] = useState(userPrefs?.experience_level || "");
  const [tradingStyle, setTradingStyle] = useState(userPrefs?.trading_style || "");
  const [defaultRisk, setDefaultRisk] = useState(userPrefs?.default_risk ?? "");
  const [primarySession, setPrimarySession] = useState(userPrefs?.primary_session || "");
  const [savingTrading, setSavingTrading] = useState(false);

  // Section: Preferences — quality labels
  const ICT_APLUS = ["Yes", "No", "Yes to No", "Yes But Execution Sucked"];
  const ICT_TAGS = [
    { label: "GXT", color: "#22d3ee" }, { label: "TTFM", color: "#a78bfa" },
    { label: "CISD", color: "#f59e0b" }, { label: "ICCISD", color: "#fb923c" },
    { label: "1STG", color: "#34d399" }, { label: "2STG", color: "#60a5fa" },
    { label: "SMT", color: "#f472b6" }, { label: "PSP", color: "#2dd4bf" },
    { label: "SSMT", color: "#f87171" }, { label: "SMTFILL", color: "#c084fc" },
  ];
  const [aplusOptions, setAplusOptions] = useState(userPrefs?.aplus_options ?? ICT_APLUS);
  const [newAplus, setNewAplus] = useState("");
  const [tags, setTags] = useState(userPrefs?.tags ?? ICT_TAGS);
  const [newTagLabel, setNewTagLabel] = useState("");
  const [newTagColor, setNewTagColor] = useState("#22d3ee");
  const [savingPrefs, setSavingPrefs] = useState(false);

  // Section: Integrations
  const [editApiKey, setEditApiKey] = useState(apiKey || "");
  const [showKey, setShowKey] = useState(false);
  const [savingIntegrations, setSavingIntegrations] = useState(false);

  // Sync local state if parent prefs change (e.g. on first load)
  useEffect(() => {
    if (userPrefs) {
      setExpLevel(userPrefs.experience_level || "");
      setTradingStyle(userPrefs.trading_style || "");
      setDefaultRisk(userPrefs.default_risk ?? "");
      setPrimarySession(userPrefs.primary_session || "");
      setAplusOptions(userPrefs.aplus_options ?? ICT_APLUS);
      setTags(userPrefs.tags ?? ICT_TAGS);
    }
  }, [userPrefs]);

  useEffect(() => {
    setEditName(profile.display_name || "");
    setEditBio(profile.bio || "");
  }, [profile]);

  // ── Save helpers ──────────────────────────────────────────────────────────

  const saveProfile = async () => {
    setSavingProfile(true);
    const updates = { id: user.id, display_name: editName.trim(), bio: editBio.trim(), updated_at: new Date().toISOString() };
    if (profile.avatar_url) updates.avatar_url = profile.avatar_url;
    await supabase.from("profiles").upsert(updates);
    setProfile(p => ({ ...p, display_name: editName.trim(), bio: editBio.trim() }));
    if (editEmail.trim() !== user.email) {
      const { error } = await supabase.auth.updateUser({ email: editEmail.trim() });
      if (error) addToast("Email update failed: " + error.message);
      else addToast("Confirmation email sent to " + editEmail.trim());
    }
    setSavingProfile(false);
    addToast("Profile saved");
  };

  const saveTradingProfile = async () => {
    setSavingTrading(true);
    const row = {
      user_id: user.id,
      experience_level: expLevel || null,
      trading_style: tradingStyle || null,
      default_risk: defaultRisk !== "" ? parseFloat(defaultRisk) : null,
      primary_session: primarySession || null,
      updated_at: new Date().toISOString(),
    };
    await supabase.from("user_preferences").upsert(row, { onConflict: "user_id" });
    setUserPrefs(p => ({ ...(p ?? {}), ...row }));
    setSavingTrading(false);
    addToast("Trading profile saved");
  };

  const savePreferences = async () => {
    setSavingPrefs(true);
    const row = { user_id: user.id, aplus_options: aplusOptions, tags, onboarding_complete: true, updated_at: new Date().toISOString() };
    await supabase.from("user_preferences").upsert(row, { onConflict: "user_id" });
    setUserPrefs(p => ({ ...(p ?? {}), ...row }));
    setSavingPrefs(false);
    addToast("Preferences saved");
  };

  const saveIntegrations = async () => {
    setSavingIntegrations(true);
    const trimmedKey = editApiKey.trim();
    if (trimmedKey) {
      await supabase.from("profiles").upsert({ id: user.id, anthropic_api_key: trimmedKey, updated_at: new Date().toISOString() });
      setApiKey(trimmedKey);
    }
    setSavingIntegrations(false);
    addToast("Integrations saved");
  };

  // ── Reusable styles ───────────────────────────────────────────────────────

  const sectionCard = {
    background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
    borderRadius: 10, padding: "24px 28px", marginBottom: 16,
  };
  const sectionTitle = {
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--accent)",
    marginBottom: 20,
  };
  const label = {
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600,
    color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em",
    marginBottom: 6, display: "block",
  };
  const inputStyle = {
    width: "100%", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
    padding: "9px 12px", borderRadius: 6, border: "1px solid var(--border-primary)",
    background: "var(--bg-tertiary)", color: "var(--text-primary)", outline: "none",
    boxSizing: "border-box",
  };
  const saveBtn = (loading) => ({
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
    letterSpacing: "0.08em", textTransform: "uppercase",
    padding: "9px 20px", borderRadius: 6, cursor: loading ? "not-allowed" : "pointer",
    background: "var(--accent)", color: "#000", border: "none",
    opacity: loading ? 0.6 : 1, marginTop: 20,
  });
  const pillGroup = (value, setValue, options) => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
      {options.map(o => (
        <button key={o.key} type="button" onClick={() => setValue(v => v === o.key ? "" : o.key)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600,
            padding: "7px 14px", borderRadius: 20, cursor: "pointer",
            background: value === o.key ? "var(--accent-dim)" : "var(--bg-tertiary)",
            border: value === o.key ? "1px solid rgba(34,211,238,0.4)" : "1px solid var(--border-primary)",
            color: value === o.key ? "var(--accent)" : "var(--text-secondary)",
            transition: "all 0.15s",
          }}>{o.label}</button>
      ))}
    </div>
  );
  const toggle = (checked, onChange, labelText, helpText) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: "1px solid var(--border-primary)" }}>
      <div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-primary)" }}>{labelText}</div>
        {helpText && <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{helpText}</div>}
      </div>
      <div onClick={onChange} style={{
        width: 40, height: 22, borderRadius: 11, cursor: "pointer", flexShrink: 0,
        background: checked ? "var(--accent)" : "var(--bg-tertiary)",
        border: "1px solid var(--border-primary)", position: "relative", transition: "background 0.2s",
      }}>
        <div style={{
          position: "absolute", top: 2, left: checked ? 18 : 2,
          width: 16, height: 16, borderRadius: 8, background: checked ? "#000" : "var(--text-tertiary)",
          transition: "left 0.2s",
        }} />
      </div>
    </div>
  );

  return (
    <div style={{ padding: "24px 32px 48px", maxWidth: 720, margin: "0 auto" }}>
      <PageBanner label="Account" title="Settings" subtitle="Manage your profile, trading preferences, and integrations" />

      {/* ── Section 1: Profile ── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Profile</div>

        {/* Avatar */}
        <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 24 }}>
          <div style={{ position: "relative", flexShrink: 0 }}>
            <div
              onClick={() => avatarRef.current?.click()}
              style={{
                width: 72, height: 72, borderRadius: 12, cursor: "pointer",
                background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : "linear-gradient(135deg, var(--accent), var(--accent)88)",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: "2px solid var(--border-primary)",
              }}
            >
              {!profile.avatar_url && <span style={{ fontSize: 26, color: "#000", fontWeight: 700 }}>{(profile.display_name || user?.email || "?")[0].toUpperCase()}</span>}
              <div style={{ position: "absolute", bottom: -4, right: -4, width: 22, height: 22, borderRadius: 11, background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#000" strokeWidth="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <input ref={avatarRef} type="file" accept="image/*" style={{ display: "none" }} onChange={e => e.target.files[0] && uploadAvatar(e.target.files[0])} />
          </div>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--text-primary)" }}>{profile.display_name || "Trader"}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{user?.email}</div>
            <button onClick={() => avatarRef.current?.click()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: "4px 0", marginTop: 4 }}>Change photo</button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={label}>Display Name</label>
            <input style={inputStyle} value={editName} onChange={e => setEditName(e.target.value)} placeholder="Your trader name..." maxLength={50} />
          </div>
          <div>
            <label style={label}>Email</label>
            <input style={inputStyle} value={editEmail} onChange={e => setEditEmail(e.target.value)} placeholder="email@example.com" />
            {editEmail !== user?.email && <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>A confirmation link will be sent to the new address.</div>}
          </div>
        </div>
        <div style={{ marginBottom: 4 }}>
          <label style={label}>Bio <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>({editBio.length}/200)</span></label>
          <textarea style={{ ...inputStyle, height: 80, resize: "vertical" }} value={editBio} onChange={e => setEditBio(e.target.value.slice(0, 200))} placeholder="Tell other traders about yourself..." />
        </div>
        <button style={saveBtn(savingProfile)} onClick={saveProfile} disabled={savingProfile}>{savingProfile ? "Saving..." : "Save Profile"}</button>

        {/* XP strip */}
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border-primary)" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 14 }}>{currentLevel.icon}</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{currentLevel.name}</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.07em", textTransform: "uppercase", padding: "1px 6px", borderRadius: 20, background: `${currentLevel.accent}20`, color: currentLevel.accent, border: `1px solid ${currentLevel.accent}40` }}>{currentLevel.tier}</span>
            </div>
            <button
              onClick={() => onNavigate("roadmap")}
              style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", letterSpacing: "0.04em", padding: 0 }}
            >
              View Roadmap →
            </button>
          </div>
          <XPBar current={nextLevel ? currentXP - currentLevel.xpRequired : 1} max={nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1} color={currentLevel.accent} />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 5 }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>{currentXP.toLocaleString()} XP</span>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>{nextLevel ? `${nextLevel.xpRequired.toLocaleString()} to ${nextLevel.name}` : "MAX LEVEL"}</span>
          </div>
        </div>
      </div>

      {/* ── Section 2: Trading Profile ── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Trading Profile</div>

        <label style={label}>Experience Level</label>
        {pillGroup(expLevel, setExpLevel, [
          { key: "under_1yr", label: "Under 1 Year" },
          { key: "1_3yrs", label: "1–3 Years" },
          { key: "3plus_yrs", label: "3+ Years" },
          { key: "professional", label: "Professional" },
        ])}

        <label style={label}>Trading Style</label>
        {pillGroup(tradingStyle, setTradingStyle, [
          { key: "day_trader", label: "Day Trader" },
          { key: "swing", label: "Swing Trader" },
          { key: "scalper", label: "Scalper" },
          { key: "options", label: "Options Trader" },
        ])}

        <label style={label}>Primary Session</label>
        {pillGroup(primarySession, setPrimarySession, [
          { key: "ny", label: "NY Session" },
          { key: "london", label: "London" },
          { key: "asian", label: "Asian" },
          { key: "all", label: "All Sessions" },
        ])}

        <div style={{ maxWidth: 200 }}>
          <label style={label}>Default Risk Per Trade</label>
          <div style={{ position: "relative" }}>
            <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-tertiary)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>$</span>
            <input style={{ ...inputStyle, paddingLeft: 24 }} type="number" min="0" value={defaultRisk} onChange={e => setDefaultRisk(e.target.value)} placeholder="500" />
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 4 }}>Used by AI coaching to calculate R multiples.</div>
        </div>

        <button style={saveBtn(savingTrading)} onClick={saveTradingProfile} disabled={savingTrading}>{savingTrading ? "Saving..." : "Save Trading Profile"}</button>
      </div>

      {/* ── Section 3: Preferences ── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Trade Journal Preferences</div>

        {/* Quality Labels */}
        <label style={label}>Setup Quality Labels</label>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginBottom: 10 }}>First item = your A+ equivalent — counts toward streaks and scoring.</div>
        <div style={{ marginBottom: 12 }}>
          {aplusOptions.map((opt, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid var(--border-primary)" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-primary)", flex: 1 }}>{opt}</span>
              {i === 0 && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--accent)", padding: "2px 6px", border: "1px solid rgba(34,211,238,0.3)", borderRadius: 4 }}>A+</span>}
              <button onClick={() => setAplusOptions(a => { const n=[...a]; const t=n[i]; n.splice(i,1); if(i>0) n.splice(i-1,0,t); return n; })} disabled={i===0} style={{ background:"none",border:"none",cursor:i===0?"not-allowed":"pointer",color:"var(--text-tertiary)",fontSize:14,padding:"0 2px" }}>▲</button>
              <button onClick={() => setAplusOptions(a => { const n=[...a]; const t=n[i]; n.splice(i,1); if(i<n.length) n.splice(i+1,0,t); return n; })} disabled={i===aplusOptions.length-1} style={{ background:"none",border:"none",cursor:i===aplusOptions.length-1?"not-allowed":"pointer",color:"var(--text-tertiary)",fontSize:14,padding:"0 2px" }}>▼</button>
              <button onClick={() => setAplusOptions(a => a.filter((_,j)=>j!==i))} style={{ background:"none",border:"none",cursor:"pointer",color:"var(--red)",fontSize:16,padding:"0 4px" }}>×</button>
            </div>
          ))}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} value={newAplus} onChange={e=>setNewAplus(e.target.value)} placeholder="New quality label..." maxLength={40} onKeyDown={e=>{ if(e.key==="Enter"&&newAplus.trim()){ setAplusOptions(a=>[...a,newAplus.trim()]); setNewAplus(""); }}} />
            <button onClick={()=>{ if(newAplus.trim()){ setAplusOptions(a=>[...a,newAplus.trim()]); setNewAplus(""); }}} style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,padding:"9px 16px",borderRadius:6,cursor:"pointer",background:"var(--bg-tertiary)",border:"1px solid var(--border-primary)",color:"var(--text-primary)" }}>Add</button>
          </div>
        </div>

        {/* Setup Tags */}
        <label style={{ ...label, marginTop: 20 }}>Setup Tags</label>
        <div style={{ marginBottom: 12 }}>
          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", padding: "4px 0 12px" }}>
              {tags.map((tag, i) => (
                <span key={i} style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  fontSize: 12, fontWeight: 700, letterSpacing: "0.06em",
                  padding: "5px 10px 5px 12px", borderRadius: 6,
                  border: `1px solid ${tag.color}`,
                  background: `${tag.color}1a`,
                  color: tag.color,
                }}>
                  #{tag.label}
                  <button onClick={() => setTags(t => t.filter((_, j) => j !== i))} style={{
                    background: "none", border: "none", cursor: "pointer",
                    color: tag.color, opacity: 0.7, fontSize: 14, lineHeight: 1,
                    padding: 0, display: "flex", alignItems: "center",
                  }}>×</button>
                </span>
              ))}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", marginTop: tags.length > 0 ? 0 : 4 }}>
            <input type="color" value={newTagColor} onChange={e=>setNewTagColor(e.target.value)} style={{ width:32,height:32,border:"1px solid var(--border-primary)",borderRadius:6,cursor:"pointer",background:"none",padding:2,flexShrink:0 }} />
            <input style={{ ...inputStyle, flex:1 }} value={newTagLabel} onChange={e=>setNewTagLabel(e.target.value.toUpperCase())} placeholder="TAG NAME" maxLength={15} onKeyDown={e=>{ if(e.key==="Enter"&&newTagLabel.trim()){ setTags(t=>[...t,{label:newTagLabel.trim(),color:newTagColor}]); setNewTagLabel(""); }}} />
            <button onClick={()=>{ if(newTagLabel.trim()){ setTags(t=>[...t,{label:newTagLabel.trim(),color:newTagColor}]); setNewTagLabel(""); }}} style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:12,fontWeight:700,padding:"9px 16px",borderRadius:6,cursor:"pointer",background:"var(--bg-tertiary)",border:"1px solid var(--border-primary)",color:"var(--text-primary)",flexShrink:0 }}>Add</button>
          </div>
        </div>

        <button style={saveBtn(savingPrefs)} onClick={savePreferences} disabled={savingPrefs}>{savingPrefs ? "Saving..." : "Save Preferences"}</button>
      </div>

      {/* ── App Preferences ── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>App Preferences</div>
        {toggle(dark, () => setDark(d => !d), "Dark Mode", "Switch between dark and light theme")}
        {toggle(privacyMode, () => setPrivacyMode(p => !p), "Privacy Mode", "Mask all dollar amounts with ••••")}
      </div>

      {/* ── Section 4: Integrations ── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Integrations</div>

        <div style={{ marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ ...label, marginBottom: 0 }}>Anthropic API Key</label>
            {apiKey ? <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"2px 8px",borderRadius:20,background:"rgba(52,211,153,0.12)",color:"var(--green)",border:"1px solid rgba(52,211,153,0.3)" }}>ACTIVE</span>
              : <span style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"2px 8px",borderRadius:20,background:"var(--bg-tertiary)",color:"var(--text-tertiary)",border:"1px solid var(--border-primary)" }}>NOT SET</span>}
          </div>
          <div style={{ position: "relative" }}>
            <input style={{ ...inputStyle, paddingRight: 44 }} type={showKey ? "text" : "password"} value={editApiKey} onChange={e=>setEditApiKey(e.target.value)} placeholder="sk-ant-..." />
            <button onClick={()=>setShowKey(s=>!s)} style={{ position:"absolute",right:10,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"var(--text-tertiary)" }}>
              {showKey ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>
              : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>}
            </button>
          </div>
          <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:10,color:"var(--text-tertiary)",marginTop:4 }}>Powers AI trading summaries. Stored securely in your profile.</div>
        </div>

        <button style={saveBtn(savingIntegrations)} onClick={saveIntegrations} disabled={savingIntegrations}>{savingIntegrations ? "Saving..." : "Save Integrations"}</button>
      </div>

      {/* ── Section 5: Account ── */}
      <div style={sectionCard}>
        <div style={sectionTitle}>Account</div>
        <div style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:13,color:"var(--text-secondary)",marginBottom:16 }}>Signed in as <strong style={{ color:"var(--text-primary)" }}>{user?.email}</strong></div>
        <button
          onClick={handleSignOut}
          style={{ fontFamily:"'Plus Jakarta Sans',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",padding:"9px 20px",borderRadius:6,cursor:"pointer",background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.3)",color:"var(--red)" }}
        >Sign Out</button>
      </div>
    </div>
  );
}

// ─── MAIN APP ────────────────────────────────────────────────────────────────

export default function TraderRoadmapXP() {
  const addToast = useToast();
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
  const preOpenShownRef = useRef(null); // tracks which date's pre-open focus modal was auto-shown
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
  const secsToOpen = Math.max(0, 34200 - (nyHour * 3600 + nyMin * 60 + nySec)); // seconds until 9:30 AM ET
  const minsToOpen = Math.floor(secsToOpen / 60);
  const secsToOpenRem = secsToOpen % 60;

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

  // Pre-market focus modal — auto-show at 9:27 AM ET
  useEffect(() => {
    if (!isWeekday) return;
    const dateKey = nyClock.toLocaleDateString("en-US", nyOpts);
    if (nyHour === 9 && nyMin === 27 && nySec < 3 && preOpenShownRef.current !== dateKey) {
      preOpenShownRef.current = dateKey;
      setShowFocus(true);
    }
  }, [nyClock]);

  // News alerts — 30-second interval
  useEffect(() => {
    const id = setInterval(() => {
      checkNewsAlerts(new Date(), addToast, localStorage.getItem("displayTimezone") || "America/New_York");
    }, 30000);
    return () => clearInterval(id);
  }, [addToast]);

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
  const [view, setView] = useState(() => localStorage.getItem("ts_active_tab") || "map");
  const setViewAndPersist = useCallback((v) => { localStorage.setItem("ts_active_tab", v); setView(v); }, []);
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
  const todayKey = new Date().toISOString().slice(0, 10);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState([]);
  const [showSessionNotes, setShowSessionNotes] = useState(false);
  const [sessionNotes, setSessionNotes] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("sessionNotes") || "{}");
      return saved.date === new Date().toISOString().slice(0, 10) ? saved.text : "";
    } catch { return ""; }
  });
  const saveSessionNotes = (text) => {
    setSessionNotes(text);
    try { localStorage.setItem("sessionNotes", JSON.stringify({ date: todayKey, text })); } catch {}
  };

  // Escape key — close whichever modal is open (priority order)
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (showProfileEditor) { setShowProfileEditor(false); return; }
      if (confirm) { setConfirm(null); return; }
      if (viewingProof) { setViewingProof(null); return; }
      if (showTilt) { setShowTilt(false); return; }
      if (showFocus) { setShowFocus(false); return; }
      if (showSessionNotes) { setShowSessionNotes(false); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showProfileEditor, confirm, viewingProof, showTilt, showFocus, showSessionNotes]);


  const [editName, setEditName] = useState("");
  const [editApiKey, setEditApiKey] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [profileSaved, setProfileSaved] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const avatarInputRef = useRef(null);
  const [userPrefs, setUserPrefs] = useState(null);

  // Trading app state
  const [trades, setTrades] = useState([]);

  // Auth listener
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) wasAuthenticatedRef.current = true;
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      // Only reset to map on a real new sign-in (not token refresh re-firing SIGNED_IN)
      if (event === "SIGNED_IN" && !wasAuthenticatedRef.current) {
        localStorage.setItem("ts_active_tab", "map");
        setView("map");
      }
      wasAuthenticatedRef.current = !!session?.user;
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
    const { data } = await supabase.from("profiles").select("display_name, avatar_url, anthropic_api_key").eq("id", user.id).single();
    if (data) {
      setProfile({ display_name: data.display_name || "", avatar_url: data.avatar_url || "" });
      if (data.anthropic_api_key) setApiKey(data.anthropic_api_key);
    }
  }, [user]);

  useEffect(() => { loadProfile(); }, [loadProfile]);

  // Load user preferences
  const loadPreferences = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
    if (data) setUserPrefs(data);
  }, [user]);

  useEffect(() => { loadPreferences(); }, [loadPreferences]);

  const ICT_DEFAULTS = {
    aplus_options: ["Yes", "No", "Yes to No", "Yes But Execution Sucked"],
    tags: [
      { label: "GXT", color: "#22d3ee" }, { label: "TTFM", color: "#a78bfa" },
      { label: "CISD", color: "#f59e0b" }, { label: "ICCISD", color: "#fb923c" },
      { label: "1STG", color: "#34d399" }, { label: "2STG", color: "#60a5fa" },
      { label: "SMT", color: "#f472b6" }, { label: "PSP", color: "#2dd4bf" },
      { label: "SSMT", color: "#f87171" }, { label: "SMTFILL", color: "#c084fc" },
    ],
  };
  const prefs = userPrefs ?? ICT_DEFAULTS;

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
    const trimmedKey = editApiKey.trim();
    await supabase.from("profiles").upsert({
      id: user.id, display_name: editName.trim(), avatar_url: profile.avatar_url,
      updated_at: new Date().toISOString(),
      ...(trimmedKey ? { anthropic_api_key: trimmedKey } : {}),
    });
    setProfile((p) => ({ ...p, display_name: editName.trim() }));
    if (trimmedKey) setApiKey(trimmedKey);
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
  const handleMissionComplete = async (id, note, link) => {
    if (!user) return;
    const { error } = await supabase.from("quest_completions").insert({
      user_id: user.id, quest_id: id, note, link,
    });
    if (!error) {
      setCompleted((prev) => {
        const n = new Map(prev);
        n.set(id, { note, link, completedAt: new Date().toISOString() });
        return n;
      });
    }
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
    body { background: var(--bg-primary); color: var(--text-primary); font-family: 'Plus Jakarta Sans', -apple-system, sans-serif; -webkit-font-smoothing: antialiased; -moz-osx-font-smoothing: grayscale; transition: background 0.3s ease, color 0.3s ease; }
    *, *::before, *::after { transition: background-color 0.3s ease, border-color 0.3s ease, color 0.3s ease, box-shadow 0.3s ease; }
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
      .header-bar { padding: 10px 16px !important; }
      .header-title { font-size: 17px !important; }
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
    @media (max-width: 480px) {
      .header-icon-btn { display: none !important; }
      .header-right { gap: 6px !important; }
      .header-title { font-size: 15px !important; }
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
    @media (max-width: 768px) {
      .modal-overlay { padding: 12px !important; align-items: flex-end !important; }
      .modal-inner { border-radius: 12px 12px 0 0 !important; max-height: 92vh !important; padding: 20px !important; }
      .watchlist-form-grid { grid-template-columns: 1fr 1fr !important; }
      .notebook-grid { grid-template-columns: 1fr !important; }
      .dashboard-week { gap: 4px !important; }
    }
    @media (max-width: 640px) {
      .modal-inner { padding: 16px !important; }
      .acct-modal-grid-5 { grid-template-columns: 1fr 1fr !important; }
      .header-actions { gap: 4px !important; }
      .page-banner { padding: 20px 16px !important; }
      .page-banner h2 { font-size: 18px !important; }
      .page-banner p { font-size: 12px !important; }
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

  // ── REDIRECT UNAUTHENTICATED USERS ───
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ── MAIN UI ───
  return (
    <div
      style={{
        minHeight: "100vh",
        background: dark
          ? "var(--bg-primary)"
          : "radial-gradient(ellipse 80% 60% at 10% 0%, rgba(8,145,178,0.06) 0%, transparent 60%), var(--bg-primary)",
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
              background: "var(--modal-overlay)",
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
            <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)", background: dark ? "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)" : "#ffffff", backdropFilter: dark ? "blur(24px)" : "none", WebkitBackdropFilter: dark ? "blur(24px)" : "none" }}>
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
              background: "var(--modal-overlay)",
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
            <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 16px 48px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.06)", background: dark ? "linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.03) 100%)" : "#ffffff", backdropFilter: dark ? "blur(24px)" : "none", WebkitBackdropFilter: dark ? "blur(24px)" : "none" }}>
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
        <QuickLogModal supabase={supabase} user={user} onClose={() => setShowQuickLog(false)} prefs={prefs} />
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
          onClick={() => setShowFocus(false)}
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 18, padding: "36px 40px 40px", maxWidth: 420, width: "100%", boxShadow: "0 0 60px rgba(34,211,238,0.10)", display: "flex", flexDirection: "column", alignItems: "center", gap: 20, textAlign: "center", position: "relative" }}
          >
            {/* X dismiss — top right */}
            <button
              onClick={() => setShowFocus(false)}
              style={{ position: "absolute", top: 14, right: 14, background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 6, borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center", transition: "color 0.15s" }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-primary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-tertiary)"}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>

            {/* Clock card — styled like the sidebar NYSE widget, scaled up */}
            <div style={{
              width: "100%", borderRadius: 10, overflow: "hidden",
              background: dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)",
              border: `1px solid ${dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)"}`,
              backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
            }}>
              {/* Gradient top bar */}
              <div style={{
                height: 3,
                background: isMarketOpen
                  ? "linear-gradient(90deg, #059669, #22d3ee)"
                  : isPreMarket
                    ? "linear-gradient(90deg, #d97706, #f59e0b)"
                    : "linear-gradient(90deg, var(--text-tertiary), transparent)",
                opacity: isMarketOpen ? 1 : 0.6,
              }} />
              <div style={{ padding: "16px 20px 18px" }}>
                {/* NYSE label + status badge */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, textTransform: "uppercase", color: "var(--text-tertiary)" }}>NYSE</span>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
                    padding: "3px 8px", borderRadius: 4,
                    background: isMarketOpen ? "rgba(5,150,105,0.15)" : isPreMarket ? "rgba(217,119,6,0.15)" : dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                    color: isMarketOpen ? "#059669" : isPreMarket ? "#d97706" : "var(--text-tertiary)",
                  }}>
                    {isMarketOpen ? "OPEN" : isPreMarket ? "PRE-MKT" : "CLOSED"}
                  </span>
                </div>
                {/* Big time */}
                <div style={{ fontSize: 38, fontWeight: 700, fontVariantNumeric: "tabular-nums", letterSpacing: -0.5, color: "var(--text-primary)", lineHeight: 1.1, marginBottom: 6 }}>
                  {nyClock.toLocaleTimeString("en-US", { ...nyOpts, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true })}
                </div>
                {/* Date + opens-in line */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)", letterSpacing: 0.3 }}>{nyDate} · ET</span>
                  {isPreMarket && secsToOpen > 0 && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#d97706" }}>
                      Opens in {minsToOpen}:{String(secsToOpenRem).padStart(2, "0")}
                    </span>
                  )}
                  {isMarketOpen && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: "#059669" }}>Session live</span>
                  )}
                </div>
              </div>
            </div>

            {/* Motivational text */}
            <div style={{ color: "var(--text-secondary)", fontSize: 13.5, lineHeight: 1.85, fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", flexDirection: "column", gap: 4 }}>
              <p style={{ margin: 0 }}>You don't need to catch every move.</p>
              <p style={{ margin: 0 }}>You need to catch <em>your</em> move.</p>
              <p style={{ margin: "8px 0 0" }}>Your only job is to wait for the one thing you recognize — and execute it cleanly.</p>
              <p style={{ margin: "12px 0 0", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "0.02em" }}>Not faster. Not smarter. Just disciplined.</p>
            </div>

            {/* Dismiss button */}
            <button
              onClick={() => setShowFocus(false)}
              style={{ padding: "11px 32px", borderRadius: 6, background: "var(--accent)", border: "none", color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer", fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.08em", textTransform: "uppercase" }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* ── Session Notes Modal ── */}
      {showSessionNotes && (
        <div
          onClick={() => setShowSessionNotes(false)}
          style={{ position: "fixed", inset: 0, zIndex: 500, background: "rgba(0,0,0,0.75)", backdropFilter: "blur(12px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 16, padding: "28px 28px 24px", maxWidth: 480, width: "100%", boxShadow: "0 0 60px rgba(34,211,238,0.08)", display: "flex", flexDirection: "column", gap: 16 }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Session Notes</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{new Date().toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" })}</div>
              </div>
              <button
                onClick={() => setShowSessionNotes(false)}
                style={{ background: "transparent", border: "none", color: "var(--text-tertiary)", fontSize: 20, cursor: "pointer", padding: "4px 8px", borderRadius: 4, lineHeight: 1 }}
              >×</button>
            </div>
            {/* Textarea */}
            <textarea
              autoFocus
              value={sessionNotes}
              onChange={(e) => saveSessionNotes(e.target.value)}
              placeholder="How's today's session going? What are you seeing in the market? Any thoughts, observations, or mental notes..."
              style={{
                width: "100%", boxSizing: "border-box",
                background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                borderRadius: 8, color: "var(--text-primary)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
                lineHeight: 1.7, padding: "12px 14px", resize: "none",
                minHeight: 320, outline: "none", transition: "border-color 0.15s",
              }}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              onBlur={(e) => e.target.style.borderColor = "var(--border-primary)"}
            />
            {/* Footer */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>Resets automatically each new day</div>
              <div style={{ display: "flex", gap: 8 }}>
                {sessionNotes && (
                  <button
                    onClick={() => saveSessionNotes("")}
                    style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "7px 14px", borderRadius: 4, cursor: "pointer", border: "1px solid var(--border-primary)", background: "transparent", color: "var(--text-tertiary)", letterSpacing: "0.04em" }}
                  >Clear</button>
                )}
                <button
                  onClick={() => setShowSessionNotes(false)}
                  style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "7px 18px", borderRadius: 4, cursor: "pointer", border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)", letterSpacing: "0.05em" }}
                >Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Profile Editor Modal ── */}

      {/* ── Sidebar + Content Layout ── */}
      <div style={{ display: "flex", minHeight: "calc(100vh)" }}>

        {/* ── Sidebar Nav ── */}
        <div className="sidebar-nav" style={{
          width: 240, flexShrink: 0,
          background: dark ? "rgba(255,255,255,0.03)" : "#ffffff",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          borderRight: "1px solid var(--border-primary)",
          boxShadow: dark ? "none" : "2px 0 12px rgba(15,16,41,0.06)",
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
            {[
              { key: "map", label: "Dashboard", reset: false },
              { key: "roadmap", label: "Roadmap", reset: true },
              { key: "journal", label: "Journal", reset: false },
              { key: "notebook", label: "Notebook", reset: false },
              { key: "watchlist", label: "Watchlist", reset: false },
              { key: "accounts", label: "Accounts", reset: false },
              { key: "stats", label: "Stats", reset: false },
              { key: "charts", label: "Trade Replay", reset: false },
              { key: "education", label: "Education", reset: false },
              { key: "edge-chat", label: "Edge AI", reset: false },
            ].map((tab) => {
              const isActive = view === tab.key;
              const NAV_ICONS = {
                map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
                roadmap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
                journal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
                notebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
                watchlist: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
                accounts: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
                stats: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
                charts: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
                education: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
                ai: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>,
                "edge-chat": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
              };
              return (
                <button
                  key={tab.key}
                  className="nav-tab"
                  onClick={() => { setViewAndPersist(tab.key); if (tab.reset) setSelectedLevel(null); }}
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    width: "100%", textAlign: "left",
                    fontFamily: "'Plus Jakarta Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: isActive ? 600 : 400,
                    padding: "9px 12px",
                    background: isActive ? "var(--accent-dim)" : "transparent",
                    border: isActive ? "1px solid rgba(34,211,238,0.15)" : "1px solid transparent",
                    color: isActive ? "var(--accent)" : "var(--text-secondary)",
                    borderRadius: 8,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    marginBottom: 2,
                    boxShadow: isActive ? "0 2px 8px rgba(34,211,238,0.07)" : "none",
                  }}
                >
                  <span style={{ display: "flex", flexShrink: 0, opacity: isActive ? 1 : 0.45 }}>{NAV_ICONS[tab.key]}</span>
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Session Notes trigger */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-primary)" }}>
            <button
              onClick={() => setShowSessionNotes(true)}
              title="Session Notes"
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                background: "transparent", border: "none", cursor: "pointer",
                padding: "9px 12px", borderRadius: 6,
                color: "var(--text-secondary)",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
                transition: "all 0.15s",
              }}
            >
              <span style={{ display: "flex", flexShrink: 0, opacity: 0.45 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </span>
              <span style={{ fontWeight: 500 }}>Session Notes</span>
              {sessionNotes && <span style={{ marginLeft: "auto", width: 7, height: 7, borderRadius: "50%", background: "var(--accent)", flexShrink: 0 }} />}
            </button>
          </div>

          {/* Focus Mode trigger */}
          <div style={{ padding: "8px 12px", borderTop: "1px solid var(--border-primary)" }}>
            <button
              onClick={() => setShowFocus(true)}
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
              onClick={() => setViewAndPersist("settings")}
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
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
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
              <span style={{ display: "flex", flexShrink: 0, opacity: 0.6 }}>
                {privacyMode
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                }
              </span>
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
              <span style={{ display: "flex", flexShrink: 0, opacity: 0.6 }}>
                {dark
                  ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                  : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>
                }
              </span>
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
              <span style={{ display: "flex", flexShrink: 0, opacity: 0.7 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              </span>
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
              <span style={{ display: "flex", flexShrink: 0, opacity: 0.6 }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </span>
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
                {[
                  { key: "map", label: "Dashboard" },
                  { key: "roadmap", label: "Roadmap", reset: true },
                  { key: "journal", label: "Journal" },
                  { key: "notebook", label: "Notebook" },
                  { key: "watchlist", label: "Watchlist" },
                  { key: "accounts", label: "Accounts" },
                  { key: "stats", label: "Stats" },
                  { key: "charts", label: "Trade Replay" },
                  { key: "education", label: "Education" },
                  { key: "edge-chat", label: "Edge AI" },
                ].map((tab) => {
                  const isActive = view === tab.key;
                  const NAV_ICONS = {
                    map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>,
                    roadmap: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></svg>,
                    journal: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>,
                    notebook: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><line x1="10" y1="9" x2="8" y2="9"/></svg>,
                    watchlist: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
                    accounts: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
                    stats: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
                    charts: <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><polygon points="5,3 19,12 5,21"/></svg>,
                    education: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>,
                    ai: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>,
                    "edge-chat": <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>,
                    calendar: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
                  };
                  return (
                    <button
                      key={tab.key}
                      onClick={() => { setViewAndPersist(tab.key); if (tab.reset) setSelectedLevel(null); setMobileMenu(false); }}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, width: "100%",
                        background: isActive ? "var(--accent-dim)" : "transparent",
                        border: isActive ? "1px solid rgba(34,211,238,0.15)" : "1px solid transparent",
                        color: isActive ? "var(--accent)" : "var(--text-secondary)",
                        fontSize: 13, fontWeight: isActive ? 600 : 400,
                        fontFamily: "'Plus Jakarta Sans', sans-serif", padding: "10px 12px",
                        borderRadius: 8, cursor: "pointer", textAlign: "left",
                        marginBottom: 2,
                        boxShadow: isActive ? "0 2px 8px rgba(34,211,238,0.07)" : "none",
                      }}
                    >
                      <span style={{ display: "flex", flexShrink: 0, opacity: isActive ? 1 : 0.45 }}>{NAV_ICONS[tab.key]}</span>
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              {/* Profile */}
              <div style={{ padding: "12px 10px", borderTop: "1px solid var(--border-primary)" }}>
                <div
                  onClick={() => { setViewAndPersist("settings"); setMobileMenu(false); }}
                  style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "8px 10px", borderRadius: 6, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)" }}
                >
                  <div style={{
                    width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                    background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `linear-gradient(135deg, ${currentLevel.accent}, ${currentLevel.accent}cc)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {!profile.avatar_url && <span style={{ fontSize: 11, color: "var(--bg-primary)", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{displayName}</div>
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)" }}>{currentXP.toLocaleString()} XP</div>
                  </div>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, opacity: 0.6 }}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
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
                  <span style={{ display: "flex", flexShrink: 0, opacity: 0.6 }}>
                    {privacyMode
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                    }
                  </span>
                  {privacyMode ? "Privacy On" : "Privacy Mode"}
                </button>
                <button onClick={() => { setDark(d => !d); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ display: "flex", flexShrink: 0, opacity: 0.6 }}>
                    {dark
                      ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                      : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>
                    }
                  </span>
                  {dark ? "Light mode" : "Dark mode"}
                </button>
                <button onClick={() => { setShowTilt(true); setMobileMenu(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "var(--red)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ display: "flex", flexShrink: 0, opacity: 0.7 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </span>
                  Tilt Protocol
                </button>
                <button onClick={() => { handleSignOut(); setMobileMenu(false); }} style={{
                  display: "flex", alignItems: "center", gap: 10, width: "100%", textAlign: "left",
                  fontSize: 12, padding: "8px 12px",
                  background: "transparent", border: "none",
                  color: "var(--text-tertiary)", borderRadius: 6, cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}>
                  <span style={{ display: "flex", flexShrink: 0, opacity: 0.6 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                  </span>
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
              <h1 className="header-title" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 22, fontWeight: 800, color: "var(--text-primary)", margin: 0, letterSpacing: "-0.02em" }}>
                {view === "map" ? "Dashboard" : view === "roadmap" ? "Roadmap" : view === "journal" ? "Journal" : view === "notebook" ? "Notebook" : view === "watchlist" ? "Watchlist" : view === "accounts" ? "Accounts" : view === "stats" ? "Stats" : view === "charts" ? "Charts" : view === "education" ? "Education" : view === "edge-chat" ? "Edge AI" : view === "settings" ? "Settings" : view === "level" ? selectedData?.name || "Level" : "TradeSharp"}
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
                {
                  title: privacyMode ? "Privacy On" : "Privacy Mode",
                  onClick: () => setPrivacyMode(p => !p),
                  active: privacyMode, color: "var(--accent)",
                  icon: privacyMode
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" y1="2" x2="22" y2="22"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>,
                },
                {
                  title: dark ? "Light mode" : "Dark mode",
                  onClick: () => setDark(d => !d),
                  active: false, color: null,
                  icon: dark
                    ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
                    : <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9z"/></svg>,
                },
                {
                  title: "Tilt Protocol",
                  onClick: () => setShowTilt(true),
                  active: false, color: "var(--red)",
                  icon: <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>,
                },
              ].map(({ icon, title, onClick, active, color }) => (
                <button key={title} onClick={onClick} title={title} className="header-icon-btn" style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6,
                  background: active ? "var(--accent-dim)" : "transparent",
                  border: active ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                  color: active ? "var(--accent)" : (color || "var(--text-tertiary)"),
                  cursor: "pointer", transition: "all 0.15s", flexShrink: 0,
                }}>{icon}</button>
              ))}
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center",
                  width: 32, height: 32, borderRadius: 6,
                  background: "transparent", border: "1px solid var(--border-primary)",
                  color: "var(--text-tertiary)", cursor: "pointer",
                  transition: "all 0.15s", flexShrink: 0,
                }}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              </button>
            </div>
          </div>

          {/* ── Content ── */}
          <div className="main-content" style={{ maxWidth: (view === "settings" || view === "charts") ? "none" : 960, margin: "0 auto", padding: view === "settings" ? 0 : "28px 32px 60px" }}>

        {/* HOME — default view */}
        {view === "map" && (
          <DashboardView supabase={supabase} user={user} trades={trades} displayName={displayName} privacyMode={privacyMode} onNavigate={setViewAndPersist} />
        )}

        {/* ROADMAP VIEW */}
        {view === "roadmap" && (
          <RoadmapModern
            completed={completed}
            onMissionComplete={handleMissionComplete}
            onMissionView={(mission, proof) => setViewingProof(mission.id)}
          />
        )}

        {/* JOURNAL VIEW (with collapsible checklist) */}
        {view === "journal" && (
          <JournalWithChecklist supabase={supabase} user={user} loadTrades={loadTrades} privacyMode={privacyMode} prefs={prefs} />
        )}

        {/* STATS VIEW — Trade performance data */}
        {view === "stats" && (
          <TradeStatsView supabase={supabase} user={user} trades={trades} loadTrades={loadTrades} privacyMode={privacyMode} prefs={prefs} onNavigate={setViewAndPersist} />
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
          <NotebookView supabase={supabase} user={user} trades={trades} />
        )}

        {/* TRADE REPLAY VIEW */}
        {view === "charts" && (
          <TradeReplayView supabase={supabase} user={user} privacyMode={privacyMode} />
        )}

        {/* EDUCATION VIEW */}
        {view === "education" && (
          <EducationView supabase={supabase} user={user} />
        )}

        {/* EDGE CHAT VIEW */}
        {view === "edge-chat" && (
          <EdgeChatView supabase={supabase} user={user} trades={trades} />
        )}

          </div>{/* close main-content */}

        {/* SETTINGS VIEW — full width, outside the narrow content container */}
        {view === "settings" && (
          <SettingsView
            supabase={supabase} user={user}
            profile={profile} setProfile={setProfile}
            apiKey={apiKey} setApiKey={setApiKey}
            dark={dark} setDark={setDark}
            privacyMode={privacyMode} setPrivacyMode={setPrivacyMode}
            userPrefs={userPrefs} setUserPrefs={setUserPrefs}
            uploadAvatar={uploadAvatar}
            handleSignOut={handleSignOut}
            currentXP={currentXP} currentLevel={currentLevel}
            nextLevel={nextLevel} levels={LEVELS} completed={completed}
            onNavigate={setViewAndPersist}
          />
        )}

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

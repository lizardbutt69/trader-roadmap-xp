import React, { useState } from "react";
import { PageBanner } from "../trading.jsx";

// ═══════════════════════════════════════════════════════════════════════════
// MODERN ROADMAP COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

// ─── SVG ICONS ──────────────────────────────────────────────────────────────

const Icons = {
  Foundation: ({ color = "currentColor", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  ),
  Evaluation: ({ color = "currentColor", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M3 9h18" />
      <path d="M9 21V9" />
      <path d="M14 12l3 3 4-4" />
    </svg>
  ),
  Funded: ({ color = "currentColor", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18" />
      <path d="M18 17V9" />
      <path d="M13 17V5" />
      <path d="M8 17v-3" />
    </svg>
  ),
  Scaling: ({ color = "currentColor", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="6" width="8" height="12" rx="1" />
      <rect x="14" y="2" width="8" height="16" rx="1" />
      <path d="M6 10v4" />
      <path d="M18 6v8" />
    </svg>
  ),
  Independent: ({ color = "currentColor", size = 24 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  Process: ({ color = "currentColor", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  ),
  Discipline: ({ color = "currentColor", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="12" cy="12" r="6" />
      <circle cx="12" cy="12" r="2" />
    </svg>
  ),
  Milestone: ({ color = "currentColor", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
  Payout: ({ color = "currentColor", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23" />
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
    </svg>
  ),
  Check: ({ color = "currentColor", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Lightning: ({ color = "currentColor", size = 14 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  Money: ({ color = "currentColor", size = 16 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

const TYPE_META = {
  process:    { Icon: Icons.Process,    label: "Process",    color: "#3b82f6", bg: "rgba(59,130,246,0.1)"  },
  discipline: { Icon: Icons.Discipline, label: "Discipline", color: "#f59e0b", bg: "rgba(245,158,11,0.1)"  },
  milestone:  { Icon: Icons.Milestone,  label: "Milestone",  color: "#8b5cf6", bg: "rgba(139,92,246,0.1)"  },
  payout:     { Icon: Icons.Payout,     label: "Payout",     color: "#10b981", bg: "rgba(16,185,129,0.1)"  },
};

const LEVELS = [
  {
    id: 1,
    name: "Foundation",
    subtitle: "Build the Process",
    tier: "STAGE 1",
    accent: "#06b6d4",
    accentLight: "rgba(6,182,212,0.1)",
    accentGlow: "rgba(6,182,212,0.3)",
    gradient: "linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)",
    bgGradient: "linear-gradient(135deg, rgba(6,182,212,0.08) 0%, rgba(8,145,178,0.04) 100%)",
    xpRequired: 0,
    description: "Define the model, build the habits, and develop the discipline to execute.",
    missions: [
      { id: "a1", name: "Model Defined",       desc: "Document your trading model and rules in writing",               xp: 50,  type: "process" },
      { id: "a2", name: "10-Day Journal Streak",desc: "Journal every session for 10 consecutive days",                  xp: 75,  type: "process" },
      { id: "a3", name: "Session Discipline",   desc: "Trade NY session only for 2 full weeks",                         xp: 100, type: "discipline" },
      { id: "a4", name: "Pre-Trade Process",    desc: "Complete pre-trade checklist on 20 consecutive trades",          xp: 100, type: "process" },
      { id: "a5", name: "A+ Criteria Locked",   desc: "Define and commit your A+ trade criteria to paper",              xp: 50,  type: "process" },
    ],
  },
  {
    id: 2,
    name: "Evaluation",
    subtitle: "Pass Evals & Get Funded",
    tier: "STAGE 2",
    accent: "#f59e0b",
    accentLight: "rgba(245,158,11,0.1)",
    accentGlow: "rgba(245,158,11,0.3)",
    gradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
    bgGradient: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(217,119,6,0.04) 100%)",
    xpRequired: 375,
    description: "Prove the edge under evaluation pressure. Get funded and receive your first payout.",
    missions: [
      { id: "b1", name: "Evaluation Passed",    desc: "Pass your first prop firm evaluation",                           xp: 150, type: "milestone" },
      { id: "b2", name: "A+ Only Week",         desc: "Take only A+ setups for a full trading week",                    xp: 100, type: "discipline" },
      { id: "b3", name: "2-Trade Discipline",   desc: "Respect 2-trade daily max for 10 consecutive sessions",          xp: 100, type: "discipline" },
      { id: "b4", name: "First Payout",         desc: "Receive your first funded account payout",                       xp: 200, type: "payout", amount: "1st Payout" },
      { id: "b5", name: "No Revenge Trading",   desc: "Walk away after a loss — 10 times without revenge trading",      xp: 100, type: "discipline" },
      { id: "b6", name: "Execution Trust",      desc: "Hold to take-profit without moving stop — 5 times",              xp: 125, type: "discipline" },
    ],
  },
  {
    id: 3,
    name: "Funded",
    subtitle: "Consistent Payouts",
    tier: "STAGE 3",
    accent: "#3b82f6",
    accentLight: "rgba(59,130,246,0.1)",
    accentGlow: "rgba(59,130,246,0.3)",
    gradient: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
    bgGradient: "linear-gradient(135deg, rgba(59,130,246,0.08) 0%, rgba(37,99,235,0.04) 100%)",
    xpRequired: 1150,
    description: "Multiple accounts running. Consistent payouts proving the edge is repeatable.",
    missions: [
      { id: "c1", name: "3 Active Accounts",    desc: "Manage 3+ funded accounts simultaneously",                       xp: 150, type: "milestone" },
      { id: "c2", name: "Payout Consistency",   desc: "Receive payouts 3 consecutive cycles",                           xp: 200, type: "payout" },
      { id: "c3", name: "$1K Month",            desc: "Monthly payouts exceed $1,000",                                  xp: 150, type: "payout", amount: "$1K/mo" },
      { id: "c4", name: "$5K Lifetime",         desc: "Lifetime payouts reach $5,000",                                  xp: 200, type: "payout", amount: "$5K" },
      { id: "c5", name: "5 Active Accounts",    desc: "Manage 5+ funded accounts simultaneously",                       xp: 175, type: "milestone" },
      { id: "c6", name: "$5K Month",            desc: "Monthly payouts exceed $5,000",                                  xp: 250, type: "payout", amount: "$5K/mo" },
    ],
  },
  {
    id: 4,
    name: "Scaling",
    subtitle: "Personal Capital Online",
    tier: "STAGE 4",
    accent: "#8b5cf6",
    accentLight: "rgba(139,92,246,0.1)",
    accentGlow: "rgba(139,92,246,0.3)",
    gradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
    bgGradient: "linear-gradient(135deg, rgba(139,92,246,0.08) 0%, rgba(124,58,237,0.04) 100%)",
    xpRequired: 2275,
    description: "Funded payouts fuel personal accounts. Building real capital from proven results.",
    missions: [
      { id: "d1", name: "Personal Account Funded", desc: "Seed personal account from payouts ($2,500+)",               xp: 200, type: "payout",    amount: "$2.5K seed" },
      { id: "d2", name: "$10K Month",           desc: "Combined income hits $10K/month",                               xp: 300, type: "payout",    amount: "$10K/mo" },
      { id: "d3", name: "3-Month Personal Streak", desc: "Personal account profitable 3 consecutive months",           xp: 250, type: "milestone" },
      { id: "d4", name: "$25K Lifetime",        desc: "Lifetime trading income reaches $25K",                          xp: 250, type: "payout",    amount: "$25K" },
      { id: "d5", name: "$20K Month",           desc: "Combined monthly income hits $20K",                             xp: 300, type: "payout",    amount: "$20K/mo" },
    ],
  },
  {
    id: 5,
    name: "Independent",
    subtitle: "Full-Time Trader",
    tier: "STAGE 5",
    accent: "#ec4899",
    accentLight: "rgba(236,72,153,0.1)",
    accentGlow: "rgba(236,72,153,0.3)",
    gradient: "linear-gradient(135deg, #ec4899 0%, #db2777 100%)",
    bgGradient: "linear-gradient(135deg, rgba(236,72,153,0.08) 0%, rgba(219,39,119,0.04) 100%)",
    xpRequired: 3575,
    description: "Personal capital is primary. Trading is the career. Full financial independence.",
    missions: [
      { id: "e1", name: "$100K Portfolio",      desc: "Personal trading account reaches $100K+",                       xp: 400, type: "milestone", amount: "$100K" },
      { id: "e2", name: "$25K Month",           desc: "Monthly income exceeds $25,000",                                xp: 350, type: "payout",    amount: "$25K/mo" },
      { id: "e3", name: "12-Month Consistency", desc: "12 consecutive profitable months",                              xp: 400, type: "milestone" },
      { id: "e4", name: "Financially Independent", desc: "Trading fully replaces all other income",                    xp: 500, type: "milestone" },
    ],
  },
];

const ALL_MISSIONS = LEVELS.flatMap((l) => l.missions.map((m) => ({ ...m, levelId: l.id, levelName: l.name, levelAccent: l.accent })));
const TOTAL_XP = ALL_MISSIONS.reduce((s, m) => s + m.xp, 0);

// ═══════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════

export default function RoadmapModern({ completed = new Map(), onMissionComplete, onMissionView }) {
  const [selectedLevel, setSelectedLevel] = useState(null);
  const [hoveredMission, setHoveredMission] = useState(null);
  const [confirmMission, setConfirmMission] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [saving, setSaving] = useState(false);

  const currentXP = ALL_MISSIONS.filter((m) => completed.has(m.id)).reduce((s, m) => s + m.xp, 0);
  const currentLevel = [...LEVELS].reverse().find((l) => currentXP >= l.xpRequired) || LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.xpRequired > currentXP);

  const handleMissionClick = (mission, level) => {
    if (completed.has(mission.id)) {
      if (onMissionView) onMissionView(mission, completed.get(mission.id));
    } else {
      setConfirmMission({ mission, level });
      setProofNote("");
      setProofLink("");
    }
  };

  const handleConfirm = async () => {
    if (!confirmMission || !proofNote.trim()) return;
    setSaving(true);
    if (onMissionComplete) {
      await onMissionComplete(confirmMission.mission.id, proofNote.trim(), proofLink.trim());
    }
    setSaving(false);
    setConfirmMission(null);
  };

  const getLevelProgress = (level) => {
    const done = level.missions.filter((m) => completed.has(m.id)).length;
    return { done, total: level.missions.length, pct: Math.round((done / level.missions.length) * 100) };
  };

  const LevelIcon = ({ name, color, size }) => {
    const Comp = Icons[name] || Icons.Foundation;
    return <Comp color={color} size={size} />;
  };

  // ─── DETAIL VIEW ────────────────────────────────────────────────────────
  if (selectedLevel) {
    const level = LEVELS.find((l) => l.id === selectedLevel);
    const progress = getLevelProgress(level);

    return (
      <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>
        <button
          onClick={() => setSelectedLevel(null)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "10px 20px", borderRadius: 12,
            background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
            color: "var(--text-secondary)", fontSize: 13, fontWeight: 600,
            cursor: "pointer", marginBottom: 24, transition: "all 0.2s ease",
            fontFamily: "inherit",
          }}
          onMouseEnter={e => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.background = "var(--bg-tertiary)"; }}
          onMouseLeave={e => { e.currentTarget.style.color = "var(--text-secondary)"; e.currentTarget.style.background = "var(--bg-secondary)"; }}
        >
          ← Back to Roadmap
        </button>

        {/* Level Header */}
        <div style={{
          borderRadius: 20, padding: "28px", marginBottom: 32,
          background: level.bgGradient, border: `1px solid ${level.accent}30`,
          position: "relative", overflow: "hidden",
        }}>
          <div style={{ height: 2, background: level.gradient, borderRadius: "20px 20px 0 0", position: "absolute", top: 0, left: 0, right: 0 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 20, marginBottom: 16 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, flexShrink: 0,
              background: `${level.accent}18`, border: `1px solid ${level.accent}40`,
              boxShadow: `0 0 20px ${level.accent}15`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <LevelIcon name={level.name} color={level.accent} size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4, flexWrap: "wrap" }}>
                <span style={{ fontFamily: "inherit", fontSize: 20, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
                  {level.name}
                </span>
                <span style={{
                  padding: "3px 10px", borderRadius: 12, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  background: `${level.accent}20`, color: level.accent, border: `1px solid ${level.accent}30`,
                }}>
                  {level.tier}
                </span>
              </div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{level.subtitle}</div>
            </div>
          </div>

          <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, marginBottom: 20 }}>
            {level.description}
          </div>

          <div style={{ height: 6, borderRadius: 3, background: "var(--border-primary)", overflow: "hidden", marginBottom: 10 }}>
            <div style={{
              height: "100%", borderRadius: 3, background: level.gradient,
              boxShadow: `0 0 12px ${level.accent}40`,
              width: `${progress.pct}%`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
            }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)" }}>
            <span>{progress.done} of {progress.total} missions completed</span>
            <span>{progress.pct}%</span>
          </div>
        </div>

        {/* Missions Grid */}
        <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>
          Missions
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
          {level.missions.map((mission, index) => {
            const isCompleted = completed.has(mission.id);
            const meta = TYPE_META[mission.type];
            const isHovered = hoveredMission === mission.id;

            return (
              <div
                key={mission.id}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 16,
                  padding: "18px", borderRadius: 12, cursor: "pointer",
                  background: isCompleted ? `${level.accent}08` : isHovered ? "var(--bg-tertiary)" : "var(--bg-secondary)",
                  border: isCompleted ? `1px solid ${level.accent}30` : "1px solid var(--border-primary)",
                  transform: isHovered && !isCompleted ? "translateY(-2px)" : "none",
                  boxShadow: isHovered && !isCompleted ? "0 8px 24px rgba(0,0,0,0.15)" : "none",
                  transition: "all 0.2s ease",
                  animation: `slideUp 0.4s ease ${index * 0.06}s both`,
                }}
                onClick={() => handleMissionClick(mission, level)}
                onMouseEnter={() => setHoveredMission(mission.id)}
                onMouseLeave={() => setHoveredMission(null)}
              >
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: isCompleted ? "#10b981" : "transparent",
                  border: isCompleted ? "2px solid #10b981" : "2px solid var(--border-primary)",
                  boxShadow: isCompleted ? "0 0 12px rgba(16,185,129,0.4)" : "none",
                  transition: "all 0.3s ease",
                }}>
                  {isCompleted && <Icons.Check color="#fff" size={14} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text-primary)", marginBottom: 4 }}>
                    {mission.name}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.5, marginBottom: 8 }}>
                    {mission.desc}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 600,
                      letterSpacing: "0.05em", background: meta.bg, color: meta.color,
                      border: `1px solid ${meta.color}30`,
                    }}>
                      <meta.Icon size={10} color={meta.color} />
                      {meta.label}
                    </span>
                    {mission.amount && (
                      <span style={{
                        display: "inline-flex", alignItems: "center", gap: 4,
                        padding: "3px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                        background: "rgba(251,191,36,0.1)", color: "#fbbf24",
                        border: "1px solid rgba(251,191,36,0.2)",
                      }}>
                        <Icons.Money size={10} color="#fbbf24" />
                        {mission.amount}
                      </span>
                    )}
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 8px", borderRadius: 6, fontSize: 11, fontWeight: 700,
                      background: "rgba(251,191,36,0.1)", color: "#fbbf24",
                      border: "1px solid rgba(251,191,36,0.2)",
                    }}>
                      <Icons.Lightning size={10} color="#fbbf24" />
                      +{mission.xp} XP
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Proof Submission Modal */}
        {confirmMission && (
          <div
            style={{
              position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
              backdropFilter: "blur(12px)", zIndex: 1000,
              display: "flex", alignItems: "center", justifyContent: "center",
              padding: 24, animation: "fadeIn 0.2s ease",
            }}
            onClick={() => setConfirmMission(null)}
          >
            <div
              style={{
                width: "100%", maxWidth: 440, borderRadius: 24,
                background: "var(--bg-primary)", border: "1px solid var(--border-primary)",
                padding: 32, boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
                animation: "slideUp 0.3s ease",
              }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ textAlign: "center", marginBottom: 24 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 16, margin: "0 auto 16px",
                  background: `${confirmMission.level.accent}18`,
                  border: `1px solid ${confirmMission.level.accent}40`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  <LevelIcon name={confirmMission.level.name} color={confirmMission.level.accent} size={26} />
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
                  Complete Mission
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 12, lineHeight: 1.6 }}>
                  {confirmMission.mission.name}
                </div>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "6px 14px", borderRadius: 20,
                  background: "rgba(251,191,36,0.1)", border: "1px solid rgba(251,191,36,0.3)",
                  color: "#fbbf24", fontSize: 14, fontWeight: 700,
                }}>
                  <Icons.Lightning size={13} color="#fbbf24" />
                  +{confirmMission.mission.xp} XP
                </span>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  What did you accomplish? *
                </label>
                <textarea
                  value={proofNote}
                  onChange={e => setProofNote(e.target.value)}
                  placeholder="Describe how you completed this mission..."
                  rows={3}
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)", fontSize: 14, outline: "none",
                    fontFamily: "inherit", resize: "vertical", minHeight: 90,
                    lineHeight: 1.5, boxSizing: "border-box", marginBottom: 12,
                  }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                  Evidence Link (optional)
                </label>
                <input
                  value={proofLink}
                  onChange={e => setProofLink(e.target.value)}
                  placeholder="URL to screenshot, journal, etc."
                  style={{
                    width: "100%", padding: "12px 14px", borderRadius: 10,
                    background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)", fontSize: 14, outline: "none",
                    fontFamily: "inherit", boxSizing: "border-box",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  onClick={() => setConfirmMission(null)}
                  style={{
                    flex: 1, padding: "13px 20px", borderRadius: 10,
                    background: "transparent", border: "1px solid var(--border-primary)",
                    color: "var(--text-secondary)", fontSize: 14, fontWeight: 600,
                    cursor: "pointer", fontFamily: "inherit",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={!proofNote.trim() || saving}
                  style={{
                    flex: 1, padding: "13px 20px", borderRadius: 10,
                    background: !proofNote.trim() || saving ? "var(--bg-tertiary)" : confirmMission.level.gradient,
                    border: "none", color: !proofNote.trim() || saving ? "var(--text-tertiary)" : "#fff",
                    fontSize: 14, fontWeight: 700, cursor: !proofNote.trim() || saving ? "not-allowed" : "pointer",
                    fontFamily: "inherit", transition: "all 0.2s",
                  }}
                >
                  {saving ? "Saving..." : "Complete Mission"}
                </button>
              </div>
            </div>
          </div>
        )}

        <style>{`
          @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
          @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        `}</style>
      </div>
    );
  }

  // ─── OVERVIEW VIEW ──────────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: "'Plus Jakarta Sans', -apple-system, sans-serif" }}>

      {/* Banner */}
      <PageBanner
        label="TRADER ROADMAP"
        title="From breakeven to independence."
        subtitle="Complete missions, earn XP, and level up through 5 stages of your trading journey."
      />

      {/* Stats Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14, marginBottom: 32 }}>
        {[
          { label: "Total XP",     value: currentXP.toLocaleString(), sub: `/ ${TOTAL_XP.toLocaleString()}`,                              color: "#fbbf24" },
          { label: "Current Level",value: `Stage ${currentLevel.id}`, sub: currentLevel.name,                                            color: currentLevel.accent },
          { label: "Missions Done",value: `${completed.size}`,        sub: `/ ${ALL_MISSIONS.length} total`,                             color: "#10b981" },
          { label: "Next Goal",    value: nextLevel ? nextLevel.name : "MAX", sub: nextLevel ? `${(nextLevel.xpRequired - currentXP).toLocaleString()} XP to go` : "You made it!", color: nextLevel?.accent || "#ec4899" },
        ].map((s, i) => (
          <div key={i} style={{
            borderRadius: 14, padding: "18px 20px",
            background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
            overflow: "hidden", position: "relative",
          }}>
            <div style={{ height: 2, background: s.color, opacity: 0.7, position: "absolute", top: 0, left: 0, right: 0, borderRadius: "14px 14px 0 0" }} />
            <div style={{ fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>
              {s.label}
            </div>
            <div style={{ fontSize: 20, fontWeight: 800, color: s.color, lineHeight: 1.1, marginBottom: 4, letterSpacing: "-0.02em" }}>
              {s.value}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-tertiary)" }}>{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Level Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {LEVELS.map((level, index) => {
          const progress = getLevelProgress(level);
          const isActive = currentXP >= level.xpRequired || index === 0;
          const isCurrent = level.id === currentLevel.id;
          const isCompleted = progress.done === progress.total;

          return (
            <div
              key={level.id}
              onClick={() => isActive && setSelectedLevel(level.id)}
              style={{
                position: "relative", borderRadius: 18, padding: "24px 28px",
                background: isCurrent ? level.bgGradient : "var(--bg-secondary)",
                border: isCurrent ? `1px solid ${level.accent}30` : "1px solid var(--border-primary)",
                boxShadow: isCurrent ? `0 0 30px ${level.accent}08` : "none",
                opacity: isActive ? 1 : 0.4,
                cursor: isActive ? "pointer" : "not-allowed",
                transition: "all 0.25s ease",
                animation: `slideUp 0.5s ease ${index * 0.08}s both`,
                overflow: "hidden",
              }}
              onMouseEnter={e => { if (isActive) e.currentTarget.style.transform = "translateY(-1px)"; }}
              onMouseLeave={e => { e.currentTarget.style.transform = "none"; }}
            >
              {/* accent top bar on current level */}
              {isCurrent && (
                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: level.gradient, borderRadius: "18px 18px 0 0" }} />
              )}

              <div style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 16 }}>
                <div style={{
                  width: 56, height: 56, borderRadius: 14, flexShrink: 0,
                  background: `${level.accent}15`, border: `1px solid ${level.accent}30`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: isCurrent ? `0 0 20px ${level.accent}20` : "none",
                }}>
                  {isCompleted
                    ? <Icons.Check color={level.accent} size={24} />
                    : <LevelIcon name={level.name} color={level.accent} size={24} />
                  }
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 4 }}>
                    <span style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{level.name}</span>
                    <span style={{
                      padding: "2px 9px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                      letterSpacing: "0.1em", textTransform: "uppercase",
                      background: `${level.accent}15`, color: level.accent, border: `1px solid ${level.accent}25`,
                    }}>
                      {level.tier}
                    </span>
                    {isCurrent && (
                      <span style={{
                        padding: "2px 9px", borderRadius: 10, fontSize: 9, fontWeight: 700,
                        letterSpacing: "0.1em", textTransform: "uppercase",
                        background: `${level.accent}25`, color: level.accent, border: `1px solid ${level.accent}40`,
                        animation: "pulse 2s infinite",
                      }}>
                        ● Current
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>{level.subtitle}</div>
                </div>

                {isActive && (
                  <div style={{ fontSize: 14, color: "var(--text-tertiary)", flexShrink: 0 }}>→</div>
                )}
              </div>

              <div style={{ height: 5, borderRadius: 3, background: "var(--border-primary)", overflow: "hidden", marginBottom: 8 }}>
                <div style={{
                  height: "100%", borderRadius: 3, background: level.gradient,
                  boxShadow: progress.pct > 0 ? `0 0 8px ${level.accent}30` : "none",
                  width: `${progress.pct}%`, transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
                }} />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "var(--text-tertiary)" }}>
                <span>{progress.done}/{progress.total} missions</span>
                <span>{progress.pct}% complete</span>
              </div>
            </div>
          );
        })}
      </div>

      <style>{`
        @keyframes slideUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn  { from { opacity:0; } to { opacity:1; } }
        @keyframes pulse   { 0%,100% { opacity:1; } 50% { opacity:0.6; } }
      `}</style>
    </div>
  );
}

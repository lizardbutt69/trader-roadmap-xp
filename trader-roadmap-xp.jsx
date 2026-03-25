import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./src/supabase.js";
import { ChecklistView, JournalView, TradeStatsView, TradingStatsView, AccountsView, DashboardView, WatchlistView } from "./src/trading.jsx";

// ─── THEME ──────────────────────────────────────────────────────────────────

const LIGHT_THEME = {
  "--bg-primary": "#f0f2f5",
  "--bg-secondary": "#ffffff",
  "--bg-tertiary": "#f5f7fa",
  "--bg-input": "#f5f7fa",
  "--border-primary": "#d8dce3",
  "--border-secondary": "#e2e6eb",
  "--border-glow": "rgba(0,180,150,0.1)",
  "--border-glow-shadow": "none",
  "--text-primary": "#0f1117",
  "--text-secondary": "#5a6577",
  "--text-tertiary": "#8a95a5",
  "--text-accent": "#00b896",
  "--accent": "#00b896",
  "--accent-dim": "#00b89630",
  "--accent-glow": "rgba(0,184,150,0.06)",
  "--accent-glow-strong": "rgba(0,184,150,0.15)",
  "--accent-secondary": "#3b82f6",
  "--card-shadow": "0 1px 4px rgba(0,0,0,0.06)",
  "--card-glow": "0 1px 4px rgba(0,0,0,0.06)",
  "--green": "#00b896",
  "--red": "#e53e3e",
  "--gold": "#d69e2e",
  "--purple": "#805ad5",
  "--hud-grid": "rgba(0,0,0,0.02)",
};

const DARK_THEME = {
  "--bg-primary": "#0a0a0f",
  "--bg-secondary": "#0f1117",
  "--bg-tertiary": "#141820",
  "--bg-input": "#141820",
  "--border-primary": "rgba(0,232,196,0.18)",
  "--border-secondary": "rgba(0,232,196,0.10)",
  "--border-glow": "rgba(0,232,196,0.15)",
  "--border-glow-shadow": "0 0 8px rgba(0,232,196,0.12), 0 0 2px rgba(0,232,196,0.06)",
  "--text-primary": "#e0e6ed",
  "--text-secondary": "#7a8a9e",
  "--text-tertiary": "#4a5568",
  "--text-accent": "#00e8c4",
  "--accent": "#00e8c4",
  "--accent-dim": "#00e8c440",
  "--accent-glow": "rgba(0,232,196,0.08)",
  "--accent-glow-strong": "rgba(0,232,196,0.2)",
  "--accent-secondary": "#3b82f6",
  "--card-shadow": "0 0 20px rgba(0,0,0,0.4), 0 0 2px rgba(0,232,196,0.05)",
  "--card-glow": "0 0 15px rgba(0,232,196,0.06), 0 0 8px rgba(0,232,196,0.1), inset 0 1px 0 rgba(0,232,196,0.05)",
  "--green": "#00e8c4",
  "--red": "#ff4757",
  "--gold": "#ffa502",
  "--purple": "#a78bfa",
  "--hud-grid": "rgba(0,232,196,0.03)",
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
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 4,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          position: "relative",
          boxShadow: `0 0 8px ${color}40`,
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
        borderRadius: 8,
        border: "1px solid var(--border-primary)",
        boxShadow: hovered && hoverable
          ? "0 0 30px var(--accent-glow-strong), 0 0 2px var(--border-glow)"
          : "var(--card-shadow)",
        transition: "all 0.3s cubic-bezier(.4,0,.2,1)",
        transform: hovered && hoverable ? "translateY(-1px)" : "none",
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
        fontFamily: "'JetBrains Mono', monospace",
      }}
    >
      {icon && <span style={{ fontSize: 12 }}>{icon}</span>}
      {label}
    </span>
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
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: isActive ? "var(--text-primary)" : "var(--text-tertiary)" }}>
            {level.name}
          </span>
          <Chip label={level.tier} color={level.accent} />
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 14, color: "var(--text-secondary)", marginBottom: 8 }}>
          {level.subtitle}
        </div>
        <XPBar current={done} max={total} color={level.accent} height={8} />
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", marginTop: 5, textAlign: "right" }}>
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
  return (
    <div
      onClick={onToggle}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "14px 16px",
        borderRadius: 6,
        background: completed ? `${meta.color}08` : "var(--bg-tertiary)",
        border: `1.5px solid ${completed ? `${meta.color}35` : "var(--border-primary)"}`,
        cursor: "pointer",
        transition: "all 0.25s",
        animation: `fadeSlideIn 0.35s ease ${delay}s both`,
      }}
    >
      {/* Check circle */}
      <div
        style={{
          width: 28,
          height: 28,
          borderRadius: 4,
          border: `2px solid ${completed ? meta.color : "var(--border-primary)"}`,
          background: completed ? meta.color : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.25s",
        }}
      >
        {completed && <span style={{ color: "var(--bg-primary)", fontSize: 14, lineHeight: 1 }}>✓</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: 14,
              color: completed ? meta.color : "var(--text-primary)",
            }}
          >
            {ach.name}
          </span>
          <Chip label={meta.label} color={meta.color} icon={meta.icon} />
          {ach.amount && <Chip label={ach.amount} color="var(--gold)" icon="💰" />}
        </div>
        <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.4 }}>
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
          fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
          fontSize: 13,
          color: completed ? meta.color : "var(--gold)",
          flexShrink: 0,
          background: completed ? `${meta.color}12` : "var(--accent-glow)",
          padding: "4px 10px",
          borderRadius: 4,
          whiteSpace: "nowrap",
        }}
      >
        {completed ? "✓ " : "+"}
        {ach.xp}
      </div>
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
  const [editName, setEditName] = useState("");
  const avatarInputRef = useRef(null);

  // Trading app state
  const [trades, setTrades] = useState([]);
  const [gsUrl, setGsUrl] = useState(() => { try { return localStorage.getItem("gsUrl") || ""; } catch { return ""; } });

  const syncToSheets = useCallback(async (data) => {
    const url = gsUrl || (() => { try { return localStorage.getItem("gsUrl") || ""; } catch { return ""; } })();
    if (!url) return;
    try { await fetch(url, { method: "POST", body: JSON.stringify(data) }); } catch (e) {}
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
    setShowProfileEditor(false);
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
    @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes scanline { 0% { transform: translateY(-100%); } 100% { transform: translateY(100vh); } }
    @keyframes hudPulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 1; } }
    @keyframes dataFlicker { 0%, 100% { opacity: 1; } 50% { opacity: 0.97; } }
    @keyframes glowPulse { 0%, 100% { box-shadow: 0 0 10px var(--accent-glow), inset 0 1px 0 var(--border-glow); } 50% { box-shadow: 0 0 20px var(--accent-glow-strong), inset 0 1px 0 var(--border-glow); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    * { box-sizing:border-box; margin:0; padding:0; }
    body { background: var(--bg-primary); color: var(--text-primary); font-family: 'Inter', sans-serif; }
    ::-webkit-scrollbar { width: 4px; }
    ::-webkit-scrollbar-track { background: var(--bg-primary); }
    ::-webkit-scrollbar-thumb { background: var(--accent-dim); border-radius: 2px; }
    button, input, textarea, select { font-family: inherit; }
    textarea:focus, input:focus, select:focus { border-color: var(--accent) !important; box-shadow: 0 0 10px var(--accent-glow) !important; }
    ::selection { background: var(--accent-dim); color: var(--text-primary); }
    @media (max-width: 640px) {
      .grid-4 { grid-template-columns: 1fr 1fr !important; }
      .grid-5 { grid-template-columns: repeat(3, 1fr) !important; }
      .grid-week { grid-template-columns: repeat(5, 1fr) !important; gap: 4px !important; }
      .card-pad { padding: 14px !important; }
      .form-grid { grid-template-columns: 1fr !important; }
      .modal-card { max-width: 100% !important; padding: 20px !important; margin: 10px !important; }
      .stat-val { font-size: 18px !important; }
      .nav-tabs { gap: 3px !important; padding: 8px 10px !important; overflow-x: auto !important; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .nav-tabs::-webkit-scrollbar { display: none; }
      .nav-tab { padding: 6px 10px !important; font-size: 10px !important; white-space: nowrap !important; }
      .main-content { padding: 12px 10px 60px !important; }
      .cal-grid { gap: 3px !important; }
      .cal-day { min-height: 52px !important; padding: 4px !important; font-size: 10px !important; }
      .cal-day-num { font-size: 11px !important; }
      .cal-pnl { font-size: 9px !important; }
      .cal-count { font-size: 8px !important; }
      .section-title { font-size: 11px !important; }
      .drawdown-popup { width: calc(100vw - 24px) !important; right: 12px !important; bottom: 12px !important; padding: 16px !important; }
      .header-bar { padding: 10px 12px !important; }
      .header-bar .header-right { gap: 8px !important; }
      .header-bar .xp-display { display: none !important; }
      .mood-grid { gap: 5px !important; }
      .mood-grid button { padding: 6px 10px !important; font-size: 10px !important; }
      .news-channels { gap: 3px !important; }
      .news-channels button { padding: 5px 8px !important; font-size: 9px !important; }
      .tilt-modal { padding: 24px !important; }
      .tilt-modal h2 { font-size: 16px !important; }
      .trade-table { display: block; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .trade-table table { min-width: 600px; }
    }
  `;

  // ── TRADESHARP LOGO (SVG) ───
  const TradeSharpLogo = ({ size = 64 }) => (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer hexagon */}
      <path d="M32 2L58 17V47L32 62L6 47V17L32 2Z" stroke="#00e8c4" strokeWidth="1.5" fill="none" opacity="0.6" />
      {/* Inner hexagon */}
      <path d="M32 10L50 21V43L32 54L14 43V21L32 10Z" stroke="#00e8c4" strokeWidth="1" fill="rgba(0,232,196,0.04)" />
      {/* Crosshair horizontal */}
      <line x1="20" y1="32" x2="44" y2="32" stroke="#00e8c4" strokeWidth="1.5" opacity="0.8" />
      {/* Crosshair vertical */}
      <line x1="32" y1="20" x2="32" y2="44" stroke="#00e8c4" strokeWidth="1.5" opacity="0.8" />
      {/* Center diamond */}
      <path d="M32 26L38 32L32 38L26 32Z" fill="#00e8c4" opacity="0.9" />
      {/* Corner ticks */}
      <line x1="20" y1="20" x2="24" y2="20" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="20" x2="20" y2="24" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="20" x2="40" y2="20" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="20" x2="44" y2="24" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="44" x2="24" y2="44" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="20" y1="44" x2="20" y2="40" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="44" x2="40" y2="44" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      <line x1="44" y1="44" x2="44" y2="40" stroke="#00e8c4" strokeWidth="1" opacity="0.5" />
      {/* Pulse ring */}
      <circle cx="32" cy="32" r="28" stroke="#00e8c4" strokeWidth="0.5" opacity="0.2">
        <animate attributeName="r" values="28;30;28" dur="3s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.2;0.05;0.2" dur="3s" repeatCount="indefinite" />
      </circle>
    </svg>
  );

  // ── LOADING ───
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#050508", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ marginBottom: 16 }}><TradeSharpLogo size={48} /></div>
          <div style={{ fontSize: 13, color: "#3a4a5c", letterSpacing: "0.15em", textTransform: "uppercase" }}>ESTABLISHING SECURE CONNECTION...</div>
        </div>
      </div>
    );
  }

  // ── LANDING PAGE ───
  if (!user) {
    const accent = "#00e8c4";
    const accentDim = "rgba(0,232,196,0.12)";
    const accentGlow = "rgba(0,232,196,0.06)";
    const sectionStyle = { maxWidth: 1100, margin: "0 auto", padding: "0 24px" };
    const mono = "'JetBrains Mono', monospace";

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
      <div style={{ minHeight: "100vh", background: "#050508", fontFamily: "'Inter', sans-serif", overflowX: "hidden" }}>
        <style>{globalStyles}{`
          .landing-scanline {
            position: fixed; top: 0; left: 0; right: 0; height: 2px;
            background: linear-gradient(90deg, transparent, rgba(0,232,196,0.06), transparent);
            animation: scanline 8s linear infinite;
            pointer-events: none; z-index: 100;
          }
          .auth-input:focus {
            border-color: #00e8c4 !important;
            box-shadow: 0 0 12px rgba(0,232,196,0.15) !important;
          }
          .landing-btn:hover {
            background: rgba(0,232,196,0.08) !important;
            box-shadow: 0 0 30px rgba(0,232,196,0.15) !important;
            transform: translateY(-1px);
          }
          .landing-btn { transition: all 0.2s ease !important; }
          .feature-card {
            transition: all 0.25s ease;
            cursor: default;
          }
          .feature-card:hover {
            border-color: rgba(0,232,196,0.3) !important;
            box-shadow: 0 0 30px rgba(0,232,196,0.08) !important;
            transform: translateY(-2px);
          }
          .landing-nav {
            position: fixed; top: 0; left: 0; right: 0; z-index: 50;
            background: rgba(5,5,8,0.85); backdrop-filter: blur(20px);
            border-bottom: 1px solid rgba(0,232,196,0.08);
          }
          .landing-section { scroll-margin-top: 80px; }
          @keyframes heroFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }
          @keyframes gridPulse {
            0%, 100% { opacity: 0.03; }
            50% { opacity: 0.06; }
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

        <div className="landing-scanline" />

        {/* ── Nav ── */}
        <nav className="landing-nav">
          <div style={{ ...sectionStyle, display: "flex", alignItems: "center", justifyContent: "space-between", height: 64 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <TradeSharpLogo size={32} />
              <span style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: "#e0e6ed", letterSpacing: 3, textTransform: "uppercase" }}>TRADESHARP</span>
            </div>
            <div className="landing-nav-links" style={{ display: "flex", alignItems: "center", gap: 28 }}>
              <a href="#features" style={{ fontFamily: mono, fontSize: 11, color: "#4a5568", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseOver={(e) => e.target.style.color = accent} onMouseOut={(e) => e.target.style.color = "#4a5568"}>Features</a>
              <a href="#auth-section" style={{ fontFamily: mono, fontSize: 11, color: "#4a5568", textDecoration: "none", letterSpacing: "0.1em", textTransform: "uppercase", transition: "color 0.2s" }}
                onMouseOver={(e) => e.target.style.color = accent} onMouseOut={(e) => e.target.style.color = "#4a5568"}>Get Started</a>
              <button onClick={() => document.getElementById("auth-section")?.scrollIntoView({ behavior: "smooth" })}
                style={{ fontFamily: mono, fontSize: 11, fontWeight: 600, padding: "8px 18px", background: "transparent", border: `1px solid ${accentDim}`, color: accent, borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s" }}
              >Sign In</button>
            </div>
          </div>
        </nav>

        {/* ── Hero ── */}
        <section style={{ paddingTop: 140, paddingBottom: 100, position: "relative" }}>
          {/* Background grid pattern */}
          <div style={{ position: "absolute", inset: 0, backgroundImage: `radial-gradient(circle at 1px 1px, rgba(0,232,196,0.04) 1px, transparent 0)`, backgroundSize: "40px 40px", animation: "gridPulse 6s ease-in-out infinite", pointerEvents: "none" }} />
          {/* Radial glow */}
          <div style={{ position: "absolute", top: 0, left: "50%", transform: "translateX(-50%)", width: "100%", height: "100%", background: "radial-gradient(ellipse at 50% 20%, rgba(0,232,196,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />

          <div className="hero-content" style={{ ...sectionStyle, display: "flex", alignItems: "center", gap: 60, position: "relative" }}>
            <div className="hero-text" style={{ flex: 1 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 20, opacity: 0.8 }}>
                TRADING PERFORMANCE SYSTEM
              </div>
              <h1 style={{ fontFamily: mono, fontSize: 44, fontWeight: 700, color: "#e0e6ed", lineHeight: 1.15, marginBottom: 20, letterSpacing: "-0.5px" }}>
                Trade with<br />
                <span style={{ color: accent }}>Precision.</span><br />
                Journal with<br />
                <span style={{ color: accent }}>Purpose.</span>
              </h1>
              <p className="hero-sub" style={{ fontSize: 18, color: "#5a6577", lineHeight: 1.7, marginBottom: 36, maxWidth: 480 }}>
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
                    boxShadow: `0 0 20px ${accentGlow}`,
                  }}
                >GET STARTED FREE</button>
                <button
                  className="landing-btn"
                  onClick={() => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" })}
                  style={{
                    fontFamily: mono, fontSize: 13, fontWeight: 600, padding: "14px 32px",
                    background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "#5a6577",
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
        <section style={{ borderTop: `1px solid ${accentDim}`, borderBottom: `1px solid ${accentDim}`, padding: "40px 0", background: "rgba(0,232,196,0.015)" }}>
          <div style={{ ...sectionStyle, display: "flex", justifyContent: "center", gap: 60, flexWrap: "wrap" }}>
            {[
              ["10-Point", "A+ Checklist"],
              ["AI-Powered", "Trade Reviews"],
              ["Real-Time", "P&L Calendar"],
              ["5-Stage", "Progression Map"],
            ].map(([val, label], i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: accent, marginBottom: 4 }}>{val}</div>
                <div style={{ fontFamily: mono, fontSize: 11, color: "#4a5568", letterSpacing: "0.1em", textTransform: "uppercase" }}>{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="landing-section" style={{ padding: "100px 0" }}>
          <div style={sectionStyle}>
            <div style={{ textAlign: "center", marginBottom: 60 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>FEATURES</div>
              <h2 style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: "#e0e6ed", letterSpacing: "-0.3px", marginBottom: 12 }}>Everything You Need to Level Up</h2>
              <p style={{ fontSize: 16, color: "#4a5568", maxWidth: 540, margin: "0 auto" }}>Built by a trader, for traders. Every feature exists because the process demanded it.</p>
            </div>
            <div className="features-grid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 20 }}>
              {features.map((f, i) => (
                <div key={i} className="feature-card" style={{
                  background: "rgba(15,17,23,0.8)", borderRadius: 8, padding: 28,
                  border: `1px solid ${accentDim}`,
                  boxShadow: "0 0 20px rgba(0,0,0,0.3)",
                }}>
                  <div style={{ fontSize: 28, marginBottom: 14 }}>{f.icon}</div>
                  <h3 style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: "#e0e6ed", marginBottom: 8, letterSpacing: "0.03em" }}>{f.title}</h3>
                  <p style={{ fontSize: 14, color: "#5a6577", lineHeight: 1.7 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How It Works ── */}
        <section style={{ padding: "80px 0", borderTop: `1px solid ${accentDim}` }}>
          <div style={sectionStyle}>
            <div style={{ textAlign: "center", marginBottom: 50 }}>
              <div style={{ fontFamily: mono, fontSize: 11, color: accent, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 12 }}>HOW IT WORKS</div>
              <h2 style={{ fontFamily: mono, fontSize: 28, fontWeight: 700, color: "#e0e6ed", letterSpacing: "-0.3px" }}>Your Daily Trading Workflow</h2>
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
                  <div style={{ fontFamily: mono, fontSize: 14, fontWeight: 700, color: "#e0e6ed", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em" }}>{title}</div>
                  <p style={{ fontSize: 13, color: "#4a5568", lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Auth / Get Started ── */}
        <section id="auth-section" className="landing-section" style={{ padding: "100px 0", borderTop: `1px solid ${accentDim}` }}>
          <div style={{ ...sectionStyle, maxWidth: 440 }}>
            <div style={{ textAlign: "center", marginBottom: 36 }}>
              <div style={{ display: "inline-block", marginBottom: 16 }}><TradeSharpLogo size={56} /></div>
              <h2 style={{ fontFamily: mono, fontSize: 22, fontWeight: 700, color: "#e0e6ed", letterSpacing: "0.05em", marginBottom: 8 }}>
                {authMode === "signup" ? "Create Your Account" : "Welcome Back"}
              </h2>
              <p style={{ fontSize: 14, color: "#4a5568" }}>
                {authMode === "signup" ? "Start journaling your trades in under 60 seconds." : "Sign in to pick up where you left off."}
              </p>
            </div>

            <div style={{
              background: "rgba(10,12,18,0.9)", borderRadius: 8,
              border: `1px solid ${accentDim}`,
              padding: 32, backdropFilter: "blur(20px)",
              boxShadow: `0 0 40px rgba(0,0,0,0.5), 0 0 20px ${accentGlow}`,
            }}>
              <form onSubmit={handleAuth}>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.15em" }}>Email</label>
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
                      outline: "none", background: "rgba(0,232,196,0.02)",
                      color: "#e0e6ed", fontFamily: mono, transition: "all 0.2s ease",
                    }}
                  />
                </div>
                <div style={{ marginBottom: 24 }}>
                  <label style={{ fontFamily: mono, fontSize: 10, fontWeight: 600, color: "#4a5568", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.15em" }}>Password</label>
                  <input
                    className="auth-input"
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    required
                    minLength={12}
                    placeholder="Min 12 characters"
                    style={{
                      width: "100%", padding: "12px 14px", fontSize: 14,
                      border: `1px solid ${accentDim}`, borderRadius: 4,
                      outline: "none", background: "rgba(0,232,196,0.02)",
                      color: "#e0e6ed", fontFamily: mono, transition: "all 0.2s ease",
                    }}
                  />
                </div>
                {authError && (
                  <div style={{
                    fontSize: 12, color: "#e53e3e", marginBottom: 16, padding: "10px 14px",
                    background: "rgba(229,62,62,0.06)", borderRadius: 4, border: "1px solid rgba(229,62,62,0.15)",
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
                    boxShadow: `0 0 20px ${accentGlow}`,
                    fontFamily: mono, letterSpacing: "0.12em", textTransform: "uppercase",
                  }}
                >
                  {authMode === "signup" ? "Create Account" : "Sign In"}
                </button>
              </form>
              <div style={{ textAlign: "center", marginTop: 20 }}>
                <button
                  onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                  style={{ fontSize: 12, color: "#4a5568", background: "none", border: "none", cursor: "pointer", fontWeight: 500, fontFamily: mono }}
                >
                  {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer style={{ borderTop: `1px solid ${accentDim}`, padding: "40px 0" }}>
          <div style={{ ...sectionStyle, display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <TradeSharpLogo size={24} />
              <span style={{ fontFamily: mono, fontSize: 12, fontWeight: 600, color: "#3a4a5c", letterSpacing: 2, textTransform: "uppercase" }}>TRADESHARP</span>
            </div>
            <div style={{ fontFamily: mono, fontSize: 10, color: "#2a3444", letterSpacing: "0.1em", textTransform: "uppercase" }}>
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
        fontFamily: "'Inter', sans-serif",
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
            <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 4, letterSpacing: "0.05em", textTransform: "uppercase" }}>
                  Submit Proof
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>
                  {ach?.name}
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--gold)", marginTop: 4 }}>
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
                    fontFamily: "'Inter', sans-serif",
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
                    fontFamily: "'Inter', sans-serif",
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
                    fontFamily: "'JetBrains Mono', monospace",
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
                    boxShadow: proofNote.trim() && !saving ? "0 0 20px var(--accent-glow)" : "none",
                    transition: "all 0.2s",
                    fontFamily: "'JetBrains Mono', monospace",
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
            <Card className="modal-card" style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: meta?.color || "var(--text-primary)" }}>
                  {ach?.name}
                </div>
                <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginTop: 4 }}>
                  Completed {proof?.completedAt ? new Date(proof.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                </div>
              </div>

              <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                  Proof
                </div>
                <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {proof?.note || "(no note)"}
                </div>
              </div>

              {proof?.link && (
                <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
                    fontFamily: "'JetBrains Mono', monospace",
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
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                >
                  Close
                </button>
              </div>
            </Card>
          </div>
        );
      })()}

      {/* ── Tilt Alert Modal ── */}
      {showTilt && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(10px)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setShowTilt(false)}
        >
          <div style={{
            maxWidth: 420, width: "100%", background: "#1a0a0a", borderRadius: 8,
            border: "1px solid rgba(229,62,62,0.4)", padding: 36, textAlign: "center",
            boxShadow: "0 0 60px rgba(229,62,62,0.15), 0 0 20px rgba(229,62,62,0.1)",
            animation: "fadeSlideIn 0.3s ease",
          }} className="tilt-modal">
            <div style={{ fontSize: 48, marginBottom: 20 }}>
              <svg width="48" height="48" viewBox="0 0 48 48" fill="none" stroke="#e53e3e" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M24 4L44 40H4L24 4Z" fill="rgba(229,62,62,0.08)" />
                <line x1="24" y1="18" x2="24" y2="28" />
                <circle cx="24" cy="33" r="1" fill="#e53e3e" />
              </svg>
            </div>
            <h2 style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700,
              color: "#e53e3e", letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: 16,
            }}>TILT DETECTED</h2>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "#ff6b6b",
              letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 20,
              padding: "8px 16px", background: "rgba(229,62,62,0.06)", borderRadius: 4,
              border: "1px solid rgba(229,62,62,0.15)",
            }}>PROTOCOL ACTIVATED</div>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#ccc",
              lineHeight: 1.8, marginBottom: 12,
            }}>
              You are emotional. You are not thinking clearly.
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#ccc",
              lineHeight: 1.8, marginBottom: 12,
            }}>
              <strong style={{ color: "#e53e3e" }}>Close the charts. Step away from the screen.</strong>
            </p>
            <p style={{
              fontFamily: "'Inter', sans-serif", fontSize: 15, color: "#ccc",
              lineHeight: 1.8, marginBottom: 28,
            }}>
              No trade is worth your account. No revenge trade has ever ended well. Protect your capital — come back tomorrow with a clear head.
            </p>
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#666",
              letterSpacing: "0.1em", marginBottom: 24,
            }}>
              "Discipline is choosing between what you want now and what you want most."
            </div>
            <button
              onClick={() => setShowTilt(false)}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700,
                padding: "14px 32px", background: "transparent",
                border: "1px solid rgba(229,62,62,0.4)", color: "#e53e3e",
                borderRadius: 4, cursor: "pointer", letterSpacing: "0.1em",
                textTransform: "uppercase", transition: "all 0.2s",
              }}
            >
              I Understand
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
          <Card className="modal-card" style={{ maxWidth: 380, padding: 28, width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>Edit Profile</div>
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
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Display Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your trader name..."
                style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: "1.5px solid var(--border-primary)", borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowProfileEditor(false)}
                style={{ flex: 1, fontSize: 13, fontWeight: 600, padding: "12px", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace" }}>
                Cancel
              </button>
              <button onClick={saveProfile}
                style={{ flex: 1, fontSize: 13, fontWeight: 700, padding: "12px", background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "0 0 20px var(--accent-glow)", fontFamily: "'JetBrains Mono', monospace" }}>
                Save
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div className="header-bar" style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", borderTop: "1px solid var(--border-glow)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                onClick={() => { setEditName(profile.display_name); setShowProfileEditor(true); }}
                style={{
                  width: 38, height: 38, borderRadius: "50%", cursor: "pointer",
                  background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : `linear-gradient(135deg, ${currentLevel.accent}, ${currentLevel.accent}cc)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  border: `2px solid ${currentLevel.accent}40`, flexShrink: 0,
                }}
              >
                {!profile.avatar_url && <span style={{ fontSize: 16, color: "var(--bg-primary)", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-secondary)" }}>{displayName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)" }}>
                    {currentLevel.name}
                  </span>
                  <Chip label={currentLevel.tier} color={currentLevel.accent} />
                </div>
              </div>
            </div>
            <div className="header-right" style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className="xp-display" style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: "var(--gold)", textShadow: "0 0 10px var(--accent-glow)" }}>
                  {currentXP.toLocaleString()} XP
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)" }}>
                  / {TOTAL_XP.toLocaleString()}
                </div>
              </div>
              <button
                onClick={() => setDark(d => !d)}
                title="Toggle dark mode"
                style={{
                  fontSize: 18, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                  borderRadius: 4, padding: "0 10px", cursor: "pointer", height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {dark ? "☀️" : "🌙"}
              </button>
              <button
                onClick={() => setShowTilt(true)}
                title="Tilt alert — step away"
                style={{
                  fontSize: 16, background: "rgba(229,62,62,0.1)", border: "1px solid rgba(229,62,62,0.3)",
                  borderRadius: 4, padding: "0 10px", cursor: "pointer", height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  transition: "all 0.2s",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="#e53e3e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="9" cy="9" r="7.5" /><line x1="9" y1="5.5" x2="9" y2="9.5" /><circle cx="9" cy="12" r="0.5" fill="#e53e3e" />
                </svg>
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                  borderRadius: 4, padding: "0 10px", cursor: "pointer", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em", height: 34,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                Sign out
              </button>
            </div>
          </div>
          <XPBar
            current={nextLevel ? currentXP - currentLevel.xpRequired : 1}
            max={nextLevel ? nextLevel.xpRequired - currentLevel.xpRequired : 1}
            color={currentLevel.accent}
            height={8}
          />
          {nextLevel && (
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textAlign: "right", marginTop: 4, letterSpacing: "0.05em" }}>
              {(nextLevel.xpRequired - currentXP).toLocaleString()} XP to {nextLevel.name}
            </div>
          )}
        </div>
      </div>

      {/* ── Nav Tabs ── */}
      <div className="nav-tabs" style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 20px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
        <button
          className="nav-tab"
          onClick={() => { setView("map"); setSelectedLevel(null); }}
          title="Home"
          style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: "8px 12px",
            background: "transparent", border: "1px solid transparent",
            color: "var(--text-tertiary)", borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
            display: "flex", alignItems: "center",
          }}
        >
          <div style={{
            width: 10, height: 10, borderRadius: "50%",
            background: "var(--green)",
            boxShadow: "0 0 8px var(--green), 0 0 16px var(--green)",
          }} />
        </button>
        {[
          { key: "roadmap", label: "ROADMAP", reset: true },
          { key: "checklist", label: "CHECKLIST" },
          { key: "journal", label: "JOURNAL" },
          { key: "watchlist", label: "WATCHLIST" },
          { key: "accounts", label: "ACCOUNTS" },
          { key: "stats", label: "STATS" },
        ].map((tab) => (
          <button
            key={tab.key}
            className="nav-tab"
            onClick={() => { setView(tab.key); if (tab.reset) setSelectedLevel(null); }}
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: 13,
              fontWeight: view === tab.key ? 700 : 500,
              padding: "8px 20px",
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              background: view === tab.key ? "var(--accent-glow)" : "transparent",
              border: view === tab.key ? "1px solid var(--accent-dim)" : "1px solid transparent",
              color: view === tab.key ? "var(--accent)" : "var(--text-tertiary)",
              borderRadius: 4,
              cursor: "pointer",
              transition: "all 0.2s",
              boxShadow: view === tab.key ? "0 0 10px var(--accent-glow)" : "none",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div className="main-content" style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* HOME — default view */}
        {view === "map" && (
          <DashboardView supabase={supabase} user={user} trades={trades} syncToSheets={syncToSheets} />
        )}

        {/* MAP VIEW — Trail Style */}
        {view === "roadmap" && !selectedLevel && (
          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
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
                      width: 24, height: 24, borderRadius: "50%", flexShrink: 0,
                      background: allDone ? level.accent : isCurrent ? "var(--bg-secondary)" : isPast ? level.accent + "88" : "var(--bg-tertiary)",
                      border: `3px solid ${allDone ? level.accent : isCurrent ? level.accent : isPast ? level.accent + "66" : "var(--border-primary)"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isCurrent ? `0 0 14px ${level.accent}50, 0 0 4px var(--accent-glow)` : "none",
                      transition: "all 0.3s",
                    }}>
                      {allDone && <span style={{ fontSize: 11, color: "var(--bg-primary)", lineHeight: 1 }}>✓</span>}
                      {isCurrent && !allDone && <div style={{ width: 10, height: 10, borderRadius: "50%", background: level.accent, animation: "pulse 2s infinite" }} />}
                    </div>

                    {/* Card */}
                    <div
                      onClick={isActive ? () => { setSelectedLevel(level.id); setView("level"); } : undefined}
                      style={{
                        flex: 1,
                        padding: "16px 18px",
                        borderRadius: 6,
                        background: isCurrent ? "var(--bg-secondary)" : isActive ? "var(--bg-secondary)" : "var(--bg-tertiary)",
                        border: isCurrent ? `2px solid ${level.accent}` : allDone ? `2px solid ${level.accent}55` : `1.5px solid var(--border-primary)`,
                        cursor: isActive ? "pointer" : "default",
                        opacity: isActive ? 1 : 0.55,
                        transition: "all 0.3s",
                        boxShadow: isCurrent ? `0 0 20px ${level.accent}18, inset 0 1px 0 var(--border-glow)` : "var(--card-shadow)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <ProgressRing pct={pct} size={48} stroke={4} color={level.accent}>
                          <span style={{ fontSize: 20 }}>{allDone ? "⭐" : level.icon}</span>
                        </ProgressRing>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: isActive ? "var(--text-primary)" : "var(--text-tertiary)" }}>
                              {level.name}
                            </span>
                            <Chip label={level.tier} color={level.accent} />
                            {isCurrent && <Chip label="YOU ARE HERE" color={level.accent} />}
                          </div>
                          <div style={{ fontSize: 14, color: "var(--text-secondary)", marginBottom: 6 }}>{level.subtitle}</div>
                          <XPBar current={done} max={total} color={level.accent} height={6} />
                          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", marginTop: 4, textAlign: "right" }}>
                            {done}/{total} quests · {pct}%
                          </div>
                        </div>
                        {isActive && <div style={{ fontSize: 18, color: "var(--text-tertiary)", flexShrink: 0 }}>›</div>}
                      </div>
                    </div>
                  </div>

                  {/* Connector line between nodes */}
                  {!isLast && (
                    <div style={{ display: "flex", alignItems: "stretch", gap: 16 }}>
                      <div style={{ width: 24, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 3, height: 20,
                          background: isPast ? LEVELS[i + 1]?.accent || "var(--border-primary)" : isCurrent ? `linear-gradient(to bottom, ${level.accent}, var(--border-primary))` : "var(--bg-tertiary)",
                          borderRadius: 3,
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
                <Card key={i} style={{ padding: 20, animation: `fadeSlideIn 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 18 }}>{s.icon}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em" }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 18, color: s.color, marginBottom: 2 }}>
                    {s.value}
                  </div>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)" }}>{s.sub}</div>
                </Card>
              ))}
            </div>

            {/* Trading Performance */}
            {trades.length > 0 && (
              <TradingStatsView trades={trades} />
            )}
          </div>
        )}

        {/* LEVEL DETAIL VIEW */}
        {view === "level" && selectedData && (
          <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
            <button
              onClick={() => { setView("roadmap"); setSelectedLevel(null); }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                color: "var(--text-tertiary)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
                letterSpacing: "0.05em",
              }}
            >
              ← BACK TO ROADMAP
            </button>

            <Card style={{ padding: 24, marginBottom: 20, background: "var(--bg-secondary)", border: `1.5px solid ${selectedData.accent}35` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 38 }}>{selectedData.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 16, color: "var(--text-primary)" }}>
                      {selectedData.name}
                    </span>
                    <Chip label={selectedData.tier} color={selectedData.accent} />
                  </div>
                  <div style={{ fontSize: 14, color: "var(--text-secondary)" }}>{selectedData.subtitle}</div>
                </div>
              </div>
              <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 14 }}>
                {selectedData.description}
              </div>
              <XPBar
                current={selectedData.achievements.filter((a) => completed.has(a.id)).length}
                max={selectedData.achievements.length}
                color={selectedData.accent}
              />
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", textAlign: "right", marginTop: 6 }}>
                {selectedData.achievements.filter((a) => completed.has(a.id)).length}/{selectedData.achievements.length} complete
              </div>
            </Card>

            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
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

        {/* CHECKLIST VIEW */}
        {view === "checklist" && (
          <ChecklistView supabase={supabase} user={user} />
        )}

        {/* JOURNAL VIEW */}
        {view === "journal" && (
          <JournalView supabase={supabase} user={user} loadTrades={loadTrades} syncToSheets={syncToSheets} gsUrl={gsUrl} setGsUrl={setGsUrl} />
        )}

        {/* STATS VIEW — Trade performance data */}
        {view === "stats" && (
          <TradeStatsView supabase={supabase} user={user} trades={trades} loadTrades={loadTrades} />
        )}

        {/* WATCHLIST VIEW */}
        {view === "watchlist" && (
          <WatchlistView supabase={supabase} user={user} />
        )}

        {/* ACCOUNTS VIEW */}
        {view === "accounts" && (
          <AccountsView supabase={supabase} user={user} />
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11, color: "var(--text-tertiary)", letterSpacing: 4, textTransform: "uppercase" }}>
          TRADESHARP · THE FRACTAL MODEL
        </span>
      </div>
    </div>
  );
}

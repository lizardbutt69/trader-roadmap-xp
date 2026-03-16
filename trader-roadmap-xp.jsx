import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./src/supabase.js";
import { ChecklistView, JournalView, TradeStatsView, TradingStatsView, AccountsView } from "./src/trading.jsx";

// ─── THEME ──────────────────────────────────────────────────────────────────

const LIGHT_THEME = {
  "--bg-primary": "#f0f2f5",
  "--bg-secondary": "#ffffff",
  "--bg-tertiary": "#f5f7fa",
  "--bg-input": "#f5f7fa",
  "--border-primary": "#d8dce3",
  "--border-secondary": "#e2e6eb",
  "--border-glow": "rgba(0,180,150,0.1)",
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
  "--border-primary": "#1a2332",
  "--border-secondary": "#1e2a3a",
  "--border-glow": "rgba(0,232,196,0.15)",
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
  "--card-glow": "0 0 15px rgba(0,232,196,0.06), inset 0 1px 0 rgba(0,232,196,0.05)",
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
    name: "The Apprentice",
    subtitle: "Learn the Rules",
    icon: "🌱",
    tier: "BRONZE",
    accent: "#56b886",
    accentLight: "#d0f5e0",
    bg: "linear-gradient(135deg, #e8fdf1 0%, #d0f5e0 100%)",
    cardBg: "#f0faf5",
    xpRequired: 0,
    description: "You found the model. Now build the habits that make it work.",
    achievements: [
      { id: "a1", name: "First Steps", desc: "Define your trading model in writing", xp: 50, type: "process" },
      { id: "a2", name: "Journal Keeper", desc: "Journal 10 consecutive sessions", xp: 75, type: "process" },
      { id: "a3", name: "Session Lock", desc: "NY session only for 2 full weeks", xp: 100, type: "discipline" },
      { id: "a4", name: "Checklist Mode", desc: "Pre-trade thesis on every trade (20 trades)", xp: 100, type: "process" },
      { id: "a5", name: "Rule Book", desc: "Define A+ criteria and commit to paper", xp: 50, type: "process" },
    ],
  },
  {
    id: 2,
    name: "The Grinder",
    subtitle: "Breakeven → Funded",
    icon: "⚔️",
    tier: "SILVER",
    accent: "#e8a838",
    accentLight: "#fdf0d0",
    bg: "linear-gradient(135deg, #fdf5e6 0%, #fce8c3 100%)",
    cardBg: "#fdf8f0",
    xpRequired: 375,
    description: "Pass evals. Get funded. Prove the edge is real under pressure.",
    achievements: [
      { id: "b1", name: "Eval Slayer", desc: "Pass your first funded evaluation", xp: 150, type: "milestone" },
      { id: "b2", name: "A+ Hunter", desc: "Only A+ trades for a full week", xp: 100, type: "discipline" },
      { id: "b3", name: "Two & Done", desc: "2-trade max respected for 10 sessions", xp: 100, type: "discipline" },
      { id: "b4", name: "First Blood", desc: "Receive your first funded payout", xp: 200, type: "payout", amount: "1st Payout" },
      { id: "b5", name: "No Revenge", desc: "Stop after a loss 10 times (no revenge)", xp: 100, type: "discipline" },
      { id: "b6", name: "Hands Off", desc: "Hold to TP without touching SL — 5 times", xp: 125, type: "discipline" },
    ],
  },
  {
    id: 3,
    name: "Funded Warrior",
    subtitle: "Consistent Payouts",
    icon: "🛡️",
    tier: "GOLD",
    accent: "#4a8fe7",
    accentLight: "#d0e4fd",
    bg: "linear-gradient(135deg, #e6f0fd 0%, #c8ddfa 100%)",
    cardBg: "#f0f6fd",
    xpRequired: 1150,
    description: "Multiple accounts running. The payout machine is humming.",
    achievements: [
      { id: "c1", name: "Multi-Account", desc: "3+ funded accounts running", xp: 150, type: "milestone" },
      { id: "c2", name: "Payout Streak", desc: "3 consecutive payout cycles", xp: 200, type: "payout" },
      { id: "c3", name: "$1K Month", desc: "Monthly payouts exceed $1,000", xp: 150, type: "payout", amount: "$1K/mo" },
      { id: "c4", name: "$5K Total", desc: "Lifetime payouts reach $5,000", xp: 200, type: "payout", amount: "$5K" },
      { id: "c5", name: "Five Alive", desc: "5+ funded accounts simultaneously", xp: 175, type: "milestone" },
      { id: "c6", name: "$5K Month", desc: "Monthly payouts exceed $5,000", xp: 250, type: "payout", amount: "$5K/mo" },
    ],
  },
  {
    id: 4,
    name: "The Architect",
    subtitle: "Personal Capital Online",
    icon: "🏗️",
    tier: "PLATINUM",
    accent: "#9b6fe0",
    accentLight: "#ead8fd",
    bg: "linear-gradient(135deg, #f3ecfd 0%, #e2d4f8 100%)",
    cardBg: "#f8f4fd",
    xpRequired: 2275,
    description: "Payouts fuel personal accounts. Dual-engine activated.",
    achievements: [
      { id: "d1", name: "Seed Capital", desc: "Fund personal account from payouts ($2,500+)", xp: 200, type: "payout", amount: "$2.5K seed" },
      { id: "d2", name: "$10K Month", desc: "Combined income hits $10K/month", xp: 300, type: "payout", amount: "$10K/mo" },
      { id: "d3", name: "Personal Edge", desc: "Personal account profitable 3 months straight", xp: 250, type: "milestone" },
      { id: "d4", name: "$25K Total", desc: "Lifetime trading income reaches $25K", xp: 250, type: "payout", amount: "$25K" },
      { id: "d5", name: "$20K Month", desc: "Combined monthly income hits $20K", xp: 300, type: "payout", amount: "$20K/mo" },
    ],
  },
  {
    id: 5,
    name: "The Master",
    subtitle: "Full Independence",
    icon: "👑",
    tier: "DIAMOND",
    accent: "#e05a6d",
    accentLight: "#fdd8dd",
    bg: "linear-gradient(135deg, #fde8ec 0%, #f8cdd4 100%)",
    cardBg: "#fdf2f4",
    xpRequired: 3575,
    description: "Personal capital is primary. You trade for yourself. Freedom unlocked.",
    achievements: [
      { id: "e1", name: "Six Figures", desc: "Personal account reaches $100K+", xp: 400, type: "milestone", amount: "$100K" },
      { id: "e2", name: "$25K Month", desc: "Monthly income exceeds $25,000", xp: 350, type: "payout", amount: "$25K/mo" },
      { id: "e3", name: "The Model Works", desc: "12 consecutive profitable months", xp: 400, type: "milestone" },
      { id: "e4", name: "Freedom", desc: "Trading fully replaces all other income", xp: 500, type: "milestone" },
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

function Card({ children, style = {}, onClick, hoverable = false }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
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
  const [dark, setDark] = useState(() => { try { return localStorage.getItem("theme") === "dark" || !localStorage.getItem("theme"); } catch { return true; } });

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
  const [showIntro, setShowIntro] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [proofNote, setProofNote] = useState("");
  const [proofLink, setProofLink] = useState("");
  const [viewingProof, setViewingProof] = useState(null);
  const [introFade, setIntroFade] = useState(false);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({ display_name: "", avatar_url: "" });
  const [showProfileEditor, setShowProfileEditor] = useState(false);
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
      if (data.length > 0) setShowIntro(false);
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

  // Welcome back on login (not signup)
  const prevUser = useRef(null);
  useEffect(() => {
    if (user && prevUser.current === null && !authLoading) {
      // User just logged in — show welcome if they have completions
      const timer = setTimeout(() => {
        if (completed.size > 0) {
          setShowWelcome(true);
          setTimeout(() => setShowWelcome(false), 3000);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
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
    setShowIntro(true);
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

  const dismissIntro = () => {
    setIntroFade(true);
    setTimeout(() => setShowIntro(false), 500);
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
  `;

  // ── LOADING ───
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace" }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: "hudPulse 2s ease-in-out infinite" }}>⚔️</div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", letterSpacing: "0.1em", textTransform: "uppercase" }}>INITIALIZING...</div>
        </div>
      </div>
    );
  }

  // ── AUTH SCREEN ───
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-primary)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: 380, width: "100%", animation: "fadeSlideIn 0.5s ease", fontFamily: "'Inter', sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16, animation: "hudPulse 2.5s ease-in-out infinite" }}>⚔️</div>
            <h1 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6, letterSpacing: 4, textTransform: "uppercase" }}>TRADER ROADMAP XP</h1>
            <p style={{ fontSize: 13, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>{authMode === "signup" ? "CREATE YOUR ACCOUNT" : "AUTHENTICATE TO CONTINUE"}</p>
          </div>
          <Card style={{ padding: 28 }}>
            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: "1.5px solid var(--border-primary)", borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.1em" }}>Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: "100%", padding: "10px 14px", fontSize: 14, border: "1.5px solid var(--border-primary)", borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)", fontFamily: "'JetBrains Mono', monospace" }}
                />
              </div>
              {authError && (
                <div style={{ fontSize: 13, color: "var(--red)", marginBottom: 14, padding: "8px 12px", background: "var(--bg-tertiary)", borderRadius: 4, fontFamily: "'JetBrains Mono', monospace" }}>
                  {authError}
                </div>
              )}
              <button
                type="submit"
                style={{
                  width: "100%", fontSize: 14, fontWeight: 700, padding: "12px 20px",
                  background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)",
                  borderRadius: 4, cursor: "pointer", boxShadow: "0 0 20px var(--accent-glow)",
                  fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em", textTransform: "uppercase",
                }}
              >
                {authMode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                style={{ fontSize: 12, color: "var(--accent-secondary)", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
              >
                {authMode === "login" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
              </button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  // ── INTRO SCREEN ───
  if (showIntro) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--bg-primary)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
          opacity: introFade ? 0 : 1,
          transition: "opacity 0.5s ease",
        }}
      >
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center", maxWidth: 440, animation: "fadeSlideIn 0.6s ease" }}>
          <div style={{ fontSize: 64, marginBottom: 24, animation: "hudPulse 2.5s ease-in-out infinite" }}>⚔️</div>
          <h1
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: 22,
              color: "var(--text-primary)",
              marginBottom: 10,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            TRADER ROADMAP XP
          </h1>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 15,
              color: "var(--text-secondary)",
              lineHeight: 1.7,
              marginBottom: 8,
            }}
          >
            From breakeven grinder to independent trader.
          </p>
          <p
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 13,
              color: "var(--text-tertiary)",
              lineHeight: 1.6,
              marginBottom: 36,
            }}
          >
            Complete quests. Earn XP. Level up through 5 tiers.
            <br />
            The model works — now prove it.
          </p>

          <button
            onClick={dismissIntro}
            style={{
              fontFamily: "'JetBrains Mono', monospace", fontWeight: 700,
              fontSize: 14,
              color: "var(--accent)",
              background: "transparent",
              border: "1px solid var(--accent)",
              padding: "14px 42px",
              borderRadius: 4,
              cursor: "pointer",
              boxShadow: "0 0 20px var(--accent-glow)",
              animation: "glowPulse 2.5s ease-in-out infinite",
              transition: "transform 0.2s",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
            }}
          >
            ▶ START QUEST
          </button>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 16 }}>
            {LEVELS.map((l) => (
              <div key={l.id} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{l.icon}</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.1em", fontWeight: 700, textTransform: "uppercase" }}>
                  {l.tier}
                </div>
              </div>
            ))}
          </div>
        </div>
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
            <Card style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
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
            <Card style={{ maxWidth: 420, padding: 28, width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
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
                    href={proof.link}
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

      {/* ── Welcome Back Banner ── */}
      {showWelcome && (
        <div style={{
          position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", zIndex: 300,
          background: "var(--accent)", color: "var(--bg-primary)",
          padding: "14px 28px", borderRadius: 6, fontSize: 14, fontWeight: 600, fontFamily: "'JetBrains Mono', monospace",
          boxShadow: "0 8px 30px var(--accent-glow)", animation: "fadeSlideIn 0.4s ease",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>👋</span>
          Welcome back, {displayName}!
        </div>
      )}

      {/* ── Profile Editor Modal ── */}
      {showProfileEditor && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setShowProfileEditor(false)}
        >
          <Card style={{ maxWidth: 380, padding: 28, width: "100%", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
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
      <div style={{ background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)", borderTop: "1px solid var(--border-glow)", padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
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
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "right" }}>
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
                  borderRadius: 4, padding: "6px 10px", cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {dark ? "☀️" : "🌙"}
              </button>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                  borderRadius: 4, padding: "6px 10px", cursor: "pointer", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em",
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
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 20px", background: "var(--bg-secondary)", borderBottom: "1px solid var(--border-primary)" }}>
        {[
          { key: "roadmap", label: "ROADMAP", reset: true },
          { key: "checklist", label: "CHECKLIST" },
          { key: "journal", label: "JOURNAL" },
          { key: "accounts", label: "ACCOUNTS" },
          { key: "stats", label: "STATS" },
        ].map((tab) => (
          <button
            key={tab.key}
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
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "20px 16px 60px" }}>

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
          <ChecklistView />
        )}

        {/* JOURNAL VIEW */}
        {view === "journal" && (
          <JournalView supabase={supabase} user={user} loadTrades={loadTrades} syncToSheets={syncToSheets} gsUrl={gsUrl} setGsUrl={setGsUrl} />
        )}

        {/* STATS VIEW — Trade performance data */}
        {view === "stats" && (
          <TradeStatsView supabase={supabase} user={user} trades={trades} loadTrades={loadTrades} />
        )}

        {/* ACCOUNTS VIEW */}
        {view === "accounts" && (
          <AccountsView supabase={supabase} user={user} />
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 600, fontSize: 11, color: "var(--text-tertiary)", letterSpacing: 4, textTransform: "uppercase" }}>
          TRADER ROADMAP XP · THE FRACTAL MODEL
        </span>
      </div>
    </div>
  );
}

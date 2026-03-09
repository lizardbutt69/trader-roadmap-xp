import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "./src/supabase.js";

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
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e8ecf2" strokeWidth={stroke} />
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
    <div style={{ background: "#e8ecf2", borderRadius: 20, height, overflow: "hidden", position: "relative" }}>
      <div
        style={{
          width: `${pct}%`,
          height: "100%",
          background: `linear-gradient(90deg, ${color}, ${color}cc)`,
          borderRadius: 20,
          transition: "width 0.8s cubic-bezier(.4,0,.2,1)",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "45%",
            background: "rgba(255,255,255,0.35)",
            borderRadius: "20px 20px 0 0",
          }}
        />
      </div>
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
        background: "#fff",
        borderRadius: 16,
        border: "1px solid #e8ecf2",
        boxShadow: hovered && hoverable
          ? "0 8px 30px rgba(0,0,0,0.1), 0 2px 8px rgba(0,0,0,0.06)"
          : "0 2px 12px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.02)",
        transition: "all 0.25s cubic-bezier(.4,0,.2,1)",
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
        fontSize: 19,
        fontWeight: 700,
        color: color,
        background: `${color}15`,
        border: `1px solid ${color}30`,
        padding: "3px 10px",
        borderRadius: 20,
        letterSpacing: 0.5,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {icon && <span style={{ fontSize: 17 }}>{icon}</span>}
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
        borderRadius: 16,
        background: isCurrent ? level.bg : isActive ? "#fff" : "#f8f9fb",
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
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 19, color: isActive ? "#1a1a2e" : "#999" }}>
            {level.name}
          </span>
          <Chip label={level.tier} color={level.accent} />
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#888", marginBottom: 8 }}>
          {level.subtitle}
        </div>
        <XPBar current={done} max={total} color={level.accent} height={8} />
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 19, color: "#aaa", marginTop: 5, textAlign: "right" }}>
          {done}/{total} quests · {pct}%
        </div>
      </div>

      {isActive && (
        <div style={{ fontSize: 18, color: "#ccc", flexShrink: 0 }}>›</div>
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
        borderRadius: 14,
        background: completed ? `${meta.color}08` : "#fafbfc",
        border: `1.5px solid ${completed ? `${meta.color}35` : "#eef0f4"}`,
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
          borderRadius: 14,
          border: `2px solid ${completed ? meta.color : "#d0d5dd"}`,
          background: completed ? meta.color : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          transition: "all 0.25s",
        }}
      >
        {completed && <span style={{ color: "#fff", fontSize: 19, lineHeight: 1 }}>✓</span>}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3, flexWrap: "wrap" }}>
          <span
            style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              fontSize: 17,
              color: completed ? meta.color : "#2a2a3e",
            }}
          >
            {ach.name}
          </span>
          <Chip label={meta.label} color={meta.color} icon={meta.icon} />
          {ach.amount && <Chip label={ach.amount} color="#e8a838" icon="💰" />}
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#888", lineHeight: 1.4 }}>
          {ach.desc}
        </div>
        {completed && proof && (
          <div style={{ fontSize: 13, color: "#aaa", marginTop: 6, fontStyle: "italic" }}>
            "{proof.note.length > 60 ? proof.note.slice(0, 60) + "..." : proof.note}"
            {" · "}
            <span style={{ color: "#4a8fe7", fontStyle: "normal" }}>view proof</span>
          </div>
        )}
      </div>

      <div
        style={{
          fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
          fontSize: 17,
          color: completed ? meta.color : "#e8a838",
          flexShrink: 0,
          background: completed ? `${meta.color}12` : "#fdf5e6",
          padding: "4px 10px",
          borderRadius: 10,
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
    @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
    @keyframes fadeSlideIn { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
    @keyframes floatBounce { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-8px); } }
    @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
    @keyframes introGlow { 0%,100% { box-shadow: 0 0 30px rgba(232,168,56,0.15); } 50% { box-shadow: 0 0 50px rgba(232,168,56,0.3); } }
    @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
    * { box-sizing:border-box; margin:0; padding:0; }
    ::-webkit-scrollbar { width:6px; }
    ::-webkit-scrollbar-track { background:transparent; }
    ::-webkit-scrollbar-thumb { background:#ddd; border-radius:3px; }
    button, input, textarea { font-family: inherit; }
    textarea:focus, input:focus { border-color: #4a8fe7 !important; }
  `;

  // ── LOADING ───
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f0 0%, #f0f4fd 50%, #f5ecfd 100%)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <style>{globalStyles}</style>
        <div style={{ textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ fontSize: 40, marginBottom: 16, animation: "floatBounce 2s ease-in-out infinite" }}>⚔️</div>
          <div style={{ fontSize: 16, color: "#999" }}>Loading...</div>
        </div>
      </div>
    );
  }

  // ── AUTH SCREEN ───
  if (!user) {
    return (
      <div style={{ minHeight: "100vh", background: "linear-gradient(160deg, #fdf8f0 0%, #f0f4fd 50%, #f5ecfd 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <style>{globalStyles}</style>
        <div style={{ maxWidth: 380, width: "100%", animation: "fadeSlideIn 0.5s ease", fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>⚔️</div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: "#1a1a2e", marginBottom: 6 }}>Trader Roadmap XP</h1>
            <p style={{ fontSize: 15, color: "#888" }}>{authMode === "signup" ? "Create your account" : "Sign in to continue"}</p>
          </div>
          <Card style={{ padding: 28 }}>
            <form onSubmit={handleAuth}>
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Email</label>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px 14px", fontSize: 15, border: "1.5px solid #e0e3e8", borderRadius: 10, outline: "none", background: "#fafbfc", color: "#333" }}
                />
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Password</label>
                <input
                  type="password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  required
                  minLength={6}
                  style={{ width: "100%", padding: "10px 14px", fontSize: 15, border: "1.5px solid #e0e3e8", borderRadius: 10, outline: "none", background: "#fafbfc", color: "#333" }}
                />
              </div>
              {authError && (
                <div style={{ fontSize: 14, color: "#e05a6d", marginBottom: 14, padding: "8px 12px", background: "#fef2f2", borderRadius: 8 }}>
                  {authError}
                </div>
              )}
              <button
                type="submit"
                style={{
                  width: "100%", fontSize: 16, fontWeight: 700, padding: "12px 20px",
                  background: "linear-gradient(135deg, #e8a838, #e0823a)", border: "none", color: "#fff",
                  borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 14px rgba(232,168,56,0.3)",
                }}
              >
                {authMode === "signup" ? "Create Account" : "Sign In"}
              </button>
            </form>
            <div style={{ textAlign: "center", marginTop: 16 }}>
              <button
                onClick={() => { setAuthMode(authMode === "login" ? "signup" : "login"); setAuthError(""); }}
                style={{ fontSize: 14, color: "#4a8fe7", background: "none", border: "none", cursor: "pointer", fontWeight: 500 }}
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
          background: "linear-gradient(160deg, #fdf8f0 0%, #f0f4fd 50%, #f5ecfd 100%)",
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
          <div style={{ fontSize: 64, marginBottom: 24, animation: "floatBounce 3s ease-in-out infinite" }}>⚔️</div>
          <h1
            style={{
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              fontSize: 26,
              color: "#1a1a2e",
              marginBottom: 10,
              letterSpacing: 1,
            }}
          >
            TRADER ROADMAP XP
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 18,
              color: "#777",
              lineHeight: 1.7,
              marginBottom: 8,
            }}
          >
            From breakeven grinder to independent trader.
          </p>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 19,
              color: "#aaa",
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
              fontFamily: "'DM Sans', sans-serif", fontWeight: 700,
              fontSize: 19,
              color: "#fff",
              background: "linear-gradient(135deg, #e8a838, #e0823a)",
              border: "none",
              padding: "14px 42px",
              borderRadius: 14,
              cursor: "pointer",
              boxShadow: "0 4px 20px rgba(232,168,56,0.35)",
              animation: "introGlow 2.5s ease-in-out infinite",
              transition: "transform 0.2s",
            }}
          >
            ▶ START QUEST
          </button>

          <div style={{ marginTop: 40, display: "flex", justifyContent: "center", gap: 16 }}>
            {LEVELS.map((l) => (
              <div key={l.id} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{l.icon}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 18, color: "#bbb", letterSpacing: 1, fontWeight: 700 }}>
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
        background: "linear-gradient(180deg, #f8f9fc 0%, #f0f2f8 100%)",
        fontFamily: "'DM Sans', sans-serif",
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
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              animation: "fadeSlideIn 0.2s ease",
            }}
            onClick={(e) => e.target === e.currentTarget && setConfirm(null)}
          >
            <Card style={{ maxWidth: 420, padding: 28, width: "100%" }}>
              <div style={{ textAlign: "center", marginBottom: 20 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>🏆</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 4 }}>
                  Submit Proof
                </div>
                <div style={{ fontSize: 16, color: "#888" }}>
                  {ach?.name}
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15, color: "#e8a838", marginTop: 4 }}>
                  +{ach?.xp} XP
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
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
                    fontSize: 15,
                    fontFamily: "'DM Sans', sans-serif",
                    border: "1.5px solid #e0e3e8",
                    borderRadius: 10,
                    outline: "none",
                    resize: "vertical",
                    background: "#fafbfc",
                    color: "#333",
                    lineHeight: 1.5,
                  }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 14, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>
                  Link / Evidence (optional)
                </label>
                <input
                  value={proofLink}
                  onChange={(e) => setProofLink(e.target.value)}
                  placeholder="URL to screenshot, journal, spreadsheet..."
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    fontSize: 15,
                    fontFamily: "'DM Sans', sans-serif",
                    border: "1.5px solid #e0e3e8",
                    borderRadius: 10,
                    outline: "none",
                    background: "#fafbfc",
                    color: "#333",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={() => setConfirm(null)}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: 600,
                    padding: "12px 20px",
                    background: "#f0f2f5",
                    border: "1px solid #e0e3e8",
                    color: "#666",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmToggle}
                  disabled={!proofNote.trim() || saving}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "12px 20px",
                    background: proofNote.trim() && !saving ? "#56b886" : "#ccc",
                    border: "none",
                    color: "#fff",
                    borderRadius: 10,
                    cursor: proofNote.trim() && !saving ? "pointer" : "not-allowed",
                    boxShadow: proofNote.trim() && !saving ? "0 4px 14px rgba(86,184,134,0.3)" : "none",
                    transition: "all 0.2s",
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
              background: "rgba(0,0,0,0.3)",
              backdropFilter: "blur(4px)",
              zIndex: 200,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
              animation: "fadeSlideIn 0.2s ease",
            }}
            onClick={(e) => e.target === e.currentTarget && setViewingProof(null)}
          >
            <Card style={{ maxWidth: 420, padding: 28, width: "100%" }}>
              <div style={{ textAlign: "center", marginBottom: 16 }}>
                <div style={{ fontSize: 40, marginBottom: 10 }}>✅</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: meta?.color || "#1a1a2e" }}>
                  {ach?.name}
                </div>
                <div style={{ fontSize: 14, color: "#aaa", marginTop: 4 }}>
                  Completed {proof?.completedAt ? new Date(proof.completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : ""}
                </div>
              </div>

              <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                  Proof
                </div>
                <div style={{ fontSize: 15, color: "#444", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>
                  {proof?.note || "(no note)"}
                </div>
              </div>

              {proof?.link && (
                <div style={{ background: "#f8f9fb", borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#999", marginBottom: 6, textTransform: "uppercase", letterSpacing: 0.5 }}>
                    Evidence Link
                  </div>
                  <a
                    href={proof.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 15, color: "#4a8fe7", wordBreak: "break-all" }}
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
                    fontSize: 15,
                    fontWeight: 600,
                    padding: "12px 20px",
                    background: "#fef2f2",
                    border: "1px solid #e05a6d30",
                    color: "#e05a6d",
                    borderRadius: 10,
                    cursor: "pointer",
                  }}
                >
                  Undo Quest
                </button>
                <button
                  onClick={() => setViewingProof(null)}
                  style={{
                    flex: 1,
                    fontSize: 15,
                    fontWeight: 700,
                    padding: "12px 20px",
                    background: "#f0f2f5",
                    border: "1px solid #e0e3e8",
                    color: "#555",
                    borderRadius: 10,
                    cursor: "pointer",
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
          background: "linear-gradient(135deg, #e8a838, #e0823a)", color: "#fff",
          padding: "14px 28px", borderRadius: 14, fontSize: 16, fontWeight: 600,
          boxShadow: "0 8px 30px rgba(232,168,56,0.4)", animation: "fadeSlideIn 0.4s ease",
          display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 24 }}>👋</span>
          Welcome back, {displayName}!
        </div>
      )}

      {/* ── Profile Editor Modal ── */}
      {showProfileEditor && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 24, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setShowProfileEditor(false)}
        >
          <Card style={{ maxWidth: 380, padding: 28, width: "100%" }}>
            <div style={{ textAlign: "center", marginBottom: 20 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: "#1a1a2e", marginBottom: 16 }}>Edit Profile</div>
              <div
                onClick={() => avatarInputRef.current?.click()}
                style={{
                  width: 80, height: 80, borderRadius: "50%", margin: "0 auto 12px",
                  background: profile.avatar_url ? `url(${profile.avatar_url}) center/cover` : "linear-gradient(135deg, #e8a838, #e0823a)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  cursor: "pointer", border: "3px solid #e8ecf2", position: "relative",
                  overflow: "hidden",
                }}
              >
                {!profile.avatar_url && <span style={{ fontSize: 32, color: "#fff" }}>{displayName[0]?.toUpperCase()}</span>}
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
              <label style={{ fontSize: 14, fontWeight: 600, color: "#555", display: "block", marginBottom: 6 }}>Display Name</label>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="Your trader name..."
                style={{ width: "100%", padding: "10px 14px", fontSize: 15, border: "1.5px solid #e0e3e8", borderRadius: 10, outline: "none", background: "#fafbfc", color: "#333" }}
              />
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button onClick={() => setShowProfileEditor(false)}
                style={{ flex: 1, fontSize: 15, fontWeight: 600, padding: "12px", background: "#f0f2f5", border: "1px solid #e0e3e8", color: "#666", borderRadius: 10, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={saveProfile}
                style={{ flex: 1, fontSize: 15, fontWeight: 700, padding: "12px", background: "#56b886", border: "none", color: "#fff", borderRadius: 10, cursor: "pointer", boxShadow: "0 4px 14px rgba(86,184,134,0.3)" }}>
                Save
              </button>
            </div>
          </Card>
        </div>
      )}

      {/* ── Top Bar ── */}
      <div style={{ background: "#fff", borderBottom: "1px solid #eef0f4", padding: "14px 20px", position: "sticky", top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 640, margin: "0 auto" }}>
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
                {!profile.avatar_url && <span style={{ fontSize: 16, color: "#fff", fontWeight: 700 }}>{displayName[0]?.toUpperCase()}</span>}
              </div>
              <div>
                <div style={{ fontSize: 14, color: "#888" }}>{displayName}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16, color: "#1a1a2e" }}>
                    {currentLevel.name}
                  </span>
                  <Chip label={currentLevel.tier} color={currentLevel.accent} />
                </div>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 19, color: "#e8a838" }}>
                  {currentXP.toLocaleString()} XP
                </div>
                <div style={{ fontSize: 14, color: "#bbb" }}>
                  / {TOTAL_XP.toLocaleString()}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                style={{
                  fontSize: 13, color: "#bbb", background: "#f5f6f8", border: "1px solid #e8ecf2",
                  borderRadius: 8, padding: "6px 10px", cursor: "pointer", fontWeight: 500,
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
            <div style={{ fontSize: 19, color: "#bbb", textAlign: "right", marginTop: 4 }}>
              {(nextLevel.xpRequired - currentXP).toLocaleString()} XP to {nextLevel.name}
            </div>
          )}
        </div>
      </div>

      {/* ── Nav Tabs ── */}
      <div style={{ display: "flex", justifyContent: "center", gap: 6, padding: "12px 20px", background: "#fff", borderBottom: "1px solid #eef0f4" }}>
        {[
          { key: "map", label: "🗺️ Roadmap", reset: true },
          { key: "stats", label: "📊 Stats", reset: true },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setView(tab.key); if (tab.reset) setSelectedLevel(null); }}
            style={{
              fontSize: 18,
              fontWeight: view === tab.key ? 700 : 500,
              padding: "8px 20px",
              background: view === tab.key ? `${currentLevel.accent}12` : "transparent",
              border: view === tab.key ? `1.5px solid ${currentLevel.accent}40` : "1.5px solid transparent",
              color: view === tab.key ? currentLevel.accent : "#999",
              borderRadius: 10,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Content ── */}
      <div style={{ maxWidth: 640, margin: "0 auto", padding: "20px 16px 60px" }}>

        {/* MAP VIEW — Trail Style */}
        {view === "map" && !selectedLevel && (
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
                      background: allDone ? level.accent : isCurrent ? "#fff" : isPast ? level.accent + "88" : "#e8ecf2",
                      border: `3px solid ${allDone ? level.accent : isCurrent ? level.accent : isPast ? level.accent + "66" : "#ddd"}`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      boxShadow: isCurrent ? `0 0 14px ${level.accent}50` : "none",
                      transition: "all 0.3s",
                    }}>
                      {allDone && <span style={{ fontSize: 11, color: "#fff", lineHeight: 1 }}>✓</span>}
                      {isCurrent && !allDone && <div style={{ width: 10, height: 10, borderRadius: "50%", background: level.accent, animation: "pulse 2s infinite" }} />}
                    </div>

                    {/* Card */}
                    <div
                      onClick={isActive ? () => { setSelectedLevel(level.id); setView("level"); } : undefined}
                      style={{
                        flex: 1,
                        padding: "16px 18px",
                        borderRadius: 14,
                        background: isCurrent ? level.bg : isActive ? "#fff" : "#f8f9fb",
                        border: isCurrent ? `2px solid ${level.accent}` : allDone ? `2px solid ${level.accent}55` : "1.5px solid #eef0f4",
                        cursor: isActive ? "pointer" : "default",
                        opacity: isActive ? 1 : 0.55,
                        transition: "all 0.3s",
                        boxShadow: isCurrent ? `0 4px 20px ${level.accent}18` : "0 1px 4px rgba(0,0,0,0.03)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <ProgressRing pct={pct} size={48} stroke={4} color={level.accent}>
                          <span style={{ fontSize: 20 }}>{allDone ? "⭐" : level.icon}</span>
                        </ProgressRing>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2, flexWrap: "wrap" }}>
                            <span style={{ fontWeight: 700, fontSize: 16, color: isActive ? "#1a1a2e" : "#999" }}>
                              {level.name}
                            </span>
                            <Chip label={level.tier} color={level.accent} />
                            {isCurrent && <Chip label="YOU ARE HERE" color={level.accent} />}
                          </div>
                          <div style={{ fontSize: 14, color: "#888", marginBottom: 6 }}>{level.subtitle}</div>
                          <XPBar current={done} max={total} color={level.accent} height={6} />
                          <div style={{ fontSize: 12, color: "#aaa", marginTop: 4, textAlign: "right" }}>
                            {done}/{total} quests · {pct}%
                          </div>
                        </div>
                        {isActive && <div style={{ fontSize: 18, color: "#ccc", flexShrink: 0 }}>›</div>}
                      </div>
                    </div>
                  </div>

                  {/* Connector line between nodes */}
                  {!isLast && (
                    <div style={{ display: "flex", alignItems: "stretch", gap: 16 }}>
                      <div style={{ width: 24, display: "flex", justifyContent: "center", flexShrink: 0 }}>
                        <div style={{
                          width: 3, height: 20,
                          background: isPast ? LEVELS[i + 1]?.accent || "#ddd" : isCurrent ? `linear-gradient(to bottom, ${level.accent}, #ddd)` : "#e8ecf2",
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

        {/* LEVEL DETAIL VIEW */}
        {view === "level" && selectedData && (
          <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
            <button
              onClick={() => { setView("map"); setSelectedLevel(null); }}
              style={{
                fontSize: 18,
                color: "#999",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                marginBottom: 16,
                display: "flex",
                alignItems: "center",
                gap: 6,
                fontWeight: 600,
              }}
            >
              ← Back to Roadmap
            </button>

            <Card style={{ padding: 24, marginBottom: 20, background: selectedData.bg, border: `1.5px solid ${selectedData.accent}35` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 12 }}>
                <span style={{ fontSize: 38 }}>{selectedData.icon}</span>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e" }}>
                      {selectedData.name}
                    </span>
                    <Chip label={selectedData.tier} color={selectedData.accent} />
                  </div>
                  <div style={{ fontSize: 19, color: "#888" }}>{selectedData.subtitle}</div>
                </div>
              </div>
              <div style={{ fontSize: 19, color: "#666", lineHeight: 1.6, marginBottom: 14 }}>
                {selectedData.description}
              </div>
              <XPBar
                current={selectedData.achievements.filter((a) => completed.has(a.id)).length}
                max={selectedData.achievements.length}
                color={selectedData.accent}
              />
              <div style={{ fontSize: 17, color: "#aaa", textAlign: "right", marginTop: 6 }}>
                {selectedData.achievements.filter((a) => completed.has(a.id)).length}/{selectedData.achievements.length} complete
              </div>
            </Card>

            <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 14 }}>
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

        {/* STATS VIEW */}
        {view === "stats" && (
          <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
            {/* Stats Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
              {[
                { label: "Total XP", value: currentXP.toLocaleString(), sub: `/ ${TOTAL_XP.toLocaleString()}`, color: "#e8a838", icon: "⚡" },
                { label: "Level", value: `${currentLevel.id} / 5`, sub: currentLevel.name, color: currentLevel.accent, icon: currentLevel.icon },
                { label: "Quests", value: `${completed.size} / ${ALL_ACH.length}`, sub: `${Math.round((completed.size / ALL_ACH.length) * 100)}% done`, color: "#56b886", icon: "✅" },
                { label: "Next Goal", value: nextLevel ? nextLevel.name : "MAX!", sub: nextLevel ? `${(nextLevel.xpRequired - currentXP).toLocaleString()} XP away` : "You made it", color: nextLevel?.accent || "#e05a6d", icon: nextLevel?.icon || "👑" },
              ].map((s, i) => (
                <Card key={i} style={{ padding: 18, animation: `fadeSlideIn 0.3s ease ${i * 0.06}s both` }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
                    <span style={{ fontSize: 19 }}>{s.icon}</span>
                    <span style={{ fontSize: 17, color: "#999", fontWeight: 600 }}>{s.label}</span>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 19, color: s.color, marginBottom: 2 }}>
                    {s.value}
                  </div>
                  <div style={{ fontSize: 17, color: "#bbb" }}>{s.sub}</div>
                </Card>
              ))}
            </div>

            {/* By Type */}
            <Card style={{ padding: 22, marginBottom: 16 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 16 }}>
                Quest Types
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {Object.entries(TYPE_META).map(([type, meta]) => {
                  const typeAchs = ALL_ACH.filter((a) => a.type === type);
                  const typeDone = typeAchs.filter((a) => completed.has(a.id)).length;
                  return (
                    <div key={type}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{ fontSize: 17 }}>{meta.icon}</span>
                          <span style={{ fontSize: 18, fontWeight: 600, color: "#555" }}>{meta.label}</span>
                        </div>
                        <span style={{ fontSize: 17, color: "#aaa", fontWeight: 600 }}>{typeDone}/{typeAchs.length}</span>
                      </div>
                      <XPBar current={typeDone} max={typeAchs.length} color={meta.color} height={7} />
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Payout Milestones */}
            <Card style={{ padding: 22 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#1a1a2e", marginBottom: 16 }}>
                💰 Payout Milestones
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {ALL_ACH.filter((a) => a.type === "payout").map((a) => (
                  <div
                    key={a.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "10px 14px",
                      borderRadius: 10,
                      background: completed.has(a.id) ? "#f0faf5" : "#fafbfc",
                      border: `1px solid ${completed.has(a.id) ? "#56b88640" : "#eef0f4"}`,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 19 }}>{completed.has(a.id) ? "✅" : "⬜"}</span>
                      <div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 19, color: completed.has(a.id) ? "#56b886" : "#555" }}>
                          {a.name}
                        </div>
                        {a.amount && (
                          <div style={{ fontSize: 19, color: "#e8a838", fontWeight: 700, marginTop: 2 }}>{a.amount}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ fontSize: 19, color: "#bbb" }}>{a.levelName}</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", padding: "16px 0 28px" }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 18, color: "#ccc", letterSpacing: 2 }}>
          TRADER ROADMAP XP · THE FRACTAL MODEL
        </span>
      </div>
    </div>
  );
}

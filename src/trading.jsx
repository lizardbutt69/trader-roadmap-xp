import React, { useState, useEffect, useRef, useCallback, useMemo, createContext, useContext } from "react";
import { createChart, CandlestickSeries, LineStyle } from "lightweight-charts";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Target, Crosshair, Shield, TrendingUp, Rocket, BookOpen, Trophy, Calendar, Activity, ShieldCheck, X as XIcon } from "lucide-react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);
import MotivationalQuotesBar from "./components/MotivationalQuotesBar";
import {
  getEventsForWeek,
  getEventsForToday,
  getNextHighImpactEvent,
  getMinutesUntil,
  formatEventTime,
  getTodayET,
} from "./utils/calendarUtils.js";
import { requestNotificationPermission } from "./utils/newsAlerts.js";

// ─── TOAST SYSTEM ────────────────────────────────────────────────────────────
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const addToast = useCallback((message, type = "error") => {
    const id = Date.now();
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3500);
  }, []);
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div style={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        {toasts.map((t) => (
          <div key={t.id} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 500,
            padding: "12px 18px", borderRadius: 8, maxWidth: 360, pointerEvents: "auto",
            background: t.type === "success" ? "rgba(52,211,153,0.12)" : t.type === "info" ? "rgba(34,211,238,0.1)" : "rgba(251,113,133,0.12)",
            border: `1px solid ${t.type === "success" ? "rgba(52,211,153,0.35)" : t.type === "info" ? "rgba(34,211,238,0.3)" : "rgba(251,113,133,0.35)"}`,
            color: t.type === "success" ? "var(--green)" : t.type === "info" ? "var(--accent)" : "var(--red)",
            backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)",
            animation: "fadeSlideIn 0.25s ease",
          }}>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}

// ─── ACHIEVEMENT ALERT SYSTEM ─────────────────────────────────────────────────
const BADGE_ICONS = {
  "On Fire": Flame,
  "Disciplined": Target,
  "Sniper": Crosshair,
  "Rule Keeper": Shield,
  "Green Week": TrendingUp,
  "Best Day Ever": Rocket,
  "Journaler": BookOpen,
  "Elite": Trophy,
  "Green Month": Calendar,
  "Marathon": Activity,
  "Ironclad": ShieldCheck,
};

const AchievementAlertContext = createContext(null);

export function AchievementAlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);

  const dismiss = useCallback((id) => {
    setAlerts((a) => a.filter((x) => x.id !== id));
  }, []);

  const triggerAchievement = useCallback((badge) => {
    const id = Date.now() + Math.random();
    setAlerts((a) => [...a, { ...badge, id }]);
    setTimeout(() => dismiss(id), 5000);
  }, [dismiss]);

  return (
    <AchievementAlertContext.Provider value={triggerAchievement}>
      {children}
      <div style={{ position: "fixed", top: 20, right: 20, zIndex: 10000, display: "flex", flexDirection: "column", gap: 10, pointerEvents: "none" }}>
        <AnimatePresence>
          {alerts.map((a) => (
            <AchievementAlertCard key={a.id} alert={a} onDismiss={() => dismiss(a.id)} />
          ))}
        </AnimatePresence>
      </div>
    </AchievementAlertContext.Provider>
  );
}

export function useAchievement() {
  return useContext(AchievementAlertContext);
}

function AchievementAlertCard({ alert, onDismiss }) {
  const { name, desc, color } = alert;
  const Icon = BADGE_ICONS[name] || Trophy;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 300, damping: 25 }}
      style={{
        pointerEvents: "auto",
        width: 340,
        position: "relative",
        overflow: "hidden",
        background: `linear-gradient(135deg, ${color}18 0%, var(--bg-secondary) 55%)`,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 14,
        border: `1px solid ${color}40`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.18), 0 0 0 1px var(--border-primary)`,
        padding: 16,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Ambient blur blobs */}
      <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        <div style={{ position: "absolute", top: -12, left: -12, width: 72, height: 72, borderRadius: "50%", background: color, filter: "blur(28px)", opacity: 0.18 }} />
        <div style={{ position: "absolute", bottom: -12, right: -12, width: 72, height: 72, borderRadius: "50%", background: color, filter: "blur(28px)", opacity: 0.12 }} />
      </div>

      {/* Content row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, position: "relative" }}>
        {/* Spring icon pill */}
        <motion.div
          initial={{ rotate: -15, scale: 0.5 }}
          animate={{ rotate: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          style={{
            padding: 10,
            borderRadius: 12,
            background: `linear-gradient(135deg, ${color}, ${color}bb)`,
            boxShadow: `0 4px 12px ${color}44`,
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Icon size={18} color="#fff" strokeWidth={2.5} />
        </motion.div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 }}
            style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color, marginBottom: 4 }}
          >
            Achievement Unlocked
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}
          >
            {name}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.22 }}
            style={{ fontSize: 12, color: "var(--text-secondary)" }}
          >
            {desc}
          </motion.div>
        </div>

        {/* Close */}
        <button
          onClick={onDismiss}
          style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", padding: 4, display: "flex", flexShrink: 0 }}
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Badge pill — spring in */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.3 }}
        style={{
          position: "absolute", top: 10, right: 34,
          fontSize: 10, fontWeight: 600, letterSpacing: "0.06em",
          color, background: `${color}20`,
          border: `1px solid ${color}40`,
          borderRadius: 20, padding: "2px 8px",
        }}
      >
        New
      </motion.div>

      {/* Timer bar */}
      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 2, background: "var(--border-primary)" }}>
        <div style={{ height: "100%", background: color, animation: "achieveBar 5s linear forwards" }} />
      </div>
    </motion.div>
  );
}

// ─── DELETE POPOVER CONFIRM ──────────────────────────────────────────────────
function DeletePopover({ id, confirmId, setConfirmId, onConfirm, children, buttonStyle = {} }) {
  const open = confirmId === id;
  return (
    <div style={{ position: "relative", display: "inline-flex" }}>
      {open && (
        <div onClick={() => setConfirmId(null)} style={{ position: "fixed", inset: 0, zIndex: 49 }} />
      )}
      <button onClick={() => setConfirmId(open ? null : id)} style={buttonStyle}>{children}</button>
      {open && (
        <div style={{
          position: "absolute", bottom: "calc(100% + 8px)", right: 0, zIndex: 50,
          background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
          borderRadius: 8, padding: "12px 14px", boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
          backdropFilter: "blur(12px)", whiteSpace: "nowrap", animation: "fadeSlideIn 0.15s ease",
        }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-primary)", marginBottom: 10 }}>Delete this?</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { onConfirm(id); setConfirmId(null); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--red)", background: "rgba(251,113,133,0.1)", border: "1px solid rgba(251,113,133,0.25)", borderRadius: 4, padding: "5px 12px", cursor: "pointer" }}>Delete</button>
            <button onClick={() => setConfirmId(null)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: 4, padding: "5px 12px", cursor: "pointer" }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PRIVACY HELPER ─────────────────────────────────────────────────────────
const MASK = "$•••••";
const pm = (val, privacyMode) => privacyMode ? MASK : val;

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const DEFAULT_CHECKLIST_ITEMS = [
  { label: "Confirmation Signal", sub: "Primary entry signal is confirmed" },
  { label: "Key Level / Liquidity", sub: "Price at significant level or liquidity pool" },
  { label: "Timeframe Alignment", sub: "Higher TF in agreement with entry TF" },
  { label: "State Change", sub: "Market structure shift confirmed on entry timeframe" },
  { label: "Candle Structure", sub: "Intra-candle structure aligns with direction" },
  { label: "Model Criteria Met", sub: "All model setup conditions are satisfied" },
  { label: "Session / Time of Day", sub: "Within your defined high-probability session window" },
  { label: "Risk/Reward Ratio", sub: "Minimum 1:2 R:R confirmed" },
  { label: "Stop Loss Defined", sub: "Clear invalidation level set" },
];

const TIMER_ITEM = { label: "Is this genuinely your best setup?", sub: "Take 10 seconds. Be honest with yourself.", timer: true };

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

const TRADE_TAGS = [
  { label: "GXT",    color: "#22d3ee" },
  { label: "TTFM",   color: "#a78bfa" },
  { label: "CISD",   color: "#f59e0b" },
  { label: "ICCISD", color: "#fb923c" },
  { label: "1STG",   color: "#34d399" },
  { label: "2STG",   color: "#60a5fa" },
  { label: "SMT",    color: "#f472b6" },
  { label: "PSP",    color: "#2dd4bf" },
  { label: "SSMT",    color: "#f87171" },
  { label: "SMTFILL", color: "#c084fc" },
];

const TRADE_VIOLATIONS = [
  { value: "early_entry",      label: "EARLY ENTRY",      color: "#f59e0b" },
  { value: "moved_stop",       label: "MOVED STOP",       color: "#ef4444" },
  { value: "outside_session",  label: "OUTSIDE SESSION",  color: "#a78bfa" },
  { value: "overtrade",        label: "OVERTRADE",        color: "#22d3ee" },
  { value: "revenge_trade",    label: "REVENGE TRADE",    color: "#fb7185" },
  { value: "no_confirmation",  label: "NO CONFIRMATION",  color: "#34d399" },
];

const TagPicker = ({ selected, onChange, tags = TRADE_TAGS }) => (
  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
    {tags.map(({ label, color }) => {
      const active = selected.includes(label);
      return (
        <button
          key={label}
          type="button"
          onClick={() => onChange(active ? selected.filter(t => t !== label) : [...selected, label])}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 4,
            cursor: "pointer", letterSpacing: "0.08em",
            border: `1px solid ${active ? color : "var(--border-primary)"}`,
            background: active ? `${color}22` : "transparent",
            color: active ? color : "var(--text-tertiary)",
            transition: "all 0.15s",
          }}
        >#{label}</button>
      );
    })}
  </div>
);

const TradeTagChips = ({ tags, allTags = TRADE_TAGS }) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      {tags.map(label => {
        const def = allTags.find(t => t.label === label);
        const color = def ? def.color : "var(--text-tertiary)";
        return (
          <span key={label} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
            padding: "2px 8px", borderRadius: 4,
            border: `1px solid ${color}40`,
            background: `${color}12`,
            color,
          }}>#{label}</span>
        );
      })}
    </div>
  );
};

const buildEffectiveViolations = (prefs) => [
  ...TRADE_VIOLATIONS,
  ...(prefs?.violations ?? []).map(v => ({
    value: v.label.toLowerCase().replace(/[^a-z0-9]+/g, '_'),
    label: v.label,
    color: v.color,
  })),
];

const ViolationPicker = ({ selected = [], onChange, allViolations = TRADE_VIOLATIONS }) => (
  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
    {allViolations.map(({ value, label, color }) => {
      const active = selected.includes(value);
      return (
        <button
          key={value}
          type="button"
          onClick={() => onChange(active ? selected.filter(v => v !== value) : [...selected, value])}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700,
            padding: "3px 9px", borderRadius: 4,
            cursor: "pointer", letterSpacing: "0.07em",
            border: `1px solid ${active ? color : "var(--border-primary)"}`,
            background: active ? `${color}22` : "transparent",
            color: active ? color : "var(--text-tertiary)",
            transition: "all 0.15s",
          }}
        >⚠ {label}</button>
      );
    })}
  </div>
);

const ViolationChips = ({ violations, allViolations = TRADE_VIOLATIONS }) => {
  if (!violations || violations.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      {violations.map(value => {
        const def = allViolations.find(v => v.value === value);
        const color = def ? def.color : "#ef4444";
        const label = def ? def.label : value;
        return (
          <span key={value} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 10, fontWeight: 700, letterSpacing: "0.07em",
            padding: "2px 8px", borderRadius: 4,
            border: `1px solid ${color}40`,
            background: `${color}12`,
            color,
          }}>⚠ {label}</span>
        );
      })}
    </div>
  );
};

const XP_LEVELS = [
  { name: "Developing Trader", icon: "🌱", min: 0, max: 100 },
  { name: "Consistent Trader", icon: "📈", min: 100, max: 300 },
  { name: "Skilled Trader", icon: "🎯", min: 300, max: 600 },
  { name: "Advanced Trader", icon: "💎", min: 600, max: 1000 },
  { name: "Elite Trader", icon: "🏆", min: 1000, max: Infinity },
];

const MOODS = [
  { value: "Focused", icon: "🎯", color: "var(--green)" },
  { value: "Confident", icon: "💪", color: "var(--accent-secondary)" },
  { value: "Calm", icon: "🧘", color: "var(--purple)" },
  { value: "Anxious", icon: "😰", color: "var(--gold)" },
  { value: "Tired", icon: "😴", color: "var(--text-tertiary)" },
  { value: "Frustrated", icon: "😤", color: "var(--red)" },
  { value: "Neutral", icon: "😐", color: "var(--text-secondary)" },
];
const MOOD_VALUES = new Set(MOODS.map((m) => m.value));

const DRAWDOWN_WARNING = 0.7;
const DRAWDOWN_DANGER = 0.85;

// ─── SECURITY HELPERS ────────────────────────────────────────────────────────

function safeUrl(url) {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (["http:", "https:"].includes(parsed.protocol)) return parsed.href;
  } catch {}
  return null;
}

const VALID_DIRECTIONS = new Set(["Long", "Short", ""]);
const APLUS_OPTIONS = [
  "A+ — Followed Plan, Clean Execution",
  "B — Good Setup, Poor Execution",
  "C — Marginal / Forced Setup",
  "F — No Setup / Rule Break",
];
const VALID_APLUS = new Set([...APLUS_OPTIONS, ""]);
const VALID_BIAS = new Set(["Bullish", "Bearish", "Neutral", ""]);
const MAX_TEXT_LENGTH = 5000;


function sanitizeText(str, maxLen = MAX_TEXT_LENGTH) {
  if (!str) return "";
  return String(str).slice(0, maxLen);
}

// ─── HELPERS ────────────────────────────────────────────────────────────────

function calcStreaks(trades) {
  const dayMap = buildDayMap(trades);
  const keys = Object.keys(dayMap).sort();
  const sorted = [...trades].sort((a, b) => new Date(a.dt) - new Date(b.dt));
  let greenStreak = 0, bestGreen = 0, cur = 0;
  keys.forEach((k) => { if (dayMap[k].pnl > 0) { cur++; bestGreen = Math.max(bestGreen, cur); } else cur = 0; });
  for (let i = keys.length - 1; i >= 0; i--) { if (dayMap[keys[i]].pnl > 0) greenStreak++; else break; }
  const isAplusSetup = (t) => t.aplus?.startsWith("A+") || t.aplus?.startsWith("B");
  let aplusStreak = 0, bestAplus = 0, curA = 0;
  sorted.forEach((t) => { if (isAplusSetup(t)) { curA++; bestAplus = Math.max(bestAplus, curA); } else curA = 0; });
  for (let i = sorted.length - 1; i >= 0; i--) { if (isAplusSetup(sorted[i])) aplusStreak++; else break; }
  return { greenStreak, bestGreen, aplusStreak, bestAplus };
}

function nowLocal() {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

function fmtDate(dt) {
  return new Date(dt).toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function dateKey(dt) {
  const d = new Date(dt);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  return dateKey(new Date());
}

function getPnlForMode(t, mode) {
  if (mode === "funded") return parseFloat(t.profit_funded) || 0;
  if (mode === "both") return (parseFloat(t.profit) || 0) + (parseFloat(t.profit_funded) || 0);
  return parseFloat(t.profit) || 0; // "personal" default
}

export function calcTradingXP(trades, dayMap) {
  let xp = 0;
  trades.forEach((t) => {
    xp += 10;
    if (t.aplus?.startsWith("A+")) xp += 15;
    if (parseFloat(t.profit) > 0) xp += 20;
    if (t.notes && t.notes.length > 10) xp += 5;
  });
  Object.values(dayMap).forEach((d) => { if (d.pnl > 0) xp += 25; });
  return xp;
}

export function computeBadges(trades, dayMap) {
  const sorted = [...trades].sort((a, b) => new Date(a.dt) - new Date(b.dt));
  const keys = Object.keys(dayMap).sort();
  let maxGreen = 0, cur = 0;
  keys.forEach((k) => { if (dayMap[k].pnl > 0) { cur++; maxGreen = Math.max(maxGreen, cur); } else cur = 0; });
  let maxAplus = 0, curA = 0;
  sorted.forEach((t) => { if (t.aplus?.startsWith("A+")) { curA++; maxAplus = Math.max(maxAplus, curA); } else curA = 0; });
  let maxWin = 0, curW = 0;
  sorted.forEach((t) => { if (parseFloat(t.profit) > 0) { curW++; maxWin = Math.max(maxWin, curW); } else curW = 0; });
  const aplusTrades = trades.filter((t) => t.aplus?.startsWith("A+")).length;
  const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
  const weekPnl = trades.filter((t) => t.dt && new Date(t.dt) >= weekStart).reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  const bestDay = Object.values(dayMap).reduce((b, d) => d.pnl > b ? d.pnl : b, 0);
  const xp = calcTradingXP(trades, dayMap);
  return [
    { name: "On Fire", desc: "3 green days in a row", color: "#f97316", unlocked: maxGreen >= 3 },
    { name: "Disciplined", desc: "5 A+ trades in a row", color: "#22d3ee", unlocked: maxAplus >= 5 },
    { name: "Sniper", desc: "5 winning trades in a row", color: "#22c55e", unlocked: maxWin >= 5 },
    { name: "Rule Keeper", desc: "10 A+ trades total", color: "#a855f7", unlocked: aplusTrades >= 10 },
    { name: "Green Week", desc: "Profitable week", color: "#22c55e", unlocked: weekPnl > 0 },
    { name: "Best Day Ever", desc: "Single day P&L > $500", color: "#f59e0b", unlocked: bestDay >= 500 },
    { name: "Journaler", desc: "Log 20+ trades", color: "#60a5fa", unlocked: trades.length >= 20 },
    { name: "Elite", desc: "Reach 1000 XP", color: "#f59e0b", unlocked: xp >= 1000 },
    { name: "Green Month", desc: "Finish a month profitable", color: "#22c55e", unlocked: (() => { const months = {}; keys.forEach((k) => { const m = k.slice(0, 7); if (!months[m]) months[m] = 0; months[m] += dayMap[k].pnl; }); const curM = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`; return Object.entries(months).some(([m, p]) => m !== curM && p > 0); })() },
    { name: "Marathon", desc: "Log 50+ trades", color: "#f97316", unlocked: trades.length >= 50 },
    { name: "Ironclad", desc: "5 green days in a row", color: "#6366f1", unlocked: maxGreen >= 5 },
  ];
}

function validateTradeForm({ formDt, formAsset, formDirection, formAplus, formTaken, formBias, formProfit, formProfitFunded, formChart, formAfter, aplusOptions }) {
  if (!formDt || !formAsset) return "Please fill in Date & Time and Asset at minimum.";
  if (formAsset && formAsset.length > 30) return "Asset symbol too long.";
  if (formDirection && !VALID_DIRECTIONS.has(formDirection)) return "Invalid direction.";
  const validAplus = aplusOptions ? new Set([...aplusOptions, ""]) : VALID_APLUS;
  if (formAplus && !validAplus.has(formAplus)) return "Invalid A+ value.";
  // taken is validated against user's dynamic accounts list — no static check needed
  if (formBias && !VALID_BIAS.has(formBias)) return "Invalid bias value.";
  if (formProfit && isNaN(parseFloat(formProfit))) return "Personal P&L must be a number.";
  if (formProfitFunded && isNaN(parseFloat(formProfitFunded))) return "Funded P&L must be a number.";
  if (formChart && !safeUrl(formChart)) return "Invalid chart URL. Must be a valid https:// link.";
  if (formAfter && !safeUrl(formAfter)) return "Invalid after-trade URL. Must be a valid https:// link.";
  const parsedDt = new Date(formDt);
  if (isNaN(parsedDt.getTime())) return "Invalid date.";
  return null;
}

async function recalcAccountPnl(supabase, accountId, pnlField) {
  if (!accountId) return;
  const linkField = pnlField === "profit" ? "account_id_personal" : "account_id_funded";
  const { data } = await supabase.from("trades").select(pnlField).eq(linkField, accountId);
  const total = (data || []).reduce((s, t) => s + (parseFloat(t[pnlField]) || 0), 0);
  await supabase.from("accounts").update({ current_pnl: parseFloat(total.toFixed(2)) }).eq("id", accountId);
}

export function buildDayMap(trades, mode = "personal") {
  const m = {};
  trades.forEach((t) => {
    if (!t.dt) return;
    const k = dateKey(t.dt);
    if (!m[k]) m[k] = { pnl: 0, count: 0, trades: [], aplusTrades: 0 };
    m[k].pnl += getPnlForMode(t, mode);
    if (t.taken) m[k].count++;
    m[k].trades.push(t);
    if (t.aplus?.startsWith("A+") || t.aplus?.startsWith("B")) m[k].aplusTrades++;
  });
  return m;
}

// ─── TOOLTIP ─────────────────────────────────────────────────────────────────

function InfoTip({ text }) {
  const [show, setShow] = useState(false);
  const ref = useRef(null);
  // Close on outside click
  useEffect(() => {
    if (!show) return;
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setShow(false); };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => { document.removeEventListener("mousedown", handler); document.removeEventListener("touchstart", handler); };
  }, [show]);
  return (
    <span ref={ref} style={{ position: "relative", display: "inline-flex" }}>
      <span
        onClick={() => setShow(s => !s)}
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 15, height: 15, borderRadius: "50%", cursor: "help",
          background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700,
          color: "var(--text-tertiary)", flexShrink: 0, userSelect: "none",
        }}
      >?</span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%", transform: "translateX(-50%)",
          width: 220, padding: "10px 12px", borderRadius: 6, zIndex: 100,
          background: "var(--bg-primary)", border: "1px solid var(--border-primary)",
          boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 500,
          color: "var(--text-secondary)", lineHeight: 1.6, textAlign: "left",
          animation: "fadeSlideIn 0.15s ease",
          pointerEvents: "none",
        }}>
          {text}
          <span style={{
            position: "absolute", bottom: -5, left: "50%", transform: "translateX(-50%) rotate(45deg)",
            width: 8, height: 8, background: "var(--bg-primary)", borderRight: "1px solid var(--border-primary)",
            borderBottom: "1px solid var(--border-primary)",
          }} />
        </span>
      )}
    </span>
  );
}

// ─── TRADESHARP SCORE ────────────────────────────────────────────────────────

function calcTradeSharpScore(trades) {
  const valid = trades.filter((t) => t.dt && t.profit !== "" && t.profit != null && t.taken && t.taken !== "Missed");
  if (valid.length < 3) return null; // need minimum trades

  // Win Rate
  const wins = valid.filter((t) => parseFloat(t.profit) > 0).length;
  const winRate = valid.length ? wins / valid.length : 0;

  // Profit Factor
  const grossWin = valid.reduce((s, t) => { const p = parseFloat(t.profit) || 0; return p > 0 ? s + p : s; }, 0);
  const grossLoss = Math.abs(valid.reduce((s, t) => { const p = parseFloat(t.profit) || 0; return p < 0 ? s + p : s; }, 0));
  const profitFactor = grossLoss > 0 ? grossWin / grossLoss : grossWin > 0 ? 5 : 0;

  // Avg Win / Avg Loss ratio
  const winTrades = valid.filter((t) => parseFloat(t.profit) > 0);
  const lossTrades = valid.filter((t) => parseFloat(t.profit) < 0);
  const avgWin = winTrades.length ? winTrades.reduce((s, t) => s + parseFloat(t.profit), 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length ? Math.abs(lossTrades.reduce((s, t) => s + parseFloat(t.profit), 0) / lossTrades.length) : 1;
  const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 5 : 0;

  // Max Drawdown (as % of peak equity)
  let peak = 0, maxDD = 0, equity = 0;
  const sorted = [...valid].sort((a, b) => new Date(a.dt) - new Date(b.dt));
  sorted.forEach((t) => {
    equity += parseFloat(t.profit) || 0;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? (peak - equity) / peak : 0;
    if (dd > maxDD) maxDD = dd;
  });

  // Consistency (% of trading days that are green)
  const dayPnl = {};
  sorted.forEach((t) => {
    const k = dateKey(t.dt);
    dayPnl[k] = (dayPnl[k] || 0) + (parseFloat(t.profit) || 0);
  });
  const days = Object.values(dayPnl);
  const greenDays = days.filter((p) => p > 0).length;
  const consistency = days.length ? greenDays / days.length : 0;

  // Recovery Factor (net profit / max drawdown dollar amount)
  const netProfit = equity;
  const maxDDDollar = peak * maxDD;
  const recoveryFactor = maxDDDollar > 0 ? netProfit / maxDDDollar : netProfit > 0 ? 10 : 0;

  // A+ Discipline — A+ and B = quality setups (planned entries)
  const isAplusSetup = (t) => t.aplus?.startsWith("A+") || t.aplus?.startsWith("B");
  const aplusCount = valid.filter(isAplusSetup).length;
  const aplusPct = valid.length ? aplusCount / valid.length : 0;

  // Execution quality — of quality setups, how many were B grade (execution flaws)
  const execSuckedCount = valid.filter((t) => t.aplus?.startsWith("B")).length;
  const aplusOnlyCount = valid.filter((t) => t.aplus?.startsWith("A+")).length;
  const execQualityPct = aplusCount > 0 ? (aplusOnlyCount / aplusCount) * 100 : null;

  // C grade — marginal/forced setups
  const yesToNoCount = valid.filter((t) => t.aplus?.startsWith("C")).length;

  // Score each pillar 0-100
  const score = (val, tiers) => {
    // tiers: [[threshold, score], ...] ascending
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (val >= tiers[i][0]) return Math.min(100, tiers[i][1] + ((val - tiers[i][0]) / (tiers[i + 1] ? tiers[i + 1][0] - tiers[i][0] : 1)) * (tiers[i + 1] ? tiers[i + 1][1] - tiers[i][1] : 10));
    }
    return Math.max(0, (val / tiers[0][0]) * tiers[0][1]);
  };

  const pillars = [
    { key: "winRate", label: "Win Rate", value: winRate, display: `${(winRate * 100).toFixed(0)}%`, score: score(winRate, [[0.35, 30], [0.50, 55], [0.60, 75], [0.70, 90]]), tip: "Percentage of trades that closed in profit. Winning trades ÷ total trades taken." },
    { key: "profitFactor", label: "Profit Factor", value: profitFactor, display: `${profitFactor.toFixed(2)}`, score: score(profitFactor, [[1.0, 30], [1.5, 55], [2.5, 80], [3.5, 95]]), tip: "Gross profits ÷ gross losses. Above 1.0 means you make more than you lose. Above 2.0 is strong." },
    { key: "avgWinLoss", label: "Win/Loss Size", value: avgWinLoss, display: `${avgWinLoss.toFixed(2)}`, score: score(avgWinLoss, [[0.8, 25], [1.2, 50], [2.0, 75], [3.0, 92]]), tip: "Average winning trade ÷ average losing trade. Shows if your winners are bigger than your losers." },
    { key: "maxDD", label: "Drawdown", value: maxDD, display: `${(maxDD * 100).toFixed(1)}%`, score: score(1 - maxDD, [[0.90, 30], [0.95, 60], [0.98, 82], [0.99, 95]]), tip: "Largest peak-to-trough decline as % of peak equity. Lower is better — measures worst-case risk." },
    { key: "consistency", label: "Consistency", value: consistency, display: `${(consistency * 100).toFixed(0)}%`, score: score(consistency, [[0.40, 25], [0.55, 55], [0.70, 78], [0.80, 93]]), tip: "Percentage of trading days that ended green. Measures how stable your daily returns are." },
    { key: "recoveryFactor", label: "Recovery", value: recoveryFactor, display: `${recoveryFactor.toFixed(1)}`, score: score(recoveryFactor, [[1, 30], [3, 55], [6, 80], [10, 95]]), tip: "Net profit ÷ max drawdown. How quickly you recover from losses. Higher means faster bounce-back." },
    { key: "discipline", label: "A+ Discipline", value: aplusPct, display: `${(aplusPct * 100).toFixed(0)}%`, score: score(aplusPct, [[0.30, 25], [0.50, 50], [0.70, 75], [0.90, 95]]), tip: "Percentage of trades you rated A+ setup quality. Measures how selective you are with entries." },
  ];

  // Weighted composite — consistency and discipline weighted higher for funded traders
  const weights = { winRate: 1.0, profitFactor: 1.2, avgWinLoss: 0.9, maxDD: 1.1, consistency: 1.3, recoveryFactor: 0.8, discipline: 1.2 };
  const totalWeight = Object.values(weights).reduce((s, w) => s + w, 0);
  const composite = Math.round(pillars.reduce((s, p) => s + p.score * weights[p.key], 0) / totalWeight);

  return { pillars, composite, totalTrades: valid.length, execQualityPct, execSuckedCount, yesToNoCount, aplusCount };
}

const AI_COACH_TONE = `You are a direct, analytical trading coach. Your job is to identify execution mistakes, behavioral leaks, and weak patterns with clarity and precision. Be honest, firm, and evidence-based, but never insulting, theatrical, or aggressive. Do not use foul language. Do not flatter. Keep praise brief and specific when it is earned. Focus on what the data shows, what is hurting performance, and what needs to improve next.`;

function buildAISplitSection(trades) {
  const taken = trades.filter((t) => t.taken && t.taken !== "Missed");
  const personalTrades = taken.filter((t) => t.profit != null && t.profit !== "" && !isNaN(parseFloat(t.profit)));
  const fundedTrades = taken.filter((t) => t.profit_funded != null && t.profit_funded !== "" && !isNaN(parseFloat(t.profit_funded)));
  const personalPnl = personalTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  const fundedPnl = fundedTrades.reduce((s, t) => s + (parseFloat(t.profit_funded) || 0), 0);
  const personalWins = personalTrades.filter((t) => parseFloat(t.profit) > 0).length;
  const fundedWins = fundedTrades.filter((t) => parseFloat(t.profit_funded) > 0).length;
  return [
    `PERSONAL ACCOUNT: ${personalTrades.length} trades with P&L entered | ${personalWins} wins | Net P&L: $${personalPnl.toFixed(2)}`,
    `FUNDED ACCOUNT: ${fundedTrades.length} trades with P&L entered | ${fundedWins} wins | Net P&L: $${fundedPnl.toFixed(2)}`,
  ].join("\n");
}

function buildAITagBreakdown(trades) {
  const tagMap = {};
  trades.forEach((t) => {
    if (!t.tags?.length) return;
    t.tags.forEach((tag) => {
      if (!tagMap[tag]) tagMap[tag] = { trades: 0, wins: 0, losses: 0, pnl: 0, funded: 0 };
      tagMap[tag].trades++;
      const pv = parseFloat(t.profit);
      const pfv = parseFloat(t.profit_funded);
      if (!isNaN(pv) && pv > 0) tagMap[tag].wins++;
      if (!isNaN(pv) && pv < 0) tagMap[tag].losses++;
      if (!isNaN(pv)) tagMap[tag].pnl += pv;
      if (!isNaN(pfv)) tagMap[tag].funded += pfv;
    });
  });
  return Object.keys(tagMap).length > 0
    ? "SETUP TAGS BREAKDOWN:\n" + Object.entries(tagMap)
      .sort((a, b) => b[1].trades - a[1].trades)
      .map(([tag, s]) => `  #${tag}: ${s.trades} trades, ${s.wins}W/${s.losses}L, Personal P&L: $${s.pnl.toFixed(0)}, Funded P&L: $${s.funded.toFixed(0)}`)
      .join("\n")
    : "SETUP TAGS: No tags logged yet.";
}

function buildAIModelBreakdown(trades) {
  const modelMap = {};
  trades.forEach((t) => {
    if (!t.model) return;
    if (!modelMap[t.model]) modelMap[t.model] = { trades: 0, wins: 0, losses: 0, pnl: 0, funded: 0, aplus: 0 };
    modelMap[t.model].trades++;
    const pv = parseFloat(t.profit);
    const pfv = parseFloat(t.profit_funded);
    if (!isNaN(pv) && pv > 0) modelMap[t.model].wins++;
    if (!isNaN(pv) && pv < 0) modelMap[t.model].losses++;
    if (!isNaN(pv)) modelMap[t.model].pnl += pv;
    if (!isNaN(pfv)) modelMap[t.model].funded += pfv;
    if (t.aplus?.startsWith("A+") || t.aplus?.startsWith("B")) modelMap[t.model].aplus++;
  });
  return Object.keys(modelMap).length > 0
    ? "MODEL BREAKDOWN:\n" + Object.entries(modelMap)
      .sort((a, b) => b[1].trades - a[1].trades)
      .map(([model, s]) => `  ${model}: ${s.trades} trades, ${s.wins}W/${s.losses}L, A+ setups: ${s.aplus}, Personal P&L: $${s.pnl.toFixed(0)}, Funded P&L: $${s.funded.toFixed(0)}`)
      .join("\n")
    : "MODELS: No model labels logged yet.";
}

function buildAIViolationBreakdown(trades) {
  const taken = trades.filter((t) => t.taken && t.taken !== "Missed");
  const violationTrades = taken.filter((t) => t.violations?.length);
  const cleanTrades = taken.filter((t) => !t.violations?.length);
  const vMap = {};
  violationTrades.forEach((t) => t.violations.forEach((v) => { vMap[v] = (vMap[v] || 0) + 1; }));
  const cleanPnl = cleanTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  const violatingPnl = violationTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  return violationTrades.length > 0
    ? `RULE VIOLATIONS (${violationTrades.length} of ${taken.length} taken trades had violations):
  Clean trades Personal P&L: $${cleanPnl.toFixed(0)}
  Violating trades Personal P&L: $${violatingPnl.toFixed(0)}
` + Object.entries(vMap).sort((a, b) => b[1] - a[1]).map(([v, c]) => `  ${v}: ${c}×`).join("\n")
    : `RULE VIOLATIONS: Zero violations logged across ${taken.length} taken trades. Either the trader was clean or they are not tracking violations yet.`;
}

function buildAIScoreSection(trades) {
  const tsResult = calcTradeSharpScore(trades);
  return tsResult
    ? `TRADESHARP SCORE: ${tsResult.composite}/100 (${tsResult.composite >= 80 ? "ELITE" : tsResult.composite >= 60 ? "SOLID" : tsResult.composite >= 40 ? "DEVELOPING" : "NEEDS WORK"})
PILLAR BREAKDOWN:
${tsResult.pillars.map((pl) => `  ${pl.label}: ${pl.display} (score: ${Math.round(pl.score)}/100)`).join("\n")}
EXECUTION QUALITY: ${tsResult.execQualityPct != null ? tsResult.execQualityPct.toFixed(0) + "% of A+ setups executed cleanly" : "N/A"}`
    : "TRADESHARP SCORE: Insufficient data for this period.";
}

function TradeSharpScore({ trades, month }) {
  const result = useMemo(() => calcTradeSharpScore(trades), [trades]);
  if (!result) {
    return (
      <TCard style={{ padding: 28, marginBottom: 24, textAlign: "center" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>TRADESHARP SCORE</div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)" }}>Log at least 3 trades to generate your score.</div>
      </TCard>
    );
  }

  const { pillars, composite, totalTrades, execQualityPct, execSuckedCount, yesToNoCount, aplusCount } = result;
  const tier = composite >= 80 ? { label: "ELITE", color: "#22d3ee", verdict: "Trading at a high level. Protect this edge." }
    : composite >= 60 ? { label: "SOLID", color: "#22c55e", verdict: "Fundamentals are strong. Sharpen the weak spots." }
    : composite >= 40 ? { label: "DEVELOPING", color: "#f59e0b", verdict: "Building the foundation. Focus on consistency and discipline." }
    : { label: "NEEDS WORK", color: "#ef4444", verdict: "Review your process. Reduce risk, increase selectivity." };

  const pillarColor = (s) => s >= 80 ? "#22d3ee" : s >= 60 ? "#22c55e" : s >= 40 ? "#f59e0b" : "#ef4444";

  // Find strongest and weakest
  const sorted = [...pillars].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  // Score ring SVG
  const ringR = 72;
  const ringCirc = 2 * Math.PI * ringR;
  const ringOffset = ringCirc - (composite / 100) * ringCirc;

  // Mini radar for background texture — 7 axes, compact
  const radarCx = 80, radarCy = 80, radarR = 65;
  const n = pillars.length;
  const radarAngle = (2 * Math.PI) / n;
  const radarStart = -Math.PI / 2;
  const radarPt = (i, pct) => {
    const a = radarStart + i * radarAngle;
    return [radarCx + radarR * pct * Math.cos(a), radarCy + radarR * pct * Math.sin(a)];
  };
  const radarGridPath = (pct) => {
    const pts = pillars.map((_, i) => radarPt(i, pct));
    return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
  };
  const radarScorePts = pillars.map((p, i) => radarPt(i, Math.max(0.08, p.score / 100)));
  const radarScorePath = radarScorePts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";

  return (
    <TCard style={{ padding: 0, marginBottom: 24, marginTop: 24, overflow: "hidden", position: "relative" }}>
      {/* Header */}
      <div style={{
        padding: "20px 28px", borderBottom: "1px solid var(--border-primary)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            TRADESHARP SCORE
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>
            {month} · {totalTrades} trades
          </span>
        </div>
        <span style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "3px 10px",
          borderRadius: 20, letterSpacing: "0.1em",
          background: `${tier.color}18`, color: tier.color, border: `1px solid ${tier.color}40`,
        }}>{tier.label}</span>
      </div>

      {/* Hero — Spider Chart with centered score */}
      <div style={{ padding: "28px 28px 20px", display: "flex", justifyContent: "center" }}>
        <div style={{ position: "relative", width: "100%", maxWidth: 340 }}>
          {/* Glow */}
          <div style={{
            position: "absolute", inset: -30,
            background: `radial-gradient(circle, ${tier.color}06 0%, transparent 65%)`,
            borderRadius: "50%", pointerEvents: "none",
          }} />
          <svg viewBox="0 0 340 340" width="100%" style={{ display: "block", overflow: "visible" }}>
            {(() => {
              const cx = 170, cy = 170, r = 120;
              const angleStep = (2 * Math.PI) / n;
              const startA = -Math.PI / 2;
              const pt = (i, pct) => {
                const a = startA + i * angleStep;
                return [cx + r * pct * Math.cos(a), cy + r * pct * Math.sin(a)];
              };
              const gridPath = (pct) => {
                const pts = pillars.map((_, i) => pt(i, pct));
                return pts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";
              };
              const sPts = pillars.map((p, i) => pt(i, Math.max(0.06, p.score / 100)));
              const sPath = sPts.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ") + " Z";

              return (
                <>
                  {/* Grid rings */}
                  {[0.25, 0.5, 0.75, 1.0].map((pct, i) => (
                    <path key={i} d={gridPath(pct)} fill={pct === 1 ? "none" : "none"} stroke="var(--text-tertiary)" strokeWidth={pct === 1 ? 1.5 : 0.8} opacity={pct === 1 ? 0.4 : 0.15} />
                  ))}
                  {/* Axis lines */}
                  {pillars.map((_, i) => {
                    const p = pt(i, 1);
                    return <line key={i} x1={cx} y1={cy} x2={p[0]} y2={p[1]} stroke="var(--text-tertiary)" strokeWidth="0.8" opacity="0.2" />;
                  })}
                  {/* Score polygon */}
                  <path d={sPath} fill={`${tier.color}20`} stroke={tier.color} strokeWidth="2.5" strokeLinejoin="round">
                    <animate attributeName="opacity" from="0" to="1" dur="0.8s" fill="freeze" />
                  </path>
                  {/* Dots */}
                  {sPts.map((p, i) => (
                    <circle key={i} cx={p[0]} cy={p[1]} r="4" fill={pillarColor(pillars[i].score)} stroke="var(--bg-primary)" strokeWidth="1.5">
                      <animate attributeName="r" from="0" to="4" dur="0.5s" begin={`${i * 0.07}s`} fill="freeze" />
                    </circle>
                  ))}
                  {/* Labels + scores */}
                  {pillars.map((p, i) => {
                    const a = startA + i * angleStep;
                    const lr = r + 36;
                    const lx = cx + lr * Math.cos(a);
                    const ly = cy + lr * Math.sin(a);
                    const anchor = lx < cx - 15 ? "end" : lx > cx + 15 ? "start" : "middle";
                    const dy = ly < cy - 60 ? -4 : ly > cy + 60 ? 14 : 4;
                    return (
                      <g key={i}>
                        <text x={lx} y={ly + dy} textAnchor={anchor} style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                          fill: "var(--text-secondary)", letterSpacing: "0.02em",
                        }}>{p.label}</text>
                        <text x={lx} y={ly + dy + 15} textAnchor={anchor} style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 800,
                          fill: pillarColor(p.score),
                        }}>{Math.round(p.score)}</text>
                      </g>
                    );
                  })}
                  {/* Center composite */}
                  <text x={cx} y={cy - 6} textAnchor="middle" style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 42, fontWeight: 800,
                    fill: tier.color, letterSpacing: "-0.03em",
                  }}>{composite}</text>
                  <text x={cx} y={cy + 14} textAnchor="middle" style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 8, fontWeight: 700,
                    fill: "var(--text-tertiary)", letterSpacing: "0.25em",
                  }}>OVERALL</text>
                </>
              );
            })()}
          </svg>
        </div>
      </div>

      {/* Strength / Weakness callout */}
      <div style={{ padding: "0 28px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{
          flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 6,
          background: `${pillarColor(strongest.score)}08`, border: `1px solid ${pillarColor(strongest.score)}20`,
        }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>STRONGEST</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: pillarColor(strongest.score) }}>
            {strongest.label} · {Math.round(strongest.score)}
          </div>
        </div>
        <div style={{
          flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 6,
          background: `${pillarColor(weakest.score)}08`, border: `1px solid ${pillarColor(weakest.score)}20`,
        }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>FOCUS AREA</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: pillarColor(weakest.score) }}>
            {weakest.label} · {Math.round(weakest.score)}
          </div>
        </div>
      </div>

      {/* Execution Quality + Review Honesty */}
      {aplusCount > 0 && (
        <div style={{ padding: "0 28px 20px", display: "flex", gap: 12, flexWrap: "wrap" }}>
          {execQualityPct !== null && (
            <div style={{
              flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 6,
              background: execSuckedCount > 0 ? "rgba(245,158,11,0.06)" : "rgba(34,197,94,0.06)",
              border: `1px solid ${execSuckedCount > 0 ? "rgba(245,158,11,0.2)" : "rgba(34,197,94,0.2)"}`,
            }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>EXECUTION QUALITY</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: execSuckedCount > 0 ? "#f59e0b" : "#22c55e" }}>
                {execQualityPct.toFixed(0)}% clean
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>
                {execSuckedCount > 0 ? `${execSuckedCount} of ${aplusCount} quality setups had execution issues` : `All ${aplusCount} setups executed at A+ quality`}
              </div>
            </div>
          )}
          {yesToNoCount > 0 && (
            <div style={{
              flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 6,
              background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)",
            }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>C-GRADE SETUPS</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
                {yesToNoCount} marginal{yesToNoCount > 1 ? "" : ""} setup{yesToNoCount > 1 ? "s" : ""}
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>
                Forced or borderline — avoid these
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pillar Breakdown */}
      <div style={{ padding: "0 28px 28px" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
          PILLAR BREAKDOWN
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {pillars.map((p) => (
            <div key={p.key}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: "var(--text-secondary)" }}>{p.label}</span>
                  <InfoTip text={p.tip} />
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", fontVariantNumeric: "tabular-nums" }}>{p.display}</span>
                </div>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800, color: pillarColor(p.score), fontVariantNumeric: "tabular-nums", minWidth: 28, textAlign: "right" }}>
                  {Math.round(p.score)}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 3, background: "var(--bg-tertiary)", overflow: "hidden" }}>
                <div style={{
                  height: "100%", borderRadius: 3,
                  width: `${Math.max(2, p.score)}%`,
                  background: `linear-gradient(90deg, ${pillarColor(p.score)}66, ${pillarColor(p.score)})`,
                  boxShadow: `0 0 8px ${pillarColor(p.score)}30`,
                  transition: "width 1s ease",
                }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </TCard>
  );
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────

export function PageBanner({ label, title, subtitle }) {
  return (
    <div style={{
      background: "linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-tertiary) 100%)",
      border: "1px solid var(--border-primary)",
      borderRadius: 8, padding: "24px 28px", marginBottom: 24,
      position: "relative", overflow: "hidden",
      backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)",
    }}>
      <div style={{
        position: "absolute", top: 0, right: 0, width: 200, height: "100%",
        background: "radial-gradient(ellipse at right, var(--accent-glow) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{ position: "relative" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 8 }}>
          {label}
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
          {title}
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.6 }}>
          {subtitle}
        </div>
      </div>
    </div>
  );
}

function TCard({ children, style = {}, className = "", onClick }) {
  return (
    <div className={`card-pad ${className}`} onClick={onClick} style={{
      background: "var(--card-bg, var(--bg-secondary))",
      backdropFilter: "var(--glass-blur)",
      WebkitBackdropFilter: "var(--glass-blur)",
      borderRadius: 10,
      border: "1px solid var(--border-primary)",
      boxShadow: "var(--card-glow)",
      ...style,
    }}>
      {children}
    </div>
  );
}

function StatBox({ value, label, color = "var(--green)", style = {} }) {
  return (
    <TCard style={{ padding: "18px 20px", textAlign: "center", ...style }}>
      <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 26, fontWeight: 700, color, letterSpacing: "-0.02em" }}>{value}</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
    </TCard>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`,
      fontFamily: "'Plus Jakarta Sans', sans-serif", letterSpacing: "0.05em",
    }}>
      {label}
    </span>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", fontSize: 14, border: "1px solid var(--border-primary)",
  borderRadius: 6, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)",
  fontFamily: "inherit", transition: "all 0.2s ease",
  backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST TAB — Only the A+ checklist
// ═══════════════════════════════════════════════════════════════════════════

function makeModelId() { return "m_" + Math.random().toString(36).slice(2, 9); }

export function ChecklistView({ supabase, user, embedded = false }) {
  const toast = useToast();
  const [confirmDeleteModel, setConfirmDeleteModel] = useState(null);
  const [models, setModels] = useState(null); // null = loading
  const [activeModelId, setActiveModelId] = useState(null);
  const [checked, setChecked] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(10);
  const timerRef = useRef(null);

  // Edit mode (customize items)
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newSub, setNewSub] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  // Model management
  const [renamingId, setRenamingId] = useState(null);
  const [renameVal, setRenameVal] = useState("");
  const [addingModel, setAddingModel] = useState(false);
  const [newModelName, setNewModelName] = useState("");

  // News risk gate
  const [nowET, setNowET] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setNowET(new Date()), 30000);
    return () => clearInterval(id);
  }, []);
  const nextHighEvent = getNextHighImpactEvent(nowET);
  const minsUntilHigh = nextHighEvent ? getMinutesUntil(nextHighEvent, nowET) : null;
  const isNewsRisk = minsUntilHigh !== null && minsUntilHigh >= -10 && minsUntilHigh <= 30;

  // ── Load from Supabase — handle old format migration ──
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("checklist_items")
        .select("items")
        .eq("user_id", user.id)
        .maybeSingle();
      let loaded;
      if (data?.items?.v === 2 && Array.isArray(data.items.models)) {
        loaded = data.items.models;
      } else if (Array.isArray(data?.items)) {
        // Migrate old single-list format → "GxT" model
        loaded = [{ id: makeModelId(), name: "My Model", items: data.items }];
      } else {
        loaded = [{ id: makeModelId(), name: "My Model", items: DEFAULT_CHECKLIST_ITEMS }];
      }
      setModels(loaded);
      setActiveModelId(loaded[0].id);
      setChecked(new Array(loaded[0].items.length + 1).fill(false));
    })();
  }, [user]);

  const saveModels = async (updated) => {
    await supabase.from("checklist_items").upsert(
      { user_id: user.id, items: { v: 2, models: updated } },
      { onConflict: "user_id" }
    );
  };

  const activeModel = models?.find(m => m.id === activeModelId) || models?.[0];
  const allItems = activeModel ? [...activeModel.items, TIMER_ITEM] : [...DEFAULT_CHECKLIST_ITEMS, TIMER_ITEM];
  const totalCount = allItems.length;

  // Reset checked when switching models
  const switchModel = (id) => {
    if (id === activeModelId) return;
    setActiveModelId(id);
    const m = models.find(m => m.id === id);
    setChecked(new Array((m?.items.length || 0) + 1).fill(false));
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setTimerSecs(10);
    setEditing(false);
  };

  const toggleCheck = (i) => {
    if (allItems[i].timer) { startTimer(i); return; }
    setChecked((prev) => { const n = [...prev]; n[i] = !n[i]; return n; });
  };

  const startTimer = (i) => {
    if (checked[i]) { setChecked((prev) => { const n = [...prev]; n[i] = false; return n; }); return; }
    if (timerActive) return;
    setTimerActive(true);
    setTimerSecs(10);
    let secs = 10;
    timerRef.current = setInterval(() => {
      secs--;
      setTimerSecs(secs);
      if (secs <= 0) {
        clearInterval(timerRef.current);
        setTimerActive(false);
        setChecked((prev) => { const n = [...prev]; n[i] = true; return n; });
      }
    }, 1000);
  };

  const resetChecklist = () => {
    setChecked(new Array(totalCount).fill(false));
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setTimerSecs(10);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  // ── Model management ──
  const startRename = (m) => { setRenamingId(m.id); setRenameVal(m.name); };
  const commitRename = async () => {
    const trimmed = renameVal.trim();
    if (!trimmed || !renamingId) { setRenamingId(null); return; }
    const updated = models.map(m => m.id === renamingId ? { ...m, name: trimmed } : m);
    setModels(updated);
    setRenamingId(null);
    await saveModels(updated);
  };

  const addModel = async () => {
    const name = newModelName.trim();
    if (!name) return;
    const newM = { id: makeModelId(), name, items: [] };
    const updated = [...models, newM];
    setModels(updated);
    setAddingModel(false);
    setNewModelName("");
    switchModel(newM.id);
    await saveModels(updated);
  };

  const deleteModel = async (id) => {
    if (models.length <= 1) { toast("You need at least one model."); return; }
    const updated = models.filter(m => m.id !== id);
    setModels(updated);
    if (activeModelId === id) switchModel(updated[0].id);
    await saveModels(updated);
  };

  // ── Edit items (customize active model) ──
  const openEdit = () => {
    setEditItems((activeModel?.items || DEFAULT_CHECKLIST_ITEMS).map(item => ({ ...item })));
    setEditing(true);
    setNewLabel("");
    setNewSub("");
  };

  const cancelEdit = () => { setEditing(false); setEditItems([]); setNewLabel(""); setNewSub(""); };

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (editItems.length >= 20) { toast("Maximum 20 items."); return; }
    setEditItems([...editItems, { label, sub: newSub.trim() }]);
    setNewLabel(""); setNewSub("");
  };

  const removeItem = (i) => setEditItems(editItems.filter((_, idx) => idx !== i));

  const moveItem = (from, to) => {
    if (to < 0 || to >= editItems.length) return;
    const items = [...editItems];
    const [moved] = items.splice(from, 1);
    items.splice(to, 0, moved);
    setEditItems(items);
  };

  const handleDragStart = (i) => setDragIdx(i);
  const handleDragOver = (e, i) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === i) return;
    moveItem(dragIdx, i);
    setDragIdx(i);
  };
  const handleDragEnd = () => setDragIdx(null);

  const saveItems = async () => {
    if (!user) return;
    setSaving(true);
    const updated = models.map(m => m.id === activeModelId ? { ...m, items: editItems } : m);
    setModels(updated);
    setChecked(new Array(editItems.length + 1).fill(false));
    setEditing(false);
    setSaving(false);
    await saveModels(updated);
  };

  const count = checked.filter(Boolean).length;
  const allChecked = checked.length === totalCount && count === totalCount;

  if (models === null) {
    return (
      <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
        <TCard style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)" }}>Loading checklist...</div>
        </TCard>
      </div>
    );
  }

  // ── Edit Mode UI ──
  if (editing) {
    return (
      <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
        <TCard style={{ padding: 28 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>CUSTOMIZE — {activeModel?.name}</div>
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>{editItems.length} / 20 items</div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 20 }}>
            {editItems.map((item, i) => (
              <div
                key={i}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={(e) => handleDragOver(e, i)}
                onDragEnd={handleDragEnd}
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  background: dragIdx === i ? "var(--accent-glow)" : "var(--bg-tertiary)",
                  border: `1px solid ${dragIdx === i ? "var(--accent-dim)" : "var(--border-primary)"}`,
                  borderRadius: 6, padding: "12px 16px", cursor: "grab", transition: "all 0.15s", userSelect: "none",
                }}
              >
                <div style={{ color: "var(--text-tertiary)", fontSize: 16, cursor: "grab", flexShrink: 0 }}>⠿</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveItem(i, i - 1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", fontSize: 10, color: i === 0 ? "var(--border-primary)" : "var(--text-tertiary)", padding: 0, lineHeight: 1 }}>▲</button>
                  <button onClick={() => moveItem(i, i + 1)} disabled={i === editItems.length - 1} style={{ background: "none", border: "none", cursor: i === editItems.length - 1 ? "default" : "pointer", fontSize: 10, color: i === editItems.length - 1 ? "var(--border-primary)" : "var(--text-tertiary)", padding: 0, lineHeight: 1 }}>▼</button>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</div>}
                </div>
                <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-tertiary)", flexShrink: 0, padding: "0 4px" }}>✕</button>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, background: "var(--bg-tertiary)", border: "1px dashed var(--border-primary)", borderRadius: 6, padding: "12px 16px", marginBottom: 20, opacity: 0.6 }}>
            <div style={{ fontSize: 16, flexShrink: 0 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{TIMER_ITEM.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{TIMER_ITEM.sub}</div>
            </div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", flexShrink: 0 }}>ALWAYS LAST</div>
          </div>

          <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: 16, border: "1px solid var(--border-primary)", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>ADD NEW ITEM</div>
            <input type="text" placeholder="Condition name (required)" value={newLabel} onChange={(e) => setNewLabel(e.target.value)} maxLength={200} onKeyDown={(e) => e.key === "Enter" && addItem()} style={{ ...inputStyle, marginBottom: 8 }} />
            <input type="text" placeholder="Description (optional)" value={newSub} onChange={(e) => setNewSub(e.target.value)} maxLength={300} onKeyDown={(e) => e.key === "Enter" && addItem()} style={{ ...inputStyle, marginBottom: 10 }} />
            <button onClick={addItem} disabled={!newLabel.trim()} style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", padding: 10, fontSize: 12, fontWeight: 600,
              background: "transparent", border: `1px solid ${newLabel.trim() ? "var(--green)" : "var(--border-primary)"}`,
              color: newLabel.trim() ? "var(--green)" : "var(--text-tertiary)",
              borderRadius: 4, cursor: newLabel.trim() ? "pointer" : "default", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s",
            }}>+ ADD ITEM</button>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={cancelEdit} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, padding: 12, fontSize: 12, fontWeight: 600, background: "transparent", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase" }}>CANCEL</button>
            <button onClick={saveItems} disabled={saving || editItems.length === 0} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 2, padding: 12, fontSize: 12, fontWeight: 700, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.08em", textTransform: "uppercase", boxShadow: "none", transition: "all 0.2s" }}>{saving ? "SAVING..." : "SAVE CHECKLIST"}</button>
          </div>
        </TCard>
      </div>
    );
  }

  // ── Normal Checklist UI ──
  return (
    <div style={embedded ? {} : { animation: "fadeSlideIn 0.3s ease" }}>
      {!embedded && <PageBanner
        label="PRE-TRADE CHECKLIST"
        title="Only A+ setups deserve your capital."
        subtitle="Run through every criterion before you execute. Discipline is the edge."
      />}
      <TCard style={{ padding: 28 }}>

        {/* ── News Risk Gate ── */}
        {isNewsRisk && nextHighEvent && (
          <div style={{
            padding: "14px 18px", marginBottom: 20,
            background: "rgba(251,113,133,0.08)",
            border: "1px solid var(--red)",
            borderRadius: 6,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", animation: "hudPulse 2s infinite", flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 11, fontWeight: 800, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                NEWS RISK — {nextHighEvent.name} ({minsUntilHigh > 0 ? `in ${minsUntilHigh}m` : `${Math.abs(minsUntilHigh)}m ago`})
              </div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 3 }}>
                High-impact event active. Consider waiting for the move to settle before entering.
              </div>
            </div>
          </div>
        )}

        {/* ── Model tabs ── */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
          {models.map((m) => {
            const isActive = m.id === activeModelId;
            return (
              <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                {renamingId === m.id ? (
                  <input
                    autoFocus
                    value={renameVal}
                    onChange={(e) => setRenameVal(e.target.value)}
                    onBlur={commitRename}
                    onKeyDown={(e) => { if (e.key === "Enter") commitRename(); if (e.key === "Escape") setRenamingId(null); }}
                    maxLength={30}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
                      padding: "5px 10px", borderRadius: 20, border: "1.5px solid var(--accent)",
                      background: "var(--accent-dim)", color: "var(--accent)", outline: "none", width: 100,
                    }}
                  />
                ) : (
                  <button
                    onClick={() => switchModel(m.id)}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
                      padding: "5px 14px", borderRadius: 20, cursor: "pointer", transition: "all 0.15s",
                      border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border-primary)"}`,
                      background: isActive ? "var(--accent-dim)" : "transparent",
                      color: isActive ? "var(--accent)" : "var(--text-tertiary)",
                      letterSpacing: "0.04em",
                    }}
                  >{m.name}</button>
                )}
                {isActive && renamingId !== m.id && (
                  <button onClick={() => startRename(m)} title="Rename model" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-tertiary)", padding: "0 2px", lineHeight: 1 }}>✎</button>
                )}
              </div>
            );
          })}

          {/* Customize active model */}
          <button onClick={openEdit} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600, padding: "5px 12px",
            background: "transparent", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)",
            borderRadius: 20, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
            transition: "all 0.2s", marginLeft: "auto",
          }}>CUSTOMIZE</button>
        </div>

        {/* Progress bar */}
        <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 8, marginBottom: 10, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "var(--green)", transition: "width 0.3s", width: `${(count / totalCount) * 100}%`, boxShadow: "none" }} />
        </div>
        <div style={{ textAlign: "right", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 24 }}>
          <span style={{ color: "var(--green)", fontWeight: 600 }}>{count}</span> / {totalCount} confirmed
        </div>

        {activeModel?.items.length === 0 ? (
          <div style={{ textAlign: "center", padding: "32px 0", color: "var(--text-tertiary)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
            No items yet. Click <strong style={{ color: "var(--accent)" }}>CUSTOMIZE</strong> to add your checklist conditions.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {allItems.map((item, i) => (
              <div
                key={i}
                onClick={() => toggleCheck(i)}
                style={{
                  display: "flex", alignItems: "center", gap: 16,
                  background: checked[i] ? "var(--accent-glow)" : "var(--bg-tertiary)",
                  border: `1.5px solid ${checked[i] ? "var(--accent-dim)" : "var(--border-primary)"}`,
                  borderRadius: 6, padding: "16px 20px", cursor: "pointer",
                  transition: "all 0.2s", userSelect: "none",
                  boxShadow: checked[i] ? "0 0 0 1px var(--accent-dim)" : "none",
                }}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 4,
                  border: `2px solid ${checked[i] ? "var(--green)" : "var(--border-primary)"}`,
                  background: checked[i] ? "var(--green)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  flexShrink: 0, fontSize: 14, color: "var(--bg-primary)", transition: "all 0.2s",
                }}>
                  {checked[i] && "✓"}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: checked[i] ? "var(--green)" : "var(--text-primary)" }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>{item.sub}</div>}
                  {item.timer && !checked[i] && (
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", marginTop: 10, fontSize: 13, color: timerActive ? "var(--gold)" : "var(--text-tertiary)" }}>
                      {timerActive ? `⏱ Think about it... ${timerSecs}s` : "Click to start 10 second timer..."}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeModel?.items.length > 0 && (<>
          <div style={{
            marginTop: 28, borderRadius: 6, padding: 22, textAlign: "center",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: allChecked ? 700 : 400, fontSize: allChecked ? 14 : 13,
            letterSpacing: allChecked ? "0.1em" : "0.05em", textTransform: "uppercase",
            background: allChecked ? "var(--accent-glow)" : "var(--bg-tertiary)",
            border: `1.5px solid ${allChecked ? "var(--accent-dim)" : "var(--border-primary)"}`,
            color: allChecked ? "var(--green)" : "var(--text-tertiary)",
            boxShadow: allChecked ? "0 0 0 1px var(--accent-dim)" : "none",
            animation: allChecked ? "subtleGlow 2s ease infinite" : "none",
          }}>
            {allChecked ? "A+ TRADE CONFIRMED — TAKE IT" : "Check off all conditions to confirm your setup."}
          </div>
          <button onClick={resetChecklist} style={{
            display: "block", width: "100%", marginTop: 18, padding: 14,
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            background: "transparent", border: "1.5px solid var(--border-primary)", color: "var(--text-tertiary)",
            borderRadius: 4, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
          }}>RESET FOR NEXT TRADE</button>
        </>)}
      </TCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNAL TAB — Pre-Trade Plan + Log a Trade
// ═══════════════════════════════════════════════════════════════════════════

export function JournalView({ supabase, user, loadTrades, privacyMode, prefs }) {
  const toast = useToast();
  // Plan state
  const [plan, setPlan] = useState({ session_plan: "" });
  const [mood, setMood] = useState(null);

  // Load today's mood
  useEffect(() => {
    if (!user) return;
    const today = new Date().toISOString().slice(0, 10);
    supabase.from("daily_moods").select("mood").eq("user_id", user.id).eq("mood_date", today).maybeSingle().then(({ data }) => {
      if (data) setMood(data.mood);
    });
  }, [user]);

  const selectMood = async (m) => {
    setMood(m);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("daily_moods").upsert({ user_id: user.id, mood_date: today, mood: m }, { onConflict: "user_id,mood_date" });
  };

  // Form state
  const [formDt, setFormDt] = useState(nowLocal());
  const [formAsset, setFormAsset] = useState("");
  const [formDirection, setFormDirection] = useState("");
  const [formAplus, setFormAplus] = useState("");
  const [formTaken, setFormTaken] = useState("");
  const [formBias, setFormBias] = useState("");
  const [formProfit, setFormProfit] = useState("");
  const [formProfitFunded, setFormProfitFunded] = useState("");
  const [formRisk, setFormRisk] = useState(prefs?.default_risk ? String(prefs.default_risk) : "");
  const [formChart, setFormChart] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAfterThoughts, setFormAfterThoughts] = useState("");
  const [formModel, setFormModel] = useState("");
  const [formTags, setFormTags] = useState([]);
  const [formViolations, setFormViolations] = useState([]);
  const [formAccountPersonal, setFormAccountPersonal] = useState("");
  const [formAccountFunded, setFormAccountFunded] = useState("");
  const [formEntryPrice, setFormEntryPrice] = useState("");
  const [formExitPrice, setFormExitPrice] = useState("");
  const [formStopLoss, setFormStopLoss] = useState("");
  const [formTakeProfit, setFormTakeProfit] = useState("");
  const [formTimeframe, setFormTimeframe] = useState("");
  const [showReplayFields, setShowReplayFields] = useState(false);

  // Accounts for selectors
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type,status").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setAccounts(data); });
  }, [user]);

  // Checklist models for model selector
  const [tradeModels, setTradeModels] = useState([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("checklist_items").select("items").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const models = data?.items?.models ?? [];
        setTradeModels(models.map(m => m.name).filter(Boolean));
      });
  }, [user]);

  const todayStr = todayKey();

  // Load today's plan
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("trade_plans")
        .select("*")
        .eq("user_id", user.id)
        .eq("plan_date", todayStr)
        .single();
      if (data) setPlan({ session_plan: data.session_plan || "" });
    })();
  }, [user, todayStr]);

  const logTrade = async () => {
    const err = validateTradeForm({ formDt, formAsset, formDirection, formAplus, formTaken, formBias, formProfit, formProfitFunded, formChart, formAfter, aplusOptions: null });
    if (err) { toast(err); return; }
    const parsedDt = new Date(formDt);
    const tradeData = {
      user_id: user.id,
      dt: parsedDt.toISOString(),
      asset: formAsset,
      direction: formDirection,
      aplus: formAplus,
      taken: formTaken,
      bias: formBias,
      profit: formProfit ? parseFloat(formProfit) : null,
      chart: safeUrl(formChart) || "",
      after_chart: safeUrl(formAfter) || "",
      notes: sanitizeText(formNotes),
      ...(formAfterThoughts ? { after_thoughts: sanitizeText(formAfterThoughts) } : {}),
      ...(formModel ? { model: formModel } : {}),
      ...(formProfitFunded ? { profit_funded: parseFloat(formProfitFunded) } : {}),
      ...(formTags.length > 0 ? { tags: formTags } : {}),
      ...(formViolations.length > 0 ? { violations: formViolations } : {}),
      ...(formAccountPersonal ? { account_id_personal: formAccountPersonal } : {}),
      ...(formAccountFunded ? { account_id_funded: formAccountFunded } : {}),
      risk: formRisk !== "" ? parseFloat(formRisk) : null,
      ...(formEntryPrice !== "" ? { entry_price: parseFloat(formEntryPrice) } : {}),
      ...(formExitPrice !== "" ? { exit_price: parseFloat(formExitPrice) } : {}),
      ...(formStopLoss !== "" ? { stop_loss: parseFloat(formStopLoss) } : {}),
      ...(formTakeProfit !== "" ? { take_profit: parseFloat(formTakeProfit) } : {}),
      ...(formTimeframe ? { timeframe: formTimeframe } : {}),
    };
    const { error } = await supabase.from("trades").insert(tradeData);
    if (error) { toast("Error saving trade: " + error.message); return; }
    await recalcAccountPnl(supabase, formAccountPersonal, "profit");
    setFormAsset(""); setFormDirection(""); setFormAplus("");
    setFormTaken(""); setFormProfit(""); setFormProfitFunded(""); setFormRisk(prefs?.default_risk ? String(prefs.default_risk) : ""); setFormChart("");
    setFormAfter(""); setFormNotes(""); setFormAfterThoughts(""); setFormModel(""); setFormTags([]); setFormViolations([]); setFormAccountPersonal(""); setFormAccountFunded(""); setFormDt(nowLocal());
    setFormEntryPrice(""); setFormExitPrice(""); setFormStopLoss(""); setFormTakeProfit(""); setFormTimeframe("");
    loadTrades();
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="TRADE JOURNAL"
        title="Track every session, grow every week."
        subtitle="Log your trades, review your equity curve, and hold yourself accountable to the process."
      />
      {/* Log Trade Form */}
      <TCard style={{ padding: 28 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>
          LOG A TRADE
        </div>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <Field label="Date & Time">
            <input type="datetime-local" style={inputStyle} value={formDt} onChange={(e) => setFormDt(e.target.value)} />
          </Field>
          <Field label="Asset">
            <input type="text" style={inputStyle} value={formAsset} onChange={(e) => setFormAsset(e.target.value.toUpperCase())} placeholder="e.g. NQ, EUR/USD, AAPL" maxLength={30} />
          </Field>
          <Field label="Direction">
            <select style={selectStyle} value={formDirection} onChange={(e) => setFormDirection(e.target.value)}>
              <option value="">Select...</option>
              <option>Long</option>
              <option>Short</option>
            </select>
          </Field>
          <Field label="Setup Quality">
            <select style={selectStyle} value={formAplus} onChange={(e) => setFormAplus(e.target.value)}>
              <option value="">Select...</option>
              {(APLUS_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
            </select>
          </Field>
          {tradeModels.length > 0 && (
            <Field label="Model / Strategy">
              <select style={selectStyle} value={formModel} onChange={e => setFormModel(e.target.value)}>
                <option value="">— Select model —</option>
                {tradeModels.map(name => <option key={name} value={name}>{name}</option>)}
              </select>
            </Field>
          )}
          <Field label="Taken?">
            <select style={selectStyle} value={formTaken} onChange={(e) => setFormTaken(e.target.value)}>
              <option value="">Select...</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
              <option value="Missed">Missed</option>
            </select>
          </Field>
          <Field label="My Bias For the Day">
            <select style={selectStyle} value={formBias} onChange={(e) => setFormBias(e.target.value)}>
              <option value="">Select...</option>
              <option>Bullish</option>
              <option>Bearish</option>
            </select>
          </Field>
          <Field label="Personal P&L ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 500 or -200" value={formProfit} onChange={(e) => setFormProfit(e.target.value)} />
          </Field>
          <Field label="Funded P&L ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 800 or -300" value={formProfitFunded} onChange={(e) => setFormProfitFunded(e.target.value)} />
          </Field>
          <Field label={<>Risk ($) <span style={{ fontWeight: 400, opacity: 0.45, textTransform: "none", letterSpacing: 0 }}>optional</span></>}>
            <input type="number" style={inputStyle} value={formRisk} onChange={(e) => setFormRisk(e.target.value)} placeholder={prefs?.default_risk ? String(prefs.default_risk) : "e.g. 500"} />
          </Field>
          <Field label="Personal Account">
            <select style={selectStyle} value={formAccountPersonal} onChange={(e) => setFormAccountPersonal(e.target.value)}>
              <option value="">None</option>
              {accounts.filter(a => a.account_type === "personal").map(a => (
                <option key={a.id} value={a.id}>{a.account_name}</option>
              ))}
            </select>
          </Field>
          <Field label="Funded Account">
            <select style={selectStyle} value={formAccountFunded} onChange={(e) => setFormAccountFunded(e.target.value)}>
              <option value="">None</option>
              {accounts.filter(a => a.account_type === "funded" || a.account_type === "eval").map(a => (
                <option key={a.id} value={a.id}>{a.account_name} — {a.firm}</option>
              ))}
            </select>
          </Field>
          <Field label="TradingView Link">
            <input type="url" style={inputStyle} placeholder="https://tradingview.com/..." value={formChart} onChange={(e) => setFormChart(e.target.value)} />
          </Field>
          <Field label="After Trade Link" full>
            <input type="url" style={inputStyle} placeholder="https://tradingview.com/..." value={formAfter} onChange={(e) => setFormAfter(e.target.value)} />
          </Field>
          <Field label="Trade Notes" full>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="Entry reason, observations, mistakes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
          </Field>
          <Field label="After Trade Thoughts" full>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="What did I learn? What would I do differently? How did I feel after?" value={formAfterThoughts} onChange={(e) => setFormAfterThoughts(e.target.value)} />
            <TagPicker selected={formTags} onChange={setFormTags} tags={prefs?.tags} />
          </Field>
          <Field label="Rule Violations" full>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>Tag any rules you broke on this trade</div>
            <ViolationPicker selected={formViolations} onChange={setFormViolations} allViolations={buildEffectiveViolations(prefs)} />
          </Field>
        </div>
        {/* Replay Data collapsible */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => setShowReplayFields(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showReplayFields ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}><polyline points="9 18 15 12 9 6"/></svg>
            Replay Data <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional — fill to enable chart replay)</span>
          </button>
          {showReplayFields && (
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 12 }}>
              <Field label="Entry Price"><input type="number" step="0.01" style={inputStyle} value={formEntryPrice} onChange={e => setFormEntryPrice(e.target.value)} placeholder="e.g. 18450.25" /></Field>
              <Field label="Exit Price"><input type="number" step="0.01" style={inputStyle} value={formExitPrice} onChange={e => setFormExitPrice(e.target.value)} placeholder="e.g. 18510.50" /></Field>
              <Field label="Stop Loss"><input type="number" step="0.01" style={inputStyle} value={formStopLoss} onChange={e => setFormStopLoss(e.target.value)} placeholder="e.g. 18400.00" /></Field>
              <Field label="Take Profit"><input type="number" step="0.01" style={inputStyle} value={formTakeProfit} onChange={e => setFormTakeProfit(e.target.value)} placeholder="e.g. 18550.00" /></Field>
              <Field label="Timeframe" full>
                <select style={selectStyle} value={formTimeframe} onChange={e => setFormTimeframe(e.target.value)}>
                  <option value="">Auto-detect</option>
                  <option value="1m">1m</option><option value="5m">5m</option><option value="15m">15m</option>
                  <option value="1H">1H</option><option value="4H">4H</option><option value="1D">1D</option>
                </select>
              </Field>
            </div>
          )}
        </div>

        <button onClick={logTrade} style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", padding: 13, fontSize: 13, fontWeight: 700, border: "1px solid rgba(34,211,238,0.25)", borderRadius: 4, cursor: "pointer",
          background: "var(--accent-dim)", color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase",
          boxShadow: "none",
        }}>
          + LOG TRADE
        </button>
      </TCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// QUICK LOG MODAL
// ═══════════════════════════════════════════════════════════════════════════

export function QuickLogModal({ supabase, user, onClose, prefs }) {
  const toast = useToast();
  const [formDt, setFormDt] = useState(nowLocal());
  const [formAsset, setFormAsset] = useState("");
  const [formDirection, setFormDirection] = useState("");
  const [formAplus, setFormAplus] = useState("");
  const [formTaken, setFormTaken] = useState("");
  const [formBias, setFormBias] = useState("");
  const [formProfit, setFormProfit] = useState("");
  const [formProfitFunded, setFormProfitFunded] = useState("");
  const [formChart, setFormChart] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAfterThoughts, setFormAfterThoughts] = useState("");
  const [formRisk, setFormRisk] = useState(prefs?.default_risk ? String(prefs.default_risk) : "");
  const [formModel, setFormModel] = useState("");
  const [formTags, setFormTags] = useState([]);
  const [formViolations, setFormViolations] = useState([]);
  const [formAccountPersonal, setFormAccountPersonal] = useState("");
  const [formAccountFunded, setFormAccountFunded] = useState("");
  const [formEntryPrice, setFormEntryPrice] = useState("");
  const [formExitPrice, setFormExitPrice] = useState("");
  const [formStopLoss, setFormStopLoss] = useState("");
  const [formTakeProfit, setFormTakeProfit] = useState("");
  const [formTimeframe, setFormTimeframe] = useState("");
  const [showReplayFields, setShowReplayFields] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [tradeModels, setTradeModels] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setAccounts(data); });
    supabase.from("checklist_items").select("items").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        const models = data?.items?.models ?? [];
        setTradeModels(models.map(m => m.name).filter(Boolean));
      });
  }, [user]);

  const logTrade = async () => {
    const err = validateTradeForm({ formDt, formAsset, formDirection, formAplus, formTaken, formBias, formProfit, formProfitFunded, formChart, formAfter, aplusOptions: null });
    if (err) { toast(err); return; }
    const parsedDt = new Date(formDt);
    setSaving(true);
    const tradeData = {
      user_id: user.id,
      dt: parsedDt.toISOString(),
      asset: formAsset, direction: formDirection, aplus: formAplus,
      taken: formTaken, bias: formBias,
      profit: formProfit ? parseFloat(formProfit) : null,
      chart: safeUrl(formChart) || "",
      after_chart: safeUrl(formAfter) || "",
      notes: sanitizeText(formNotes),
      ...(formAfterThoughts ? { after_thoughts: sanitizeText(formAfterThoughts) } : {}),
      ...(formModel ? { model: formModel } : {}),
      ...(formProfitFunded ? { profit_funded: parseFloat(formProfitFunded) } : {}),
      ...(formTags.length > 0 ? { tags: formTags } : {}),
      ...(formViolations.length > 0 ? { violations: formViolations } : {}),
      ...(formAccountPersonal ? { account_id_personal: formAccountPersonal } : {}),
      ...(formAccountFunded ? { account_id_funded: formAccountFunded } : {}),
      risk: formRisk !== "" ? parseFloat(formRisk) : null,
      ...(formEntryPrice !== "" ? { entry_price: parseFloat(formEntryPrice) } : {}),
      ...(formExitPrice !== "" ? { exit_price: parseFloat(formExitPrice) } : {}),
      ...(formStopLoss !== "" ? { stop_loss: parseFloat(formStopLoss) } : {}),
      ...(formTakeProfit !== "" ? { take_profit: parseFloat(formTakeProfit) } : {}),
      ...(formTimeframe ? { timeframe: formTimeframe } : {}),
    };
    const { error } = await supabase.from("trades").insert(tradeData);
    setSaving(false);
    if (error) { toast("Error saving trade: " + error.message); return; }
    await recalcAccountPnl(supabase, formAccountPersonal, "profit");
    setSaved(true);
    setTimeout(() => onClose(), 900);
  };

  const inputStyle = {
    fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", padding: "9px 11px", fontSize: 13,
    background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", borderRadius: 4,
    color: "var(--text-primary)", outline: "none", boxSizing: "border-box",
  };
  const selectStyle = { ...inputStyle, cursor: "pointer" };

  return (
    <div style={{
      position: "fixed", inset: 0, background: "var(--modal-overlay, rgba(0,0,0,0.7))",
      backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
      zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center",
      padding: 20, animation: "fadeSlideIn 0.2s ease",
    }} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="quick-log-modal" style={{
        background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
        borderRadius: 10, width: "100%", maxWidth: 640,
        maxHeight: "90vh", overflowY: "auto",
        boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "18px 24px", borderBottom: "1px solid var(--border-primary)",
          position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1,
        }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            + QUICK LOG TRADE
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        {/* Form */}
        <div style={{ padding: "20px 24px 24px" }}>
          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <Field label="Date & Time">
              <input type="datetime-local" style={inputStyle} value={formDt} onChange={(e) => setFormDt(e.target.value)} />
            </Field>
            <Field label="Asset">
              <input type="text" style={inputStyle} value={formAsset} onChange={(e) => setFormAsset(e.target.value.toUpperCase())} placeholder="e.g. NQ, EUR/USD, AAPL" maxLength={30} />
            </Field>
            <Field label="Direction">
              <select style={selectStyle} value={formDirection} onChange={(e) => setFormDirection(e.target.value)}>
                <option value="">Select...</option>
                <option>Long</option>
                <option>Short</option>
              </select>
            </Field>
            <Field label="Setup Quality">
              <select style={selectStyle} value={formAplus} onChange={(e) => setFormAplus(e.target.value)}>
                <option value="">Select...</option>
                {(APLUS_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </Field>
            {tradeModels.length > 0 && (
              <Field label="Model / Strategy">
                <select style={selectStyle} value={formModel} onChange={e => setFormModel(e.target.value)}>
                  <option value="">— Select model —</option>
                  {tradeModels.map(name => <option key={name} value={name}>{name}</option>)}
                </select>
              </Field>
            )}
            <Field label="Taken?">
              <select style={selectStyle} value={formTaken} onChange={(e) => setFormTaken(e.target.value)}>
                <option value="">Select...</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
                <option value="Missed">Missed</option>
              </select>
            </Field>
            <Field label="My Bias">
              <select style={selectStyle} value={formBias} onChange={(e) => setFormBias(e.target.value)}>
                <option value="">Select...</option>
                <option>Bullish</option>
                <option>Bearish</option>
              </select>
            </Field>
            <Field label="Personal P&L ($)">
              <input type="number" style={inputStyle} placeholder="e.g. 500 or -200" value={formProfit} onChange={(e) => setFormProfit(e.target.value)} />
            </Field>
            <Field label="Funded P&L ($)">
              <input type="number" style={inputStyle} placeholder="e.g. 800 or -300" value={formProfitFunded} onChange={(e) => setFormProfitFunded(e.target.value)} />
            </Field>
            <Field label={<>Risk ($) <span style={{ fontWeight: 400, opacity: 0.45, textTransform: "none", letterSpacing: 0 }}>optional</span></>}>
              <input type="number" style={inputStyle} value={formRisk} onChange={(e) => setFormRisk(e.target.value)} placeholder={prefs?.default_risk ? String(prefs.default_risk) : "e.g. 500"} />
            </Field>
            <Field label="Personal Account">
              <select style={selectStyle} value={formAccountPersonal} onChange={(e) => setFormAccountPersonal(e.target.value)}>
                <option value="">None</option>
                {accounts.filter(a => a.account_type === "personal").map(a => (
                  <option key={a.id} value={a.id}>{a.account_name}</option>
                ))}
              </select>
            </Field>
            <Field label="Funded Account">
              <select style={selectStyle} value={formAccountFunded} onChange={(e) => setFormAccountFunded(e.target.value)}>
                <option value="">None</option>
                {accounts.filter(a => a.account_type === "funded" || a.account_type === "eval").map(a => (
                  <option key={a.id} value={a.id}>{a.account_name} — {a.firm}</option>
                ))}
              </select>
            </Field>
            <Field label="TradingView Link">
              <input type="url" style={inputStyle} placeholder="https://tradingview.com/..." value={formChart} onChange={(e) => setFormChart(e.target.value)} />
            </Field>
            <Field label="After Trade Link" full>
              <input type="url" style={inputStyle} placeholder="https://tradingview.com/..." value={formAfter} onChange={(e) => setFormAfter(e.target.value)} />
            </Field>
            <Field label="Trade Notes" full>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} placeholder="Entry reason, observations, mistakes..." value={formNotes} onChange={(e) => setFormNotes(e.target.value)} />
            </Field>
            <Field label="After Trade Thoughts" full>
              <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 72 }} placeholder="What did I learn? What would I do differently?" value={formAfterThoughts} onChange={(e) => setFormAfterThoughts(e.target.value)} />
              <TagPicker selected={formTags} onChange={setFormTags} tags={prefs?.tags} />
            </Field>
            <Field label="Rule Violations" full>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginBottom: 2 }}>Tag any rules you broke on this trade</div>
              <ViolationPicker selected={formViolations} onChange={setFormViolations} allViolations={buildEffectiveViolations(prefs)} />
            </Field>
          </div>
          {/* Replay Data collapsible */}
          <div style={{ marginBottom: 14 }}>
            <button onClick={() => setShowReplayFields(v => !v)} style={{ display: "flex", alignItems: "center", gap: 6, background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transform: showReplayFields ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.15s" }}><polyline points="9 18 15 12 9 6"/></svg>
              Replay Data <span style={{ fontWeight: 400, opacity: 0.5 }}>(optional)</span>
            </button>
            {showReplayFields && (
              <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
                <Field label="Entry Price"><input type="number" step="0.01" style={inputStyle} value={formEntryPrice} onChange={e => setFormEntryPrice(e.target.value)} placeholder="e.g. 18450.25" /></Field>
                <Field label="Exit Price"><input type="number" step="0.01" style={inputStyle} value={formExitPrice} onChange={e => setFormExitPrice(e.target.value)} placeholder="e.g. 18510.50" /></Field>
                <Field label="Stop Loss"><input type="number" step="0.01" style={inputStyle} value={formStopLoss} onChange={e => setFormStopLoss(e.target.value)} placeholder="e.g. 18400.00" /></Field>
                <Field label="Take Profit"><input type="number" step="0.01" style={inputStyle} value={formTakeProfit} onChange={e => setFormTakeProfit(e.target.value)} placeholder="e.g. 18550.00" /></Field>
                <Field label="Timeframe" full>
                  <select style={selectStyle} value={formTimeframe} onChange={e => setFormTimeframe(e.target.value)}>
                    <option value="">Auto-detect</option>
                    <option value="1m">1m</option><option value="5m">5m</option><option value="15m">15m</option>
                    <option value="1H">1H</option><option value="4H">4H</option><option value="1D">1D</option>
                  </select>
                </Field>
              </div>
            )}
          </div>

          <button onClick={logTrade} disabled={saving || saved} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", padding: 13, fontSize: 13, fontWeight: 700,
            border: saved ? "1px solid var(--green)" : "1px solid var(--accent)", borderRadius: 4,
            cursor: saving || saved ? "not-allowed" : "pointer",
            background: "transparent",
            color: saved ? "var(--green)" : "var(--accent)",
            letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s",
          }}>
            {saving ? "SAVING..." : saved ? "✓ LOGGED" : "+ LOG TRADE"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADE REPLAY
// ═══════════════════════════════════════════════════════════════════════════

function assetToYahooSymbol(asset) {
  if (!asset) return asset;
  const clean = asset.replace(/^\$/, "").toUpperCase();
  const map = {
    "NQ": "NQ=F", "NQ1!": "NQ=F", "MNQ": "NQ=F",
    "ES": "ES=F", "ES1!": "ES=F", "MES": "ES=F",
    "YM": "YM=F", "YM1!": "YM=F", "MYM": "YM=F",
    "RTY": "RTY=F", "RTY1!": "RTY=F", "M2K": "RTY=F",
    "CL": "CL=F", "CL1!": "CL=F", "MCL": "CL=F",
    "GC": "GC=F", "GC1!": "GC=F", "MGC": "GC=F",
    "SI": "SI=F", "SI1!": "SI=F",
    "EUR/USD": "EURUSD=X", "EURUSD": "EURUSD=X",
    "GBP/USD": "GBPUSD=X", "GBPUSD": "GBPUSD=X",
    "USD/JPY": "USDJPY=X", "USDJPY": "USDJPY=X",
    "BTC": "BTC-USD", "BTCUSD": "BTC-USD",
    "ETH": "ETH-USD", "ETHUSD": "ETH-USD",
  };
  return map[clean] || clean;
}

function autoInterval(tradeMs) {
  if (tradeMs < 30 * 60 * 1000) return "1m";
  if (tradeMs < 2 * 60 * 60 * 1000) return "5m";
  if (tradeMs < 8 * 60 * 60 * 1000) return "15m";
  if (tradeMs < 3 * 24 * 60 * 60 * 1000) return "1h";
  return "1d";
}

const REPLAY_INTERVALS = ["1m", "5m", "15m", "1H", "4H", "1D"];
const REPLAY_INTERVAL_MAP = { "1m": "1m", "5m": "5m", "15m": "15m", "1H": "1h", "4H": "4h", "1D": "1d" };

function TradeReplayModal({ trade, onClose, privacyMode, prefs }) {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const containerRef = useRef(null);
  const entryTime = trade.dt ? Math.floor(new Date(trade.dt).getTime() / 1000) : null;
  const defaultInterval = trade.timeframe || autoInterval(0);
  const [activeInterval, setActiveInterval] = useState(
    REPLAY_INTERVALS.includes(defaultInterval.toUpperCase()) ? defaultInterval.toUpperCase() :
    REPLAY_INTERVALS.find(i => i.toLowerCase() === defaultInterval.toLowerCase()) || "5m"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [oldDataWarning, setOldDataWarning] = useState(false);

  const MASK = "••••";

  const loadData = useCallback(async (intervalLabel) => {
    if (!entryTime || !seriesRef.current) return;
    setLoading(true);
    setError(null);
    setOldDataWarning(false);

    const ticker = assetToYahooSymbol(trade.asset);
    const apiInterval = REPLAY_INTERVAL_MAP[intervalLabel] || "5m";
    const rangeMap = { "1m": "1d", "5m": "5d", "15m": "1mo", "1h": "3mo", "4h": "6mo", "1d": "1y" };
    const range = rangeMap[apiInterval] || "5d";

    try {
      const res = await fetch(`/api/market-data?ticker=${encodeURIComponent(ticker)}&interval=${apiInterval}&range=${range}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.candles?.length) throw new Error("No candle data returned. Check the asset symbol.");

      seriesRef.current.setData(data.candles);

      // Price lines (no arrows — we don't know exact candle without broker sync)
      if (trade.entry_price != null) {
        seriesRef.current.createPriceLine({ price: trade.entry_price, color: "#34d399", lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "Entry" });
      }
      if (trade.stop_loss != null) {
        seriesRef.current.createPriceLine({ price: trade.stop_loss, color: "#ef4444", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "SL" });
      }
      if (trade.take_profit != null) {
        seriesRef.current.createPriceLine({ price: trade.take_profit, color: "#22c55e", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "TP" });
      }
      if (trade.exit_price != null && trade.exit_price !== trade.take_profit) {
        seriesRef.current.createPriceLine({ price: trade.exit_price, color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Exit" });
      }

      chartRef.current?.timeScale().fitContent();
      if (entryTime) {
        setTimeout(() => chartRef.current?.timeScale().scrollToPosition(
          chartRef.current.timeScale().coordinateToLogical(0) - 5, false
        ), 100);
        chartRef.current?.timeScale().scrollToRealTime();
      }

      const tradeAgeMs = Date.now() - new Date(trade.dt).getTime();
      if (tradeAgeMs > 7 * 24 * 60 * 60 * 1000 && ["1m","5m"].includes(apiInterval)) {
        setOldDataWarning(true);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [trade, entryTime]);

  useEffect(() => {
    if (!containerRef.current) return;
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 420,
      layout: {
        background: { color: isDark ? "#0b0d13" : "#ffffff" },
        textColor: isDark ? "#94a3b8" : "#374151",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" },
      timeScale: { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", timeVisible: true, secondsVisible: false },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#d1d4dc", downColor: "#1e222d",
      borderUpColor: "#d1d4dc", borderDownColor: "#787b86",
      wickUpColor: "#d1d4dc", wickDownColor: "#787b86",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }); });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, []);

  useEffect(() => {
    if (seriesRef.current) loadData(activeInterval);
  }, [loadData, activeInterval]);

  const pnl = trade.profit ?? trade.profit_funded;
  const risk = trade.risk ?? prefs?.default_risk;
  const rVal = pnl != null && risk ? (pnl / risk).toFixed(2) : null;
  const isWin = pnl > 0;

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeSlideIn 0.2s ease" }}
      onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 12, width: "100%", maxWidth: 860, maxHeight: "92vh", overflowY: "auto", boxShadow: "0 24px 64px rgba(0,0,0,0.5)" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)", position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em", color: "var(--accent)", textTransform: "uppercase" }}>▶ TRADE REPLAY</div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>

        <div style={{ padding: "20px 24px 24px" }}>
          {/* Trade summary strip */}
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, marginBottom: 16, padding: "12px 16px", background: "var(--bg-tertiary)", borderRadius: 8, border: "1px solid var(--border-primary)" }}>
            <div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 800, color: "var(--text-primary)" }}>{trade.asset}</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, color: trade.direction === "Long" ? "var(--green)" : "var(--red)", marginLeft: 8 }}>{trade.direction}</span>
              {trade.dt && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginLeft: 8 }}>{new Date(trade.dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {new Date(trade.dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>}
            </div>
            <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
              {trade.entry_price != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>Entry <strong style={{ color: "var(--green)" }}>{trade.entry_price.toLocaleString()}</strong></span>}
              {trade.exit_price != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>Exit <strong style={{ color: "var(--red)" }}>{trade.exit_price.toLocaleString()}</strong></span>}
              {trade.stop_loss != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>SL <strong style={{ color: "#ef4444" }}>{trade.stop_loss.toLocaleString()}</strong></span>}
              {trade.take_profit != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>TP <strong style={{ color: "#22c55e" }}>{trade.take_profit.toLocaleString()}</strong></span>}
              {pnl != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>P&L <strong style={{ color: isWin ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${isWin ? "+" : ""}$${pnl.toFixed(0)}`}</strong></span>}
              {rVal != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>R <strong style={{ color: isWin ? "var(--green)" : "var(--red)" }}>{rVal > 0 ? "+" : ""}{rVal}R</strong></span>}
              {trade.aplus && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent)", letterSpacing: "0.06em" }}>{trade.aplus}</span>}
            </div>
          </div>

          {/* Interval selector */}
          <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
            {REPLAY_INTERVALS.map(i => (
              <button key={i} onClick={() => setActiveInterval(i)} style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                padding: "5px 10px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.04em",
                border: "1px solid", transition: "all 0.15s",
                borderColor: activeInterval === i ? "var(--accent)" : "var(--border-primary)",
                background: activeInterval === i ? "var(--accent-dim)" : "var(--bg-tertiary)",
                color: activeInterval === i ? "var(--accent)" : "var(--text-secondary)",
              }}>{i}</button>
            ))}
          </div>

          {/* Chart */}
          <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", marginBottom: 16 }}>
            <div ref={containerRef} style={{ width: "100%", height: 420 }} />
            {loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(11,13,19,0.6)" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>Loading candles...</span>
              </div>
            )}
            {error && !loading && (
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(11,13,19,0.85)", gap: 8 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--red)" }}>Failed to load chart data</div>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", maxWidth: 360, textAlign: "center" }}>{error}</div>
              </div>
            )}
          </div>

          {oldDataWarning && (
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#f59e0b", marginBottom: 12, padding: "6px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 4, border: "1px solid rgba(245,158,11,0.2)" }}>
              Intraday data unavailable for trades older than 7 days. Showing higher timeframe candles.
            </div>
          )}

          {/* Notes */}
          {(trade.notes || trade.after_thoughts || (trade.tags?.length > 0)) && (
            <div style={{ padding: "14px 16px", background: "var(--bg-tertiary)", borderRadius: 8, border: "1px solid var(--border-primary)" }}>
              {trade.notes && (
                <div style={{ marginBottom: trade.after_thoughts ? 10 : 0 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 4 }}>Notes</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{trade.notes}</div>
                </div>
              )}
              {trade.after_thoughts && (
                <div style={{ marginTop: trade.notes ? 10 : 0, marginBottom: trade.tags?.length ? 10 : 0 }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 4 }}>After Thoughts</div>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.5 }}>{trade.after_thoughts}</div>
                </div>
              )}
              {trade.tags?.length > 0 && <TradeTagChips tags={trade.tags} allTags={prefs?.tags} />}
            </div>
          )}

          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 12, letterSpacing: "0.04em" }}>
            Data via Yahoo Finance · Delayed · {assetToYahooSymbol(trade.asset)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADE REVIEW MODAL
// ═══════════════════════════════════════════════════════════════════════════

const aplusColor = (v) => {
  if (v?.startsWith("A+")) return "var(--green)";
  if (v?.startsWith("B"))  return "#a78bfa";
  if (v?.startsWith("C"))  return "#f59e0b";
  if (v?.startsWith("F"))  return "var(--red)";
  return "var(--text-tertiary)";
};


function TradeReviewModal({ trades, supabase, user, loadTrades, onClose, privacyMode, prefs }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterTag, setFilterTag] = useState("all");
  const [filterViolation, setFilterViolation] = useState("all");
  const [rowSaving, setRowSaving] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [rowEdits, setRowEdits] = useState({});
  const [modalAccounts, setModalAccounts] = useState([]);
  const [modalModels, setModalModels] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type,status").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setModalAccounts(data); });
    supabase.from("checklist_items").select("items").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.items?.models) setModalModels(data.items.models);
    });
  }, [user]);

  const allMonths = [...new Set(trades.filter(t => t.dt).map(t => t.dt.slice(0, 7)))].sort().reverse();
  if (!allMonths.includes(currentMonth)) allMonths.unshift(currentMonth);

  const monthLabel = (m) => {
    const [y, mo] = m.split("-");
    return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
  };

  const filtered = trades.filter(t => {
    if (!t.dt || t.dt.slice(0, 7) !== filterMonth) return false;
    if (filterTag === "aplus")   { if (!t.aplus?.startsWith("A+")) return false; }
    else if (filterTag === "bgrade") { if (!t.aplus?.startsWith("B")) return false; }
    else if (filterTag === "cgrade") { if (!t.aplus?.startsWith("C")) return false; }
    else if (filterTag === "fgrade") { if (!t.aplus?.startsWith("F")) return false; }
    if (filterViolation !== "all") {
      if (filterViolation === "any") { if (!t.violations || t.violations.length === 0) return false; }
      else if (filterViolation === "clean") { if (t.violations && t.violations.length > 0) return false; }
      else { if (!t.violations || !t.violations.includes(filterViolation)) return false; }
    }
    return true;
  }).sort((a, b) => new Date(b.dt) - new Date(a.dt));

  const updateAplus = async (trade, value) => {
    setRowSaving(s => ({ ...s, [trade.id]: "saving" }));
    await supabase.from("trades").update({ aplus: value }).eq("id", trade.id);
    await loadTrades();
    setRowSaving(s => ({ ...s, [trade.id]: "saved" }));
    setTimeout(() => setRowSaving(s => { const n = { ...s }; delete n[trade.id]; return n; }), 1500);
  };

  const openExpand = (t) => {
    if (expandedId === t.id) { setExpandedId(null); return; }
    setExpandedId(t.id);
    setRowEdits(e => ({ ...e, [t.id]: {
      asset: t.asset || "", direction: t.direction || "", aplus: t.aplus || "",
      taken: t.taken || "", bias: t.bias || "",
      profit: t.profit != null ? String(t.profit) : "",
      profit_funded: t.profit_funded != null ? String(t.profit_funded) : "",
      chart: t.chart || "", after_chart: t.after_chart || "",
      notes: t.notes || "", after_thoughts: t.after_thoughts || "",
      tags: t.tags || [],
      violations: t.violations || [],
      account_id_personal: t.account_id_personal || "",
      account_id_funded: t.account_id_funded || "",
      model: t.model || "",
      risk: t.risk != null ? String(t.risk) : "",
      entry_price: t.entry_price != null ? String(t.entry_price) : "",
      exit_price: t.exit_price != null ? String(t.exit_price) : "",
      stop_loss: t.stop_loss != null ? String(t.stop_loss) : "",
      take_profit: t.take_profit != null ? String(t.take_profit) : "",
      timeframe: t.timeframe || "",
      dt: t.dt ? t.dt.slice(0, 16) : "",
    }}));
  };

  const saveRow = async (id) => {
    setRowSaving(s => ({ ...s, [id]: "saving" }));
    const edits = rowEdits[id];
    const prevTrade = trades.find(t => t.id === id);
    await supabase.from("trades").update({
      ...edits,
      profit: edits.profit !== "" ? parseFloat(edits.profit) : null,
      profit_funded: edits.profit_funded !== "" ? parseFloat(edits.profit_funded) : null,
      account_id_personal: edits.account_id_personal || null,
      account_id_funded: edits.account_id_funded || null,
      model: edits.model || null,
      risk: edits.risk !== "" && edits.risk != null ? parseFloat(edits.risk) : null,
      entry_price: edits.entry_price !== "" && edits.entry_price != null ? parseFloat(edits.entry_price) : null,
      exit_price: edits.exit_price !== "" && edits.exit_price != null ? parseFloat(edits.exit_price) : null,
      stop_loss: edits.stop_loss !== "" && edits.stop_loss != null ? parseFloat(edits.stop_loss) : null,
      take_profit: edits.take_profit !== "" && edits.take_profit != null ? parseFloat(edits.take_profit) : null,
      timeframe: edits.timeframe || null,
      dt: edits.dt || null,
    }).eq("id", id);
    const affectedPersonal = new Set([prevTrade?.account_id_personal, edits.account_id_personal].filter(Boolean));
    for (const aid of affectedPersonal) await recalcAccountPnl(supabase, aid, "profit");
    await loadTrades();
    setRowSaving(s => ({ ...s, [id]: "saved" }));
    setTimeout(() => {
      setRowSaving(s => { const n = { ...s }; delete n[id]; return n; });
      setExpandedId(null);
    }, 800);
  };

  const setField = (id, field, val) => setRowEdits(e => ({ ...e, [id]: { ...e[id], [field]: val } }));

  const tagBtn = (key, label) => (
    <button key={key} onClick={() => setFilterTag(key)} style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
      padding: "6px 14px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em",
      textTransform: "uppercase", transition: "all 0.15s",
      border: filterTag === key ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
      background: filterTag === key ? "var(--accent-dim)" : "var(--bg-tertiary)",
      color: filterTag === key ? "var(--accent)" : "var(--text-secondary)",
    }}>{label}</button>
  );

  // Close on backdrop click
  const handleBackdrop = (e) => { if (e.target === e.currentTarget) onClose(); };

  return (
    <div onClick={handleBackdrop} style={{
      position: "fixed", inset: 0, zIndex: 400,
      background: "var(--modal-overlay, rgba(0,0,0,0.7))", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px 16px",
    }}>
      <div className="review-modal-inner" style={{
        width: "calc(100vw - 80px)", maxWidth: 1600, maxHeight: "90vh",
        background: "var(--bg-secondary)", border: "1px solid var(--border-primary)",
        borderRadius: 12, display: "flex", flexDirection: "column",
        boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
        animation: "fadeSlideIn 0.2s ease",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "20px 24px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "0.04em" }}>TRADE REVIEW</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>
              {filtered.length} trade{filtered.length !== 1 ? "s" : ""} · click A+ to update inline
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {/* Month selector */}
            <select
              value={filterMonth}
              onChange={e => setFilterMonth(e.target.value)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600,
                padding: "7px 12px", borderRadius: 4, cursor: "pointer",
                border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)",
                color: "var(--text-primary)", outline: "none",
              }}
            >
              {allMonths.map(m => <option key={m} value={m}>{monthLabel(m)}</option>)}
            </select>
            <button onClick={onClose} style={{
              width: 32, height: 32, borderRadius: 6, border: "1px solid var(--border-primary)",
              background: "var(--bg-tertiary)", color: "var(--text-secondary)",
              cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center",
            }}>✕</button>
          </div>
        </div>

        {/* Filter tags */}
        <div style={{ display: "flex", gap: 6, padding: "14px 24px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0, flexWrap: "wrap", alignItems: "center" }}>
          {tagBtn("all", "All")}
          {tagBtn("aplus", "A+")}
          {tagBtn("bgrade", "B")}
          {tagBtn("cgrade", "C")}
          {tagBtn("fgrade", "F")}
          <div style={{ width: 1, height: 20, background: "var(--border-primary)", margin: "0 4px" }} />
          {[
            { key: "all", label: "Any" },
            { key: "any", label: "⚠ Has Violations" },
            { key: "clean", label: "✓ Clean" },
            ...buildEffectiveViolations(prefs).map(v => ({ key: v.value, label: `⚠ ${v.label}` })),
          ].map(({ key, label }) => (
            <button key={key} onClick={() => setFilterViolation(key)} style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
              padding: "6px 14px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em",
              textTransform: "uppercase", transition: "all 0.15s",
              border: filterViolation === key ? "1px solid #ef4444" : "1px solid var(--border-primary)",
              background: filterViolation === key ? "rgba(239,68,68,0.1)" : "var(--bg-tertiary)",
              color: filterViolation === key ? "#ef4444" : "var(--text-secondary)",
            }}>{label}</button>
          ))}
        </div>

        {/* Table */}
        <div style={{ overflowY: "auto", overflowX: "auto", flex: 1, WebkitOverflowScrolling: "touch" }}>
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "var(--text-tertiary)" }}>
              No trades for this filter.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
              <thead style={{ position: "sticky", top: 0, background: "var(--bg-secondary)", zIndex: 1 }}>
                <tr>
                  {["Date", "Asset", "Dir", "A+ Setup", "Model", "Taken", "Personal P&L", "Funded P&L", "Chart", "After", "Notes", "After Thoughts", "Violations", ""].map(h => (
                    <th key={h} style={{
                      padding: "10px 16px", textAlign: "left", fontSize: 10, fontWeight: 700,
                      color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em",
                      borderBottom: "1px solid var(--border-primary)", whiteSpace: "nowrap",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(t => {
                  const pnl = parseFloat(t.profit);
                  const status = rowSaving[t.id];
                  const isExpanded = expandedId === t.id;
                  const ed = rowEdits[t.id] || {};
                  const isSaving = rowSaving[t.id] === "saving";
                  const isSaved = rowSaving[t.id] === "saved";
                  const inpStyle = {
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
                    padding: "8px 10px", borderRadius: 4, outline: "none", width: "100%", boxSizing: "border-box",
                    background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                    color: "var(--text-primary)",
                  };
                  const sel = (field, opts) => (
                    <select value={ed[field] || ""} onChange={e => setField(t.id, field, e.target.value)} style={inpStyle}>
                      <option value="">—</option>
                      {opts.map(o => <option key={o}>{o}</option>)}
                    </select>
                  );
                  return (
                    <React.Fragment key={t.id}>

                    <tr style={{ borderBottom: "1px solid var(--border-primary)", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                    >
                      <td style={{ padding: "12px 16px", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>
                        {t.dt ? new Date(t.dt).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" }) : "—"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: 700, color: "var(--text-primary)" }}>{t.asset || "—"}</td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {t.direction === "Long" ? <span style={{ color: "var(--green)", fontWeight: 700 }}>LONG</span>
                          : t.direction === "Short" ? <span style={{ color: "var(--red)", fontWeight: 700 }}>SHORT</span> : "—"}
                      </td>

                      {/* Inline A+ dropdown */}
                      <td style={{ padding: "10px 16px", minWidth: 180 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <select
                            value={t.aplus || ""}
                            onChange={e => updateAplus(t, e.target.value)}
                            disabled={!!status}
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
                              padding: "5px 10px", borderRadius: 4, cursor: "pointer", outline: "none",
                              border: "1px solid var(--border-primary)",
                              borderLeft: `3px solid ${aplusColor(t.aplus)}`,
                              background: "var(--bg-input)",
                              color: aplusColor(t.aplus),
                              transition: "all 0.15s", maxWidth: 190,
                            }}
                          >
                            <option value="">Select...</option>
                            {APLUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                          {status === "saving" && <span style={{ fontSize: 10, color: "var(--text-tertiary)" }}>saving...</span>}
                          {status === "saved" && <span style={{ fontSize: 12, color: "var(--green)" }}>✓</span>}
                        </div>
                      </td>

                      {/* Inline Model dropdown */}
                      <td style={{ padding: "10px 16px", minWidth: 150 }}>
                        {modalModels.length > 0 ? (
                          <select
                            value={t.model || ""}
                            onChange={async e => {
                              const val = e.target.value;
                              setRowSaving(s => ({ ...s, [`model_${t.id}`]: "saving" }));
                              await supabase.from("trades").update({ model: val || null }).eq("id", t.id);
                              await loadTrades();
                              setRowSaving(s => ({ ...s, [`model_${t.id}`]: "saved" }));
                              setTimeout(() => setRowSaving(s => { const n = { ...s }; delete n[`model_${t.id}`]; return n; }), 1500);
                            }}
                            style={{
                              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600,
                              padding: "5px 10px", borderRadius: 4, cursor: "pointer", outline: "none",
                              border: "1px solid var(--border-primary)", background: "var(--bg-input)",
                              color: t.model ? "var(--text-primary)" : "var(--text-tertiary)",
                              transition: "all 0.15s", maxWidth: 180, width: "100%",
                            }}
                          >
                            <option value="">None</option>
                            {modalModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                          </select>
                        ) : (
                          <span style={{ color: "var(--text-tertiary)", fontSize: 12 }}>{t.model || "—"}</span>
                        )}
                        {rowSaving[`model_${t.id}`] === "saving" && <span style={{ fontSize: 10, color: "var(--text-tertiary)", display: "block", marginTop: 2 }}>saving...</span>}
                        {rowSaving[`model_${t.id}`] === "saved" && <span style={{ fontSize: 12, color: "var(--green)", display: "block", marginTop: 2 }}>✓</span>}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        {t.taken === "Yes" ? <span style={{ color: "var(--green)", fontWeight: 700 }}>YES</span>
                          : t.taken === "No" ? <span style={{ color: "var(--red)" }}>NO</span>
                          : t.taken === "Missed" ? <span style={{ color: "var(--gold)" }}>MISSED</span>
                          : <span style={{ color: "var(--text-tertiary)" }}>{t.taken || "—"}</span>}
                      </td>

                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {t.profit != null
                          ? <span style={{ fontWeight: 700, color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>
                              {privacyMode ? "••••" : `${pnl >= 0 ? "+" : ""}$${Math.abs(pnl).toFixed(0)}`}
                            </span>
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {t.profit_funded != null
                          ? <span style={{ fontWeight: 700, color: parseFloat(t.profit_funded) >= 0 ? "var(--green)" : "var(--red)" }}>
                              {privacyMode ? "••••" : `${parseFloat(t.profit_funded) >= 0 ? "+" : ""}$${Math.abs(parseFloat(t.profit_funded)).toFixed(0)}`}
                            </span>
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>

                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {safeUrl(t.chart)
                          ? <a href={safeUrl(t.chart)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--accent)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--accent)", borderRadius: 4, opacity: 0.85 }}>↗ VIEW</a>
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        {safeUrl(t.after_chart)
                          ? <a href={safeUrl(t.after_chart)} target="_blank" rel="noopener noreferrer" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--accent)", textDecoration: "none", padding: "4px 10px", border: "1px solid var(--accent)", borderRadius: 4, opacity: 0.85 }}>↗ VIEW</a>
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", minWidth: 200, maxWidth: 300, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, fontSize: 12 }}>
                        {t.notes || "—"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--text-tertiary)", minWidth: 200, maxWidth: 300, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.6, fontSize: 12 }}>
                        {t.after_thoughts || "—"}
                        <TradeTagChips tags={t.tags} allTags={prefs?.tags} />
                      </td>
                      <td style={{ padding: "12px 16px", minWidth: 160 }}>
                        <ViolationChips violations={t.violations} allViolations={buildEffectiveViolations(prefs)} />
                        {(!t.violations || t.violations.length === 0) && <span style={{ color: "var(--green)", fontSize: 11, fontWeight: 700 }}>✓ Clean</span>}
                      </td>
                      <td style={{ padding: "12px 16px", whiteSpace: "nowrap" }}>
                        <button onClick={() => openExpand(t)} style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                          padding: "5px 12px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.04em",
                          border: expandedId === t.id ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                          background: expandedId === t.id ? "var(--accent-dim)" : "var(--bg-tertiary)",
                          color: expandedId === t.id ? "var(--accent)" : "var(--text-secondary)",
                          transition: "all 0.15s",
                        }}>{isExpanded ? "▲ CLOSE" : "✏ EDIT"}</button>
                      </td>
                    </tr>

                    {/* Expanded edit row */}
                    {isExpanded && (
                        <tr>
                          <td colSpan={14} style={{ padding: "0 0 2px 0", background: "var(--bg-tertiary)" }}>
                            <div style={{ padding: "20px 24px", borderTop: "2px solid var(--accent)", borderBottom: "1px solid var(--border-primary)" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Date &amp; Time</div>
                                  <input type="datetime-local" value={ed.dt || ""} onChange={e => setField(t.id, "dt", e.target.value)} style={inpStyle} />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Asset</div>
                                  <input type="text" value={ed.asset || ""} onChange={e => setField(t.id, "asset", e.target.value.toUpperCase())} style={inpStyle} placeholder="Symbol" maxLength={30} />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Direction</div>
                                  {sel("direction", ["Long", "Short"])}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Model</div>
                                  <select value={ed.model || ""} onChange={e => setField(t.id, "model", e.target.value)} style={inpStyle}>
                                    <option value="">None</option>
                                    {modalModels.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>A+ Trade?</div>
                                  {sel("aplus", APLUS_OPTIONS)}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Taken?</div>
                                  {sel("taken", ["Yes", "No", "Missed"])}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Bias</div>
                                  {sel("bias", ["Bullish", "Bearish", "Neutral"])}
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Timeframe</div>
                                  <select value={ed.timeframe || ""} onChange={e => setField(t.id, "timeframe", e.target.value)} style={inpStyle}>
                                    <option value="">Auto-detect</option>
                                    <option value="1m">1m</option>
                                    <option value="5m">5m</option>
                                    <option value="15m">15m</option>
                                    <option value="1H">1H</option>
                                    <option value="4H">4H</option>
                                    <option value="1D">1D</option>
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Risk ($)</div>
                                  <input type="number" value={ed.risk || ""} onChange={e => setField(t.id, "risk", e.target.value)} style={inpStyle} placeholder="e.g. 500" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Entry Price</div>
                                  <input type="number" step="0.01" value={ed.entry_price || ""} onChange={e => setField(t.id, "entry_price", e.target.value)} style={inpStyle} placeholder="e.g. 18450.25" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Exit Price</div>
                                  <input type="number" step="0.01" value={ed.exit_price || ""} onChange={e => setField(t.id, "exit_price", e.target.value)} style={inpStyle} placeholder="e.g. 18510.50" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Stop Loss</div>
                                  <input type="number" step="0.01" value={ed.stop_loss || ""} onChange={e => setField(t.id, "stop_loss", e.target.value)} style={inpStyle} placeholder="e.g. 18400.00" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Take Profit</div>
                                  <input type="number" step="0.01" value={ed.take_profit || ""} onChange={e => setField(t.id, "take_profit", e.target.value)} style={inpStyle} placeholder="e.g. 18550.00" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Personal P&L</div>
                                  <input type="number" value={ed.profit} onChange={e => setField(t.id, "profit", e.target.value)} style={inpStyle} placeholder="e.g. 500" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Funded P&L</div>
                                  <input type="number" value={ed.profit_funded} onChange={e => setField(t.id, "profit_funded", e.target.value)} style={inpStyle} placeholder="e.g. 500" />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Chart URL</div>
                                  <input type="text" value={ed.chart} onChange={e => setField(t.id, "chart", e.target.value)} style={inpStyle} placeholder="https://..." />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>After Chart URL</div>
                                  <input type="text" value={ed.after_chart} onChange={e => setField(t.id, "after_chart", e.target.value)} style={inpStyle} placeholder="https://..." />
                                </div>
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Notes</div>
                                  <textarea value={ed.notes} onChange={e => setField(t.id, "notes", e.target.value)} rows={3} style={{ ...inpStyle, resize: "vertical" }} placeholder="Trade notes..." />
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>After Thoughts</div>
                                  <textarea value={ed.after_thoughts} onChange={e => setField(t.id, "after_thoughts", e.target.value)} rows={3} style={{ ...inpStyle, resize: "vertical" }} placeholder="Post-trade reflection..." />
                                </div>
                              </div>
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Tags</div>
                                <TagPicker selected={ed.tags || []} onChange={val => setField(t.id, "tags", val)} tags={prefs?.tags} />
                              </div>
                              <div style={{ marginBottom: 14 }}>
                                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Rule Violations</div>
                                <ViolationPicker selected={ed.violations || []} onChange={val => setField(t.id, "violations", val)} allViolations={buildEffectiveViolations(prefs)} />
                              </div>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Personal Account</div>
                                  <select value={ed.account_id_personal || ""} onChange={e => setField(t.id, "account_id_personal", e.target.value)} style={inpStyle}>
                                    <option value="">None</option>
                                    {modalAccounts.filter(a => a.account_type === "personal").map(a => (
                                      <option key={a.id} value={a.id}>{a.account_name}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Funded Account</div>
                                  <select value={ed.account_id_funded || ""} onChange={e => setField(t.id, "account_id_funded", e.target.value)} style={inpStyle}>
                                    <option value="">None</option>
                                    {modalAccounts.filter(a => a.account_type === "funded" || a.account_type === "eval").map(a => (
                                      <option key={a.id} value={a.id}>{a.account_name} — {a.firm}</option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                                <button onClick={() => saveRow(t.id)} disabled={isSaving} style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
                                  padding: "9px 24px", borderRadius: 4, cursor: isSaving ? "not-allowed" : "pointer",
                                  border: isSaved ? "1px solid var(--green)" : "1px solid var(--accent)",
                                  background: isSaved ? "rgba(5,150,105,0.08)" : "var(--accent-dim)",
                                  color: isSaved ? "var(--green)" : "var(--accent)",
                                  letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s",
                                }}>{isSaving ? "Saving..." : isSaved ? "✓ Saved" : "Save Changes"}</button>
                                <button onClick={() => setExpandedId(null)} style={{
                                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
                                  padding: "9px 20px", borderRadius: 4, cursor: "pointer",
                                  border: "1px solid var(--border-primary)", background: "transparent",
                                  color: "var(--text-secondary)", letterSpacing: "0.06em", textTransform: "uppercase",
                                }}>Cancel</button>
                              </div>
                            </div>
                          </td>
                        </tr>
                    )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer summary */}
        <div style={{
          padding: "14px 24px", borderTop: "1px solid var(--border-primary)",
          display: "flex", gap: 20, flexShrink: 0, flexWrap: "wrap",
        }}>
          {[
            { label: "A+", val: filtered.filter(t => t.aplus?.startsWith("A+")).length, color: "var(--green)" },
            { label: "B", val: filtered.filter(t => t.aplus?.startsWith("B")).length, color: "#a78bfa" },
            { label: "C", val: filtered.filter(t => t.aplus?.startsWith("C")).length, color: "#f59e0b" },
            { label: "F", val: filtered.filter(t => t.aplus?.startsWith("F")).length, color: "var(--red)" },
          ].map(({ label, val, color }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color }}>{val}</span>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS TAB — Trade stats, equity curve, calendar, trade history
// ═══════════════════════════════════════════════════════════════════════════

export function TradeStatsView({ supabase, user, trades, loadTrades, privacyMode, prefs, onNavigate }) {
  const [confirmDeleteTrade, setConfirmDeleteTrade] = useState(null);
  const [replayTrade, setReplayTrade] = useState(null);
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [dayPopup, setDayPopup] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pnlMode, setPnlMode] = useState("personal");
  const [showReview, setShowReview] = useState(false);
  const [compactTable, setCompactTable] = useState(false);
  const [accounts, setAccounts] = useState([]);
  const [tradeModels, setTradeModels] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type,status").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setAccounts(data); });
    supabase.from("checklist_items").select("items").eq("user_id", user.id).single().then(({ data }) => {
      if (data?.items?.models) setTradeModels(data.items.models.map(m => m.name));
    });
  }, [user]);

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const dayMap = buildDayMap(trades, pnlMode);

  // Equity curve
  useEffect(() => {
    if (!chartRef.current) return;
    const sorted = [...trades].filter((t) => {
      if (!t.dt) return false;
      if (pnlMode === "funded") return t.profit_funded != null && t.profit_funded !== "";
      if (pnlMode === "both") return (t.profit != null && t.profit !== "") || (t.profit_funded != null && t.profit_funded !== "");
      return t.profit != null && t.profit !== "";
    }).sort((a, b) => new Date(a.dt) - new Date(b.dt));
    const labels = [];
    const data = [];
    let cum = 0;
    sorted.forEach((t) => {
      cum += getPnlForMode(t, pnlMode);
      labels.push(new Date(t.dt).toLocaleDateString([], { month: "short", day: "numeric" }));
      data.push(parseFloat(cum.toFixed(2)));
    });
    if (!labels.length) { labels.push("No trades yet"); data.push(0); }

    if (chartInstance.current) chartInstance.current.destroy();
    const isDark = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim().startsWith('#0');
    const green = isDark ? "#22c55e" : "#16a34a";
    const red = isDark ? "#ef4444" : "#dc2626";
    const greenFill = isDark ? "rgba(34,197,94,0.08)" : "rgba(22,163,74,0.08)";
    const redFill = isDark ? "rgba(239,68,68,0.08)" : "rgba(220,38,38,0.08)";

    // Create gradient fill that switches color at zero line
    const segmentColor = (c) => c.p0.parsed.y >= 0 && c.p1.parsed.y >= 0 ? green : c.p0.parsed.y < 0 && c.p1.parsed.y < 0 ? red : c.p1.parsed.y >= 0 ? green : red;
    const segmentFill = (c) => c.p0.parsed.y >= 0 && c.p1.parsed.y >= 0 ? greenFill : c.p0.parsed.y < 0 && c.p1.parsed.y < 0 ? redFill : c.p1.parsed.y >= 0 ? greenFill : redFill;
    const pointColors = data.map((v) => v >= 0 ? green : red);

    const cs = getComputedStyle(document.documentElement);
    const tickColor = cs.getPropertyValue("--text-tertiary").trim() || "#4a5568";
    const gridColor = cs.getPropertyValue("--hud-grid").trim() || "rgba(0,0,0,0.02)";

    chartInstance.current = new Chart(chartRef.current, {
      type: "line",
      data: {
        labels,
        datasets: [{
          data,
          segment: { borderColor: segmentColor, backgroundColor: segmentFill },
          borderColor: green, backgroundColor: greenFill,
          borderWidth: 2, pointRadius: data.length > 30 ? 0 : 3,
          pointBackgroundColor: pointColors, fill: true, tension: 0.3,
        }],
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => privacyMode ? ` ${MASK}` : ` $${c.raw.toFixed(2)}` } } },
        scales: {
          x: { ticks: { color: tickColor, maxTicksLimit: 8, font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } }, grid: { color: gridColor } },
          y: { ticks: { color: tickColor, callback: (v) => privacyMode ? MASK : "$" + v, font: { size: 11, family: "'Plus Jakarta Sans', sans-serif" } }, grid: { color: gridColor } },
        },
      },
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [trades, pnlMode]);

  const deleteTrade = async (id) => {
    await supabase.from("trades").delete().eq("id", id);
    loadTrades();
  };

  const openEdit = (trade) => {
    setEditing(trade.id);
    setEditForm({
      dt: trade.dt ? new Date(trade.dt).toISOString().slice(0, 16) : "",
      asset: trade.asset || "", direction: trade.direction || "",
      aplus: trade.aplus || "", taken: trade.taken || "",
      bias: trade.bias || "", profit: trade.profit != null ? String(trade.profit) : "",
      profit_funded: trade.profit_funded != null ? String(trade.profit_funded) : "",
      risk: trade.risk != null ? String(trade.risk) : "",
      chart: trade.chart || "", after_chart: trade.after_chart || "",
      notes: trade.notes || "", after_thoughts: trade.after_thoughts || "",
      model: trade.model || "",
      tags: trade.tags || [],
      account_id_personal: trade.account_id_personal || "",
      account_id_funded: trade.account_id_funded || "",
      entry_price: trade.entry_price != null ? String(trade.entry_price) : "",
      exit_price: trade.exit_price != null ? String(trade.exit_price) : "",
      stop_loss: trade.stop_loss != null ? String(trade.stop_loss) : "",
      take_profit: trade.take_profit != null ? String(trade.take_profit) : "",
      timeframe: trade.timeframe || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    const prevTrade = trades.find(t => t.id === editing);
    await supabase.from("trades").update({
      dt: editForm.dt ? new Date(editForm.dt).toISOString() : null,
      asset: editForm.asset, direction: editForm.direction,
      aplus: editForm.aplus, taken: editForm.taken, bias: editForm.bias,
      profit: editForm.profit ? parseFloat(editForm.profit) : null,
      profit_funded: editForm.profit_funded ? parseFloat(editForm.profit_funded) : null,
      risk: editForm.risk !== "" && editForm.risk != null ? parseFloat(editForm.risk) : null,
      chart: editForm.chart, after_chart: editForm.after_chart, notes: editForm.notes,
      after_thoughts: editForm.after_thoughts,
      model: editForm.model || null,
      tags: editForm.tags && editForm.tags.length > 0 ? editForm.tags : null,
      account_id_personal: editForm.account_id_personal || null,
      account_id_funded: editForm.account_id_funded || null,
      entry_price: editForm.entry_price !== "" && editForm.entry_price != null ? parseFloat(editForm.entry_price) : null,
      exit_price: editForm.exit_price !== "" && editForm.exit_price != null ? parseFloat(editForm.exit_price) : null,
      stop_loss: editForm.stop_loss !== "" && editForm.stop_loss != null ? parseFloat(editForm.stop_loss) : null,
      take_profit: editForm.take_profit !== "" && editForm.take_profit != null ? parseFloat(editForm.take_profit) : null,
      timeframe: editForm.timeframe || null,
    }).eq("id", editing);
    // Recalc any accounts that were affected (old or new)
    const affectedPersonal = new Set([prevTrade?.account_id_personal, editForm.account_id_personal].filter(Boolean));
    for (const id of affectedPersonal) await recalcAccountPnl(supabase, id, "profit");
    setEditing(null);
    loadTrades();
  };

  // Stats — filtered to current calendar month
  const monthTrades = trades.filter((t) => {
    if (!t.dt) return false;
    const d = new Date(t.dt);
    return d.getMonth() === calMonth && d.getFullYear() === calYear;
  });
  const total = monthTrades.length;
  const taken = monthTrades.filter((t) => t.taken && t.taken !== "Missed").length;
  const missed = monthTrades.filter((t) => t.taken === "Missed").length;
  const aplus = monthTrades.filter((t) => t.aplus?.startsWith("A+")).length;
  const wins = monthTrades.filter((t) => t.taken && t.taken !== "Missed" && getPnlForMode(t, pnlMode) > 0).length;
  const wr = taken ? Math.round((wins / taken) * 100) : 0;
  const pnl = monthTrades.reduce((s, t) => s + getPnlForMode(t, pnlMode), 0);

  // Extended stats
  const takenTrades = monthTrades.filter(t => t.taken && t.taken !== "Missed");
  const grossWins = takenTrades.filter(t => getPnlForMode(t, pnlMode) > 0).reduce((s, t) => s + getPnlForMode(t, pnlMode), 0);
  const grossLosses = takenTrades.filter(t => getPnlForMode(t, pnlMode) < 0).reduce((s, t) => s + Math.abs(getPnlForMode(t, pnlMode)), 0);
  const profitFactor = grossLosses === 0 ? (grossWins > 0 ? "∞" : "—") : (grossWins / grossLosses).toFixed(2);

  const bestAsset = (() => {
    const assetTrades = takenTrades.filter(t => t.asset);
    if (!assetTrades.length) return "—";
    const map = {};
    assetTrades.forEach(t => { map[t.asset] = (map[t.asset] || 0) + getPnlForMode(t, pnlMode); });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0][0];
  })();

  const bestDay = (() => {
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (!takenTrades.length) return "—";
    const map = {};
    takenTrades.forEach(t => {
      const d = new Date(t.dt).getDay();
      if (!map[d]) map[d] = { sum: 0, count: 0 };
      map[d].sum += getPnlForMode(t, pnlMode);
      map[d].count++;
    });
    const [idx] = Object.entries(map).sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0];
    return DAY_NAMES[idx];
  })();

  const bestDirection = (() => {
    if (!takenTrades.length) return "—";
    const long = takenTrades.filter(t => t.direction === "Long");
    const short = takenTrades.filter(t => t.direction === "Short");
    const longWR = long.length ? long.filter(t => getPnlForMode(t, pnlMode) > 0).length / long.length : -1;
    const shortWR = short.length ? short.filter(t => getPnlForMode(t, pnlMode) > 0).length / short.length : -1;
    if (longWR === -1 && shortWR === -1) return "—";
    if (longWR === -1) return "Short";
    if (shortWR === -1) return "Long";
    return longWR >= shortWR ? "Long" : "Short";
  })();

  // Expectancy, Avg Win/Loss, Avg R
  const winTrades = takenTrades.filter(t => getPnlForMode(t, pnlMode) > 0);
  const lossTrades = takenTrades.filter(t => getPnlForMode(t, pnlMode) < 0);
  const avgWin = winTrades.length ? winTrades.reduce((s, t) => s + getPnlForMode(t, pnlMode), 0) / winTrades.length : 0;
  const avgLoss = lossTrades.length ? Math.abs(lossTrades.reduce((s, t) => s + getPnlForMode(t, pnlMode), 0) / lossTrades.length) : 0;
  const winRate = takenTrades.length ? winTrades.length / takenTrades.length : 0;
  const tradesWithR = takenTrades.filter(t => t.risk != null || prefs?.default_risk);
  const avgR = tradesWithR.length
    ? tradesWithR.reduce((s, t) => s + getPnlForMode(t, pnlMode) / (t.risk ?? prefs.default_risk), 0) / tradesWithR.length
    : null;

  // Calendar
  const calPrev = () => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); };
  const calNext = () => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); };
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  // Mon-first offset: Mon=0 … Fri=4, clamp Sat(5)/Sun(6) → 0 (month starts on weekend, no leading empties needed)
  const firstDayMon = firstDay === 0 ? 0 : firstDay === 6 ? 0 : firstDay - 1;
  const getWeekPnl = (fridayDate) => {
    let total = 0;
    for (let offset = 4; offset >= 0; offset--) {
      const d = new Date(calYear, calMonth, fridayDate - offset);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      total += dayMap[k]?.pnl || 0;
    }
    return total;
  };
  const todayDate = new Date();

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="TRADE STATS"
        title="Numbers don't lie. Let the data guide you."
        subtitle="P&L calendar, equity curve, and trade history — your performance at a glance."
      />

      {/* Stats — Row 1: 5 narrow cards */}
      <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 12 }}>
        <StatBox value={taken} label="Taken" color="var(--text-secondary)" />
        <StatBox value={missed} label="Missed" color={missed > 0 ? "#f59e0b" : "var(--text-tertiary)"} />
        <StatBox value={aplus} label="A+ Setups" color="var(--green)" />
        <StatBox value={`${wr}%`} label="Win Rate" color={wr >= 50 ? "var(--green)" : "var(--red)"} />
        <StatBox value={privacyMode ? MASK : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`} label="Net P&L" color={pnl >= 0 ? "var(--green)" : "var(--red)"} />
      </div>

      {/* Stats — Row 2: 4 medium cards */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 12 }}>
        <StatBox value={profitFactor} label="Profit Factor" color="var(--accent)" style={{ background: "linear-gradient(135deg, rgba(34,211,238,0.12) 0%, transparent 100%)" }} />
        <StatBox value={privacyMode ? MASK : (avgWin > 0 ? `$${avgWin.toFixed(0)}` : "—")} label="Avg Win" color="var(--green)" />
        <StatBox value={privacyMode ? MASK : (avgLoss > 0 ? `$${avgLoss.toFixed(0)}` : "—")} label="Avg Loss" color="var(--red)" />
        <StatBox
          value={avgR !== null ? `${avgR >= 0 ? "+" : ""}${avgR.toFixed(2)}R` : "—"}
          label="Avg R"
          color={avgR !== null ? (avgR >= 0 ? "var(--green)" : "var(--red)") : "var(--text-tertiary)"}
        />
      </div>

      {/* Stats — Row 3: 3 wide cards */}
      <div className="grid-3" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatBox value={bestAsset} label="Best Asset" color="var(--purple)" style={{ background: "linear-gradient(135deg, rgba(139,92,246,0.12) 0%, transparent 100%)" }} />
        <StatBox value={bestDay} label="Best Day" color="var(--gold)" style={{ background: "linear-gradient(135deg, rgba(251,191,36,0.12) 0%, transparent 100%)" }} />
        <StatBox value={bestDirection} label="Best Direction" color="var(--green)" style={{ background: "linear-gradient(135deg, rgba(52,211,153,0.12) 0%, transparent 100%)" }} />
      </div>

      {/* Empty state for month */}
      {monthTrades.length === 0 && (
        <TCard style={{ padding: "32px 24px", marginBottom: 24, textAlign: "center", border: "1px solid var(--border-primary)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 6 }}>
            No trades logged for {new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })}
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 20, lineHeight: 1.6 }}>
            Head to the Journal tab to log trades and they'll appear here.
          </div>
          <button
            onClick={() => onNavigate?.("journal")}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
              padding: "9px 22px", borderRadius: 6, cursor: "pointer",
              border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}
          >+ Log a Trade</button>
        </TCard>
      )}

      {/* Equity Curve */}
      <TCard style={{ padding: 28, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 20 }}>
          EQUITY CURVE
        </div>
        <canvas ref={chartRef} height={120} style={{ width: "100%", borderRadius: 8 }} />
      </TCard>

      {/* P&L Calendar */}
      <TCard style={{ marginBottom: 24, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>P&L CALENDAR</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[["personal", "Personal"], ["funded", "Funded"], ["both", "Both"]].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setPnlMode(mode)}
                  style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase",
                    border: pnlMode === mode ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                    background: pnlMode === mode ? "transparent" : "var(--bg-tertiary)",
                    color: pnlMode === mode ? "var(--accent)" : "var(--text-tertiary)",
                    boxShadow: pnlMode === mode ? "none" : "none",
                    transition: "all 0.15s",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={calPrev} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>◀</button>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", minWidth: 150, textAlign: "center" }}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={calNext} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>▶</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) 80px", gap: 6, marginBottom: 6 }}>
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Week"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: d === "Week" ? "var(--accent)" : "var(--text-tertiary)", textTransform: "uppercase", padding: 6, letterSpacing: "0.05em" }}>{d}</div>
            ))}
          </div>
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr) 80px", gap: 6 }}>
            {Array.from({ length: firstDayMon }, (_, i) => <div key={`e${i}`} />)}
            {(() => {
              const cells = [];
              for (let i = 1; i <= daysInMonth; i++) {
                const dow = new Date(calYear, calMonth, i).getDay(); // 0=Sun, 6=Sat
                if (dow === 0 || dow === 6) continue; // skip weekends
                const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
                const data = dayMap[k];
                const isToday = todayDate.getFullYear() === calYear && todayDate.getMonth() === calMonth && todayDate.getDate() === i;
                const isGreen = data && data.pnl >= 0;
                const isRed = data && data.pnl < 0;
                cells.push(
                  <div
                    key={i}
                    onClick={data ? () => setDayPopup({ day: i, k, data }) : undefined}
                    className="cal-day"
                    style={{
                      minHeight: 76, borderRadius: 6, padding: "8px 10px", fontSize: 13,
                      border: `1px solid ${isGreen ? "var(--green)" : isRed ? "var(--red)" : "var(--border-primary)"}`,
                      background: isGreen ? "var(--accent-glow)" : isRed ? "rgba(239,68,68,0.06)" : "var(--bg-tertiary)",
                      cursor: data ? "pointer" : "default",
                      boxShadow: isToday ? "0 0 0 2px var(--accent-secondary)" : "none",
                      transition: "all 0.2s",
                    }}
                  >
                    <div className="cal-day-num" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: isGreen ? "var(--green)" : isRed ? "var(--red)" : "var(--text-tertiary)", marginBottom: 4 }}>{i}</div>
                    {data && (
                      <>
                        <div className="cal-pnl" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: isGreen ? "var(--green)" : "var(--red)" }}>
                          {privacyMode ? MASK : `${data.pnl >= 0 ? "+" : ""}$${data.pnl.toFixed(0)}`}
                        </div>
                        <div className="cal-count" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{data.count} trade{data.count !== 1 ? "s" : ""}</div>
                      </>
                    )}
                  </div>
                );
                // After Friday (or last day of month if week is incomplete), inject weekly total
                const isLastDayOfMonth = i === daysInMonth;
                const nextDow = isLastDayOfMonth ? -1 : new Date(calYear, calMonth, i + 1).getDay();
                const weekEnds = dow === 5 || isLastDayOfMonth || nextDow === 6 || nextDow === 0;
                if (weekEnds) {
                  const weekPnl = getWeekPnl(dow === 5 ? i : i + (5 - dow));
                  const wGreen = weekPnl > 0;
                  const wRed = weekPnl < 0;
                  cells.push(
                    <div key={`w${i}`} style={{
                      minHeight: 76, borderRadius: 6, padding: "8px 10px",
                      border: `1px solid ${wGreen ? "rgba(52,211,153,0.3)" : wRed ? "rgba(239,68,68,0.3)" : "var(--border-primary)"}`,
                      background: wGreen ? "rgba(52,211,153,0.05)" : wRed ? "rgba(239,68,68,0.04)" : "var(--bg-tertiary)",
                      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", gap: 4,
                    }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", opacity: 0.7 }}>WEEK</div>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: wGreen ? "var(--green)" : wRed ? "var(--red)" : "var(--text-tertiary)" }}>
                        {weekPnl === 0 ? "—" : privacyMode ? MASK : `${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(0)}`}
                      </div>
                    </div>
                  );
                }
              }
              return cells;
            })()}
          </div>
        </div>
      </TCard>

      {/* Day Popup */}
      {dayPopup && (
        <TCard style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{MONTHS[calMonth]} {dayPopup.day}, {calYear}</div>
            <button onClick={() => setDayPopup(null)} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 20 }}>✕</button>
          </div>
          {dayPopup.data.trades.map((t, i) => {
            const p = parseFloat(t.profit);
            const pf = parseFloat(t.profit_funded);
            return (
              <div key={i} style={{ background: "var(--bg-tertiary)", borderRadius: 4, padding: "12px 16px", marginBottom: 10, fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <strong style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{t.asset || "—"}</strong>
                <span>{t.direction || "—"}</span>
                <span>A+: {t.aplus || "—"}</span>
                <span>Taken: {t.taken || "—"}</span>
                <span>Personal: {t.profit != null ? <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: p >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${p >= 0 ? "+" : ""}$${p.toFixed(0)}`}</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span>}</span>
                <span>Funded: {t.profit_funded != null ? <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: pf >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${pf >= 0 ? "+" : ""}$${pf.toFixed(0)}`}</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span>}</span>
                {t.notes && <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>{t.notes}</span>}
              </div>
            );
          })}
        </TCard>
      )}

      {/* Violation Stats */}
      {(() => {
        const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
        const mTrades = trades.filter(t => t.dt && t.dt.slice(0, 7) === monthStr && t.taken !== "Missed");
        if (mTrades.length === 0) return null;
        const violatingTrades = mTrades.filter(t => t.violations && t.violations.length > 0);
        const cleanTrades = mTrades.filter(t => !t.violations || t.violations.length === 0);
        const violationRate = Math.round(violatingTrades.length / mTrades.length * 100);
        const violatingPnl = violatingTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
        const cleanPnl = cleanTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
        const vCounts = {};
        mTrades.forEach(t => (t.violations || []).forEach(v => { vCounts[v] = (vCounts[v] || 0) + 1; }));
        const topViolation = Object.entries(vCounts).sort((a, b) => b[1] - a[1])[0];
        // Clean streak: consecutive taken trades from most recent with no violations
        const sorted = [...mTrades].sort((a, b) => new Date(b.dt) - new Date(a.dt));
        let cleanStreak = 0;
        for (const t of sorted) { if (!t.violations || t.violations.length === 0) cleanStreak++; else break; }
        return (
          <TCard style={{ padding: "22px 24px", marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Discipline — Rule Violations</div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10, marginBottom: violatingTrades.length > 0 ? 16 : 0 }}>
              {[
                { label: "Violation Rate", value: `${violationRate}%`, color: violationRate === 0 ? "var(--green)" : violationRate < 30 ? "var(--gold)" : "var(--red)" },
                { label: "Clean Trades", value: `${cleanTrades.length}/${mTrades.length}`, color: "var(--green)" },
                { label: "Clean Streak", value: `${cleanStreak}`, color: cleanStreak >= 5 ? "var(--accent)" : cleanStreak >= 3 ? "var(--green)" : "var(--text-secondary)" },
                { label: "Clean P&L", value: privacyMode ? "••••" : `${cleanPnl >= 0 ? "+" : ""}$${cleanPnl.toFixed(0)}`, color: cleanPnl >= 0 ? "var(--green)" : "var(--red)" },
                { label: "Violating P&L", value: violatingTrades.length > 0 ? (privacyMode ? "••••" : `${violatingPnl >= 0 ? "+" : ""}$${violatingPnl.toFixed(0)}`) : "—", color: violatingPnl >= 0 ? "var(--text-secondary)" : "var(--red)" },
                { label: "Top Violation", value: topViolation ? TRADE_VIOLATIONS.find(v => v.value === topViolation[0])?.label ?? topViolation[0] : "None", color: topViolation ? "#ef4444" : "var(--green)" },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                  <div style={{ fontSize: 16, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                  <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                </div>
              ))}
            </div>
            {violatingTrades.length > 0 && Object.keys(vCounts).length > 0 && (
              <div>
                <div style={{ fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>Breakdown</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {Object.entries(vCounts).sort((a, b) => b[1] - a[1]).map(([v, count]) => {
                    const def = TRADE_VIOLATIONS.find(d => d.value === v);
                    const color = def?.color ?? "#ef4444";
                    const label = def?.label ?? v;
                    return (
                      <div key={v} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 10px", borderRadius: 6, border: `1px solid ${color}`, background: `${color}12` }}>
                        <span style={{ fontSize: 11, fontWeight: 700, color }}>{label}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, color, background: `${color}22`, borderRadius: 4, padding: "1px 6px" }}>{count}×</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </TCard>
        );
      })()}

      {/* Trade History Table */}
      <TCard style={{ overflow: "hidden", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>TRADE HISTORY</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", opacity: 0.6 }}>{new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
          {monthTrades.length > 0 && (
            <button
              onClick={() => setCompactTable(c => !c)}
              title={compactTable ? "Comfortable view" : "Compact view"}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                padding: "6px 10px", borderRadius: 4, cursor: "pointer",
                border: `1px solid ${compactTable ? "var(--accent)" : "var(--border-primary)"}`,
                background: compactTable ? "var(--accent-dim)" : "var(--bg-tertiary)",
                color: compactTable ? "var(--accent)" : "var(--text-tertiary)",
                letterSpacing: "0.04em", transition: "all 0.15s",
                display: "flex", alignItems: "center", gap: 5,
              }}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
              {compactTable ? "COMPACT" : "COMPACT"}
            </button>
          )}
          {monthTrades.length > 0 && (
            <button
              onClick={() => setShowReview(true)}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                padding: "6px 14px", borderRadius: 4, cursor: "pointer",
                border: "1px solid var(--accent)", background: "var(--accent-dim)",
                color: "var(--accent)", letterSpacing: "0.05em", transition: "all 0.15s",
              }}
            >⊞ REVIEW TRADES</button>
          )}
          {monthTrades.length > 0 && (
            <button
              onClick={() => {
                const csvCell = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
                const headers = ["Date", "Asset", "Direction", "A+", "Taken", "Bias", "Model", "Timeframe", "Risk", "Entry Price", "Exit Price", "Stop Loss", "Take Profit", "Personal P&L", "Funded P&L", "Notes", "After Thoughts", "Tags", "Chart URL", "After Chart URL"];
                const rows = monthTrades.map((t) => [
                  csvCell(t.dt ? new Date(t.dt).toLocaleString() : ""),
                  csvCell(t.asset),
                  csvCell(t.direction),
                  csvCell(t.aplus),
                  csvCell(t.taken),
                  csvCell(t.bias),
                  csvCell(t.model),
                  csvCell(t.timeframe),
                  t.risk != null ? t.risk : "",
                  t.entry_price != null ? t.entry_price : "",
                  t.exit_price != null ? t.exit_price : "",
                  t.stop_loss != null ? t.stop_loss : "",
                  t.take_profit != null ? t.take_profit : "",
                  t.profit != null ? t.profit : "",
                  t.profit_funded != null ? t.profit_funded : "",
                  csvCell(t.notes),
                  csvCell(t.after_thoughts),
                  csvCell((t.tags || []).map(tag => `#${tag}`).join(" ")),
                  csvCell(t.chart),
                  csvCell(t.after_chart),
                ]);
                const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
                const blob = new Blob([csv], { type: "text/csv" });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `tradesharp-${new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" }).replace(" ", "-").toLowerCase()}.csv`;
                a.click();
                URL.revokeObjectURL(url);
              }}
              style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                padding: "6px 14px", borderRadius: 4, cursor: "pointer",
                border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)",
                color: "var(--text-secondary)", letterSpacing: "0.05em", transition: "all 0.15s",
              }}
            >↓ EXPORT CSV</button>
          )}
          </div>
        </div>
        {!monthTrades.length ? (
          <div style={{ textAlign: "center", padding: "40px 24px" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)", marginBottom: 14 }}>No trades logged for {new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })}.</div>
            <button onClick={() => onNavigate?.("journal")} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, padding: "8px 20px", borderRadius: 6, cursor: "pointer", border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)", letterSpacing: "0.06em", textTransform: "uppercase" }}>+ Log a Trade</button>
          </div>
        ) : (
          <div className="trade-table" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-primary)" }}>
                  {["Date", "Asset", "Model", "Dir", "A+", "Taken", "Bias", "Personal", "Funded", "R", "Chart", "After", "Notes", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthTrades.map((t) => {
                  const p = parseFloat(t.profit);
                  const pf = parseFloat(t.profit_funded);
                  const isWin = t.profit != null && !isNaN(p) && p > 0;
                  const isLoss = t.profit != null && !isNaN(p) && p < 0;
                  const rowPad = compactTable ? "5px 12px" : "10px 12px";
                  const rowFontSize = compactTable ? 11 : 12;
                  const cellStyle = { padding: rowPad, borderTop: "1px solid var(--border-primary)", whiteSpace: "nowrap", fontSize: rowFontSize };
                  return (
                    <tr key={t.id} style={{
                      transition: "background 0.15s",
                      background: isWin ? "rgba(52,211,153,0.04)" : isLoss ? "rgba(251,113,133,0.04)" : "transparent",
                      boxShadow: isWin ? "inset 3px 0 0 var(--green)" : isLoss ? "inset 3px 0 0 var(--red)" : "none",
                    }}>
                      <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>{t.dt ? new Date(t.dt).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "var(--text-primary)" }}>{t.asset}</td>
                      <td style={cellStyle}>
                        {t.model
                          ? <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 3, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", whiteSpace: "nowrap" }}>{t.model}</span>
                          : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td style={cellStyle}>
                        {t.direction === "Long" ? <span style={{ color: "var(--accent-secondary)" }}>LONG</span> : t.direction === "Short" ? <span style={{ color: "var(--red)" }}>SHORT</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.aplus ? <span style={{ color: aplusColor(t.aplus), fontWeight: 700 }}>{t.aplus.split(" —")[0]}</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.taken === "Yes" ? <span style={{ color: "var(--green)" }}>YES</span> : t.taken === "No" ? <span style={{ color: "var(--red)" }}>NO</span> : t.taken === "Missed" ? <span style={{ color: "var(--gold)" }}>MISS</span> : <span style={{ color: "var(--text-tertiary)" }}>{t.taken || "—"}</span>}
                      </td>
                      <td style={cellStyle}>
                        {t.bias === "Bullish" ? <span style={{ color: "var(--green)" }}>BULL</span> : t.bias === "Bearish" ? <span style={{ color: "var(--red)" }}>BEAR</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.profit != null ? <span style={{ color: p >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{privacyMode ? MASK : `${p >= 0 ? "+" : ""}${p.toFixed(0)}`}</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.profit_funded != null ? <span style={{ color: pf >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{privacyMode ? MASK : `${pf >= 0 ? "+" : ""}${pf.toFixed(0)}`}</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td style={cellStyle}>
                        {(() => {
                          const eff = t.risk ?? prefs?.default_risk;
                          if (!eff || t.taken === "Missed") return <span style={{ color: "var(--text-tertiary)" }}>—</span>;
                          const r = getPnlForMode(t, pnlMode) / eff;
                          return <span style={{ color: r >= 0 ? "var(--green)" : "var(--red)", fontWeight: 600 }}>{r >= 0 ? "+" : ""}{r.toFixed(2)}R</span>;
                        })()}
                      </td>
                      <td style={cellStyle}>
                        {safeUrl(t.chart) ? <a href={safeUrl(t.chart)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {safeUrl(t.after_chart) ? <a href={safeUrl(t.after_chart)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 160, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis" }} title={t.notes}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notes || "—"}</div>
                        <TradeTagChips tags={t.tags} allTags={prefs?.tags} />
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                        {t.entry_price != null && (
                          <button onClick={() => setReplayTrade(t)} title="Replay trade" style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent)", padding: "2px 6px", display: "inline-flex", alignItems: "center" }}>
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                          </button>
                        )}
                        <button onClick={() => openEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--accent-secondary)", padding: "2px 6px", display: "inline-flex", alignItems: "center" }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                        <DeletePopover id={t.id} confirmId={confirmDeleteTrade} setConfirmId={setConfirmDeleteTrade} onConfirm={deleteTrade} buttonStyle={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 6px" }}>✕</DeletePopover>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </TCard>

      {/* Trade Review Modal */}
      {showReview && (
        <TradeReviewModal
          trades={trades}
          supabase={supabase}
          user={user}
          loadTrades={loadTrades}
          privacyMode={privacyMode}
          prefs={prefs}
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Trade Replay Modal */}
      {replayTrade && (
        <TradeReplayModal
          trade={replayTrade}
          privacyMode={privacyMode}
          prefs={prefs}
          onClose={() => setReplayTrade(null)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "var(--modal-overlay, rgba(0,0,0,0.7))", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <TCard className="modal-card" style={{ padding: 32, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.08em" }}>EDIT TRADE</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <Field label="Date & Time">
                <input type="datetime-local" style={inputStyle} value={editForm.dt} onChange={(e) => setEditForm({ ...editForm, dt: e.target.value })} />
              </Field>
              <Field label="Asset">
                <input type="text" style={inputStyle} value={editForm.asset || ""} onChange={(e) => setEditForm({ ...editForm, asset: e.target.value.toUpperCase() })} placeholder="e.g. NQ, EUR/USD, AAPL" maxLength={30} />
              </Field>
              <Field label="Direction">
                <select style={selectStyle} value={editForm.direction} onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Long</option>
                  <option>Short</option>
                </select>
              </Field>
              <Field label="Setup Quality">
                <select style={selectStyle} value={editForm.aplus} onChange={(e) => setEditForm({ ...editForm, aplus: e.target.value })}>
                  <option value="">Select...</option>
                  {(APLUS_OPTIONS).map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </Field>
              {tradeModels.length > 0 && (
                <Field label="Model / Strategy">
                  <select style={selectStyle} value={editForm.model || ""} onChange={e => setEditForm({ ...editForm, model: e.target.value })}>
                    <option value="">— Select model —</option>
                    {tradeModels.map(name => <option key={name} value={name}>{name}</option>)}
                  </select>
                </Field>
              )}
              <Field label="Taken?">
                <select style={selectStyle} value={editForm.taken} onChange={(e) => setEditForm({ ...editForm, taken: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Missed</option>
                  <option>Personal</option>
                  <option>Eval</option>
                  <option>PA &amp; Funded</option>
                  <option>Crypto</option>
                  <option>Funded Account</option>
                </select>
              </Field>
              <Field label="Bias">
                <select style={selectStyle} value={editForm.bias} onChange={(e) => setEditForm({ ...editForm, bias: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Bullish</option>
                  <option>Bearish</option>
                </select>
              </Field>
              <Field label="Personal P&L ($)">
                <input type="number" style={inputStyle} value={editForm.profit} onChange={(e) => setEditForm({ ...editForm, profit: e.target.value })} />
              </Field>
              <Field label="Funded P&L ($)">
                <input type="number" style={inputStyle} placeholder="Leave blank if not taken on funded" value={editForm.profit_funded} onChange={(e) => setEditForm({ ...editForm, profit_funded: e.target.value })} />
              </Field>
              <Field label={<>Risk ($) <span style={{ fontWeight: 400, opacity: 0.45, textTransform: "none", letterSpacing: 0 }}>optional</span></>}>
                <input type="number" style={inputStyle} value={editForm.risk || ""} onChange={(e) => setEditForm({ ...editForm, risk: e.target.value })} placeholder={prefs?.default_risk ? String(prefs.default_risk) : "e.g. 500"} />
              </Field>
              <Field label="Personal Account">
                <select style={selectStyle} value={editForm.account_id_personal || ""} onChange={(e) => setEditForm({ ...editForm, account_id_personal: e.target.value })}>
                  <option value="">None</option>
                  {accounts.filter(a => a.account_type === "personal").map(a => (
                    <option key={a.id} value={a.id}>{a.account_name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Funded Account">
                <select style={selectStyle} value={editForm.account_id_funded || ""} onChange={(e) => setEditForm({ ...editForm, account_id_funded: e.target.value })}>
                  <option value="">None</option>
                  {accounts.filter(a => a.account_type === "funded" || a.account_type === "eval").map(a => (
                    <option key={a.id} value={a.id}>{a.account_name} — {a.firm}</option>
                  ))}
                </select>
              </Field>
              <Field label="TradingView Link">
                <input type="url" style={inputStyle} value={editForm.chart} onChange={(e) => setEditForm({ ...editForm, chart: e.target.value })} />
              </Field>
              <Field label="After Trade Link" full>
                <input type="url" style={inputStyle} value={editForm.after_chart} onChange={(e) => setEditForm({ ...editForm, after_chart: e.target.value })} />
              </Field>
              <Field label="Trade Notes" full>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} value={editForm.notes} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
              </Field>
              <Field label="After Trade Thoughts" full>
                <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="What did I learn? What would I do differently?" value={editForm.after_thoughts} onChange={(e) => setEditForm({ ...editForm, after_thoughts: e.target.value })} />
                <TagPicker selected={editForm.tags || []} onChange={(val) => setEditForm({ ...editForm, tags: val })} />
              </Field>
              <Field label="Entry Price"><input type="number" step="0.01" style={inputStyle} value={editForm.entry_price || ""} onChange={e => setEditForm({ ...editForm, entry_price: e.target.value })} placeholder="e.g. 18450.25" /></Field>
              <Field label="Exit Price"><input type="number" step="0.01" style={inputStyle} value={editForm.exit_price || ""} onChange={e => setEditForm({ ...editForm, exit_price: e.target.value })} placeholder="e.g. 18510.50" /></Field>
              <Field label="Stop Loss"><input type="number" step="0.01" style={inputStyle} value={editForm.stop_loss || ""} onChange={e => setEditForm({ ...editForm, stop_loss: e.target.value })} placeholder="e.g. 18400.00" /></Field>
              <Field label="Take Profit"><input type="number" step="0.01" style={inputStyle} value={editForm.take_profit || ""} onChange={e => setEditForm({ ...editForm, take_profit: e.target.value })} placeholder="e.g. 18550.00" /></Field>
              <Field label="Timeframe" full>
                <select style={selectStyle} value={editForm.timeframe || ""} onChange={e => setEditForm({ ...editForm, timeframe: e.target.value })}>
                  <option value="">Auto-detect</option>
                  <option value="1m">1m</option><option value="5m">5m</option><option value="15m">15m</option>
                  <option value="1H">1H</option><option value="4H">4H</option><option value="1D">1D</option>
                </select>
              </Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditing(null)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 13, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
              <button onClick={saveEdit} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 700, padding: 13, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "none", letterSpacing: "0.05em" }}>SAVE CHANGES</button>
            </div>
          </TCard>
        </div>
      )}

      {/* ── TradeSharp Score ── */}
      <TradeSharpScore trades={monthTrades} month={new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })} />


      {/* ── Badges ── */}
      <BadgesSection trades={trades} dayMap={dayMap} />

      {/* ── Weekly Challenges ── */}
      <WeeklyChallengesSection trades={trades} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// AI TRADING SUMMARY
// ═══════════════════════════════════════════════════════════════════════════

function AISummarySection({ trades, supabase }) {
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [period, setPeriod] = useState("");

  const generate = async (p) => {
    const now = new Date();
    let startDate, label;
    if (p === "week") {
      startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0, 0, 0, 0);
      label = `This Week (${startDate.toLocaleDateString([], { month: "short", day: "numeric" })} – ${now.toLocaleDateString([], { month: "short", day: "numeric" })})`;
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      label = `This Month (${MONTHS[now.getMonth()]} ${now.getFullYear()})`;
    }
    const periodTrades = trades.filter((t) => t.dt && new Date(t.dt) >= startDate);
    if (!periodTrades.length) { setOutput("No trades logged for this period yet."); setPeriod(label); return; }

    setPeriod(label); setLoading(true); setOutput("");
    let taken = 0, wins = 0, losses = 0, aplusTaken = 0, bGrade = 0, cGrade = 0, fGrade = 0, missed = 0, totalPnl = 0, totalFundedPnl = 0;
    periodTrades.forEach((t) => {
      const isTaken = t.taken && t.taken !== "Missed";
      const pv = parseFloat(t.profit);
      const pfv = parseFloat(t.profit_funded);
      if (!isNaN(pv)) totalPnl += pv;
      if (!isNaN(pfv)) totalFundedPnl += pfv;
      if (t.taken === "Missed") { missed++; return; }
      if (!isTaken) return;
      taken++;
      if (!isNaN(pv) && pv > 0) wins++;
      if (!isNaN(pv) && pv < 0) losses++;
      if (t.aplus?.startsWith("A+")) aplusTaken++;
      else if (t.aplus?.startsWith("B")) bGrade++;
      else if (t.aplus?.startsWith("C")) cGrade++;
      else if (t.aplus?.startsWith("F")) fGrade++;
    });

    const tsSection = buildAIScoreSection(periodTrades);
    const tagSection = buildAITagBreakdown(periodTrades);
    const modelSection = buildAIModelBreakdown(periodTrades);
    const splitSection = buildAISplitSection(periodTrades);

    const tradesSummary = periodTrades.map((t) => {
      const tags = t.tags && t.tags.length > 0 ? t.tags.map((tag) => `#${tag}`).join(" ") : "none";
      const viols = t.violations && t.violations.length > 0 ? t.violations.join(", ") : "none";
      return `Date: ${t.dt}, Asset: ${t.asset}, Direction: ${t.direction}, A+: ${t.aplus}, Taken: ${t.taken}, Personal P&L: ${t.profit != null ? "$" + t.profit : "blank"}, Funded P&L: ${t.profit_funded != null ? "$" + t.profit_funded : "blank"}, Tags: ${tags}, Violations: ${viols}, Notes: ${t.notes || "none"}, After Trade Thoughts: ${t.after_thoughts || "none"}`;
    }).join("\n");
    const violationSection = buildAIViolationBreakdown(periodTrades);

    const prompt = `${AI_COACH_TONE}

You are analyzing the performance of a funded futures trader who uses an ICT-inspired fractal model.

TRADING MODEL & RULES:
- Trades NQ, ES, GC, SI (index futures primarily)
- Uses: Fractal Model (TTFM), CISD, ICCISD, SMT divergence, PSP, SSMT, CIC (Crack in Correlation), GXT, 1STG/2STG entries, liquidity framework, FVGs
- A+ trade requires: CIC/SMT confirmation, key level/liquidity, timeframe alignment, CISD, ICCISD, TTFM alignment, correct session, good R:R, stop loss defined
- Default rule: NY session only. Avoid London session
- Max 2 trades per session
- Core psychological leaks: entering before confirmation, moving stops too early, trading London, revenge trading after losses, hesitating on clean setups, taking messy ones

RISK CONTEXT:
- Standard risk per trade: $500, targeting 2R ($1,000)
- Trades with P&L of $0–$200 are effectively breakeven — not real wins
- Trades over $1,000 profit = solid 2R+ execution
- Losses beyond -$500 = overexposure or moved stop
- Personal P&L = trader's personal account. Funded P&L = prop firm account. Both matter — evaluate each where available.
- IMPORTANT: Blank P&L does NOT mean breakeven — it means the trader didn't enter the number. Ignore blank fields when calculating metrics.

PERIOD: ${label}
TOTAL TRADES LOGGED: ${periodTrades.length}
TRADES TAKEN: ${taken} (Wins: ${wins}, Losses: ${losses})
A+ TRADES: ${aplusTaken} | B GRADE: ${bGrade} | C GRADE: ${cGrade} | F GRADE: ${fGrade}
MISSED SETUPS: ${missed}

SETUP GRADE DEFINITIONS:
- "A+" = followed plan exactly, clean entry and management
- "B" = good setup, but execution had flaws (poor entry, early exit, etc.)
- "C" = marginal or forced setup — borderline/impulsive
- "F" = no valid setup / broke a trading rule
NET PERSONAL P&L: $${totalPnl.toFixed(2)} (trades with P&L entered)
NET FUNDED P&L: $${totalFundedPnl.toFixed(2)} (funded account trades with P&L entered)
WIN RATE: ${taken ? Math.round((wins / taken) * 100) : 0}%

${splitSection}

${tsSection}

${tagSection}

${modelSection}

${violationSection}

INDIVIDUAL TRADES:
${tradesSummary}

ANALYSIS INSTRUCTIONS:
1. Performance Overview — Cover both Personal and Funded P&L separately where data exists. Win rate, key numbers. Judge wins against the $500 risk / $1,000 target framework. Call out breakeven trades disguised as wins.
2. TradeSharp Score Analysis — Reference the composite score and call out which specific pillars are dragging the score down. If Consistency is weak, say so. If A+ Discipline is high but Win Rate is low, call out the execution gap. Use the pillar scores to be precise.
3. Personal vs Funded Analysis — Compare personal and funded performance separately where data exists. If one environment is cleaner or more profitable, say so directly.
4. Setup Tag Analysis — Use the Tags field on each trade as the primary setup identifier. Identify which tagged setups are profitable vs weak.
5. Model Breakdown — Use the MODEL BREAKDOWN section. Identify which models are actually working and which ones are wasting trades.
6. Rule Violation Analysis — Reference the RULE VIOLATIONS section. If violations exist, call out exactly which ones repeated, how much they cost, and whether the trader shows self-awareness about them in the notes. If zero violations are logged, either acknowledge clean trading or state that the trader needs to track violations properly.
7. Strengths — What this trader is genuinely doing well. Keep praise brief and specific.
8. Flaws & Weaknesses — Be direct. Expose rule violations, execution failures, and psychological leaks. If the trader is repeating mistakes, say it plainly.
9. Language & Mindset Analysis — Read the notes closely. If the trader sounds vague, defensive, impulsive, or excuse-making, call it out.
10. Key Focus — 2-3 specific, actionable improvements for next ${p === "week" ? "week" : "month"}.
11. Final Word — One clear sentence on what is most limiting this trader's performance right now.

Be direct, specific, and reference actual trades and their notes. Keep it under 800 words.`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session ? { "Authorization": `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) throw new Error(`AI service error: ${res.status}`);
      const data = await res.json();
      if (data.error) { setOutput(data.error); setLoading(false); return; }
      setOutput(data.content?.map((c) => c.text || "").join("") || "No response received.");
    } catch {
      setOutput("Failed to generate summary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TCard style={{ padding: 28, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI TRADING SUMMARY</div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(5,150,105,0.12)", color: "var(--green)" }}>
          AI ENABLED
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => generate("week")} disabled={loading} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--accent-secondary)", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", background: "transparent", color: "var(--accent-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>THIS WEEK</button>
        <button onClick={() => generate("month")} disabled={loading} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--purple)", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", background: "transparent", color: "var(--purple)", letterSpacing: "0.05em", textTransform: "uppercase" }}>THIS MONTH</button>
      </div>
      {period && <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 10 }}>{period}</div>}
      {loading && <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--accent-secondary)", padding: "16px 0", animation: "hudPulse 1.5s ease-in-out infinite" }}>ANALYZING TRADES...</div>}
      {output && <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--bg-tertiary)", borderRadius: 6, padding: 20, border: "1px solid var(--border-primary)" }}>{output}</div>}
    </TCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════════════════

function BadgesSection({ trades, dayMap }) {
  const badges = computeBadges(trades, dayMap);

  return (
    <TCard style={{ padding: 28, marginTop: 24 }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.08em" }}>BADGES</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {badges.map((b, i) => (
          <div key={i} style={{
            textAlign: "center", padding: 16, borderRadius: 8,
            background: b.unlocked ? `${b.color}14` : "var(--bg-tertiary)",
            border: b.unlocked ? `1.5px solid ${b.color}44` : "1.5px solid var(--border-primary)",
            opacity: b.unlocked ? 1 : 0.5,
            boxShadow: b.unlocked ? `0 0 12px ${b.color}22` : "none",
          }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: b.unlocked ? "var(--text-primary)" : "var(--text-secondary)" }}>{b.name}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-secondary)", marginTop: 2 }}>{b.desc}</div>
          </div>
        ))}
      </div>
    </TCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// WEEKLY CHALLENGES
// ═══════════════════════════════════════════════════════════════════════════

function WeeklyChallengesSection({ trades }) {
  const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
  const weekTrades = trades.filter((t) => t.dt && new Date(t.dt) >= weekStart);
  const weekAplus = weekTrades.filter((t) => t.aplus?.startsWith("A+")).length;
  const weekDayMap = {};
  weekTrades.forEach((t) => { const k = dateKey(t.dt); if (!weekDayMap[k]) weekDayMap[k] = { pnl: 0 }; weekDayMap[k].pnl += parseFloat(t.profit) || 0; });
  const greenDays = Object.values(weekDayMap).filter((d) => d.pnl > 0).length;
  const withNotes = weekTrades.filter((t) => t.notes && t.notes.length > 5).length;
  const weekPnl = weekTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);

  const tradingDays = Object.keys(weekDayMap).length;
  const redDays = Object.values(weekDayMap).filter((d) => d.pnl < 0).length;
  const noRedDays = tradingDays > 0 ? tradingDays - redDays : 0;
  const weekDayCounts = {};
  weekTrades.forEach((t) => { if (t.dt && t.taken && t.taken !== "Missed") { const k = dateKey(t.dt); weekDayCounts[k] = (weekDayCounts[k] || 0) + 1; } });
  const daysTraded = Object.keys(weekDayCounts).length;
  const daysUnder2 = Object.values(weekDayCounts).filter((c) => c <= 2).length;

  const challenges = [
    { name: "Take 3 A+ trades this week", cur: Math.min(weekAplus, 3), goal: 3 },
    { name: "Have 3 green days this week", cur: Math.min(greenDays, 3), goal: 3 },
    { name: "Log 5 trades with notes", cur: Math.min(withNotes, 5), goal: 5 },
    { name: "Achieve a profitable week", cur: weekPnl > 0 ? 1 : 0, goal: 1 },
    { name: "No red days this week", cur: noRedDays, goal: Math.max(tradingDays, 1) },
    { name: "Stay under 2 trades/day all week", cur: daysUnder2, goal: Math.max(daysTraded, 1) },
  ];

  return (
    <TCard style={{ padding: 28, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 18 }}>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>WEEKLY CHALLENGES</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-secondary)" }}>Resets every Monday</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {challenges.map((c, i) => {
          const pct = Math.min(100, Math.round((c.cur / c.goal) * 100));
          const done = c.cur >= c.goal;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: done ? "var(--green)" : "var(--text-secondary)" }}>{done ? "✓ " : ""}{c.name}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)", fontWeight: 600 }}>{c.cur} / {c.goal}</span>
              </div>
              <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 8, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
                <div style={{ height: "100%", borderRadius: 4, background: done ? "var(--green)" : "linear-gradient(90deg, var(--accent-secondary), var(--accent))", transition: "width 0.4s", width: `${pct}%`, boxShadow: done ? "none" : "none" }} />
              </div>
            </div>
          );
        })}
      </div>
    </TCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// TRADING XP + STREAKS — Compact version for Roadmap tab
// ═══════════════════════════════════════════════════════════════════════════

export function TradingStatsView({ trades, privacyMode }) {
  const dayMap = useMemo(() => buildDayMap(trades), [trades]);

  const xp = useMemo(() => calcTradingXP(trades, dayMap), [trades, dayMap]);
  let level = XP_LEVELS[0];
  for (const l of XP_LEVELS) { if (xp >= l.min) level = l; }
  const isMax = level.max === Infinity;
  const pct = isMax ? 100 : Math.min(100, ((xp - level.min) / (level.max - level.min)) * 100);

  const { greenStreak, bestGreen, aplusStreak, bestAplus } = calcStreaks(trades);

  const profitFactor = useMemo(() => {
    const taken = trades.filter(t => t.taken);
    const wins = taken.filter(t => t.profit > 0).reduce((s, t) => s + t.profit, 0);
    const losses = taken.filter(t => t.profit < 0).reduce((s, t) => s + Math.abs(t.profit), 0);
    if (losses === 0) return wins > 0 ? "∞" : "—";
    return (wins / losses).toFixed(2);
  }, [trades]);

  const bestAsset = useMemo(() => {
    const taken = trades.filter(t => t.taken && t.asset);
    if (!taken.length) return { name: "—", pnl: 0 };
    const map = {};
    taken.forEach(t => { map[t.asset] = (map[t.asset] || 0) + (t.profit || 0); });
    const [name, pnl] = Object.entries(map).sort((a, b) => b[1] - a[1])[0];
    return { name, pnl };
  }, [trades]);

  const bestDay = useMemo(() => {
    const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const taken = trades.filter(t => t.taken);
    if (!taken.length) return { name: "—", avg: 0 };
    const map = {};
    taken.forEach(t => {
      const d = new Date(t.dt).getDay();
      if (!map[d]) map[d] = { sum: 0, count: 0 };
      map[d].sum += t.profit || 0;
      map[d].count++;
    });
    const [dayIdx, stats] = Object.entries(map).sort((a, b) => (b[1].sum / b[1].count) - (a[1].sum / a[1].count))[0];
    return { name: DAY_NAMES[dayIdx], avg: stats.sum / stats.count };
  }, [trades]);

  const bestDirection = useMemo(() => {
    const taken = trades.filter(t => t.taken);
    if (!taken.length) return { name: "—", winRate: 0 };
    const long = taken.filter(t => t.direction === "Long");
    const short = taken.filter(t => t.direction === "Short");
    const longWR = long.length ? long.filter(t => t.profit > 0).length / long.length : -1;
    const shortWR = short.length ? short.filter(t => t.profit > 0).length / short.length : -1;
    if (longWR === -1 && shortWR === -1) return { name: "—", winRate: 0 };
    if (longWR === -1) return { name: "Short", winRate: shortWR };
    if (shortWR === -1) return { name: "Long", winRate: longWR };
    return longWR >= shortWR ? { name: "Long", winRate: longWR } : { name: "Short", winRate: shortWR };
  }, [trades]);

  return (
    <div>
      <TCard style={{ padding: 28, marginBottom: 24, border: "1px solid rgba(167,139,250,0.2)", background: "linear-gradient(160deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 60%, rgba(167,139,250,0.04) 100%)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{level.name}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)" }}>{xp} XP</div>
          </div>
          <div style={{ fontSize: 40 }}>{level.icon}</div>
        </div>
        <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 10, overflow: "hidden", marginBottom: 8, border: "1px solid var(--border-primary)" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--purple), #c060ff)", transition: "width 0.5s", width: `${pct}%`, boxShadow: "0 0 10px rgba(167,139,250,0.5)" }} />
        </div>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", textAlign: "right" }}>
          {isMax ? "Max level reached!" : `${xp - level.min} / ${level.max - level.min} XP to next level`}
        </div>
      </TCard>
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <TCard style={{ padding: 22, textAlign: "center", background: "linear-gradient(145deg, rgba(251,191,36,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>{greenStreak}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>Green Day Streak</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Best: {bestGreen} days</div>
        </TCard>
        <TCard style={{ padding: 22, textAlign: "center", background: "linear-gradient(145deg, rgba(52,211,153,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--green)" }}>{aplusStreak}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>A+ Trade Streak</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Best: {bestAplus} trades</div>
        </TCard>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginTop: 14 }}>
        {/* Profit Factor */}
        <TCard style={{ padding: 22, textAlign: "center", background: "linear-gradient(145deg, rgba(34,211,238,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(34,211,238,0.15)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--accent)" }}>{profitFactor}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>Profit Factor</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Wins ÷ Losses</div>
        </TCard>

        {/* Best Performing Asset */}
        <TCard style={{ padding: 22, textAlign: "center", background: "linear-gradient(145deg, rgba(139,92,246,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(139,92,246,0.15)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--purple)" }}>{bestAsset.name}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>Best Asset</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: bestAsset.pnl >= 0 ? "var(--green)" : "var(--red)", marginTop: 8 }}>
            {bestAsset.name === "—" ? "No data" : (privacyMode ? "••••" : `${bestAsset.pnl >= 0 ? "+" : ""}$${bestAsset.pnl.toFixed(0)}`)}
          </div>
        </TCard>

        {/* Best Session Day */}
        <TCard style={{ padding: 22, textAlign: "center", background: "linear-gradient(145deg, rgba(251,191,36,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(251,191,36,0.15)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>{bestDay.name}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>Best Session Day</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: bestDay.avg >= 0 ? "var(--green)" : "var(--red)", marginTop: 8 }}>
            {bestDay.name === "—" ? "No data" : (privacyMode ? "••••" : `Avg ${bestDay.avg >= 0 ? "+" : ""}$${bestDay.avg.toFixed(0)}`)}
          </div>
        </TCard>

        {/* Best Trade Direction */}
        <TCard style={{ padding: 22, textAlign: "center", background: "linear-gradient(145deg, rgba(52,211,153,0.08) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(52,211,153,0.15)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--green)" }}>{bestDirection.name}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>Best Direction</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>
            {bestDirection.name === "—" ? "No data" : `${(bestDirection.winRate * 100).toFixed(0)}% win rate`}
          </div>
        </TCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// ACCOUNTS VIEW — Track funded accounts, evals, personal accounts
// ═══════════════════════════════════════════════════════════════════════════

const ACCOUNT_TYPES = [
  { value: "eval", label: "Evaluation", color: "var(--accent-secondary)" },
  { value: "funded", label: "Funded", color: "var(--green)" },
  { value: "personal", label: "Personal", color: "var(--purple)" },
];
const ACCOUNT_STATUSES = [
  { value: "active", label: "Active", color: "var(--accent-secondary)" },
  { value: "passed", label: "Passed", color: "var(--green)" },
  { value: "funded_active", label: "Funded - Active", color: "var(--green)" },
  { value: "payout", label: "Payout Received", color: "var(--gold)" },
  { value: "breached", label: "Breached", color: "var(--red)" },
  { value: "failed", label: "Failed", color: "var(--red)" },
  { value: "inactive", label: "Inactive", color: "var(--text-tertiary)" },
];

const emptyForm = { firm: "", account_name: "", account_type: "", account_size: "", status: "", profit_target: "", current_pnl: "", max_drawdown: "", daily_loss_limit: "", payout_pct: "", notes: "" };

const PAYOUT_METHODS = [
  { value: "ach", label: "ACH" },
  { value: "wire", label: "Wire" },
  { value: "crypto", label: "Crypto" },
  { value: "paypal", label: "PayPal" },
  { value: "other", label: "Other" },
];
const PAYOUT_STATUSES = [
  { value: "received", label: "Received", color: "var(--green)" },
  { value: "pending", label: "Pending", color: "var(--gold)" },
  { value: "failed", label: "Failed", color: "var(--red)" },
];
const emptyPayoutForm = { account_id: "", amount: "", payout_date: "", method: "", status: "received", notes: "" };

export function AccountsView({ supabase, user, privacyMode }) {
  const toast = useToast();
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(null);
  const [confirmDeletePayout, setConfirmDeletePayout] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [showAddAccount, setShowAddAccount] = useState(false);

  // Payout log state
  const [payouts, setPayouts] = useState([]);
  const [payoutForm, setPayoutForm] = useState({ ...emptyPayoutForm });
  const [editingPayout, setEditingPayout] = useState(null);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutCelebration, setPayoutCelebration] = useState(null); // amount string

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setAccounts(data);
  }, [user]);

  const loadPayouts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("payouts").select("*").eq("user_id", user.id).order("payout_date", { ascending: false });
    if (data) setPayouts(data);
  }, [user]);

  useEffect(() => { loadAccounts(); loadPayouts(); }, [loadAccounts, loadPayouts]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditing(null); };
  const resetPayoutForm = () => { setPayoutForm({ ...emptyPayoutForm }); setEditingPayout(null); };

  // Escape key — close account/payout modals
  useEffect(() => {
    const handler = (e) => {
      if (e.key !== "Escape") return;
      if (showPayoutModal) { setPayoutForm({ ...emptyPayoutForm }); setEditingPayout(null); setShowPayoutModal(false); return; }
      if (showAddAccount) { setShowAddAccount(false); return; }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showPayoutModal, showAddAccount]);

  const savePayout = async () => {
    if (!payoutForm.amount || !payoutForm.payout_date) { toast("Please enter an amount and date."); return; }
    const payload = {
      user_id: user.id,
      account_id: payoutForm.account_id || null,
      amount: parseFloat(payoutForm.amount),
      payout_date: payoutForm.payout_date,
      method: payoutForm.method || null,
      status: payoutForm.status || "received",
      notes: payoutForm.notes || null,
    };
    let err;
    if (editingPayout) {
      ({ error: err } = await supabase.from("payouts").update(payload).eq("id", editingPayout));
    } else {
      ({ error: err } = await supabase.from("payouts").insert(payload));
    }
    if (err) { toast("Error saving payout: " + err.message); return; }
    const savedAmount = payoutForm.amount;
    resetPayoutForm(); loadPayouts(); setShowPayoutModal(false);
    if (!editingPayout) {
      setPayoutCelebration(savedAmount);
      setTimeout(() => setPayoutCelebration(null), 4000);
    }
  };

  const deletePayout = async (id) => {
    await supabase.from("payouts").delete().eq("id", id);
    if (editingPayout === id) resetPayoutForm();
    loadPayouts();
  };

  const openEditPayout = (p) => {
    setEditingPayout(p.id);
    setPayoutForm({
      account_id: p.account_id || "",
      amount: p.amount != null ? String(p.amount) : "",
      payout_date: p.payout_date || "",
      method: p.method || "",
      status: p.status || "received",
      notes: p.notes || "",
    });
    setShowPayoutModal(true);
  };

  const saveAccount = async () => {
    if (!form.firm) { toast("Please enter a firm name."); return; }
    const payload = {
      user_id: user.id, firm: form.firm, account_name: form.account_name || form.firm,
      account_type: form.account_type || "eval", account_size: form.account_size ? parseFloat(form.account_size) : null,
      status: form.status || "active", profit_target: form.profit_target ? parseFloat(form.profit_target) : null,
      current_pnl: form.current_pnl ? parseFloat(form.current_pnl) : null,
      max_drawdown: form.max_drawdown ? parseFloat(form.max_drawdown) : null,
      daily_loss_limit: form.daily_loss_limit ? parseFloat(form.daily_loss_limit) : null,
      payout_pct: form.payout_pct ? parseFloat(form.payout_pct) : null,
      notes: form.notes || null,
    };
    let err;
    if (editing) {
      ({ error: err } = await supabase.from("accounts").update(payload).eq("id", editing));
    } else {
      ({ error: err } = await supabase.from("accounts").insert(payload));
    }
    if (err) { toast("Error saving account: " + err.message); return; }
    resetForm(); loadAccounts(); setShowAddAccount(false);
  };

  const deleteAccount = async (id) => {
    await supabase.from("accounts").delete().eq("id", id);
    if (editing === id) resetForm();
    loadAccounts();
  };

  const openEdit = (acc) => {
    setEditing(acc.id);
    setForm({
      firm: acc.firm || "", account_name: acc.account_name || "", account_type: acc.account_type || "eval",
      account_size: acc.account_size != null ? String(acc.account_size) : "", status: acc.status || "active",
      profit_target: acc.profit_target != null ? String(acc.profit_target) : "",
      current_pnl: acc.current_pnl != null ? String(acc.current_pnl) : "",
      max_drawdown: acc.max_drawdown != null ? String(acc.max_drawdown) : "",
      daily_loss_limit: acc.daily_loss_limit != null ? String(acc.daily_loss_limit) : "",
      payout_pct: acc.payout_pct != null ? String(acc.payout_pct) : "",
      notes: acc.notes || "",
    });
    setShowAddAccount(true);
  };

  // Summary counts
  const fundedCount = accounts.filter((a) => a.account_type === "funded" || a.status === "funded_active").length;
  const evalCount = accounts.filter((a) => a.account_type === "eval" && !["passed", "breached", "failed"].includes(a.status)).length;
  const passedCount = accounts.filter((a) => a.status === "passed").length;
  const totalPnl = accounts.reduce((sum, acc) => sum + (acc.current_pnl != null ? Number(acc.current_pnl) : 0), 0);

  // Payout eligible: sum of (positive P&L * payout_pct) across all accounts
  const totalEligiblePayout = accounts.reduce((sum, acc) => {
    const pnl = acc.current_pnl != null ? Number(acc.current_pnl) : 0;
    const pct = acc.payout_pct != null ? Number(acc.payout_pct) : 0;
    if (pnl > 0 && pct > 0) return sum + (pnl * pct / 100);
    return sum;
  }, 0);

  // Payout totals (current year)
  const currentYear = new Date().getFullYear();
  const ytdPayouts = payouts.filter((p) => p.payout_date && new Date(p.payout_date).getFullYear() === currentYear);
  const totalPaidOut = ytdPayouts.filter((p) => p.status === "received").reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const totalPending = ytdPayouts.filter((p) => p.status === "pending").reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const getStatusMeta = (s) => ACCOUNT_STATUSES.find((st) => st.value === s) || ACCOUNT_STATUSES[0];
  const getAccountName = (id) => { const a = accounts.find((acc) => acc.id === id); return a ? (a.account_name || a.firm) : "—"; };

  const fmtMoney = (v) => {
    if (v == null || v === "") return null;
    if (privacyMode) return MASK;
    const n = Number(v);
    return "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="FUNDED ACCOUNTS"
        title="Track every account. Manage every dollar."
        subtitle="Monitor your funded accounts, payouts, and drawdown — stay sharp, stay funded."
      />
      {/* Summary */}
      <div className="acct-summary" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 12 }}>
        <StatBox value={fundedCount} label="Funded" color="var(--green)" />
        <StatBox value={evalCount} label="In Eval" color="var(--accent-secondary)" />
        <StatBox value={passedCount} label="Passed" color="var(--green)" />
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(34,211,238,0.10) 0%, transparent 100%)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${totalPnl >= 0 ? "+" : "-"}$${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Current P&L</div>
        </TCard>
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(52,211,153,0.10) 0%, transparent 100%)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalEligiblePayout > 0 ? "var(--green)" : "var(--text-tertiary)" }}>{privacyMode ? MASK : `$${totalEligiblePayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Eligible Payout</div>
        </TCard>
      </div>
      <div className="acct-summary-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
        <TCard style={{ padding: "18px 20px", textAlign: "center", border: "1px solid rgba(52,211,153,0.18)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalPaidOut > 0 ? "var(--green)" : "var(--text-tertiary)" }}>{privacyMode ? MASK : `$${totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>YTD Paid Out</div>
        </TCard>
        <TCard style={{ padding: "18px 20px", textAlign: "center", border: "1px solid rgba(251,191,36,0.18)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalPending > 0 ? "var(--gold)" : "var(--text-tertiary)" }}>{privacyMode ? MASK : `$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Pending</div>
        </TCard>
      </div>

      {/* Account Cards */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Accounts</div>
        <button onClick={() => { resetForm(); setShowAddAccount(true); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.05em" }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          Add Account
        </button>
      </div>
      {!accounts.length && (
        <TCard style={{ padding: 48, textAlign: "center", marginBottom: 24 }}>
          <div style={{ marginBottom: 16, display: "flex", justifyContent: "center", color: "var(--text-tertiary)", opacity: 0.4 }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg></div>
          <div style={{ fontSize: 16, color: "var(--text-tertiary)" }}>No accounts yet. Click <strong>+ Add Account</strong> to get started.</div>
        </TCard>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        {accounts.map((acc) => {
          const statusMeta = getStatusMeta(acc.status);
          const pnl = acc.current_pnl != null ? Number(acc.current_pnl) : null;
          return (
            <TCard key={acc.id} style={{ padding: 24, borderLeft: `4px solid ${statusMeta.color}` }}>
              <>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{acc.account_name || acc.firm}</span>
                    <Badge label={statusMeta.label} color={statusMeta.color} />
                  </div>
                  <div className="acct-card-stats" style={{ display: "flex", gap: 28, fontSize: 14, flexWrap: "wrap", marginBottom: 14 }}>
                    {acc.account_size != null && (
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Account Size</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.account_size)}</div>
                      </div>
                    )}
                    {pnl != null && (
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Current P&L</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: pnl >= 0 ? "var(--green)" : "var(--red)", fontSize: 15 }}>{privacyMode ? MASK : `${pnl >= 0 ? "+" : "-"}${fmtMoney(pnl)}`}</div>
                      </div>
                    )}
                    {acc.profit_target != null && (
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Profit Target</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.profit_target)}</div>
                      </div>
                    )}
                    {acc.max_drawdown != null && (
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Max Drawdown</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.max_drawdown)}</div>
                      </div>
                    )}
                    {acc.daily_loss_limit != null && (
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Daily Loss Limit</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.daily_loss_limit)}</div>
                      </div>
                    )}
                    {acc.payout_pct != null && (
                      <div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Payout %</div>
                        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{Number(acc.payout_pct)}%</div>
                      </div>
                    )}
                    {(() => {
                      const accPnl = acc.current_pnl != null ? Number(acc.current_pnl) : 0;
                      const accPct = acc.payout_pct != null ? Number(acc.payout_pct) : 0;
                      const eligible = accPnl > 0 && accPct > 0 ? accPnl * accPct / 100 : 0;
                      return eligible > 0 ? (
                        <div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Eligible Payout</div>
                          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, color: "var(--green)", fontSize: 15 }}>{fmtMoney(eligible)}</div>
                        </div>
                      ) : null;
                    })()}
                  </div>
                  {acc.notes && (
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "10px 0", borderTop: "1px solid var(--border-primary)", whiteSpace: "pre-wrap" }}>{acc.notes}</div>
                  )}
                  <div style={{ display: "flex", justifyContent: "flex-end", gap: 14 }}>
                    <button onClick={() => openEdit(acc)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--accent-secondary)", fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
                    <DeletePopover id={acc.id} confirmId={confirmDeleteAccount} setConfirmId={setConfirmDeleteAccount} onConfirm={deleteAccount} buttonStyle={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete</DeletePopover>
                  </div>
                </>
            </TCard>
          );
        })}
      </div>

      {/* ─── PAYOUT LOG ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Payout Log</div>
          <button onClick={() => { resetPayoutForm(); setShowPayoutModal(true); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.05em" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Log Payout
          </button>
        </div>

        {/* Payout entries */}
        {!payouts.length && (
          <TCard style={{ padding: 36, textAlign: "center", marginBottom: 14 }}>
            <div style={{ marginBottom: 12, display: "flex", justifyContent: "center", color: "var(--text-tertiary)", opacity: 0.4 }}><svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div style={{ fontSize: 14, color: "var(--text-tertiary)" }}>No payouts logged yet. Record your first payout below.</div>
          </TCard>
        )}
        {payouts.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 14 }}>
            {payouts.map((p) => {
              const pStatus = PAYOUT_STATUSES.find((s) => s.value === p.status) || PAYOUT_STATUSES[0];
              const pMethod = PAYOUT_METHODS.find((m) => m.value === p.method);
              return (
                <TCard key={p.id} style={{ padding: "18px 24px", borderLeft: `4px solid ${pStatus.color}` }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                      <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>{privacyMode ? MASK : `$${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</span>
                      <Badge label={pStatus.label} color={pStatus.color} />
                      {pMethod && <Badge label={pMethod.label} color="var(--text-tertiary)" />}
                    </div>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>{p.payout_date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                      <span>{getAccountName(p.account_id)}</span>
                      {p.notes && <span style={{ color: "var(--text-tertiary)" }}>— {p.notes}</span>}
                    </div>
                    <div style={{ display: "flex", gap: 14 }}>
                      <button onClick={() => openEditPayout(p)} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--accent-secondary)", fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg> Edit</button>
                      <DeletePopover id={p.id} confirmId={confirmDeletePayout} setConfirmId={setConfirmDeletePayout} onConfirm={deletePayout} buttonStyle={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 5, fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600 }}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg> Delete</DeletePopover>
                    </div>
                  </div>
                </TCard>
              );
            })}
          </div>
        )}

      </div>

      {/* ─── PAYOUT CELEBRATION ────────────────────────────────────────── */}
      {payoutCelebration && (
        <div style={{ position: "fixed", top: 24, left: "50%", transform: "translateX(-50%)", zIndex: 200, animation: "fadeSlideIn 0.3s ease", pointerEvents: "none" }}>
          <div style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 14,
            background: "linear-gradient(135deg, rgba(52,211,153,0.18), rgba(34,211,238,0.1))",
            border: "1px solid rgba(52,211,153,0.4)", borderRadius: 12, padding: "16px 28px",
            backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(52,211,153,0.2)",
          }}>
            <div style={{ color: "var(--green)", display: "flex", alignItems: "center" }}><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--green)", letterSpacing: "0.02em" }}>Payout Logged!</div>
              <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>${Number(payoutCelebration).toLocaleString()} — keep stacking.</div>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD ACCOUNT MODAL ─────────────────────────────────────────── */}
      {showAddAccount && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { resetForm(); setShowAddAccount(false); } }} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "var(--modal-overlay, rgba(0,0,0,0.7))", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="modal-inner" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 12, padding: 32, width: "100%", maxWidth: 960, maxHeight: "90vh", overflowY: "auto", animation: "fadeSlideIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{editing ? "Edit Account" : "Add Account"}</div>
              <button onClick={() => { resetForm(); setShowAddAccount(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <Field label="Firm Name"><input style={inputStyle} placeholder="e.g. Apex, Topstep, FTMO" value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} /></Field>
              <Field label="Account Size ($)"><input type="number" style={inputStyle} placeholder="e.g. 50000" value={form.account_size} onChange={(e) => setForm({ ...form, account_size: e.target.value })} /></Field>
              <Field label="Type">
                <select style={selectStyle} value={form.account_type} onChange={(e) => setForm({ ...form, account_type: e.target.value })}>
                  <option value="">Select...</option>
                  {ACCOUNT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select style={selectStyle} value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                  <option value="">Select...</option>
                  {ACCOUNT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="form-grid acct-modal-grid-5" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
              <Field label="Profit Target ($)"><input type="number" style={inputStyle} placeholder="e.g. 3000" value={form.profit_target} onChange={(e) => setForm({ ...form, profit_target: e.target.value })} /></Field>
              <Field label="Current P&L ($)"><input type="number" style={inputStyle} placeholder="e.g. 1500" value={form.current_pnl} onChange={(e) => setForm({ ...form, current_pnl: e.target.value })} /></Field>
              <Field label="Max Drawdown ($)"><input type="number" style={inputStyle} placeholder="e.g. 2500" value={form.max_drawdown} onChange={(e) => setForm({ ...form, max_drawdown: e.target.value })} /></Field>
              <Field label="Daily Loss Limit ($)"><input type="number" style={inputStyle} placeholder="e.g. 500" value={form.daily_loss_limit} onChange={(e) => setForm({ ...form, daily_loss_limit: e.target.value })} /></Field>
              <Field label="Payout Eligible (%)"><input type="number" style={inputStyle} placeholder="e.g. 80" min="0" max="100" value={form.payout_pct} onChange={(e) => setForm({ ...form, payout_pct: e.target.value })} /></Field>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }} placeholder="Withdrawal dates, rules, notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { resetForm(); setShowAddAccount(false); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
              <button onClick={saveAccount} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 700, padding: 14, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em" }}>{editing ? "SAVE CHANGES" : "+ ADD ACCOUNT"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── LOG / EDIT PAYOUT MODAL ────────────────────────────────────── */}
      {showPayoutModal && (
        <div onClick={(e) => { if (e.target === e.currentTarget) { resetPayoutForm(); setShowPayoutModal(false); } }} className="modal-overlay" style={{ position: "fixed", inset: 0, background: "var(--modal-overlay, rgba(0,0,0,0.7))", backdropFilter: "blur(8px)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div className="modal-inner" style={{ background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", borderRadius: 12, padding: 32, width: "100%", maxWidth: 860, maxHeight: "90vh", overflowY: "auto", animation: "fadeSlideIn 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{editingPayout ? "Edit Payout" : "Log Payout"}</div>
              <button onClick={() => { resetPayoutForm(); setShowPayoutModal(false); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-tertiary)", fontSize: 20, lineHeight: 1, padding: 4 }}>✕</button>
            </div>
            <div className="payout-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
              <Field label="Amount ($)"><input type="number" style={inputStyle} placeholder="e.g. 1000" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })} /></Field>
              <Field label="Date"><input type="date" style={inputStyle} value={payoutForm.payout_date} onChange={(e) => setPayoutForm({ ...payoutForm, payout_date: e.target.value })} /></Field>
              <Field label="Account">
                <select style={selectStyle} value={payoutForm.account_id} onChange={(e) => setPayoutForm({ ...payoutForm, account_id: e.target.value })}>
                  <option value="">Select account...</option>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.account_name || a.firm}</option>)}
                </select>
              </Field>
              <Field label="Method">
                <select style={selectStyle} value={payoutForm.method} onChange={(e) => setPayoutForm({ ...payoutForm, method: e.target.value })}>
                  <option value="">Select...</option>
                  {PAYOUT_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                </select>
              </Field>
              <Field label="Status">
                <select style={selectStyle} value={payoutForm.status} onChange={(e) => setPayoutForm({ ...payoutForm, status: e.target.value })}>
                  {PAYOUT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </Field>
            </div>
            <div style={{ marginBottom: 24 }}>
              <Field label="Notes"><input style={inputStyle} placeholder="Reference #, fees, etc." value={payoutForm.notes} onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })} /></Field>
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => { resetPayoutForm(); setShowPayoutModal(false); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
              <button onClick={savePayout} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 700, padding: 14, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em" }}>{editingPayout ? "SAVE CHANGES" : "+ LOG PAYOUT"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MODELS VIEW — Per-strategy performance breakdown
// ═══════════════════════════════════════════════════════════════════════════

export function ModelsView({ supabase, user, trades, privacyMode }) {
  const [models, setModels] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [showModal, setShowModal] = React.useState(false);
  const [editingModel, setEditingModel] = React.useState(null);
  const [formName, setFormName] = React.useState("");
  const [formDesc, setFormDesc] = React.useState("");
  const [formPhotoUrl, setFormPhotoUrl] = React.useState(null);
  const [formPhotoFile, setFormPhotoFile] = React.useState(null);
  const [formPhotoPreview, setFormPhotoPreview] = React.useState(null);
  const [formRules, setFormRules] = React.useState([]);
  const [newRuleLabel, setNewRuleLabel] = React.useState("");
  const [newRuleSub, setNewRuleSub] = React.useState("");
  const [confirmDelete, setConfirmDelete] = React.useState(null);
  const [selectedModelId, setSelectedModelId] = React.useState(null);
  const [checkedRules, setCheckedRules] = React.useState([]);
  const photoInputRef = React.useRef(null);

  React.useEffect(() => {
    if (!user) return;
    supabase.from("checklist_items").select("items").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => {
        setModels(data?.items?.models ?? []);
        setLoading(false);
      });
  }, [user]);

  React.useEffect(() => {
    if (!selectedModelId) return;
    const dm = models.find(m => m.id === selectedModelId);
    setCheckedRules(new Array(dm?.items?.length ?? 0).fill(false));
  }, [selectedModelId, models]);

  const persistModels = async (updated) => {
    await supabase.from("checklist_items").upsert(
      { user_id: user.id, items: { v: 2, models: updated }, updated_at: new Date().toISOString() },
      { onConflict: "user_id" }
    );
    setModels(updated);
  };

  const openCreate = () => {
    setEditingModel(null);
    setFormName(""); setFormDesc(""); setFormPhotoUrl(null);
    setFormPhotoFile(null); setFormPhotoPreview(null); setFormRules([]);
    setNewRuleLabel(""); setNewRuleSub("");
    setShowModal(true);
  };

  const openEdit = (m) => {
    setEditingModel(m);
    setFormName(m.name); setFormDesc(m.description || "");
    setFormPhotoUrl(m.photo_url || null); setFormPhotoFile(null);
    setFormPhotoPreview(m.photo_url || null);
    setFormRules(m.items || []);
    setNewRuleLabel(""); setNewRuleSub("");
    setShowModal(true);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFormPhotoFile(file);
    setFormPhotoPreview(URL.createObjectURL(file));
  };

  const handleAddRule = () => {
    if (!newRuleLabel.trim() || formRules.length >= 20) return;
    setFormRules(r => [...r, { label: newRuleLabel.trim(), sub: newRuleSub.trim() }]);
    setNewRuleLabel(""); setNewRuleSub("");
  };

  const handleSave = async () => {
    if (!formName.trim()) return;
    setSaving(true);
    const modelId = editingModel?.id ?? ("m_" + Math.random().toString(36).slice(2, 8));
    let photoUrl = formPhotoUrl;
    if (formPhotoFile) {
      const ext = formPhotoFile.name.split(".").pop();
      const path = `${user.id}/models/${modelId}.${ext}`;
      await supabase.storage.from("avatars").upload(path, formPhotoFile, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      photoUrl = publicUrl + "?t=" + Date.now();
    }
    const updated = editingModel
      ? models.map(m => m.id === editingModel.id
          ? { ...m, name: formName.trim(), description: formDesc, photo_url: photoUrl, items: formRules }
          : m)
      : [...models, { id: modelId, name: formName.trim(), description: formDesc, photo_url: photoUrl, items: formRules }];
    await persistModels(updated);
    setSaving(false);
    setShowModal(false);
  };

  const handleDelete = async (id) => {
    await persistModels(models.filter(m => m.id !== id));
    setConfirmDelete(null);
  };

  const modelStats = React.useMemo(() => {
    const stats = {};
    models.forEach(m => {
      const mt = trades.filter(t => t.model === m.name);
      const taken = mt.filter(t => t.taken !== "Missed");
      const wins = taken.filter(t => parseFloat(t.profit) > 0);
      const losses = taken.filter(t => parseFloat(t.profit) < 0);
      const pnl = taken.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
      const avgWin = wins.length ? wins.reduce((s, t) => s + parseFloat(t.profit), 0) / wins.length : 0;
      const avgLoss = losses.length ? losses.reduce((s, t) => s + parseFloat(t.profit), 0) / losses.length : 0;
      const assets = {};
      taken.forEach(t => { assets[t.asset] = (assets[t.asset] || 0) + (parseFloat(t.profit) || 0); });
      const bestAsset = Object.entries(assets).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "—";
      const winRate = taken.length ? Math.round(wins.length / taken.length * 100) : null;
      const grossProfit = wins.reduce((s, t) => s + parseFloat(t.profit), 0);
      const grossLoss = Math.abs(losses.reduce((s, t) => s + parseFloat(t.profit), 0));
      const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : null;
      const wlRatio = avgWin > 0 && avgLoss < 0 ? avgWin / Math.abs(avgLoss) : null;
      const aplusTaken = taken.filter(t => t.aplus?.startsWith("A+"));
      const aplusRate = taken.length ? Math.round(aplusTaken.length / taken.length * 100) : null;
      const pnlFunded = taken.reduce((s, t) => s + (parseFloat(t.profit_funded) || 0), 0);
      stats[m.name] = { count: taken.length, wins: wins.length, losses: losses.length, winRate, pnl, pnlFunded, avgWin, avgLoss, profitFactor, wlRatio, aplusRate, bestAsset };
    });
    return stats;
  }, [models, trades]);

  const wrColor = (wr) => {
    if (wr === null) return "var(--text-tertiary)";
    if (wr >= 70) return "var(--accent)";
    if (wr >= 55) return "var(--green)";
    if (wr >= 40) return "var(--gold)";
    return "var(--red)";
  };

  const btnBase = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, cursor: "pointer", letterSpacing: "0.04em", transition: "all 0.15s" };

  const PhotoCircle = ({ url, size = 56 }) => (
    <div style={{ width: size, height: size, borderRadius: "50%", flexShrink: 0, overflow: "hidden", background: "var(--bg-tertiary)", border: "1.5px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center" }}>
      {url
        ? <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        : <svg width={size * 0.45} height={size * 0.45} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
      }
    </div>
  );

  if (loading) return <div style={{ padding: 40, textAlign: "center", color: "var(--text-tertiary)" }}>Loading models…</div>;

  const modalJsx = showModal && (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
      style={{ position: "fixed", inset: 0, background: "var(--modal-overlay)", backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", zIndex: 500, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div style={{ width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", borderRadius: 14, background: "var(--bg-secondary)", border: "1px solid var(--border-primary)", backdropFilter: "var(--glass-blur)", WebkitBackdropFilter: "var(--glass-blur)", boxShadow: "0 24px 60px rgba(0,0,0,0.4)", padding: "32px 36px 28px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em" }}>{editingModel ? "Edit Model" : "New Model"}</div>
          <button onClick={() => setShowModal(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: "var(--text-tertiary)", lineHeight: 1, padding: 4 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 24 }}>
          <div onClick={() => photoInputRef.current?.click()} style={{ width: 80, height: 80, borderRadius: "50%", overflow: "hidden", background: "var(--bg-tertiary)", border: "2px dashed var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            {formPhotoPreview
              ? <img src={formPhotoPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
            }
          </div>
          <button onClick={() => photoInputRef.current?.click()} style={{ marginTop: 8, background: "none", border: "none", cursor: "pointer", fontSize: 12, color: "var(--accent)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 600 }}>
            {formPhotoPreview ? "Change Photo" : "Upload Photo"}
          </button>
          <input ref={photoInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Model Name *</label>
          <input autoFocus value={formName} onChange={e => setFormName(e.target.value)} placeholder="e.g. ICT Fractal, Breakout, SMC" maxLength={40} style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 600, padding: "10px 12px", borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)", outline: "none" }} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: "block", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Description</label>
          <textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} placeholder="What is this model? When do you use it?" rows={3} style={{ width: "100%", boxSizing: "border-box", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, padding: "10px 12px", borderRadius: 6, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)", outline: "none", resize: "vertical" }} />
        </div>
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
            <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Rules / Checklist Items</label>
            <span style={{ fontSize: 11, color: "var(--text-tertiary)" }}>{formRules.length}/20</span>
          </div>
          {formRules.length > 0 && (
            <div style={{ marginBottom: 10, display: "flex", flexDirection: "column", gap: 6 }}>
              {formRules.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 12px", borderRadius: 6, background: "var(--bg-primary)", border: "1px solid var(--border-primary)" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: "var(--text-primary)" }}>{r.label}</div>
                    {r.sub && <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{r.sub}</div>}
                  </div>
                  <button onClick={() => setFormRules(rules => rules.filter((_, j) => j !== i))} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-tertiary)", padding: 0, lineHeight: 1, flexShrink: 0 }}>×</button>
                </div>
              ))}
            </div>
          )}
          {formRules.length < 20 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              <input value={newRuleLabel} onChange={e => setNewRuleLabel(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddRule(); } }} placeholder="Rule label" style={{ flex: "1 1 140px", minWidth: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, padding: "8px 10px", borderRadius: 5, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)", outline: "none" }} />
              <input value={newRuleSub} onChange={e => setNewRuleSub(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddRule(); } }} placeholder="Details (optional)" style={{ flex: "2 1 180px", minWidth: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, padding: "8px 10px", borderRadius: 5, border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-primary)", outline: "none" }} />
              <button onClick={handleAddRule} disabled={!newRuleLabel.trim()} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "8px 14px", borderRadius: 5, border: "1px solid rgba(34,211,238,0.25)", background: "var(--accent-dim)", color: "var(--accent)", cursor: "pointer", letterSpacing: "0.04em", opacity: newRuleLabel.trim() ? 1 : 0.4 }}>+ Add</button>
            </div>
          )}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, borderTop: "1px solid var(--border-primary)", paddingTop: 20, marginTop: 4 }}>
          <button onClick={() => setShowModal(false)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, padding: "7px 18px", borderRadius: 6, border: "1px solid var(--border-primary)", background: "transparent", color: "var(--text-secondary)", cursor: "pointer", letterSpacing: "0.04em" }}>Cancel</button>
          <button onClick={handleSave} disabled={!formName.trim() || saving} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, padding: "7px 20px", borderRadius: 6, border: "1px solid rgba(34,211,238,0.25)", background: "var(--accent-dim)", color: "var(--accent)", cursor: "pointer", letterSpacing: "0.04em", opacity: (!formName.trim() || saving) ? 0.5 : 1 }}>
            {saving ? "Saving…" : "Save Model"}
          </button>
        </div>
      </div>
    </div>
  );

  // ── Detail view (replaces grid in-place, no overlay) ──────────────────────
  if (selectedModelId) {
    const dm = models.find(m => m.id === selectedModelId);
    if (!dm) { setSelectedModelId(null); return null; }
    const s = modelStats[dm.name] ?? { count: 0, wins: 0, losses: 0, winRate: null, pnl: 0, pnlFunded: 0, avgWin: 0, avgLoss: 0, profitFactor: null, wlRatio: null, aplusRate: null, bestAsset: "—" };
    const wr = s.winRate;
    const wrc = wrColor(wr);
    const pfColor = s.profitFactor === null ? "var(--text-tertiary)" : s.profitFactor >= 2 ? "var(--accent)" : s.profitFactor >= 1.5 ? "var(--green)" : s.profitFactor >= 1 ? "var(--gold)" : "var(--red)";
    return (
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 40px", animation: "fadeSlideIn 0.2s ease" }}>
        <style>{`
          .model-stat-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; }
          .model-sub-stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
          .model-rules-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0; }
          @media (max-width: 600px) {
            .model-stat-grid { grid-template-columns: repeat(2, 1fr) !important; }
            .model-sub-stat-grid { grid-template-columns: 1fr !important; }
            .model-rules-grid { grid-template-columns: 1fr !important; }
          }
          @media (min-width: 601px) and (max-width: 800px) {
            .model-stat-grid { grid-template-columns: repeat(3, 1fr) !important; }
          }
        `}</style>

        {/* Back */}
        <button
          onClick={() => setSelectedModelId(null)}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", background: "none", border: "none", cursor: "pointer", marginBottom: 24, padding: 0, letterSpacing: "0.04em" }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Models
        </button>

        {/* Hero */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 20, marginBottom: 28 }}>
          <PhotoCircle url={dm.photo_url} size={72} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <h1 style={{ margin: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>{dm.name}</h1>
              <button onClick={() => openEdit(dm)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "4px 12px", borderRadius: 4, border: "1px solid rgba(34,211,238,0.25)", background: "var(--accent-dim)", color: "var(--accent)", cursor: "pointer", letterSpacing: "0.04em" }}>Edit</button>
            </div>
            {dm.description && <p style={{ margin: "8px 0 0", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>{dm.description}</p>}
            <div style={{ marginTop: 8, fontSize: 11, color: "var(--text-tertiary)", fontWeight: 600 }}>{(dm.items?.length ?? 0)} rule{(dm.items?.length ?? 0) !== 1 ? "s" : ""} · {s.count} trade{s.count !== 1 ? "s" : ""}</div>
          </div>
        </div>

        {/* Stats — full width */}
        <TCard style={{ padding: "22px 24px", marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>Performance</div>
          {s.count === 0 ? (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>No trades tagged to this model yet.</div>
          ) : (
            <>
              {/* Top stat row — 5 cards */}
              <div className="model-stat-grid" style={{ marginBottom: 16 }}>
                {[
                  { label: "Win Rate", value: wr !== null ? `${wr}%` : "—", color: wrc },
                  { label: "Trades", value: s.count, color: "var(--text-primary)" },
                  { label: "Total P&L", value: privacyMode ? "••••" : `${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}`, color: s.pnl >= 0 ? "var(--green)" : "var(--red)" },
                  { label: "Profit Factor", value: s.profitFactor !== null ? s.profitFactor.toFixed(2) : "—", color: pfColor },
                  { label: "A+ Rate", value: s.aplusRate !== null ? `${s.aplusRate}%` : "—", color: "var(--accent)" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "14px 12px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color, lineHeight: 1, marginBottom: 5 }}>{value}</div>
                    <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Win rate bar */}
              <div style={{ marginBottom: 16 }}>
                <div style={{ height: 7, borderRadius: 4, background: "var(--bg-tertiary)", overflow: "hidden", marginBottom: 6 }}>
                  {wr !== null && <div style={{ height: "100%", width: `${wr}%`, background: wrc, borderRadius: 4, transition: "width 0.4s ease" }} />}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--text-tertiary)" }}>
                  <span>{s.wins}W / {s.losses}L</span>
                  <span style={{ color: s.pnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{privacyMode ? "••••" : `${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}`}</span>
                </div>
              </div>

              {/* Sub stat row — 3 cards */}
              <div className="model-sub-stat-grid">
                {[
                  { label: "Avg Win", value: s.avgWin > 0 ? (privacyMode ? "••••" : `+$${s.avgWin.toFixed(0)}`) : "—", color: "var(--green)" },
                  { label: "Avg Loss", value: s.avgLoss < 0 ? (privacyMode ? "••••" : `-$${Math.abs(s.avgLoss).toFixed(0)}`) : "—", color: "var(--red)" },
                  { label: "W:L Ratio", value: s.wlRatio !== null ? `${s.wlRatio.toFixed(1)}x` : "—", color: "#f59e0b" },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: "var(--bg-primary)", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                    <div style={{ fontSize: 18, fontWeight: 800, color, lineHeight: 1, marginBottom: 4 }}>{value}</div>
                    <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </>
          )}
        </TCard>

        {/* Rules — full width */}
        <TCard style={{ padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Rules / Checklist ({dm.items?.length ?? 0})</div>
          </div>
          {(!dm.items || dm.items.length === 0) ? (
            <div style={{ fontSize: 13, color: "var(--text-tertiary)", fontStyle: "italic" }}>No rules yet — edit this model to add rules.</div>
          ) : (
            <div className="model-rules-grid">
              {dm.items.map((rule, i) => (
                <div
                  key={i}
                  onClick={() => setCheckedRules(prev => { const n = [...prev]; n[i] = !n[i]; return n; })}
                  style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "10px 8px", borderBottom: "1px solid var(--border-primary)", cursor: "pointer", userSelect: "none" }}
                >
                  <div style={{
                    width: 18, height: 18, borderRadius: 4, flexShrink: 0, marginTop: 2,
                    border: `1.5px solid ${checkedRules[i] ? "var(--green)" : "var(--border-primary)"}`,
                    background: checkedRules[i] ? "var(--green)" : "var(--bg-tertiary)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 11, color: "var(--bg-primary)", fontWeight: 700, transition: "all 0.15s",
                  }}>
                    {checkedRules[i] && "✓"}
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: checkedRules[i] ? "var(--text-tertiary)" : "var(--text-primary)", textDecoration: checkedRules[i] ? "line-through" : "none", transition: "all 0.15s" }}>{rule.label}</div>
                    {rule.sub && <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{rule.sub}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </TCard>

        {modalJsx}
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "0 16px 40px" }}>
      <PageBanner label="MODELS" title="Your Strategies" subtitle="Build and track your trading models." />

      {/* Section header row — matches Accounts page pattern */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Your Models</div>
        <button
          onClick={openCreate}
          style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 6, padding: "5px 12px", cursor: "pointer", letterSpacing: "0.05em" }}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New Model
        </button>
      </div>

      {models.length === 0 ? (
        <TCard style={{ textAlign: "center", padding: "56px 24px" }}>
          <div style={{ marginBottom: 16, opacity: 0.25 }}>
            <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round" style={{ color: "var(--text-tertiary)" }}><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>No models yet</div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginBottom: 28, maxWidth: 320, margin: "0 auto 28px" }}>Define your trading strategies, add rules, and track performance per model.</div>
          <button onClick={openCreate} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: "var(--accent)", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.25)", borderRadius: 6, padding: "7px 16px", cursor: "pointer", letterSpacing: "0.05em" }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Create Your First Model
          </button>
        </TCard>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(360px, 1fr))", gap: 16 }}>
          {models.map(m => {
            const s = modelStats[m.name] ?? { count: 0, wins: 0, losses: 0, winRate: null, pnl: 0, avgWin: 0, avgLoss: 0, bestAsset: "—" };
            const wr = s.winRate;
            const wrc = wrColor(wr);
            return (
              <TCard key={m.id} style={{ padding: "20px 22px", cursor: "pointer" }} onClick={() => setSelectedModelId(m.id)}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 12 }}>
                  <PhotoCircle url={m.photo_url} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                      <div style={{ fontSize: 15, fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{m.name}</div>
                      <div style={{ display: "flex", gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(m)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, border: "1px solid rgba(34,211,238,0.25)", background: "var(--accent-dim)", color: "var(--accent)", cursor: "pointer", letterSpacing: "0.04em" }}>Edit</button>
                        {confirmDelete === m.id
                          ? <button onClick={() => handleDelete(m.id)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 4, border: "1px solid var(--red)", background: "rgba(251,113,133,0.12)", color: "var(--red)", cursor: "pointer" }}>Confirm</button>
                          : <button onClick={() => setConfirmDelete(m.id)} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "3px 8px", borderRadius: 4, border: "1px solid var(--border-primary)", background: "transparent", color: "var(--text-tertiary)", cursor: "pointer" }}>✕</button>
                        }
                      </div>
                    </div>
                    {m.description && (
                      <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{m.description}</div>
                    )}
                    <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 5, fontWeight: 600 }}>
                      {(m.items?.length ?? 0)} rule{(m.items?.length ?? 0) !== 1 ? "s" : ""} · {s.count} trade{s.count !== 1 ? "s" : ""}
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ borderTop: "1px solid var(--border-primary)", paddingTop: 12 }}>
                  {s.count === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-tertiary)", fontStyle: "italic" }}>No tagged trades yet — select this model when logging trades.</div>
                  ) : (
                    <>
                      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 10 }}>
                        <div style={{ textAlign: "center", minWidth: 48 }}>
                          <div style={{ fontSize: 20, fontWeight: 800, color: wrc, lineHeight: 1 }}>{wr !== null ? `${wr}%` : "—"}</div>
                          <div style={{ fontSize: 9, color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 2 }}>Win Rate</div>
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ height: 5, borderRadius: 3, background: "var(--bg-tertiary)", overflow: "hidden" }}>
                            {wr !== null && <div style={{ height: "100%", width: `${wr}%`, background: wrc, borderRadius: 3 }} />}
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 10, color: "var(--text-tertiary)" }}>
                            <span>{s.wins}W / {s.losses}L</span>
                            <span style={{ color: s.pnl >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{privacyMode ? "••••" : `${s.pnl >= 0 ? "+" : ""}$${s.pnl.toFixed(0)}`}</span>
                          </div>
                        </div>
                      </div>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6 }}>
                        {[
                          { label: "Avg Win", value: s.avgWin > 0 ? (privacyMode ? "••••" : `+$${s.avgWin.toFixed(0)}`) : "—", color: "var(--green)" },
                          { label: "Avg Loss", value: s.avgLoss < 0 ? (privacyMode ? "••••" : `-$${Math.abs(s.avgLoss).toFixed(0)}`) : "—", color: "var(--red)" },
                          { label: "Best Asset", value: s.bestAsset, color: "var(--text-primary)" },
                        ].map(({ label, value, color }) => (
                          <div key={label} style={{ background: "var(--bg-primary)", borderRadius: 5, padding: "7px 8px", textAlign: "center" }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color }}>{value}</div>
                            <div style={{ fontSize: 9, color: "var(--text-tertiary)", marginTop: 2, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>{label}</div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </TCard>
            );
          })}
        </div>
      )}

      {modalJsx}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW — Home page with live stats, mood, drawdown, export
// ═══════════════════════════════════════════════════════════════════════════

function ProgressBar({ pct, color, height = 8 }) {
  const glowColor = color === "var(--green)" ? "rgba(52,211,153,0.35)"
    : color === "var(--red)" ? "rgba(251,113,133,0.3)"
    : color === "var(--gold)" ? "rgba(251,191,36,0.3)"
    : "rgba(34,211,238,0.25)";
  return (
    <div style={{ background: "var(--bg-tertiary)", borderRadius: 5, height, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
      <div style={{ height: "100%", borderRadius: 5, background: color, width: `${Math.min(100, Math.max(0, pct))}%`, transition: "width 0.5s", boxShadow: pct > 0 ? `0 0 8px ${glowColor}` : "none" }} />
    </div>
  );
}


export function DashboardView({ supabase, user, trades, tradesLoading, displayName, privacyMode, onNavigate, justCompletedOnboarding = false }) {
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at").then(({ data }) => { if (data) setAccounts(data); });
  }, [user]);

  // Today
  const tk = todayKey();
  const todayTrades = trades.filter((t) => t.dt && dateKey(t.dt) === tk);
  const todayPnl = todayTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  const todayTaken = todayTrades.filter((t) => t.taken && t.taken !== "Missed").length;

  // Week
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay() + 1); weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 5);
  const weekTrades = trades.filter((t) => { if (!t.dt) return false; const d = new Date(t.dt); return d >= weekStart && d < weekEnd; });
  const weekPnl = weekTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  const weekDays = [];
  for (let i = 0; i < 5; i++) {
    const d = new Date(weekStart); d.setDate(weekStart.getDate() + i);
    const k = dateKey(d);
    const dayTrades = trades.filter((t) => t.dt && dateKey(t.dt) === k);
    const pnl = dayTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    weekDays.push({ label: ["Mon", "Tue", "Wed", "Thu", "Fri"][i], pnl, count: dayTrades.length, isToday: dateKey(d) === tk });
  }

  // Streaks
  const { greenStreak } = calcStreaks(trades);

  // Drawdown alerts
  const activeAccounts = accounts.filter((a) => ["active", "funded_active"].includes(a.status));
  const alerts = [];
  activeAccounts.forEach((acc) => {
    if (acc.max_drawdown && acc.current_pnl != null) {
      const pnl = Number(acc.current_pnl);
      const dd = Number(acc.max_drawdown);
      const used = Math.abs(Math.min(0, pnl));
      const pct = used / dd;
      if (pct >= DRAWDOWN_DANGER) alerts.push({ acc, level: "danger", pct, msg: `${acc.account_name || acc.firm} at ${Math.round(pct * 100)}% drawdown` });
      else if (pct >= DRAWDOWN_WARNING) alerts.push({ acc, level: "warning", pct, msg: `${acc.account_name || acc.firm} at ${Math.round(pct * 100)}% drawdown` });
    }
  });

  // Max bar height for week chart
  const maxPnl = Math.max(1, ...weekDays.map((d) => Math.abs(d.pnl)));


  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>

      {/* Drawdown Alerts — inline banners */}
      {alerts.map((a, i) => (
        <div key={i} style={{
          padding: "14px 20px", marginBottom: 12, borderRadius: 4,
          background: a.level === "danger" ? "rgba(239,68,68,0.1)" : "rgba(255,165,2,0.1)",
          border: `1px solid ${a.level === "danger" ? "var(--red)" : "var(--gold)"}`,
          display: "flex", alignItems: "center", gap: 12,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700,
          color: a.level === "danger" ? "var(--red)" : "var(--gold)",
          textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          {a.level === "danger" ? "⚠ DANGER" : "⚡ WARNING"}: {a.msg}
        </div>
      ))}

      {/* Drawdown Protocol — fixed bottom-right popup */}
      {(todayPnl < -300 || alerts.length > 0) && (
        <div className="drawdown-popup" style={{
          position: "fixed", bottom: 24, right: 24, zIndex: 300, width: 320,
          background: "rgba(12,10,20,0.85)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid rgba(251,113,133,0.15)", borderRadius: 8,
          boxShadow: "0 8px 40px rgba(0,0,0,0.4)",
          padding: "20px 22px",
          animation: "fadeSlideIn 0.4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", boxShadow: "none", animation: "hudPulse 2s infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.12em" }}>DRAWDOWN PROTOCOL</span>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, lineHeight: 2, color: "rgba(251,113,133,0.7)" }}>
            <div style={{ color: "#fb7185", fontWeight: 700 }}>1. A+ SETUPS ONLY</div>
            <div style={{ color: "#fb7185", fontWeight: 700 }}>2. STAY PATIENT — WAIT FOR IT</div>
            <div style={{ color: "#fb7185", fontWeight: 700 }}>3. REDUCE RISK — PROTECT CAPITAL</div>
          </div>
          <div style={{ marginTop: 14, padding: "10px 0 0", borderTop: "1px solid rgba(251,113,133,0.15)" }}>
            <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "rgba(251,113,133,0.5)", margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
              The best trade in drawdown is the one you don't take. Let the edge come to you.
            </p>
          </div>
        </div>
      )}

      {/* Welcome */}
      <div style={{ textAlign: "left", marginBottom: 20, padding: "8px 0" }}>
        <h1 className="welcome-title" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 32, fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", margin: 0 }}>
          {justCompletedOnboarding ? `Welcome, ${displayName || "Trader"}!` : `Welcome Back, ${displayName || "Trader"}`}
        </h1>
      </div>

      {/* First-time empty state — only show after trades have loaded */}
      {!tradesLoading && trades.length === 0 && (
        <TCard style={{ padding: "40px 32px", marginBottom: 24, textAlign: "center", border: "1px solid var(--border-primary)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 8 }}>
            Your journey starts here
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.7, maxWidth: 400, margin: "0 auto 24px" }}>
            Log your first trade to unlock your dashboard stats, equity curve, and performance insights.
          </div>
          <button
            onClick={() => onNavigate?.("journal")}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700,
              padding: "11px 28px", borderRadius: 6, cursor: "pointer",
              border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)",
              letterSpacing: "0.06em", textTransform: "uppercase",
            }}
          >+ Log Your First Trade</button>
        </TCard>
      )}

      {/* Today's Stats */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <TCard style={{ padding: "18px 20px", textAlign: "center", borderColor: todayPnl < 0 ? "rgba(239,68,68,0.3)" : undefined }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: todayPnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${todayPnl >= 0 ? "+" : ""}$${todayPnl.toFixed(0)}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Today's P&L</div>
        </TCard>
        <StatBox value={todayTaken} label="Trades Today" color="var(--text-secondary)" />
        <StatBox value={greenStreak} label="Green Streak" color="var(--gold)" />
        <TCard style={{ padding: "18px 20px", textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: weekPnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(0)}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Week P&L</div>
        </TCard>
      </div>

      {/* Week Progress */}
      <TCard style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          WEEK PROGRESS
        </div>
        <div className="grid-week" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, alignItems: "end", height: 120 }}>
          {weekDays.map((d) => {
            const h = maxPnl ? (Math.abs(d.pnl) / maxPnl) * 80 : 0;
            return (
              <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: d.pnl >= 0 ? "var(--green)" : "var(--red)", marginBottom: 6 }}>
                  {d.count > 0 ? (privacyMode ? MASK : `${d.pnl >= 0 ? "+" : ""}$${d.pnl.toFixed(0)}`) : "—"}
                </div>
                <div style={{
                  width: "100%", maxWidth: 56, height: Math.max(4, h), borderRadius: 4,
                  background: d.count === 0 ? "var(--bg-tertiary)" : d.pnl >= 0 ? "var(--green)" : "var(--red)",
                  opacity: d.count === 0 ? 0.3 : 0.85, transition: "height 0.3s",
                  border: d.isToday ? "2px solid var(--accent)" : "none",
                  boxShadow: d.count > 0 ? `0 0 10px ${d.pnl >= 0 ? "rgba(52,211,153,0.4)" : "rgba(251,113,133,0.35)"}` : "none",
                }} />
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: d.isToday ? "var(--accent)" : "var(--text-tertiary)", marginTop: 6, fontWeight: d.isToday ? 700 : 500 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </TCard>

      {/* Economic Calendar */}
      <EconomicCalendarView />

      {/* News Command Center */}
      <NewsView />

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NEWS VIEW — Forex Factory calendar + Live news streams
// ═══════════════════════════════════════════════════════════════════════════

const LIVE_CHANNELS = [
  { key: "bloomberg", label: "Bloomberg", src: "https://www.youtube.com/embed/iEpJwprxDdk?si=j3ag1XXE9FLfDCfi&autoplay=1&mute=1" },
  { key: "aljazeera", label: "Al Jazeera", src: "https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&mute=1" },
  { key: "euronews", label: "EuroNews", src: "https://www.youtube.com/embed/pykpO5kQJ98?autoplay=1&mute=1" },
  { key: "skynews", label: "Sky News", src: "https://www.youtube.com/embed/YDvsBbKfLPA?autoplay=1&mute=1" },
];


function timeAgo(unixTs) {
  const diff = Math.floor(Date.now() / 1000) - unixTs;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function NewsView() {
  const [channel, setChannel] = useState("bloomberg");
  const [newsItems, setNewsItems] = useState([]);
  const [newsLoading, setNewsLoading] = useState(true);
  const [newsError, setNewsError] = useState(null);

  const activeSrc = LIVE_CHANNELS.find((c) => c.key === channel)?.src || LIVE_CHANNELS[0].src;

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("/api/news?category=general");
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        setNewsItems(data.slice(0, 20));
        setNewsError(null);
      } catch (e) {
        setNewsError(e.message);
      } finally {
        setNewsLoading(false);
      }
    };
    fetchNews();
    const interval = setInterval(fetchNews, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>

      {/* Motivational Quotes Bar */}
      <div style={{ marginTop: 24 }}>
        <MotivationalQuotesBar />
      </div>

      {/* Live News Stream */}
      <TCard style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border-primary)",
          display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#ef4444", animation: "hudPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              LIVE NEWS
            </span>
          </div>
          <div className="news-channels" style={{ display: "flex", gap: 4 }}>
            {LIVE_CHANNELS.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setChannel(ch.key)}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: channel === ch.key ? 700 : 500,
                  padding: "6px 12px", border: "none", borderRadius: 3, cursor: "pointer",
                  background: channel === ch.key ? "var(--accent-glow-strong)" : "var(--bg-tertiary)",
                  color: channel === ch.key ? "var(--accent)" : "var(--text-tertiary)",
                  textTransform: "uppercase", letterSpacing: "0.05em", transition: "all 0.2s",
                }}
              >
                {ch.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ position: "relative", paddingBottom: "56.25%", height: 0 }}>
          <iframe
            key={channel}
            src={activeSrc}
            title="Live News"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
            style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
          />
        </div>
      </TCard>

      {/* Finnhub Market News Feed */}
      <TCard style={{ padding: 0, overflow: "hidden", marginBottom: 20 }}>
        <div style={{
          padding: "12px 20px", borderBottom: "1px solid var(--border-primary)",
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#22d3ee", animation: "hudPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              MARKET NEWS
            </span>
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            via Finnhub · updates every 60s
          </span>
        </div>
        <div style={{ maxHeight: 480, overflowY: "auto" }}>
          {newsLoading && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--text-tertiary)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
              Loading news...
            </div>
          )}
          {newsError && (
            <div style={{ padding: "32px 20px", textAlign: "center", color: "var(--red)", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13 }}>
              Failed to load news: {newsError}
            </div>
          )}
          {!newsLoading && !newsError && newsItems.map((item) => (
            <a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "flex", gap: 14, padding: "14px 20px",
                borderBottom: "1px solid var(--border-primary)",
                textDecoration: "none", transition: "background 0.15s",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "var(--bg-tertiary)"}
              onMouseLeave={e => e.currentTarget.style.background = "transparent"}
            >
              {item.image && (
                <img
                  src={item.image}
                  alt=""
                  onError={e => { e.currentTarget.style.display = "none"; }}
                  style={{ width: 72, height: 52, objectFit: "cover", borderRadius: 4, flexShrink: 0, opacity: 0.9 }}
                />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
                  color: "var(--text-primary)", lineHeight: 1.4, marginBottom: 6,
                  overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
                }}>
                  {item.headline}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700,
                    textTransform: "uppercase", letterSpacing: "0.06em",
                    color: "var(--accent)", background: "var(--accent-glow-strong)",
                    padding: "2px 7px", borderRadius: 3,
                  }}>
                    {item.source}
                  </span>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>
                    {timeAgo(item.datetime)}
                  </span>
                </div>
              </div>
            </a>
          ))}
        </div>
      </TCard>

    </div>
  );
}

// ─── ECONOMIC CALENDAR VIEW ──────────────────────────────────────────────────

const TIMEZONE_OPTIONS = [
  { label: "ET (New York)", value: "America/New_York" },
  { label: "CT (Chicago)", value: "America/Chicago" },
  { label: "MT (Denver)", value: "America/Denver" },
  { label: "PT (Los Angeles)", value: "America/Los_Angeles" },
  { label: "GMT (London)", value: "Europe/London" },
  { label: "CET (Frankfurt)", value: "Europe/Berlin" },
  { label: "SGT (Singapore)", value: "Asia/Singapore" },
  { label: "BKK (Bangkok)", value: "Asia/Bangkok" },
  { label: "HKT (Hong Kong)", value: "Asia/Hong_Kong" },
  { label: "JST (Tokyo)", value: "Asia/Tokyo" },
  { label: "AEST (Sydney)", value: "Australia/Sydney" },
];

export function EconomicCalendarView() {
  const [now, setNow] = useState(new Date());
  const displayTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const [alertsEnabled, setAlertsEnabled] = useState(
    () => { try { return localStorage.getItem("newsAlertsEnabled") === "true"; } catch { return false; } }
  );
  const [notifPermission, setNotifPermission] = useState(
    () => (typeof Notification !== "undefined" ? Notification.permission : "unsupported")
  );
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(id);
  }, []);

  const todayET = getTodayET(now);
  const nextHighEvent = getNextHighImpactEvent(now);
  const minsUntilNext = nextHighEvent ? getMinutesUntil(nextHighEvent, now) : null;

  // Week navigation — compute the reference date for the displayed week
  const displayWeekRef = new Date(now);
  displayWeekRef.setDate(displayWeekRef.getDate() + weekOffset * 7);
  const displayWeekDays = getEventsForWeek(displayWeekRef);
  const displayWeekEvents = displayWeekDays.flatMap((d) => d.events.map((e) => ({ ...e, _dateStr: d.dateStr })));
  const weekStart = displayWeekDays[0]?.dateStr;
  const weekEnd = displayWeekDays[4]?.dateStr;
  const fmtWeekDate = (str) => str ? new Date(`${str}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";

  // Day status
  const todayEvents = getEventsForToday(now);
  const todayHigh = todayEvents.filter((e) => e.impact === "high" && e.time !== "allday");
  const todayMedium = todayEvents.filter((e) => e.impact === "medium" && e.time !== "allday");
  const hasHighToday = todayHigh.length > 0;
  const hasMediumToday = todayMedium.length > 0;
  const imminent = minsUntilNext !== null && minsUntilNext >= -10 && minsUntilNext <= 30;

  async function handleEnableAlerts() {
    if (alertsEnabled) {
      setAlertsEnabled(false);
      try { localStorage.setItem("newsAlertsEnabled", "false"); } catch {}
      return;
    }
    const perm = await requestNotificationPermission();
    setNotifPermission(perm);
    if (perm === "granted" || perm === "denied") {
      setAlertsEnabled(perm === "granted");
      try { localStorage.setItem("newsAlertsEnabled", perm === "granted" ? "true" : "false"); } catch {}
    }
  }

  // Status shield config
  const statusConfig = imminent
    ? { label: "NEWS IMMINENT", title: "STAND ASIDE", color: "#fb7185", bg: "rgba(251,113,133,0.08)", pulse: true }
    : hasHighToday
    ? { label: "NEWS DAY", title: "HIGH IMPACT TODAY", color: "#fb7185", bg: "rgba(251,113,133,0.06)", pulse: false }
    : hasMediumToday
    ? { label: "CAUTION", title: "ELEVATED VOLATILITY", color: "#fbbf24", bg: "rgba(251,191,36,0.06)", pulse: false }
    : { label: "ALL CLEAR", title: "CLEAR TO TRADE", color: "#34d399", bg: "rgba(52,211,153,0.06)", pulse: false };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>

      {/* Economic Calendar — combined status + events card */}
      <TCard style={{ padding: 0, overflow: "hidden", border: `1px solid ${statusConfig.color}33` }}>

        {/* Header: status left, controls + week nav right */}
        <div style={{
          padding: "16px 20px",
          background: statusConfig.bg,
          borderBottom: `1px solid ${statusConfig.color}22`,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          flexWrap: "wrap", gap: 12,
          position: "relative", overflow: "hidden",
        }}>
          {/* Radial glow */}
          <div style={{
            position: "absolute", right: -40, top: "50%", transform: "translateY(-50%)",
            width: 180, height: 180, borderRadius: "50%",
            background: `radial-gradient(circle, ${statusConfig.color}18 0%, transparent 70%)`,
            pointerEvents: "none",
          }} />

          {/* Status + calendar title */}
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            {/* Dot */}
            <div style={{ position: "relative", flexShrink: 0 }}>
              {statusConfig.pulse && (
                <div style={{
                  position: "absolute", inset: -4, borderRadius: "50%",
                  background: `${statusConfig.color}30`,
                  animation: "hudPulse 1.5s ease-in-out infinite",
                }} />
              )}
              <div style={{
                width: 10, height: 10, borderRadius: "50%",
                background: statusConfig.color,
                boxShadow: `0 0 8px ${statusConfig.color}`,
                animation: statusConfig.pulse ? "hudPulse 1.5s ease-in-out infinite" : "none",
              }} />
            </div>
            {/* Text */}
            <div>
              <div>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                  color: statusConfig.color, textTransform: "uppercase", letterSpacing: "0.12em",
                }}>
                  {statusConfig.label}
                </span>
              </div>
              {nextHighEvent && minsUntilNext !== null ? (
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 500,
                  color: "var(--text-tertiary)", marginTop: 2,
                }}>
                  <span style={{ color: "var(--text-secondary)", fontWeight: 600 }}>Economic Calendar</span>
                  {" · "}
                  {imminent
                    ? `${nextHighEvent.name} — ${minsUntilNext > 0 ? `in ${minsUntilNext}m` : `${Math.abs(minsUntilNext)}m ago`} · ${formatEventTime(nextHighEvent, displayTZ)}`
                    : `Next high-impact: ${nextHighEvent.name} · ${formatEventTime(nextHighEvent, displayTZ)}`}
                </div>
              ) : (
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11,
                  color: "var(--text-tertiary)", marginTop: 2,
                }}>
                  Economic Calendar
                </div>
              )}
            </div>
          </div>

          {/* Right controls: week nav + tz + alerts */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            {/* Week navigator */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <button
                onClick={() => setWeekOffset((w) => w - 1)}
                style={{
                  background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                  borderRadius: 4, cursor: "pointer", color: "var(--text-secondary)",
                  fontSize: 14, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >‹</button>
              <div style={{ textAlign: "center", minWidth: 80 }}>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700,
                  color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  {weekOffset === 0 ? "This Week" : weekOffset === 1 ? "Next Week" : weekOffset === -1 ? "Last Week" : weekOffset > 0 ? `+${weekOffset}w` : `${weekOffset}w`}
                </div>
                <div style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)", marginTop: 1,
                }}>
                  {fmtWeekDate(weekStart)} – {fmtWeekDate(weekEnd)}
                </div>
              </div>
              <button
                onClick={() => setWeekOffset((w) => w + 1)}
                style={{
                  background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                  borderRadius: 4, cursor: "pointer", color: "var(--text-secondary)",
                  fontSize: 14, width: 26, height: 26, display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
              >›</button>
            </div>
            {/* Divider */}
            <div style={{ width: 1, height: 20, background: "var(--border-primary)" }} />
            {/* Alerts icon button */}
            <button
              onClick={handleEnableAlerts}
              title={alertsEnabled ? "Alerts on — click to disable" : "Enable news alerts"}
              style={{
                width: 30, height: 30, borderRadius: 5, cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                border: alertsEnabled ? "1px solid #34d399" : "1px solid var(--border-primary)",
                background: alertsEnabled ? "rgba(52,211,153,0.1)" : "transparent",
                color: alertsEnabled ? "#34d399" : "var(--text-tertiary)",
                transition: "all 0.2s", fontSize: 15,
              }}
            >
              {alertsEnabled ? (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6V11c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              ) : (
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
              )}
            </button>
          </div>
        </div>
        <div>
          {displayWeekEvents.length === 0 ? (
            <div style={{
              padding: "28px 20px", textAlign: "center",
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13,
              color: "var(--text-tertiary)",
            }}>
              No events this week
            </div>
          ) : (
            displayWeekDays.map((day) => {
              const dayEvents = day.events;
              if (dayEvents.length === 0) return null;
              const dayDate = new Date(`${day.dateStr}T12:00:00`);
              const isToday = day.dateStr === todayET;
              const isDayPast = day.dateStr < todayET;
              const weekday = dayDate.toLocaleDateString("en-US", { weekday: "long" });
              const dateLabel = dayDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
              return (
                <div key={day.dateStr} style={{ opacity: isDayPast ? 0.4 : 1 }}>
                  {/* Day header */}
                  <div style={{
                    padding: "8px 20px", background: isToday ? "rgba(34,211,238,0.05)" : "var(--bg-tertiary)",
                    borderBottom: "1px solid var(--border-primary)",
                    display: "flex", alignItems: "center", gap: 8,
                  }}>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                      color: isToday ? "var(--accent)" : "var(--text-secondary)",
                      textTransform: "uppercase", letterSpacing: "0.08em",
                    }}>
                      {weekday}
                    </span>
                    <span style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11,
                      color: "var(--text-tertiary)",
                    }}>
                      {dateLabel}
                    </span>
                    {isToday && (
                      <span style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700,
                        padding: "1px 6px", borderRadius: 3,
                        background: "var(--accent-glow-strong)", color: "var(--accent)",
                        textTransform: "uppercase", letterSpacing: "0.08em",
                      }}>TODAY</span>
                    )}
                  </div>
                  {/* Events for this day */}
                  {dayEvents.map((event, idx) => {
                    const isHigh = event.impact === "high";
                    const color = isHigh ? "#fb7185" : "#fbbf24";
                    const mins = getMinutesUntil(event, now);
                    const isImminent = mins !== null && mins >= -10 && mins <= 30;
                    const isPast = isToday && event.time !== "allday" && mins !== null && mins < -10;
                    return (
                      <div
                        key={idx}
                        style={{
                          display: "flex", alignItems: "center", gap: 14,
                          padding: "11px 20px", borderBottom: "1px solid var(--border-primary)",
                          transition: "background 0.15s",
                          background: isImminent ? "rgba(251,113,133,0.04)" : "transparent",
                          opacity: isPast ? 0.4 : 1,
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-tertiary)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = isImminent ? "rgba(251,113,133,0.04)" : "transparent"}
                      >
                        <div style={{
                          width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0,
                          animation: isImminent ? "hudPulse 1.5s infinite" : "none",
                        }} />
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600,
                          color: "var(--text-secondary)", width: 100, flexShrink: 0,
                        }}>
                          {event.time === "allday" ? "All Day" : formatEventTime(event, displayTZ)}
                        </div>
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600,
                          color: "var(--text-primary)", flex: 1,
                        }}>
                          {event.name}
                        </div>
                        <div style={{
                          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700,
                          padding: "2px 8px", borderRadius: 3,
                          background: `${color}15`, color,
                          textTransform: "uppercase", letterSpacing: "0.05em", flexShrink: 0,
                        }}>
                          {isHigh ? "HIGH" : "MED"}
                        </div>
                        {isImminent && (
                          <div style={{
                            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700,
                            color: "#fb7185", flexShrink: 0,
                          }}>
                            {mins > 0 ? `in ${mins}m` : `${Math.abs(mins)}m ago`}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </TCard>
    </div>
  );
}

// ─── WATCHLIST VIEW ─────────────────────────────────────────────────────────

const WATCHLIST_TFS = ["Weekly", "Daily", "4HR", "1HR", "30m", "15m", "5m", "3m"];
const WATCHLIST_STATUSES = [
  { value: "watching", label: "Watching", color: "var(--accent-secondary)" },
  { value: "triggered", label: "Triggered", color: "var(--gold)" },
  { value: "taken", label: "Taken", color: "var(--green)" },
  { value: "invalidated", label: "Invalidated", color: "var(--red)" },
];

export function WatchlistView({ supabase, user }) {
  const [ideas, setIdeas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [filter, setFilter] = useState("active");
  const [form, setForm] = useState({
    asset: "$NQ", direction: "Long", timeframe: "1HR", key_level: "",
    reasoning: "", chart_link: "", confidence: 2, status: "watching",
  });

  const loadIdeas = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("watchlist").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setIdeas(data);
  }, [user, supabase]);

  useEffect(() => { loadIdeas(); }, [loadIdeas]);

  const resetForm = () => {
    setForm({ asset: "$NQ", direction: "Long", timeframe: "1HR", key_level: "", reasoning: "", chart_link: "", confidence: 2, status: "watching" });
    setShowForm(false);
    setEditingId(null);
  };

  const saveIdea = async () => {
    if (!form.reasoning.trim()) return;
    const payload = { ...form, user_id: user.id };
    if (editingId) {
      await supabase.from("watchlist").update(payload).eq("id", editingId);
    } else {
      await supabase.from("watchlist").insert(payload);
    }
    resetForm();
    loadIdeas();
  };

  const deleteIdea = async (id) => {
    await supabase.from("watchlist").delete().eq("id", id);
    loadIdeas();
  };

  const startEdit = (idea) => {
    setForm({
      asset: idea.asset, direction: idea.direction, timeframe: idea.timeframe,
      key_level: idea.key_level || "", reasoning: idea.reasoning || "",
      chart_link: idea.chart_link || "", confidence: idea.confidence || 2, status: idea.status,
    });
    setEditingId(idea.id);
    setShowForm(true);
  };

  const updateStatus = async (id, status) => {
    await supabase.from("watchlist").update({ status }).eq("id", id);
    loadIdeas();
  };

  const filtered = ideas.filter((i) => {
    if (filter === "active") return i.status === "watching" || i.status === "triggered";
    if (filter === "taken") return i.status === "taken";
    if (filter === "invalidated") return i.status === "invalidated";
    return true;
  });

  const inputStyle = {
    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, padding: "10px 12px",
    background: "var(--bg-input)", border: "1px solid var(--border-primary)",
    color: "var(--text-primary)", borderRadius: 4, outline: "none", width: "100%", boxSizing: "border-box",
  };

  const statusColor = (s) => WATCHLIST_STATUSES.find((ws) => ws.value === s)?.color || "var(--text-tertiary)";

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="WATCHLIST"
        title="Patience is a position. Stalk your setups."
        subtitle="Log trade ideas, mark key levels, and wait for the market to come to you."
      />
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            WATCHLIST
          </h2>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", margin: "4px 0 0", letterSpacing: "0.05em" }}>
            {ideas.filter((i) => i.status === "watching" || i.status === "triggered").length} active ideas
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, padding: "5px 12px",
            borderRadius: 6, cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.15s", whiteSpace: "nowrap",
            border: showForm ? "1px solid rgba(34,211,238,0.25)" : "1px solid rgba(34,211,238,0.25)",
            background: "var(--accent-dim)", color: showForm ? "var(--text-secondary)" : "var(--accent)",
          }}
        >
          {showForm
            ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</>
            : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> New Idea</>
          }
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <TCard style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {editingId ? "EDIT IDEA" : "NEW TRADE IDEA"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Asset</label>
              <input style={inputStyle} placeholder="$NQ, $BTC, etc." value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
            </div>
            <div>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Direction</label>
              <select style={inputStyle} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Timeframe</label>
              <select style={inputStyle} value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>
                {WATCHLIST_TFS.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confidence</label>
              <div style={{ display: "flex", gap: 4, paddingTop: 8 }}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, confidence: n })}
                    style={{
                      width: 32, height: 32, borderRadius: 4, border: "1px solid var(--border-primary)",
                      background: form.confidence >= n ? "var(--accent-glow-strong)" : "var(--bg-tertiary)",
                      color: form.confidence >= n ? "var(--accent)" : "var(--text-tertiary)",
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700,
                      cursor: "pointer", transition: "all 0.2s",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Key Level / Zone</label>
            <input style={inputStyle} placeholder="e.g. 19,850 - 19,900 (4HR FVG)" value={form.key_level} onChange={(e) => setForm({ ...form, key_level: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Reasoning</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="Why are you watching this? SMT forming, PSP, key level reaction..." value={form.reasoning} onChange={(e) => setForm({ ...form, reasoning: e.target.value })} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Chart Link</label>
            <input style={inputStyle} placeholder="TradingView screenshot link" value={form.chart_link} onChange={(e) => setForm({ ...form, chart_link: e.target.value })} />
          </div>
          <button onClick={saveIdea} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", padding: 13, fontSize: 13, fontWeight: 700,
            border: "1px solid var(--accent)", borderRadius: 4, cursor: "pointer",
            background: "var(--accent-glow-strong)", color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.1em",
          }}>
            {editingId ? "UPDATE IDEA" : "SAVE IDEA"}
          </button>
        </TCard>
      )}

      {/* Filter Tabs */}
      <div style={{ display: "flex", gap: 4, marginBottom: 16 }}>
        {[
          { key: "active", label: "Active" },
          { key: "taken", label: "Taken" },
          { key: "invalidated", label: "Invalidated" },
          { key: "all", label: "All" },
        ].map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: filter === f.key ? 700 : 500,
              padding: "6px 14px", border: "none", borderRadius: 3, cursor: "pointer",
              background: filter === f.key ? "var(--accent-glow-strong)" : "var(--bg-tertiary)",
              color: filter === f.key ? "var(--accent)" : "var(--text-tertiary)",
              textTransform: "uppercase", letterSpacing: "0.05em", transition: "all 0.2s",
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Ideas List */}
      {filtered.length === 0 && (
        <TCard style={{ padding: 40, textAlign: "center" }}>
          <p style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>
            {filter === "active" ? "No active trade ideas. Add one above." : "No ideas in this category."}
          </p>
        </TCard>
      )}

      {filtered.map((idea) => (
        <TCard key={idea.id} style={{ marginBottom: 12, padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "14px 18px" }}>
            {/* Top row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {idea.asset}
                </span>
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: "3px 8px",
                  borderRadius: 3, textTransform: "uppercase",
                  background: idea.direction === "Long" ? "rgba(34,211,238,0.15)" : "rgba(251,113,133,0.15)",
                  color: idea.direction === "Long" ? "var(--green)" : "var(--red)",
                }}>
                  {idea.direction}
                </span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)" }}>
                  {idea.timeframe}
                </span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--gold)" }}>
                  {"★".repeat(idea.confidence || 1)}{"☆".repeat(3 - (idea.confidence || 1))}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {idea.status === "watching" && (
                  <button onClick={() => updateStatus(idea.id, "triggered")} style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                    border: "1px solid var(--gold)", borderRadius: 3, cursor: "pointer",
                    background: "transparent", color: "var(--gold)", textTransform: "uppercase",
                  }}>TRIGGER</button>
                )}
                {(idea.status === "watching" || idea.status === "triggered") && (
                  <>
                    <button onClick={() => updateStatus(idea.id, "taken")} style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                      border: "1px solid var(--green)", borderRadius: 3, cursor: "pointer",
                      background: "transparent", color: "var(--green)", textTransform: "uppercase",
                    }}>TAKEN</button>
                    <button onClick={() => updateStatus(idea.id, "invalidated")} style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                      border: "1px solid var(--red)", borderRadius: 3, cursor: "pointer",
                      background: "transparent", color: "var(--red)", textTransform: "uppercase",
                    }}>INVALID</button>
                  </>
                )}
                {(idea.status === "taken" || idea.status === "invalidated") && (
                  <button onClick={() => updateStatus(idea.id, "watching")} style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                    border: "1px solid var(--accent-secondary)", borderRadius: 3, cursor: "pointer",
                    background: "transparent", color: "var(--accent-secondary)", textTransform: "uppercase",
                  }}>REACTIVATE</button>
                )}
                <span style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "4px 8px",
                  borderRadius: 3, textTransform: "uppercase",
                  background: `${statusColor(idea.status)}20`,
                  color: statusColor(idea.status),
                }}>
                  {idea.status}
                </span>
              </div>
            </div>

            {/* Key level */}
            {idea.key_level && (
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>LEVEL: </span>{idea.key_level}
              </div>
            )}

            {/* Reasoning */}
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
              {idea.reasoning}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border-secondary)" }}>
              <div style={{ display: "flex", gap: 10 }}>
                {safeUrl(idea.chart_link) && (
                  <a href={safeUrl(idea.chart_link)} target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--accent)", textDecoration: "none",
                  }}>VIEW CHART</a>
                )}
                <button onClick={() => startEdit(idea)} style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}>EDIT</button>
                <button onClick={() => deleteIdea(idea.id)} style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--red)",
                  background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.6,
                }}>DELETE</button>
              </div>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
                {idea.created_at ? new Date(idea.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
              </span>
            </div>
          </div>
        </TCard>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// EDUCATION VIEW — Learning library: videos, notes, screenshots
// ═══════════════════════════════════════════════════════════════════════════

const EDU_CATEGORIES = ["Trading Concepts", "Psychology", "Risk Management", "Setups", "Trade Reviews", "General"];
const EDU_STATUSES = [
  { value: "to_review", label: "To Review", color: "var(--gold)" },
  { value: "reviewed", label: "Reviewed", color: "var(--green)" },
  { value: "key_resource", label: "Key Resource", color: "var(--accent)" },
];

function getYouTubeId(url) {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "youtu.be") return u.pathname.slice(1).split("?")[0];
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return v;
      const parts = u.pathname.split("/");
      const embedIdx = parts.indexOf("embed");
      if (embedIdx !== -1) return parts[embedIdx + 1];
    }
  } catch {}
  return null;
}

function YTThumbnail({ url, title }) {
  const id = getYouTubeId(url);
  const [err, setErr] = useState(false);
  if (!id) return (
    <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--bg-tertiary)", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "6px 6px 0 0" }}>
      <span style={{ fontSize: 32, opacity: 0.3 }}>▶</span>
    </div>
  );
  const src = err
    ? `https://img.youtube.com/vi/${id}/hqdefault.jpg`
    : `https://img.youtube.com/vi/${id}/maxresdefault.jpg`;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", borderRadius: "6px 6px 0 0", overflow: "hidden", background: "#000" }}>
      <img
        src={src}
        alt={title}
        onError={() => setErr(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
      <div style={{
        position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
        background: "rgba(0,0,0,0.2)", transition: "background 0.2s",
      }}>
        <div style={{
          width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
        }}>
          <span style={{ fontSize: 16, color: "#fff", marginLeft: 2 }}>▶</span>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// NOTEBOOK VIEW
// ═══════════════════════════════════════════════════════════════════════════

const NOTEBOOK_SECTIONS = [
  { key: "recap", label: "TRADE RECAP", placeholder: "How did the session go? Did price do what you expected? Walk through what happened, trade by trade if needed." },
  { key: "eod_reflection", label: "EOD REFLECTION", placeholder: "What did you do well today? What needs work? Did you follow your rules? How's your mindset heading into tomorrow?" },
];

export function NotebookView({ supabase, user, trades }) {
  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [entry, setEntry] = useState({ recap: "", eod_reflection: "", mood: null, ai_summary: "" });
  const [savedEntry, setSavedEntry] = useState(null);
  const [entryDates, setEntryDates] = useState(new Set());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [showCal, setShowCal] = useState(false);
  const calRef = useRef(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiPeriod, setAiPeriod] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState({ bias: "", max_trades: "2", session_plan: "" });
  const [moodText, setMoodText] = useState("");

  // Load all entry dates for calendar dots
  useEffect(() => {
    if (!user) return;
    supabase.from("notebook_entries").select("entry_date").eq("user_id", user.id)
      .then(({ data }) => { if (data) setEntryDates(new Set(data.map(d => d.entry_date))); });
  }, [user]);

  // Load entry + plan for selected date
  useEffect(() => {
    if (!user) return;
    setEntry({ recap: "", eod_reflection: "", mood: null, ai_summary: "" });
    setPlan({ bias: "", max_trades: "2", session_plan: "" });
    setMoodText("");
    setAiOutput(""); setAiPeriod("");
    supabase.from("notebook_entries").select("*").eq("user_id", user.id).eq("entry_date", selectedDate).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setEntry({ recap: data.recap || "", eod_reflection: data.eod_reflection || "", mood: data.mood || null, ai_summary: data.ai_summary || "" });
          setSavedEntry(data);
          if (data.ai_summary) { setAiOutput(data.ai_summary); setAiPeriod("day"); }
        } else {
          setSavedEntry(null);
        }
      });
    supabase.from("trade_plans").select("*").eq("user_id", user.id).eq("plan_date", selectedDate).maybeSingle()
      .then(({ data }) => {
        if (data) setPlan({ bias: data.bias || "", max_trades: String(data.max_trades || 2), session_plan: data.session_plan || "" });
      });
    supabase.from("daily_moods").select("mood").eq("user_id", user.id).eq("mood_date", selectedDate).maybeSingle()
      .then(({ data }) => { if (data) setMoodText(data.mood || ""); });
  }, [user, selectedDate]);

  const saveAll = async () => {
    if (!user) return;
    setSaving(true);
    const saves = [
      supabase.from("trade_plans").upsert({
        user_id: user.id, plan_date: selectedDate,
        bias: plan.bias, max_trades: parseInt(plan.max_trades) || 2, session_plan: plan.session_plan,
      }, { onConflict: "user_id,plan_date" }),
      supabase.from("notebook_entries").upsert({
        user_id: user.id, entry_date: selectedDate,
        ...entry, updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,entry_date" }).then(({ data }) => {
        if (data) { setEntryDates(prev => new Set([...prev, selectedDate])); setSavedEntry(data); }
      }),
    ];
    if (moodText.trim()) {
      saves.push(supabase.from("daily_moods").upsert({ user_id: user.id, mood_date: selectedDate, mood: moodText.trim() }, { onConflict: "user_id,mood_date" }));
    }
    await Promise.all(saves);
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const save = useCallback(async (updates) => {
    if (!user) return;
    setSaving(true);
    const payload = { user_id: user.id, entry_date: selectedDate, ...entry, ...updates, updated_at: new Date().toISOString() };
    const { data } = await supabase.from("notebook_entries").upsert(payload, { onConflict: "user_id,entry_date" }).select().maybeSingle();
    if (data) {
      setSavedEntry(data);
      setEntryDates(prev => new Set([...prev, selectedDate]));
      setSaved(true);
      setTimeout(() => setSaved(false), 1500);
    }
    setSaving(false);
  }, [user, supabase, selectedDate, entry]);

  const handleBlur = (field, value) => {
    if (value !== (savedEntry?.[field] ?? "")) save({ [field]: value });
  };

  const setMood = (val) => {
    const newMood = entry.mood === val ? null : val;
    setEntry(e => ({ ...e, mood: newMood }));
    save({ mood: newMood });
  };

  // Calendar
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const calPrev = () => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y - 1); } else setCalMonth(m => m - 1); };
  const calNext = () => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y + 1); } else setCalMonth(m => m + 1); };

  const goDay = (dir) => {
    const d = new Date(selectedDate + "T12:00:00");
    d.setDate(d.getDate() + dir);
    const newDate = d.toISOString().slice(0, 10);
    setSelectedDate(newDate);
    setCalMonth(d.getMonth());
    setCalYear(d.getFullYear());
  };

  useEffect(() => {
    if (!showCal) return;
    const handler = (e) => { if (calRef.current && !calRef.current.contains(e.target)) setShowCal(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showCal]);

  const generateAI = async (period) => {
    setAiLoading(true); setAiOutput(""); setAiPeriod(period);

    const now = new Date();
    let startDate, label;
    if (period === "day") {
      startDate = selectedDate; label = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
    } else if (period === "week") {
      const d = new Date(now); d.setDate(now.getDate() - 6);
      startDate = d.toISOString().split("T")[0]; label = "this week";
    } else {
      startDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
      label = now.toLocaleString("default", { month: "long", year: "numeric" });
    }

    const { data: entries } = await supabase.from("notebook_entries").select("*").eq("user_id", user.id).gte("entry_date", startDate).order("entry_date");
    const { data: moodRows } = await supabase.from("daily_moods").select("mood_date, mood").eq("user_id", user.id).gte("mood_date", startDate);
    const moodByDate = Object.fromEntries((moodRows || []).map(r => [r.mood_date, r.mood]));
    const periodTrades = trades.filter(t => {
      if (!t.dt) return false;
      const tradeDate = new Date(t.dt).toISOString().split("T")[0];
      return tradeDate >= startDate;
    });

    const notebookText = (entries || []).map(e => {
      const mood = moodByDate[e.entry_date] || "(not set)";
      return `DATE: ${e.entry_date}\nMOOD (their words): "${mood}"\nRECAP: ${e.recap || "(blank)"}\nEOD REFLECTION: ${e.eod_reflection || "(blank)"}`;
    }).join("\n\n---\n\n");

    const tradeLines = periodTrades.map(t =>
      `${t.dt?.split("T")[0]} | ${t.asset} ${t.direction} | A+: ${t.aplus} | Taken: ${t.taken} | P&L: ${t.profit != null ? "$" + t.profit : "blank"} | Notes: ${t.notes || "none"}`
    ).join("\n");

    const taken = periodTrades.filter(t => t.taken && t.taken !== "Missed").length;
    const wins = periodTrades.filter(t => t.taken && t.taken !== "Missed" && parseFloat(t.profit) > 0).length;
    const pnl = periodTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const aplusTakenPeriod = periodTrades.filter(t => t.aplus?.startsWith("A+")).length;
    const bGradePeriod = periodTrades.filter(t => t.aplus?.startsWith("B")).length;
    const cGradePeriod = periodTrades.filter(t => t.aplus?.startsWith("C")).length;
    const fGradePeriod = periodTrades.filter(t => t.aplus?.startsWith("F")).length;

    const prompt = `${AI_COACH_TONE}

You are reviewing a futures trader's journal for ${label}. They trade an ICT-inspired fractal model across multiple instruments — NQ, ES, YM, GC, SI, Oil, and correlated pairs — primarily in the NY session, max 2 trades/day. The model applies to any instrument where the setup is valid; asset selection is not a concern.

SETUP GRADE DEFINITIONS (read these carefully before commenting on trade quality):
- "A+" = followed plan exactly, clean entry and management (${aplusTakenPeriod} this period)
- "B" = good setup, but execution had flaws — poor entry, early exit, etc. (${bGradePeriod} this period)
- "C" = marginal or forced setup — borderline/impulsive (${cGradePeriod} this period)
- "F" = no valid setup / broke a trading rule (${fGradePeriod} this period)
- "Missed" = seen but not taken

IMPORTANT: The trade data below is the ground truth. If trades are logged, they happened. Do not say the trader didn't trade if the log shows otherwise.

JOURNAL ENTRIES:
${notebookText || "(No entries for this period)"}

TRADE DATA: ${periodTrades.length} logged | ${taken} taken | ${wins} wins | Net P&L: $${pnl.toFixed(2)}
${tradeLines || "(No trades logged for this period)"}

Write a focused coaching summary (300–500 words). Be firm, data-driven, and practical. Do not soften repeated mistakes, but stay professional and measured.

1. Gameplan vs Reality — did they trade their plan? Use the trade log as evidence.
2. Self-awareness — are their EOD reflections honest and specific, or vague and defensive?
3. Inner dialogue — pay close attention to the exact words and phrases they use to describe their mood and mental state. What patterns show up? Quote their own language back to them.
4. Language vs outcome — does how they described their mindset before a session correlate with how they traded? Call out any recurring patterns.
5. Patterns across entries — habits, recurring mistakes, or genuine strengths worth reinforcing.
6. 2–3 specific, actionable focuses for the next session.

Quote their exact words where relevant. Be honest, be real, but keep it constructive.`;

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session ? { "Authorization": `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
      });
      if (!res.ok) throw new Error(`AI service error: ${res.status}`);
      const data = await res.json();
      if (data.error) { setAiOutput(data.error); setAiLoading(false); return; }
      const output = data.content?.map(c => c.text || "").join("") || "No response received.";
      const periodLabel = period === "day" ? "TODAY" : period === "week" ? "THIS WEEK" : "THIS MONTH";
      const timestamped = `[${periodLabel} · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}]\n\n${output}`;
      setAiOutput(output);
      save({ ai_summary: timestamped });
    } catch {
      setAiOutput("Failed to generate summary. Please try again.");
    } finally {
      setAiLoading(false);
    }
  };

  const selectedDateDisplay = new Date(selectedDate + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  const wordCount = (str) => str.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <style>{`
        @media (max-width: 768px) {
          .pretrade-grid { grid-template-columns: 1fr !important; }
          .ai-header { flex-direction: column !important; align-items: flex-start !important; }
          .ai-buttons { flex-wrap: wrap !important; }
          .nb-date-bar { flex-wrap: wrap !important; }
        }
      `}</style>
      <PageBanner label="NOTEBOOK" title="Write it down. Own the day." subtitle="Pre-market gameplan, trade recap, and EOD reflection — in one place. AI coached." />

      {/* ── Date Navigation Bar ── */}
      <div ref={calRef} style={{ position: "relative", marginBottom: 20 }}>
        <TCard style={{ padding: "12px 18px" }}>
          <div className="nb-date-bar" style={{ display: "flex", alignItems: "center", gap: 12 }}>
            {/* Prev / Next */}
            <button onClick={() => goDay(-1)} style={{ background: "none", border: "1px solid var(--border-primary)", borderRadius: 4, color: "var(--text-secondary)", cursor: "pointer", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            {/* Date display — click to toggle calendar */}
            <button onClick={() => setShowCal(v => !v)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", textAlign: "left", padding: 0 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{selectedDateDisplay}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", marginTop: 1 }}>
                {selectedDate === today ? "Today" : ""}{entryDates.has(selectedDate) ? (selectedDate === today ? " · " : "") + "Entry saved" : ""}
              </div>
            </button>
            <button onClick={() => goDay(1)} style={{ background: "none", border: "1px solid var(--border-primary)", borderRadius: 4, color: "var(--text-secondary)", cursor: "pointer", width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
            {/* Calendar toggle */}
            <button onClick={() => setShowCal(v => !v)} title="Open calendar" style={{
              background: showCal ? "var(--accent-dim)" : "none", border: `1px solid ${showCal ? "var(--accent)" : "var(--border-primary)"}`,
              borderRadius: 4, color: showCal ? "var(--accent)" : "var(--text-tertiary)", cursor: "pointer",
              width: 30, height: 30, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </button>
            {/* Jump to today */}
            {selectedDate !== today && (
              <button onClick={() => { setSelectedDate(today); setCalMonth(new Date().getMonth()); setCalYear(new Date().getFullYear()); }} style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.06em",
                padding: "5px 10px", borderRadius: 4, cursor: "pointer", border: "1px solid var(--accent)",
                background: "var(--accent-dim)", color: "var(--accent)", whiteSpace: "nowrap",
              }}>TODAY</button>
            )}
            {/* Entries count */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--accent)", lineHeight: 1 }}>{entryDates.size}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em", marginTop: 1 }}>entries</div>
            </div>
          </div>
        </TCard>

        {/* Calendar dropdown */}
        {showCal && (
          <div style={{
            position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 100,
            background: "var(--bg-primary)", border: "1px solid var(--border-primary)",
            borderRadius: 10, boxShadow: "0 12px 40px rgba(0,0,0,0.5)",
            padding: 0, overflow: "hidden", minWidth: 280,
          }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", borderBottom: "1px solid var(--border-primary)" }}>
              <button onClick={calPrev} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 4, display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
              </button>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)" }}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={calNext} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", padding: 4, display: "flex" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </button>
            </div>
            {/* Day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "10px 14px 4px" }}>
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", fontWeight: 600 }}>{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "4px 14px 14px", gap: 3 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const hasEntry = entryDates.has(dateStr);
                return (
                  <button key={d} onClick={() => { setSelectedDate(dateStr); setShowCal(false); }} style={{
                    position: "relative", width: "100%", aspectRatio: "1", borderRadius: 4,
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                    color: isSelected ? "var(--bg-primary)" : isToday ? "var(--accent)" : "var(--text-secondary)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11,
                    fontWeight: isSelected || isToday ? 700 : 400,
                    cursor: "pointer", display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 1, transition: "all 0.1s",
                  }}>
                    {d}
                    {hasEntry && !isSelected && <div style={{ width: 3, height: 3, borderRadius: "50%", background: "var(--accent)" }} />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Entry editor (full width) ── */}
      <div>
        {/* Pre-Trade Plan */}
        <TCard style={{ padding: 24, marginBottom: 16 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 16 }}>PRE-TRADE PLAN</div>
          <div className="pretrade-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Daily Bias">
              <select style={{ ...selectStyle, fontSize: 13 }} value={plan.bias} onChange={(e) => setPlan(p => ({ ...p, bias: e.target.value }))}>
                <option value="">Select...</option>
                <option>Bullish</option>
                <option>Bearish</option>
                <option>Neutral</option>
              </select>
            </Field>
            <Field label="Max Trades">
              <select style={{ ...selectStyle, fontSize: 13 }} value={plan.max_trades} onChange={(e) => setPlan(p => ({ ...p, max_trades: e.target.value }))}>
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
              </select>
            </Field>
          </div>
          <Field label="Session Plan">
            <textarea
              style={{ ...inputStyle, resize: "vertical", overflow: "auto", minHeight: 140, lineHeight: 1.75, fontSize: 14 }}
              placeholder="What's your plan for today's NY session? Setups, confluences, anything to avoid..."
              value={plan.session_plan}
              onChange={(e) => setPlan(p => ({ ...p, session_plan: e.target.value }))}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
            />
          </Field>
          <div style={{ marginTop: 14 }}>
            <Field label="How are you feeling?">
              <input
                type="text"
                style={{ ...inputStyle, fontSize: 13 }}
                placeholder="e.g. focused, tired, anxious, in the zone..."
                value={moodText}
                onChange={(e) => setMoodText(e.target.value)}
              />
            </Field>
          </div>
        </TCard>

        {/* Recap + EOD sections */}
        {NOTEBOOK_SECTIONS.map(({ key, label, placeholder }) => (
          <TCard key={key} style={{ padding: 24, marginBottom: 16 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 12 }}>{label}</div>
            <textarea
              value={entry[key]}
              onChange={(e) => setEntry(prev => ({ ...prev, [key]: e.target.value }))}
              onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              onBlur={(e) => handleBlur(key, e.target.value)}
              onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
              placeholder={placeholder}
              rows={6}
              style={{
                width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                borderRadius: 6, padding: "14px 16px", resize: "vertical", overflow: "auto",
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "var(--text-primary)",
                lineHeight: 1.8, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
              }}
            />
            <div style={{ textAlign: "right", marginTop: 6, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>
              {wordCount(entry[key])} words
            </div>
          </TCard>
        ))}

        {/* Save Entry */}
        <button onClick={saveAll} disabled={saving} style={{
          width: "100%", marginBottom: 16,
          fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700,
          padding: "14px", borderRadius: 6, cursor: saving ? "not-allowed" : "pointer",
          border: saved ? "1px solid var(--green)" : "1px solid var(--accent)",
          background: saved ? "rgba(5,150,105,0.08)" : "var(--accent-dim)",
          color: saved ? "var(--green)" : "var(--accent)",
          letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s",
          opacity: saving ? 0.7 : 1,
        }}>
          {saving ? "Saving..." : saved ? "✓ Entry Saved" : "Save Entry"}
        </button>

        {/* AI Coaching Summary */}
        <TCard style={{ padding: 24, border: "1px solid rgba(34,211,238,0.15)" }}>
          <div className="ai-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI COACHING SUMMARY</div>
            <div className="ai-buttons" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "rgba(5,150,105,0.12)", color: "var(--green)" }}>
                AI ENABLED
              </span>
              {["day", "week", "month"].map(p => (
                <button key={p} onClick={() => generateAI(p)} disabled={aiLoading} style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "6px 14px",
                  borderRadius: 4, cursor: aiLoading ? "not-allowed" : "pointer", letterSpacing: "0.05em", textTransform: "uppercase",
                  border: aiPeriod === p ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                  background: aiPeriod === p ? "var(--accent-dim)" : "var(--bg-tertiary)",
                  color: aiPeriod === p ? "var(--accent)" : "var(--text-secondary)",
                  transition: "all 0.15s", opacity: aiLoading ? 0.6 : 1,
                }}>{p === "day" ? "Today" : p === "week" ? "This Week" : "This Month"}</button>
              ))}
            </div>
          </div>
          {aiLoading && (
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)", padding: "24px 0", textAlign: "center" }}>
              Analyzing your entries...
            </div>
          )}
          {aiOutput && !aiLoading && (
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", padding: "16px 20px", background: "var(--bg-tertiary)", borderRadius: 6, border: "1px solid var(--border-primary)" }}>
              {aiOutput}
            </div>
          )}
          {!aiOutput && !aiLoading && (
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)", padding: "24px 0", textAlign: "center", lineHeight: 1.6 }}>
              Select Today, This Week, or This Month to get a coaching summary based on your journal entries and trade data.
            </div>
          )}
        </TCard>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// CHARTS VIEW — Lightweight candlestick chart for NQ1!
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// TRADE REPLAY VIEW (full-page sidebar feature)
// ═══════════════════════════════════════════════════════════════════════════

function ReplayChartPanel({ trade, privacyMode, prefs }) {
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const containerRef = useRef(null);
  const defaultInterval = trade.timeframe || "5m";
  const [activeInterval, setActiveInterval] = useState(
    REPLAY_INTERVALS.includes(defaultInterval.toUpperCase())
      ? defaultInterval.toUpperCase()
      : REPLAY_INTERVALS.find(i => i.toLowerCase() === defaultInterval.toLowerCase()) || "5m"
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [oldDataWarning, setOldDataWarning] = useState(false);

  const MASK = "••••";
  const pnl = trade.profit ?? trade.profit_funded;
  const risk = trade.risk ?? prefs?.default_risk;
  const rVal = pnl != null && risk ? (pnl / risk).toFixed(2) : null;
  const isWin = pnl > 0;

  const loadData = useCallback(async (intervalLabel) => {
    if (!seriesRef.current) return;
    setLoading(true);
    setError(null);
    setOldDataWarning(false);
    const ticker = assetToYahooSymbol(trade.asset);
    const apiInterval = REPLAY_INTERVAL_MAP[intervalLabel] || "5m";
    const rangeMap = { "1m": "1d", "5m": "5d", "15m": "1mo", "1h": "3mo", "4h": "6mo", "1d": "1y" };
    const range = rangeMap[apiInterval] || "5d";
    try {
      const res = await fetch(`/api/market-data?ticker=${encodeURIComponent(ticker)}&interval=${apiInterval}&range=${range}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (!data.candles?.length) throw new Error("No candle data returned. Check the asset symbol.");
      seriesRef.current.setData(data.candles);
      if (trade.entry_price != null) {
        seriesRef.current.createPriceLine({ price: trade.entry_price, color: "#34d399", lineWidth: 2, lineStyle: LineStyle.Solid, axisLabelVisible: true, title: "Entry" });
      }
      if (trade.stop_loss != null) {
        seriesRef.current.createPriceLine({ price: trade.stop_loss, color: "#ef4444", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "SL" });
      }
      if (trade.take_profit != null) {
        seriesRef.current.createPriceLine({ price: trade.take_profit, color: "#22c55e", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "TP" });
      }
      if (trade.exit_price != null && trade.exit_price !== trade.take_profit) {
        seriesRef.current.createPriceLine({ price: trade.exit_price, color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dashed, axisLabelVisible: true, title: "Exit" });
      }
      chartRef.current?.timeScale().fitContent();
      if (trade.dt && tradeAgeMs(trade) > 7 * 24 * 60 * 60 * 1000 && ["1m","5m"].includes(apiInterval)) {
        setOldDataWarning(true);
      }
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, [trade]);

  useEffect(() => {
    if (!containerRef.current) return;
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";
    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: 640,
      layout: {
        background: { color: isDark ? "#0b0d13" : "#ffffff" },
        textColor: isDark ? "#94a3b8" : "#374151",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" },
      timeScale: { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)", timeVisible: true, secondsVisible: false },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#d1d4dc", downColor: "#1e222d",
      borderUpColor: "#d1d4dc", borderDownColor: "#787b86",
      wickUpColor: "#d1d4dc", wickDownColor: "#787b86",
    });
    chartRef.current = chart;
    seriesRef.current = series;
    const ro = new ResizeObserver(() => { if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth }); });
    ro.observe(containerRef.current);
    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, []);

  useEffect(() => {
    if (seriesRef.current) loadData(activeInterval);
  }, [loadData, activeInterval]);

  const priceItem = (label, value, color) => value != null ? (
    <div key={label} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: color || "var(--text-primary)" }}>{typeof value === "number" ? value.toLocaleString() : value}</div>
    </div>
  ) : null;

  return (
    <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Trade header strip */}
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12, padding: "14px 18px", background: "var(--bg-tertiary)", borderRadius: 10, border: "1px solid var(--border-primary)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, flex: 1, minWidth: 200 }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 800, color: "var(--text-primary)" }}>{trade.asset}</span>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 4, letterSpacing: "0.07em", background: trade.direction === "Long" ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)", color: trade.direction === "Long" ? "var(--green)" : "var(--red)" }}>{(trade.direction || "").toUpperCase()}</span>
          {trade.dt && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>{new Date(trade.dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} {new Date(trade.dt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}</span>}
        </div>
        <div style={{ display: "flex", gap: 18, flexWrap: "wrap", alignItems: "center" }}>
          {trade.entry_price != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>Entry <strong style={{ color: "#34d399" }}>{trade.entry_price.toLocaleString()}</strong></span>}
          {trade.exit_price != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>Exit <strong style={{ color: "#f59e0b" }}>{trade.exit_price.toLocaleString()}</strong></span>}
          {trade.stop_loss != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>SL <strong style={{ color: "#ef4444" }}>{trade.stop_loss.toLocaleString()}</strong></span>}
          {trade.take_profit != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>TP <strong style={{ color: "#22c55e" }}>{trade.take_profit.toLocaleString()}</strong></span>}
          {pnl != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>P&L <strong style={{ color: isWin ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${isWin ? "+" : ""}$${pnl.toFixed(0)}`}</strong></span>}
          {rVal != null && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)" }}>R <strong style={{ color: isWin ? "var(--green)" : "var(--red)" }}>{rVal > 0 ? "+" : ""}{rVal}R</strong></span>}
          {trade.aplus && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 4, background: "var(--accent-dim)", color: "var(--accent)", letterSpacing: "0.06em" }}>{trade.aplus}</span>}
        </div>
      </div>

      {/* Interval selector */}
      <div style={{ display: "flex", gap: 4 }}>
        {REPLAY_INTERVALS.map(i => (
          <button key={i} onClick={() => setActiveInterval(i)} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
            padding: "5px 12px", borderRadius: 4, cursor: "pointer", letterSpacing: "0.04em",
            border: "1px solid", transition: "all 0.15s",
            borderColor: activeInterval === i ? "var(--accent)" : "var(--border-primary)",
            background: activeInterval === i ? "var(--accent-dim)" : "var(--bg-tertiary)",
            color: activeInterval === i ? "var(--accent)" : "var(--text-secondary)",
          }}>{i}</button>
        ))}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", alignSelf: "center", letterSpacing: "0.04em" }}>
          {assetToYahooSymbol(trade.asset)} · Yahoo Finance · Delayed
        </span>
      </div>

      {/* Chart */}
      <div style={{ position: "relative", borderRadius: 8, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
        <div ref={containerRef} style={{ width: "100%", height: 640 }} />
        {loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(11,13,19,0.65)" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>Loading candles...</span>
          </div>
        )}
        {error && !loading && (
          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(11,13,19,0.85)", gap: 8 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--red)" }}>Failed to load chart data</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", maxWidth: 380, textAlign: "center" }}>{error}</div>
          </div>
        )}
      </div>

      {oldDataWarning && (
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "#f59e0b", padding: "6px 12px", background: "rgba(245,158,11,0.08)", borderRadius: 4, border: "1px solid rgba(245,158,11,0.2)" }}>
          Intraday data unavailable for trades older than 7 days. Showing higher timeframe candles.
        </div>
      )}

      {/* Trade details card */}
      <TCard style={{ padding: "18px 20px" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 14 }}>Trade Details</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: "14px 20px", marginBottom: 16 }}>
          {priceItem("Entry", trade.entry_price, "#34d399")}
          {priceItem("Exit", trade.exit_price, "#f59e0b")}
          {priceItem("Stop Loss", trade.stop_loss, "#ef4444")}
          {priceItem("Take Profit", trade.take_profit, "#22c55e")}
          {trade.bias && priceItem("Bias", trade.bias, trade.bias === "Bullish" ? "var(--green)" : "var(--red)")}
          {trade.aplus && priceItem("A+ Grade", trade.aplus, "var(--accent)")}
          {trade.timeframe && priceItem("Timeframe", trade.timeframe, "var(--text-primary)")}
          {risk != null && priceItem("Risk", `$${risk}`, "var(--text-primary)")}
        </div>
        {trade.notes && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 6 }}>Notes</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{trade.notes}</div>
          </div>
        )}
        {trade.after_thoughts && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-tertiary)", textTransform: "uppercase", marginBottom: 6 }}>After Thoughts</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{trade.after_thoughts}</div>
          </div>
        )}
        {trade.tags?.length > 0 && <TradeTagChips tags={trade.tags} allTags={prefs?.tags} />}
      </TCard>
    </div>
  );
}

function tradeAgeMs(trade) {
  return trade.dt ? Date.now() - new Date(trade.dt).getTime() : 0;
}

export function TradeReplayView({ supabase, user, privacyMode }) {
  const [trades, setTrades] = useState([]);
  const [selectedTrade, setSelectedTrade] = useState(null);
  const [listLoading, setListLoading] = useState(true);
  const [prefs, setPrefs] = useState(null);

  const MASK = "••••";

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("trades").select("*").eq("user_id", user.id).not("entry_price", "is", null).order("dt", { ascending: false }),
      supabase.from("user_preferences").select("*").eq("user_id", user.id).single(),
    ]).then(([{ data: tradeData }, { data: prefData }]) => {
      const list = tradeData || [];
      setTrades(list);
      setSelectedTrade(list[0] || null);
      setPrefs(prefData);
      setListLoading(false);
    });
  }, [user]);

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="TRADE REPLAY"
        title="Replay Your Trades"
        subtitle="Review your entries, exits, and price levels on an interactive chart."
      />

      <div style={{ display: "flex", gap: 0, minHeight: 700, border: "1px solid var(--border-primary)", borderRadius: 12, overflow: "hidden", background: "var(--bg-secondary)" }}>

        {/* Left panel — trade list */}
        <div style={{ width: 264, flexShrink: 0, borderRight: "1px solid var(--border-primary)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--border-primary)", display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg-tertiary)" }}>
            <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-tertiary)", textTransform: "uppercase" }}>Replay Library</span>
            {!listLoading && <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: "var(--accent-dim)", color: "var(--accent)" }}>{trades.length}</span>}
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {listLoading ? (
              <div style={{ padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", textAlign: "center" }}>Loading...</div>
            ) : trades.length === 0 ? (
              <div style={{ padding: 24, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", lineHeight: 1.6, textAlign: "center" }}>
                No replay data yet.<br /><br />Fill in <strong>Entry Price</strong> when logging a trade to enable replay.
              </div>
            ) : trades.map(t => {
              const tPnl = t.profit ?? t.profit_funded;
              const isSelected = selectedTrade?.id === t.id;
              const isWin = tPnl > 0;
              return (
                <button key={t.id} onClick={() => setSelectedTrade(t)} style={{
                  width: "100%", textAlign: "left", background: isSelected ? "var(--accent-dim)" : "transparent",
                  border: "none", borderBottom: "1px solid var(--border-primary)",
                  borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                  padding: "12px 14px", cursor: "pointer", transition: "all 0.12s",
                }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", letterSpacing: "0.04em", marginBottom: 4 }}>
                    {t.dt ? new Date(t.dt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—"}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 800, color: isSelected ? "var(--accent)" : "var(--text-primary)" }}>{t.asset}</span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 3, letterSpacing: "0.06em", background: t.direction === "Long" ? "rgba(52,211,153,0.12)" : "rgba(251,113,133,0.12)", color: t.direction === "Long" ? "var(--green)" : "var(--red)" }}>
                      {(t.direction || "").toUpperCase()}
                    </span>
                  </div>
                  {tPnl != null && (
                    <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: isWin ? "var(--green)" : "var(--red)" }}>
                      {privacyMode ? MASK : `${isWin ? "+" : ""}$${tPnl.toFixed(0)}`}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right panel — chart + details */}
        <div style={{ flex: 1, minWidth: 0, padding: "20px 24px", overflowY: "auto" }}>
          {!selectedTrade ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: 400, gap: 12 }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--text-tertiary)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="5,3 19,12 5,21"/></svg>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "var(--text-tertiary)" }}>Select a trade to replay</div>
            </div>
          ) : (
            <ReplayChartPanel key={selectedTrade.id} trade={selectedTrade} privacyMode={privacyMode} prefs={prefs} />
          )}
        </div>
      </div>
    </div>
  );
}

const CHART_INTERVALS = [
  { label: "1m", interval: "1m", range: "1d" },
  { label: "5m", interval: "5m", range: "1d" },
  { label: "15m", interval: "15m", range: "5d" },
  { label: "1H", interval: "1h", range: "1mo" },
  { label: "4H", interval: "4h", range: "3mo" },
  { label: "1D", interval: "1d", range: "1y" },
];

export function ChartsView() {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);
  const [activeInterval, setActiveInterval] = useState("5m");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [meta, setMeta] = useState(null);

  const loadCandles = useCallback(async (intervalLabel) => {
    const cfg = CHART_INTERVALS.find(c => c.label === intervalLabel);
    if (!cfg) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/market-data?ticker=NQ%3DF&interval=${cfg.interval}&range=${cfg.range}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (seriesRef.current && data.candles?.length) {
        seriesRef.current.setData(data.candles);
        chartRef.current?.timeScale().fitContent();
      }
      setMeta(data.meta);
    } catch (e) {
      setError(e.message);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const isDark = document.documentElement.getAttribute("data-theme") !== "light";

    const chart = createChart(chartContainerRef.current, {
      width: chartContainerRef.current.clientWidth,
      height: 500,
      layout: {
        background: { color: isDark ? "#0b0d13" : "#ffffff" },
        textColor: isDark ? "#94a3b8" : "#374151",
      },
      grid: {
        vertLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
        horzLines: { color: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.06)" },
      },
      crosshair: { mode: 1 },
      rightPriceScale: { borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)" },
      timeScale: {
        borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#34d399",
      downColor: "#f87171",
      borderUpColor: "#34d399",
      borderDownColor: "#f87171",
      wickUpColor: "#34d399",
      wickDownColor: "#f87171",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const ro = new ResizeObserver(() => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    });
    ro.observe(chartContainerRef.current);

    loadCandles("5m");

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, [loadCandles]);

  const handleInterval = (label) => {
    setActiveInterval(label);
    loadCandles(label);
  };

  const price = meta?.regularMarketPrice;
  const prevClose = meta?.chartPreviousClose;
  const change = price && prevClose ? price - prevClose : null;
  const changePct = change && prevClose ? (change / prevClose) * 100 : null;
  const isUp = change >= 0;

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="CHARTS"
        title="Market Overview"
        subtitle="Live candlestick charts powered by Yahoo Finance."
      />

      <TCard style={{ padding: "20px 24px", marginBottom: 16 }}>
        {/* Header row */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, fontWeight: 800, color: "var(--text-primary)" }}>
                NQ1! <span style={{ fontSize: 12, fontWeight: 600, color: "var(--text-tertiary)", letterSpacing: "0.05em" }}>E-MINI NASDAQ-100</span>
              </div>
              {meta && (
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 20, fontWeight: 700, color: "var(--text-primary)" }}>
                    {price?.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {change != null && (
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 600, color: isUp ? "var(--green)" : "var(--red)" }}>
                      {isUp ? "+" : ""}{change.toFixed(2)} ({isUp ? "+" : ""}{changePct.toFixed(2)}%)
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Interval selector */}
          <div style={{ display: "flex", gap: 4 }}>
            {CHART_INTERVALS.map(({ label }) => (
              <button
                key={label}
                onClick={() => handleInterval(label)}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
                  padding: "5px 10px", borderRadius: 4, cursor: "pointer",
                  border: "1px solid",
                  borderColor: activeInterval === label ? "var(--accent)" : "var(--border-primary)",
                  background: activeInterval === label ? "var(--accent-dim)" : "var(--bg-tertiary)",
                  color: activeInterval === label ? "var(--accent)" : "var(--text-secondary)",
                  letterSpacing: "0.04em",
                }}
              >{label}</button>
            ))}
          </div>
        </div>

        {/* Chart container */}
        <div style={{ position: "relative" }}>
          <div ref={chartContainerRef} style={{ width: "100%", height: 500, borderRadius: 6, overflow: "hidden" }} />
          {loading && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(11,13,19,0.6)", borderRadius: 6 }}>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)" }}>Loading...</span>
            </div>
          )}
          {error && (
            <div style={{ padding: "40px 24px", textAlign: "center" }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--red)", marginBottom: 6 }}>Failed to load chart data</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>{error}</div>
            </div>
          )}
        </div>

        {meta?.exchangeName && (
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 8, letterSpacing: "0.04em" }}>
            {meta.exchangeName} · Data via Yahoo Finance · Delayed
          </div>
        )}
      </TCard>
    </div>
  );
}

const emptyEduForm = { type: "video", title: "", url: "", category: "Trading Concepts", status: "to_review", notes: "" };

export function EducationView({ supabase, user }) {
  const toast = useToast();
  const [confirmDeleteResource, setConfirmDeleteResource] = useState(null);
  const [resources, setResources] = useState([]);
  const [catFilter, setCatFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({ ...emptyEduForm });
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [viewingResource, setViewingResource] = useState(null);
  const [sessionNotes, setSessionNotes] = useState("");
  const [savingNotes, setSavingNotes] = useState(false);
  const fileInputRef = useRef(null);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("learning_resources")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (data) setResources(data);
  }, [user, supabase]);

  useEffect(() => { load(); }, [load]);

  const resetForm = () => { setForm({ ...emptyEduForm }); setEditingId(null); setShowForm(false); };

  const handleScreenshotUpload = async (file) => {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `${user.id}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("learning-screenshots").upload(path, file, { upsert: false });
    if (error) { toast("Upload failed: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("learning-screenshots").getPublicUrl(path);
    setForm((f) => ({ ...f, url: publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) { toast("Please enter a title."); return; }
    if ((form.type === "video" || form.type === "screenshot") && !form.url.trim()) {
      toast("Please enter a URL or upload a screenshot."); return;
    }
    const payload = {
      user_id: user.id,
      type: form.type,
      title: form.title.trim(),
      url: form.url.trim() || null,
      category: form.category,
      status: form.status,
      notes: form.notes.trim() || null,
    };
    if (editingId) {
      const { error } = await supabase.from("learning_resources").update(payload).eq("id", editingId);
      if (error) { toast("Error saving: " + error.message); return; }
    } else {
      const { error } = await supabase.from("learning_resources").insert(payload);
      if (error) { toast("Error saving: " + error.message); return; }
    }
    resetForm(); load();
  };

  const deleteResource = async (id) => {
    await supabase.from("learning_resources").delete().eq("id", id);
    if (viewingResource?.id === id) setViewingResource(null);
    load();
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ type: r.type, title: r.title, url: r.url || "", category: r.category || "Trading Concepts", status: r.status || "to_review", notes: r.notes || "" });
    setShowForm(true);
    setViewingResource(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cycleStatus = async (r) => {
    const order = ["to_review", "reviewed", "key_resource"];
    const next = order[(order.indexOf(r.status) + 1) % order.length];
    await supabase.from("learning_resources").update({ status: next }).eq("id", r.id);
    load();
  };

  const openResource = (r) => {
    setViewingResource(r);
    setSessionNotes(r.notes || "");
  };

  const saveSessionNotes = async () => {
    if (!viewingResource) return;
    setSavingNotes(true);
    await supabase.from("learning_resources").update({ notes: sessionNotes.trim() || null }).eq("id", viewingResource.id);
    setViewingResource((prev) => ({ ...prev, notes: sessionNotes.trim() || null }));
    setSavingNotes(false);
    load();
  };

  const filtered = resources.filter((r) => {
    if (catFilter !== "all" && r.category !== catFilter) return false;
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (search && !r.title.toLowerCase().includes(search.toLowerCase()) && !(r.notes || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const statusMeta = (s) => EDU_STATUSES.find((x) => x.value === s) || EDU_STATUSES[0];
  const catColor = (cat) => {
    const map = { "Trading Concepts": "var(--accent)", "Psychology": "var(--purple)", "Risk Management": "var(--red)", "Setups": "var(--green)", "Trade Reviews": "var(--gold)", "General": "var(--text-tertiary)" };
    return map[cat] || "var(--text-tertiary)";
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>

      {/* ── Video / Resource Player Modal ── */}
      {viewingResource && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) { setViewingResource(null); } }}
          style={{
            position: "fixed", inset: 0, zIndex: 500,
            background: "var(--modal-overlay, rgba(0,0,0,0.7))", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 24, animation: "fadeSlideIn 0.2s ease",
          }}
        >
          <div className="edu-modal-inner" style={{
            width: "100%", maxWidth: 960, maxHeight: "90vh", overflow: "hidden",
            background: "var(--bg-primary)", border: "1px solid var(--border-primary)",
            borderRadius: 12, boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
            display: "flex", flexDirection: "column",
          }}>
            {/* Modal header */}
            <div style={{
              padding: "16px 20px", borderBottom: "1px solid var(--border-primary)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {viewingResource.title}
                </div>
                <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${catColor(viewingResource.category)}15`, color: catColor(viewingResource.category), letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {viewingResource.category}
                  </span>
                  <button
                    onClick={() => { cycleStatus(viewingResource); const order = ["to_review", "reviewed", "key_resource"]; const next = order[(order.indexOf(viewingResource.status) + 1) % order.length]; setViewingResource((p) => ({ ...p, status: next })); }}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px",
                      borderRadius: 20, cursor: "pointer", letterSpacing: "0.06em",
                      border: `1px solid ${statusMeta(viewingResource.status).color}`,
                      background: `${statusMeta(viewingResource.status).color}18`,
                      color: statusMeta(viewingResource.status).color,
                    }}
                  >{statusMeta(viewingResource.status).label}</button>
                </div>
              </div>
              <button onClick={() => setViewingResource(null)} style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 18, color: "var(--text-tertiary)",
                background: "none", border: "none", cursor: "pointer", padding: "4px 8px",
              }}>✕</button>
            </div>

            {/* Modal body */}
            <div style={{ flex: 1, overflow: "auto", display: "flex", flexDirection: "column" }}>
              {/* Embedded YouTube player */}
              {viewingResource.type === "video" && getYouTubeId(viewingResource.url) && (
                <div style={{ position: "relative", width: "100%", paddingBottom: "56.25%", background: "#000", flexShrink: 0 }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${getYouTubeId(viewingResource.url)}?rel=0`}
                    title={viewingResource.title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
                  />
                </div>
              )}

              {/* Screenshot view */}
              {viewingResource.type === "screenshot" && viewingResource.url && (
                <div style={{ padding: 20, display: "flex", justifyContent: "center", background: "var(--bg-tertiary)", flexShrink: 0 }}>
                  <img src={viewingResource.url} alt={viewingResource.title} style={{ maxWidth: "100%", maxHeight: 400, objectFit: "contain", borderRadius: 6 }} />
                </div>
              )}

              {/* Note content — full text display */}
              {viewingResource.type === "note" && viewingResource.notes && (
                <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-primary)" }}>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 14 }}>NOTE</div>
                  <div style={{
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, color: "var(--text-primary)",
                    lineHeight: 1.85, whiteSpace: "pre-wrap", wordBreak: "break-word",
                    background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
                    borderRadius: 8, padding: "16px 20px",
                  }}>
                    {viewingResource.notes}
                  </div>
                </div>
              )}

              {/* Session Notes — only for non-note types */}
              {viewingResource.type !== "note" && (
              <div style={{ padding: 20, flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    SESSION NOTES
                  </span>
                  <button
                    onClick={saveSessionNotes}
                    disabled={savingNotes}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "5px 14px",
                      borderRadius: 4, cursor: savingNotes ? "not-allowed" : "pointer",
                      border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)",
                      letterSpacing: "0.05em", opacity: savingNotes ? 0.5 : 1,
                    }}
                  >{savingNotes ? "Saving..." : "Save Notes"}</button>
                </div>
                <textarea
                  value={sessionNotes}
                  onChange={(e) => setSessionNotes(e.target.value)}
                  placeholder="Take notes while you watch... timestamps, key concepts, action items..."
                  style={{
                    ...inputStyle, minHeight: 120, resize: "vertical",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.8,
                  }}
                />
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      <PageBanner
        label="LEARNING LIBRARY"
        title="The edge is built between sessions."
        subtitle="Every concept you study compounds. Save videos, notes, and chart screenshots here."
      />

      {/* Controls */}
      <div className="edu-controls" style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
        <input
          placeholder="Search resources..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, padding: "8px 12px",
            background: "var(--bg-input)", border: "1px solid var(--border-primary)",
            color: "var(--text-primary)", borderRadius: 4, outline: "none",
            flex: 1, minWidth: 140, maxWidth: 200, boxSizing: "border-box",
            transition: "all 0.2s ease",
          }}
        />
        <div className="edu-status-row" style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {[["all", "Any Status"], ...EDU_STATUSES.map((s) => [s.value, s.label])].map(([v, l]) => (
            <button key={v} onClick={() => setStatusFilter(v)} style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 600, padding: "8px 12px",
              borderRadius: 4, cursor: "pointer",
              border: statusFilter === v ? `1px solid ${v === "all" ? "var(--accent)" : statusMeta(v).color}` : "1px solid var(--border-primary)",
              background: statusFilter === v ? (v === "all" ? "var(--accent-dim)" : `${statusMeta(v).color}18`) : "var(--bg-tertiary)",
              color: statusFilter === v ? (v === "all" ? "var(--accent)" : statusMeta(v).color) : "var(--text-tertiary)", transition: "all 0.15s",
            }}>{l}</button>
          ))}
        </div>
        <button
          onClick={() => { setShowForm((v) => !v); if (showForm) resetForm(); }}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", display: "flex", alignItems: "center", gap: 6,
            fontSize: 12, fontWeight: 600, padding: "5px 12px",
            borderRadius: 6, cursor: "pointer", marginLeft: "auto",
            border: "1px solid rgba(34,211,238,0.25)", background: "var(--accent-dim)", color: "var(--accent)",
            letterSpacing: "0.05em", transition: "all 0.15s", whiteSpace: "nowrap",
          }}
        >
          {showForm
            ? <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg> Cancel</>
            : <><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg> Add Resource</>
          }
        </button>
      </div>

      {/* Category filter chips */}
      <div className="edu-cat-chips" style={{ display: "flex", gap: 6, marginBottom: 20, flexWrap: "wrap" }}>
        {["all", ...EDU_CATEGORIES].map((cat) => (
          <button key={cat} onClick={() => setCatFilter(cat)} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600, padding: "4px 12px",
            borderRadius: 20, cursor: "pointer", letterSpacing: "0.06em", textTransform: "uppercase",
            border: catFilter === cat ? `1px solid ${cat === "all" ? "var(--border-primary)" : catColor(cat)}` : "1px solid var(--border-primary)",
            background: catFilter === cat ? (cat === "all" ? "var(--bg-tertiary)" : `${catColor(cat)}18`) : "transparent",
            color: catFilter === cat ? (cat === "all" ? "var(--text-secondary)" : catColor(cat)) : "var(--text-tertiary)",
            transition: "all 0.15s",
          }}>{cat === "all" ? "All Categories" : cat}</button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <TCard style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
            {editingId ? "EDIT RESOURCE" : "ADD RESOURCE"}
          </div>

          {/* Type selector */}
          <div style={{ display: "flex", gap: 8, marginBottom: 18 }}>
            {[["video", "▶ YouTube Video"], ["note", "✎ Note"], ["screenshot", "◫ Screenshot"]].map(([v, l]) => (
              <button key={v} onClick={() => setForm((f) => ({ ...f, type: v }))} style={{
                fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, padding: "8px 16px",
                borderRadius: 4, cursor: "pointer",
                border: form.type === v ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                background: form.type === v ? "var(--accent-dim)" : "var(--bg-tertiary)",
                color: form.type === v ? "var(--accent)" : "var(--text-tertiary)", transition: "all 0.15s",
              }}>{l}</button>
            ))}
          </div>

          <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <div style={{ gridColumn: "1 / 3" }}>
              <Field label="Title">
                <input style={inputStyle} placeholder="e.g. ICT Power of 3 Explained" value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
              </Field>
            </div>
            <Field label="Category">
              <select style={selectStyle} value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                {EDU_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <select style={selectStyle} value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}>
                {EDU_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </Field>
          </div>

          {form.type === "video" && (
            <div style={{ marginBottom: 14 }}>
              <Field label="YouTube URL">
                <input style={inputStyle} placeholder="https://youtube.com/watch?v=..." value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
              </Field>
              {form.url && getYouTubeId(form.url) && (
                <div style={{ marginTop: 10, maxWidth: 300 }}>
                  <YTThumbnail url={form.url} title={form.title} />
                </div>
              )}
            </div>
          )}

          {form.type === "screenshot" && (
            <div style={{ marginBottom: 14 }}>
              <Field label="Screenshot">
                <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    style={{
                      fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600, padding: "8px 16px",
                      borderRadius: 4, cursor: uploading ? "not-allowed" : "pointer",
                      border: "1px solid var(--border-primary)", background: "var(--bg-tertiary)", color: "var(--text-secondary)",
                    }}
                  >{uploading ? "Uploading..." : "◫ Upload Image"}</button>
                  <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>or</span>
                  <input style={{ ...inputStyle, flex: 1, minWidth: 200 }} placeholder="Paste image URL..." value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))} />
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" style={{ display: "none" }} onChange={(e) => handleScreenshotUpload(e.target.files[0])} />
              </Field>
              {form.url && (
                <div style={{ marginTop: 10 }}>
                  <img src={form.url} alt="preview" style={{ maxWidth: 300, maxHeight: 180, objectFit: "contain", borderRadius: 4, border: "1px solid var(--border-primary)" }} />
                </div>
              )}
            </div>
          )}

          <div style={{ marginBottom: 18 }}>
            <Field label="Notes">
              <textarea
                style={{ ...inputStyle, minHeight: form.type === "note" ? 200 : 70, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}
                placeholder="Key takeaways, timestamps, concepts..."
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              />
            </Field>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            {editingId && (
              <button onClick={resetForm} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 12, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
            )}
            <button onClick={save} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 2, fontSize: 13, fontWeight: 700, padding: 12, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em" }}>
              {editingId ? "SAVE CHANGES" : "+ SAVE RESOURCE"}
            </button>
          </div>
        </TCard>
      )}

      {/* Empty state */}
      {!filtered.length && (
        <TCard style={{ padding: 56, textAlign: "center" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent-dim)", border: "1px solid rgba(34,211,238,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 16, fontWeight: 600, color: "var(--text-primary)", marginBottom: 8 }}>
            {resources.length === 0 ? "Start your learning library" : "No resources match your filters"}
          </div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-tertiary)", lineHeight: 1.7, maxWidth: 360, margin: "0 auto" }}>
            {resources.length === 0
              ? "Save YouTube videos, write study notes, and upload chart screenshots. Your edge compounds with every session."
              : "Try clearing your filters to see all resources."}
          </div>
          {resources.length === 0 && (
            <button onClick={() => setShowForm(true)} style={{
              marginTop: 20, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, padding: "10px 24px",
              border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)", borderRadius: 4, cursor: "pointer",
            }}>+ Add Your First Resource</button>
          )}
        </TCard>
      )}

      {/* Resource Grid */}
      {filtered.length > 0 && (
        <div className="edu-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {filtered.map((r) => {
            const sm = statusMeta(r.status);
            const isExpanded = expandedId === r.id;
            return (
              <TCard key={r.id} style={{ padding: 0, overflow: "hidden", display: "flex", flexDirection: "column", cursor: "pointer" }} onClick={() => openResource(r)}>

                {/* Video thumbnail */}
                {r.type === "video" && r.url && (
                  <YTThumbnail url={r.url} title={r.title} />
                )}

                {/* Screenshot */}
                {r.type === "screenshot" && r.url && (
                  <div style={{ width: "100%", aspectRatio: "16/9", overflow: "hidden", borderRadius: "6px 6px 0 0", background: "var(--bg-tertiary)" }}>
                    <img src={r.url} alt={r.title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  </div>
                )}

                {/* Note header color bar */}
                {r.type === "note" && (
                  <div style={{ height: 4, background: `linear-gradient(90deg, ${catColor(r.category)}, transparent)` }} />
                )}

                {/* Card body */}
                <div style={{ padding: "16px 18px", flex: 1, display: "flex", flexDirection: "column" }}>
                  {/* Top row */}
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                        {r.title}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); cycleStatus(r); }}
                      title={`Status: ${sm.label} — click to cycle`}
                      style={{
                        flexShrink: 0, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700,
                        padding: "3px 8px", borderRadius: 20, cursor: "pointer", letterSpacing: "0.06em",
                        border: `1px solid ${sm.color}`, background: `${sm.color}18`, color: sm.color,
                        whiteSpace: "nowrap", transition: "all 0.15s",
                      }}
                    >{sm.label}</button>
                  </div>

                  {/* Category + type tags */}
                  <div style={{ display: "flex", gap: 5, marginBottom: r.notes ? 10 : 4, flexWrap: "wrap" }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${catColor(r.category)}15`, color: catColor(r.category), letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {r.category}
                    </span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 600, padding: "2px 8px", borderRadius: 20, background: "var(--bg-tertiary)", color: "var(--text-tertiary)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {r.type === "video" ? "▶ Video" : r.type === "note" ? "✎ Note" : "◫ Screenshot"}
                    </span>
                  </div>

                  {/* Notes preview */}
                  {r.notes && (
                    <div style={{ marginBottom: 4 }}>
                      <div style={{
                        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.7,
                        overflow: "hidden", display: "-webkit-box",
                        WebkitLineClamp: 3, WebkitBoxOrient: "vertical", whiteSpace: "pre-wrap",
                      }}>{r.notes}</div>
                    </div>
                  )}

                  {/* Footer */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto", paddingTop: 14, borderTop: "1px solid var(--border-primary)" }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
                      {r.created_at ? new Date(r.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" }) : ""}
                    </span>
                    <div style={{ display: "flex", gap: 12 }}>
                      <button onClick={(e) => { e.stopPropagation(); startEdit(r); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--accent-secondary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}>EDIT</button>
                      <DeletePopover id={r.id} confirmId={confirmDeleteResource} setConfirmId={(id) => { setConfirmDeleteResource(id); }} onConfirm={deleteResource} buttonStyle={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, opacity: 0.6 }}>DELETE</DeletePopover>
                    </div>
                  </div>
                </div>
              </TCard>
            );
          })}
        </div>
      )}
    </div>
  );
}


// ═══════════════════════════════════════════════════════════════════════════
// AI HUB VIEW
// ═══════════════════════════════════════════════════════════════════════════

function AIToolCard({ title, description, accentColor = "var(--accent)", icon, controls, output, loading, loadingText = "ANALYZING...", emptyText = "Hit generate to run this analysis." }) {
  return (
    <TCard style={{ padding: 0, display: "flex", flexDirection: "column", overflow: "hidden", borderTop: `3px solid ${accentColor}` }}>
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "20px 24px 16px" }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: `${accentColor}28`, border: `1px solid ${accentColor}50`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, color: accentColor }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 3 }}>{title}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.5 }}>{description}</div>
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: `${accentColor}28`, color: accentColor, flexShrink: 0, letterSpacing: "0.08em" }}>AI</span>
      </div>
      {/* Controls */}
      <div style={{ padding: "0 24px 16px", borderBottom: "1px solid var(--border-primary)" }}>{controls}</div>
      {/* Output */}
      <div style={{
        padding: "16px 24px 20px",
        fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, lineHeight: 1.8,
        color: loading ? accentColor : output ? "var(--text-secondary)" : "var(--text-tertiary)",
        whiteSpace: "pre-wrap", minHeight: 80,
        animation: loading ? "hudPulse 1.5s ease-in-out infinite" : "none",
      }}>
        {loading ? loadingText : (output || emptyText)}
      </div>
    </TCard>
  );
}

export function AIHubView({ supabase, user, trades }) {
  const now = new Date();

  const callAI = async (prompt, maxTokens = 2000) => {
    const { data: { session } } = await supabase.auth.getSession();
    let res;
    try {
      res = await fetch("/api/ai-summary", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: maxTokens, messages: [{ role: "user", content: prompt }] }),
      });
    } catch {
      throw new Error("Could not reach the AI service. Make sure you're on the deployed app, not localhost.");
    }
    if (!res.ok) throw new Error(`AI service error: ${res.status}`);
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch {
      throw new Error("AI service returned an unexpected response. This feature requires the deployed Vercel environment.");
    }
    if (data.error) throw new Error(data.error);
    return data.content?.map((c) => c.text || "").join("") || "No response received.";
  };

  // Tool 1: Trade History Analyzer
  const monthOptions = [];
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    monthOptions.push({ value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`, label: d.toLocaleString("default", { month: "long", year: "numeric" }) });
  }
  const [analyzerMonth, setAnalyzerMonth] = React.useState(monthOptions[0].value);
  const [analyzerOutput, setAnalyzerOutput] = React.useState("");
  const [analyzerLoading, setAnalyzerLoading] = React.useState(false);

  const runAnalyzer = async () => {
    const monthTrades = trades.filter((t) => t.dt?.startsWith(analyzerMonth));
    if (!monthTrades.length) { setAnalyzerOutput("No trades logged for this month yet."); return; }
    setAnalyzerLoading(true); setAnalyzerOutput("");
    const taken = monthTrades.filter((t) => t.taken && t.taken !== "Missed");
    const wins = taken.filter((t) => parseFloat(t.profit) > 0).length;
    const pnl = monthTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const tradeLines = monthTrades.map((t) => {
      const tags = t.tags?.length ? t.tags.join(", ") : "none";
      return `${t.dt?.split("T")[0]} | ${t.asset || "?"} ${t.direction || ""} | A+: ${t.aplus} | Taken: ${t.taken} | P&L: ${t.profit != null ? "$" + t.profit : "blank"} | Tags: ${tags} | Notes: ${t.notes || "none"} | After-thoughts: ${t.after_thoughts || "none"}`;
    }).join("\n");
    const prompt = `${AI_COACH_TONE}

You are analyzing a funded futures trader's complete trade history for ${monthOptions.find(m => m.value === analyzerMonth)?.label}.

TRADING CONTEXT:
- ICT-inspired fractal model (NQ/ES primary, NY session only, max 2 trades/day)
- A+ requires: CIC/SMT, key level, timeframe alignment, CISD, ICCISD, TTFM, session, R:R, stop loss
- Standard risk: $500/trade, target: $1,000 (2R). Losses beyond -$500 = moved stop or overexposure.
- Setup grades: A+ = clean plan execution | B = good setup, flawed execution | C = marginal/forced | F = no setup / rule break

PERIOD: ${monthOptions.find(m => m.value === analyzerMonth)?.label}
TOTAL: ${monthTrades.length} logged | ${taken.length} taken | ${wins} wins | Net P&L: $${pnl.toFixed(0)}

TRADE LOG:
${tradeLines}

Analyze this month's trades and identify:
1. TOP MISTAKE PATTERNS — The 2-3 most repeated errors. Be specific: which days, which setups, what went wrong.
2. WHAT WINNING TRADES HAVE IN COMMON — Setup type, time of day, asset, session conditions. Use the tags and notes.
3. BEHAVIORAL PATTERNS — Any time-of-day effects, day-of-week patterns, what happens after a loss, tilt indicators in the notes.
4. ASSET/DIRECTION ANALYSIS — Which instruments and directions are profitable vs bleeding.
5. ONE KEY FOCUS FOR NEXT MONTH — The single highest-leverage improvement based on the data.

Be specific and data-driven. Cite exact trade dates, notes, and patterns. Under 600 words.`;
    try { setAnalyzerOutput(await callAI(prompt)); } catch (e) { setAnalyzerOutput(e.message || "Failed. Check your API key in Profile settings."); } finally { setAnalyzerLoading(false); }
  };

  // Tool 2: Weekly / Monthly Summary
  const [summaryPeriod, setSummaryPeriod] = React.useState("week");
  const [summaryOutput, setSummaryOutput] = React.useState("");
  const [summaryLoading, setSummaryLoading] = React.useState(false);
  const [summaryLabel, setSummaryLabel] = React.useState("");

  const runSummary = async (p) => {
    setSummaryPeriod(p);
    let startDate, label;
    if (p === "week") {
      startDate = new Date(now); startDate.setDate(now.getDate() - now.getDay()); startDate.setHours(0,0,0,0);
      label = `This Week (${startDate.toLocaleDateString([], { month: "short", day: "numeric" })} – ${now.toLocaleDateString([], { month: "short", day: "numeric" })})`;
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      label = `This Month (${now.toLocaleString("default", { month: "long", year: "numeric" })})`;
    }
    const periodTrades = trades.filter((t) => t.dt && new Date(t.dt) >= startDate);
    if (!periodTrades.length) { setSummaryOutput("No trades logged for this period yet."); setSummaryLabel(label); return; }
    setSummaryLabel(label); setSummaryLoading(true); setSummaryOutput("");
    const taken = periodTrades.filter((t) => t.taken && t.taken !== "Missed");
    const wins = taken.filter((t) => parseFloat(t.profit) > 0).length;
    const pnl = periodTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const aplusTakenCount = taken.filter((t) => t.aplus?.startsWith("A+")).length;
    const bGradeCount = taken.filter((t) => t.aplus?.startsWith("B")).length;
    const cGradeCount = taken.filter((t) => t.aplus?.startsWith("C")).length;
    const fGradeCount = taken.filter((t) => t.aplus?.startsWith("F")).length;
    const tradeLines = periodTrades.map((t) => {
      const tags = t.tags?.length ? t.tags.join(", ") : "none";
      const violations = t.violations?.length ? t.violations.join(", ") : "none";
      return `${t.dt?.split("T")[0]} | ${t.asset} ${t.direction} | Model: ${t.model || "none"} | Grade: ${t.aplus} | Taken: ${t.taken} | Personal P&L: ${t.profit != null ? "$" + t.profit : "blank"} | Funded P&L: ${t.profit_funded != null ? "$" + t.profit_funded : "blank"} | Tags: ${tags} | Violations: ${violations} | Notes: ${t.notes || "none"} | After-thoughts: ${t.after_thoughts || "none"}`;
    }).join("\n");
    const tsSection = buildAIScoreSection(periodTrades);
    const splitSection = buildAISplitSection(periodTrades);
    const tagSection = buildAITagBreakdown(periodTrades);
    const modelSection = buildAIModelBreakdown(periodTrades);
    const violationSection = buildAIViolationBreakdown(periodTrades);
    const prompt = `${AI_COACH_TONE}

ICT-inspired fractal model, NQ/ES, NY session only, max 2 trades/day.

SETUP GRADE DEFINITIONS: A+ = clean plan execution | B = good setup, flawed execution | C = marginal/forced | F = no setup / rule break

PERIOD: ${label}
TRADES TAKEN: ${taken.length} (Wins: ${wins}, Losses: ${taken.length - wins})
A+ TRADES: ${aplusTakenCount} | B GRADE: ${bGradeCount} | C GRADE: ${cGradeCount} | F GRADE: ${fGradeCount}
NET P&L: $${pnl.toFixed(0)} | WIN RATE: ${taken.length ? Math.round((wins/taken.length)*100) : 0}%

${splitSection}

${tsSection}

${tagSection}

${modelSection}

${violationSection}

TRADE LOG:
${tradeLines}

Provide:
1. Performance Overview — key numbers, quality of wins vs losses
2. Personal vs Funded Analysis — compare both environments directly if both exist
3. TradeSharp Score Analysis — identify the weakest pillars and why they matter
4. Tag Breakdown — which setups are actually making money and which are not
5. Model Breakdown — which models deserve more size and which should be questioned
6. Rule Violation Analysis — which violations repeat and what they are costing
7. Strengths — specific, reference actual trades
8. Flaws & Weaknesses — direct, expose patterns and execution mistakes
9. Language Analysis — what the notes reveal about mindset
10. Key Focus — 2-3 actionable improvements for next ${p === "week" ? "week" : "month"}
11. Final Word — one clear sentence on where this trader is underperforming most

Under 700 words. Be specific and reference actual trades.`;
    try { setSummaryOutput(await callAI(prompt)); } catch (e) { setSummaryOutput(e.message || "Failed. Check your API key in Profile settings."); } finally { setSummaryLoading(false); }
  };

  // Tool 3: Pre-Session Brief
  const [briefOutput, setBriefOutput] = React.useState("");
  const [briefLoading, setBriefLoading] = React.useState(false);

  const runBrief = async () => {
    setBriefLoading(true); setBriefOutput("");
    const sortedDates = [...new Set(trades.filter((t) => t.dt).map((t) => t.dt.split("T")[0]))].sort().reverse();
    const last5Dates = sortedDates.slice(0, 5);
    if (!last5Dates.length) { setBriefOutput("No recent sessions found. Log some trades first."); setBriefLoading(false); return; }
    const sessionSummaries = last5Dates.map((date) => {
      const dayTrades = trades.filter((t) => t.dt?.startsWith(date));
      const taken = dayTrades.filter((t) => t.taken && t.taken !== "Missed");
      const pnl = taken.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
      const wins = taken.filter((t) => parseFloat(t.profit) > 0).length;
      const aplus = taken.filter((t) => t.aplus?.startsWith("A+")).length;
      const notes = taken.map((t) => t.notes).filter(Boolean).join(" | ");
      return `${date}: ${taken.length} trade(s), ${wins}W/${taken.length - wins}L, P&L: $${pnl.toFixed(0)}, A+: ${aplus}/${taken.length}${notes ? `, Notes: "${notes}"` : ""}`;
    }).join("\n");
    const todayStr = now.toISOString().split("T")[0];
    const { data: todayPlan } = await supabase.from("trade_plans").select("*").eq("user_id", user.id).eq("plan_date", todayStr).maybeSingle();
    const planSection = todayPlan
      ? `TODAY'S PLAN: Bias: ${todayPlan.bias || "none"}, Key levels: ${todayPlan.key_levels || "none"}, Session plan: ${todayPlan.session_plan || "none"}, Notes: ${todayPlan.notes || "none"}`
      : "TODAY'S PLAN: No pre-trade plan filed for today.";
    const prompt = `${AI_COACH_TONE}

You are giving a futures trader their pre-session brief before the NY open.

LAST 5 SESSIONS:
${sessionSummaries}

${planSection}

Generate a concise pre-session brief with exactly 3 sections:
1. RECENT PATTERN — One key pattern from their last 5 sessions to be aware of today (specific, data-backed).
2. MENTAL REMINDER — One mental cue based on behavioral patterns in the notes (personal and direct).
3. TODAY'S FOCUS — Given their plan and recent form, the single most important thing to execute well today.

Each point: 1-2 sentences max. Direct, clear, and practical. No fluff.`;
    try { setBriefOutput(await callAI(prompt, 600)); } catch (e) { setBriefOutput(e.message || "Failed. Check your API key in Profile settings."); } finally { setBriefLoading(false); }
  };

  // Tool 4: Notebook Journal AI
  const [notebookEntries, setNotebookEntries] = React.useState([]);
  const [notebookDate, setNotebookDate] = React.useState("");
  const [notebookOutput, setNotebookOutput] = React.useState("");
  const [notebookLoading, setNotebookLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    supabase.from("notebook_entries").select("entry_date, recap, eod_reflection").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(60)
      .then(({ data }) => { if (data?.length) { setNotebookEntries(data); setNotebookDate(data[0].entry_date); } });
  }, [user]);

  const runNotebookAI = async () => {
    const entry = notebookEntries.find((e) => e.entry_date === notebookDate);
    if (!entry) { setNotebookOutput("No notebook entry found for this date."); return; }
    setNotebookLoading(true); setNotebookOutput("");
    const dayTrades = trades.filter((t) => t.dt?.startsWith(notebookDate));
    const taken = dayTrades.filter((t) => t.taken && t.taken !== "Missed");
    const pnl = taken.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const wins = taken.filter((t) => parseFloat(t.profit) > 0).length;
    const bGradeDay = taken.filter((t) => t.aplus?.startsWith("B")).length;
    const fGradeDay = taken.filter((t) => t.aplus?.startsWith("F")).length;
    const tradeLines = dayTrades.map((t) => `${t.asset} ${t.direction} | Grade: ${t.aplus} | Taken: ${t.taken} | P&L: ${t.profit != null ? "$" + t.profit : "blank"} | Notes: ${t.notes || "none"}`).join("\n");
    const prompt = `${AI_COACH_TONE}

You are reviewing a futures trader's journal for ${notebookDate}. ICT-inspired model, NQ/ES, NY session only, max 2 trades/day.

JOURNAL ENTRY:
RECAP: ${entry.recap || "(blank)"}
EOD REFLECTION: ${entry.eod_reflection || "(blank)"}

TRADES: ${taken.length} taken | ${wins} wins | P&L: $${pnl.toFixed(0)} | B-Grade: ${bGradeDay} | F-Grade: ${fGradeDay}
${tradeLines || "(no trades)"}

Write a focused coaching response (200-350 words):
1. Gameplan vs Reality — did they trade their plan? Use the trade log as evidence.
2. Self-awareness — are the reflections honest and specific, or vague and defensive?
3. Inner dialogue — quote their exact words. What do the word choices reveal?
4. 2 specific, actionable focuses for their next session.

Be direct, evidence-based, and constructive. Quote their own words back to them.`;
    try { setNotebookOutput(await callAI(prompt, 800)); } catch (e) { setNotebookOutput(e.message || "Failed. Check your API key in Profile settings."); } finally { setNotebookLoading(false); }
  };

  const btnBase = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, padding: "10px 20px", borderRadius: 6, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase", border: "none" };
  const fillBtn = (bg, color = "#fff") => ({ ...btnBase, background: bg, color });
  const ghostBtn = (color) => ({ ...btnBase, background: "transparent", color, border: `1px solid ${color}` });
  const selectStyle = { fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, padding: "9px 12px", borderRadius: 6, background: "var(--bg-input)", color: "var(--text-primary)", border: "1px solid var(--border-primary)", cursor: "pointer", outline: "none" };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner label="EDGE AI" title="Your intelligent trading assistant." subtitle="Four AI-powered tools to analyze patterns, review your journal, and sharpen your edge." />
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        <AIToolCard title="Pre-Session Brief" description="Reads your last 5 sessions and today's trade plan, then gives you 3 sharp points to take into the NY open."
          accentColor="var(--green)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>}
          loading={briefLoading} loadingText="PREPARING YOUR BRIEF..." output={briefOutput} emptyText="Generate your pre-session brief before trading today."
          controls={<button onClick={runBrief} disabled={briefLoading} style={{ ...fillBtn("var(--green)"), opacity: briefLoading ? 0.6 : 1 }}>Generate Brief</button>}
        />

        <AIToolCard title="Journal Entry Coach" description="Pick any notebook entry and get a coaching response on what you wrote, how honest your reflection was, and what to work on next."
          accentColor="var(--gold)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>}
          loading={notebookLoading} loadingText="READING YOUR JOURNAL..." output={notebookOutput} emptyText={notebookEntries.length ? "Select an entry date and hit Analyze." : "No notebook entries found. Write in your notebook first."}
          controls={<div style={{ display: "flex", gap: 8, alignItems: "center" }}>{notebookEntries.length > 0 ? (<><select value={notebookDate} onChange={(e) => setNotebookDate(e.target.value)} style={selectStyle}>{notebookEntries.map((e) => (<option key={e.entry_date} value={e.entry_date}>{new Date(e.entry_date + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}</option>))}</select><button onClick={runNotebookAI} disabled={notebookLoading} style={{ ...fillBtn("var(--gold)", "#0b0d13"), opacity: notebookLoading ? 0.6 : 1 }}>Analyze</button></>) : (<span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)" }}>No entries yet</span>)}</div>}
        />

        <AIToolCard title="Trading Summary" description="A direct coaching breakdown of your week or month — performance, patterns, strengths, and exactly what to fix."
          accentColor="var(--accent-secondary)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>}
          loading={summaryLoading} loadingText="ANALYZING TRADES..." output={summaryLabel && summaryOutput ? `${summaryLabel}\n\n${summaryOutput}` : summaryOutput} emptyText="Choose a period and generate your coaching summary."
          controls={<div style={{ display: "flex", gap: 8 }}><button onClick={() => runSummary("week")} disabled={summaryLoading} style={{ ...(summaryPeriod === "week" && summaryOutput ? fillBtn("var(--accent-secondary)") : ghostBtn("var(--accent-secondary)")), opacity: summaryLoading ? 0.6 : 1 }}>This Week</button><button onClick={() => runSummary("month")} disabled={summaryLoading} style={{ ...(summaryPeriod === "month" && summaryOutput ? fillBtn("var(--purple)") : ghostBtn("var(--purple)")), opacity: summaryLoading ? 0.6 : 1 }}>This Month</button></div>}
        />

        <AIToolCard title="Trade History Analyzer" description="Feed a full month of trades to Claude — find mistake patterns, winning commonalities, and behavioral trends you'd never spot manually."
          accentColor="var(--accent)"
          icon={<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>}
          loading={analyzerLoading} loadingText="SCANNING TRADE HISTORY..." output={analyzerOutput} emptyText="Select a month and hit Analyze to find patterns in your trading."
          controls={<div style={{ display: "flex", gap: 8, alignItems: "center" }}><select value={analyzerMonth} onChange={(e) => setAnalyzerMonth(e.target.value)} style={selectStyle}>{monthOptions.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}</select><button onClick={runAnalyzer} disabled={analyzerLoading} style={{ ...fillBtn("var(--accent)", "var(--bg-primary)"), opacity: analyzerLoading ? 0.6 : 1 }}>Analyze</button></div>}
        />

      </div>
    </div>
  );
}

// ─── EDGE CHAT ────────────────────────────────────────────────────────────────

const EDGE_PROMPTS = [
  {
    id: "brief",
    label: "Pre-Session Brief",
    color: "#34d399",
    colorRaw: "52,211,153",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></svg>,
    example: "Edge, look at my last 5 sessions and give me my 3 sharpest focuses for today's NY open.",
  },
  {
    id: "journal",
    label: "Journal Entry Coach",
    color: "#fbbf24",
    colorRaw: "251,191,36",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>,
    example: "Edge, read my latest journal entry — was I being honest with myself, and what should I actually work on next session?",
  },
  {
    id: "summary",
    label: "Trading Summary",
    color: "#818cf8",
    colorRaw: "129,140,248",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></svg>,
    example: "Edge, break down my trading this week. What am I doing well, what's hurting my P&L, and what's the one thing to fix?",
  },
  {
    id: "analyzer",
    label: "Trade History Analyzer",
    color: "#22d3ee",
    colorRaw: "34,211,238",
    icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>,
    example: "Edge, scan this month's trades. Show me my top mistake patterns and what my winning trades all have in common.",
  },
];

function TypingDots() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 3, marginLeft: 2 }}>
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "rgba(34,211,238,0.8)",
            boxShadow: "0 0 4px rgba(34,211,238,0.4)",
          }}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.85, 1.15, 0.85] }}
          transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
}

function renderEdgeMarkdown(text) {
  const lines = text.split("\n");
  const elements = [];
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (/^### (.+)/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", marginTop: 14, marginBottom: 4 }}>{line.replace(/^### /, "")}</div>);
    } else if (/^## (.+)/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)", marginTop: 16, marginBottom: 5 }}>{line.replace(/^## /, "")}</div>);
    } else if (/^# (.+)/.test(line)) {
      elements.push(<div key={i} style={{ fontSize: 14, fontWeight: 800, color: "var(--text-primary)", marginTop: 16, marginBottom: 6 }}>{line.replace(/^# /, "")}</div>);
    } else if (/^---+$/.test(line.trim())) {
      elements.push(<hr key={i} style={{ border: "none", borderTop: "1px solid var(--border-primary)", margin: "12px 0" }} />);
    } else if (/^(\s*[-*•])\s+/.test(line)) {
      elements.push(<div key={i} style={{ display: "flex", gap: 8, marginTop: 3 }}><span style={{ color: "var(--accent)", flexShrink: 0, marginTop: 1 }}>·</span><span>{inlineStyles(line.replace(/^\s*[-*•]\s+/, ""))}</span></div>);
    } else if (/^\d+\.\s+/.test(line)) {
      const num = line.match(/^(\d+)\./)[1];
      elements.push(<div key={i} style={{ display: "flex", gap: 8, marginTop: 3 }}><span style={{ color: "var(--accent)", flexShrink: 0, minWidth: 16, fontWeight: 700, fontSize: 12 }}>{num}.</span><span>{inlineStyles(line.replace(/^\d+\.\s+/, ""))}</span></div>);
    } else if (line.trim() === "") {
      elements.push(<div key={i} style={{ height: 8 }} />);
    } else {
      elements.push(<div key={i} style={{ marginTop: 2 }}>{inlineStyles(line)}</div>);
    }
    i++;
  }
  return elements;
}

function inlineStyles(text) {
  const parts = [];
  const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
  let last = 0, m;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) parts.push(text.slice(last, m.index));
    if (m[2]) parts.push(<strong key={m.index} style={{ color: "var(--text-primary)", fontWeight: 700 }}>{m[2]}</strong>);
    else if (m[3]) parts.push(<em key={m.index} style={{ color: "var(--text-secondary)", fontStyle: "italic" }}>{m[3]}</em>);
    else if (m[4]) parts.push(<code key={m.index} style={{ background: "var(--accent-dim, rgba(8,145,178,0.1))", color: "var(--accent)", borderRadius: 3, padding: "1px 5px", fontSize: 12, fontFamily: "monospace" }}>{m[4]}</code>);
    last = m.index + m[0].length;
  }
  if (last < text.length) parts.push(text.slice(last));
  return parts.length === 1 && typeof parts[0] === "string" ? parts[0] : parts;
}

function EdgeMsg({ msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start" }}
    >
      {!isUser && (
        <div style={{
          fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
          color: "var(--accent)", marginBottom: 5, paddingLeft: 2,
          fontFamily: "'Plus Jakarta Sans', sans-serif",
        }}>EDGE</div>
      )}
      <div style={{
        maxWidth: isUser ? "78%" : "88%",
        padding: "11px 16px",
        borderRadius: isUser ? "14px 14px 3px 14px" : "14px 14px 14px 3px",
        background: isUser ? "var(--accent-dim, rgba(8,145,178,0.1))" : "var(--bg-tertiary)",
        border: isUser ? "1px solid var(--accent-border, rgba(8,145,178,0.25))" : "1px solid var(--border-primary)",
        color: "var(--text-primary)",
        fontSize: 14, lineHeight: 1.7, wordBreak: "break-word",
        fontFamily: "'Plus Jakarta Sans', sans-serif",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        boxShadow: "0 2px 12px rgba(0,0,0,0.08)",
      }}>
        {isUser ? msg.content : renderEdgeMarkdown(msg.content)}
      </div>
      <div style={{
        fontSize: 10, color: "var(--text-tertiary)", marginTop: 4,
        paddingLeft: isUser ? 0 : 2, paddingRight: isUser ? 2 : 0,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>
        {new Date(msg.ts).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
      </div>
    </motion.div>
  );
}

function EdgeTyping() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      transition={{ duration: 0.2 }}
      style={{ display: "flex", flexDirection: "column", alignItems: "flex-start" }}
    >
      <div style={{
        fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase",
        color: "var(--accent)", marginBottom: 5, paddingLeft: 2, fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}>EDGE</div>
      <div style={{
        padding: "11px 16px", borderRadius: "14px 14px 14px 3px",
        background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)",
        backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        <span style={{ fontSize: 13, color: "var(--text-tertiary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>Thinking</span>
        <TypingDots />
      </div>
    </motion.div>
  );
}

export function EdgeChatView({ supabase, user, trades }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [systemCtx, setSystemCtx] = useState("");
  const [ctxLoading, setCtxLoading] = useState(true);
  const [inputFocused, setInputFocused] = useState(false);
  const chatEndRef = useRef(null);
  const textareaRef = useRef(null);
  const hasMessages = messages.length > 0;

  useEffect(() => { buildSystemContext(); }, [trades.length]);

  const buildSystemContext = async () => {
    setCtxLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toISOString().slice(0, 10);
      const taken = trades.filter((t) => t.taken && t.taken !== "Missed");
      const profit = (t) => (t.profit ?? 0) + (t.profit_funded ?? 0);
      const wins = taken.filter((t) => profit(t) > 0).length;
      const netAll = taken.reduce((s, t) => s + profit(t), 0);
      const winRateAll = taken.length ? Math.round((wins / taken.length) * 100) : 0;
      const monthKey = todayStr.slice(0, 7);
      const monthTrades = taken.filter((t) => t.dt?.slice(0, 7) === monthKey);
      const monthWins = monthTrades.filter((t) => profit(t) > 0).length;
      const monthLosses = monthTrades.filter((t) => profit(t) < 0).length;
      const monthPnl = monthTrades.reduce((s, t) => s + profit(t), 0);
      const monthAplus = monthTrades.filter((t) => t.aplus?.startsWith("A+")).length;
      const monthARate = monthTrades.length ? Math.round((monthAplus / monthTrades.length) * 100) : 0;
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1));
      weekStart.setHours(0, 0, 0, 0);
      const weekTrades = taken.filter((t) => t.dt && new Date(t.dt) >= weekStart);
      const weekWins = weekTrades.filter((t) => profit(t) > 0).length;
      const weekLosses = weekTrades.filter((t) => profit(t) < 0).length;
      const weekPnl = weekTrades.reduce((s, t) => s + profit(t), 0);
      const sessionMap = new Map();
      taken.forEach((t) => {
        const d = t.dt?.slice(0, 10);
        if (!d) return;
        if (!sessionMap.has(d)) sessionMap.set(d, []);
        sessionMap.get(d).push(t);
      });
      const last5 = [...sessionMap.entries()]
        .sort((a, b) => b[0].localeCompare(a[0])).slice(0, 5)
        .map(([date, ts]) => {
          const w = ts.filter((t) => profit(t) > 0).length;
          const l = ts.filter((t) => profit(t) < 0).length;
          const pnl = ts.reduce((s, t) => s + profit(t), 0);
          const note = ts.find((t) => t.notes)?.notes?.slice(0, 60) || "";
          return `  ${date} | ${ts.length} trade${ts.length !== 1 ? "s" : ""} | ${w}W/${l}L | $${pnl.toFixed(0)}${note ? ` | "${note}"` : ""}`;
        });
      const allTimePersonal = taken.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
      const allTimeFunded = taken.reduce((s, t) => s + (parseFloat(t.profit_funded) || 0), 0);
      const monthPersonal = monthTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
      const monthFunded = monthTrades.reduce((s, t) => s + (parseFloat(t.profit_funded) || 0), 0);
      const weekPersonal = weekTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
      const weekFunded = weekTrades.reduce((s, t) => s + (parseFloat(t.profit_funded) || 0), 0);
      const scoreAllTime = buildAIScoreSection(taken);
      const scoreMonth = buildAIScoreSection(monthTrades);
      const tagPerfMap = {};
      taken.forEach((t) => {
        (t.tags || []).forEach((tag) => {
          if (!tagPerfMap[tag]) tagPerfMap[tag] = { trades: 0, wins: 0, pnl: 0 };
          tagPerfMap[tag].trades++;
          const p = profit(t);
          if (p > 0) tagPerfMap[tag].wins++;
          tagPerfMap[tag].pnl += p;
        });
      });
      const topTags = Object.entries(tagPerfMap)
        .sort((a, b) => b[1].trades - a[1].trades)
        .slice(0, 5)
        .map(([tag, s]) => `${tag}: ${s.trades} trades, ${s.wins} wins, $${s.pnl.toFixed(0)}`)
        .join(" | ") || "None logged";
      const modelPerfMap = {};
      taken.forEach((t) => {
        if (!t.model) return;
        if (!modelPerfMap[t.model]) modelPerfMap[t.model] = { trades: 0, wins: 0, pnl: 0 };
        modelPerfMap[t.model].trades++;
        const p = profit(t);
        if (p > 0) modelPerfMap[t.model].wins++;
        modelPerfMap[t.model].pnl += p;
      });
      const topModels = Object.entries(modelPerfMap)
        .sort((a, b) => b[1].trades - a[1].trades)
        .slice(0, 5)
        .map(([model, s]) => `${model}: ${s.trades} trades, ${s.wins} wins, $${s.pnl.toFixed(0)}`)
        .join(" | ") || "No model labels logged";
      const violationMap = {};
      taken.forEach((t) => (t.violations || []).forEach((v) => { violationMap[v] = (violationMap[v] || 0) + 1; }));
      const monthViolationMap = {};
      monthTrades.forEach((t) => (t.violations || []).forEach((v) => { monthViolationMap[v] = (monthViolationMap[v] || 0) + 1; }));
      const topViolations = Object.entries(violationMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => `${v}: ${c}x`).join(" | ") || "No violations logged";
      const monthViolations = Object.entries(monthViolationMap).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([v, c]) => `${v}: ${c}x`).join(" | ") || "No violations logged this month";
      let todayPlan = "No pre-trade plan filed for today.";
      try {
        const { data: plan } = await supabase.from("trade_plans").select("bias, key_levels, session_plan, notes").eq("user_id", user.id).eq("plan_date", todayStr).single();
        if (plan) todayPlan = `Bias: ${plan.bias || "–"} | Key levels: ${plan.key_levels || "–"} | Session plan: ${plan.session_plan || "–"} | Notes: ${plan.notes || "–"}`;
      } catch {}
      let notebookSection = "No journal entry found.";
      try {
        const { data: nbEntries } = await supabase.from("notebook_entries").select("entry_date, recap, eod_reflection").eq("user_id", user.id).order("entry_date", { ascending: false }).limit(1);
        if (nbEntries?.length) {
          const e = nbEntries[0];
          const dayTrades = taken.filter(t => t.dt?.slice(0, 10) === e.entry_date);
          const w = dayTrades.filter(t => profit(t) > 0).length;
          const l = dayTrades.filter(t => profit(t) < 0).length;
          const pnl = dayTrades.reduce((s, t) => s + profit(t), 0);
          const tradesSummary = dayTrades.length ? ` | Trades: ${dayTrades.length} (${w}W/${l}L, $${pnl.toFixed(0)})` : " | No trades logged";
          notebookSection = `${e.entry_date}${tradesSummary}\n  RECAP: ${e.recap || "(blank)"}\n  EOD REFLECTION: ${e.eod_reflection || "(blank)"}`;
        }
      } catch {}
      setSystemCtx(`${AI_COACH_TONE}

You are Edge, an elite trading coach inside TradeSharp. You work exclusively with this trader and know their full performance history.

TRADER PROFILE:
- Strategy: ICT-inspired fractal model (NQ/ES primary, NY session only, max 2 trades/day)
- Standard risk: $500/trade | Target: $1,000 (2R)
- A+ criteria requires ALL of: CIC/SMT, key level, TF alignment, CISD, ICCISD, TTFM, correct session time, min 1:2 R:R, defined stop
- Setup grades: A+ = clean plan execution | B = good setup, flawed execution | C = marginal/forced | F = no setup / rule break
- Losses beyond -$500 usually mean a moved stop or overexposure

PERFORMANCE SNAPSHOT (as of ${todayStr}):
ALL-TIME: ${taken.length} trades taken | ${winRateAll}% win rate | Net P&L: $${netAll.toFixed(0)}
ALL-TIME SPLIT: Personal $${allTimePersonal.toFixed(0)} | Funded $${allTimeFunded.toFixed(0)}
THIS MONTH (${monthKey}): ${monthTrades.length} taken | ${monthWins}W/${monthLosses}L | $${monthPnl.toFixed(0)} | A+ rate: ${monthARate}%
THIS MONTH SPLIT: Personal $${monthPersonal.toFixed(0)} | Funded $${monthFunded.toFixed(0)}
THIS WEEK: ${weekTrades.length} taken | ${weekWins}W/${weekLosses}L | $${weekPnl.toFixed(0)}
THIS WEEK SPLIT: Personal $${weekPersonal.toFixed(0)} | Funded $${weekFunded.toFixed(0)}
LAST 5 SESSIONS:
${last5.length ? last5.join("\n") : "  No recent sessions found."}
ALL-TIME TRADESHARP SCORE:
${scoreAllTime}

THIS MONTH TRADESHARP SCORE:
${scoreMonth}

RECURRING TAG PERFORMANCE:
${topTags}

RECURRING MODEL PERFORMANCE:
${topModels}

RULE VIOLATIONS:
ALL-TIME: ${topViolations}
THIS MONTH: ${monthViolations}

TODAY'S PLAN: ${todayPlan}

LATEST JOURNAL ENTRY:
${notebookSection}

COACHING STYLE: Be direct, analytical, firm, and specific. Use the numbers above. Prioritize execution mistakes, repeat leaks, and what needs to improve next over encouragement. Keep responses under 500 words unless a full breakdown is explicitly requested. Use headers and bullets for structured analysis.`);
    } catch {
      setSystemCtx(`${AI_COACH_TONE} Be direct, specific, and practical.`);
    } finally {
      setCtxLoading(false);
    }
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isLoading]);

  const callEdge = async (userMessage) => {
    const { data: { session } } = await supabase.auth.getSession();
    const apiMessages = [
      ...messages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: userMessage },
    ];
    const res = await fetch("/api/ai-summary", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}) },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 2000, system: systemCtx, messages: apiMessages }),
    });
    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { throw new Error("Unexpected response from AI service."); }
    if (!res.ok || data.error) throw new Error(data.error || `AI service error: ${res.status}`);
    return data.content?.map((c) => c.text || "").join("") || "No response received.";
  };

  const sendMessage = async (overrideText) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading || ctxLoading) return;
    const userMsg = { id: `${Date.now()}-u`, role: "user", content: text, ts: Date.now() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    if (textareaRef.current) { textareaRef.current.style.height = "auto"; }
    setIsLoading(true);
    try {
      const reply = await callEdge(text);
      setMessages((prev) => [...prev, { id: `${Date.now()}-a`, role: "assistant", content: reply, ts: Date.now() }]);
    } catch (e) {
      setMessages((prev) => [...prev, { id: `${Date.now()}-e`, role: "assistant", content: `Something went wrong: ${e.message}`, ts: Date.now() }]);
    } finally {
      setIsLoading(false);
      setTimeout(() => textareaRef.current?.focus(), 50);
    }
  };

  return (
    <div style={{
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex", flexDirection: "column", alignItems: "center",
      paddingBottom: 40,
    }}>
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        style={{ width: "100%", maxWidth: 660, textAlign: "center", marginBottom: 28 }}
      >
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: "0.2em",
          textTransform: "uppercase", color: "var(--accent)", marginBottom: 10,
        }}>EDGE AI</div>
        <h2 style={{
          fontSize: 26, fontWeight: 800, letterSpacing: "-0.03em", margin: "0 0 10px",
          color: "var(--text-primary)",
        }}>
          Talk to Edge.
        </h2>
        <motion.div
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: "100%", opacity: 1 }}
          transition={{ delay: 0.35, duration: 0.7 }}
          style={{ height: 1, background: "linear-gradient(90deg, transparent, var(--border-primary), transparent)", marginBottom: 10 }}
        />
        <p style={{ fontSize: 13, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.6 }}>
          Your AI trading coach — powered by your actual data.
        </p>
      </motion.div>

      {/* ── Prompt cards (disappear once conversation starts) ── */}
      <AnimatePresence>
        {!hasMessages && (
          <motion.div
            key="prompts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35 }}
            style={{
              width: "100%", maxWidth: 660,
              display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 12,
            }}
          >
            {EDGE_PROMPTS.map((p, i) => (
              <motion.button
                key={p.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 + i * 0.07, duration: 0.28 }}
                onClick={() => sendMessage(p.example)}
                disabled={ctxLoading}
                whileHover={!ctxLoading ? { y: -2, scale: 1.01 } : {}}
                whileTap={!ctxLoading ? { scale: 0.98 } : {}}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "flex-start",
                  gap: 8, padding: "14px 16px", borderRadius: 14, textAlign: "left",
                  background: `rgba(${p.colorRaw}, 0.08)`,
                  border: `1px solid rgba(${p.colorRaw}, 0.28)`,
                  cursor: ctxLoading ? "not-allowed" : "pointer",
                  opacity: ctxLoading ? 0.45 : 1,
                  transition: "background 0.15s, border-color 0.15s",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                }}
                onMouseEnter={(e) => { if (!ctxLoading) e.currentTarget.style.background = `rgba(${p.colorRaw}, 0.14)`; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(${p.colorRaw}, 0.08)`; }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                  <span style={{ color: p.color, display: "flex", alignItems: "center" }}>{p.icon}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: p.color }}>
                    {p.label}
                  </span>
                </div>
                <p style={{
                  margin: 0, fontSize: 13, lineHeight: 1.6,
                  color: "var(--text-tertiary)", fontStyle: "italic",
                }}>
                  "{p.example}"
                </p>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Chat card (grows with conversation) ── */}
      <motion.div
        layout
        transition={{ layout: { duration: 0.35, ease: [0.4, 0, 0.2, 1] } }}
        style={{
          width: "100%", maxWidth: 660,
          borderRadius: 18,
          background: "var(--bg-secondary)",
          backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)",
          border: "1px solid var(--border-primary)",
          boxShadow: "var(--card-glow)",
          overflow: "hidden", position: "relative",
        }}
      >
        {/* Ambient glow — top */}
        <div style={{
          position: "absolute", top: -40, left: "20%", width: 200, height: 200,
          background: "radial-gradient(circle, rgba(34,211,238,0.05) 0%, transparent 70%)",
          borderRadius: "50%", pointerEvents: "none",
        }} />

        {/* Messages area — only shown when conversation exists */}
        <AnimatePresence>
          {hasMessages && (
            <motion.div
              key="messages"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                maxHeight: 520, overflowY: "auto",
                padding: "20px 24px 8px",
                display: "flex", flexDirection: "column", gap: 16,
                WebkitOverflowScrolling: "touch",
              }}
            >
              {messages.map((msg) => <EdgeMsg key={msg.id} msg={msg} />)}
              <AnimatePresence>
                {isLoading && <EdgeTyping key="thinking" />}
              </AnimatePresence>
              <div ref={chatEndRef} />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Context loading hint — shown only before first message */}
        {!hasMessages && ctxLoading && (
          <div style={{
            padding: "14px 24px 0",
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ fontSize: 12, color: "var(--text-tertiary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
              Loading your trading context
            </span>
            <TypingDots />
          </div>
        )}

        {/* Input area */}
        <div style={{ padding: "14px 16px 14px", position: "relative" }}>
          {/* New chat button — only when conversation exists */}
          {hasMessages && (
            <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 8 }}>
              <button
                onClick={() => setMessages([])}
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: "0.05em",
                  padding: "4px 12px", borderRadius: 20,
                  background: "transparent", border: "1px solid var(--border-primary)",
                  color: "var(--text-tertiary)", cursor: "pointer",
                  fontFamily: "'Plus Jakarta Sans', sans-serif",
                  transition: "all 0.15s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-secondary)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
              >
                New Chat
              </button>
            </div>
          )}

          {/* Input box */}
          <div style={{
            display: "flex", alignItems: "flex-end", gap: 10,
            background: "var(--bg-tertiary)",
            border: `1px solid ${inputFocused ? "var(--accent)" : "var(--border-primary)"}`,
            borderRadius: 12, padding: "10px 12px",
            transition: "border-color 0.2s",
            boxShadow: inputFocused ? "0 0 0 3px var(--accent-dim, rgba(8,145,178,0.08))" : "none",
          }}>
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onInput={(e) => {
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
              }}
              onFocus={() => setInputFocused(true)}
              onBlur={() => setInputFocused(false)}
              placeholder={ctxLoading ? "Loading your trading context..." : "Ask Edge anything..."}
              disabled={isLoading || ctxLoading}
              rows={1}
              style={{
                flex: 1, resize: "none", overflow: "hidden", boxSizing: "border-box",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
                fontSize: 14, lineHeight: 1.55,
                color: "var(--text-primary)",
                background: "transparent", border: "none", outline: "none",
                minHeight: 26, maxHeight: 120,
                opacity: ctxLoading ? 0.4 : 1,
              }}
            />
            <motion.button
              onClick={() => sendMessage()}
              disabled={isLoading || ctxLoading || !input.trim()}
              whileHover={input.trim() && !isLoading && !ctxLoading ? { scale: 1.06 } : {}}
              whileTap={input.trim() && !isLoading && !ctxLoading ? { scale: 0.94 } : {}}
              style={{
                flexShrink: 0, width: 34, height: 34, borderRadius: 8,
                display: "flex", alignItems: "center", justifyContent: "center",
                background: input.trim() && !isLoading && !ctxLoading
                  ? "var(--text-primary)" : "var(--bg-tertiary)",
                border: "1px solid var(--border-primary)",
                color: input.trim() && !isLoading && !ctxLoading ? "var(--bg-primary)" : "var(--text-tertiary)",
                cursor: input.trim() && !isLoading && !ctxLoading ? "pointer" : "not-allowed",
                transition: "background 0.2s, color 0.2s",
                boxShadow: "none",
              }}
            >
              {isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                  style={{ width: 14, height: 14, borderRadius: "50%", border: "2px solid var(--border-primary)", borderTopColor: "var(--accent)" }}
                />
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="19" x2="12" y2="5"/>
                  <polyline points="5 12 12 5 19 12"/>
                </svg>
              )}
            </motion.button>
          </div>
          <div style={{ marginTop: 7, fontSize: 10, color: "rgba(160,163,181,0.3)", textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </motion.div>
    </div>
  );
}

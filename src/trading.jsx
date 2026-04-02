import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

// ─── PRIVACY HELPER ─────────────────────────────────────────────────────────
const MASK = "$•••••";
const pm = (val, privacyMode) => privacyMode ? MASK : val;

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const DEFAULT_CHECKLIST_ITEMS = [
  { label: "1 or 2 Stage Crack in Correlation (CIC)", sub: "SMT and/or PSP confirmed" },
  { label: "Key Level / Liquidity", sub: "Price at significant level or liquidity pool" },
  { label: "Timeframe Alignment", sub: "Higher TF in agreement with entry TF" },
  { label: "CISD", sub: "Change in state of delivery confirmed" },
  { label: "ICCISD", sub: "Inter-Candle Change in State of Delivery" },
  { label: "TTFM", sub: "The Fractal Model" },
  { label: "Session / Time of Day", sub: "London, NY open or high-probability session" },
  { label: "Risk/Reward Ratio", sub: "Minimum 1:2 R:R confirmed" },
  { label: "Stop Loss Defined", sub: "Clear invalidation level set" },
];

const TIMER_ITEM = { label: "Is it reallllllllllllly an A+ trade? 🤔", sub: "Take 10 seconds. Be honest with yourself.", timer: true };

const ASSETS = ["$NQ", "$ES", "$GC", "$SI", "$YM", "$CL"];
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

const TagPicker = ({ selected, onChange }) => (
  <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginTop: 8 }}>
    {TRADE_TAGS.map(({ label, color }) => {
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

const TradeTagChips = ({ tags }) => {
  if (!tags || tags.length === 0) return null;
  return (
    <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginTop: 4 }}>
      {tags.map(label => {
        const def = TRADE_TAGS.find(t => t.label === label);
        const color = def ? def.color : "var(--text-tertiary)";
        return (
          <span key={label} style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 9, fontWeight: 700, letterSpacing: "0.07em",
            padding: "2px 7px", borderRadius: 3,
            border: `1px solid ${color}`,
            background: `${color}18`,
            color,
          }}>#{label}</span>
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

const VALID_ASSETS = new Set(["$NQ", "$ES", "$GC", "$SI", "$YM", "$CL"]);
const VALID_DIRECTIONS = new Set(["Long", "Short", ""]);
const VALID_APLUS = new Set(["Yes", "No", "Yes to No", "Yes But Execution Sucked", ""]);
const VALID_TAKEN = new Set(["Missed", "Personal", "Eval", "PA & Funded", "Crypto", "Funded Account", ""]);
const VALID_BIAS = new Set(["Bullish", "Bearish", ""]);
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
  const isAplusSetup = (t) => t.aplus === "Yes" || t.aplus === "Yes But Execution Sucked";
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

function calcTradingXP(trades, dayMap) {
  let xp = 0;
  trades.forEach((t) => {
    xp += 10;
    if (t.aplus === "Yes") xp += 15;
    if (parseFloat(t.profit) > 0) xp += 20;
    if (t.notes && t.notes.length > 10) xp += 5;
  });
  Object.values(dayMap).forEach((d) => { if (d.pnl > 0) xp += 25; });
  return xp;
}

function validateTradeForm({ formDt, formAsset, formDirection, formAplus, formTaken, formBias, formProfit, formProfitFunded, formChart, formAfter }) {
  if (!formDt || !formAsset) return "Please fill in Date & Time and Asset at minimum.";
  if (!VALID_ASSETS.has(formAsset)) return "Invalid asset selected.";
  if (formDirection && !VALID_DIRECTIONS.has(formDirection)) return "Invalid direction.";
  if (formAplus && !VALID_APLUS.has(formAplus)) return "Invalid A+ value.";
  if (formTaken && !VALID_TAKEN.has(formTaken)) return "Invalid Taken value.";
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

function buildDayMap(trades, mode = "personal") {
  const m = {};
  trades.forEach((t) => {
    if (!t.dt) return;
    const k = dateKey(t.dt);
    if (!m[k]) m[k] = { pnl: 0, count: 0, trades: [], aplusTrades: 0 };
    m[k].pnl += getPnlForMode(t, mode);
    if (t.taken) m[k].count++;
    m[k].trades.push(t);
    if (t.aplus === "Yes" || t.aplus === "Yes But Execution Sucked") m[k].aplusTrades++;
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

  // A+ Discipline — setup quality (Yes + Yes But Execution Sucked = setup was valid)
  const isAplusSetup = (t) => t.aplus === "Yes" || t.aplus === "Yes But Execution Sucked";
  const aplusCount = valid.filter(isAplusSetup).length;
  const aplusPct = valid.length ? aplusCount / valid.length : 0;

  // Execution quality — of A+ setups, how many had poor execution
  const execSuckedCount = valid.filter((t) => t.aplus === "Yes But Execution Sucked").length;
  const execQualityPct = aplusCount > 0 ? ((aplusCount - execSuckedCount) / aplusCount) * 100 : null;

  // Post-review corrections — trades initially marked A+ but walked back
  const yesToNoCount = valid.filter((t) => t.aplus === "Yes to No").length;

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

function TradeSharpScore({ trades, month }) {
  const result = useMemo(() => calcTradeSharpScore(trades), [trades]);
  if (!result) {
    return (
      <TCard style={{ padding: 28, marginBottom: 24, textAlign: "center" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>TRADESHARP SCORE</div>
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
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>
            TRADESHARP SCORE
          </div>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
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
                {execSuckedCount > 0 ? `${execSuckedCount} of ${aplusCount} A+ trades left money on table` : `All ${aplusCount} A+ setups executed cleanly`}
              </div>
            </div>
          )}
          {yesToNoCount > 0 && (
            <div style={{
              flex: 1, minWidth: 180, padding: "12px 16px", borderRadius: 6,
              background: "rgba(34,211,238,0.06)", border: "1px solid rgba(34,211,238,0.2)",
            }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 4 }}>REVIEW HONESTY</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--accent)" }}>
                {yesToNoCount} trade{yesToNoCount > 1 ? "s" : ""} corrected
              </div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>
                Caught on review — good self-awareness
              </div>
            </div>
          )}
        </div>
      )}

      {/* Pillar Breakdown */}
      <div style={{ padding: "0 28px 28px" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>
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
        loaded = [{ id: makeModelId(), name: "GxT", items: data.items }];
      } else {
        loaded = [{ id: makeModelId(), name: "GxT", items: DEFAULT_CHECKLIST_ITEMS }];
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
    if (models.length <= 1) { alert("You need at least one model."); return; }
    if (!window.confirm("Delete this model and all its checklist items?")) return;
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
    if (editItems.length >= 20) { alert("Maximum 20 items."); return; }
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
      <TCard style={{ padding: 28, background: "linear-gradient(160deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 60%, rgba(34,211,238,0.02) 100%)" }}>

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
                {!isActive && models.length > 1 && (
                  <button onClick={() => deleteModel(m.id)} title="Delete model" style={{ background: "none", border: "none", cursor: "pointer", fontSize: 11, color: "var(--text-tertiary)", padding: "0 2px", lineHeight: 1 }}>✕</button>
                )}
              </div>
            );
          })}

          {/* Add new model */}
          {addingModel ? (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <input
                autoFocus
                placeholder="Model name..."
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") addModel(); if (e.key === "Escape") { setAddingModel(false); setNewModelName(""); } }}
                maxLength={30}
                style={{
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 600,
                  padding: "5px 10px", borderRadius: 20, border: "1.5px solid var(--border-primary)",
                  background: "var(--bg-tertiary)", color: "var(--text-primary)", outline: "none", width: 120,
                }}
              />
              <button onClick={addModel} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "5px 12px", borderRadius: 20, border: "1px solid var(--green)", background: "transparent", color: "var(--green)", cursor: "pointer" }}>ADD</button>
              <button onClick={() => { setAddingModel(false); setNewModelName(""); }} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-tertiary)" }}>✕</button>
            </div>
          ) : (
            <button onClick={() => setAddingModel(true)} style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700,
              padding: "5px 12px", borderRadius: 20, border: "1px dashed var(--border-primary)",
              background: "transparent", color: "var(--text-tertiary)", cursor: "pointer", transition: "all 0.15s",
              letterSpacing: "0.04em",
            }}>+ New Model</button>
          )}

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

export function JournalView({ supabase, user, loadTrades, syncToSheets, gsUrl }) {
  // Plan state (loaded silently for Sheets trade sync)
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
    if (syncToSheets) syncToSheets({ type: "mood", mood: m, dt: new Date().toISOString(), dtFormatted: fmtDate(new Date()) });
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
  const [formChart, setFormChart] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [formAfterThoughts, setFormAfterThoughts] = useState("");
  const [formTags, setFormTags] = useState([]);
  const [formAccountPersonal, setFormAccountPersonal] = useState("");
  const [formAccountFunded, setFormAccountFunded] = useState("");

  // Accounts for selectors
  const [accounts, setAccounts] = useState([]);
  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type,status").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setAccounts(data); });
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
    const err = validateTradeForm({ formDt, formAsset, formDirection, formAplus, formTaken, formBias, formProfit, formProfitFunded, formChart, formAfter });
    if (err) { alert(err); return; }
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
      ...(formProfitFunded ? { profit_funded: parseFloat(formProfitFunded) } : {}),
      ...(formTags.length > 0 ? { tags: formTags } : {}),
      ...(formAccountPersonal ? { account_id_personal: formAccountPersonal } : {}),
      ...(formAccountFunded ? { account_id_funded: formAccountFunded } : {}),
    };
    const { error } = await supabase.from("trades").insert(tradeData);
    if (error) { alert("Error saving trade: " + error.message); return; }
    if (syncToSheets) syncToSheets({
      type: "trade",
      ...tradeData,
      tags: tradeData.tags ? tradeData.tags.join(",") : "",
      after: tradeData.after_chart,
      dtFormatted: fmtDate(formDt),
      preMarketJournal: plan.session_plan || "",
      mood: mood || "",
    });
    await recalcAccountPnl(supabase, formAccountPersonal, "profit");
    setFormAsset(""); setFormDirection(""); setFormAplus("");
    setFormTaken(""); setFormProfit(""); setFormProfitFunded(""); setFormChart("");
    setFormAfter(""); setFormNotes(""); setFormAfterThoughts(""); setFormTags([]); setFormAccountPersonal(""); setFormAccountFunded(""); setFormDt(nowLocal());
    loadTrades();
  };

  return (
    <div>
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
            <select style={selectStyle} value={formAsset} onChange={(e) => setFormAsset(e.target.value)}>
              <option value="">Select...</option>
              {ASSETS.map((a) => <option key={a}>{a}</option>)}
            </select>
          </Field>
          <Field label="Direction">
            <select style={selectStyle} value={formDirection} onChange={(e) => setFormDirection(e.target.value)}>
              <option value="">Select...</option>
              <option>Long</option>
              <option>Short</option>
            </select>
          </Field>
          <Field label="A+ Trade?">
            <select style={selectStyle} value={formAplus} onChange={(e) => setFormAplus(e.target.value)}>
              <option value="">Select...</option>
              <option>Yes</option>
              <option>No</option>
              <option>Yes to No</option>
              <option>Yes But Execution Sucked</option>
            </select>
          </Field>
          <Field label="Taken?">
            <select style={selectStyle} value={formTaken} onChange={(e) => setFormTaken(e.target.value)}>
              <option value="">Select...</option>
              <option>Missed</option>
              <option>Personal</option>
              <option>Eval</option>
              <option>PA &amp; Funded</option>
              <option>Crypto</option>
              <option>Funded Account</option>
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
            <TagPicker selected={formTags} onChange={setFormTags} />
          </Field>
        </div>
        <button onClick={logTrade} style={{
          fontFamily: "'Plus Jakarta Sans', sans-serif", width: "100%", padding: 13, fontSize: 13, fontWeight: 700, border: "1px solid var(--accent)", borderRadius: 4, cursor: "pointer",
          background: "transparent", color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase",
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

export function QuickLogModal({ supabase, user, onClose, syncToSheets }) {
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
  const [formTags, setFormTags] = useState([]);
  const [formAccountPersonal, setFormAccountPersonal] = useState("");
  const [formAccountFunded, setFormAccountFunded] = useState("");
  const [accounts, setAccounts] = useState([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setAccounts(data); });
  }, [user]);

  const logTrade = async () => {
    const err = validateTradeForm({ formDt, formAsset, formDirection, formAplus, formTaken, formBias, formProfit, formProfitFunded, formChart, formAfter });
    if (err) { alert(err); return; }
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
      ...(formProfitFunded ? { profit_funded: parseFloat(formProfitFunded) } : {}),
      ...(formTags.length > 0 ? { tags: formTags } : {}),
      ...(formAccountPersonal ? { account_id_personal: formAccountPersonal } : {}),
      ...(formAccountFunded ? { account_id_funded: formAccountFunded } : {}),
    };
    const { error } = await supabase.from("trades").insert(tradeData);
    setSaving(false);
    if (error) { alert("Error saving trade: " + error.message); return; }
    if (syncToSheets) syncToSheets({
      type: "trade",
      ...tradeData,
      tags: tradeData.tags ? tradeData.tags.join(",") : "",
      after: tradeData.after_chart,
      dtFormatted: fmtDate(formDt),
      preMarketJournal: "",
      mood: "",
    });
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
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
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
              <select style={selectStyle} value={formAsset} onChange={(e) => setFormAsset(e.target.value)}>
                <option value="">Select...</option>
                {ASSETS.map((a) => <option key={a}>{a}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <select style={selectStyle} value={formDirection} onChange={(e) => setFormDirection(e.target.value)}>
                <option value="">Select...</option>
                <option>Long</option>
                <option>Short</option>
              </select>
            </Field>
            <Field label="A+ Trade?">
              <select style={selectStyle} value={formAplus} onChange={(e) => setFormAplus(e.target.value)}>
                <option value="">Select...</option>
                <option>Yes</option>
                <option>No</option>
                <option>Yes to No</option>
                <option>Yes But Execution Sucked</option>
              </select>
            </Field>
            <Field label="Taken?">
              <select style={selectStyle} value={formTaken} onChange={(e) => setFormTaken(e.target.value)}>
                <option value="">Select...</option>
                <option>Missed</option>
                <option>Personal</option>
                <option>Eval</option>
                <option>PA &amp; Funded</option>
                <option>Crypto</option>
                <option>Funded Account</option>
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
              <TagPicker selected={formTags} onChange={setFormTags} />
            </Field>
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
// TRADE REVIEW MODAL
// ═══════════════════════════════════════════════════════════════════════════

const APLUS_OPTIONS = ["Yes", "No", "Yes to No", "Yes But Execution Sucked"];

const aplusColor = (v) => {
  if (v === "Yes") return "var(--green)";
  if (v === "No") return "var(--red)";
  if (v === "Yes to No") return "#f59e0b";
  if (v === "Yes But Execution Sucked") return "#a78bfa";
  return "var(--text-tertiary)";
};


function TradeReviewModal({ trades, supabase, user, loadTrades, onClose, privacyMode }) {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const [filterMonth, setFilterMonth] = useState(currentMonth);
  const [filterTag, setFilterTag] = useState("all");
  const [rowSaving, setRowSaving] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [rowEdits, setRowEdits] = useState({});
  const [modalAccounts, setModalAccounts] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type,status").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setModalAccounts(data); });
  }, [user]);

  const allMonths = [...new Set(trades.filter(t => t.dt).map(t => t.dt.slice(0, 7)))].sort().reverse();
  if (!allMonths.includes(currentMonth)) allMonths.unshift(currentMonth);

  const monthLabel = (m) => {
    const [y, mo] = m.split("-");
    return new Date(parseInt(y), parseInt(mo) - 1, 1).toLocaleString("default", { month: "long", year: "numeric" });
  };

  const filtered = trades.filter(t => {
    if (!t.dt || t.dt.slice(0, 7) !== filterMonth) return false;
    if (filterTag === "aplus") return t.aplus === "Yes" || t.aplus === "Yes But Execution Sucked";
    if (filterTag === "nonaplus") return t.aplus === "No" || t.aplus === "Yes to No";
    if (filterTag === "exec") return t.aplus === "Yes But Execution Sucked";
    if (filterTag === "corrected") return t.aplus === "Yes to No";
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
      account_id_personal: t.account_id_personal || "",
      account_id_funded: t.account_id_funded || "",
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
      background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)",
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
        <div style={{ display: "flex", gap: 6, padding: "14px 24px", borderBottom: "1px solid var(--border-primary)", flexShrink: 0, flexWrap: "wrap" }}>
          {tagBtn("all", "All")}
          {tagBtn("aplus", "A+ Setups")}
          {tagBtn("nonaplus", "Non A+")}
          {tagBtn("exec", "Execution Issues")}
          {tagBtn("corrected", "Yes → No")}
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
                  {["Date", "Asset", "Dir", "A+ Setup", "Taken", "Personal P&L", "Funded P&L", "Chart", "After", "Notes", "After Thoughts", ""].map(h => (
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
                              border: `1px solid ${aplusColor(t.aplus)}40`,
                              background: `${aplusColor(t.aplus)}10`,
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
                        <TradeTagChips tags={t.tags} />
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
                          <td colSpan={12} style={{ padding: "0 0 2px 0", background: "var(--bg-tertiary)" }}>
                            <div style={{ padding: "20px 24px", borderTop: "2px solid var(--accent)", borderBottom: "1px solid var(--border-primary)" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12, marginBottom: 14 }}>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Asset</div>
                                  <select value={ed.asset} onChange={e => setField(t.id, "asset", e.target.value)} style={inpStyle}>
                                    <option value="">—</option>
                                    {ASSETS.map(a => <option key={a}>{a}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Direction</div>
                                  {sel("direction", ["Long", "Short"])}
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
                                <TagPicker selected={ed.tags || []} onChange={val => setField(t.id, "tags", val)} />
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
            { label: "A+ Setups", val: filtered.filter(t => t.aplus === "Yes" || t.aplus === "Yes But Execution Sucked").length, color: "var(--green)" },
            { label: "Exec Issues", val: filtered.filter(t => t.aplus === "Yes But Execution Sucked").length, color: "#a78bfa" },
            { label: "Yes → No", val: filtered.filter(t => t.aplus === "Yes to No").length, color: "#f59e0b" },
            { label: "Non-A+", val: filtered.filter(t => t.aplus === "No").length, color: "var(--red)" },
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

export function TradeStatsView({ supabase, user, trades, loadTrades, privacyMode }) {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [dayPopup, setDayPopup] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [pnlMode, setPnlMode] = useState("personal");
  const [showReview, setShowReview] = useState(false);
  const [accounts, setAccounts] = useState([]);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("id,firm,account_name,account_type,status").eq("user_id", user.id).order("created_at", { ascending: false }).then(({ data }) => { if (data) setAccounts(data); });
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
    if (!window.confirm("Delete this trade entry?")) return;
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
      chart: trade.chart || "", after_chart: trade.after_chart || "",
      notes: trade.notes || "", after_thoughts: trade.after_thoughts || "",
      tags: trade.tags || [],
      account_id_personal: trade.account_id_personal || "",
      account_id_funded: trade.account_id_funded || "",
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
      chart: editForm.chart, after_chart: editForm.after_chart, notes: editForm.notes,
      after_thoughts: editForm.after_thoughts,
      tags: editForm.tags && editForm.tags.length > 0 ? editForm.tags : null,
      account_id_personal: editForm.account_id_personal || null,
      account_id_funded: editForm.account_id_funded || null,
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
  const aplus = monthTrades.filter((t) => t.aplus === "Yes").length;
  const wins = monthTrades.filter((t) => t.taken && t.taken !== "Missed" && getPnlForMode(t, pnlMode) > 0).length;
  const wr = taken ? Math.round((wins / taken) * 100) : 0;
  const pnl = monthTrades.reduce((s, t) => s + getPnlForMode(t, pnlMode), 0);

  // Calendar
  const calPrev = () => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); };
  const calNext = () => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); };
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayDate = new Date();

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <PageBanner
        label="TRADE STATS"
        title="Numbers don't lie. Let the data guide you."
        subtitle="P&L calendar, equity curve, and trade history — your performance at a glance."
      />

      {/* Stats Bar */}
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })} Stats
      </div>
      <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatBox value={total} label="Logged" color="var(--text-secondary)" />
        <StatBox value={taken} label="Taken" color="var(--text-secondary)" />
        <StatBox value={aplus} label="A+ Setups" color="var(--green)" />
        <StatBox value={`${wr}%`} label="Win Rate" color={wr >= 50 ? "var(--green)" : "var(--red)"} />
        <StatBox value={privacyMode ? MASK : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`} label="Net P&L" color={pnl >= 0 ? "var(--green)" : "var(--red)"} />
      </div>

      {/* Equity Curve */}
      <TCard style={{ padding: 28, marginBottom: 24, overflow: "hidden", background: "linear-gradient(160deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 60%, rgba(34,211,238,0.03) 100%)" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
          EQUITY CURVE
        </div>
        <canvas ref={chartRef} height={120} style={{ width: "100%", borderRadius: 8 }} />
      </TCard>

      {/* P&L Calendar */}
      <TCard style={{ marginBottom: 24, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>P&L CALENDAR</div>
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
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", padding: 6, letterSpacing: "0.05em" }}>{d}</div>
            ))}
          </div>
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
            {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const d = i + 1;
              const k = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
              const data = dayMap[k];
              const isToday = todayDate.getFullYear() === calYear && todayDate.getMonth() === calMonth && todayDate.getDate() === d;
              const isGreen = data && data.pnl >= 0;
              const isRed = data && data.pnl < 0;
              return (
                <div
                  key={d}
                  onClick={data ? () => setDayPopup({ day: d, k, data }) : undefined}
                  className="cal-day"
                  style={{
                    minHeight: 76, borderRadius: 6, padding: "8px 10px", fontSize: 13,
                    border: `1px solid ${isGreen ? "var(--green)" : isRed ? "var(--red)" : "var(--border-primary)"}`,
                    background: isGreen ? "var(--accent-glow)" : isRed ? "rgba(239,68,68,0.06)" : "var(--bg-tertiary)",
                    cursor: data ? "pointer" : "default",
                    boxShadow: isToday ? "0 0 0 2px var(--accent-secondary)" : isGreen ? "none" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div className="cal-day-num" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: isGreen ? "var(--green)" : isRed ? "var(--red)" : "var(--text-tertiary)", marginBottom: 4 }}>{d}</div>
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
            })}
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

      {/* Trade History Table */}
      <TCard style={{ overflow: "hidden", marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)", flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>TRADE HISTORY</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", opacity: 0.6 }}>{new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })}</div>
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
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
                const headers = ["Date", "Asset", "Direction", "A+", "Taken", "Bias", "Personal P&L", "Funded P&L", "Notes", "After Thoughts", "Tags", "Chart URL", "After Chart URL"];
                const rows = monthTrades.map((t) => [
                  t.dt ? new Date(t.dt).toLocaleString() : "",
                  t.asset || "",
                  t.direction || "",
                  t.aplus || "",
                  t.taken || "",
                  t.bias || "",
                  t.profit != null ? t.profit : "",
                  t.profit_funded != null ? t.profit_funded : "",
                  `"${(t.notes || "").replace(/"/g, '""')}"`,
                  `"${(t.after_thoughts || "").replace(/"/g, '""')}"`,
                  (t.tags || []).map(tag => `#${tag}`).join(" "),
                  t.chart || "",
                  t.after_chart || "",
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
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)", fontSize: 16 }}>No trades logged for {new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })}.</div>
        ) : (
          <div className="trade-table" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-primary)" }}>
                  {["Date", "Asset", "Dir", "A+", "Taken", "Bias", "Personal", "Funded", "Chart", "After", "Notes", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthTrades.map((t) => {
                  const p = parseFloat(t.profit);
                  const pf = parseFloat(t.profit_funded);
                  const cellStyle = { padding: "10px 12px", borderTop: "1px solid var(--border-primary)", whiteSpace: "nowrap", fontSize: 12 };
                  return (
                    <tr key={t.id} style={{ transition: "background 0.15s" }}>
                      <td style={{ ...cellStyle, color: "var(--text-secondary)" }}>{t.dt ? new Date(t.dt).toLocaleDateString([], { month: "short", day: "numeric" }) : "—"}</td>
                      <td style={{ ...cellStyle, fontWeight: 600, color: "var(--text-primary)" }}>{t.asset}</td>
                      <td style={cellStyle}>
                        {t.direction === "Long" ? <span style={{ color: "var(--accent-secondary)" }}>LONG</span> : t.direction === "Short" ? <span style={{ color: "var(--red)" }}>SHORT</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.aplus === "Yes" ? <span style={{ color: "var(--green)" }}>YES</span> : t.aplus === "No" ? <span style={{ color: "var(--red)" }}>NO</span> : "—"}
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
                        {safeUrl(t.chart) ? <a href={safeUrl(t.chart)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {safeUrl(t.after_chart) ? <a href={safeUrl(t.after_chart)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 160, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis" }} title={t.notes}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.notes || "—"}</div>
                        <TradeTagChips tags={t.tags} />
                      </td>
                      <td style={{ ...cellStyle, whiteSpace: "nowrap" }}>
                        <button onClick={() => openEdit(t)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--accent-secondary)", padding: "2px 6px" }}>✏️</button>
                        <button onClick={() => deleteTrade(t.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-tertiary)", padding: "2px 6px" }}>✕</button>
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
          onClose={() => setShowReview(false)}
        />
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(12px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <TCard className="modal-card" style={{ padding: 32, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 16px 48px rgba(0,0,0,0.6)" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.08em" }}>EDIT TRADE</div>
            <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 20 }}>
              <Field label="Date & Time">
                <input type="datetime-local" style={inputStyle} value={editForm.dt} onChange={(e) => setEditForm({ ...editForm, dt: e.target.value })} />
              </Field>
              <Field label="Asset">
                <select style={selectStyle} value={editForm.asset} onChange={(e) => setEditForm({ ...editForm, asset: e.target.value })}>
                  <option value="">Select...</option>
                  {ASSETS.map((a) => <option key={a}>{a}</option>)}
                </select>
              </Field>
              <Field label="Direction">
                <select style={selectStyle} value={editForm.direction} onChange={(e) => setEditForm({ ...editForm, direction: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Long</option>
                  <option>Short</option>
                </select>
              </Field>
              <Field label="A+ Trade?">
                <select style={selectStyle} value={editForm.aplus} onChange={(e) => setEditForm({ ...editForm, aplus: e.target.value })}>
                  <option value="">Select...</option>
                  <option>Yes</option>
                  <option>No</option>
                  <option>Yes to No</option>
                  <option>Yes But Execution Sucked</option>
                </select>
              </Field>
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

      {/* ── AI Trading Summary ── */}
      <AISummarySection trades={trades} />

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

function AISummarySection({ trades }) {
  const [apiKey, setApiKey] = useState(() => { try { return localStorage.getItem("aiApiKey") || ""; } catch { return ""; } });
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

    if (!apiKey) { setOutput("No API key set. Add your Anthropic API key in Profile settings."); setPeriod(label); return; }

    setPeriod(label); setLoading(true); setOutput("");
    let taken = 0, wins = 0, losses = 0, aplusTaken = 0, execSucked = 0, yesToNo = 0, nonAplus = 0, missed = 0, totalPnl = 0, totalFundedPnl = 0;
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
      if (t.aplus === "Yes" || t.aplus === "Yes But Execution Sucked") aplusTaken++;
      if (t.aplus === "Yes But Execution Sucked") execSucked++;
      if (t.aplus === "Yes to No") yesToNo++;
      if (t.aplus === "No") nonAplus++;
    });

    // TradeSharp Score for the period
    const tsResult = calcTradeSharpScore(periodTrades);
    const tsSection = tsResult
      ? `TRADESHARP SCORE: ${tsResult.composite}/100 (${tsResult.composite >= 80 ? "ELITE" : tsResult.composite >= 60 ? "SOLID" : tsResult.composite >= 40 ? "DEVELOPING" : "NEEDS WORK"})
PILLAR BREAKDOWN:
${tsResult.pillars.map((pl) => `  ${pl.label}: ${pl.display} (score: ${Math.round(pl.score)}/100)`).join("\n")}
EXECUTION QUALITY: ${tsResult.execQualityPct != null ? tsResult.execQualityPct.toFixed(0) + "% of A+ setups executed cleanly" : "N/A"}`
      : "TRADESHARP SCORE: Insufficient data for this period";

    // Tag-based win/loss breakdown
    const tagMap = {};
    periodTrades.forEach((t) => {
      if (t.tags && t.tags.length > 0) {
        t.tags.forEach((tag) => {
          if (!tagMap[tag]) tagMap[tag] = { trades: 0, wins: 0, losses: 0, pnl: 0 };
          tagMap[tag].trades++;
          const pv = parseFloat(t.profit);
          if (!isNaN(pv) && pv > 0) tagMap[tag].wins++;
          if (!isNaN(pv) && pv < 0) tagMap[tag].losses++;
          if (!isNaN(pv)) tagMap[tag].pnl += pv;
        });
      }
    });
    const tagSection = Object.keys(tagMap).length > 0
      ? "SETUP TAGS BREAKDOWN (from tagged trades):\n" + Object.entries(tagMap).map(([tag, s]) => `  #${tag}: ${s.trades} trades, ${s.wins}W/${s.losses}L${s.pnl !== 0 ? `, P&L: $${s.pnl.toFixed(0)}` : ""}`).join("\n")
      : "SETUP TAGS: No tags logged yet — trader has not labeled setups with tags";

    const tradesSummary = periodTrades.map((t) => {
      const tags = t.tags && t.tags.length > 0 ? t.tags.map((tag) => `#${tag}`).join(" ") : "none";
      return `Date: ${t.dt}, Asset: ${t.asset}, Direction: ${t.direction}, A+: ${t.aplus}, Taken: ${t.taken}, Personal P&L: ${t.profit != null ? "$" + t.profit : "blank"}, Funded P&L: ${t.profit_funded != null ? "$" + t.profit_funded : "blank"}, Tags: ${tags}, Notes: ${t.notes || "none"}, After Trade Thoughts: ${t.after_thoughts || "none"}`;
    }).join("\n");

    const prompt = `You are a direct but fair trading coach analyzing the performance of a funded futures trader who uses an ICT-inspired fractal model. You're honest and straightforward — you don't sugarcoat, but you're not harsh either. Think tough older brother energy. You point out weaknesses clearly because you want this trader to improve, and you genuinely acknowledge strengths when earned.

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
A+ SETUPS TAKEN: ${aplusTaken} (includes "Yes But Execution Sucked")
  - "Yes But Execution Sucked": ${execSucked} — setup was valid, execution was poor (left money on table)
  - "Yes to No": ${yesToNo} — initially marked A+, corrected on review (setup wasn't actually A+)
NON-A+ TRADES TAKEN: ${nonAplus}
MISSED SETUPS: ${missed}

A+ LABEL DEFINITIONS:
- "Yes" = A+ setup, executed cleanly
- "Yes But Execution Sucked" = Setup was genuinely A+, but entry/management was poor
- "Yes to No" = Trader initially thought it was A+, corrected on review — not actually valid
- "No" = Not an A+ setup
NET PERSONAL P&L: $${totalPnl.toFixed(2)} (trades with P&L entered)
NET FUNDED P&L: $${totalFundedPnl.toFixed(2)} (funded account trades with P&L entered)
WIN RATE: ${taken ? Math.round((wins / taken) * 100) : 0}%

${tsSection}

${tagSection}

INDIVIDUAL TRADES:
${tradesSummary}

ANALYSIS INSTRUCTIONS:
1. Performance Overview — Cover both Personal and Funded P&L separately where data exists. Win rate, key numbers. Judge wins against the $500 risk / $1,000 target framework. Call out breakeven trades disguised as wins.
2. TradeSharp Score Analysis — Reference the composite score and call out which specific pillars are dragging the score down. If Consistency is weak, say so. If A+ Discipline is high but Win Rate is low, call out the execution gap. Use the pillar scores to be precise.
3. Setup Tag Analysis — Use the Tags field on each trade as the primary setup identifier. Break down win rate and P&L per tag (e.g. "#2STG: 3W/1L = 75%"). Identify which tagged setups are profitable vs which are bleeding. If trades have no tags, call that out — the trader should be labeling every setup.
4. Strengths — What this trader is genuinely doing well. Be specific, reference actual trades.
5. Flaws & Weaknesses — Be direct. Call out rule violations, patterns, psychological leaks. If they're trading non-A+ setups, say so. If they're revenge trading, say so. Don't soften it. If "Yes But Execution Sucked" trades appear, dig into the execution failures — are they sizing wrong, exiting early, moving stops? If "Yes to No" trades appear, flag whether this is a recurring impulsive entry pattern.
6. Language & Mindset Analysis — Read how the trader describes their trades in the notes. Are they making excuses? Being vague? Blaming the market? Showing accountability? Call out specific language patterns that reveal psychological issues.
7. Key Focus — 2-3 specific, actionable improvements for next ${p === "week" ? "week" : "month"}.
8. Final Word — One honest sentence about where this trader is mentally.

Be direct, specific, and reference actual trades and their notes. Keep it under 800 words.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 2000, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      setOutput(data.content?.map((c) => c.text || "").join("") || "No response received.");
    } catch {
      setOutput("Failed to generate summary. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <TCard style={{ padding: 28, marginTop: 24 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI TRADING SUMMARY</div>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: apiKey ? "rgba(5,150,105,0.12)" : "rgba(255,255,255,0.06)", color: apiKey ? "var(--green)" : "var(--text-tertiary)" }}>
          {apiKey ? "API KEY ACTIVE" : "NO API KEY — Set in Profile"}
        </span>
      </div>
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => generate("week")} disabled={loading} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--accent-secondary)", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", background: "transparent", color: "var(--accent-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>THIS WEEK</button>
        <button onClick={() => generate("month")} disabled={loading} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--purple)", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", background: "transparent", color: "var(--purple)", letterSpacing: "0.05em", textTransform: "uppercase" }}>THIS MONTH</button>
      </div>
      {period && <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 10 }}>{period}</div>}
      {loading && <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--accent-secondary)", padding: "16px 0", animation: "hudPulse 1.5s ease-in-out infinite" }}>ANALYZING TRADES...</div>}
      {output && <div style={{ fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.7, whiteSpace: "pre-wrap", background: "var(--bg-tertiary)", borderRadius: 6, padding: 20, border: "1px solid var(--border-primary)" }}>{output}</div>}
    </TCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// BADGES
// ═══════════════════════════════════════════════════════════════════════════

function BadgesSection({ trades, dayMap }) {
  const sorted = [...trades].sort((a, b) => new Date(a.dt) - new Date(b.dt));
  const keys = Object.keys(dayMap).sort();

  let maxGreen = 0, cur = 0;
  keys.forEach((k) => { if (dayMap[k].pnl > 0) { cur++; maxGreen = Math.max(maxGreen, cur); } else cur = 0; });
  let maxAplus = 0, curA = 0;
  sorted.forEach((t) => { if (t.aplus === "Yes") { curA++; maxAplus = Math.max(maxAplus, curA); } else curA = 0; });
  let maxWin = 0, curW = 0;
  sorted.forEach((t) => { if (parseFloat(t.profit) > 0) { curW++; maxWin = Math.max(maxWin, curW); } else curW = 0; });
  const aplusTrades = trades.filter((t) => t.aplus === "Yes").length;
  const now = new Date(); const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay()); weekStart.setHours(0, 0, 0, 0);
  const weekPnl = trades.filter((t) => t.dt && new Date(t.dt) >= weekStart).reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
  const bestDay = Object.values(dayMap).reduce((b, d) => d.pnl > b ? d.pnl : b, 0);

  // XP calc for Elite badge
  const xp = calcTradingXP(trades, dayMap);

  const badges = [
    { icon: "🔥", name: "On Fire", desc: "3 green days in a row", unlocked: maxGreen >= 3 },
    { icon: "🧘", name: "Disciplined", desc: "5 A+ trades in a row", unlocked: maxAplus >= 5 },
    { icon: "🎯", name: "Sniper", desc: "5 winning trades in a row", unlocked: maxWin >= 5 },
    { icon: "💎", name: "Rule Keeper", desc: "10 A+ trades total", unlocked: aplusTrades >= 10 },
    { icon: "📈", name: "Green Week", desc: "Profitable week", unlocked: weekPnl > 0 },
    { icon: "🚀", name: "Best Day Ever", desc: "Single day P&L > $500", unlocked: bestDay >= 500 },
    { icon: "📝", name: "Journaler", desc: "Log 20+ trades", unlocked: trades.length >= 20 },
    { icon: "🏆", name: "Elite", desc: "Reach 1000 XP", unlocked: xp >= 1000 },
    { icon: "📅", name: "Green Month", desc: "Finish a month profitable", unlocked: (() => { const months = {}; keys.forEach((k) => { const m = k.slice(0, 7); if (!months[m]) months[m] = 0; months[m] += dayMap[k].pnl; }); const cur = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`; return Object.entries(months).some(([m, p]) => m !== cur && p > 0); })() },
    { icon: "🏃", name: "Marathon", desc: "Log 50+ trades", unlocked: trades.length >= 50 },
    { icon: "🛡️", name: "Ironclad", desc: "5 green days in a row", unlocked: maxGreen >= 5 },
  ];

  return (
    <TCard style={{ padding: 28, marginTop: 24 }}>
      <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.08em" }}>BADGES</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {badges.map((b, i) => (
          <div key={i} style={{
            textAlign: "center", padding: 16, borderRadius: 8,
            background: b.unlocked ? "var(--accent-glow)" : "var(--bg-tertiary)",
            border: b.unlocked ? "1.5px solid var(--accent-dim)" : "1.5px solid var(--border-primary)",
            opacity: b.unlocked ? 1 : 0.5,
            boxShadow: b.unlocked ? "0 0 0 1px var(--accent-dim)" : "none",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: b.unlocked ? "var(--text-primary)" : "var(--text-tertiary)" }}>{b.name}</div>
            <div style={{ fontSize: 11, color: "var(--text-tertiary)", marginTop: 2 }}>{b.desc}</div>
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
  const weekAplus = weekTrades.filter((t) => t.aplus === "Yes").length;
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
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>WEEKLY CHALLENGES</span>
        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)" }}>Resets every Monday</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {challenges.map((c, i) => {
          const pct = Math.min(100, Math.round((c.cur / c.goal) * 100));
          const done = c.cur >= c.goal;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: done ? "var(--green)" : "var(--text-secondary)" }}>{done ? "✓ " : ""}{c.name}</span>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>{c.cur} / {c.goal}</span>
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
  const [accounts, setAccounts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  // Payout log state
  const [payouts, setPayouts] = useState([]);
  const [payoutForm, setPayoutForm] = useState({ ...emptyPayoutForm });
  const [editingPayout, setEditingPayout] = useState(null);

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

  const savePayout = async () => {
    if (!payoutForm.amount || !payoutForm.payout_date) { alert("Please enter an amount and date."); return; }
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
    if (err) { alert("Error saving payout: " + err.message); return; }
    resetPayoutForm(); loadPayouts();
  };

  const deletePayout = async (id) => {
    if (!window.confirm("Delete this payout?")) return;
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
  };

  const saveAccount = async () => {
    if (!form.firm) { alert("Please enter a firm name."); return; }
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
    if (err) { alert("Error saving account: " + err.message); return; }
    resetForm(); loadAccounts();
  };

  const deleteAccount = async (id) => {
    if (!window.confirm("Delete this account?")) return;
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
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${totalPnl >= 0 ? "+" : "-"}$${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Current P&L</div>
        </TCard>
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalEligiblePayout > 0 ? "var(--green)" : "var(--text-tertiary)" }}>{privacyMode ? MASK : `$${totalEligiblePayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Eligible Payout</div>
        </TCard>
      </div>
      <div className="acct-summary-2" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(52,211,153,0.12)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalPaidOut > 0 ? "var(--green)" : "var(--text-tertiary)" }}>{privacyMode ? MASK : `$${totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>YTD Paid Out</div>
        </TCard>
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(251,191,36,0.07) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(251,191,36,0.12)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: totalPending > 0 ? "var(--gold)" : "var(--text-tertiary)" }}>{privacyMode ? MASK : `$${totalPending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Pending</div>
        </TCard>
      </div>

      {/* Account Cards */}
      {!accounts.length && (
        <TCard style={{ padding: 48, textAlign: "center", marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>📊</div>
          <div style={{ fontSize: 16, color: "var(--text-tertiary)" }}>No accounts yet. Add your first funded account or eval below.</div>
        </TCard>
      )}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 24 }}>
        {accounts.map((acc) => {
          const statusMeta = getStatusMeta(acc.status);
          const pnl = acc.current_pnl != null ? Number(acc.current_pnl) : null;
          const isEditing = editing === acc.id;
          return (
            <TCard key={acc.id} style={{ padding: 24, borderLeft: `4px solid ${isEditing ? "var(--accent)" : statusMeta.color}` }}>
              {isEditing ? (
                <>
                  <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 11, color: "var(--accent)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                    EDITING: {acc.account_name || acc.firm}
                  </div>
                  <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <Field label="Firm Name"><input style={inputStyle} placeholder="e.g. Apex, Topstep" value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} /></Field>
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
                  <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
                    <Field label="Profit Target ($)"><input type="number" style={inputStyle} placeholder="e.g. 3000" value={form.profit_target} onChange={(e) => setForm({ ...form, profit_target: e.target.value })} /></Field>
                    <Field label="Current P&L ($)"><input type="number" style={inputStyle} placeholder="e.g. 1500" value={form.current_pnl} onChange={(e) => setForm({ ...form, current_pnl: e.target.value })} /></Field>
                    <Field label="Max Drawdown ($)"><input type="number" style={inputStyle} placeholder="e.g. 2500" value={form.max_drawdown} onChange={(e) => setForm({ ...form, max_drawdown: e.target.value })} /></Field>
                    <Field label="Daily Loss Limit ($)"><input type="number" style={inputStyle} placeholder="e.g. 500" value={form.daily_loss_limit} onChange={(e) => setForm({ ...form, daily_loss_limit: e.target.value })} /></Field>
                    <Field label="Payout Eligible (%)"><input type="number" style={inputStyle} placeholder="e.g. 80" min="0" max="100" value={form.payout_pct} onChange={(e) => setForm({ ...form, payout_pct: e.target.value })} /></Field>
                  </div>
                  <div style={{ marginBottom: 14 }}>
                    <Field label="Notes"><textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }} placeholder="Withdrawal dates, rules, notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></Field>
                  </div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button onClick={resetForm} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 12, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
                    <button onClick={saveAccount} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 700, padding: 12, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer" }}>SAVE CHANGES</button>
                  </div>
                </>
              ) : (
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
                    <button onClick={() => openEdit(acc)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--accent-secondary)", fontWeight: 600 }}>✏️ Edit</button>
                    <button onClick={() => deleteAccount(acc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-tertiary)", fontWeight: 600 }}>✕ Delete</button>
                  </div>
                </>
              )}
            </TCard>
          );
        })}
      </div>

      {/* Add Account Form — only shown when not editing an existing account */}
      {!editing && <TCard style={{ padding: 28 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>
          {editing ? "EDIT ACCOUNT" : "ADD ACCOUNT"}
        </div>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
          <Field label="Firm Name">
            <input style={inputStyle} placeholder="e.g. Apex, Topstep, FTMO" value={form.firm} onChange={(e) => setForm({ ...form, firm: e.target.value })} />
          </Field>
          <Field label="Account Size ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 50000" value={form.account_size} onChange={(e) => setForm({ ...form, account_size: e.target.value })} />
          </Field>
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
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
          <Field label="Profit Target ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 3000" value={form.profit_target} onChange={(e) => setForm({ ...form, profit_target: e.target.value })} />
          </Field>
          <Field label="Current P&L ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 1500" value={form.current_pnl} onChange={(e) => setForm({ ...form, current_pnl: e.target.value })} />
          </Field>
          <Field label="Max Drawdown ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 2500" value={form.max_drawdown} onChange={(e) => setForm({ ...form, max_drawdown: e.target.value })} />
          </Field>
          <Field label="Daily Loss Limit ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 500" value={form.daily_loss_limit} onChange={(e) => setForm({ ...form, daily_loss_limit: e.target.value })} />
          </Field>
          <Field label="Payout Eligible (%)">
            <input type="number" style={inputStyle} placeholder="e.g. 80" min="0" max="100" value={form.payout_pct} onChange={(e) => setForm({ ...form, payout_pct: e.target.value })} />
          </Field>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Field label="Notes">
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }} placeholder="Withdrawal dates, rules, notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {editing && (
            <button onClick={resetForm} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
          )}
          <button onClick={saveAccount} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 700, padding: 14, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "none", letterSpacing: "0.05em" }}>
            {editing ? "SAVE CHANGES" : "+ ADD ACCOUNT"}
          </button>
        </div>
      </TCard>}

      {/* ─── PAYOUT LOG ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          Payout Log
        </div>

        {/* Payout entries */}
        {!payouts.length && (
          <TCard style={{ padding: 36, textAlign: "center", marginBottom: 14 }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>💰</div>
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
                      <button onClick={() => openEditPayout(p)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--accent-secondary)", fontWeight: 600 }}>✏️ Edit</button>
                      <button onClick={() => deletePayout(p.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--text-tertiary)", fontWeight: 600 }}>✕</button>
                    </div>
                  </div>
                </TCard>
              );
            })}
          </div>
        )}

        {/* Payout Form */}
        <TCard style={{ padding: 28 }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {editingPayout ? "EDIT PAYOUT" : "LOG PAYOUT"}
          </div>
          <div className="payout-form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
            <Field label="Amount ($)">
              <input type="number" style={inputStyle} placeholder="e.g. 1000" value={payoutForm.amount} onChange={(e) => setPayoutForm({ ...payoutForm, amount: e.target.value })} />
            </Field>
            <Field label="Date">
              <input type="date" style={inputStyle} value={payoutForm.payout_date} onChange={(e) => setPayoutForm({ ...payoutForm, payout_date: e.target.value })} />
            </Field>
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
          <div style={{ marginBottom: 20 }}>
            <Field label="Notes">
              <input style={inputStyle} placeholder="Reference #, fees, etc." value={payoutForm.notes} onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })} />
            </Field>
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            {editingPayout && (
              <button onClick={resetPayoutForm} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 600, padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
            )}
            <button onClick={savePayout} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", flex: 1, fontSize: 13, fontWeight: 700, padding: 14, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "none", letterSpacing: "0.05em" }}>
              {editingPayout ? "SAVE CHANGES" : "+ LOG PAYOUT"}
            </button>
          </div>
        </TCard>
      </div>
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


export function DashboardView({ supabase, user, trades, syncToSheets, displayName, privacyMode }) {
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
      {(todayPnl < 0 || alerts.length > 0) && (
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
          Welcome Back, {displayName || "Trader"}
        </h1>
      </div>

      {/* Today's Stats */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <TCard style={{ padding: "18px 20px", textAlign: "center", borderColor: todayPnl < 0 ? "rgba(239,68,68,0.3)" : undefined, background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: todayPnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${todayPnl >= 0 ? "+" : ""}$${todayPnl.toFixed(0)}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Today's P&L</div>
        </TCard>
        <StatBox value={todayTaken} label="Trades Today" color="var(--text-secondary)" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)" }} />
        <StatBox value={greenStreak} label="Green Streak" color="var(--gold)" style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)" }} />
        <TCard style={{ padding: "18px 20px", textAlign: "center", background: "linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)" }}>
          <div className="stat-val" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 24, fontWeight: 700, color: weekPnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${weekPnl >= 0 ? "+" : ""}$${weekPnl.toFixed(0)}`}</div>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Week P&L</div>
        </TCard>
      </div>

      {/* Week Progress */}
      <TCard style={{ padding: 24, marginBottom: 24, background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, rgba(34,211,238,0.02) 100%)" }}>
        <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
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

      {/* Account Health */}
      {activeAccounts.length > 0 && (
        <TCard style={{ padding: 24, marginBottom: 24, background: "linear-gradient(160deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 60%, rgba(34,211,238,0.02) 100%)" }}>
          <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
            ACCOUNT HEALTH
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {activeAccounts.map((acc) => {
              const pnl = Number(acc.current_pnl) || 0;
              const target = Number(acc.profit_target) || 1;
              const dd = Number(acc.max_drawdown) || 1;
              const profitPct = Math.max(0, (pnl / target) * 100);
              const ddUsed = Math.abs(Math.min(0, pnl));
              const ddPct = (ddUsed / dd) * 100;
              const ddColor = ddPct >= DRAWDOWN_DANGER * 100 ? "var(--red)" : ddPct >= DRAWDOWN_WARNING * 100 ? "var(--gold)" : "var(--text-tertiary)";
              return (
                <div key={acc.id}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{acc.account_name || acc.firm}</span>
                    <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700, color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>{privacyMode ? MASK : `${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`}</span>
                  </div>
                  {acc.profit_target && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Profit Target</span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>{Math.round(profitPct)}%</span>
                      </div>
                      <ProgressBar pct={profitPct} color="var(--green)" />
                    </div>
                  )}
                  {acc.max_drawdown && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Drawdown Used</span>
                        <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: ddColor }}>{Math.round(ddPct)}%</span>
                      </div>
                      <ProgressBar pct={ddPct} color={ddColor} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </TCard>
      )}

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

function FinancialJuiceFeed() {
  const [tweets, setTweets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTweets = async () => {
    try {
      const res = await fetch("/api/tweets");
      const data = await res.json();
      if (data.data) {
        setTweets(data.data);
        setError(null);
      } else {
        setError("No tweets returned");
      }
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTweets();
    const interval = setInterval(fetchTweets, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (iso) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " · " + d.toLocaleDateString([], { month: "short", day: "numeric" });
  };

  return (
    <TCard style={{ marginTop: 20, padding: "24px 28px" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 18, paddingBottom: 14, borderBottom: "1px solid var(--border-primary)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1d9bf0", animation: "hudPulse 2s ease-in-out infinite" }} />
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            @FinancialJuice
          </span>
        </div>
        <button
          onClick={fetchTweets}
          style={{
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 600,
            padding: "4px 10px", border: "1px solid var(--border-primary)", borderRadius: 4,
            background: "transparent", color: "var(--text-tertiary)", cursor: "pointer",
            textTransform: "uppercase", letterSpacing: "0.05em",
          }}
        >
          Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ color: "var(--text-tertiary)", fontSize: 13, textAlign: "center", padding: "20px 0" }}>Loading...</div>
      ) : error ? (
        <div style={{ color: "#ef4444", fontSize: 12, fontFamily: "'Plus Jakarta Sans', sans-serif" }}>{error}</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 0, maxHeight: 400, overflowY: "auto" }}>
          {tweets.map((tweet, i) => (
            <div key={tweet.id} style={{
              padding: "12px 4px",
              borderBottom: i < tweets.length - 1 ? "1px solid var(--border-secondary)" : "none",
            }}>
              <div style={{ fontSize: 13, color: "var(--text-primary)", lineHeight: 1.6, marginBottom: 6 }}>
                {tweet.text}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
                {formatTime(tweet.created_at)}
              </div>
            </div>
          ))}
        </div>
      )}
    </TCard>
  );
}

export function NewsView() {
  const [channel, setChannel] = useState("bloomberg");
  const calendarRef = useRef(null);

  const activeSrc = LIVE_CHANNELS.find((c) => c.key === channel)?.src || LIVE_CHANNELS[0].src;

  // Load TradingView Economic Calendar widget
  useEffect(() => {
    if (!calendarRef.current) return;
    calendarRef.current.innerHTML = "";
    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/external-embedding/embed-widget-events.js";
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: localStorage.getItem("theme") === "dark" ? "dark" : "light",
      isTransparent: true,
      width: "100%",
      height: "500",
      locale: "en",
      importanceFilter: "0,1",
      countryFilter: "us",
    });
    calendarRef.current.appendChild(script);
  }, []);

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>

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

      {/* Economic Calendar — TradingView */}
      <TCard style={{ padding: 0, overflow: "hidden" }}>
        <div style={{
          padding: "16px 20px", borderBottom: "1px solid var(--border-primary)",
        }}>
          <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            ECONOMIC CALENDAR
          </span>
        </div>
        <div ref={calendarRef} style={{ minHeight: 500 }} />
      </TCard>

      <FinancialJuiceFeed />
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
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "8px 12px",
            borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.15s", whiteSpace: "nowrap",
            border: showForm ? "1px solid var(--border-primary)" : "1px solid var(--accent)",
            background: showForm ? "var(--bg-tertiary)" : "var(--accent-dim)",
            color: showForm ? "var(--text-secondary)" : "var(--accent)",
          }}
        >
          {showForm ? "✕ Cancel" : "+ New Idea"}
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

const EDU_CATEGORIES = ["ICT Concepts", "Psychology", "Risk Management", "Setups", "Trade Reviews", "General"];
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

export function NotebookView({ supabase, user, trades, syncToSheets }) {
  const today = todayKey();
  const [selectedDate, setSelectedDate] = useState(today);
  const [entry, setEntry] = useState({ recap: "", eod_reflection: "", mood: null, ai_summary: "" });
  const [savedEntry, setSavedEntry] = useState(null);
  const [entryDates, setEntryDates] = useState(new Set());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState("");
  const [aiPeriod, setAiPeriod] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [plan, setPlan] = useState({ bias: "", max_trades: "2", session_plan: "" });
  const [moodText, setMoodText] = useState("");
  const apiKey = (() => { try { return localStorage.getItem("aiApiKey") || ""; } catch { return ""; } })();

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
    if (syncToSheets && selectedDate === today) {
      const dt = new Date().toISOString();
      const dtFormatted = fmtDate(new Date());
      syncToSheets({ type: "plan", dt, dtFormatted, preMarketJournal: plan.session_plan || "" });
      if (moodText.trim()) syncToSheets({ type: "mood", mood: moodText.trim(), dt, dtFormatted });
    }
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

  const generateAI = async (period) => {
    if (!apiKey) { setAiOutput("Add your Anthropic API key in Profile settings to use AI summaries."); setAiPeriod(period); return; }
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
    const execSucked = periodTrades.filter(t => t.aplus === "Yes But Execution Sucked").length;
    const yesToNo = periodTrades.filter(t => t.aplus === "Yes to No").length;

    const prompt = `You are an experienced trading mentor reviewing a futures trader's journal for ${label}. They trade an ICT-inspired fractal model across multiple instruments — NQ, ES, YM, GC, SI, Oil, and correlated pairs — primarily in the NY session, max 2 trades/day. The model applies to any instrument where the setup is valid; asset selection is not a concern.

A+ LABEL DEFINITIONS (read these carefully before commenting on trade quality):
- "Yes" = A+ setup, executed cleanly
- "Yes But Execution Sucked" = Setup was genuinely A+, but entry/management was poor — left money on table (${execSucked} this period)
- "Yes to No" = Trader initially thought it was A+, corrected on review — setup wasn't actually valid (${yesToNo} this period)
- "No" = Not an A+ setup
- "Missed" = Seen but not taken

IMPORTANT: The trade data below is the ground truth. If trades are logged, they happened. Do not say the trader didn't trade if the log shows otherwise.

JOURNAL ENTRIES:
${notebookText || "(No entries for this period)"}

TRADE DATA: ${periodTrades.length} logged | ${taken} taken | ${wins} wins | Net P&L: $${pnl.toFixed(2)}
${tradeLines || "(No trades logged for this period)"}

Write a focused coaching summary (300–500 words). Tone: mentor who has seen it all — direct and honest, will call things out plainly, but never dismissive. You can be blunt, just not cruel. Think less drill sergeant, more seasoned pro who genuinely wants to see this trader level up.

1. Gameplan vs Reality — did they trade their plan? Use the trade log as evidence.
2. Self-awareness — are their EOD reflections honest and specific, or vague and defensive?
3. Inner dialogue — pay close attention to the exact words and phrases they use to describe their mood and mental state. What patterns show up? Quote their own language back to them.
4. Language vs outcome — does how they described their mindset before a session correlate with how they traded? Call out any recurring patterns.
5. Patterns across entries — habits, recurring mistakes, or genuine strengths worth reinforcing.
6. 2–3 specific, actionable focuses for the next session.

Quote their exact words where relevant. Be honest, be real, but keep it constructive.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1200, messages: [{ role: "user", content: prompt }] }),
      });
      const data = await res.json();
      const output = data.content?.map(c => c.text || "").join("") || "No response received.";
      const periodLabel = period === "day" ? "TODAY" : period === "week" ? "THIS WEEK" : "THIS MONTH";
      const timestamped = `[${periodLabel} · ${new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}]\n\n${output}`;
      setAiOutput(output);
      save({ ai_summary: timestamped });
    } catch {
      setAiOutput("Failed to generate summary. Check your API key and try again.");
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
          .notebook-layout { grid-template-columns: 1fr !important; }
          .notebook-calendar { order: 2; }
          .notebook-editor { order: 1; }
          .pretrade-grid { grid-template-columns: 1fr !important; }
          .ai-header { flex-direction: column !important; align-items: flex-start !important; }
          .ai-buttons { flex-wrap: wrap !important; }
        }
      `}</style>
      <PageBanner label="NOTEBOOK" title="Write it down. Own the day." subtitle="Pre-market gameplan, trade recap, and EOD reflection — in one place. AI coached." />

      <div className="notebook-layout" style={{ display: "grid", gridTemplateColumns: "210px 1fr", gap: 20, alignItems: "start" }}>

        {/* ── Left: Calendar + stats ── */}
        <div className="notebook-calendar" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <TCard style={{ padding: 0, overflow: "hidden" }}>
            {/* Month nav */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 14px", borderBottom: "1px solid var(--border-primary)" }}>
              <button onClick={calPrev} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 12, padding: 4, lineHeight: 1 }}>◀</button>
              <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, color: "var(--text-primary)" }}>{MONTHS[calMonth]} {calYear}</span>
              <button onClick={calNext} style={{ background: "none", border: "none", color: "var(--text-tertiary)", cursor: "pointer", fontSize: 12, padding: 4, lineHeight: 1 }}>▶</button>
            </div>
            {/* Day labels */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "8px 10px 2px" }}>
              {["S","M","T","W","T","F","S"].map((d, i) => (
                <div key={i} style={{ textAlign: "center", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, color: "var(--text-tertiary)", fontWeight: 600, padding: "2px 0" }}>{d}</div>
              ))}
            </div>
            {/* Day grid */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", padding: "2px 10px 12px", gap: 2 }}>
              {Array.from({ length: firstDay }, (_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                const hasEntry = entryDates.has(dateStr);
                return (
                  <button key={d} onClick={() => setSelectedDate(dateStr)} style={{
                    position: "relative", width: "100%", aspectRatio: "1", borderRadius: 4,
                    background: isSelected ? "var(--accent)" : "transparent",
                    border: isToday && !isSelected ? "1px solid var(--accent)" : "1px solid transparent",
                    color: isSelected ? "var(--bg-primary)" : isToday ? "var(--accent)" : "var(--text-secondary)",
                    fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10,
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
          </TCard>

          {/* Stats */}
          <TCard style={{ padding: "16px 18px", textAlign: "center" }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)" }}>{entryDates.size}</div>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 2 }}>Entries Written</div>
          </TCard>
        </div>

        {/* ── Right: Entry editor ── */}
        <div className="notebook-editor">
          {/* Date header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
            <div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{selectedDateDisplay}</div>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: saving ? "var(--text-tertiary)" : saved ? "var(--green)" : "var(--text-tertiary)", marginTop: 2, transition: "color 0.3s" }}>
                {saving ? "Saving..." : saved ? "✓ Saved" : selectedDate === today ? "Today" : ""}
              </div>
            </div>
          </div>

          {/* Pre-Trade Plan */}
          <TCard style={{ padding: 20, marginBottom: 14 }}>
            <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 14 }}>PRE-TRADE PLAN</div>
            <div className="pretrade-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <Field label="Daily Bias">
                <select style={{ ...selectStyle, fontSize: 12 }} value={plan.bias} onChange={(e) => setPlan(p => ({ ...p, bias: e.target.value }))}>
                  <option value="">Select...</option>
                  <option>Bullish</option>
                  <option>Bearish</option>
                  <option>Neutral</option>
                </select>
              </Field>
              <Field label="Max Trades">
                <select style={{ ...selectStyle, fontSize: 12 }} value={plan.max_trades} onChange={(e) => setPlan(p => ({ ...p, max_trades: e.target.value }))}>
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                </select>
              </Field>
            </div>
            <Field label="Session Plan">
              <textarea
                style={{ ...inputStyle, resize: "vertical", overflow: "auto", minHeight: 140, lineHeight: 1.7, fontSize: 12 }}
                placeholder="What's your plan for today's NY session? Setups, confluences, anything to avoid..."
                value={plan.session_plan}
                onChange={(e) => setPlan(p => ({ ...p, session_plan: e.target.value }))}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
              />
            </Field>
            <div style={{ marginTop: 12 }}>
              <Field label="How are you feeling?">
                <input
                  type="text"
                  style={{ ...inputStyle, fontSize: 12 }}
                  placeholder="e.g. focused, tired, anxious, in the zone..."
                  value={moodText}
                  onChange={(e) => setMoodText(e.target.value)}
                />
              </Field>
            </div>
          </TCard>

          {/* Recap + EOD sections */}
          {NOTEBOOK_SECTIONS.map(({ key, label, placeholder }) => (
            <TCard key={key} style={{ padding: 20, marginBottom: 14 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, fontWeight: 700, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 10 }}>{label}</div>
              <textarea
                value={entry[key]}
                onChange={(e) => setEntry(prev => ({ ...prev, [key]: e.target.value }))}
                onInput={(e) => { e.target.style.height = "auto"; e.target.style.height = e.target.scrollHeight + "px"; }}
                onBlur={(e) => handleBlur(key, e.target.value)}
                onFocus={(e) => e.target.style.borderColor = "var(--accent)"}
                placeholder={placeholder}
                rows={5}
                style={{
                  width: "100%", background: "var(--bg-input)", border: "1px solid var(--border-primary)",
                  borderRadius: 6, padding: "12px 14px", resize: "vertical", overflow: "auto",
                  fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, color: "var(--text-primary)",
                  lineHeight: 1.75, outline: "none", boxSizing: "border-box", transition: "border-color 0.15s",
                }}
              />
              <div style={{ textAlign: "right", marginTop: 6, fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)" }}>
                {wordCount(entry[key])} words
              </div>
            </TCard>
          ))}

          {/* Save Entry */}
          <button onClick={saveAll} disabled={saving} style={{
            width: "100%", marginBottom: 14,
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, fontWeight: 700,
            padding: "13px", borderRadius: 6, cursor: saving ? "not-allowed" : "pointer",
            border: saved ? "1px solid var(--green)" : "1px solid var(--accent)",
            background: saved ? "rgba(5,150,105,0.08)" : "var(--accent-dim)",
            color: saved ? "var(--green)" : "var(--accent)",
            letterSpacing: "0.06em", textTransform: "uppercase", transition: "all 0.2s",
            opacity: saving ? 0.7 : 1,
          }}>
            {saving ? "Saving..." : saved ? "✓ Entry Saved" : "Save Entry"}
          </button>

          {/* AI Coaching Summary */}
          <TCard style={{ padding: 24, background: "linear-gradient(160deg, rgba(255,255,255,0.065) 0%, rgba(255,255,255,0.025) 60%, rgba(34,211,238,0.03) 100%)", border: "1px solid rgba(34,211,238,0.1)" }}>
            <div className="ai-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI COACHING SUMMARY</div>
              <div className="ai-buttons" style={{ display: "flex", gap: 6, alignItems: "center", flexWrap: "wrap" }}>
                <span style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 9, fontWeight: 700, padding: "2px 8px", borderRadius: 10, background: apiKey ? "rgba(5,150,105,0.12)" : "rgba(255,255,255,0.06)", color: apiKey ? "var(--green)" : "var(--text-tertiary)" }}>
                  {apiKey ? "API KEY ACTIVE" : "NO API KEY — Set in Profile"}
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
              <div style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.8, whiteSpace: "pre-wrap", padding: "16px 20px", background: "var(--bg-tertiary)", borderRadius: 6, border: "1px solid var(--border-primary)" }}>
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
    </div>
  );
}

const emptyEduForm = { type: "video", title: "", url: "", category: "ICT Concepts", status: "to_review", notes: "" };

export function EducationView({ supabase, user }) {
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
    if (error) { alert("Upload failed: " + error.message); setUploading(false); return; }
    const { data: { publicUrl } } = supabase.storage.from("learning-screenshots").getPublicUrl(path);
    setForm((f) => ({ ...f, url: publicUrl }));
    setUploading(false);
  };

  const save = async () => {
    if (!form.title.trim()) { alert("Please enter a title."); return; }
    if ((form.type === "video" || form.type === "screenshot") && !form.url.trim()) {
      alert("Please enter a URL or upload a screenshot."); return;
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
      if (error) { alert("Error saving: " + error.message); return; }
    } else {
      const { error } = await supabase.from("learning_resources").insert(payload);
      if (error) { alert("Error saving: " + error.message); return; }
    }
    resetForm(); load();
  };

  const deleteResource = async (id) => {
    if (!window.confirm("Delete this resource?")) return;
    await supabase.from("learning_resources").delete().eq("id", id);
    if (viewingResource?.id === id) setViewingResource(null);
    load();
  };

  const startEdit = (r) => {
    setEditingId(r.id);
    setForm({ type: r.type, title: r.title, url: r.url || "", category: r.category || "ICT Concepts", status: r.status || "to_review", notes: r.notes || "" });
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
    const map = { "ICT Concepts": "var(--accent)", "Psychology": "var(--purple)", "Risk Management": "var(--red)", "Setups": "var(--green)", "Trade Reviews": "var(--gold)", "General": "var(--text-tertiary)" };
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
            background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
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

              {/* Session Notes */}
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
            fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 11, fontWeight: 700, padding: "8px 12px",
            borderRadius: 4, cursor: "pointer", marginLeft: "auto",
            border: "1px solid var(--accent)", background: "var(--accent-dim)", color: "var(--accent)",
            letterSpacing: "0.05em", transition: "all 0.15s", whiteSpace: "nowrap",
          }}
        >{showForm ? "✕ Cancel" : "+ Add Resource"}</button>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
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
                style={{ ...inputStyle, minHeight: 70, resize: "vertical", fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 12 }}
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
          <div style={{ fontSize: 48, marginBottom: 16 }}>📚</div>
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
                      <button onClick={(e) => { e.stopPropagation(); deleteResource(r.id); }} style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", fontSize: 10, color: "var(--text-tertiary)", background: "none", border: "none", cursor: "pointer", fontWeight: 600, opacity: 0.6 }}>DELETE</button>
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


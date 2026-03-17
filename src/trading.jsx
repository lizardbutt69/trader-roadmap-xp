import { useState, useEffect, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
import { jsPDF } from "jspdf";
Chart.register(...registerables);

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const CHECKLIST_ITEMS = [
  { label: "1 or 2 Stage Crack in Correlation (CIC)", sub: "SMT and/or PSP confirmed" },
  { label: "Key Level / Liquidity", sub: "Price at significant level or liquidity pool" },
  { label: "Timeframe Alignment", sub: "Higher TF in agreement with entry TF" },
  { label: "CISD", sub: "Change in state of delivery confirmed" },
  { label: "ICCISD", sub: "Inter-Candle Change in State of Delivery" },
  { label: "TTFM", sub: "The Fractal Model" },
  { label: "Session / Time of Day", sub: "London, NY open or high-probability session" },
  { label: "Risk/Reward Ratio", sub: "Minimum 1:2 R:R confirmed" },
  { label: "Stop Loss Defined", sub: "Clear invalidation level set" },
  { label: "Is it reallllllllllllly an A+ trade? 🤔", sub: "Take 10 seconds. Be honest with yourself.", timer: true },
];

const ASSETS = ["$NQ", "$ES", "$GC", "$SI"];
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

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

const DRAWDOWN_WARNING = 0.7;
const DRAWDOWN_DANGER = 0.85;

// ─── HELPERS ────────────────────────────────────────────────────────────────

function calcStreaks(trades) {
  const dayMap = buildDayMap(trades);
  const keys = Object.keys(dayMap).sort();
  const sorted = [...trades].sort((a, b) => new Date(a.dt) - new Date(b.dt));
  let greenStreak = 0, bestGreen = 0, cur = 0;
  keys.forEach((k) => { if (dayMap[k].pnl > 0) { cur++; bestGreen = Math.max(bestGreen, cur); } else cur = 0; });
  for (let i = keys.length - 1; i >= 0; i--) { if (dayMap[keys[i]].pnl > 0) greenStreak++; else break; }
  let aplusStreak = 0, bestAplus = 0, curA = 0;
  sorted.forEach((t) => { if (t.aplus === "Yes") { curA++; bestAplus = Math.max(bestAplus, curA); } else curA = 0; });
  for (let i = sorted.length - 1; i >= 0; i--) { if (sorted[i].aplus === "Yes") aplusStreak++; else break; }
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

function buildDayMap(trades) {
  const m = {};
  trades.forEach((t) => {
    if (!t.dt) return;
    const k = dateKey(t.dt);
    if (!m[k]) m[k] = { pnl: 0, count: 0, trades: [], aplusTrades: 0 };
    m[k].pnl += parseFloat(t.profit) || 0;
    if (t.taken) m[k].count++;
    m[k].trades.push(t);
    if (t.aplus === "Yes") m[k].aplusTrades++;
  });
  return m;
}

// ─── SHARED COMPONENTS ──────────────────────────────────────────────────────

function TCard({ children, style = {}, className = "" }) {
  return (
    <div className={`card-pad ${className}`} style={{
      background: "var(--bg-secondary)", borderRadius: 8, border: "1px solid var(--border-primary)",
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
      <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color }}>{value}</div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>{label}</div>
    </TCard>
  );
}

function Badge({ label, color, bg }) {
  return (
    <span style={{
      display: "inline-block", padding: "2px 8px", borderRadius: 4,
      fontSize: 11, fontWeight: 700, color, background: `${color}15`, border: `1px solid ${color}30`,
      fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.05em",
    }}>
      {label}
    </span>
  );
}

function Field({ label, children, full }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, gridColumn: full ? "1 / -1" : undefined }}>
      <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle = {
  width: "100%", padding: "11px 14px", fontSize: 14, border: "1.5px solid var(--border-primary)",
  borderRadius: 4, outline: "none", background: "var(--bg-input)", color: "var(--text-primary)",
  fontFamily: "inherit", transition: "border-color 0.2s",
};

const selectStyle = { ...inputStyle, cursor: "pointer" };

// ═══════════════════════════════════════════════════════════════════════════
// CHECKLIST TAB — Only the A+ checklist
// ═══════════════════════════════════════════════════════════════════════════

export function ChecklistView() {
  const [checked, setChecked] = useState(new Array(10).fill(false));
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(10);
  const timerRef = useRef(null);

  const toggleCheck = (i) => {
    if (CHECKLIST_ITEMS[i].timer) { startTimer(i); return; }
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
    setChecked(new Array(10).fill(false));
    if (timerRef.current) clearInterval(timerRef.current);
    setTimerActive(false);
    setTimerSecs(10);
  };

  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const count = checked.filter(Boolean).length;
  const allChecked = count === 10;

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <TCard style={{ padding: 28 }}>
        {/* Progress bar */}
        <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 8, marginBottom: 10, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--green), var(--accent))", transition: "width 0.3s", width: `${(count / 10) * 100}%`, boxShadow: "0 0 8px var(--accent-glow)" }} />
        </div>
        <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 24 }}>
          <span style={{ color: "var(--green)", fontWeight: 600 }}>{count}</span> / 10 confirmed
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {CHECKLIST_ITEMS.map((item, i) => (
            <div
              key={i}
              onClick={() => toggleCheck(i)}
              style={{
                display: "flex", alignItems: "center", gap: 16,
                background: checked[i] ? "var(--accent-glow)" : "var(--bg-tertiary)",
                border: `1.5px solid ${checked[i] ? "var(--accent-dim)" : "var(--border-primary)"}`,
                borderRadius: 6, padding: "16px 20px", cursor: "pointer",
                transition: "all 0.2s", userSelect: "none",
                boxShadow: checked[i] ? "0 0 10px var(--accent-glow)" : "none",
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
                <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>{item.sub}</div>
                {item.timer && !checked[i] && (
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", marginTop: 10, fontSize: 13, color: timerActive ? "var(--gold)" : "var(--text-tertiary)" }}>
                    {timerActive ? `⏱ Think about it... ${timerSecs}s` : "Click to start 10 second timer..."}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Result */}
        <div style={{
          marginTop: 28, borderRadius: 6, padding: 22, textAlign: "center",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: allChecked ? 700 : 400, fontSize: allChecked ? 14 : 13,
          letterSpacing: allChecked ? "0.1em" : "0.05em",
          textTransform: "uppercase",
          background: allChecked ? "var(--accent-glow)" : "var(--bg-tertiary)",
          border: `1.5px solid ${allChecked ? "var(--accent-dim)" : "var(--border-primary)"}`,
          color: allChecked ? "var(--green)" : "var(--text-tertiary)",
          boxShadow: allChecked ? "0 0 20px var(--accent-glow)" : "none",
        }}>
          {allChecked ? "A+ TRADE CONFIRMED — TAKE IT" : "Check off all conditions to confirm your setup."}
        </div>

        <button onClick={resetChecklist} style={{
          display: "block", width: "100%", marginTop: 18, padding: 14,
          fontFamily: "'JetBrains Mono', monospace",
          background: "transparent", border: "1.5px solid var(--border-primary)", color: "var(--text-tertiary)",
          borderRadius: 4, fontSize: 13, cursor: "pointer", textTransform: "uppercase", letterSpacing: "0.08em",
        }}>
          RESET FOR NEXT TRADE
        </button>
      </TCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// JOURNAL TAB — Pre-Trade Plan + Log a Trade
// ═══════════════════════════════════════════════════════════════════════════

export function JournalView({ supabase, user, loadTrades, syncToSheets, gsUrl, setGsUrl }) {
  // Plan state
  const [plan, setPlan] = useState({ bias: "", max_trades: "2", key_levels: "", session_plan: "", notes: "" });
  const [planSaved, setPlanSaved] = useState(false);

  // Form state
  const [formDt, setFormDt] = useState(nowLocal());
  const [formAsset, setFormAsset] = useState("");
  const [formDirection, setFormDirection] = useState("");
  const [formAplus, setFormAplus] = useState("");
  const [formTaken, setFormTaken] = useState("");
  const [formBias, setFormBias] = useState("");
  const [formProfit, setFormProfit] = useState("");
  const [formChart, setFormChart] = useState("");
  const [formAfter, setFormAfter] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // Google Sheets settings
  const [showGsSettings, setShowGsSettings] = useState(false);

  const today = new Date();
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
      if (data) {
        setPlan({
          bias: data.bias || "",
          max_trades: String(data.max_trades || 2),
          key_levels: data.key_levels || "",
          session_plan: data.session_plan || "",
          notes: data.notes || "",
        });
      }
    })();
  }, [user, todayStr]);

  const savePlan = async () => {
    if (!user) return;
    await supabase.from("trade_plans").upsert({
      user_id: user.id,
      plan_date: todayStr,
      bias: plan.bias,
      max_trades: parseInt(plan.max_trades) || 2,
      key_levels: plan.key_levels,
      session_plan: plan.session_plan,
      notes: plan.notes,
    }, { onConflict: "user_id,plan_date" });
    // Sync plan to Google Sheets — Column L expects "preMarketJournal"
    if (syncToSheets) {
      syncToSheets({
        type: "plan",
        dt: new Date().toISOString(),
        dtFormatted: fmtDate(new Date()),
        preMarketJournal: plan.session_plan || "",
      });
    }
    setPlanSaved(true);
    setTimeout(() => setPlanSaved(false), 2000);
  };

  const saveGsUrl = () => {
    try { localStorage.setItem("gsUrl", gsUrl); } catch (e) {}
    setShowGsSettings(false);
  };

  const logTrade = async () => {
    if (!formDt || !formAsset) { alert("Please fill in Date & Time and Asset at minimum."); return; }
    const tradeData = {
      user_id: user.id,
      dt: new Date(formDt).toISOString(),
      asset: formAsset,
      direction: formDirection,
      aplus: formAplus,
      taken: formTaken,
      bias: formBias,
      profit: formProfit ? parseFloat(formProfit) : null,
      chart: formChart,
      after_chart: formAfter,
      notes: formNotes,
    };
    const { error } = await supabase.from("trades").insert(tradeData);
    if (!error) {
      if (syncToSheets) syncToSheets({ ...tradeData, after: tradeData.after_chart, dtFormatted: fmtDate(formDt), preMarketJournal: plan.session_plan || "" });
      setFormAsset(""); setFormDirection(""); setFormAplus("");
      setFormTaken(""); setFormProfit(""); setFormChart("");
      setFormAfter(""); setFormNotes(""); setFormDt(nowLocal());
      loadTrades();
    }
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Google Sheets Settings Toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", marginBottom: 12, gap: 8 }}>
        {gsUrl && !showGsSettings && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--green)" }}>SHEETS CONNECTED</span>}
        <button onClick={() => setShowGsSettings(!showGsSettings)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-tertiary)" }} title="Google Sheets sync settings">⚙️</button>
      </div>
      {showGsSettings && (
        <TCard style={{ padding: 20, marginBottom: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12 }}>GOOGLE SHEETS SYNC</div>
          <div style={{ display: "flex", gap: 10 }}>
            <input style={{ ...inputStyle, flex: 1 }} type="url" placeholder="Paste your Apps Script URL here..." value={gsUrl} onChange={(e) => setGsUrl(e.target.value)} />
            <button onClick={saveGsUrl} style={{ fontFamily: "'JetBrains Mono', monospace", padding: "10px 20px", fontSize: 13, fontWeight: 700, background: "transparent", color: "var(--accent)", border: "1px solid var(--accent)", borderRadius: 4, cursor: "pointer", whiteSpace: "nowrap", letterSpacing: "0.05em" }}>SAVE</button>
          </div>
          <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 10 }}>Plans and trades will sync to both Supabase and your Google Sheet.</div>
        </TCard>
      )}

      {/* Pre-Trade Plan */}
      <TCard style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>PRE-TRADE PLAN</div>
        <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 20 }}>
          {today.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, marginBottom: 16 }}>
          <Field label="Daily Bias">
            <select style={selectStyle} value={plan.bias} onChange={(e) => setPlan({ ...plan, bias: e.target.value })}>
              <option value="">Select...</option>
              <option>Bullish</option>
              <option>Bearish</option>
              <option>Neutral</option>
            </select>
          </Field>
          <Field label="Max Trades Today">
            <select style={selectStyle} value={plan.max_trades} onChange={(e) => setPlan({ ...plan, max_trades: e.target.value })}>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
            </select>
          </Field>
          <Field label="Key Levels Watching" full>
            <input style={inputStyle} placeholder="e.g. PDH 21,450 / Asia Low 21,200" value={plan.key_levels} onChange={(e) => setPlan({ ...plan, key_levels: e.target.value })} />
          </Field>
          <Field label="Session Plan" full>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="What's your plan for today's NY session?" value={plan.session_plan} onChange={(e) => setPlan({ ...plan, session_plan: e.target.value })} />
          </Field>
          <Field label="Notes" full>
            <input style={inputStyle} placeholder="Anything else to keep in mind..." value={plan.notes} onChange={(e) => setPlan({ ...plan, notes: e.target.value })} />
          </Field>
        </div>
        <button onClick={savePlan} style={{
          fontFamily: "'JetBrains Mono', monospace", width: "100%", padding: 12, fontSize: 13, fontWeight: 700, border: "1px solid var(--accent-secondary)", borderRadius: 4, cursor: "pointer",
          background: "transparent", color: "var(--accent-secondary)", letterSpacing: "0.08em", textTransform: "uppercase",
          boxShadow: "0 0 15px rgba(59,130,246,0.1)",
        }}>
          SAVE TODAY'S PLAN
        </button>
        {planSaved && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--green)", textAlign: "center", marginTop: 10 }}>PLAN SAVED</div>}
      </TCard>

      {/* Log Trade Form */}
      <TCard style={{ padding: 28 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.08em" }}>
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
          <Field label="Profit ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 500 or -200" value={formProfit} onChange={(e) => setFormProfit(e.target.value)} />
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
        </div>
        <button onClick={logTrade} style={{
          fontFamily: "'JetBrains Mono', monospace", width: "100%", padding: 13, fontSize: 13, fontWeight: 700, border: "1px solid var(--accent)", borderRadius: 4, cursor: "pointer",
          background: "transparent", color: "var(--accent)", letterSpacing: "0.08em", textTransform: "uppercase",
          boxShadow: "0 0 15px var(--accent-glow)",
        }}>
          + LOG TRADE
        </button>
      </TCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// STATS TAB — Trade stats, equity curve, calendar, trade history
// ═══════════════════════════════════════════════════════════════════════════

export function TradeStatsView({ supabase, user, trades, loadTrades }) {
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [dayPopup, setDayPopup] = useState(null);
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const dayMap = buildDayMap(trades);

  // Equity curve
  useEffect(() => {
    if (!chartRef.current) return;
    const sorted = [...trades].filter((t) => t.dt && t.profit !== "" && t.profit != null).sort((a, b) => new Date(a.dt) - new Date(b.dt));
    const labels = [];
    const data = [];
    let cum = 0;
    sorted.forEach((t) => {
      cum += parseFloat(t.profit) || 0;
      labels.push(new Date(t.dt).toLocaleDateString([], { month: "short", day: "numeric" }));
      data.push(parseFloat(cum.toFixed(2)));
    });
    if (!labels.length) { labels.push("No trades yet"); data.push(0); }

    if (chartInstance.current) chartInstance.current.destroy();
    const isDark = getComputedStyle(document.documentElement).getPropertyValue('--bg-primary').trim().startsWith('#0');
    const green = isDark ? "#00e8c4" : "#00b896";
    const red = isDark ? "#ff4757" : "#e53e3e";
    const greenFill = isDark ? "rgba(0,232,196,0.08)" : "rgba(0,184,150,0.08)";
    const redFill = isDark ? "rgba(255,71,87,0.08)" : "rgba(229,62,62,0.08)";

    // Create gradient fill that switches color at zero line
    const ctx = chartRef.current.getContext("2d");
    const segmentColor = (c) => c.p0.parsed.y >= 0 && c.p1.parsed.y >= 0 ? green : c.p0.parsed.y < 0 && c.p1.parsed.y < 0 ? red : c.p1.parsed.y >= 0 ? green : red;
    const segmentFill = (c) => c.p0.parsed.y >= 0 && c.p1.parsed.y >= 0 ? greenFill : c.p0.parsed.y < 0 && c.p1.parsed.y < 0 ? redFill : c.p1.parsed.y >= 0 ? greenFill : redFill;
    const pointColors = data.map((v) => v >= 0 ? green : red);

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
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` $${c.raw.toFixed(2)}` } } },
        scales: {
          x: { ticks: { color: "var(--text-tertiary)", maxTicksLimit: 8, font: { size: 11, family: "'JetBrains Mono', monospace" } }, grid: { color: "var(--hud-grid)" } },
          y: { ticks: { color: "var(--text-tertiary)", callback: (v) => "$" + v, font: { size: 11, family: "'JetBrains Mono', monospace" } }, grid: { color: "var(--hud-grid)" } },
        },
      },
    });
    return () => { if (chartInstance.current) chartInstance.current.destroy(); };
  }, [trades]);

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
      chart: trade.chart || "", after_chart: trade.after_chart || "",
      notes: trade.notes || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from("trades").update({
      dt: editForm.dt ? new Date(editForm.dt).toISOString() : null,
      asset: editForm.asset, direction: editForm.direction,
      aplus: editForm.aplus, taken: editForm.taken, bias: editForm.bias,
      profit: editForm.profit ? parseFloat(editForm.profit) : null,
      chart: editForm.chart, after_chart: editForm.after_chart, notes: editForm.notes,
    }).eq("id", editing);
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
  const wins = monthTrades.filter((t) => t.taken && t.taken !== "Missed" && parseFloat(t.profit) > 0).length;
  const wr = taken ? Math.round((wins / taken) * 100) : 0;
  const pnl = monthTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);

  // Calendar
  const calPrev = () => { let m = calMonth - 1, y = calYear; if (m < 0) { m = 11; y--; } setCalMonth(m); setCalYear(y); };
  const calNext = () => { let m = calMonth + 1, y = calYear; if (m > 11) { m = 0; y++; } setCalMonth(m); setCalYear(y); };
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const todayDate = new Date();

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Stats Bar */}
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 8 }}>
        {new Date(calYear, calMonth).toLocaleString("default", { month: "long", year: "numeric" })} Stats
      </div>
      <div className="grid-5" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatBox value={total} label="Logged" color="var(--text-secondary)" />
        <StatBox value={taken} label="Taken" color="var(--text-secondary)" />
        <StatBox value={aplus} label="A+ Setups" color="var(--green)" />
        <StatBox value={`${wr}%`} label="Win Rate" color={wr >= 50 ? "var(--green)" : "var(--red)"} />
        <StatBox value={`${pnl >= 0 ? "+" : ""}$${pnl.toFixed(0)}`} label="Net P&L" color={pnl >= 0 ? "var(--green)" : "var(--red)"} />
      </div>

      {/* Equity Curve */}
      <TCard style={{ padding: 28, marginBottom: 24, overflow: "hidden" }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 20 }}>
          EQUITY CURVE
        </div>
        <canvas ref={chartRef} height={120} style={{ width: "100%", borderRadius: 8 }} />
      </TCard>

      {/* P&L Calendar */}
      <TCard style={{ marginBottom: 24, overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>P&L CALENDAR</div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <button onClick={calPrev} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>◀</button>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 600, color: "var(--text-primary)", minWidth: 150, textAlign: "center" }}>{MONTHS[calMonth]} {calYear}</span>
            <button onClick={calNext} style={{ background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, padding: "6px 14px", cursor: "pointer", fontSize: 14 }}>▶</button>
          </div>
        </div>
        <div style={{ padding: 20 }}>
          <div className="cal-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6, marginBottom: 6 }}>
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} style={{ textAlign: "center", fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", padding: 6, letterSpacing: "0.05em" }}>{d}</div>
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
                    minHeight: 80, borderRadius: 4, padding: "8px 10px", fontSize: 13,
                    border: `1.5px solid ${isGreen ? "var(--green)" : isRed ? "var(--red)" : "var(--border-primary)"}`,
                    background: isGreen ? "var(--accent-glow)" : isRed ? "rgba(255,71,87,0.06)" : "var(--bg-tertiary)",
                    cursor: data ? "pointer" : "default",
                    boxShadow: isToday ? "0 0 0 2px var(--accent-secondary)" : isGreen ? "0 0 8px var(--accent-glow)" : "none",
                    transition: "all 0.2s",
                  }}
                >
                  <div className="cal-day-num" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: isGreen ? "var(--green)" : isRed ? "var(--red)" : "var(--text-tertiary)", marginBottom: 4 }}>{d}</div>
                  {data && (
                    <>
                      <div className="cal-pnl" style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: isGreen ? "var(--green)" : "var(--red)" }}>
                        {data.pnl >= 0 ? "+" : ""}${data.pnl.toFixed(0)}
                      </div>
                      <div className="cal-count" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", marginTop: 2 }}>{data.count} trade{data.count !== 1 ? "s" : ""}</div>
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
            return (
              <div key={i} style={{ background: "var(--bg-tertiary)", borderRadius: 4, padding: "12px 16px", marginBottom: 10, fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.asset || "—"}</strong>
                <span>{t.direction || "—"}</span>
                <span>A+: {t.aplus || "—"}</span>
                <span>Taken: {t.taken || "—"}</span>
                <span>P&L: {t.profit != null ? <span style={{ fontFamily: "'JetBrains Mono', monospace", color: p >= 0 ? "var(--green)" : "var(--red)" }}>{p >= 0 ? "+" : ""}${p.toFixed(0)}</span> : "—"}</span>
                {t.notes && <span style={{ color: "var(--text-tertiary)", fontStyle: "italic" }}>{t.notes}</span>}
              </div>
            );
          })}
        </TCard>
      )}

      {/* Trade History Table */}
      <TCard style={{ overflow: "hidden" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>TRADE HISTORY</div>
        </div>
        {!trades.length ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--text-tertiary)", fontSize: 16 }}>No trades logged yet.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)" }}>
                  {["Date", "Asset", "Dir", "A+", "Taken", "Bias", "P&L", "Chart", "After", "Notes", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
                  const p = parseFloat(t.profit);
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
                        {t.profit != null ? <span style={{ color: p >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(0)}</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.chart ? <a href={t.chart} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.after_chart ? <a href={t.after_chart} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={{ ...cellStyle, maxWidth: 140, color: "var(--text-tertiary)", overflow: "hidden", textOverflow: "ellipsis" }} title={t.notes}>{t.notes || "—"}</td>
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

      {/* Edit Modal */}
      {editing && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, animation: "fadeSlideIn 0.2s ease" }}
          onClick={(e) => e.target === e.currentTarget && setEditing(null)}
        >
          <TCard className="modal-card" style={{ padding: 32, width: "100%", maxWidth: 640, maxHeight: "90vh", overflowY: "auto", boxShadow: "0 0 40px rgba(0,0,0,0.5), 0 0 15px var(--accent-glow)" }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", marginBottom: 24, textTransform: "uppercase", letterSpacing: "0.08em" }}>EDIT TRADE</div>
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
              <Field label="Profit ($)">
                <input type="number" style={inputStyle} value={editForm.profit} onChange={(e) => setEditForm({ ...editForm, profit: e.target.value })} />
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
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={() => setEditing(null)} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, fontSize: 13, fontWeight: 600, padding: 13, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
              <button onClick={saveEdit} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, fontSize: 13, fontWeight: 700, padding: 13, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "0 0 15px var(--accent-glow)", letterSpacing: "0.05em" }}>SAVE CHANGES</button>
            </div>
          </TCard>
        </div>
      )}

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
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState("");
  const [period, setPeriod] = useState("");

  const saveKey = (k) => { setApiKey(k); try { localStorage.setItem("aiApiKey", k); } catch {} };

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

    if (!apiKey) { setOutput("No API key set. Click the key icon to add your Anthropic API key."); setPeriod(label); return; }

    setPeriod(label); setLoading(true); setOutput("");
    const taken = periodTrades.filter((t) => t.taken && t.taken !== "Missed").length;
    const wins = periodTrades.filter((t) => t.taken && t.taken !== "Missed" && parseFloat(t.profit) > 0).length;
    const losses = periodTrades.filter((t) => t.taken && t.taken !== "Missed" && parseFloat(t.profit) < 0).length;
    const aplusTaken = periodTrades.filter((t) => t.aplus === "Yes" && t.taken && t.taken !== "Missed").length;
    const nonAplus = periodTrades.filter((t) => t.aplus === "No" && t.taken && t.taken !== "Missed").length;
    const totalPnl = periodTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const missed = periodTrades.filter((t) => t.taken === "Missed").length;

    const tradesSummary = periodTrades.map((t) => `Date: ${t.dt}, Asset: ${t.asset}, Direction: ${t.direction}, A+: ${t.aplus}, Taken: ${t.taken}, Profit: $${t.profit || 0}, Notes: ${t.notes || "none"}`).join("\n");

    const prompt = `You are a strict but supportive trading coach analyzing the performance of a trader who uses an ICT-inspired fractal model. Here is everything you need to know about their trading model and rules:

TRADING MODEL:
- Trades NQ, ES, GC, SI (index futures primarily)
- Uses: Fractal Model (TTFM), CISD, ICCISD, SMT divergence, CIC (Crack in Correlation), liquidity framework, FVGs
- A+ trade requires: CIC/SMT confirmation, key level/liquidity, timeframe alignment, CISD, ICCISD, TTFM alignment, correct session, good R:R, stop loss defined
- Default rule: NY session only. Avoid London session
- Max 2 trades per session
- Core psychological leaks: entering before confirmation, moving stops too early, trading London, revenge trading after losses, hesitating on clean setups, taking messy ones

PERIOD: ${label}
TOTAL TRADES LOGGED: ${periodTrades.length}
TRADES TAKEN: ${taken} (Wins: ${wins}, Losses: ${losses})
A+ TRADES TAKEN: ${aplusTaken}
NON-A+ TRADES TAKEN: ${nonAplus}
MISSED SETUPS: ${missed}
NET P&L: $${totalPnl.toFixed(2)}
WIN RATE: ${taken ? Math.round((wins / taken) * 100) : 0}%

INDIVIDUAL TRADES:
${tradesSummary}

Please provide a thorough but concise trading performance summary covering:
1. Performance Overview — P&L, win rate, key numbers
2. What went well — discipline, A+ compliance, good executions
3. Areas of concern — rule violations, patterns to watch, psychological leaks showing up in the data
4. Key focus for next ${p === "week" ? "week" : "month"} — 2-3 specific, actionable improvements
5. Mindset note — one honest observation about their psychology based on the trades

Be direct, honest and specific. Reference actual trades and notes where relevant. Keep it under 400 words.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
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
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>AI TRADING SUMMARY</div>
        <button onClick={() => setShowKeyInput(!showKeyInput)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: apiKey ? "var(--green)" : "var(--text-tertiary)" }} title="Set API Key">🔑</button>
      </div>
      {showKeyInput && (
        <div style={{ marginBottom: 16 }}>
          <input type="password" style={inputStyle} placeholder="Anthropic API Key" value={apiKey} onChange={(e) => saveKey(e.target.value)} />
          <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 4 }}>Your key is stored locally and never sent to our servers.</div>
        </div>
      )}
      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        <button onClick={() => generate("week")} disabled={loading} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--accent-secondary)", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", background: "transparent", color: "var(--accent-secondary)", letterSpacing: "0.05em", textTransform: "uppercase" }}>THIS WEEK</button>
        <button onClick={() => generate("month")} disabled={loading} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, padding: "10px 16px", fontSize: 12, fontWeight: 600, border: "1px solid var(--purple)", borderRadius: 4, cursor: loading ? "not-allowed" : "pointer", background: "transparent", color: "var(--purple)", letterSpacing: "0.05em", textTransform: "uppercase" }}>THIS MONTH</button>
      </div>
      {period && <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 10 }}>{period}</div>}
      {loading && <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--accent-secondary)", padding: "16px 0", animation: "hudPulse 1.5s ease-in-out infinite" }}>ANALYZING TRADES...</div>}
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
  let xp = 0;
  trades.forEach((t) => { xp += 10; if (t.aplus === "Yes") xp += 15; if (parseFloat(t.profit) > 0) xp += 20; if (t.notes && t.notes.length > 10) xp += 5; });
  Object.values(dayMap).forEach((d) => { if (d.pnl > 0) xp += 25; });

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
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", marginBottom: 18, textTransform: "uppercase", letterSpacing: "0.08em" }}>BADGES</div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 12 }}>
        {badges.map((b, i) => (
          <div key={i} style={{
            textAlign: "center", padding: 16, borderRadius: 6,
            background: b.unlocked ? "var(--accent-glow)" : "var(--bg-tertiary)",
            border: b.unlocked ? "1.5px solid var(--accent-dim)" : "1.5px solid var(--border-primary)",
            opacity: b.unlocked ? 1 : 0.5,
            boxShadow: b.unlocked ? "0 0 10px var(--accent-glow)" : "none",
          }}>
            <div style={{ fontSize: 28, marginBottom: 6 }}>{b.icon}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: b.unlocked ? "var(--text-primary)" : "var(--text-tertiary)" }}>{b.name}</div>
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
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>WEEKLY CHALLENGES</span>
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)" }}>Resets every Monday</span>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {challenges.map((c, i) => {
          const pct = Math.min(100, Math.round((c.cur / c.goal) * 100));
          const done = c.cur >= c.goal;
          return (
            <div key={i}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: done ? "var(--green)" : "var(--text-secondary)" }}>{done ? "✓ " : ""}{c.name}</span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", fontWeight: 600 }}>{c.cur} / {c.goal}</span>
              </div>
              <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 8, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
                <div style={{ height: "100%", borderRadius: 4, background: done ? "linear-gradient(90deg, var(--green), var(--accent))" : "linear-gradient(90deg, var(--accent-secondary), #60a5fa)", transition: "width 0.4s", width: `${pct}%`, boxShadow: done ? "0 0 8px var(--accent-glow)" : "none" }} />
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

export function TradingStatsView({ trades }) {
  const dayMap = buildDayMap(trades);

  const calcXP = () => {
    let xp = 0;
    trades.forEach((t) => { xp += 10; if (t.aplus === "Yes") xp += 15; if (parseFloat(t.profit) > 0) xp += 20; if (t.notes && t.notes.length > 10) xp += 5; });
    Object.values(dayMap).forEach((d) => { if (d.pnl > 0) xp += 25; });
    return xp;
  };

  const xp = calcXP();
  let level = XP_LEVELS[0];
  for (const l of XP_LEVELS) { if (xp >= l.min) level = l; }
  const isMax = level.max === Infinity;
  const pct = isMax ? 100 : Math.min(100, ((xp - level.min) / (level.max - level.min)) * 100);

  const { greenStreak, bestGreen, aplusStreak, bestAplus } = calcStreaks(trades);

  return (
    <div>
      <TCard style={{ padding: 28, marginBottom: 24 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{level.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-tertiary)" }}>{xp} XP</div>
          </div>
          <div style={{ fontSize: 40 }}>{level.icon}</div>
        </div>
        <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 10, overflow: "hidden", marginBottom: 8, border: "1px solid var(--border-primary)" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--purple), #c060ff)", transition: "width 0.5s", width: `${pct}%`, boxShadow: "0 0 8px rgba(167,139,250,0.3)" }} />
        </div>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", textAlign: "right" }}>
          {isMax ? "Max level reached!" : `${xp - level.min} / ${level.max - level.min} XP to next level`}
        </div>
      </TCard>
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <TCard style={{ padding: 22, textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: "var(--gold)" }}>{greenStreak}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>Green Day Streak</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Best: {bestGreen} days</div>
        </TCard>
        <TCard style={{ padding: 22, textAlign: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 32, fontWeight: 700, color: "var(--green)" }}>{aplusStreak}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 6 }}>A+ Trade Streak</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", marginTop: 8 }}>Best: {bestAplus} trades</div>
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

const emptyForm = { firm: "", account_name: "", account_type: "", account_size: "", status: "", profit_target: "", current_pnl: "", max_drawdown: "", daily_loss_limit: "", notes: "" };

export function AccountsView({ supabase, user }) {
  const [accounts, setAccounts] = useState([]);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyForm });

  const loadAccounts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (data) setAccounts(data);
  }, [user]);

  useEffect(() => { loadAccounts(); }, [loadAccounts]);

  const resetForm = () => { setForm({ ...emptyForm }); setEditing(null); };

  const saveAccount = async () => {
    if (!form.firm) { alert("Please enter a firm name."); return; }
    const payload = {
      user_id: user.id, firm: form.firm, account_name: form.account_name || form.firm,
      account_type: form.account_type || "eval", account_size: form.account_size ? parseFloat(form.account_size) : null,
      status: form.status || "active", profit_target: form.profit_target ? parseFloat(form.profit_target) : null,
      current_pnl: form.current_pnl ? parseFloat(form.current_pnl) : null,
      max_drawdown: form.max_drawdown ? parseFloat(form.max_drawdown) : null,
      daily_loss_limit: form.daily_loss_limit ? parseFloat(form.daily_loss_limit) : null,
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
      notes: acc.notes || "",
    });
  };

  // Summary counts
  const fundedCount = accounts.filter((a) => a.account_type === "funded" || a.status === "funded_active").length;
  const evalCount = accounts.filter((a) => a.account_type === "eval" && !["passed", "breached", "failed"].includes(a.status)).length;
  const passedCount = accounts.filter((a) => a.status === "passed").length;
  const failedCount = accounts.filter((a) => ["breached", "failed"].includes(a.status)).length;

  const getStatusMeta = (s) => ACCOUNT_STATUSES.find((st) => st.value === s) || ACCOUNT_STATUSES[0];

  const fmtMoney = (v) => {
    if (v == null || v === "") return null;
    const n = Number(v);
    return "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Summary */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <StatBox value={fundedCount} label="Funded" color="var(--green)" />
        <StatBox value={evalCount} label="In Eval" color="var(--accent-secondary)" />
        <StatBox value={passedCount} label="Passed" color="var(--green)" />
        <StatBox value={failedCount} label="Failed" color={failedCount > 0 ? "var(--red)" : "var(--text-tertiary)"} />
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
          return (
            <TCard key={acc.id} style={{ padding: 24, borderLeft: `4px solid ${statusMeta.color}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{acc.account_name || acc.firm}</span>
                <Badge label={statusMeta.label} color={statusMeta.color} />
              </div>
              <div style={{ display: "flex", gap: 28, fontSize: 14, flexWrap: "wrap", marginBottom: 14 }}>
                {acc.account_size != null && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Account Size</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.account_size)}</div>
                  </div>
                )}
                {pnl != null && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Current P&L</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: pnl >= 0 ? "var(--green)" : "var(--red)", fontSize: 15 }}>{pnl >= 0 ? "+" : "-"}{fmtMoney(pnl)}</div>
                  </div>
                )}
                {acc.profit_target != null && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Profit Target</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.profit_target)}</div>
                  </div>
                )}
                {acc.max_drawdown != null && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Max Drawdown</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.max_drawdown)}</div>
                  </div>
                )}
                {acc.daily_loss_limit != null && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Daily Loss Limit</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{fmtMoney(acc.daily_loss_limit)}</div>
                  </div>
                )}
              </div>
              {acc.notes && (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-secondary)", lineHeight: 1.6, padding: "10px 0", borderTop: "1px solid var(--border-primary)", whiteSpace: "pre-wrap" }}>{acc.notes}</div>
              )}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 14 }}>
                <button onClick={() => openEdit(acc)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--accent-secondary)", fontWeight: 600 }}>✏️ Edit</button>
                <button onClick={() => deleteAccount(acc.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, color: "var(--text-tertiary)", fontWeight: 600 }}>✕ Delete</button>
              </div>
            </TCard>
          );
        })}
      </div>

      {/* Add / Edit Form — always visible */}
      <TCard style={{ padding: 28 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>
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
        <div className="form-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 14, marginBottom: 20 }}>
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
        </div>
        <div style={{ marginBottom: 20 }}>
          <Field label="Notes">
            <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }} placeholder="Withdrawal dates, rules, notes..." value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          </Field>
        </div>
        <div style={{ display: "flex", gap: 12 }}>
          {editing && (
            <button onClick={resetForm} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, fontSize: 13, fontWeight: 600, padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
          )}
          <button onClick={saveAccount} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, fontSize: 13, fontWeight: 700, padding: 14, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "0 0 15px var(--accent-glow)", letterSpacing: "0.05em" }}>
            {editing ? "SAVE CHANGES" : "+ ADD ACCOUNT"}
          </button>
        </div>
      </TCard>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD VIEW — Home page with live stats, mood, drawdown, export
// ═══════════════════════════════════════════════════════════════════════════

function ProgressBar({ pct, color, height = 8 }) {
  return (
    <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
      <div style={{ height: "100%", borderRadius: 4, background: color, width: `${Math.min(100, Math.max(0, pct))}%`, transition: "width 0.5s" }} />
    </div>
  );
}

export function DashboardView({ supabase, user, trades, syncToSheets }) {
  const [accounts, setAccounts] = useState([]);
  const [mood, setMood] = useState(null);
  const [moodLoaded, setMoodLoaded] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("accounts").select("*").eq("user_id", user.id).order("created_at").then(({ data }) => { if (data) setAccounts(data); });
    const today = new Date().toISOString().slice(0, 10);
    supabase.from("daily_moods").select("mood").eq("user_id", user.id).eq("mood_date", today).maybeSingle().then(({ data }) => {
      if (data) setMood(data.mood);
      setMoodLoaded(true);
    });
  }, [user]);

  const selectMood = async (m) => {
    setMood(m);
    const today = new Date().toISOString().slice(0, 10);
    await supabase.from("daily_moods").upsert({ user_id: user.id, mood_date: today, mood: m }, { onConflict: "user_id,mood_date" });
    syncToSheets({ type: "mood", mood: m, dt: new Date().toISOString(), dtFormatted: fmtDate(new Date()) });
  };

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

  // PDF export
  const [exportPeriod, setExportPeriod] = useState("month");
  const exportPDF = () => {
    const n = new Date();
    let start, end, label;
    if (exportPeriod === "week") {
      start = new Date(n); start.setDate(n.getDate() - n.getDay() + 1); start.setHours(0, 0, 0, 0);
      end = new Date(start); end.setDate(start.getDate() + 5);
      label = `Week of ${start.toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}`;
    } else {
      start = new Date(n.getFullYear(), n.getMonth(), 1);
      end = new Date(n.getFullYear(), n.getMonth() + 1, 0, 23, 59, 59);
      label = n.toLocaleDateString([], { month: "long", year: "numeric" });
    }
    const periodTrades = trades.filter((t) => { if (!t.dt) return false; const d = new Date(t.dt); return d >= start && d <= end; });
    const takenT = periodTrades.filter((t) => t.taken && t.taken !== "Missed");
    const wins = takenT.filter((t) => parseFloat(t.profit) > 0).length;
    const losses = takenT.filter((t) => parseFloat(t.profit) < 0).length;
    const totalPnl = periodTrades.reduce((s, t) => s + (parseFloat(t.profit) || 0), 0);
    const avgWin = wins ? takenT.filter((t) => parseFloat(t.profit) > 0).reduce((s, t) => s + parseFloat(t.profit), 0) / wins : 0;
    const avgLoss = losses ? takenT.filter((t) => parseFloat(t.profit) < 0).reduce((s, t) => s + parseFloat(t.profit), 0) / losses : 0;
    const aplusCount = periodTrades.filter((t) => t.aplus === "Yes").length;
    const wr = takenT.length ? Math.round((wins / takenT.length) * 100) : 0;

    const doc = new jsPDF();
    doc.setFont("courier", "bold");
    doc.setFontSize(18);
    doc.text("TRADER ROADMAP XP", 105, 20, { align: "center" });
    doc.setFontSize(12);
    doc.text(`PERFORMANCE REPORT — ${label.toUpperCase()}`, 105, 30, { align: "center" });
    doc.setDrawColor(0, 200, 160);
    doc.line(20, 35, 190, 35);

    doc.setFont("courier", "bold");
    doc.setFontSize(11);
    let y = 48;
    const row = (lbl, val) => { doc.setFont("courier", "normal"); doc.text(lbl, 25, y); doc.setFont("courier", "bold"); doc.text(String(val), 120, y); y += 8; };
    row("Total Trades:", String(periodTrades.length));
    row("Trades Taken:", String(takenT.length));
    row("Win Rate:", `${wr}%`);
    row("Net P&L:", `$${totalPnl.toFixed(2)}`);
    row("Avg Win:", `$${avgWin.toFixed(2)}`);
    row("Avg Loss:", `$${avgLoss.toFixed(2)}`);
    row("A+ Setups:", String(aplusCount));
    row("Wins / Losses:", `${wins} / ${losses}`);

    y += 8;
    doc.line(20, y, 190, y);
    y += 12;

    if (accounts.length) {
      doc.setFont("courier", "bold");
      doc.setFontSize(12);
      doc.text("ACCOUNT STATUS", 25, y); y += 10;
      doc.setFontSize(10);
      accounts.forEach((acc) => {
        doc.setFont("courier", "bold");
        doc.text(`${acc.account_name || acc.firm}`, 25, y);
        doc.setFont("courier", "normal");
        doc.text(`Type: ${acc.account_type}  |  Status: ${acc.status}  |  P&L: $${acc.current_pnl || 0}`, 25, y + 6);
        y += 16;
        if (y > 270) { doc.addPage(); y = 20; }
      });
      y += 4;
      doc.line(20, y, 190, y);
      y += 12;
    }

    doc.setFont("courier", "bold");
    doc.setFontSize(12);
    doc.text("TRADE LOG", 25, y); y += 10;
    doc.setFontSize(8);
    doc.setFont("courier", "bold");
    doc.text("DATE", 25, y); doc.text("ASSET", 55, y); doc.text("DIR", 80, y); doc.text("A+", 97, y); doc.text("TAKEN", 110, y); doc.text("P&L", 145, y); doc.text("BIAS", 170, y);
    y += 6;
    doc.setFont("courier", "normal");
    const sorted = [...periodTrades].sort((a, b) => new Date(a.dt) - new Date(b.dt));
    sorted.forEach((t) => {
      if (y > 280) { doc.addPage(); y = 20; }
      const d = t.dt ? new Date(t.dt).toLocaleDateString([], { month: "short", day: "numeric" }) : "—";
      doc.text(d, 25, y);
      doc.text(t.asset || "—", 55, y);
      doc.text(t.direction || "—", 80, y);
      doc.text(t.aplus || "—", 97, y);
      doc.text(t.taken || "—", 110, y);
      const p = parseFloat(t.profit);
      doc.text(isNaN(p) ? "—" : `$${p.toFixed(0)}`, 145, y);
      doc.text(t.bias || "—", 170, y);
      y += 5;
    });

    const fname = exportPeriod === "week" ? `report-week-${start.toISOString().slice(0, 10)}.pdf` : `report-${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, "0")}.pdf`;
    doc.save(fname);
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>

      {/* Drawdown Alerts — inline banners */}
      {alerts.map((a, i) => (
        <div key={i} style={{
          padding: "14px 20px", marginBottom: 12, borderRadius: 4,
          background: a.level === "danger" ? "rgba(255,71,87,0.1)" : "rgba(255,165,2,0.1)",
          border: `1px solid ${a.level === "danger" ? "var(--red)" : "var(--gold)"}`,
          display: "flex", alignItems: "center", gap: 12,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700,
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
          background: "linear-gradient(135deg, rgba(30,0,0,0.95), rgba(60,10,10,0.95))",
          border: "1px solid var(--red)", borderRadius: 6,
          boxShadow: "0 0 30px rgba(255,71,87,0.25), 0 0 60px rgba(255,71,87,0.1), inset 0 1px 0 rgba(255,71,87,0.1)",
          padding: "20px 22px",
          backdropFilter: "blur(12px)",
          animation: "fadeSlideIn 0.4s ease",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--red)", boxShadow: "0 0 8px var(--red)", animation: "hudPulse 2s infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: "var(--red)", textTransform: "uppercase", letterSpacing: "0.12em" }}>DRAWDOWN PROTOCOL</span>
          </div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, lineHeight: 2, color: "#e0a0a0" }}>
            <div style={{ color: "#ff8a8a", fontWeight: 700 }}>1. A+ SETUPS ONLY</div>
            <div style={{ color: "#ff8a8a", fontWeight: 700 }}>2. STAY PATIENT — WAIT FOR IT</div>
            <div style={{ color: "#ff8a8a", fontWeight: 700 }}>3. REDUCE RISK — PROTECT CAPITAL</div>
          </div>
          <div style={{ marginTop: 14, padding: "10px 0 0", borderTop: "1px solid rgba(255,71,87,0.2)" }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "#c07070", margin: 0, fontStyle: "italic", lineHeight: 1.6 }}>
              The best trade in drawdown is the one you don't take. Let the edge come to you.
            </p>
          </div>
        </div>
      )}

      {/* Mantra */}
      <div style={{ textAlign: "center", marginBottom: 24, padding: "16px 0" }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, lineHeight: 1.8, color: "var(--text-tertiary)", letterSpacing: "0.02em", margin: 0, fontStyle: "italic" }}>
          The setup is the edge. The discomfort is the cost. Pay it and sit still.
        </p>
      </div>

      {/* Today's Stats */}
      <div className="grid-4" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginBottom: 24 }}>
        <TCard style={{ padding: "18px 20px", textAlign: "center", boxShadow: todayPnl < 0 ? "0 0 20px rgba(255,71,87,0.15)" : undefined }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: todayPnl >= 0 ? "var(--green)" : "var(--red)" }}>{todayPnl >= 0 ? "+" : ""}${todayPnl.toFixed(0)}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Today's P&L</div>
        </TCard>
        <StatBox value={todayTaken} label="Trades Today" color="var(--text-secondary)" />
        <StatBox value={greenStreak} label="Green Streak" color="var(--gold)" />
        <TCard style={{ padding: "18px 20px", textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: weekPnl >= 0 ? "var(--green)" : "var(--red)" }}>{weekPnl >= 0 ? "+" : ""}${weekPnl.toFixed(0)}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4 }}>Week P&L</div>
        </TCard>
      </div>

      {/* Mood Tracker */}
      <TCard style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          {mood ? "TODAY'S MOOD" : "HOW ARE YOU FEELING TODAY?"}
        </div>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {MOODS.map((m) => (
            <button key={m.value} onClick={() => selectMood(m.value)} style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: mood === m.value ? 700 : 500,
              padding: "10px 16px", borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
              background: mood === m.value ? `${m.color}15` : "var(--bg-tertiary)",
              border: mood === m.value ? `1px solid ${m.color}` : "1px solid var(--border-primary)",
              color: mood === m.value ? m.color : "var(--text-secondary)",
              boxShadow: mood === m.value ? `0 0 12px ${m.color}20` : "none",
            }}>
              {m.icon} {m.value}
            </button>
          ))}
        </div>
      </TCard>

      {/* Week Progress */}
      <TCard style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          WEEK PROGRESS
        </div>
        <div className="grid-week" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8, alignItems: "end", height: 120 }}>
          {weekDays.map((d) => {
            const h = maxPnl ? (Math.abs(d.pnl) / maxPnl) * 80 : 0;
            return (
              <div key={d.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, color: d.pnl >= 0 ? "var(--green)" : "var(--red)", marginBottom: 6 }}>
                  {d.count > 0 ? `${d.pnl >= 0 ? "+" : ""}$${d.pnl.toFixed(0)}` : "—"}
                </div>
                <div style={{
                  width: "100%", maxWidth: 48, height: Math.max(4, h), borderRadius: 3,
                  background: d.count === 0 ? "var(--bg-tertiary)" : d.pnl >= 0 ? "var(--green)" : "var(--red)",
                  opacity: d.count === 0 ? 0.3 : 0.8, transition: "height 0.3s",
                  border: d.isToday ? "2px solid var(--accent)" : "none",
                }} />
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: d.isToday ? "var(--accent)" : "var(--text-tertiary)", marginTop: 6, fontWeight: d.isToday ? 700 : 500 }}>{d.label}</div>
              </div>
            );
          })}
        </div>
      </TCard>

      {/* Account Health */}
      {activeAccounts.length > 0 && (
        <TCard style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
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
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{acc.account_name || acc.firm}</span>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, fontWeight: 700, color: pnl >= 0 ? "var(--green)" : "var(--red)" }}>{pnl >= 0 ? "+" : ""}${pnl.toFixed(0)}</span>
                  </div>
                  {acc.profit_target && (
                    <div style={{ marginBottom: 6 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Profit Target</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)" }}>{Math.round(profitPct)}%</span>
                      </div>
                      <ProgressBar pct={profitPct} color="var(--green)" />
                    </div>
                  )}
                  {acc.max_drawdown && (
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3 }}>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase" }}>Drawdown Used</span>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: ddColor }}>{Math.round(ddPct)}%</span>
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

      {/* Export Report */}
      <TCard style={{ padding: 24 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
          EXPORT REPORT
        </div>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div style={{ display: "flex", gap: 0, border: "1px solid var(--border-primary)", borderRadius: 4, overflow: "hidden" }}>
            {[{ v: "week", l: "This Week" }, { v: "month", l: "This Month" }].map((p) => (
              <button key={p.v} onClick={() => setExportPeriod(p.v)} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: exportPeriod === p.v ? 700 : 500,
                padding: "10px 18px", border: "none", cursor: "pointer",
                background: exportPeriod === p.v ? "var(--accent-glow-strong)" : "var(--bg-tertiary)",
                color: exportPeriod === p.v ? "var(--accent)" : "var(--text-tertiary)",
              }}>{p.l}</button>
            ))}
          </div>
          <button onClick={exportPDF} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, padding: "10px 24px",
            background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4,
            cursor: "pointer", boxShadow: "0 0 15px var(--accent-glow)", letterSpacing: "0.05em", textTransform: "uppercase",
          }}>
            GENERATE PDF
          </button>
        </div>
      </TCard>
    </div>
  );
}

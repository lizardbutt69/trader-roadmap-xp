import { useState, useEffect, useRef, useCallback } from "react";
import { Chart, registerables } from "chart.js";
Chart.register(...registerables);

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
const VALID_APLUS = new Set(["Yes", "No", ""]);
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

function getPnlForMode(t, mode) {
  if (mode === "funded") return parseFloat(t.profit_funded) || 0;
  if (mode === "both") return (parseFloat(t.profit) || 0) + (parseFloat(t.profit_funded) || 0);
  return parseFloat(t.profit) || 0; // "personal" default
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

export function ChecklistView({ supabase, user }) {
  const [customItems, setCustomItems] = useState(null); // null = loading
  const [checked, setChecked] = useState([]);
  const [timerActive, setTimerActive] = useState(false);
  const [timerSecs, setTimerSecs] = useState(10);
  const timerRef = useRef(null);

  // Edit mode
  const [editing, setEditing] = useState(false);
  const [editItems, setEditItems] = useState([]);
  const [newLabel, setNewLabel] = useState("");
  const [newSub, setNewSub] = useState("");
  const [saving, setSaving] = useState(false);
  const [dragIdx, setDragIdx] = useState(null);

  // Load custom items from Supabase (fall back to defaults)
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("checklist_items")
        .select("items")
        .eq("user_id", user.id)
        .maybeSingle();
      const items = data?.items || DEFAULT_CHECKLIST_ITEMS;
      setCustomItems(items);
      setChecked(new Array(items.length + 1).fill(false)); // +1 for timer item
    })();
  }, [user]);

  // Build full list: custom items + timer always last
  const allItems = customItems ? [...customItems, TIMER_ITEM] : [...DEFAULT_CHECKLIST_ITEMS, TIMER_ITEM];
  const totalCount = allItems.length;

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

  // ── Edit mode handlers ──
  const openEdit = () => {
    setEditItems((customItems || DEFAULT_CHECKLIST_ITEMS).map((item) => ({ ...item })));
    setEditing(true);
    setNewLabel("");
    setNewSub("");
  };

  const cancelEdit = () => {
    setEditing(false);
    setEditItems([]);
    setNewLabel("");
    setNewSub("");
  };

  const addItem = () => {
    const label = newLabel.trim();
    if (!label) return;
    if (editItems.length >= 20) { alert("Maximum 20 custom items."); return; }
    setEditItems([...editItems, { label, sub: newSub.trim() }]);
    setNewLabel("");
    setNewSub("");
  };

  const removeItem = (i) => {
    setEditItems(editItems.filter((_, idx) => idx !== i));
  };

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
    await supabase.from("checklist_items").upsert(
      { user_id: user.id, items: editItems },
      { onConflict: "user_id" }
    );
    setCustomItems(editItems);
    setChecked(new Array(editItems.length + 1).fill(false));
    setEditing(false);
    setSaving(false);
  };

  const resetToDefaults = () => {
    setEditItems(DEFAULT_CHECKLIST_ITEMS.map((item) => ({ ...item })));
  };

  const count = checked.filter(Boolean).length;
  const allChecked = checked.length === totalCount && count === totalCount;

  if (customItems === null) {
    return (
      <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
        <TCard style={{ padding: 28, textAlign: "center" }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: "var(--text-tertiary)" }}>Loading checklist...</div>
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
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>CUSTOMIZE CHECKLIST</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)" }}>{editItems.length} / 20 items</div>
          </div>

          {/* Existing items — draggable */}
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
                  border: `1.5px solid ${dragIdx === i ? "var(--accent-dim)" : "var(--border-primary)"}`,
                  borderRadius: 6, padding: "12px 16px",
                  cursor: "grab", transition: "all 0.15s", userSelect: "none",
                }}
              >
                {/* Drag handle */}
                <div style={{ color: "var(--text-tertiary)", fontSize: 16, cursor: "grab", flexShrink: 0 }}>⠿</div>
                {/* Reorder buttons */}
                <div style={{ display: "flex", flexDirection: "column", gap: 2, flexShrink: 0 }}>
                  <button onClick={() => moveItem(i, i - 1)} disabled={i === 0} style={{ background: "none", border: "none", cursor: i === 0 ? "default" : "pointer", fontSize: 10, color: i === 0 ? "var(--border-primary)" : "var(--text-tertiary)", padding: 0, lineHeight: 1 }}>▲</button>
                  <button onClick={() => moveItem(i, i + 1)} disabled={i === editItems.length - 1} style={{ background: "none", border: "none", cursor: i === editItems.length - 1 ? "default" : "pointer", fontSize: 10, color: i === editItems.length - 1 ? "var(--border-primary)" : "var(--text-tertiary)", padding: 0, lineHeight: 1 }}>▼</button>
                </div>
                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</div>
                  {item.sub && <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.sub}</div>}
                </div>
                {/* Delete */}
                <button onClick={() => removeItem(i)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: "var(--text-tertiary)", flexShrink: 0, padding: "0 4px" }} title="Remove">✕</button>
              </div>
            ))}
          </div>

          {/* Timer item (locked, always last) */}
          <div style={{
            display: "flex", alignItems: "center", gap: 12,
            background: "var(--bg-tertiary)", border: "1.5px dashed var(--border-primary)",
            borderRadius: 6, padding: "12px 16px", marginBottom: 20, opacity: 0.6,
          }}>
            <div style={{ fontSize: 16, flexShrink: 0 }}>🔒</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: "var(--text-secondary)" }}>{TIMER_ITEM.label}</div>
              <div style={{ fontSize: 12, color: "var(--text-tertiary)", marginTop: 2 }}>{TIMER_ITEM.sub}</div>
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", flexShrink: 0 }}>ALWAYS LAST</div>
          </div>

          {/* Add new item */}
          <div style={{ background: "var(--bg-tertiary)", borderRadius: 6, padding: 16, border: "1px solid var(--border-primary)", marginBottom: 20 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>ADD NEW ITEM</div>
            <input
              type="text"
              placeholder="Condition name (required)"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              maxLength={200}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <input
              type="text"
              placeholder="Description (optional)"
              value={newSub}
              onChange={(e) => setNewSub(e.target.value)}
              maxLength={300}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            <button onClick={addItem} disabled={!newLabel.trim()} style={{
              fontFamily: "'JetBrains Mono', monospace", width: "100%", padding: 10, fontSize: 12, fontWeight: 600,
              background: "transparent", border: `1px solid ${newLabel.trim() ? "var(--green)" : "var(--border-primary)"}`,
              color: newLabel.trim() ? "var(--green)" : "var(--text-tertiary)",
              borderRadius: 4, cursor: newLabel.trim() ? "pointer" : "default",
              letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s",
            }}>+ ADD ITEM</button>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={resetToDefaults} style={{
              fontFamily: "'JetBrains Mono', monospace", flex: 1, padding: 12, fontSize: 12, fontWeight: 600,
              background: "transparent", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)",
              borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>RESET DEFAULTS</button>
            <button onClick={cancelEdit} style={{
              fontFamily: "'JetBrains Mono', monospace", flex: 1, padding: 12, fontSize: 12, fontWeight: 600,
              background: "transparent", border: "1px solid var(--border-primary)", color: "var(--text-secondary)",
              borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase",
            }}>CANCEL</button>
            <button onClick={saveItems} disabled={saving || editItems.length === 0} style={{
              fontFamily: "'JetBrains Mono', monospace", flex: 1, padding: 12, fontSize: 12, fontWeight: 700,
              background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)",
              borderRadius: 4, cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.08em", textTransform: "uppercase",
              boxShadow: "0 0 15px var(--accent-glow)", transition: "all 0.2s",
            }}>{saving ? "SAVING..." : "SAVE CHECKLIST"}</button>
          </div>
        </TCard>
      </div>
    );
  }

  // ── Normal Checklist UI ──
  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      <TCard style={{ padding: 28 }}>
        {/* Header with edit button */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>A+ CHECKLIST</div>
          <button onClick={openEdit} style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, padding: "6px 14px",
            background: "transparent", border: "1px solid var(--border-primary)", color: "var(--text-tertiary)",
            borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", transition: "all 0.2s",
          }}>CUSTOMIZE</button>
        </div>

        {/* Progress bar */}
        <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height: 8, marginBottom: 10, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
          <div style={{ height: "100%", borderRadius: 4, background: "linear-gradient(90deg, var(--green), var(--accent))", transition: "width 0.3s", width: `${(count / totalCount) * 100}%`, boxShadow: "0 0 8px var(--accent-glow)" }} />
        </div>
        <div style={{ textAlign: "right", fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)", marginBottom: 24 }}>
          <span style={{ color: "var(--green)", fontWeight: 600 }}>{count}</span> / {totalCount} confirmed
        </div>

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
                {item.sub && <div style={{ fontSize: 13, color: "var(--text-tertiary)", marginTop: 3 }}>{item.sub}</div>}
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
    if (!VALID_ASSETS.has(formAsset)) { alert("Invalid asset selected."); return; }
    if (formDirection && !VALID_DIRECTIONS.has(formDirection)) { alert("Invalid direction."); return; }
    if (formAplus && !VALID_APLUS.has(formAplus)) { alert("Invalid A+ value."); return; }
    if (formTaken && !VALID_TAKEN.has(formTaken)) { alert("Invalid Taken value."); return; }
    if (formBias && !VALID_BIAS.has(formBias)) { alert("Invalid bias value."); return; }
    if (formProfit && isNaN(parseFloat(formProfit))) { alert("Personal P&L must be a number."); return; }
    if (formProfitFunded && isNaN(parseFloat(formProfitFunded))) { alert("Funded P&L must be a number."); return; }
    if (formChart && !safeUrl(formChart)) { alert("Invalid chart URL. Must be a valid https:// link."); return; }
    if (formAfter && !safeUrl(formAfter)) { alert("Invalid after-trade URL. Must be a valid https:// link."); return; }
    const parsedDt = new Date(formDt);
    if (isNaN(parsedDt.getTime())) { alert("Invalid date."); return; }
    const tradeData = {
      user_id: user.id,
      dt: parsedDt.toISOString(),
      asset: formAsset,
      direction: formDirection,
      aplus: formAplus,
      taken: formTaken,
      bias: formBias,
      profit: formProfit ? parseFloat(formProfit) : null,
      profit_funded: formProfitFunded ? parseFloat(formProfitFunded) : null,
      chart: safeUrl(formChart) || "",
      after_chart: safeUrl(formAfter) || "",
      notes: sanitizeText(formNotes),
      after_thoughts: sanitizeText(formAfterThoughts),
    };
    const { error } = await supabase.from("trades").insert(tradeData);
    if (!error) {
      if (syncToSheets) syncToSheets({ ...tradeData, after: tradeData.after_chart, dtFormatted: fmtDate(formDt), preMarketJournal: plan.session_plan || "", mood: mood || "" });
      setFormAsset(""); setFormDirection(""); setFormAplus("");
      setFormTaken(""); setFormProfit(""); setFormProfitFunded(""); setFormChart("");
      setFormAfter(""); setFormNotes(""); setFormAfterThoughts(""); setFormDt(nowLocal());
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
        <div style={{ fontSize: 14, color: "var(--text-tertiary)", marginBottom: 16 }}>
          {today.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </div>

        {/* Mood */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 600, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>
            {mood ? "TODAY'S MOOD" : "HOW ARE YOU FEELING?"}
          </div>
          <div className="mood-grid" style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {MOODS.map((m) => (
              <button key={m.value} onClick={() => selectMood(m.value)} style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: mood === m.value ? 700 : 500,
                padding: "7px 12px", borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
                background: mood === m.value ? `${m.color}15` : "var(--bg-tertiary)",
                border: mood === m.value ? `1px solid ${m.color}` : "1px solid var(--border-primary)",
                color: mood === m.value ? m.color : "var(--text-secondary)",
                boxShadow: mood === m.value ? `0 0 10px ${m.color}20` : "none",
              }}>
                {m.icon} {m.value}
              </button>
            ))}
          </div>
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
          <Field label="Personal P&L ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 500 or -200" value={formProfit} onChange={(e) => setFormProfit(e.target.value)} />
          </Field>
          <Field label="Funded P&L ($)">
            <input type="number" style={inputStyle} placeholder="e.g. 800 or -300" value={formProfitFunded} onChange={(e) => setFormProfitFunded(e.target.value)} />
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
  const [pnlMode, setPnlMode] = useState("personal");

  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  const dayMap = buildDayMap(trades, pnlMode);

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
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: (c) => ` $${c.raw.toFixed(2)}` } } },
        scales: {
          x: { ticks: { color: tickColor, maxTicksLimit: 8, font: { size: 11, family: "'JetBrains Mono', monospace" } }, grid: { color: gridColor } },
          y: { ticks: { color: tickColor, callback: (v) => "$" + v, font: { size: 11, family: "'JetBrains Mono', monospace" } }, grid: { color: gridColor } },
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
      profit_funded: trade.profit_funded != null ? String(trade.profit_funded) : "",
      chart: trade.chart || "", after_chart: trade.after_chart || "",
      notes: trade.notes || "", after_thoughts: trade.after_thoughts || "",
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    await supabase.from("trades").update({
      dt: editForm.dt ? new Date(editForm.dt).toISOString() : null,
      asset: editForm.asset, direction: editForm.direction,
      aplus: editForm.aplus, taken: editForm.taken, bias: editForm.bias,
      profit: editForm.profit ? parseFloat(editForm.profit) : null,
      profit_funded: editForm.profit_funded ? parseFloat(editForm.profit_funded) : null,
      chart: editForm.chart, after_chart: editForm.after_chart, notes: editForm.notes,
      after_thoughts: editForm.after_thoughts,
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
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 24px", borderBottom: "1px solid var(--border-primary)", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 12, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>P&L CALENDAR</div>
            <div style={{ display: "flex", gap: 4 }}>
              {[["personal", "Personal"], ["funded", "Funded"], ["both", "Both"]].map(([mode, label]) => (
                <button
                  key={mode}
                  onClick={() => setPnlMode(mode)}
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: "4px 10px",
                    borderRadius: 4, cursor: "pointer", letterSpacing: "0.05em", textTransform: "uppercase",
                    border: pnlMode === mode ? "1px solid var(--accent)" : "1px solid var(--border-primary)",
                    background: pnlMode === mode ? "transparent" : "var(--bg-tertiary)",
                    color: pnlMode === mode ? "var(--accent)" : "var(--text-tertiary)",
                    boxShadow: pnlMode === mode ? "0 0 8px var(--accent-glow)" : "none",
                    transition: "all 0.15s",
                  }}
                >{label}</button>
              ))}
            </div>
          </div>
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
            const pf = parseFloat(t.profit_funded);
            return (
              <div key={i} style={{ background: "var(--bg-tertiary)", borderRadius: 4, padding: "12px 16px", marginBottom: 10, fontSize: 13, display: "flex", gap: 14, flexWrap: "wrap", alignItems: "center" }}>
                <strong style={{ fontFamily: "'JetBrains Mono', monospace" }}>{t.asset || "—"}</strong>
                <span>{t.direction || "—"}</span>
                <span>A+: {t.aplus || "—"}</span>
                <span>Taken: {t.taken || "—"}</span>
                <span>Personal: {t.profit != null ? <span style={{ fontFamily: "'JetBrains Mono', monospace", color: p >= 0 ? "var(--green)" : "var(--red)" }}>{p >= 0 ? "+" : ""}${p.toFixed(0)}</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span>}</span>
                <span>Funded: {t.profit_funded != null ? <span style={{ fontFamily: "'JetBrains Mono', monospace", color: pf >= 0 ? "var(--green)" : "var(--red)" }}>{pf >= 0 ? "+" : ""}${pf.toFixed(0)}</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span>}</span>
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
          <div className="trade-table" style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
              <thead>
                <tr style={{ background: "var(--bg-tertiary)" }}>
                  {["Date", "Asset", "Dir", "A+", "Taken", "Bias", "Personal", "Funded", "Chart", "After", "Notes", ""].map((h) => (
                    <th key={h} style={{ padding: "10px 12px", textAlign: "left", color: "var(--text-tertiary)", fontSize: 10, textTransform: "uppercase", whiteSpace: "nowrap", letterSpacing: "0.1em", fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {trades.map((t) => {
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
                        {t.profit != null ? <span style={{ color: p >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{p >= 0 ? "+" : ""}{p.toFixed(0)}</span> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {t.profit_funded != null ? <span style={{ color: pf >= 0 ? "var(--green)" : "var(--red)", fontWeight: 700 }}>{pf >= 0 ? "+" : ""}{pf.toFixed(0)}</span> : <span style={{ color: "var(--text-tertiary)" }}>—</span>}
                      </td>
                      <td style={cellStyle}>
                        {safeUrl(t.chart) ? <a href={safeUrl(t.chart)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
                      </td>
                      <td style={cellStyle}>
                        {safeUrl(t.after_chart) ? <a href={safeUrl(t.after_chart)} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-secondary)", textDecoration: "none" }}>VIEW</a> : "—"}
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
              <Field label="Personal P&L ($)">
                <input type="number" style={inputStyle} value={editForm.profit} onChange={(e) => setEditForm({ ...editForm, profit: e.target.value })} />
              </Field>
              <Field label="Funded P&L ($)">
                <input type="number" style={inputStyle} placeholder="Leave blank if not taken on funded" value={editForm.profit_funded} onChange={(e) => setEditForm({ ...editForm, profit_funded: e.target.value })} />
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

    const tradesSummary = periodTrades.map((t) => `Date: ${t.dt}, Asset: ${t.asset}, Direction: ${t.direction}, A+: ${t.aplus}, Taken: ${t.taken}, Profit: ${t.profit != null ? "$" + t.profit : "blank"}, Notes: ${t.notes || "none"}, After Trade Thoughts: ${t.after_thoughts || "none"}`).join("\n");

    const prompt = `You are a direct but fair trading coach analyzing the performance of a funded futures trader who uses an ICT-inspired fractal model. You're honest and straightforward — you don't sugarcoat, but you're not harsh either. Think tough older brother energy. You point out weaknesses clearly because you want this trader to improve, and you genuinely acknowledge strengths when earned.

TRADING MODEL & RULES:
- Trades NQ, ES, GC, SI (index futures primarily)
- Uses: Fractal Model (TTFM), CISD, ICCISD, SMT divergence, CIC (Crack in Correlation), liquidity framework, FVGs
- A+ trade requires: CIC/SMT confirmation, key level/liquidity, timeframe alignment, CISD, ICCISD, TTFM alignment, correct session, good R:R, stop loss defined
- Default rule: NY session only. Avoid London session
- Max 2 trades per session
- Core psychological leaks: entering before confirmation, moving stops too early, trading London, revenge trading after losses, hesitating on clean setups, taking messy ones

RISK CONTEXT:
- Standard risk per trade: $500, targeting 2R ($1,000)
- Trades with P&L of $0–$200 are effectively breakeven — not real wins
- Trades over $1,000 profit = solid 2R+ execution
- Losses beyond -$500 = overexposure or moved stop
- IMPORTANT: Many trades on funded accounts have blank P&L — this does NOT mean breakeven. It means the trader didn't enter the number. Do not count blank P&L as $0. Ignore blank P&L trades when calculating performance metrics.

PERIOD: ${label}
TOTAL TRADES LOGGED: ${periodTrades.length}
TRADES TAKEN: ${taken} (Wins: ${wins}, Losses: ${losses})
A+ TRADES TAKEN: ${aplusTaken}
NON-A+ TRADES TAKEN: ${nonAplus}
MISSED SETUPS: ${missed}
NET P&L: $${totalPnl.toFixed(2)} (only from trades with P&L entered)
WIN RATE: ${taken ? Math.round((wins / taken) * 100) : 0}%

INDIVIDUAL TRADES (with notes):
${tradesSummary}

ANALYSIS INSTRUCTIONS:
1. Performance Overview — P&L, win rate, key numbers. Judge wins against the $500 risk / $1,000 target framework. Call out breakeven trades disguised as wins.
2. Strengths — What this trader is genuinely doing well. Be specific, reference actual trades.
3. Flaws & Weaknesses — Be direct. Call out rule violations, patterns, psychological leaks. If they're trading non-A+ setups, say so. If they're revenge trading, say so. Don't soften it.
4. Language & Mindset Analysis — Read how the trader describes their trades in the notes. Are they making excuses? Being vague? Blaming the market? Showing accountability? Call out specific language patterns that reveal psychological issues.
5. Key Focus — 2-3 specific, actionable improvements for next ${p === "week" ? "week" : "month"}.
6. Final Word — One honest sentence about where this trader is mentally.

Be direct, specific, and reference actual trades and their notes. Keep it under 500 words.`;

    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": apiKey, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1500, messages: [{ role: "user", content: prompt }] }),
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
          <div style={{ display: "flex", gap: 8 }}>
            <input type="password" style={{ ...inputStyle, flex: 1 }} placeholder="Anthropic API Key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
            <button
              onClick={() => { saveKey(apiKey); setShowKeyInput(false); }}
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: 11, fontWeight: 700, padding: "10px 18px",
                background: apiKey ? "var(--accent-glow-strong)" : "var(--bg-tertiary)",
                border: `1px solid ${apiKey ? "var(--accent)" : "var(--border-primary)"}`,
                color: apiKey ? "var(--accent)" : "var(--text-tertiary)",
                borderRadius: 4, cursor: "pointer", letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap",
              }}
            >SAVE</button>
          </div>
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

export function AccountsView({ supabase, user }) {
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
    const n = Number(v);
    return "$" + Math.abs(n).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Summary */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12, marginBottom: 12 }}>
        <StatBox value={fundedCount} label="Funded" color="var(--green)" />
        <StatBox value={evalCount} label="In Eval" color="var(--accent-secondary)" />
        <StatBox value={passedCount} label="Passed" color="var(--green)" />
        <TCard style={{ padding: "18px 20px", textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: totalPnl >= 0 ? "var(--green)" : "var(--red)" }}>{totalPnl >= 0 ? "+" : "-"}${Math.abs(totalPnl).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Current P&L</div>
        </TCard>
        <TCard style={{ padding: "18px 20px", textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: totalEligiblePayout > 0 ? "var(--green)" : "var(--text-tertiary)" }}>${totalEligiblePayout.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Eligible Payout</div>
        </TCard>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12, marginBottom: 24 }}>
        <TCard style={{ padding: "18px 20px", textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: totalPaidOut > 0 ? "var(--green)" : "var(--text-tertiary)" }}>${totalPaidOut.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>YTD Paid Out</div>
        </TCard>
        <TCard style={{ padding: "18px 20px", textAlign: "center" }}>
          <div className="stat-val" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 24, fontWeight: 700, color: totalPending > 0 ? "var(--gold)" : "var(--text-tertiary)" }}>${totalPending.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.1em", marginTop: 4, fontWeight: 600 }}>Pending</div>
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
                {acc.payout_pct != null && (
                  <div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Payout %</div>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--text-primary)", fontSize: 15 }}>{Number(acc.payout_pct)}%</div>
                  </div>
                )}
                {(() => {
                  const accPnl = acc.current_pnl != null ? Number(acc.current_pnl) : 0;
                  const accPct = acc.payout_pct != null ? Number(acc.payout_pct) : 0;
                  const eligible = accPnl > 0 && accPct > 0 ? accPnl * accPct / 100 : 0;
                  return eligible > 0 ? (
                    <div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", color: "var(--text-tertiary)", fontWeight: 600, textTransform: "uppercase", fontSize: 10, letterSpacing: "0.1em", marginBottom: 2 }}>Eligible Payout</div>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, color: "var(--green)", fontSize: 15 }}>{fmtMoney(eligible)}</div>
                    </div>
                  ) : null;
                })()}
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

      {/* ─── PAYOUT LOG ─────────────────────────────────────────────────── */}
      <div style={{ marginTop: 32 }}>
        <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 14, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 16 }}>
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
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--green)" }}>${Number(p.amount).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</span>
                      <Badge label={pStatus.label} color={pStatus.color} />
                      {pMethod && <Badge label={pMethod.label} color="var(--text-tertiary)" />}
                    </div>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)" }}>{p.payout_date}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", gap: 16, fontSize: 12, color: "var(--text-secondary)", fontFamily: "'JetBrains Mono', monospace" }}>
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
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontWeight: 700, fontSize: 13, color: "var(--text-primary)", marginBottom: 20, textTransform: "uppercase", letterSpacing: "0.1em" }}>
            {editingPayout ? "EDIT PAYOUT" : "LOG PAYOUT"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr 1fr", gap: 14, marginBottom: 14 }}>
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
              <button onClick={resetPayoutForm} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, fontSize: 13, fontWeight: 600, padding: 14, background: "var(--bg-tertiary)", border: "1px solid var(--border-primary)", color: "var(--text-secondary)", borderRadius: 4, cursor: "pointer" }}>CANCEL</button>
            )}
            <button onClick={savePayout} style={{ fontFamily: "'JetBrains Mono', monospace", flex: 1, fontSize: 13, fontWeight: 700, padding: 14, background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)", borderRadius: 4, cursor: "pointer", boxShadow: "0 0 15px var(--accent-glow)", letterSpacing: "0.05em" }}>
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
  return (
    <div style={{ background: "var(--bg-tertiary)", borderRadius: 4, height, overflow: "hidden", border: "1px solid var(--border-primary)" }}>
      <div style={{ height: "100%", borderRadius: 4, background: color, width: `${Math.min(100, Math.max(0, pct))}%`, transition: "width 0.5s" }} />
    </div>
  );
}

export function DashboardView({ supabase, user, trades, syncToSheets }) {
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
  { key: "cnbc", label: "CNBC", src: "https://www.youtube.com/embed/9NyxcX3rhQs?autoplay=1&mute=1" },
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
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            @FinancialJuice
          </span>
        </div>
        <button
          onClick={fetchTweets}
          style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600,
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
        <div style={{ color: "#e53e3e", fontSize: 12, fontFamily: "'JetBrains Mono', monospace" }}>{error}</div>
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
              <div style={{ fontSize: 11, color: "var(--text-tertiary)", fontFamily: "'JetBrains Mono', monospace" }}>
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
      colorTheme: getComputedStyle(document.documentElement).getPropertyValue("--bg-primary").trim() === "#0a0a0f" ? "dark" : "light",
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
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#e53e3e", animation: "hudPulse 2s ease-in-out infinite" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
              LIVE NEWS
            </span>
          </div>
          <div className="news-channels" style={{ display: "flex", gap: 4 }}>
            {LIVE_CHANNELS.map((ch) => (
              <button
                key={ch.key}
                onClick={() => setChannel(ch.key)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: channel === ch.key ? 700 : 500,
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
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
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

const WATCHLIST_ASSETS = ["$NQ", "$ES", "$GC", "$SI", "$YM", "$CL"];
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
    fontFamily: "'JetBrains Mono', monospace", fontSize: 12, padding: "10px 12px",
    background: "var(--bg-input)", border: "1px solid var(--border-primary)",
    color: "var(--text-primary)", borderRadius: 4, outline: "none", width: "100%", boxSizing: "border-box",
  };

  const statusColor = (s) => WATCHLIST_STATUSES.find((ws) => ws.value === s)?.color || "var(--text-tertiary)";

  return (
    <div style={{ animation: "fadeSlideIn 0.3s ease" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            WATCHLIST
          </h2>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-tertiary)", margin: "4px 0 0", letterSpacing: "0.05em" }}>
            {ideas.filter((i) => i.status === "watching" || i.status === "triggered").length} active ideas
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(!showForm); }}
          style={{
            fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, padding: "10px 20px",
            background: showForm ? "var(--bg-tertiary)" : "var(--accent)", color: showForm ? "var(--text-secondary)" : "#000",
            border: "none", borderRadius: 4, cursor: "pointer", transition: "all 0.2s",
          }}
        >
          {showForm ? "CANCEL" : "+ NEW IDEA"}
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <TCard style={{ marginBottom: 20, padding: 20 }}>
          <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, fontWeight: 700, color: "var(--text-primary)", marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.08em" }}>
            {editingId ? "EDIT IDEA" : "NEW TRADE IDEA"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Asset</label>
              <input style={inputStyle} placeholder="$NQ, $BTC, etc." value={form.asset} onChange={(e) => setForm({ ...form, asset: e.target.value })} />
            </div>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Direction</label>
              <select style={inputStyle} value={form.direction} onChange={(e) => setForm({ ...form, direction: e.target.value })}>
                <option value="Long">Long</option>
                <option value="Short">Short</option>
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Timeframe</label>
              <select style={inputStyle} value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>
                {WATCHLIST_TFS.map((tf) => <option key={tf} value={tf}>{tf}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Confidence</label>
              <div style={{ display: "flex", gap: 4, paddingTop: 8 }}>
                {[1, 2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => setForm({ ...form, confidence: n })}
                    style={{
                      width: 32, height: 32, borderRadius: 4, border: "1px solid var(--border-primary)",
                      background: form.confidence >= n ? "var(--accent-glow-strong)" : "var(--bg-tertiary)",
                      color: form.confidence >= n ? "var(--accent)" : "var(--text-tertiary)",
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700,
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
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Key Level / Zone</label>
            <input style={inputStyle} placeholder="e.g. 19,850 - 19,900 (4HR FVG)" value={form.key_level} onChange={(e) => setForm({ ...form, key_level: e.target.value })} />
          </div>
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Reasoning</label>
            <textarea style={{ ...inputStyle, resize: "vertical", minHeight: 80 }} placeholder="Why are you watching this? SMT forming, PSP, key level reaction..." value={form.reasoning} onChange={(e) => setForm({ ...form, reasoning: e.target.value })} />
          </div>
          <div style={{ marginBottom: 16 }}>
            <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.08em" }}>Chart Link</label>
            <input style={inputStyle} placeholder="TradingView screenshot link" value={form.chart_link} onChange={(e) => setForm({ ...form, chart_link: e.target.value })} />
          </div>
          <button onClick={saveIdea} style={{
            fontFamily: "'JetBrains Mono', monospace", width: "100%", padding: 13, fontSize: 13, fontWeight: 700,
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
              fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: filter === f.key ? 700 : 500,
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
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: "var(--text-tertiary)" }}>
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
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>
                  {idea.asset}
                </span>
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 700, padding: "3px 8px",
                  borderRadius: 3, textTransform: "uppercase",
                  background: idea.direction === "Long" ? "rgba(0,184,150,0.15)" : "rgba(229,62,62,0.15)",
                  color: idea.direction === "Long" ? "var(--green)" : "var(--red)",
                }}>
                  {idea.direction}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, fontWeight: 600, color: "var(--text-tertiary)" }}>
                  {idea.timeframe}
                </span>
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--gold)" }}>
                  {"★".repeat(idea.confidence || 1)}{"☆".repeat(3 - (idea.confidence || 1))}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
                {idea.status === "watching" && (
                  <button onClick={() => updateStatus(idea.id, "triggered")} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                    border: "1px solid var(--gold)", borderRadius: 3, cursor: "pointer",
                    background: "transparent", color: "var(--gold)", textTransform: "uppercase",
                  }}>TRIGGER</button>
                )}
                {(idea.status === "watching" || idea.status === "triggered") && (
                  <>
                    <button onClick={() => updateStatus(idea.id, "taken")} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                      border: "1px solid var(--green)", borderRadius: 3, cursor: "pointer",
                      background: "transparent", color: "var(--green)", textTransform: "uppercase",
                    }}>TAKEN</button>
                    <button onClick={() => updateStatus(idea.id, "invalidated")} style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                      border: "1px solid var(--red)", borderRadius: 3, cursor: "pointer",
                      background: "transparent", color: "var(--red)", textTransform: "uppercase",
                    }}>INVALID</button>
                  </>
                )}
                {(idea.status === "taken" || idea.status === "invalidated") && (
                  <button onClick={() => updateStatus(idea.id, "watching")} style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 600, padding: "4px 8px",
                    border: "1px solid var(--accent-secondary)", borderRadius: 3, cursor: "pointer",
                    background: "transparent", color: "var(--accent-secondary)", textTransform: "uppercase",
                  }}>REACTIVATE</button>
                )}
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 9, fontWeight: 700, padding: "4px 8px",
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
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)", marginBottom: 6 }}>
                <span style={{ color: "var(--text-tertiary)", fontSize: 10 }}>LEVEL: </span>{idea.key_level}
              </div>
            )}

            {/* Reasoning */}
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: 8 }}>
              {idea.reasoning}
            </div>

            {/* Footer */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 8, borderTop: "1px solid var(--border-secondary)" }}>
              <div style={{ display: "flex", gap: 10 }}>
                {safeUrl(idea.chart_link) && (
                  <a href={safeUrl(idea.chart_link)} target="_blank" rel="noopener noreferrer" style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--accent)", textDecoration: "none",
                  }}>VIEW CHART</a>
                )}
                <button onClick={() => startEdit(idea)} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)",
                  background: "none", border: "none", cursor: "pointer", padding: 0,
                }}>EDIT</button>
                <button onClick={() => deleteIdea(idea.id)} style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--red)",
                  background: "none", border: "none", cursor: "pointer", padding: 0, opacity: 0.6,
                }}>DELETE</button>
              </div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, color: "var(--text-tertiary)" }}>
                {idea.created_at ? new Date(idea.created_at).toLocaleDateString([], { month: "short", day: "numeric" }) : ""}
              </span>
            </div>
          </div>
        </TCard>
      ))}
    </div>
  );
}

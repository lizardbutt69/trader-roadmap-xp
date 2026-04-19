# Trade Replay Feature — Implementation Plan

Build an interactive Trade Replay that renders a user's logged trade on a real candlestick chart (via Lightweight Charts + Yahoo Finance), with entry/exit markers, SL/TP price lines, and a trade info overlay.

## User Review Required

> [!IMPORTANT]
> **New fields in the trade form.** This adds 5 optional fields to "Log a Trade": Entry Price, Exit Price, Stop Loss, Take Profit, and Timeframe. They are all **optional** so existing logging flow stays fast. Replay only works when entry/exit prices are filled in.

> [!WARNING]
> **Yahoo Finance data limitations.** Intraday data (1m, 5m, 15m) is only available for the **last 7 days** from Yahoo. Older trades will fall back to hourly or daily candles, which still show context but won't have the granular intraday view. The 15-minute delay you already noted is acceptable.

---

## Proposed Changes

### Database Migration

#### [NEW] Trade replay columns migration

Add 5 new columns to the `trades` table (all optional, won't break existing data):

```sql
ALTER TABLE trades ADD COLUMN IF NOT EXISTS entry_price numeric;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS exit_price numeric;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS stop_loss numeric;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS take_profit numeric;
ALTER TABLE trades ADD COLUMN IF NOT EXISTS timeframe text;  -- e.g. '5m', '15m', '1H'
```

---

### API Layer

#### [MODIFY] [market-data.js](file:///Users/dannychan/Desktop/tradesharpv2/api/market-data.js)

Update the proxy to also accept `period1` and `period2` (Unix timestamps) so we can fetch candles for a specific trade's time window instead of just generic ranges:

```
/api/market-data?ticker=NQ%3DF&interval=5m&period1=1713168000&period2=1713196800
```

This lets us fetch exactly the 1-2 hours around a trade's entry/exit time.

---

### Trade Form Updates

#### [MODIFY] [trading.jsx](file:///Users/dannychan/Desktop/tradesharpv2/src/trading.jsx) — JournalView + QuickLogModal + Edit Modal

Add new optional fields to all three trade entry points:

| Field | Input Type | Placeholder | Notes |
|---|---|---|---|
| Entry Price | `number` (step="0.01") | "e.g. 18450.25" | Required for replay |
| Exit Price | `number` (step="0.01") | "e.g. 18510.50" | Required for replay |
| Stop Loss | `number` (step="0.01") | "e.g. 18400.00" | Optional, draws red dashed line |
| Take Profit | `number` (step="0.01") | "e.g. 18550.00" | Optional, draws green dashed line |
| Timeframe | `select` | 1m / 5m / 15m / 1H / 4H / 1D | Determines candle interval fetched |

These fields will be grouped under a collapsible **"TRADE REPLAY DATA"** section with an expand toggle, keeping the existing form clean. Section header will show: `▸ REPLAY DATA (optional — fill to enable chart replay)`

---

### Trade Replay Modal (New Component)

#### [NEW] `TradeReplayModal` component inside [trading.jsx](file:///Users/dannychan/Desktop/tradesharpv2/src/trading.jsx)

A full-screen glassmorphic modal that renders the trade on an interactive chart.

**Trigger:** A new ▶ "REPLAY" button on each trade row in the Trade History table (between the edit ✎ and delete ✕ buttons). Only shown when `entry_price` and `exit_price` exist on the trade.

**Layout:**

```
┌──────────────────────────────────────────────────┐
│  ✕                                TRADE REPLAY   │
├──────────────────────────────────────────────────┤
│                                                  │
│  ┌─ Trade Header ─────────────────────────────┐  │
│  │  NQ · Long · Apr 15, 2026 10:32 AM ET     │  │
│  │  Entry: 18,450.25 → Exit: 18,510.50       │  │
│  │  P&L: +$580  ·  R: +1.16R  ·  A+: Yes    │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  [1m] [5m] [15m] [1H] ← Interval selector       │
│  ┌────────────────────────────────────────────┐  │
│  │                                            │  │
│  │       Lightweight Charts Canvas            │  │
│  │       • Candlesticks (Yahoo data)          │  │
│  │       • ▲ Entry marker (green, belowBar)   │  │
│  │       • ▼ Exit marker (red, aboveBar)      │  │
│  │       • ─ ─ SL line (red dashed)           │  │
│  │       • ─ ─ TP line (green dashed)         │  │
│  │                                            │  │
│  │  Height: 450px                             │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  ┌─ Trade Notes ──────────────────────────────┐  │
│  │  Notes: "CIC confirmed, took it on the..." │  │
│  │  After: "Should've held longer, target..." │  │
│  │  Tags: [CISD] [TTFM] [GXT]               │  │
│  └────────────────────────────────────────────┘  │
│                                                  │
│  Data via Yahoo Finance · Delayed 15m            │
└──────────────────────────────────────────────────┘
```

**Data Fetching Logic:**

```
1. Convert trade asset name to Yahoo symbol:
   - "NQ" → "NQ=F"
   - "ES" → "ES=F"  
   - "EUR/USD" → "EURUSD=X"
   - Others → pass as-is (works for stocks like AAPL)

2. Calculate time window:
   - Start: entry_time - 60 minutes (padding for context)
   - End: exit_time + 60 minutes (or +120 min if no exit_time)
   
3. Choose interval based on trade's timeframe field:
   - If user selected "5m" → fetch 5m candles
   - If not set → auto-detect based on trade duration:
     < 30 min  → 1m
     < 2 hours → 5m
     < 8 hours → 15m
     < 3 days  → 1h
     else      → 1d
   
4. Fetch via existing /api/market-data proxy

5. If intraday data unavailable (trade > 7 days old):
   - Fall back to 1h or 1d interval
   - Show info badge: "Intraday data unavailable for trades older than 7 days"
```

**Chart Markers & Lines:**

```javascript
// Entry marker
series.setMarkers([
  {
    time: entryTimestamp,
    position: trade.direction === 'Long' ? 'belowBar' : 'aboveBar',
    color: '#34d399',
    shape: trade.direction === 'Long' ? 'arrowUp' : 'arrowDown',
    text: `Entry @ ${trade.entry_price}`,
  },
  {
    time: exitTimestamp,
    position: trade.direction === 'Long' ? 'aboveBar' : 'belowBar',
    color: '#f87171',
    shape: trade.direction === 'Long' ? 'arrowDown' : 'arrowUp',
    text: `Exit @ ${trade.exit_price}`,
  },
]);

// SL / TP price lines
if (trade.stop_loss) {
  series.createPriceLine({
    price: trade.stop_loss,
    color: '#ef4444',
    lineWidth: 1,
    lineStyle: 2, // dashed
    axisLabelVisible: true,
    title: 'SL',
  });
}
if (trade.take_profit) {
  series.createPriceLine({
    price: trade.take_profit,
    color: '#22c55e',
    lineWidth: 1,
    lineStyle: 2,
    axisLabelVisible: true,
    title: 'TP',
  });
}
```

---

### Asset Symbol Mapping

#### [NEW] Helper function `assetToYahooSymbol(asset)`

Maps user-entered asset names to Yahoo Finance ticker symbols:

| User Input | Yahoo Symbol | Notes |
|---|---|---|
| `NQ`, `NQ1!`, `MNQ` | `NQ=F` | E-mini / Micro NASDAQ-100 futures |
| `ES`, `ES1!`, `MES` | `ES=F` | E-mini / Micro S&P 500 futures |
| `YM`, `YM1!`, `MYM` | `YM=F` | E-mini / Micro Dow futures |
| `RTY`, `RTY1!`, `M2K` | `RTY=F` | E-mini / Micro Russell futures |
| `CL`, `CL1!`, `MCL` | `CL=F` | Crude Oil futures |
| `GC`, `GC1!`, `MGC` | `GC=F` | Gold futures |
| `EUR/USD`, `EURUSD` | `EURUSD=X` | Forex pairs |
| `GBP/USD`, `GBPUSD` | `GBPUSD=X` | Forex pairs |
| `BTC`, `BTCUSD` | `BTC-USD` | Crypto |
| Other | Pass as-is | Stocks (AAPL, TSLA, etc.) work directly |

---

### Trade History Table Update

#### [MODIFY] Trade History table in `TradeStatsView`

- Add a ▶ replay button in the actions column for each trade row
- Only visible when `entry_price` and `exit_price` both exist on the trade
- Styled as a small cyan play icon, consistent with edit/delete buttons
- Also add replay button in `TradeReviewModal` expanded row view

---

## Summary of All Changes

| Area | What Changes | Files |
|---|---|---|
| **Database** | 5 new optional columns on `trades` | `supabase-migration.sql` |
| **API** | Support `period1`/`period2` params | `api/market-data.js` |
| **Trade Form** | Collapsible "Replay Data" section with 5 fields | `src/trading.jsx` (JournalView, QuickLogModal, Edit Modal) |
| **Trade Replay** | New `TradeReplayModal` component | `src/trading.jsx` |
| **Trade Table** | ▶ Replay button per row | `src/trading.jsx` (TradeStatsView) |
| **Utilities** | `assetToYahooSymbol()` mapping function | `src/trading.jsx` |

---

## Open Questions

> [!IMPORTANT]
> **Exit Time field?** Currently you only log one `dt` (datetime) field. For replay, I'm planning to use `dt` as the entry time. Do you want a separate **Exit Time** field added too? This would let me place the exit marker at the correct candle. Without it, I'd estimate exit time from the entry time + trade duration heuristic, which is less precise.

> [!NOTE]
> **Which assets do you trade most?** I want to make sure the symbol mapping covers your usual instruments. From CLAUDE.md it looks like primarily NQ/ES, but do you also trade forex, crypto, or individual stocks that should be supported?

---

## Verification Plan

### Automated Tests
- Verify `assetToYahooSymbol()` mappings with known symbols
- Test API proxy with `period1`/`period2` parameters against Yahoo
- Confirm the new columns save/load correctly via Supabase

### Manual Verification
- Log a new trade with entry/exit/SL/TP filled in
- Click ▶ Replay on the trade in history table
- Verify candlesticks render with correct entry/exit markers
- Verify SL/TP dashed lines appear at correct price levels
- Test with NQ, ES, and at least one forex pair
- Test replay on a trade older than 7 days (should fall back to hourly)
- Confirm existing trades without replay data still work normally (no regression)
- Test on mobile viewport — modal should be full-screen and scrollable

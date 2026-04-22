# Rule Violation Tracking Plan

Add structured rule-violation tracking to the trading journal so discipline mistakes are measurable instead of buried in freeform notes.

## Goal

Track explicit execution and discipline mistakes on each trade, then use that data to improve:

- trade review workflows
- stats and filters
- AI coaching quality
- accountability over time

The key principle is to start small and structured. This should fit the existing TradeSharp app instead of becoming a large standalone subsystem.

## Phase 1: Add Violations To Trades

Start by storing violations directly on each trade.

### Proposed schema

Add a new `violations` field to `trades`:

```sql
alter table trades add column if not exists violations text[];
```

This should be a controlled list, not freeform text.

### Initial violation set

Recommended MVP set:

- `early_entry`
- `moved_stop`
- `outside_session`
- `overtrade`
- `revenge_trade`
- `no_confirmation`

Possible expansion later:

- `fomo_entry`
- `sized_too_big`
- `ignored_news`
- `poor_exit`
- `counter_bias`

### Why this first

This creates immediate value with low implementation risk:

- cleaner review filters
- better monthly stats
- better AI prompts
- trend tracking over time

## Phase 2: Shared Violation Definitions

Define violations centrally, similar to how setup tags are already handled.

### Proposed frontend structure

In `src/trading.jsx`, add a shared constant similar to `TRADE_TAGS`:

```js
const TRADE_VIOLATIONS = [
  { value: "early_entry", label: "EARLY ENTRY", color: "#f59e0b" },
  { value: "moved_stop", label: "MOVED STOP", color: "#ef4444" },
  { value: "outside_session", label: "OUTSIDE SESSION", color: "#a78bfa" },
  { value: "overtrade", label: "OVERTRADE", color: "#22d3ee" },
  { value: "revenge_trade", label: "REVENGE TRADE", color: "#fb7185" },
  { value: "no_confirmation", label: "NO CONFIRMATION", color: "#34d399" },
];
```

Optional later:

- add short descriptions for tooltips
- add severity groups
- add AI-facing descriptions

### Why this matters

Central definitions keep labels consistent across:

- trade logging
- review/edit flows
- filtering
- stats
- AI prompts

## Phase 3: UI Touchpoints

Add a fast chip-based multi-select UI for violations using the same interaction pattern already used for tags.

### Best touchpoints in this repo

Main file:

- [src/trading.jsx](/Users/dannychan/Desktop/tradesharpv2/src/trading.jsx)

Primary views/components:

- `JournalView`
- `QuickLogModal`
- `TradeReviewModal`
- `TradeStatsView` edit modal

### UX recommendation

Keep it optional and quick:

- user taps one or more chips
- values save as `violations: []`
- no required explanation for MVP

This should feel lightweight enough that users actually use it after every session.

## Phase 4: Stats And Review Value

Once violations are stored, expose them in stats so the feature becomes useful instead of just extra data entry.

### Recommended first stats

- most common violations this month
- violation rate: `trades with >=1 violation / taken trades`
- P&L on violating trades vs clean trades
- avg R on violating trades vs clean trades
- top violation by tag
- top violation by model
- streak: trades or days with no violations

### Best placement

- `TradeStatsView`
- `TradeReviewModal`
- optionally `TradeSharpScore` as a future discipline sub-metric

### Why this is important

This is the point where the feature pays off:

- users can see which mistakes repeat
- users can measure the cost of bad behavior
- review becomes more objective

## Phase 5: AI Integration

Feed structured violations into the existing AI coaching flows.

### Best integration points

- weekly summary
- monthly summary
- trade history analyzer
- pre-session brief
- Edge chat system context

### What this enables

Instead of inferring everything from notes, the AI can reference hard data:

- "3 of your last 5 losers included `early_entry`"
- "`moved_stop` trades underperformed clean trades by 1.2R this month"
- "Your most expensive violation this month was `outside_session`"

### Relevant files

- [api/ai-summary.js](/Users/dannychan/Desktop/tradesharpv2/api/ai-summary.js)
- AI prompt sections inside [src/trading.jsx](/Users/dannychan/Desktop/tradesharpv2/src/trading.jsx)

## Phase 6: Smart Suggestions Later

After the manual flow is stable, add suggestion logic.

### Good candidates for auto-suggestion

- `outside_session` if trade time is outside preferred session
- `overtrade` if it is trade 3+
- possibly `revenge_trade` if a trade follows a recent loss too quickly

### Important constraint

These should begin as suggestions, not hard automatic labels.

Some violations require trader judgment, especially:

- revenge trading
- emotional entries
- execution quality edge cases

## Recommended MVP

Ship the smallest version that creates visible value:

1. Add `violations text[]` to `trades`
2. Add chip picker in log/edit/review
3. Add review filters by violation type
4. Add monthly violation stats
5. Include violations in AI summaries

This is enough to validate the feature without overbuilding.

## Suggested Rollout Order

### Step 1

Database:

- add `violations text[]` to `trades`

### Step 2

Frontend data model:

- add shared `TRADE_VIOLATIONS`
- add picker component similar to tag picker

### Step 3

Trade entry/edit:

- `JournalView`
- `QuickLogModal`
- `TradeReviewModal`
- `TradeStatsView` edit modal

### Step 4

Review and analytics:

- add filters by violation type
- add violation summary cards and breakdowns

### Step 5

AI:

- include structured violation counts and trends in prompts

### Step 6

Optional follow-up:

- smart suggestions
- violation streaks
- discipline scoring

## Recommended Default Violation Set

For launch, keep the list small:

- Early Entry
- Moved Stop
- Outside Session
- Overtrade
- Revenge Trade
- No Confirmation

This is broad enough to surface real patterns but small enough to stay usable.

## Summary

The best first version is simple:

- track violations manually
- keep the list structured
- expose the results in stats and AI

That gives TradeSharp a much stronger accountability loop without needing a full behavioral engine on day one.

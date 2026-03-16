# Trader Roadmap XP

## What This Is

An interactive, RPG-style progression tracker AND full trading workflow app for a futures trader's journey from breakeven to full independence. Combines long-term quest progression with daily trading tools (checklist, journal, stats). All data persisted in Supabase.

## Design Direction

- **Visual style**: Light, modern RPG menu UI — GBA-era Pokemon inspired but high-clarity. Soft gradient backgrounds per tier, white card-based layout, DM Sans for body text.
- **Color worlds per level**: Green (Apprentice) → Gold (Grinder) → Blue (Funded Warrior) → Purple (Architect) → Rose (Master)
- **Mood**: Light, playful, motivating — not dark/gritty. Clean cards, progress rings, smooth animations, colored chips for labels.

## Architecture

Main files:
- `trader-roadmap-xp.jsx` — Main app component (roadmap, auth, profile, quest system)
- `src/trading.jsx` — Trading app components (checklist, journal, trading stats)
- `src/supabase.js` — Supabase client
- `src/main.jsx` — Entry point
- `supabase-migration.sql` — Database schema for trading tables

Tech stack:
- React 19 + Vite
- Supabase (auth, database, storage)
- Chart.js (equity curve)
- Deployed on Vercel

## Database Tables

### Supabase tables:
- `quest_completions` — Roadmap quest progress (quest_id, note, link, completed_at)
- `profiles` — User profiles (display_name, avatar_url)
- `trades` — Trade journal entries (dt, asset, direction, aplus, taken, bias, profit, chart, after_chart, notes)
- `trade_plans` — Daily pre-trade plans (plan_date, bias, max_trades, key_levels, session_plan, notes)

All tables have RLS policies scoped to auth.uid().

## Data Structure

5 levels, 26 total achievements across 4 types:
- **process** (📋) — journaling, checklists, model definition
- **discipline** (🎯) — session limits, A+ only, no revenge trading
- **milestone** (⭐) — account milestones, streaks, consecutive months
- **payout** (💰) — monetary targets ($1K/mo → $5K/mo → $10K/mo → $20K/mo → $25K/mo)

Levels and their XP thresholds:
1. The Apprentice (0 XP) — BRONZE — Learn the rules
2. The Grinder (375 XP) — SILVER — Breakeven → Funded
3. Funded Warrior (1,150 XP) — GOLD — Consistent payouts
4. The Architect (2,275 XP) — PLATINUM — Personal capital online
5. The Master (3,575 XP) — DIAMOND — Full independence

Total possible XP: ~5,250 (sum of all achievement XP values)

## Key Components

### Roadmap (trader-roadmap-xp.jsx)
- `ProgressRing` — SVG circular progress indicator
- `XPBar` — Horizontal progress bar with shine effect
- `Card` — Reusable card wrapper with hover states
- `Chip` — Small colored label tag (tier, type, amount)
- `LevelNode` — Map view level card with progress ring
- `AchievementRow` — Individual quest item with toggle
- `TraderRoadmapXP` — Main app with intro, map, level detail, and stats views

### Trading (src/trading.jsx)
- `ChecklistView` — Pre-trade plan form + 10-item A+ checklist with timer
- `JournalView` — Trade logging, equity curve, P&L calendar, trade history table
- `TradingStatsView` — AI summary (Anthropic API), trading XP, streaks, badges, weekly challenges

## Views

1. **Intro** — Splash screen with floating icon, tagline, tier preview, START QUEST button
2. **Roadmap** — All 5 levels listed vertically with progress rings, quest counts, tier chips
3. **Level Detail** — Individual level header + list of quest achievements (click to toggle)
4. **Trade** — Pre-trade plan + A+ checklist (10 items with 10-second reflection timer)
5. **Journal** — Stats bar, equity curve, P&L calendar, trade log form, trade history table
6. **Stats** — Quest stats + trading performance (AI summary, XP, streaks, badges, challenges)

## Trading Context

This tracker maps to a real trading methodology:
- **The trader**: ICT-inspired fractal model, NQ/ES primary, NY session only, max 2 trades/day
- **The path**: Prop firm funded accounts → consistent payouts → reinvest into personal capital → independence
- **Current position**: Level 2 (The Grinder) — funded, working toward consistent payouts
- **Key disciplines tracked**: A+ trade selection, 2-trade daily cap, no revenge trading, proper stop placement, session time rules

## A+ Checklist Items
1. CIC (Crack in Correlation) — SMT and/or PSP confirmed
2. Key Level / Liquidity
3. Timeframe Alignment
4. CISD (Change in State of Delivery)
5. ICCISD (Inter-Candle CISD)
6. TTFM (The Fractal Model)
7. Session / Time of Day
8. Risk/Reward Ratio (min 1:2)
9. Stop Loss Defined
10. Final honest self-check (10-second timer)

## Future Enhancements to Consider

- Auto-unlock roadmap quests from trading data (e.g., "5 A+ trades in a row" auto-completes discipline quest)
- Export/import trade data as JSON
- Sound effects on quest completion
- Confetti/particle effects on level-up
- Dark mode toggle

# Trader Roadmap XP

## What This Is

An interactive, RPG-style progression tracker AND full trading workflow app for a futures trader's journey from breakeven to full independence. Combines long-term quest progression with daily trading tools (checklist, journal, stats). All data persisted in Supabase.

## Design Direction

- **Visual style**: Premium glassmorphism UI with dual light/dark mode. Frosted glass cards, subtle glow accents, clean typography.
- **Font**: Plus Jakarta Sans (system fallback: -apple-system, sans-serif). Labels: 11px uppercase 600-700 weight with letter-spacing. Headings: 20-26px 700-800 weight.
- **Color worlds per level**: Green (Apprentice) → Gold (Grinder) → Blue (Funded Warrior) → Purple (Architect) → Rose (Master)
- **Mood**: Clean, professional, motivating. Glass-panel depth, cyan accent glow in dark mode, soft shadows in light mode.

### Theme System (CSS Variables)

**Light mode**: White/soft-gray backgrounds (`#f8f9fc`, `#ffffff`), dark navy text (`#0f1029`), cyan accent (`#0891b2`), no blur effects, subtle card shadows.

**Dark mode (default)**: Very dark navy base (`#0b0d13`), frosted glass panels (`rgba(255,255,255,0.04)`), bright cyan accent (`#22d3ee`), `backdrop-filter: blur(20px)` on cards/headers/sidebars, cyan glow borders (`0 0 12px rgba(34,211,238,0.06)`).

**Shared color tokens**: `--green`, `--red`, `--gold`, `--purple` with brighter values in dark mode (e.g., green: `#059669` light / `#34d399` dark).

### Glassmorphism Rules
- Header: `rgba(11,13,19,0.75)` + `blur(20px)`, sticky top, z-index 50
- Sidebar: `rgba(255,255,255,0.03)` + `blur(24px)`, sticky full-height
- Cards (TCard): `var(--bg-secondary)` + `var(--glass-blur)`, 10px radius, `var(--card-glow)` shadow
- Modals: Fixed overlay with `blur(8-12px)` backdrop
- Page banners: Gradient bg + `var(--glass-blur)` + radial accent glow at right edge

### Performance Color Scale (TradeSharp Score tiers)
- Elite (≥80): `#22d3ee` (cyan)
- Solid (≥60): `#22c55e` (green)
- Developing (≥40): `#f59e0b` (amber)
- Needs Work (<40): `#ef4444` (red)

### Spacing & Radius
- Border radius: Buttons 4-6px, Cards 8-10px, Avatars 50%
- Z-index stack: Header 50, Settings modal 200, Mobile sidebar 300, Education modal 500

### Mobile Responsiveness
- Breakpoint: 1024px — sidebar hides, hamburger (☰) appears
- Slide-in sidebar: 260px wide, `blur(24px)`, `slideInLeft 0.2s ease` animation
- XP display hidden on mobile, header padding tightens

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
1. Foundation (0 XP) — STAGE 1 — Build the process
2. Evaluation (375 XP) — STAGE 2 — Pass evals & get funded
3. Funded (1,150 XP) — STAGE 3 — Consistent payouts
4. Scaling (2,275 XP) — STAGE 4 — Personal capital online
5. Independent (3,575 XP) — STAGE 5 — Full-time trader

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
- `TradeSharpScore` — 7-pillar monthly performance scoring with SVG radar/spider chart
- `EducationView` — Learning library with YouTube embeds, screenshot modals, session notes, category filters
- `PageBanner` — Reusable motivational banner component used across all views
- `TCard` — Glassmorphic card wrapper with blur + glow in dark mode

## Views

1. **Intro** — Splash screen with floating icon, tagline, tier preview, START QUEST button
2. **Roadmap** — All 5 levels listed vertically with progress rings, quest counts, tier chips
3. **Level Detail** — Individual level header + list of quest achievements (click to toggle)
4. **Trade** — Pre-trade plan + A+ checklist (10 items with 10-second reflection timer)
5. **Journal** — Stats bar, equity curve, P&L calendar, trade log form, trade history table
6. **Stats** — Quest stats + trading performance (AI summary, XP, streaks, badges, challenges)
7. **Education** — Learning library with YouTube/screenshot resources, category & status filters, session notes

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

## Features Added Recently

### TradeSharp Score (Spider Chart)
- 7 pillars: Win Rate, Profit Factor, Win/Loss Size Ratio, Drawdown Recovery, Consistency, A+ Discipline, (7th TBD)
- SVG radar chart with animated color-coded dots per pillar
- Composite score with tier badge (Elite/Solid/Developing/Needs Work)
- Strength/weakness callout cards

### Privacy Mode
- Toggle in sidebar masks all dollar amounts with "••••"
- Persisted in localStorage
- Applies to P&L, balances, payouts, chart tooltips

### NYSE Market Clock
- Sidebar widget showing current ET time
- Status: OPEN (green), PRE-MKT (amber), CLOSED (gray)
- Gradient top indicator bar changes color by status
- Opening bell chime sound at 9:30 AM ET

### Profile Settings Hub
- Modal with avatar upload, display name, integrations (Google Sheets URL, Anthropic API key)
- Connected/Active status badges
- Save confirmation overlay with checkmark animation

### Page Banners
- Motivational banner on every major view (label, title, subtitle)
- Glassmorphic with radial accent glow

### CSV Export
- Export trade data as CSV from journal

### Sign Out
- Header button (↗ icon), also in sidebar and mobile menu

## Future Enhancements to Consider

- Auto-unlock roadmap quests from trading data (e.g., "5 A+ trades in a row" auto-completes discipline quest)
- Export/import trade data as JSON
- Sound effects on quest completion
- Confetti/particle effects on level-up

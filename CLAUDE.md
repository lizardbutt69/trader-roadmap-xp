# Trader Roadmap XP

## What This Is

An interactive, RPG-style progression tracker for a futures trader's journey from breakeven to full independence. Built as a single-file React component (JSX) designed to render in Claude.ai's artifact system or any React environment.

## Design Direction

- **Visual style**: Light, modern RPG menu UI — GBA-era Pokemon inspired but high-clarity. Soft gradient backgrounds per tier, white card-based layout, Silkscreen pixel font for headers/XP, DM Sans for body text.
- **Color worlds per level**: Green (Apprentice) → Gold (Grinder) → Blue (Funded Warrior) → Purple (Architect) → Rose (Master)
- **Mood**: Light, playful, motivating — not dark/gritty. Clean cards, progress rings, smooth animations, colored chips for labels.

## Architecture

Single file: `trader-roadmap-xp.jsx`

- Pure React functional component with hooks (useState, useEffect, useRef)
- No external state management — all state in React memory
- No localStorage/sessionStorage (not supported in Claude.ai artifacts)
- Fonts loaded via Google Fonts CDN (Silkscreen, DM Sans)
- No external component libraries — all UI built from scratch
- Animations via CSS keyframes injected in a `<style>` tag

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

- `ProgressRing` — SVG circular progress indicator
- `XPBar` — Horizontal progress bar with shine effect
- `Card` — Reusable card wrapper with hover states
- `Chip` — Small colored label tag (tier, type, amount)
- `LevelNode` — Map view level card with progress ring
- `AchievementRow` — Individual quest item with toggle
- `TraderRoadmapXP` — Main app with intro, map, level detail, and stats views

## Views

1. **Intro** — Splash screen with floating icon, tagline, tier preview, START QUEST button
2. **Map** — All 5 levels listed vertically with progress rings, quest counts, tier chips
3. **Level Detail** — Individual level header + list of quest achievements (click to toggle)
4. **Stats** — XP/level/quest summary grid, quest type breakdown with progress bars, payout milestone tracker

## Trading Context

This tracker maps to a real trading methodology:
- **The trader**: ICT-inspired fractal model, NQ/ES primary, NY session only, max 2 trades/day
- **The path**: Prop firm funded accounts → consistent payouts → reinvest into personal capital → independence
- **Current position**: Level 2 (The Grinder) — funded, working toward consistent payouts
- **Key disciplines tracked**: A+ trade selection, 2-trade daily cap, no revenge trading, proper stop placement, session time rules

## Future Enhancements to Consider

- Persistent storage (Google Sheets sync, or Claude artifact storage API)
- Date tracking on completed achievements
- Custom achievement creation
- Export/import progress as JSON
- Sound effects on quest completion
- Confetti/particle effects on level-up
- Daily/weekly recurring quests (journal streak, session compliance)
- Integration with the existing trading web app (Google Sheets journal data)

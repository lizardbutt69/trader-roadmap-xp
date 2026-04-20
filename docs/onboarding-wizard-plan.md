# Plan: New User Onboarding Wizard

## Context
Brand-new users land on the Dashboard with no accounts, no profile name, and no guidance. The `onboarding_complete` field exists in `user_preferences` but is never read — it's dead code. The critical blocker is the Journal trade-log form, where the account dropdown is empty without prior setup. This plan adds a 4-step modal wizard that surfaces on first login, collects the minimum viable setup (name, session, first account), and marks `onboarding_complete: true` when done.

---

## Critical Files
- `trader-roadmap-xp.jsx` — main app: auth, state, settings, navigation
- `src/trading.jsx` — DashboardView (line 4131), JournalView (line 1426), AccountsView (line 3680)

---

## Step 1 — Fix `loadPreferences` to set a loaded gate

**File:** `trader-roadmap-xp.jsx` ~line 1158

Add `const [prefsLoaded, setPrefsLoaded] = useState(false)` near other state at line 1098.

Change `loadPreferences` to always call `setPrefsLoaded(true)` after the query resolves — regardless of whether `data` is null or not. Currently, a new user (no row → `data === null`) never fires the setter, so there's no way to distinguish "still loading" from "loaded, new user".

```js
const loadPreferences = useCallback(async () => {
  if (!user) return;
  const { data } = await supabase.from("user_preferences").select("*").eq("user_id", user.id).maybeSingle();
  if (data) setUserPrefs(data);
  setPrefsLoaded(true); // ← add this line
}, [user]);
```

Also add `setUserPrefs(null); setPrefsLoaded(false);` to `handleSignOut` so state resets cleanly on multi-user sessions.

---

## Step 2 — Add onboarding state variables

**File:** `trader-roadmap-xp.jsx` ~line 1098 (near existing `userPrefs` state)

```js
const [prefsLoaded, setPrefsLoaded] = useState(false);
const [justCompletedOnboarding, setJustCompletedOnboarding] = useState(false);
const [onboardStep, setOnboardStep] = useState(1);
const [obName, setObName] = useState("");
const [obExpLevel, setObExpLevel] = useState("");
const [obSession, setObSession] = useState("");
const [obFirm, setObFirm] = useState("");
const [obAccountType, setObAccountType] = useState("eval");
const [obAccountSize, setObAccountSize] = useState("");
const [obSaving, setObSaving] = useState(false);
```

Add derived boolean (not state — no setter needed):
```js
const showOnboarding = prefsLoaded && !userPrefs?.onboarding_complete;
```
Place this near line 1256 with other derived values.

---

## Step 3 — `OnboardingModal` component

**File:** `trader-roadmap-xp.jsx` — add before `SettingsView` definition (~line 552)

### Signature
```js
function OnboardingModal({
  user, supabase, dark, setViewAndPersist, setUserPrefs, setProfile,
  onboardStep, setOnboardStep,
  obName, setObName, obExpLevel, setObExpLevel, obSession, setObSession,
  obFirm, setObFirm, obAccountType, setObAccountType,
  obAccountSize, setObAccountSize, obSaving, setObSaving,
  onJustCompleted,
})
```

### Save logic (`handleCompleteOnboarding`) — run sequentially, not in parallel
1. If `obName.trim()`: upsert `profiles` with `{ id: user.id, display_name, updated_at }` — do NOT include bio/avatar to avoid overwriting nulls
2. If `obExpLevel || obSession`: upsert `user_preferences` with experience_level / primary_session fields, `{ onConflict: "user_id" }`
3. If `obFirm.trim()`: insert into `accounts` — `{ user_id, firm, account_name: firm, account_type: obAccountType || "eval", account_size: obAccountSize ? parseFloat(obAccountSize) : null, status: "active" }`
4. Always: upsert `user_preferences` with `{ user_id, onboarding_complete: true }`, call `.select().single()` to get back full row
5. `setUserPrefs(p => ({ ...(p ?? {}), ...(updatedPrefs ?? {}), onboarding_complete: true }))` — this makes `showOnboarding` go false, hiding the modal
6. If `obName`: `setProfile(p => ({ ...p, display_name: obName.trim() }))` — updates sidebar + greeting instantly
7. `onJustCompleted()` — sets `justCompletedOnboarding: true` in parent

`handleSkipToCompletion` = `setOnboardStep(4)` + `handleCompleteOnboarding()`.

### 4 Steps

**Step 1 — Welcome**
- Centered layout: app logo icon (glow circle), "Welcome to TradeSharp" h2 (fontSize 24, fontWeight 800), brief tagline
- 3-item list previewing what they'll set up (profile, session, first account)
- Primary CTA: "Get Started →" → `setOnboardStep(2)`
- Skip link below: "Skip Setup" → `handleSkipToCompletion()`

**Step 2 — Your Profile** (progress dot: 1 of 2)
- Back button (←)
- Display name input (autoFocus), placeholder "e.g. Alex"
- Experience level pills: `[{key:"under_1yr", label:"Under 1 Year"}, {key:"1_3yrs", label:"1–3 Years"}, {key:"3plus_yrs", label:"3+ Years"}, {key:"professional", label:"Professional"}]`
- Primary session pills: `[{key:"ny", label:"NY Session"}, {key:"london", label:"London"}, {key:"asian", label:"Asian"}, {key:"all", label:"All Sessions"}]`
- Pills match the `pillGroup` style in SettingsView (lines 691–705): `background: var(--accent-dim), border: 1px solid rgba(34,211,238,0.4)` when active
- Footer: "Skip" (transparent, left) + "Next →" (accent, right) → `setOnboardStep(3)`

**Step 3 — Add First Account** (progress dot: 2 of 2)
- Back button
- Firm Name input (required, autoFocus), placeholder "e.g. FTMO, Apex, Personal"
- Account Type pills: Evaluation / Funded / Personal (default: Evaluation)
- Account Size number input (optional), placeholder "e.g. 100000"
- Footer: "Skip" + "Finish →" → `setOnboardStep(4)` + `handleCompleteOnboarding()`
- Disable "Finish" while `obSaving`

**Step 4 — You're Ready!**
- No back button, no progress dots
- Green checkmark in circle icon (rgba(52,211,153,0.15) bg)
- "You're all set!" heading, brief encouragement line
- If `obSaving`: small "Saving…" text (fontSize 11, var(--text-tertiary))
- 3 stacked CTA buttons:
  1. "Start Trading" (primary, accent bg) → `setViewAndPersist("journal")` (modal closes via state)
  2. "Explore Roadmap" (outline accent) → `setViewAndPersist("roadmap")`
  3. "Go to Dashboard" (tertiary bg) → `setViewAndPersist("map")`

### Overlay styles
```js
position: "fixed", inset: 0,
background: "var(--modal-overlay)",
backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
zIndex: 400,   // above proof modal (200) and tilt modal (300)
```
Card: `maxWidth: 480, borderRadius: 14, padding: "36px 36px 32px"`, glassmorphic bg matching existing proof modal pattern (line 1525).

Backdrop click → `handleSkipToCompletion()`.

---

## Step 4 — Render the modal

**File:** `trader-roadmap-xp.jsx` ~line 1505 (just after `<style>{globalStyles}</style>`, before the Proof modal block)

```jsx
{showOnboarding && (
  <OnboardingModal
    user={user} supabase={supabase} dark={dark}
    setViewAndPersist={setViewAndPersist}
    setUserPrefs={setUserPrefs} setProfile={setProfile}
    onboardStep={onboardStep} setOnboardStep={setOnboardStep}
    obName={obName} setObName={setObName}
    obExpLevel={obExpLevel} setObExpLevel={setObExpLevel}
    obSession={obSession} setObSession={setObSession}
    obFirm={obFirm} setObFirm={setObFirm}
    obAccountType={obAccountType} setObAccountType={setObAccountType}
    obAccountSize={obAccountSize} setObAccountSize={setObAccountSize}
    obSaving={obSaving} setObSaving={setObSaving}
    onJustCompleted={() => setJustCompletedOnboarding(true)}
  />
)}
```

---

## Step 5 — Update DashboardView greeting

**File:** `src/trading.jsx`

1. Add `justCompletedOnboarding = false` to `DashboardView` props (line 4131)
2. Change line 4230 greeting:
```jsx
{justCompletedOnboarding ? `Welcome, ${displayName || "Trader"}!` : `Welcome Back, ${displayName || "Trader"}`}
```
3. In `trader-roadmap-xp.jsx` line ~2516, pass `justCompletedOnboarding={justCompletedOnboarding}` to `<DashboardView>`

---

## Step 6 — Escape key

**File:** `trader-roadmap-xp.jsx` ~line 1075

Add `showOnboarding` to the escape key effect dependency array and add a guard at the top:
```js
if (showOnboarding) { handleSkipToCompletion(); return; }
```
`handleSkipToCompletion` must be defined in the parent scope (not inside the modal component) since the escape handler lives there. Pass it into `OnboardingModal` as a prop OR hoist the logic to a `useCallback` in the parent.

---

## Verification

1. Create a new Supabase test account → confirm email → log in
2. Onboarding modal should appear immediately on Dashboard (not before `prefsLoaded` is true)
3. Complete all steps → verify Supabase rows: `profiles.display_name`, `user_preferences.experience_level + onboarding_complete`, `accounts` row
4. Dashboard greeting shows "Welcome, [name]!" not "Welcome Back"
5. Go to Journal → account dropdown shows the newly created account
6. Sign out, sign back in → modal does NOT appear again (onboarding_complete = true)
7. Skip at step 1 → modal closes, onboarding_complete = true, no account/profile saved
8. Skip at step 3 → profile/session saved, no account saved, onboarding_complete = true

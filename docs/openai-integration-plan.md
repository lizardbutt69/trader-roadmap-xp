# Plan: Add OpenAI API Key Support to Integrations

## Context

All AI features (trading summary, journal coach, edge chat, pre-session brief) are currently hardcoded to Anthropic's API via the `/api/ai-summary.js` backend proxy. The prompts are generic trading coaching prompts that work equally well with GPT-4o. The user wants to support OpenAI as an alternative so users without an Anthropic key can still use all AI features.

The frontend response parsing in `src/trading.jsx` always reads `data.content[0].text` (Anthropic shape), so the backend must normalize OpenAI responses to match that shape transparently — no frontend call sites need to change.

---

## Provider Logic

- Anthropic key set → use Anthropic (`claude-sonnet-4-20250514`)
- OpenAI key set, no Anthropic key → use OpenAI (`gpt-4o`)
- Both set → prefer Anthropic
- Neither → fall back to server `ANTHROPIC_API_KEY` env var

---

## Changes

### 1. `supabase-migration.sql`

```sql
alter table profiles add column if not exists openai_api_key text;
```

### 2. `api/ai-summary.js`

- Add `const FALLBACK_OPENAI_KEY = process.env.OPENAI_API_KEY;`
- Update profile `.select()` on line 43 to also fetch `openai_api_key`
- After key lookup, set `useOpenAI = !anthropicKey && !!openaiKey` and `activeKey = anthropicKey || openaiKey`
- Update "no key" error: `"No API key found. Add your Anthropic or OpenAI key in Settings."`
- Branch on `useOpenAI`:
  - **Anthropic** (existing, unchanged): `https://api.anthropic.com/v1/messages`, `x-api-key` header
  - **OpenAI**: `https://api.openai.com/v1/chat/completions`, `Authorization: Bearer` header
    - Convert request: insert `{role:"system",content:system}` as first message if `system` is set, use model `"gpt-4o"`, drop `anthropic-version` header
    - Normalize response to Anthropic shape: `{ content: [{ text: data.choices[0].message.content }] }`
    - Map friendly errors: 429 → rate limit, 401 → invalid key, 403 → no access

### 3. `trader-roadmap-xp.jsx` — main component (~line 1100)

- Add: `const [openaiKey, setOpenaiKey] = useState("");`
- In the profile load effect (~line 1145), update `.select()` to include `openai_api_key`, then set state if present

### 4. `trader-roadmap-xp.jsx` — `SettingsView` component

- Add `openaiKey, setOpenaiKey` to the component signature
- Add `editOpenaiKey` / `showOpenaiKey` local state
- In `saveIntegrations`: upsert `openai_api_key` to profiles table (same pattern as anthropic key)
- Add OpenAI key field in Integrations UI below the Anthropic block — same pattern: password input, show/hide toggle, ACTIVE/NOT SET badge

### 5. SettingsView call site (~line 2507)

Add `openaiKey={openaiKey} setOpenaiKey={setOpenaiKey}` props.

---

## Critical Files

- [api/ai-summary.js](api/ai-summary.js) — backend proxy
- [trader-roadmap-xp.jsx](trader-roadmap-xp.jsx) — main state + SettingsView component + call site
- [supabase-migration.sql](supabase-migration.sql) — schema

---

## Verification

1. Add OpenAI key in Settings → badge shows ACTIVE, save succeeds
2. With only OpenAI key set, AI summary returns a GPT-4o response (no errors)
3. With both keys set, Anthropic is preferred
4. `npm run build` clean

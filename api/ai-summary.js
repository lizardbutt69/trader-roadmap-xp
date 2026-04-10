import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = [
  "https://trader-roadmap-xp.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

export default async function handler(req, res) {
  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const FALLBACK_ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Get user's Anthropic key from their Supabase profile
  let anthropicKey = FALLBACK_ANTHROPIC_KEY;
  const authHeader = req.headers.authorization;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_KEY env var is missing. Check Vercel environment variables." });
  }

  if (authHeader?.startsWith("Bearer ")) {
    try {
      const token = authHeader.slice(7);
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      if (authError || !user) {
        return res.status(401).json({ error: "Session expired or invalid. Please sign out and sign back in." });
      }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("anthropic_api_key")
        .eq("id", user.id)
        .single();
      if (profileError) {
        return res.status(500).json({ error: `Could not read profile: ${profileError.message}. The anthropic_api_key column may not exist — run the Supabase migration.` });
      }
      if (profile?.anthropic_api_key) {
        anthropicKey = profile.anthropic_api_key;
      }
    } catch (e) {
      return res.status(500).json({ error: `Auth lookup failed: ${e.message}` });
    }
  }

  if (!anthropicKey) {
    return res.status(400).json({ error: "No Anthropic API key found. Add your key in Profile Settings and save." });
  }

  try {
    const { model, max_tokens, messages, system } = req.body;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages, ...(system ? { system } : {}) }),
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: `Anthropic ${r.status}`, detail: text });
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

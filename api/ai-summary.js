import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = process.env.NODE_ENV === 'production' 
  ? ["https://trader-roadmap-xp.vercel.app"]
  : ["https://trader-roadmap-xp.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

// Rate limiting
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  if (entry.count > RATE_LIMIT_MAX) return true;
  return false;
}

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

  // Rate limiting
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  // Use server-side API key (from environment variable) - more secure than storing user keys in database
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
    if (!r.ok) {
      const friendlyErrors = {
        529: "Anthropic's API is overloaded right now. Wait a moment and try again.",
        429: "Rate limit hit. Wait a moment and try again.",
        401: "Invalid Anthropic API key. Check your key in Profile Settings.",
        403: "Anthropic API key doesn't have access to this model.",
      };
      const msg = friendlyErrors[r.status] || `Anthropic API error (${r.status}). Try again shortly.`;
      return res.status(r.status).json({ error: msg, detail: text });
    }
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

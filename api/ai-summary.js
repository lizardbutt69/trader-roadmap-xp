const ALLOWED_ORIGINS = [
  "https://trader-roadmap-xp.vercel.app",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:3000",
];

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY not configured on server." });
  }

  try {
    const { model, max_tokens, messages } = req.body;
    const r = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens, messages }),
    });
    const text = await r.text();
    if (!r.ok) return res.status(r.status).json({ error: `Anthropic ${r.status}`, detail: text });
    return res.status(200).json(JSON.parse(text));
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}

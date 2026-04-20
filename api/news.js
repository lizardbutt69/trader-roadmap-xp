const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://trader-roadmap-xp.vercel.app"]
  : ["https://trader-roadmap-xp.vercel.app", "http://localhost:5173", "http://localhost:3000"];

const FINNHUB_KEY = process.env.FINNHUB_API_KEY;
if (!FINNHUB_KEY) console.error("[news] FINNHUB_API_KEY env var not set");

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const { category = "general" } = req.query;

  try {
    const r = await fetch(`https://finnhub.io/api/v1/news?category=${encodeURIComponent(category)}&token=${FINNHUB_KEY}`);
    const text = await r.text();
    if (!r.ok) return res.status(500).json({ error: `Finnhub ${r.status}`, detail: text });
    const data = JSON.parse(text);
    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(data);
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch news" });
  }
}

const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://trader-roadmap-xp.vercel.app"]
  : ["https://trader-roadmap-xp.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 30;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.start > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { start: now, count: 1 });
    return false;
  }
  entry.count++;
  return entry.count > RATE_LIMIT_MAX;
}

const VALID_TICKER = /^[A-Z0-9=.,\-^/]+$/i;
const VALID_INTERVALS = new Set(["1m", "2m", "5m", "15m", "30m", "60m", "1h", "1d", "1wk", "1mo"]);

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const { ticker = "NQ=F", interval = "5m", range = "1d", period1, period2 } = req.query;

  if (!VALID_TICKER.test(ticker) || ticker.length > 20) {
    return res.status(400).json({ error: "Invalid ticker format" });
  }
  if (!VALID_INTERVALS.has(interval)) {
    return res.status(400).json({ error: "Invalid interval" });
  }

  try {
    const base = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=${interval}&includePrePost=false`;
    const url = period1 && period2
      ? `${base}&period1=${encodeURIComponent(period1)}&period2=${encodeURIComponent(period2)}`
      : `${base}&range=${encodeURIComponent(range)}`;
    const r = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TradeSharp/1.0)",
        "Accept": "application/json",
      },
    });
    if (!r.ok) {
      return res.status(r.status).json({ error: `Yahoo Finance error: ${r.status}` });
    }
    const data = await r.json();
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "No data returned for ticker" });

    const timestamps = result.timestamp || [];
    const quote = result.indicators?.quote?.[0] || {};
    const candles = timestamps
      .map((t, i) => ({
        time: t,
        open: quote.open?.[i],
        high: quote.high?.[i],
        low: quote.low?.[i],
        close: quote.close?.[i],
      }))
      .filter(c => c.open != null && c.high != null && c.low != null && c.close != null);

    return res.status(200).json({ candles, meta: result.meta });
  } catch (e) {
    return res.status(500).json({ error: "Failed to fetch market data" });
  }
}

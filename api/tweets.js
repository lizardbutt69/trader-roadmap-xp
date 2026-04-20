const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://trader-roadmap-xp.vercel.app"]
  : ["https://trader-roadmap-xp.vercel.app", "http://localhost:5173", "http://localhost:3000"];

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = 10; // max 10 requests per minute per IP

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
  // CORS — restrict to known origins
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET");

  // Only allow GET
  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Rate limiting
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Try again in a minute." });
  }

  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Server configuration error" });
  }

  try {
    // Resolve @financialjuice user ID
    const userRes = await fetch(
      "https://api.twitter.com/2/users/by/username/financialjuice",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const userData = await userRes.json();
    const userId = userData.data?.id;
    if (!userId) {
      return res.status(502).json({ error: "Could not resolve user ID" });
    }

    // Fetch latest tweets (no retweets or replies)
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=20&tweet.fields=created_at,text&exclude=retweets,replies`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(tweetsData);
  } catch {
    return res.status(500).json({ error: "Failed to fetch tweets" });
  }
}

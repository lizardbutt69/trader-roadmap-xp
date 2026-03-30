const ALLOWED_ORIGINS = [
  "https://trader-roadmap-xp.vercel.app",
  "http://localhost:5173",
  "http://localhost:3000",
];

const SYMBOLS = ["NQ=F", "ES=F", "YM=F", "RTY=F", "GC=F", "SI=F", "CL=F", "RB=F", "HO=F", "BTC-USD", "ETH-USD", "SOL-USD"];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  try {
    const url = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${SYMBOLS.join(",")}&fields=symbol,regularMarketPrice,regularMarketChange,regularMarketChangePercent,regularMarketPreviousClose`;

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; TradeSharp/1.0)",
        "Accept": "application/json",
      },
    });

    if (!response.ok) throw new Error(`Yahoo Finance responded ${response.status}`);

    const data = await response.json();
    const quotes = data?.quoteResponse?.result || [];

    const result = quotes.map((q) => ({
      symbol: q.symbol,
      price: q.regularMarketPrice,
      change: q.regularMarketChange,
      changePct: q.regularMarketChangePercent,
      prevClose: q.regularMarketPreviousClose,
    }));

    res.setHeader("Cache-Control", "s-maxage=30, stale-while-revalidate=15");
    return res.status(200).json(result);
  } catch (err) {
    return res.status(502).json({ error: "Failed to fetch quotes", detail: err.message });
  }
}

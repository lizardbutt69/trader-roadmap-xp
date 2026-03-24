export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET");

  const token = process.env.X_BEARER_TOKEN;
  if (!token) {
    return res.status(500).json({ error: "Missing X_BEARER_TOKEN" });
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
      return res.status(502).json({ error: "Could not resolve @financialjuice user ID", detail: userData });
    }

    // Fetch latest tweets (no retweets or replies)
    const tweetsRes = await fetch(
      `https://api.twitter.com/2/users/${userId}/tweets?max_results=20&tweet.fields=created_at,text&exclude=retweets,replies`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    const tweetsData = await tweetsRes.json();

    res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=30");
    return res.status(200).json(tweetsData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

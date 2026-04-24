import { createClient } from "@supabase/supabase-js";

const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://tradesharp.xyz", "https://www.tradesharp.xyz", "https://trader-roadmap-xp.vercel.app"]
  : ["https://tradesharp.xyz", "https://www.tradesharp.xyz", "https://trader-roadmap-xp.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) return res.status(401).json({ error: "Unauthorized" });

    const supabaseAdmin = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY
    );

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) return res.status(401).json({ error: "Invalid session" });

    const { error } = await supabaseAdmin.auth.admin.deleteUser(user.id);
    if (error) {
      console.error("delete-account error:", error);
      return res.status(500).json({ error: error.message });
    }

    return res.status(200).json({ success: true });
  } catch (e) {
    console.error("delete-account unhandled:", e);
    return res.status(500).json({ error: e.message || "Internal server error" });
  }
}

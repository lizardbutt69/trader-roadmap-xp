import Stripe from "stripe";
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

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing auth token" });
  }
  const token = authHeader.slice(7);

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
  const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !user) {
    return res.status(401).json({ error: "Invalid or expired session" });
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single();

  if (!profile?.stripe_customer_id) {
    return res.status(400).json({ error: "No Stripe customer found for this account." });
  }

  try {
    const stripe = new Stripe(STRIPE_SECRET_KEY);
    const baseUrl = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "https://tradesharp.xyz";
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${baseUrl}/app`,
    });
    return res.status(200).json({ url: portalSession.url });
  } catch (err) {
    console.error("Stripe portal error:", err);
    return res.status(500).json({ error: err.message || "Failed to open billing portal" });
  }
}

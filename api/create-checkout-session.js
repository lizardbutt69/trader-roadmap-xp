import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";

const ALLOWED_ORIGINS = process.env.NODE_ENV === "production"
  ? ["https://tradesharp.xyz", "https://www.tradesharp.xyz", "https://trader-roadmap-xp.vercel.app"]
  : ["https://tradesharp.xyz", "https://www.tradesharp.xyz", "https://trader-roadmap-xp.vercel.app", "http://localhost:5173", "http://localhost:5174", "http://localhost:3000"];

const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW = 60 * 1000;
const RATE_LIMIT_MAX = 10;

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

export default async function handler(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  if (isRateLimited(ip)) {
    return res.status(429).json({ error: "Too many requests. Please try again later." });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(500).json({ error: "Server misconfiguration: SUPABASE_URL or SUPABASE_SERVICE_KEY missing." });
  }
  if (!STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: "Server misconfiguration: STRIPE_SECRET_KEY missing." });
  }

  const PLAN_TO_PRICE = {
    trial_monthly: process.env.STRIPE_PRICE_ID_MONTHLY,
    monthly:       process.env.STRIPE_PRICE_ID_MONTHLY,
    annual:        process.env.STRIPE_PRICE_ID_ANNUAL,
  };

  const { plan } = req.body || {};
  const validPlans = Object.keys(PLAN_TO_PRICE);
  if (!plan || !validPlans.includes(plan)) {
    return res.status(400).json({ error: "Invalid or missing plan" });
  }
  if (!PLAN_TO_PRICE[plan]) {
    return res.status(500).json({ error: `Server misconfiguration: Stripe price ID for plan '${plan}' is not configured.` });
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

  const stripe = new Stripe(STRIPE_SECRET_KEY);

  try {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("stripe_customer_id")
      .eq("id", user.id)
      .single();

    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { supabase_user_id: user.id },
      });
      customerId = customer.id;
      await supabaseAdmin
        .from("profiles")
        .update({ stripe_customer_id: customerId, updated_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    const baseUrl = origin && ALLOWED_ORIGINS.includes(origin) ? origin : "https://tradesharp.xyz";

    const sessionParams = {
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: PLAN_TO_PRICE[plan], quantity: 1 }],
      mode: "subscription",
      success_url: `${baseUrl}/app?subscription=success`,
      cancel_url: `${baseUrl}/pricing`,
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id, plan },
      subscription_data: {
        metadata: { supabase_user_id: user.id, plan },
      },
    };

    if (plan === "trial_monthly") {
      sessionParams.subscription_data.trial_period_days = 30;
    }

    const checkoutSession = await stripe.checkout.sessions.create(sessionParams);
    return res.status(200).json({ url: checkoutSession.url });
  } catch (err) {
    console.error("Stripe checkout error:", err);
    return res.status(500).json({ error: err.message || "Failed to create checkout session" });
  }
}

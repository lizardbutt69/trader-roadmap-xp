import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

// Stripe webhooks require the raw request body for signature verification.
// Disabling Vercel's body parser is essential.
export const config = { api: { bodyParser: false } };

function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).end();
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
  const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
  const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
    console.error("Webhook server misconfiguration: missing env vars");
    return res.status(500).json({ error: "Server misconfiguration" });
  }

  const stripe = new Stripe(STRIPE_SECRET_KEY);
  const sig = req.headers["stripe-signature"];

  let rawBody;
  try {
    rawBody = await getRawBody(req);
  } catch (err) {
    console.error("Failed to read raw body:", err);
    return res.status(400).json({ error: "Failed to read body" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).json({ error: `Webhook signature failed: ${err.message}` });
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  const updateByCustomer = async (stripeCustomerId, updates) => {
    if (!stripeCustomerId) return;
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("stripe_customer_id", stripeCustomerId);
    if (error) {
      console.error("Supabase update failed:", error, "customer:", stripeCustomerId);
    }
  };

  try {
    switch (event.type) {
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object;
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        // Stripe statuses: trialing | active | past_due | canceled | incomplete | incomplete_expired | unpaid | paused
        await updateByCustomer(sub.customer, {
          subscription_status:  sub.status,
          subscription_ends_at: periodEnd,
        });
        break;
      }
      case "customer.subscription.deleted": {
        const sub = event.data.object;
        const periodEnd = sub.current_period_end
          ? new Date(sub.current_period_end * 1000).toISOString()
          : null;
        await updateByCustomer(sub.customer, {
          subscription_status:  "canceled",
          subscription_ends_at: periodEnd,
        });
        break;
      }
      default:
        // No-op for events we don't subscribe to
        break;
    }

    return res.status(200).json({ received: true });
  } catch (err) {
    console.error("Webhook handler error:", err);
    return res.status(500).json({ error: "Webhook handler failed" });
  }
}

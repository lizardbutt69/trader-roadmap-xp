import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase.js";
import { useSubscription } from "../hooks/useSubscription.js";
import PlanCard from "../components/PlanCard.jsx";

function TradeSharpLogo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M32 2L58 17V47L32 62L6 47V17L32 2Z" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M32 10L50 21V43L32 54L14 43V21L32 10Z" stroke="#22d3ee" strokeWidth="1" fill="rgba(34,211,238,0.03)" />
      <line x1="20" y1="32" x2="44" y2="32" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      <line x1="32" y1="20" x2="32" y2="44" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      <path d="M32 26L38 32L32 38L26 32Z" fill="#22d3ee" opacity="0.85" />
    </svg>
  );
}

export default function PricingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [busyPlan, setBusyPlan] = useState(null);
  const [checkoutError, setCheckoutError] = useState(null);

  const markPricingSeen = useCallback(async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ has_seen_pricing: true, updated_at: new Date().toISOString() })
      .eq("id", user.id);
    if (error) console.error("mark has_seen_pricing failed:", error);
  }, [user]);

  const goToApp = useCallback(async () => {
    await markPricingSeen();
    navigate("/app", { replace: true });
  }, [markPricingSeen, navigate]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Mark pricing as seen the moment a logged-in user lands here.
  // If they close the page or navigate away, they won't be redirected back.
  useEffect(() => {
    markPricingSeen();
  }, [markPricingSeen]);

  const { subscribe, isActive, isPaid, loading: subLoading } = useSubscription(user);

  const handleSelect = async (plan) => {
    if (!user) {
      navigate("/login");
      return;
    }
    if (isPaid) {
      goToApp();
      return;
    }
    setCheckoutError(null);
    setBusyPlan(plan);
    try {
      await subscribe(plan);
    } catch (err) {
      setCheckoutError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setBusyPlan(null);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0b0d13",
      fontFamily: "'Plus Jakarta Sans', sans-serif",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "48px 24px",
      position: "relative",
      overflow: "hidden",
    }}>
      <style>{`
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0b0d13; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
        @media (max-width: 780px) {
          .pricing-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* Ambient orbs */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-10%", left: "-5%",
          width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
        <div style={{
          position: "absolute", bottom: "0%", right: "-10%",
          width: 400, height: 400, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(129,140,248,0.06) 0%, transparent 70%)",
          filter: "blur(40px)",
        }} />
      </div>

      {/* Back button */}
      <button
        onClick={() => user ? goToApp() : navigate("/")}
        style={{
          position: "absolute", top: 24, left: 24,
          background: "transparent", border: "none",
          color: "#6b6e84", fontSize: 14, fontWeight: 500,
          cursor: "pointer", display: "flex", alignItems: "center", gap: 6,
          padding: "6px 0", transition: "color 0.2s",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          zIndex: 2,
        }}
        onMouseEnter={e => e.currentTarget.style.color = "#a0a3b5"}
        onMouseLeave={e => e.currentTarget.style.color = "#6b6e84"}
      >
        ← Back
      </button>

      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40, marginTop: 24, position: "relative", zIndex: 1 }}>
        <div style={{ display: "inline-flex", marginBottom: 14 }}>
          <TradeSharpLogo size={44} />
        </div>
        <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: "-0.02em", color: "#eaebf0", marginBottom: 8 }}>
          Choose your plan
        </div>
        <div style={{ fontSize: 14, color: "#6b6e84", maxWidth: 440 }}>
          Start with 30 days free. No charge today. Cancel anytime.
        </div>
      </div>

      {/* Active subscription notice */}
      {!authLoading && !subLoading && user && isPaid && (
        <div style={{
          background: "rgba(34,197,94,0.08)",
          border: "1px solid rgba(34,197,94,0.2)",
          borderRadius: 10,
          padding: "12px 20px",
          marginBottom: 24,
          color: "#22c55e",
          fontSize: 13,
          fontWeight: 600,
          position: "relative",
          zIndex: 1,
        }}>
          You already have an active plan. <button
            onClick={goToApp}
            style={{
              background: "transparent", border: "none", color: "#22c55e",
              textDecoration: "underline", cursor: "pointer", fontWeight: 700,
              fontFamily: "inherit", fontSize: 13, padding: 0, marginLeft: 4,
            }}
          >Back to app →</button>
        </div>
      )}

      {/* Checkout error banner */}
      {checkoutError && (
        <div style={{
          background: "rgba(239,68,68,0.08)",
          border: "1px solid rgba(239,68,68,0.25)",
          borderRadius: 10,
          padding: "12px 20px",
          marginBottom: 20,
          color: "#f87171",
          fontSize: 13,
          fontWeight: 600,
          position: "relative",
          zIndex: 1,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}>
          <span>⚠</span>
          <span>{checkoutError}</span>
          <button
            onClick={() => setCheckoutError(null)}
            style={{
              marginLeft: "auto", background: "transparent", border: "none",
              color: "#f87171", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: 0,
            }}
          >×</button>
        </div>
      )}

      {/* Pricing cards */}
      <div
        className="pricing-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 20,
          maxWidth: 960,
          width: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        <PlanCard
          title="Free Trial"
          price="$0"
          priceSubtext="today, then $15/month after 30 days"
          features={[
            "Full access for 30 days",
            "Cancel anytime before trial ends",
            "All trading tools unlocked",
            "Requires a card to start",
          ]}
          ctaLabel="Start Free Trial"
          badge="Most Popular"
          highlight
          loading={busyPlan === "trial_monthly"}
          onSelect={() => handleSelect("trial_monthly")}
        />

        <PlanCard
          title="Monthly"
          price="$15"
          priceSubtext="per month, billed monthly"
          features={[
            "Full trade journal & equity curve",
            "AI performance coach (Claude)",
            "TradeSharp Score — 7-pillar analysis",
            "Quest progression & XP system",
            "Cancel anytime",
          ]}
          ctaLabel="Choose Monthly"
          loading={busyPlan === "monthly"}
          onSelect={() => handleSelect("monthly")}
        />

        <PlanCard
          title="Annual"
          price="$150"
          priceSubtext="per year ($12.50/mo equivalent)"
          features={[
            "Everything in Monthly",
            "Trade replay & education library",
            "Rule violation tracking",
            "2 months free vs. monthly",
            "Priority support",
          ]}
          ctaLabel="Choose Annual"
          badge="Save $30"
          loading={busyPlan === "annual"}
          onSelect={() => handleSelect("annual")}
        />
      </div>

      {/* Skip CTA — only for logged-in users without active paid plan */}
      {user && !isActive && (
        <button
          onClick={goToApp}
          style={{
            marginTop: 28,
            background: "transparent",
            border: "none",
            color: "#a0a3b5",
            fontSize: 13,
            fontWeight: 600,
            cursor: "pointer",
            padding: "10px 18px",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            textDecoration: "underline",
            position: "relative",
            zIndex: 1,
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#eaebf0"}
          onMouseLeave={e => e.currentTarget.style.color = "#a0a3b5"}
        >
          Skip for now — start my 30-day trial →
        </button>
      )}

      {/* Footer note */}
      <div style={{
        marginTop: 20,
        fontSize: 12,
        color: "#6b6e84",
        textAlign: "center",
        maxWidth: 440,
        lineHeight: 1.6,
        position: "relative",
        zIndex: 1,
      }}>
        Secure payment powered by Stripe. You can manage or cancel your subscription anytime from your account settings.
      </div>
    </div>
  );
}

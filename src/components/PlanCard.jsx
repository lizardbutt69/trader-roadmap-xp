import { useState } from "react";

export default function PlanCard({ title, price, priceSubtext, features, ctaLabel, onSelect, highlight, badge, loading }) {
  const [hover, setHover] = useState(false);
  const borderColor = highlight ? "#22d3ee" : "rgba(255,255,255,0.08)";
  const glow = highlight
    ? (hover ? "0 0 48px rgba(34,211,238,0.25)" : "0 0 32px rgba(34,211,238,0.15)")
    : (hover ? "0 12px 36px rgba(0,0,0,0.4)" : "0 8px 24px rgba(0,0,0,0.3)");

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        position: "relative",
        background: highlight ? "rgba(34,211,238,0.04)" : "rgba(255,255,255,0.03)",
        border: `1px solid ${borderColor}`,
        borderRadius: 14,
        padding: "28px 24px",
        display: "flex",
        flexDirection: "column",
        gap: 16,
        boxShadow: glow,
        transition: "all 0.2s",
      }}
    >
      {badge && (
        <div style={{
          position: "absolute",
          top: -10,
          right: 20,
          background: highlight ? "linear-gradient(135deg, #0891b2, #22d3ee)" : "#22d3ee",
          color: "#0b0d13",
          fontSize: 10,
          fontWeight: 800,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          padding: "4px 10px",
          borderRadius: 4,
          boxShadow: "0 4px 12px rgba(34,211,238,0.3)",
        }}>{badge}</div>
      )}

      <div style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: highlight ? "#22d3ee" : "#6b6e84",
      }}>{title}</div>

      <div>
        <div style={{
          fontSize: 36,
          fontWeight: 800,
          color: "#eaebf0",
          lineHeight: 1,
          letterSpacing: "-0.02em",
        }}>{price}</div>
        {priceSubtext && (
          <div style={{
            fontSize: 12,
            color: "#6b6e84",
            marginTop: 6,
            lineHeight: 1.4,
          }}>{priceSubtext}</div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
        {features.map((f, i) => (
          <div key={i} style={{
            display: "flex",
            alignItems: "flex-start",
            gap: 8,
            fontSize: 13,
            color: "#a0a3b5",
            lineHeight: 1.5,
          }}>
            <span style={{ color: "#22d3ee", fontWeight: 700, flexShrink: 0 }}>✓</span>
            <span>{f}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onSelect}
        disabled={loading}
        style={{
          padding: "13px",
          borderRadius: 8,
          background: highlight
            ? (loading ? "rgba(34,211,238,0.4)" : "linear-gradient(135deg, #0891b2, #22d3ee)")
            : "rgba(255,255,255,0.06)",
          border: highlight ? "none" : "1px solid rgba(255,255,255,0.12)",
          color: highlight ? "#0b0d13" : "#eaebf0",
          fontSize: 14,
          fontWeight: 700,
          cursor: loading ? "not-allowed" : "pointer",
          letterSpacing: "0.01em",
          boxShadow: highlight && !loading ? "0 0 24px rgba(34,211,238,0.25)" : "none",
          transition: "all 0.2s",
          fontFamily: "'Plus Jakarta Sans', sans-serif",
          marginTop: 4,
        }}
      >
        {loading ? "Loading…" : ctaLabel}
      </button>
    </div>
  );
}

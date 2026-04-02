import React, { useState, useEffect } from "react";

// ─── TRADING MOTIVATIONAL QUOTES ──────────────────────────────────────────────

const TRADING_QUOTES = [
  {
    text: "The market rewards patience and punishes impatience.",
    author: "Unknown"
  },
  {
    text: "It's not about being right, it's about making money.",
    author: "Unknown"
  },
  {
    text: "The best trade is often no trade at all.",
    author: "Unknown"
  },
  {
    text: "Plan your trade, trade your plan.",
    author: "Unknown"
  },
  {
    text: "The market does not reward you for being right or wrong, but for when you are right making more than when you are wrong.",
    author: "George Soros"
  },
  {
    text: "Risk comes from not knowing what you're doing.",
    author: "Warren Buffett"
  },
  {
    text: "The four most dangerous words in investing: 'this time it's different'.",
    author: "Sir John Templeton"
  },
  {
    text: "Amateurs think about how much money they can make. Professionals think about how much money they could lose.",
    author: "Jack Schwager"
  },
  {
    text: "The elements of a good trade are: (1) cut losses, (2) cut losses, (3) cut losses. If you can follow these three rules, you may have a chance.",
    author: "Ed Seykota"
  },
  {
    text: "There is a time to go long, a time to go short, and a time to go fishing.",
    author: "Jesse Livermore"
  },
  {
    text: "The stock market is filled with individuals who know the price of everything, but the value of nothing.",
    author: "Philip Fisher"
  },
  {
    text: "Know what you own, and know why you own it.",
    author: "Peter Lynch"
  },
  {
    text: "The individual investor should act consistently as an investor and not as a speculator.",
    author: "Ben Graham"
  },
  {
    text: "Wall Street is the only place that people ride to in a Rolls Royce to get advice from those who take the subway.",
    author: "Warren Buffett"
  },
  {
    text: "In trading, discipline is more important than intelligence.",
    author: "Unknown"
  },
  {
    text: "Every loss is a lesson, every win is a confirmation.",
    author: "Unknown"
  },
  {
    text: "The market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett"
  },
  {
    text: "Do not try to buy at the bottom and sell at the top. It can't be done — except by liars.",
    author: "Bernard Baruch"
  },
  {
    text: "The biggest risk of all is not taking one.",
    author: "Mellody Hobson"
  },
  {
    text: "Trading is not about the action, it's about the discipline of inaction until the perfect setup presents itself.",
    author: "Unknown"
  },
  {
    text: "Your net worth is determined by your network, but your trading success is determined by your self-control.",
    author: "Unknown"
  },
  {
    text: "A bad attitude is like a flat tire. You can't go anywhere until you change it.",
    author: "Unknown"
  },
  {
    text: "The goal of a successful trader is to make the best trades. Money is secondary.",
    author: "Alexander Elder"
  },
  {
    text: "Hope is not a strategy. Fear is not a strategy. Greed is not a strategy.",
    author: "Unknown"
  },
  {
    text: "Consistency is the key to successful trading. It's not about the home runs, it's about getting on base.",
    author: "Unknown"
  },
  {
    text: "The market can remain irrational longer than you can remain solvent.",
    author: "John Maynard Keynes"
  },
  {
    text: "Successful investing is about managing risk, not avoiding it.",
    author: "Benjamin Graham"
  },
  {
    text: "Price is what you pay. Value is what you get.",
    author: "Warren Buffett"
  },
  {
    text: "The best investment you can make is in yourself.",
    author: "Warren Buffett"
  },
  {
    text: "Trading is 90% psychology and 10% methodology.",
    author: "Unknown"
  }
];

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function MotivationalQuotesBar() {
  const [currentQuote, setCurrentQuote] = useState(TRADING_QUOTES[0]);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    // Pick a random quote on mount (page reload)
    const randomIndex = Math.floor(Math.random() * TRADING_QUOTES.length);
    setCurrentQuote(TRADING_QUOTES[randomIndex]);

    // Add entrance animation
    setTimeout(() => setIsAnimating(true), 50);
  }, []);

  const handleRefresh = () => {
    setIsAnimating(false);
    setTimeout(() => {
      const randomIndex = Math.floor(Math.random() * TRADING_QUOTES.length);
      setCurrentQuote(TRADING_QUOTES[randomIndex]);
      setIsAnimating(true);
    }, 300);
  };

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        padding: "14px 24px",
        marginBottom: 20,
        background: `linear-gradient(135deg, var(--accent-dim) 0%, rgba(124,58,237,0.08) 50%, var(--accent-dim) 100%)`,
        border: `1px solid var(--border-primary)`,
        borderRadius: 10,
        overflow: "hidden",
        backdropFilter: "var(--glass-blur)",
        WebkitBackdropFilter: "var(--glass-blur)",
      }}
    >
      {/* Animated background grid pattern */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `
            linear-gradient(rgba(34,211,238,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(34,211,238,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Left accent border glow */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: `linear-gradient(180deg, var(--accent) 0%, var(--accent-secondary) 100%)`,
          boxShadow: "0 0 20px var(--accent-glow)",
        }}
      />

      {/* Quote content */}
      <div
        style={{
          position: "relative",
          display: "flex",
          alignItems: "center",
          gap: 16,
          opacity: isAnimating ? 1 : 0,
          transform: isAnimating ? "translateY(0)" : "translateY(8px)",
          transition: "opacity 0.4s ease, transform 0.4s ease",
        }}
      >
        {/* Quote icon */}
        <div
          style={{
            flexShrink: 0,
            width: 36,
            height: 36,
            borderRadius: "50%",
            background: `linear-gradient(135deg, var(--accent) 0%, var(--accent-secondary) 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
            boxShadow: `0 4px 12px var(--accent-glow)`,
          }}
        >
          💡
        </div>

        {/* Quote text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: "var(--text-primary)",
              lineHeight: 1.5,
              fontStyle: "italic",
            }}
          >
            "{currentQuote.text}"
          </div>
          <div
            style={{
              fontFamily: "'Plus Jakarta Sans', sans-serif",
              fontSize: 12,
              color: "var(--text-tertiary)",
              marginTop: 4,
              letterSpacing: "0.05em",
            }}
          >
            — {currentQuote.author}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={handleRefresh}
          style={{
            flexShrink: 0,
            padding: "8px 12px",
            background: "var(--bg-tertiary)",
            border: `1px solid var(--border-primary)`,
            borderRadius: 6,
            cursor: "pointer",
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontSize: 11,
            fontWeight: 600,
            color: "var(--text-secondary)",
            transition: "all 0.2s ease",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = "var(--accent-dim)";
            e.target.style.borderColor = "var(--accent)";
            e.target.style.color = "var(--accent)";
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "var(--bg-tertiary)";
            e.target.style.borderColor = "var(--border-primary)";
            e.target.style.color = "var(--text-secondary)";
          }}
        >
          New Quote
        </button>
      </div>

      {/* Subtle shimmer effect */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: "-100%",
          width: "50%",
          height: "100%",
          background: `linear-gradient(90deg, transparent, rgba(34,211,238,0.04), transparent)`,
          animation: "quoteShimmer 6s ease-in-out infinite",
          pointerEvents: "none",
        }}
      />

      <style>{`
        @keyframes quoteShimmer {
          0% { left: -100%; }
          50% { left: 200%; }
          100% { left: 200%; }
        }
      `}</style>
    </div>
  );
}
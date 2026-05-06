import React from 'react'
import { Link } from 'react-router-dom'

function FooterLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <defs>
        <linearGradient id="ts-footer-logo-grad" x1="0" y1="0" x2="64" y2="64">
          <stop offset="0%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path d="M14 44 L24 28 L34 36 L48 16" stroke="url(#ts-footer-logo-grad)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <circle cx="48" cy="16" r="4" fill="#22d3ee" />
    </svg>
  )
}

export default function SiteFooter() {
  return (
    <>
      <style>{`
        .ts-site-footer { flex-direction: row; gap: 0; }
        @media (max-width: 900px) {
          .ts-site-footer { flex-direction: column !important; gap: 12px !important; text-align: center !important; padding: 24px !important; }
          .ts-site-footer-disclaimer { max-width: 100% !important; align-items: center !important; }
        }
      `}</style>
      <footer className="ts-site-footer" style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div className="ts-site-footer-disclaimer" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10, maxWidth: 540 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <FooterLogo size={28} />
            <span style={{ fontSize: 16, fontWeight: 600, letterSpacing: '-0.02em', color: '#eaebf0' }}>
              Trade<span style={{ color: '#22d3ee' }}>Sharp</span>
            </span>
          </div>
          <p style={{ fontSize: 11.5, color: '#6b6e84', lineHeight: 1.65, margin: 0 }}>
            Trading futures, currencies, and options carries a high level of risk and is not suitable for every trader. Use only funds you can afford to lose. Any testimonials, examples, or client stories shown here are for illustration only and should not be interpreted as typical outcomes or assurances of future results.
          </p>
        </div>
        <p style={{ fontSize: 14, color: '#6b6e84', margin: 0 }}>
          © {new Date().getFullYear()} TradeSharp.
        </p>
        <div style={{ display: 'flex', gap: 24 }}>
          <Link to="/blog" style={{ fontSize: 13, color: '#6b6e84', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#22d3ee'}
            onMouseLeave={e => e.target.style.color = '#6b6e84'}
          >Blog</Link>
          <Link to="/privacy" style={{ fontSize: 13, color: '#6b6e84', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#22d3ee'}
            onMouseLeave={e => e.target.style.color = '#6b6e84'}
          >Privacy Policy</Link>
          <Link to="/terms" style={{ fontSize: 13, color: '#6b6e84', textDecoration: 'none' }}
            onMouseEnter={e => e.target.style.color = '#22d3ee'}
            onMouseLeave={e => e.target.style.color = '#6b6e84'}
          >Terms & Conditions</Link>
        </div>
      </footer>
    </>
  )
}

import { useState, useEffect, useMemo } from 'react';
import PlanCard from './PlanCard.jsx';
import { useSubscription } from '../hooks/useSubscription.js';

// ─── LOGO ─────────────────────────────────────────────────────────────────────
function TradeSharpLogo({ size = 40, glow = false }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" style={glow ? { filter: 'drop-shadow(0 0 18px rgba(34,211,238,0.55))' } : null}>
      <path d="M32 2L58 17V47L32 62L6 47V17L32 2Z" stroke="#22d3ee" strokeWidth="1.5" fill="none" opacity="0.5" />
      <path d="M32 10L50 21V43L32 54L14 43V21L32 10Z" stroke="#22d3ee" strokeWidth="1" fill="rgba(34,211,238,0.03)" />
      <line x1="20" y1="32" x2="44" y2="32" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      <line x1="32" y1="20" x2="32" y2="44" stroke="#22d3ee" strokeWidth="1.5" opacity="0.7" />
      <path d="M32 26L38 32L32 38L26 32Z" fill="#22d3ee" opacity="0.85" />
      <line x1="20" y1="20" x2="24" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="20" x2="20" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="20" x2="40" y2="20" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="20" x2="44" y2="24" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="44" x2="24" y2="44" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="20" y1="44" x2="20" y2="40" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="44" x2="40" y2="44" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <line x1="44" y1="44" x2="44" y2="40" stroke="#22d3ee" strokeWidth="1" opacity="0.35" />
      <circle cx="32" cy="32" r="28" stroke="#22d3ee" strokeWidth="0.5" opacity="0.12" />
    </svg>
  );
}

// ─── ICONS ────────────────────────────────────────────────────────────────────
const Icon = {
  user: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>,
  style: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  goal: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>,
  account: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
  check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>,
  arrow: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
  back: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
  spark: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg>,
  clock: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
  shield: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
  chart: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></svg>,
  layers: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>,
  rocket: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z"/><path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z"/><path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0"/><path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5"/></svg>,
  map: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></svg>,
  pencil: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  x: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>,
};

// ─── ATOMS ────────────────────────────────────────────────────────────────────
function Pill({ active, onClick, children, icon }) {
  return (
    <button type="button" onClick={onClick} className="ts-ob-pill" style={{
      padding: '10px 14px', borderRadius: 10,
      border: `1px solid ${active ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.08)'}`,
      background: active ? 'rgba(34,211,238,0.12)' : 'rgba(255,255,255,0.02)',
      color: active ? '#e6fbff' : 'rgba(255,255,255,0.72)',
      fontSize: 13, fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer',
      display: 'inline-flex', alignItems: 'center', gap: 8,
      transition: 'all 180ms cubic-bezier(.2,.8,.2,1)',
      boxShadow: active ? '0 0 0 3px rgba(34,211,238,0.08), 0 0 20px rgba(34,211,238,0.15)' : 'none',
      letterSpacing: '-0.005em',
    }}>
      {icon && <span style={{ color: active ? '#22d3ee' : 'rgba(255,255,255,0.5)' }}>{icon}</span>}
      {children}
    </button>
  );
}

function OBCard({ active, onClick, children, style }) {
  return (
    <button type="button" onClick={onClick} className="ts-ob-card" style={{
      padding: 18, borderRadius: 12,
      border: `1px solid ${active ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.07)'}`,
      background: active ? 'rgba(34,211,238,0.08)' : 'rgba(255,255,255,0.02)',
      color: 'inherit', cursor: 'pointer', textAlign: 'left',
      display: 'flex', flexDirection: 'column', gap: 8,
      transition: 'all 220ms cubic-bezier(.2,.8,.2,1)',
      boxShadow: active ? '0 0 0 3px rgba(34,211,238,0.08), 0 10px 40px -10px rgba(34,211,238,0.3)' : 'none',
      fontFamily: 'inherit', ...style,
    }}>
      {children}
    </button>
  );
}

function OBLabel({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.55)' }}>{children}</div>
      {hint && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>{hint}</div>}
    </div>
  );
}

function OBTextInput({ value, onChange, placeholder, autoFocus, prefix, suffix, type = 'text' }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{
      display: 'flex', alignItems: 'center',
      background: 'rgba(255,255,255,0.03)',
      border: `1px solid ${focused ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 10, padding: '0 14px', transition: 'all 180ms',
      boxShadow: focused ? '0 0 0 3px rgba(34,211,238,0.1)' : 'none',
    }}>
      {prefix && <span style={{ color: 'rgba(255,255,255,0.4)', marginRight: 10, fontSize: 14, fontWeight: 500 }}>{prefix}</span>}
      <input
        type={type} value={value} autoFocus={autoFocus} placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          flex: 1, background: 'transparent', border: 'none', outline: 'none',
          color: '#fff', fontSize: 15, padding: '14px 0', fontFamily: 'inherit',
          fontWeight: 500, letterSpacing: '-0.01em',
        }}
      />
      {suffix && <span style={{ color: 'rgba(255,255,255,0.4)', marginLeft: 10, fontSize: 13 }}>{suffix}</span>}
    </div>
  );
}

// ─── BACKGROUND ───────────────────────────────────────────────────────────────
function StarField() {
  const stars = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({ x: Math.random() * 100, y: Math.random() * 100, size: Math.random() * 1.6 + 0.4, delay: Math.random() * 6, dur: 3 + Math.random() * 5 });
    }
    return arr;
  }, []);
  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      {stars.map((s, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${s.x}%`, top: `${s.y}%`,
          width: s.size, height: s.size, borderRadius: '50%', background: '#22d3ee', opacity: 0,
          animation: `tsObTwinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
        }} />
      ))}
    </div>
  );
}

function OnboardingBackdrop({ step, totalSteps }) {
  const progress = step / Math.max(totalSteps - 1, 1);
  return (
    <>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 50% 0%, #0f1624 0%, #080a11 55%, #050609 100%)' }} />
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'linear-gradient(rgba(34,211,238,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.045) 1px, transparent 1px)',
        backgroundSize: '56px 56px',
        maskImage: 'radial-gradient(ellipse at 50% 40%, #000 30%, transparent 75%)',
        WebkitMaskImage: 'radial-gradient(ellipse at 50% 40%, #000 30%, transparent 75%)',
      }} />
      <div style={{
        position: 'absolute', top: '8%', left: `${10 + progress * 70}%`, transform: 'translateX(-50%)',
        width: 620, height: 620, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(34,211,238,0.22) 0%, rgba(34,211,238,0.06) 35%, transparent 70%)',
        filter: 'blur(40px)', transition: 'left 900ms cubic-bezier(.2,.8,.2,1)',
      }} />
      <div style={{
        position: 'absolute', bottom: '-15%', right: `${10 + (1 - progress) * 50}%`,
        width: 500, height: 500, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(167,139,250,0.14) 0%, rgba(167,139,250,0.03) 40%, transparent 70%)',
        filter: 'blur(50px)', transition: 'right 900ms cubic-bezier(.2,.8,.2,1)',
      }} />
      <StarField />
    </>
  );
}

// ─── PROGRESS RAIL ────────────────────────────────────────────────────────────
function ProgressRail({ step, steps, onJump }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, padding: '6px 8px',
      background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
      borderRadius: 999, backdropFilter: 'blur(20px)',
    }}>
      {steps.map((s, i) => {
        const active = i === step, done = i < step;
        return (
          <div key={s.key} style={{ display: 'flex', alignItems: 'center' }}>
            <button type="button" onClick={() => onJump && i <= step && onJump(i)} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 999, border: 'none',
              background: active ? 'rgba(34,211,238,0.14)' : 'transparent',
              color: active ? '#e6fbff' : done ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.35)',
              fontFamily: 'inherit', fontSize: 12, fontWeight: 600, letterSpacing: '-0.005em',
              cursor: onJump && i <= step ? 'pointer' : 'default', transition: 'all 200ms',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? '#22d3ee' : done ? 'rgba(34,211,238,0.25)' : 'rgba(255,255,255,0.06)',
                color: active ? '#051015' : done ? '#22d3ee' : 'rgba(255,255,255,0.4)',
                fontSize: 10, fontWeight: 800,
                boxShadow: active ? '0 0 16px rgba(34,211,238,0.5)' : 'none', transition: 'all 200ms',
              }}>
                {done ? Icon.check : i + 1}
              </div>
              <span className="ts-ob-rail-label">{s.label}</span>
            </button>
            {i < steps.length - 1 && <div style={{ width: 18, height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 -2px' }} />}
          </div>
        );
      })}
    </div>
  );
}

// ─── STEP SHELL ───────────────────────────────────────────────────────────────
function StepHeader({ kicker, title, subtitle }) {
  return (
    <div style={{ textAlign: 'center', marginBottom: 32 }}>
      {kicker && <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: 14, opacity: 0.9 }}>{kicker}</div>}
      <h1 style={{ fontSize: 38, fontWeight: 800, letterSpacing: '-0.03em', margin: 0, color: '#fff', lineHeight: 1.1 }}>{title}</h1>
      {subtitle && <p style={{ marginTop: 14, fontSize: 16, color: 'rgba(255,255,255,0.55)', fontWeight: 400, lineHeight: 1.55, maxWidth: 520, marginLeft: 'auto', marginRight: 'auto' }}>{subtitle}</p>}
    </div>
  );
}

function StepFooter({ onBack, onNext, onSkip, nextLabel = 'Continue', nextDisabled }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 36, paddingTop: 20, borderTop: '1px solid rgba(255,255,255,0.05)' }}>
      <div>
        {onBack && (
          <button type="button" onClick={onBack} className="ts-ob-btn-ghost">
            {Icon.back}<span>Back</span>
          </button>
        )}
      </div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        {onSkip && <button type="button" onClick={onSkip} className="ts-ob-btn-skip">Skip for now</button>}
        <button type="button" onClick={onNext} disabled={nextDisabled} className="ts-ob-btn-primary"
          style={{ opacity: nextDisabled ? 0.45 : 1, pointerEvents: nextDisabled ? 'none' : 'auto' }}>
          <span>{nextLabel}</span>{Icon.arrow}
        </button>
      </div>
    </div>
  );
}

// ─── STEPS ────────────────────────────────────────────────────────────────────
function WelcomeStep({ data, onNext, onSkip }) {
  const items = [
    { icon: Icon.user, label: 'Your Profile', desc: 'Display name and experience level' },
    { icon: Icon.style, label: 'Trading Style', desc: 'Instruments, methodology, session' },
    { icon: Icon.goal, label: 'Your Goal', desc: 'Target payout and timeline' },
    { icon: Icon.account, label: 'First Account', desc: 'Firm, type, and starting size' },
    { icon: Icon.spark, label: 'Pick a Plan', desc: '30-day free trial, monthly, or annual' },
    { icon: Icon.rocket, label: 'Setup Complete', desc: "You're ready to trade" },
  ];
  return (
    <div className="ts-ob-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '8px 0 0' }}>
      <div style={{ position: 'relative', marginBottom: 28 }}>
        <div style={{ position: 'absolute', inset: -30, background: 'radial-gradient(circle, rgba(34,211,238,0.25), transparent 70%)', animation: 'tsObPulse 3s ease-in-out infinite' }} />
        <div style={{ position: 'relative', animation: 'tsObFloat 5s ease-in-out infinite' }}>
          <TradeSharpLogo size={72} glow />
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: 16 }}>Welcome to TradeSharp</div>
      <h1 style={{ fontSize: 52, fontWeight: 800, letterSpacing: '-0.035em', margin: 0, color: '#fff', textAlign: 'center', lineHeight: 1.02 }}>
        Let's turn you into<br/>
        <span style={{ background: 'linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>a sharper trader.</span>
      </h1>
      <p style={{ marginTop: 18, fontSize: 16, color: 'rgba(255,255,255,0.55)', maxWidth: 520, textAlign: 'center', lineHeight: 1.55 }}>
        A quick setup — about 90 seconds — tunes the roadmap, journal, and AI coach to exactly how you trade.
      </p>
      <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, width: '100%' }}>
        {items.map((it, i) => (
          <div key={i} style={{
            padding: '16px 14px', borderRadius: 12,
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            animation: `tsObFadeInUp 600ms cubic-bezier(.2,.8,.2,1) ${i * 80}ms both`,
            position: 'relative', overflow: 'hidden',
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(34,211,238,0.1)', color: '#22d3ee', marginBottom: 10 }}>{it.icon}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', marginBottom: 4 }}>{it.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{it.desc}</div>
            <div style={{ position: 'absolute', top: 10, right: 10, fontSize: 9, fontWeight: 700, color: 'rgba(34,211,238,0.5)', fontVariantNumeric: 'tabular-nums' }}>0{i + 1}</div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 36, display: 'flex', gap: 12, alignItems: 'center' }}>
        <button type="button" onClick={onNext} className="ts-ob-btn-primary" style={{ padding: '14px 24px', fontSize: 14 }}>
          <span>Get started</span>{Icon.arrow}
        </button>
        <button type="button" onClick={onSkip} className="ts-ob-btn-skip">I'll do this later</button>
      </div>
      <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16, fontSize: 11, color: 'rgba(255,255,255,0.35)' }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{Icon.clock}~90 seconds</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>{Icon.shield}Private & encrypted</span>
        <span style={{ width: 3, height: 3, borderRadius: '50%', background: 'rgba(255,255,255,0.2)' }} />
        <span>All changeable later</span>
      </div>
    </div>
  );
}

function ProfileStep({ data, update, onNext, onBack, onSkip }) {
  const exp = [
    { key: 'under_1yr', label: 'Under 1 Year', hint: 'New to futures' },
    { key: '1_3yrs', label: '1–3 Years', hint: 'Building consistency' },
    { key: '3plus_yrs', label: '3+ Years', hint: 'Consistent operator' },
    { key: 'professional', label: 'Professional', hint: 'Full-time or prop' },
  ];
  return (
    <div className="ts-ob-step">
      <StepHeader kicker="Step 01 · Profile" title="First, who are we working with?" subtitle="Your name shows up on your journal, and experience helps us tune the coach." />
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <OBLabel>Display name</OBLabel>
          <OBTextInput value={data.name} onChange={(v) => update({ name: v })} placeholder="e.g. Alex" autoFocus />
        </div>
        <div>
          <OBLabel hint="Optional — tunes the AI coach tone">Experience</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
            {exp.map((e) => (
              <OBCard key={e.key} active={data.exp === e.key} onClick={() => update({ exp: e.key })}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{e.label}</div>
                  <div style={{ width: 16, height: 16, borderRadius: '50%', border: `1.5px solid ${data.exp === e.key ? '#22d3ee' : 'rgba(255,255,255,0.2)'}`, background: data.exp === e.key ? '#22d3ee' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 180ms' }}>
                    {data.exp === e.key && <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#051015' }} />}
                  </div>
                </div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>{e.hint}</div>
              </OBCard>
            ))}
          </div>
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} onSkip={onSkip} nextDisabled={!data.name.trim()} />
    </div>
  );
}

function StyleStep({ data, update, onNext, onBack, onSkip }) {
  const instruments = [
    { key: 'futures', label: 'Futures', sub: 'NQ, ES, CL, GC' },
    { key: 'forex', label: 'Forex', sub: 'Majors & minors' },
    { key: 'equities', label: 'Equities', sub: 'Stocks & ETFs' },
    { key: 'crypto', label: 'Crypto', sub: 'BTC, ETH, alts' },
    { key: 'options', label: 'Options', sub: 'Directional & spreads' },
  ];
  const methods = [
    { key: 'ict', label: 'ICT / SMC', desc: 'Liquidity, order blocks, fractal' },
    { key: 'priceaction', label: 'Price Action', desc: 'Pure structure & levels' },
    { key: 'supply', label: 'Supply & Demand', desc: 'Institutional zones' },
    { key: 'technical', label: 'Indicator-based', desc: 'MA, RSI, MACD, VWAP' },
    { key: 'scalp', label: 'Scalping', desc: 'Sub-minute precision' },
    { key: 'still', label: 'Still figuring it out', desc: "We'll help you find one" },
  ];
  const sessions = [
    { key: 'ny', label: 'New York', hint: '09:30 – 16:00 ET' },
    { key: 'london', label: 'London', hint: '03:00 – 11:00 ET' },
    { key: 'asian', label: 'Asian', hint: '19:00 – 04:00 ET' },
    { key: 'all', label: 'All sessions', hint: 'I trade whenever' },
  ];
  return (
    <div className="ts-ob-step">
      <StepHeader kicker="Step 02 · Style" title="How do you trade?" subtitle="We'll preset your A+ checklist, journal fields, and the education library based on this." />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 26 }}>
          <OBLabel hint="Pick all that apply">Instruments</OBLabel>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {instruments.map((i) => {
              const active = data.instruments.includes(i.key);
              return (
                <Pill key={i.key} active={active} onClick={() => {
                  const next = active ? data.instruments.filter(x => x !== i.key) : [...data.instruments, i.key];
                  update({ instruments: next });
                }}>
                  <span>{i.label}</span>
                  <span style={{ opacity: 0.5, fontWeight: 500 }}>· {i.sub}</span>
                </Pill>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom: 26 }}>
          <OBLabel>Methodology</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {methods.map((m) => (
              <OBCard key={m.key} active={data.method === m.key} onClick={() => update({ method: m.key })}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{m.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{m.desc}</div>
              </OBCard>
            ))}
          </div>
        </div>
        <div>
          <OBLabel>Primary session</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {sessions.map((s) => (
              <OBCard key={s.key} active={data.session === s.key} onClick={() => update({ session: s.key })}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontVariantNumeric: 'tabular-nums' }}>{s.hint}</div>
              </OBCard>
            ))}
          </div>
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </div>
  );
}

function GoalsStep({ data, update, onNext, onBack, onSkip }) {
  const targets = [
    { key: 1000, label: '$1K / mo', level: 'Foundation', chroma: '#56b886' },
    { key: 5000, label: '$5K / mo', level: 'Evaluation', chroma: '#d4b862' },
    { key: 10000, label: '$10K / mo', level: 'Funded', chroma: '#5b8dd9' },
    { key: 20000, label: '$20K / mo', level: 'Scaling', chroma: '#9b7de8' },
    { key: 25000, label: '$25K+ / mo', level: 'Independent', chroma: '#e8748a' },
  ];
  const timelines = [
    { key: '3mo', label: '3 months', hint: 'Aggressive' },
    { key: '6mo', label: '6 months', hint: 'Focused' },
    { key: '12mo', label: '12 months', hint: 'Realistic' },
    { key: '24mo', label: '24+ months', hint: 'Patient' },
  ];
  const risks = [
    { key: 'conservative', label: 'Conservative', sub: '~0.25% of account per trade' },
    { key: 'balanced', label: 'Balanced', sub: '~0.5% of account per trade' },
    { key: 'aggressive', label: 'Aggressive', sub: '~1% of account per trade' },
  ];
  const activeTarget = targets.find(t => t.key === data.target);
  return (
    <div className="ts-ob-step">
      <StepHeader kicker="Step 03 · Goals" title="Where are you headed?" subtitle="The roadmap and XP system calibrate around your target payout and timeline." />
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        <div style={{ marginBottom: 28 }}>
          <OBLabel hint={activeTarget ? `→ ${activeTarget.level} tier` : undefined}>Monthly payout target</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
            {targets.map((t) => {
              const active = data.target === t.key;
              return (
                <button key={t.key} type="button" onClick={() => update({ target: t.key })} className="ts-ob-target" style={{
                  padding: '14px 8px', borderRadius: 10, fontFamily: 'inherit', color: '#fff', position: 'relative', overflow: 'hidden',
                  border: `1px solid ${active ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.07)'}`,
                  background: active ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.02)', cursor: 'pointer',
                  boxShadow: active ? '0 0 0 3px rgba(34,211,238,0.08), 0 10px 30px -10px rgba(34,211,238,0.25)' : 'none',
                  transition: 'all 200ms',
                }}>
                  <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.01em', color: '#fff' }}>{t.label}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: t.chroma, marginTop: 4 }}>{t.level}</div>
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: t.chroma, opacity: active ? 1 : 0.3 }} />
                </button>
              );
            })}
          </div>
        </div>
        <div style={{ marginBottom: 28 }}>
          <OBLabel>Timeline to target</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {timelines.map((t) => (
              <OBCard key={t.key} active={data.timeline === t.key} onClick={() => update({ timeline: t.key })}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{t.hint}</div>
              </OBCard>
            ))}
          </div>
        </div>
        <div>
          <OBLabel>Risk appetite per trade</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {risks.map((r) => (
              <OBCard key={r.key} active={data.risk === r.key} onClick={() => update({ risk: r.key })}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{r.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{r.sub}</div>
              </OBCard>
            ))}
          </div>
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </div>
  );
}

function AccountStep({ data, update, onNext, onBack, onSkip }) {
  const firms = ['Apex', 'Topstep', 'FTMO', 'MyFundedFutures', 'Take Profit Trader', 'Personal'];
  const types = [
    { key: 'eval', label: 'Evaluation', desc: 'Actively passing a challenge', icon: Icon.layers },
    { key: 'funded', label: 'Funded', desc: 'Live funded / PA account', icon: Icon.shield },
    { key: 'personal', label: 'Personal', desc: 'Your own capital', icon: Icon.chart },
  ];
  const sizes = [25000, 50000, 100000, 150000, 250000];
  return (
    <div className="ts-ob-step">
      <StepHeader kicker="Step 04 · Account" title="Add your first trading account" subtitle="You can't log trades without one. Takes 10 seconds — or skip and add it later from the Accounts tab." />
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <OBLabel hint="Required to save">Firm name</OBLabel>
          <OBTextInput value={data.firm} onChange={(v) => update({ firm: v })} placeholder="e.g. Apex, Topstep, FTMO, Personal" autoFocus />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
            {firms.map((f) => (
              <button key={f} type="button" onClick={() => update({ firm: f })} style={{
                padding: '6px 10px', borderRadius: 999, fontFamily: 'inherit', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                border: `1px solid ${data.firm === f ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)'}`,
                background: data.firm === f ? 'rgba(34,211,238,0.08)' : 'transparent',
                color: data.firm === f ? '#22d3ee' : 'rgba(255,255,255,0.55)', transition: 'all 160ms',
              }}>{f}</button>
            ))}
          </div>
        </div>
        <div style={{ marginBottom: 24 }}>
          <OBLabel>Account type</OBLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            {types.map((t) => (
              <OBCard key={t.key} active={data.accountType === t.key} onClick={() => update({ accountType: t.key })}>
                <div style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', background: data.accountType === t.key ? 'rgba(34,211,238,0.15)' : 'rgba(255,255,255,0.04)', color: data.accountType === t.key ? '#22d3ee' : 'rgba(255,255,255,0.5)' }}>{t.icon}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#fff', marginTop: 2 }}>{t.label}</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.4 }}>{t.desc}</div>
              </OBCard>
            ))}
          </div>
        </div>
        <div>
          <OBLabel hint="Optional">Account size</OBLabel>
          <OBTextInput value={data.size} onChange={(v) => update({ size: v.replace(/[^\d]/g, '') })} placeholder="100000" prefix="$" suffix="USD" type="text" />
          <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
            {sizes.map((s) => (
              <button key={s} type="button" onClick={() => update({ size: String(s) })} style={{
                padding: '6px 10px', borderRadius: 999, fontFamily: 'inherit', cursor: 'pointer', fontSize: 11, fontWeight: 600, fontVariantNumeric: 'tabular-nums',
                border: `1px solid ${data.size === String(s) ? 'rgba(34,211,238,0.4)' : 'rgba(255,255,255,0.06)'}`,
                background: data.size === String(s) ? 'rgba(34,211,238,0.08)' : 'transparent',
                color: data.size === String(s) ? '#22d3ee' : 'rgba(255,255,255,0.55)',
              }}>${s / 1000}K</button>
            ))}
          </div>
        </div>
        <div style={{ marginTop: 22, padding: '12px 14px', borderRadius: 10, background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.15)', display: 'flex', gap: 12, alignItems: 'flex-start', fontSize: 12, color: 'rgba(255,255,255,0.65)', lineHeight: 1.5 }}>
          <span style={{ color: '#22d3ee', marginTop: 1 }}>{Icon.spark}</span>
          <div><b style={{ color: '#fff' }}>You can add more accounts anytime.</b> TradeSharp tracks each account's P&L, drawdown, and progress separately.</div>
        </div>
      </div>
      <StepFooter onBack={onBack} onNext={onNext} onSkip={onSkip} />
    </div>
  );
}

function PricingStep({ onSelectPlan, onBack, onSkip, busyPlan }) {
  return (
    <div className="ts-ob-step">
      <StepHeader
        kicker="Step 05 · Plan"
        title="Pick the plan that fits your trajectory"
        subtitle="Start with 30 days free — no charge today, cancel anytime. Or jump straight in and decide later from settings."
      />
      <div style={{ maxWidth: 980, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
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
          loading={busyPlan === 'trial_monthly'}
          onSelect={() => onSelectPlan('trial_monthly')}
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
          loading={busyPlan === 'monthly'}
          onSelect={() => onSelectPlan('monthly')}
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
          loading={busyPlan === 'annual'}
          onSelect={() => onSelectPlan('annual')}
        />
      </div>
      <div style={{ marginTop: 16, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>
        Secure payment via Stripe. Manage or cancel anytime from your account settings.
      </div>
      <StepFooter onBack={onBack} onNext={onSkip} onSkip={null} nextLabel="Decide later" />
    </div>
  );
}

function LiftoffStep({ data, onGo, saving }) {
  const [launched, setLaunched] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLaunched(true), 200); return () => clearTimeout(t); }, []);

  const summary = [
    data.name && { label: 'Trader', value: data.name },
    data.exp && { label: 'Experience', value: ({ under_1yr: 'Under 1 year', '1_3yrs': '1–3 years', '3plus_yrs': '3+ years', professional: 'Professional' })[data.exp] },
    data.method && { label: 'Method', value: ({ ict: 'ICT / SMC', priceaction: 'Price Action', supply: 'Supply & Demand', technical: 'Indicator-based', scalp: 'Scalping', still: 'Exploring' })[data.method] },
    data.session && { label: 'Session', value: ({ ny: 'New York', london: 'London', asian: 'Asian', all: 'All sessions' })[data.session] },
    data.target && { label: 'Target', value: `$${data.target.toLocaleString()} / mo` },
    data.firm && { label: 'Account', value: `${data.firm}${data.size ? ` · $${Number(data.size).toLocaleString()}` : ''}` },
  ].filter(Boolean);

  const destinations = [
    { key: 'journal', icon: Icon.pencil, label: 'Log your first trade', desc: 'Open the Journal and the A+ checklist', primary: true },
    { key: 'roadmap', icon: Icon.map, label: 'See the roadmap', desc: 'Tour the 5-stage progression' },
    { key: 'dashboard', icon: Icon.chart, label: 'Go to dashboard', desc: 'Overview, stats, and AI summary' },
  ];

  return (
    <div className="ts-ob-step" style={{ textAlign: 'center', position: 'relative' }}>
      <div style={{ position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)', width: 240, height: 240, borderRadius: '50%', background: 'radial-gradient(circle, rgba(34,211,238,0.35), transparent 65%)', animation: launched ? 'tsObBurst 1.2s cubic-bezier(.2,.8,.2,1)' : 'none', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', display: 'inline-block', marginBottom: 22 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(34,211,238,0.35), rgba(34,211,238,0.05))', border: '1px solid rgba(34,211,238,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#22d3ee', boxShadow: '0 0 60px rgba(34,211,238,0.4)', animation: 'tsObPulse 2.4s ease-in-out infinite' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
      </div>
      <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', color: '#22d3ee', marginBottom: 12 }}>Setup complete</div>
      <h1 style={{ fontSize: 46, fontWeight: 800, letterSpacing: '-0.035em', margin: 0, color: '#fff', lineHeight: 1.05 }}>
        You're cleared for<br/>
        <span style={{ background: 'linear-gradient(90deg, #22d3ee 0%, #a78bfa 100%)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent' }}>liftoff, {data.name || 'Trader'}.</span>
      </h1>
      <p style={{ marginTop: 16, fontSize: 15, color: 'rgba(255,255,255,0.55)', maxWidth: 480, margin: '16px auto 0', lineHeight: 1.55 }}>
        Your roadmap, checklist, and journal are tuned to your style. Where do you want to start?
      </p>
      {summary.length > 0 && (
        <div style={{ marginTop: 28, display: 'inline-flex', flexWrap: 'wrap', gap: 8, padding: '10px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 999, justifyContent: 'center' }}>
          {summary.map((s, i) => (
            <span key={i} style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <span style={{ color: 'rgba(255,255,255,0.15)' }}>·</span>}
              <span style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}: </span>
              <b style={{ color: '#fff', fontWeight: 600 }}>{s.value}</b>
            </span>
          ))}
        </div>
      )}
      <div style={{ marginTop: 32, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, maxWidth: 620, margin: '32px auto 0' }}>
        {destinations.map((d, i) => (
          <button key={d.key} type="button" onClick={() => !saving && onGo(d.key)} disabled={saving} style={{
            padding: 18, borderRadius: 12, color: '#fff', cursor: saving ? 'not-allowed' : 'pointer', textAlign: 'left', fontFamily: 'inherit',
            display: 'flex', flexDirection: 'column', gap: 6,
            border: `1px solid ${d.primary ? 'rgba(34,211,238,0.55)' : 'rgba(255,255,255,0.08)'}`,
            background: d.primary ? 'linear-gradient(180deg, rgba(34,211,238,0.18), rgba(34,211,238,0.05))' : 'rgba(255,255,255,0.02)',
            animation: `tsObFadeInUp 600ms cubic-bezier(.2,.8,.2,1) ${300 + i * 100}ms both`,
            boxShadow: d.primary ? '0 14px 40px -10px rgba(34,211,238,0.35)' : 'none',
            transition: 'all 220ms', opacity: saving ? 0.6 : 1,
          }}>
            <div style={{ color: d.primary ? '#22d3ee' : 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {d.icon}
              {d.primary && <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#22d3ee', padding: '2px 6px', borderRadius: 4, border: '1px solid rgba(34,211,238,0.3)' }}>Recommended</span>}
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>{d.label}</div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', lineHeight: 1.45 }}>{d.desc}</div>
          </button>
        ))}
      </div>
      {saving && <div style={{ marginTop: 20, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Saving your setup…</div>}
    </div>
  );
}

// ─── GLOBAL STYLES ────────────────────────────────────────────────────────────
const OB_STYLES = `
  .ts-ob-btn-primary {
    display: inline-flex; align-items: center; gap: 10px;
    padding: 12px 20px; border-radius: 10px; border: none;
    background: linear-gradient(180deg, #22d3ee 0%, #06b6d4 100%);
    color: #051015; font-family: inherit; font-size: 13px; font-weight: 700;
    letter-spacing: -0.005em; cursor: pointer;
    box-shadow: 0 10px 30px -8px rgba(34,211,238,0.55), 0 0 0 1px rgba(34,211,238,0.3), inset 0 1px 0 rgba(255,255,255,0.3);
    transition: all 180ms cubic-bezier(.2,.8,.2,1);
  }
  .ts-ob-btn-primary:hover { transform: translateY(-1px); box-shadow: 0 14px 40px -8px rgba(34,211,238,0.7), 0 0 0 1px rgba(34,211,238,0.4), inset 0 1px 0 rgba(255,255,255,0.35); }
  .ts-ob-btn-ghost {
    display: inline-flex; align-items: center; gap: 8px; padding: 10px 14px; border-radius: 10px;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.08);
    color: rgba(255,255,255,0.7); font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; transition: all 160ms;
  }
  .ts-ob-btn-ghost:hover { background: rgba(255,255,255,0.06); color: #fff; border-color: rgba(255,255,255,0.15); }
  .ts-ob-btn-skip { background: transparent; border: none; color: rgba(255,255,255,0.4); font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; padding: 10px 12px; border-radius: 8px; transition: all 160ms; }
  .ts-ob-btn-skip:hover { color: rgba(255,255,255,0.75); background: rgba(255,255,255,0.04); }
  .ts-ob-pill:hover { border-color: rgba(34,211,238,0.3) !important; background: rgba(255,255,255,0.04) !important; color: #fff !important; }
  .ts-ob-card:hover { border-color: rgba(34,211,238,0.3) !important; background: rgba(255,255,255,0.04) !important; }
  .ts-ob-target:hover { border-color: rgba(34,211,238,0.3) !important; background: rgba(255,255,255,0.04) !important; }
  .ts-ob-step { animation: tsObStepIn 480ms cubic-bezier(.2,.8,.2,1) forwards; }
  @media (max-width: 900px) { .ts-ob-rail-label { display: none; } }
  @keyframes tsObStepIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes tsObFadeInUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
  @keyframes tsObPulse { 0%, 100% { transform: scale(1); opacity: 0.8; } 50% { transform: scale(1.06); opacity: 1; } }
  @keyframes tsObFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
  @keyframes tsObTwinkle { 0%, 100% { opacity: 0; transform: scale(0.6); } 50% { opacity: 0.8; transform: scale(1); } }
  @keyframes tsObBurst { 0% { transform: translateX(-50%) scale(0.3); opacity: 1; } 100% { transform: translateX(-50%) scale(2.2); opacity: 0; } }
`;

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────
export default function OnboardingFlow({ user, supabase, setViewAndPersist, setUserPrefs, setProfile, onComplete }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    name: '', exp: '', instruments: ['futures'], method: 'ict',
    session: 'ny', target: 10000, timeline: '12mo', risk: 'balanced',
    firm: '', accountType: 'eval', size: '',
  });
  const [saving, setSaving] = useState(false);
  const [busyPlan, setBusyPlan] = useState(null);
  const { subscribe } = useSubscription(user);

  const update = (patch) => setData(d => ({ ...d, ...patch }));

  const steps = [
    { key: 'welcome', label: 'Welcome' },
    { key: 'profile', label: 'Profile' },
    { key: 'style', label: 'Style' },
    { key: 'goals', label: 'Goals' },
    { key: 'account', label: 'Account' },
    { key: 'pricing', label: 'Plan' },
    { key: 'liftoff', label: 'Liftoff' },
  ];

  const next = () => setStep(s => Math.min(s + 1, steps.length - 1));
  const back = () => setStep(s => Math.max(s - 1, 0));
  const jumpTo = (i) => setStep(i);
  const skipAll = () => setStep(steps.length - 1);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Enter' && !e.shiftKey && e.target.tagName !== 'TEXTAREA' && e.target.tagName !== 'INPUT') {
        const currentKey = steps[step].key;
        if (currentKey === 'profile' && !data.name.trim()) return;
        if (step < steps.length - 1) next();
      }
      if (e.key === 'Escape') skipAll();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [step, data, steps]);

  const persistOnboarding = async (markComplete) => {
    if (data.name.trim()) {
      await supabase.from('profiles').upsert({
        id: user.id,
        display_name: data.name.trim(),
        has_seen_pricing: true,
        updated_at: new Date().toISOString(),
      });
      setProfile(p => ({ ...p, display_name: data.name.trim() }));
    } else {
      await supabase.from('profiles').update({
        has_seen_pricing: true,
        updated_at: new Date().toISOString(),
      }).eq('id', user.id);
    }

    const prefUpdates = {};
    if (data.exp) prefUpdates.experience_level = data.exp;
    if (data.session) prefUpdates.primary_session = data.session;
    if (data.method) prefUpdates.trading_style = data.method;
    if (data.instruments?.length) prefUpdates.instruments = data.instruments;
    if (data.risk) prefUpdates.risk_appetite = data.risk;
    if (data.target) prefUpdates.goal_target = data.target;
    if (data.timeline) prefUpdates.goal_timeline = data.timeline;

    // Calculate dollar default_risk from risk % × account size (needs both)
    const riskPctMap = { conservative: 0.0025, balanced: 0.005, aggressive: 0.01 };
    const accountSize = data.size ? parseFloat(data.size) : 0;
    if (data.risk && accountSize > 0) {
      prefUpdates.default_risk = Math.round(accountSize * riskPctMap[data.risk]);
    }

    const { data: updatedPrefs } = await supabase.from('user_preferences')
      .upsert({ user_id: user.id, ...prefUpdates, onboarding_complete: markComplete, updated_at: new Date().toISOString() }, { onConflict: 'user_id' })
      .select().single();
    setUserPrefs(p => ({ ...(p ?? {}), ...(updatedPrefs ?? {}), onboarding_complete: markComplete }));

    if (data.firm.trim()) {
      await supabase.from('accounts').insert({
        user_id: user.id, firm: data.firm.trim(), account_name: data.firm.trim(),
        account_type: data.accountType || 'eval',
        account_size: accountSize || null,
        status: 'active',
      });
    }
  };

  const saveAndClose = async (dest, markComplete = true) => {
    setSaving(true);
    try {
      await persistOnboarding(markComplete);
    } catch (e) {
      console.error('Onboarding save error:', e);
    }
    setSaving(false);
    if (onComplete) onComplete();
    const viewMap = { journal: 'journal', roadmap: 'roadmap', dashboard: 'map' };
    setViewAndPersist(viewMap[dest] || 'map');
  };

  const handleSelectPlan = async (plan) => {
    if (busyPlan) return;
    setBusyPlan(plan);
    try {
      await persistOnboarding(true);
    } catch (e) {
      console.error('Onboarding save before checkout error:', e);
    }
    try {
      await subscribe(plan);
    } finally {
      setBusyPlan(null);
    }
  };

  const handleGo = (dest) => saveAndClose(dest, true);
  const handleSkip = () => saveAndClose('dashboard', true);

  const currentKey = steps[step].key;
  const showRail = step > 0 && step < steps.length - 1;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500, overflow: 'hidden',
      fontFamily: '"Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      color: '#fff',
    }}>
      <style>{OB_STYLES}</style>
      <OnboardingBackdrop step={step} totalSteps={steps.length} />

      {/* Top bar */}
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, padding: '22px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', zIndex: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <TradeSharpLogo size={28} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, letterSpacing: '-0.01em', color: '#fff' }}>TradeSharp</div>
            <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)' }}>Onboarding</div>
          </div>
        </div>
        {showRail && <ProgressRail step={step} steps={steps} onJump={jumpTo} />}
        <button type="button" onClick={handleSkip} className="ts-ob-btn-ghost" style={{ fontSize: 12 }}>
          <span>Skip setup</span>{Icon.x}
        </button>
      </div>

      {/* Step container */}
      <div style={{ position: 'absolute', inset: 0, padding: '100px 32px 32px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: currentKey === 'welcome' ? 820 : currentKey === 'pricing' ? 1040 : 780, position: 'relative' }}>
          {currentKey === 'welcome' && <WelcomeStep data={data} onNext={next} onSkip={handleSkip} />}
          {currentKey === 'profile' && <ProfileStep data={data} update={update} onNext={next} onBack={back} onSkip={next} />}
          {currentKey === 'style' && <StyleStep data={data} update={update} onNext={next} onBack={back} onSkip={next} />}
          {currentKey === 'goals' && <GoalsStep data={data} update={update} onNext={next} onBack={back} onSkip={next} />}
          {currentKey === 'account' && <AccountStep data={data} update={update} onNext={next} onBack={back} onSkip={next} />}
          {currentKey === 'pricing' && <PricingStep onSelectPlan={handleSelectPlan} onBack={back} onSkip={next} busyPlan={busyPlan} />}
          {currentKey === 'liftoff' && <LiftoffStep data={data} onGo={handleGo} saving={saving} />}
        </div>
      </div>

      {/* Footer hint */}
      <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.05em', pointerEvents: 'none' }}>
        Press <kbd style={{ display: 'inline-block', padding: '1px 6px', margin: '0 4px', fontFamily: 'monospace', fontSize: 9, fontWeight: 600, color: 'rgba(255,255,255,0.55)', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4 }}>Esc</kbd> to skip setup
      </div>
    </div>
  );
}

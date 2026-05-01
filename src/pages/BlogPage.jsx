import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead.jsx'
import { getPublishedPosts, getAllTags } from '../lib/blog.js'

function TradeSharpLogo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
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
  )
}

function formatDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function PostCard({ post, index }) {
  const accent = post.accent || '#22d3ee'
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.06 * index, ease: [0.22, 1, 0.36, 1] }}
    >
      <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', height: '100%' }}>
        <article
          style={{
            height: '100%', display: 'flex', flexDirection: 'column',
            background: 'rgba(255,255,255,0.025)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderLeft: `3px solid ${accent}`,
            borderRadius: 12,
            padding: '22px 22px 20px',
            transition: 'all 0.2s ease',
            cursor: 'pointer',
            boxSizing: 'border-box',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
            e.currentTarget.style.borderColor = `rgba(255,255,255,0.12)`
            e.currentTarget.style.borderLeftColor = accent
            e.currentTarget.style.transform = 'translateY(-2px)'
            e.currentTarget.style.boxShadow = `0 8px 32px rgba(0,0,0,0.2), 0 0 0 1px ${accent}15`
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
            e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'
            e.currentTarget.style.borderLeftColor = accent
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {/* Top meta */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{
              fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: accent, background: `${accent}12`, border: `1px solid ${accent}25`,
              padding: '3px 9px', borderRadius: 4,
            }}>
              {post.category || (post.tags?.[0]) || 'Article'}
            </span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              {formatDate(post.publishedAt || post.published_at)}
            </span>
          </div>

          {/* Title */}
          <h2 style={{
            fontSize: 19, fontWeight: 500, lineHeight: 1.25, letterSpacing: '-0.02em',
            color: '#eaebf0', margin: '0 0 10px', flex: 0,
          }}>
            {post.title}
          </h2>

          {/* Excerpt */}
          <p style={{
            fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65,
            margin: '0 0 18px', flex: 1,
          }}>
            {post.description || post.excerpt}
          </p>

          {/* Footer */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(post.tags || []).slice(0, 2).map(tag => (
                <span key={tag} style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  #{tag}
                </span>
              ))}
            </div>
            <span style={{ fontSize: 12.5, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
              {post.readTime || (post.reading_time ? `${post.reading_time} min read` : '5 min read')}
            </span>
          </div>
        </article>
      </Link>
    </motion.div>
  )
}

function FeaturedCard({ post }) {
  const accent = post.accent || '#22d3ee'
  return (
    <Link to={`/blog/${post.slug}`} style={{ textDecoration: 'none', display: 'block', marginBottom: 32 }}>
      <motion.article
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{
          background: 'rgba(255,255,255,0.025)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderLeft: `4px solid ${accent}`,
          borderRadius: 14,
          padding: '28px 32px',
          display: 'grid',
          gridTemplateColumns: '1fr auto',
          gap: '24px 48px',
          alignItems: 'center',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative',
          overflow: 'hidden',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.035)'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = `0 12px 40px rgba(0,0,0,0.25), 0 0 0 1px ${accent}15`
        }}
        onMouseLeave={e => {
          e.currentTarget.style.background = 'rgba(255,255,255,0.025)'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = 'none'
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: 'absolute', top: -60, right: -60, width: 200, height: 200,
          borderRadius: '50%', background: `radial-gradient(circle, ${accent}14 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{ position: 'relative' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase',
              color: '#22d3ee', background: 'rgba(34,211,238,0.1)', border: '1px solid rgba(34,211,238,0.22)',
              padding: '3px 9px', borderRadius: 4,
            }}>Featured</span>
            <span style={{
              fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: accent, background: `${accent}12`, border: `1px solid ${accent}25`,
              padding: '3px 9px', borderRadius: 4,
            }}>
              {post.category || post.tags?.[0] || 'Article'}
            </span>
            <span style={{ fontSize: 11.5, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
              {formatDate(post.publishedAt || post.published_at)}
            </span>
          </div>
          <h2 style={{
            fontSize: 26, fontWeight: 500, lineHeight: 1.2, letterSpacing: '-0.03em',
            color: '#eaebf0', margin: '0 0 10px',
          }}>
            {post.title}
          </h2>
          <p style={{ fontSize: 14.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, margin: 0, maxWidth: 640 }}>
            {post.description || post.excerpt}
          </p>
        </div>

        <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
            {post.readTime || (post.reading_time ? `${post.reading_time} min read` : '5 min read')}
          </div>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            fontSize: 13, fontWeight: 600, color: accent,
            padding: '8px 16px', borderRadius: 7,
            background: `${accent}10`, border: `1px solid ${accent}25`,
            whiteSpace: 'nowrap',
          }}>
            Read Post
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
            </svg>
          </div>
        </div>
      </motion.article>
    </Link>
  )
}

export default function BlogPage() {
  const navigate = useNavigate()
  const [posts, setPosts] = useState([])
  const [allTags, setAllTags] = useState([])
  const [activeTag, setActiveTag] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllTags().then(setAllTags)
  }, [])

  useEffect(() => {
    setLoading(true)
    getPublishedPosts({ tag: activeTag }).then(data => {
      setPosts(data)
      setLoading(false)
    })
  }, [activeTag])

  const featured = posts.find(p => p.featured)
  const rest = posts.filter(p => !p.featured || activeTag)

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d13', color: '#eaebf0', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>
      <SEOHead
        title="Blog — Futures Trading Insights"
        description="Expert guides on ICT concepts, prop firm evaluations, funded trading, trade journaling, and building consistency as a futures trader."
        canonical="/blog"
      />
      <style>{`
        @keyframes blogFadeIn { from { opacity: 0; } to { opacity: 1; } }
        .blog-nav-links { display: flex; }
        .blog-ctas { display: flex; }
        @media (max-width: 900px) {
          .blog-nav-links, .blog-ctas { display: none !important; }
          .blog-featured-card { grid-template-columns: 1fr !important; }
          .blog-featured-card > div:last-child { display: none !important; }
          .blog-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 680px) {
          .blog-hero-title { font-size: 36px !important; }
          .blog-section { padding: 0 20px 72px !important; }
          .blog-hero-section { padding: 104px 20px 40px !important; }
        }
      `}</style>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-8%', left: '-6%', width: 480, height: 480, borderRadius: '50%', background: 'radial-gradient(circle, rgba(8,145,178,0.1) 0%, transparent 70%)', filter: 'blur(48px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-8%', width: 420, height: 420, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)', filter: 'blur(56px)' }} />
      </div>

      {/* Nav */}
      <motion.nav
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 50,
          background: 'rgba(11,13,19,0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '0 32px',
          height: 70,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}
      >
        <div onClick={() => navigate('/')} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}>
          <TradeSharpLogo size={34} />
          <span style={{ fontSize: 18, fontWeight: 600, letterSpacing: '-0.02em', color: '#eaebf0' }}>
            Trade<span style={{ color: '#22d3ee' }}>Sharp</span>
          </span>
        </div>

        <div className="blog-nav-links" style={{ alignItems: 'center', gap: 32 }}>
          {[
            { label: 'Features', href: '/#features' },
            { label: 'The Path', href: '/#the-path' },
            { label: 'Score', href: '/#score' },
            { label: 'Blog', href: '/blog' },
          ].map((link) => (
            <a key={link.label} href={link.href} style={{
              fontSize: 15, fontWeight: 500, color: '#a0a3b5',
              textDecoration: 'none', letterSpacing: '0.01em',
              transition: 'color 0.2s',
            }}
              onMouseEnter={e => e.target.style.color = '#eaebf0'}
              onMouseLeave={e => e.target.style.color = '#a0a3b5'}
            >{link.label}</a>
          ))}
        </div>

        <div className="blog-ctas" style={{ alignItems: 'center', gap: 12 }}>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 22px', borderRadius: 7,
            background: 'transparent', border: '1px solid rgba(255,255,255,0.14)',
            color: '#a0a3b5', fontSize: 15, fontWeight: 500, cursor: 'pointer',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(34,211,238,0.3)'; e.currentTarget.style.color = '#eaebf0' }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = '#a0a3b5' }}
          >Sign In</button>
          <button onClick={() => navigate('/login')} style={{
            padding: '9px 22px', borderRadius: 7,
            background: 'linear-gradient(135deg, #0891b2, #22d3ee)',
            border: 'none', color: '#0b0d13', fontSize: 15, fontWeight: 600,
            cursor: 'pointer', letterSpacing: '0.01em',
            boxShadow: '0 0 20px rgba(34,211,238,0.2)',
            transition: 'all 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.boxShadow = '0 0 28px rgba(34,211,238,0.35)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow = '0 0 20px rgba(34,211,238,0.2)'}
          >Start Journaling →</button>
        </div>
      </motion.nav>

      <main style={{ position: 'relative', zIndex: 1 }}>
        {/* Hero */}
        <section className="blog-hero-section" style={{ padding: '112px 48px 48px', maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 20,
              padding: '5px 14px', borderRadius: 20,
              background: 'rgba(34,211,238,0.08)', border: '1px solid rgba(34,211,238,0.18)',
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#22d3ee', boxShadow: '0 0 8px rgba(34,211,238,0.7)' }} />
              <span style={{ fontSize: 10, fontWeight: 600, color: '#22d3ee', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                TradeSharp Blog
              </span>
            </div>
            <h1 className="blog-hero-title" style={{
              fontSize: 52, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1.05,
              margin: '0 0 16px', color: '#eaebf0', maxWidth: 700,
            }}>
              The trading journal for<br />
              <span style={{ color: '#22d3ee' }}>serious futures traders.</span>
            </h1>
            <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0, maxWidth: 520 }}>
              Process notes, execution frameworks, and review loops for traders building consistency.
            </p>
          </motion.div>
        </section>

        {/* Tag filter + content */}
        <section className="blog-section" style={{ padding: '0 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
          {/* Tag pills */}
          {allTags.length > 0 && (
            <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
              <button
                onClick={() => setActiveTag(null)}
                style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                  border: activeTag === null ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  background: activeTag === null ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                  color: activeTag === null ? '#22d3ee' : 'rgba(255,255,255,0.45)',
                }}
              >All</button>
              {allTags.map(tag => (
                <button key={tag} onClick={() => setActiveTag(activeTag === tag ? null : tag)} style={{
                  fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 14px', borderRadius: 6, cursor: 'pointer', transition: 'all 0.15s',
                  border: activeTag === tag ? '1px solid rgba(34,211,238,0.4)' : '1px solid rgba(255,255,255,0.1)',
                  background: activeTag === tag ? 'rgba(34,211,238,0.1)' : 'rgba(255,255,255,0.03)',
                  color: activeTag === tag ? '#22d3ee' : 'rgba(255,255,255,0.45)',
                }}>
                  {tag}
                </button>
              ))}
            </div>
          )}

          {loading ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{
                  height: 240, borderRadius: 12, background: 'rgba(255,255,255,0.025)',
                  border: '1px solid rgba(255,255,255,0.07)', borderLeft: '3px solid rgba(255,255,255,0.07)',
                  animation: 'blogFadeIn 1s ease infinite alternate',
                }} />
              ))}
            </div>
          ) : posts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'rgba(255,255,255,0.3)', fontSize: 14 }}>
              No posts found.
            </div>
          ) : (
            <>
              {featured && !activeTag && <FeaturedCard post={featured} />}
              <div className="blog-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {(activeTag ? posts : rest).map((post, i) => (
                  <PostCard key={post.slug} post={post} index={i} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '28px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TradeSharpLogo size={22} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>TradeSharp</span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }].map(l => (
            <Link key={l.to} to={l.to} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: 500,
              transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
            >{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}

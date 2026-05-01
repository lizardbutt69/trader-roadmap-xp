import { useState, useEffect } from 'react'
import { Link, useParams, Navigate, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import SEOHead from '../components/SEOHead.jsx'
import { getPostBySlug, getRelatedPosts } from '../lib/blog.js'

const DOMAIN = 'https://tradesharp.xyz'

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
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function ArticleBody({ post }) {
  // Supports both structured-JSON (sections) and plain markdown (content string)
  if (post.sections) {
    return (
      <>
        {post.sections.map((section, i) => (
          <section key={i} style={{ marginBottom: 36 }}>
            <h2 style={{
              fontSize: 22, fontWeight: 500, letterSpacing: '-0.025em', lineHeight: 1.2,
              color: '#eaebf0', margin: '0 0 14px',
            }}>
              {section.heading}
            </h2>
            {section.paragraphs?.map((p, j) => (
              <p key={j} style={{
                fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.8,
                margin: '0 0 16px', fontWeight: 400,
              }}>
                {p}
              </p>
            ))}
            {section.bullets?.length > 0 && (
              <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none' }}>
                {section.bullets.map((bullet, k) => (
                  <li key={k} style={{
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                    fontSize: 15.5, color: 'rgba(255,255,255,0.58)', lineHeight: 1.7,
                    marginBottom: 10, padding: '10px 14px',
                    background: 'rgba(255,255,255,0.025)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 8,
                  }}>
                    <span style={{ color: '#22d3ee', flexShrink: 0, marginTop: 2, fontSize: 12 }}>▸</span>
                    {bullet}
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </>
    )
  }

  // Fallback for plain text content field
  return (
    <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.62)', lineHeight: 1.8 }}>
      {post.content || post.excerpt}
    </p>
  )
}

export default function BlogPostPage() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const [post, setPost] = useState(null)
  const [related, setRelated] = useState([])
  const [notFound, setNotFound] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    setNotFound(false)
    getPostBySlug(slug)
      .then(data => {
        setPost(data)
        return getRelatedPosts(slug, data.tags || [])
      })
      .then(setRelated)
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [slug])

  if (notFound) return <Navigate to="/blog" replace />

  const accent = post?.accent || '#22d3ee'

  const jsonLd = post ? {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: post.title,
    description: post.meta_description || post.description || post.excerpt,
    datePublished: post.publishedAt || post.published_at,
    dateModified: post.updated_at || post.publishedAt || post.published_at,
    author: { '@type': 'Person', name: post.author_name || 'TradeSharp Team' },
    publisher: {
      '@type': 'Organization', name: 'TradeSharp',
      logo: { '@type': 'ImageObject', url: `${DOMAIN}/favicon.svg` },
    },
    mainEntityOfPage: { '@type': 'WebPage', '@id': `${DOMAIN}/blog/${slug}` },
  } : null

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d13', color: '#eaebf0', fontFamily: "'Plus Jakarta Sans', sans-serif", overflowX: 'hidden' }}>
      {post && (
        <SEOHead
          title={post.title}
          description={post.meta_description || post.description || post.excerpt}
          canonical={`/blog/${post.slug}`}
          ogImage={post.og_image_url || undefined}
          ogType="article"
          jsonLd={jsonLd}
        />
      )}
      <style>{`
        @media (max-width: 900px) {
          .post-nav-links, .post-nav-ctas { display: none !important; }
          .post-layout { grid-template-columns: 1fr !important; }
          .post-sidebar { display: none !important; }
        }
        @media (max-width: 680px) {
          .post-hero { padding: 104px 20px 32px !important; }
          .post-body-section { padding: 0 20px 64px !important; }
          .post-h1 { font-size: 34px !important; }
        }
      `}</style>

      {/* Ambient */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div style={{ position: 'absolute', top: '-10%', right: '-8%', width: 440, height: 440, borderRadius: '50%', background: `radial-gradient(circle, ${accent}0d 0%, transparent 70%)`, filter: 'blur(52px)' }} />
        <div style={{ position: 'absolute', bottom: '5%', left: '-6%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)', filter: 'blur(60px)' }} />
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

        <div className="post-nav-links" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
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

        <div className="post-nav-ctas" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
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

      {loading ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <div style={{ width: 32, height: 32, border: '3px solid rgba(34,211,238,0.15)', borderTopColor: '#22d3ee', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : post && (
        <main style={{ position: 'relative', zIndex: 1 }}>
          {/* Hero header */}
          <header className="post-hero" style={{ padding: '112px 48px 36px', maxWidth: 1100, margin: '0 auto' }}>
            {/* Breadcrumb */}
            <nav aria-label="Breadcrumb" style={{ marginBottom: 28 }}>
              <ol style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>
                <li><Link to="/" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                >Home</Link></li>
                <li style={{ opacity: 0.3 }}>›</li>
                <li><Link to="/blog" style={{ color: 'rgba(255,255,255,0.3)', textDecoration: 'none', transition: 'color 0.15s' }}
                  onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
                  onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
                >Blog</Link></li>
                <li style={{ opacity: 0.3 }}>›</li>
                <li style={{ color: 'rgba(255,255,255,0.5)', maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {post.title}
                </li>
              </ol>
            </nav>

            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              {/* Meta row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
                <span style={{
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: accent, background: `${accent}12`, border: `1px solid ${accent}25`,
                  padding: '4px 10px', borderRadius: 5,
                }}>
                  {post.category || post.tags?.[0] || 'Article'}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  {formatDate(post.publishedAt || post.published_at)}
                </span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>·</span>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', fontWeight: 500 }}>
                  {post.readTime || (post.reading_time ? `${post.reading_time} min read` : '5 min read')}
                </span>
              </div>

              {/* H1 */}
              <h1 className="post-h1" style={{
                fontSize: 48, fontWeight: 500, letterSpacing: '-0.04em', lineHeight: 1.08,
                color: '#eaebf0', margin: '0 0 16px', maxWidth: 820,
              }}>
                {post.title}
              </h1>

              {/* Lead */}
              <p style={{
                fontSize: 17, color: 'rgba(255,255,255,0.5)', lineHeight: 1.7,
                margin: '0 0 0', maxWidth: 680,
              }}>
                {post.description || post.excerpt}
              </p>
            </motion.div>
          </header>

          {/* Divider */}
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 48px' }}>
            <div style={{ borderTop: `1px solid ${accent}25`, marginBottom: 40 }} />
          </div>

          {/* Article + sidebar */}
          <section className="post-body-section" style={{ padding: '0 48px 80px', maxWidth: 1100, margin: '0 auto' }}>
            <div className="post-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 680px) minmax(240px, 300px)', gap: 40, alignItems: 'start' }}>

              {/* Article body */}
              <motion.article
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderTop: `3px solid ${accent}`,
                  borderRadius: 12,
                  padding: '32px 32px',
                }}
              >
                <ArticleBody post={post} />
              </motion.article>

              {/* Sidebar */}
              <aside className="post-sidebar" style={{ display: 'grid', gap: 14, position: 'sticky', top: 80 }}>
                {/* Tags */}
                <div style={{
                  padding: '18px 20px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                    Tags
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {(post.tags || []).map(tag => (
                      <span key={tag} style={{
                        fontSize: 11.5, fontWeight: 600, padding: '5px 10px', borderRadius: 20,
                        background: `${accent}10`, border: `1px solid ${accent}20`, color: accent,
                      }}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* CTA */}
                <div style={{
                  padding: '20px', borderRadius: 10,
                  background: 'rgba(34,211,238,0.04)', border: '1px solid rgba(34,211,238,0.14)',
                }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#eaebf0', marginBottom: 8, lineHeight: 1.4 }}>
                    Track every trade with TradeSharp
                  </div>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6, margin: '0 0 14px' }}>
                    Journal your trades, score your performance, and build consistency — free to start.
                  </p>
                  <button onClick={() => navigate('/login')} style={{
                    width: '100%', padding: '9px 0', borderRadius: 7,
                    background: 'linear-gradient(135deg, #0891b2, #22d3ee)',
                    border: 'none', color: '#0b0d13', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                  }}>
                    Start Journaling →
                  </button>
                </div>

                {/* Related posts */}
                {related.length > 0 && (
                  <div style={{
                    padding: '18px 20px', borderRadius: 10,
                    background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)',
                  }}>
                    <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
                      More to Read
                    </div>
                    <div style={{ display: 'grid', gap: 10 }}>
                      {related.map(rel => (
                        <Link key={rel.slug} to={`/blog/${rel.slug}`} style={{
                          textDecoration: 'none', display: 'block', padding: '12px 14px',
                          borderRadius: 8, background: 'rgba(255,255,255,0.02)',
                          border: '1px solid rgba(255,255,255,0.06)',
                          transition: 'all 0.15s',
                        }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)' }}
                        >
                          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: rel.accent || '#22d3ee', marginBottom: 6 }}>
                            {rel.category || rel.tags?.[0]}
                          </div>
                          <div style={{ fontSize: 13, fontWeight: 500, color: '#eaebf0', lineHeight: 1.3, marginBottom: 4 }}>
                            {rel.title}
                          </div>
                          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>
                            {rel.readTime || (rel.reading_time ? `${rel.reading_time} min` : '5 min')}
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </aside>
            </div>
          </section>
        </main>
      )}

      {/* Footer */}
      <footer style={{
        position: 'relative', zIndex: 1,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '24px 48px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12,
      }}>
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
          <TradeSharpLogo size={22} />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>TradeSharp</span>
        </Link>
        <div style={{ display: 'flex', gap: 24 }}>
          {[{ label: 'Privacy', to: '/privacy' }, { label: 'Terms', to: '/terms' }].map(l => (
            <Link key={l.to} to={l.to} style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', textDecoration: 'none', fontWeight: 500, transition: 'color 0.15s' }}
              onMouseEnter={e => e.target.style.color = 'rgba(255,255,255,0.6)'}
              onMouseLeave={e => e.target.style.color = 'rgba(255,255,255,0.3)'}
            >{l.label}</Link>
          ))}
        </div>
      </footer>
    </div>
  )
}

import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://tradesharp.xyz'
const DEFAULT_OG = `${SITE_URL}/og-default.png`

const SOCIAL_BOTS = [
  'twitterbot', 'facebookexternalhit', 'linkedinbot',
  'discordbot', 'slackbot', 'whatsapp', 'telegram',
]

function isSocialBot(ua = '') {
  const lower = ua.toLowerCase()
  return SOCIAL_BOTS.some(bot => lower.includes(bot))
}

function escape(str = '') {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export default async function handler(req, res) {
  const ua = req.headers['user-agent'] || ''
  const path = req.query.path || ''

  if (!isSocialBot(ua)) {
    res.redirect(302, `/${path}`)
    return
  }

  let title = 'TradeSharp Blog — Futures Trading Insights'
  let description = 'Expert guides on ICT concepts, prop firm evaluations, funded trading, and building consistency as a futures trader.'
  let image = DEFAULT_OG
  let url = `${SITE_URL}/blog`

  const slugMatch = path.match(/^blog\/(.+)$/)
  if (slugMatch) {
    try {
      const supabase = createClient(
        process.env.SUPABASE_URL,
        process.env.SUPABASE_SERVICE_KEY,
      )
      const { data: post } = await supabase
        .from('blog_posts')
        .select('title,meta_description,excerpt,og_image_url,slug')
        .eq('slug', slugMatch[1])
        .eq('status', 'published')
        .single()

      if (post) {
        title = `${post.title} — TradeSharp`
        description = post.meta_description || post.excerpt || description
        image = post.og_image_url || DEFAULT_OG
        url = `${SITE_URL}/blog/${post.slug}`
      }
    } catch { /* fallback to defaults */ }
  }

  const html = `<!doctype html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${escape(title)}</title>
  <meta name="description" content="${escape(description)}">
  <meta property="og:title" content="${escape(title)}">
  <meta property="og:description" content="${escape(description)}">
  <meta property="og:image" content="${escape(image)}">
  <meta property="og:url" content="${escape(url)}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${escape(title)}">
  <meta name="twitter:description" content="${escape(description)}">
  <meta name="twitter:image" content="${escape(image)}">
  <meta http-equiv="refresh" content="0;url=${escape(url)}">
</head>
<body></body>
</html>`

  res.setHeader('Content-Type', 'text/html')
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=3600')
  res.status(200).send(html)
}

import { createClient } from '@supabase/supabase-js'

const SITE_URL = 'https://tradesharp.xyz'

const STATIC_ROUTES = [
  { loc: '/', priority: '1.0', changefreq: 'weekly' },
  { loc: '/blog', priority: '0.9', changefreq: 'daily' },
]

export default async function handler(req, res) {
  let blogUrls = []

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_KEY,
    )
    const { data } = await supabase
      .from('blog_posts')
      .select('slug, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })

    blogUrls = (data || []).map(post => ({
      loc: `/blog/${post.slug}`,
      lastmod: new Date(post.updated_at).toISOString().split('T')[0],
      priority: '0.8',
      changefreq: 'monthly',
    }))
  } catch {
    // Supabase not configured yet — sitemap still works with static routes
  }

  const allUrls = [...STATIC_ROUTES, ...blogUrls]

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(url => `  <url>
    <loc>${SITE_URL}${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`

  res.setHeader('Content-Type', 'application/xml')
  res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400')
  res.status(200).send(xml)
}

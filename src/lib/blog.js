import { supabase } from '../supabase.js'
import { blogPosts } from '../data/blogPosts.js'

// Whether to use Supabase or static data
const USE_SUPABASE = false // flip to true once blog_posts table is migrated

export async function getPublishedPosts({ tag = null, limit = 20, offset = 0 } = {}) {
  if (!USE_SUPABASE) {
    let posts = [...blogPosts].sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
    if (tag) posts = posts.filter(p => p.tags?.map(t => t.toLowerCase()).includes(tag.toLowerCase()))
    return posts.slice(offset, offset + limit)
  }

  let query = supabase
    .from('blog_posts')
    .select('id,slug,title,subtitle,excerpt,og_image_url,tags,author_name,reading_time,published_at,featured,category,accent')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .order('published_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (tag) query = query.contains('tags', [tag])
  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getPostBySlug(slug) {
  if (!USE_SUPABASE) {
    const post = blogPosts.find(p => p.slug === slug)
    if (!post) throw new Error('Post not found')
    return post
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .single()

  if (error) throw error
  return data
}

export async function getRelatedPosts(currentSlug, tags = [], limit = 2) {
  if (!USE_SUPABASE) {
    return blogPosts
      .filter(p => p.slug !== currentSlug)
      .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
      .slice(0, limit)
  }

  const { data } = await supabase
    .from('blog_posts')
    .select('id,slug,title,subtitle,og_image_url,tags,reading_time,published_at,category,accent')
    .eq('status', 'published')
    .lte('published_at', new Date().toISOString())
    .neq('slug', currentSlug)
    .overlaps('tags', tags)
    .order('published_at', { ascending: false })
    .limit(limit)

  return data || []
}

export async function getAllTags() {
  if (!USE_SUPABASE) {
    return [...new Set(blogPosts.flatMap(p => p.tags || []))].sort()
  }

  const { data } = await supabase.from('blog_posts').select('tags').eq('status', 'published')
  if (!data) return []
  return [...new Set(data.flatMap(p => p.tags))].sort()
}

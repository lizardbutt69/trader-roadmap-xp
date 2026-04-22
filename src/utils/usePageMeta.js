import { useEffect } from 'react'

function upsertMeta(name, content, attr = 'name') {
  if (!content) return

  let tag = document.head.querySelector(`meta[${attr}="${name}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attr, name)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

export function usePageMeta({ title, description }) {
  useEffect(() => {
    const previousTitle = document.title

    if (title) document.title = title
    if (description) {
      upsertMeta('description', description)
      upsertMeta('og:description', description, 'property')
      upsertMeta('twitter:description', description, 'name')
    }
    if (title) {
      upsertMeta('og:title', title, 'property')
      upsertMeta('twitter:title', title, 'name')
    }

    return () => {
      document.title = previousTitle
    }
  }, [title, description])
}

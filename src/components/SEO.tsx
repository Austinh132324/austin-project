import { useEffect } from 'react'

interface SEOProps {
  title: string
  description?: string
}

export default function SEO({ title, description }: SEOProps) {
  useEffect(() => {
    const fullTitle = title === 'Home'
      ? 'Austin Howell | Software Engineer'
      : `${title} | Austin Howell`
    document.title = fullTitle

    // Update or create meta description
    let meta = document.querySelector('meta[name="description"]') as HTMLMetaElement | null
    if (description) {
      if (!meta) {
        meta = document.createElement('meta')
        meta.name = 'description'
        document.head.appendChild(meta)
      }
      meta.content = description
    }

    // Update OG tags
    setMetaProperty('og:title', fullTitle)
    if (description) setMetaProperty('og:description', description)
    setMetaProperty('og:type', 'website')
    setMetaProperty('og:url', window.location.href)
  }, [title, description])

  return null
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.content = content
}

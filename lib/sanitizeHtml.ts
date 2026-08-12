// Rich text here comes from the Tiptap editor (StarterKit + Link extension) —
// only the tags/attrs that editor can actually produce need to survive.
//
// This used isomorphic-dompurify before, but its jsdom dependency fails to load
// in Vercel's serverless runtime (an ESM/CJS interop bug in one of jsdom's own
// transitive deps, unrelated to this app), breaking every route that imports it.
// A dependency-free sanitizer avoids that class of problem entirely.
//
// Unlike a strip-the-bad-parts regex (which is what this replaced, and which
// missed unquoted/slash-separated event handlers like <img/onerror=...>), this
// rebuilds every tag from scratch — allowed tags get re-emitted with a fixed,
// hand-picked attribute set; anything else is dropped as a whole unit, so no
// attribute-quoting variant can smuggle something through.
const ALLOWED_TAGS = new Set([
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike', 'code', 'pre',
  'blockquote', 'ul', 'ol', 'li', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a',
])

function isSafeHref(href: string): boolean {
  const v = href.trim()
  return /^(https?:|mailto:|tel:)/i.test(v) || v.startsWith('/') || v.startsWith('#')
}

export function sanitizeRichText(html: string): string {
  if (!html) return ''
  let out = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<!\[CDATA\[[\s\S]*?\]\]>/gi, '')
    .replace(/<!DOCTYPE[^>]*>/gi, '')

  out = out.replace(/<\/?([a-zA-Z][a-zA-Z0-9]*)\b[^>]*>/g, (match, rawTag: string) => {
    const tag = rawTag.toLowerCase()
    if (!ALLOWED_TAGS.has(tag)) return ''
    if (match.startsWith('</')) return `</${tag}>`
    if (tag === 'a') {
      const hrefMatch = match.match(/\bhref\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+))/i)
      const href = hrefMatch ? (hrefMatch[1] ?? hrefMatch[2] ?? hrefMatch[3] ?? '') : ''
      if (href && isSafeHref(href)) {
        return `<a href="${href.replace(/"/g, '&quot;')}" target="_blank" rel="noopener noreferrer">`
      }
      return '<a>'
    }
    return `<${tag}>`
  })

  return out
}

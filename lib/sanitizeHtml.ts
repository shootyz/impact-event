import DOMPurify from 'isomorphic-dompurify'

// Rich text here comes from the Tiptap editor (StarterKit + Link extension) —
// only the tags/attrs that editor can actually produce need to survive.
// Replaces a regex-based stripper that only blocked a handful of tag names and
// missed unquoted/slash-separated event handlers (e.g. <img/onerror=...>).
const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'b', 'i', 'u', 's', 'strike', 'code', 'pre',
  'blockquote', 'ul', 'ol', 'li', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'a',
]
const ALLOWED_ATTR = ['href', 'target', 'rel']

export function sanitizeRichText(html: string): string {
  return DOMPurify.sanitize(html, { ALLOWED_TAGS, ALLOWED_ATTR })
}

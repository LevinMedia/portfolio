import DOMPurify from 'isomorphic-dompurify'
import { normalizeYouTubeEmbedsInMarkdown } from './youtube'

/**
 * Sanitizes markdown/HTML content to prevent XSS attacks
 * Allows safe markdown elements but strips dangerous HTML/scripts
 * Preserves custom markdown syntax like !video[alt](url), !gallery[caption](urls),
 * and !youtube[title](url)
 */
export function sanitizeMarkdown(content: string): string {
  if (!content) return ''

  // Turn YouTube pastes/iframes into stable !youtube markdown before any HTML strip
  const withYouTube = normalizeYouTubeEmbedsInMarkdown(content)
  
  // Check if content contains raw markdown (like !video[], !gallery[], etc.)
  // If it's pure markdown without HTML tags, return it as-is after basic safety checks
  const hasHtmlTags = /<[^>]+>/g.test(withYouTube)
  
  if (!hasHtmlTags) {
    // It's plain markdown - just check for dangerous protocols
    if (withYouTube.toLowerCase().includes('javascript:') || 
        withYouTube.toLowerCase().includes('data:text/html') ||
        withYouTube.toLowerCase().includes('vbscript:')) {
      // Remove lines with dangerous protocols
      return withYouTube
        .split('\n')
        .filter(line => {
          const lower = line.toLowerCase()
          return !lower.includes('javascript:') && 
                 !lower.includes('data:text/html') && 
                 !lower.includes('vbscript:')
        })
        .join('\n')
    }
    // Safe plain markdown, return as-is
    return withYouTube
  }
  
  // Contains HTML tags - sanitize with DOMPurify
  const clean = DOMPurify.sanitize(withYouTube, {
    ALLOWED_TAGS: [
      // Text formatting
      'p', 'br', 'strong', 'em', 'u', 's', 'del', 'ins', 'mark', 'code', 'pre',
      // Headings
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      // Lists
      'ul', 'ol', 'li',
      // Links (but we'll sanitize URLs separately)
      'a',
      // Blockquotes
      'blockquote',
      // Images (but we'll sanitize URLs separately)
      'img',
      // Tables
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      // Divs and spans for layout (limited attributes)
      'div', 'span'
    ],
    ALLOWED_ATTR: [
      'href', 'title', 'alt', 'src', 'class',
      // Allow data attributes for styling (but sanitized)
      'data-*'
    ],
    ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
    ALLOW_DATA_ATTR: false, // Disable data attributes for extra security
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'base', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur'],
    KEEP_CONTENT: true, // Keep text content even if tags are removed
  })
  
  // DOMPurify may leave structure that still needs YouTube normalization
  return normalizeYouTubeEmbedsInMarkdown(clean)
}

/**
 * Sanitizes a plain text string (for names, titles, etc.)
 * Strips all HTML tags and normalizes whitespace
 */
export function sanitizeText(text: string): string {
  if (!text) return ''
  
  // Strip all HTML tags
  const withoutTags = DOMPurify.sanitize(text, { 
    ALLOWED_TAGS: [],
    KEEP_CONTENT: true 
  })
  
  // Normalize whitespace
  return withoutTags.trim().replace(/\s+/g, ' ')
}

/**
 * Sanitizes a URL to ensure it's safe
 * Only allows http, https, mailto protocols
 */
export function sanitizeUrl(url: string): string {
  if (!url) return ''
  
  const trimmed = url.trim()
  
  // Check if URL starts with a safe protocol
  const safeProtocols = ['http://', 'https://', 'mailto:']
  const isSafe = safeProtocols.some(protocol => trimmed.toLowerCase().startsWith(protocol))
  
  if (!isSafe) {
    return '' // Return empty string for unsafe URLs
  }
  
  // Additional check for javascript: protocol attempts
  if (trimmed.toLowerCase().includes('javascript:')) {
    return ''
  }
  
  return trimmed
}


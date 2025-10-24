import DOMPurify from 'isomorphic-dompurify'

/**
 * Sanitizes markdown/HTML content to prevent XSS attacks
 * Allows safe markdown elements but strips dangerous HTML/scripts
 * Preserves custom markdown syntax like !video[alt](url)
 */
export function sanitizeMarkdown(content: string): string {
  if (!content) return ''
  
  // Check if content contains raw markdown (like !video[], !image[], etc.)
  // If it's pure markdown without HTML tags, return it as-is after basic safety checks
  const hasHtmlTags = /<[^>]+>/g.test(content)
  
  if (!hasHtmlTags) {
    // It's plain markdown - just check for dangerous protocols
    if (content.toLowerCase().includes('javascript:') || 
        content.toLowerCase().includes('data:text/html') ||
        content.toLowerCase().includes('vbscript:')) {
      // Remove lines with dangerous protocols
      return content
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
    return content
  }
  
  // Contains HTML tags - sanitize with DOMPurify
  const clean = DOMPurify.sanitize(content, {
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
  
  return clean
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


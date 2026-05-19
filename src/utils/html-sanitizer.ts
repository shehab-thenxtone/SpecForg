const ALLOWED_TAGS = new Set([
  'p', 'br', 'ul', 'ol', 'li',
  'strong', 'em',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
])

/**
 * Strips all HTML tags except the allowed structural set, then collapses
 * multiple blank lines into one and returns clean, plain-text-friendly output.
 */
export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return ''
  const parser = new DOMParser()
  const doc = parser.parseFromString(rawHtml, 'text/html')
  const text = extractTextContent(doc.body)
  return text.replace(/\n{3,}/g, '\n\n').trim()
}

/**
 * Recursively collects text content from an element, preserving list
 * structure ("- item"), converting <br> to newlines, and adding paragraph
 * breaks after block-level elements.
 */
export function extractTextContent(element: Element | DocumentFragment): string {
  let result = ''

  for (const node of element.childNodes) {
    if (node.nodeType === Node.TEXT_NODE) {
      result += node.textContent ?? ''
      continue
    }

    if (node.nodeType !== Node.ELEMENT_NODE) continue

    const el = node as Element
    const tag = el.tagName.toLowerCase()

    if (!ALLOWED_TAGS.has(tag)) {
      // Strip the tag but still recurse into its children to preserve text
      result += extractTextContent(el)
      continue
    }

    switch (tag) {
      case 'br':
        result += '\n'
        break
      case 'li':
        result += '- ' + extractTextContent(el).trim() + '\n'
        break
      case 'ul':
      case 'ol':
        result += extractTextContent(el)
        break
      case 'p':
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        result += extractTextContent(el).trim() + '\n\n'
        break
      default:
        // strong, em — inline; no extra newlines
        result += extractTextContent(el)
    }
  }

  return result
}

const ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&rsquo;': "'",
  '&lsquo;': "'",
  '&ldquo;': '"',
  '&rdquo;': '"',
  '&middot;': '•',
};

function decodeHtmlEntities(input: string) {
  let value = input || '';
  for (let i = 0; i < 3; i += 1) {
    const next = value.replace(/&[a-z0-9#]+;/gi, (m) => ENTITY_MAP[m.toLowerCase()] ?? m);
    if (next === value) break;
    value = next;
  }
  return value;
}

export function stripRichText(input: string) {
  const decoded = decodeHtmlEntities(input || '');
  return decoded
    .replace(/<[^>]*>/g, ' ')
    .replace(/\u00A0/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function cleanRichHtml(input: string) {
  const decoded = decodeHtmlEntities(input || '');
  const normalized = decoded.replace(/\u00A0/g, ' ');
  if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return normalized.replace(/<script\b[^>]*>[\s\S]*?<\/script(?:\s+[^>]*)?>/gi, '');
  }

  const allowedTags = new Set([
    'a', 'b', 'blockquote', 'br', 'code', 'div', 'em', 'h1', 'h2', 'h3',
    'h4', 'h5', 'h6', 'hr', 'i', 'img', 'li', 'ol', 'p', 'pre', 's',
    'span', 'strong', 'sub', 'sup', 'u', 'ul',
  ]);
  const allowedAttrs = new Set(['alt', 'class', 'href', 'rel', 'src', 'target']);
  const parser = new DOMParser();
  const doc = parser.parseFromString(normalized, 'text/html');

  const sanitizeNode = (node: Element) => {
    const tag = node.tagName.toLowerCase();
    if (!allowedTags.has(tag)) {
      node.replaceWith(...Array.from(node.childNodes));
      return;
    }

    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase();
      const value = attr.value.trim();
      const isEventHandler = name.startsWith('on');
      const isUnsafeHref = (name === 'href' || name === 'src') && /^javascript:/i.test(value);
      if (!allowedAttrs.has(name) || isEventHandler || isUnsafeHref) {
        node.removeAttribute(attr.name);
      }
    }

    if (tag === 'a') {
      node.setAttribute('rel', 'noopener noreferrer');
      if (!node.getAttribute('target')) {
        node.setAttribute('target', '_blank');
      }
    }
  };

  Array.from(doc.body.querySelectorAll('*')).forEach(sanitizeNode);
  return doc.body.innerHTML;
}

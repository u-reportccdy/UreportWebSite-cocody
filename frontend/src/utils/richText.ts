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
  return decoded.replace(/\u00A0/g, ' ');
}

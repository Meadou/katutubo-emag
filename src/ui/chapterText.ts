/**
 * Splits a chapter's HTML into the short lede the anime.js pattern asks for (its first sentence) and
 * the rest of the text, without dropping or repeating a word.
 */
export function splitLede(html: string): { lede: string; rest: string } {
  const m = html.match(/^\s*<p>([\s\S]*?)<\/p>/)
  if (!m) return { lede: '', rest: html }
  const first = m[1]
  const after = html.slice(m[0].length)
  // the first full stop, question or exclamation mark followed by a new sentence (outside any tag)
  const s = first.match(/^([\s\S]*?[.!?](?:<\/(?:strong|em)>)?)\s+(?=[A-Z"“<])/)
  if (!s) return { lede: first, rest: after }
  const tail = first.slice(s[0].length)
  return { lede: s[1], rest: (tail ? `<p>${tail}</p>` : '') + after }
}

const NAMED: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
/** The entities the Markdown renderer writes, back to plain characters (once tags are gone). */
const decode = (t: string) =>
  t.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) =>
    e[0] !== '#' ? NAMED[e.toLowerCase()] ?? m : String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : +e.slice(1)))

/** A chapter's sentences as plain text, in order (paragraph ends count as spaces). */
export function sentences(html: string): string[] {
  const text = decode(html.replace(/<\/(?:p|li|blockquote|h\d)>/g, ' ').replace(/<[^>]+>/g, '')).replace(/\s+/g, ' ').trim()
  return (text.match(/[^.!?]+[.!?]+["”]?/g) ?? [text]).map((s) => s.trim()).filter(Boolean)
}

/** The sentence of a chapter that names a term (plain text), for the still "read slowly" demo. */
export function sentenceWith(html: string, term: string): string | null {
  return sentences(html).find((s) => s.toLowerCase().includes(term.toLowerCase())) ?? null
}

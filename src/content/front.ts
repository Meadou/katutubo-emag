import { marked } from 'marked'

/**
 * The magazine's own parts, beside the peoples' articles: the introduction, the comparison, cultural
 * significance, the conclusion, the note on respect and protocols, and the general references. Plain
 * Markdown in ./front/*.md, read like the articles: frontmatter, then a part per `## Heading`.
 * In the comparison, a part names the theme it compares with an `<!-- theme: key -->` line.
 */
export interface Part { id: string; title: string; html: string; theme: string | null }
export interface Doc { key: string; title: string; placeholder: boolean; lede: string; parts: Part[] }

const files = import.meta.glob('./front/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function parseDoc(key: string, raw: string): Doc {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  const meta: Record<string, string> = {}
  for (const line of (m?.[1] ?? '').split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const body = m ? m[2] : raw
  const placeholder = meta.placeholder === 'true'
  const [head, ...rest] = body.split(/^## +/m)
  const parts = placeholder ? [] : rest.map((part) => {
    const nl = part.indexOf('\n')
    const title = part.slice(0, nl).trim()
    let md = part.slice(nl + 1)
    const theme = md.match(/<!--\s*theme:\s*([a-z0-9-]+)\s*-->/)?.[1] ?? null
    md = md.replace(/<!--[\s\S]*?-->/g, '')
    return { id: slugify(title), title, html: marked.parse(md, { async: false }) as string, theme }
  })
  return {
    key,
    title: meta.title ?? key,
    placeholder,
    lede: placeholder ? '' : (marked.parse(head.trim(), { async: false }) as string),
    parts,
  }
}

export const docs: Record<string, Doc> = Object.fromEntries(Object.entries(files).map(([path, raw]) => {
  const key = path.replace(/^.*\/(.*)\.md$/, '$1')
  return [key, parseDoc(key, raw)]
}))

/** A part of the magazine by its file name; an empty placeholder if the file is missing. */
export const doc = (key: string): Doc => docs[key] ?? { key, title: key, placeholder: true, lede: '', parts: [] }

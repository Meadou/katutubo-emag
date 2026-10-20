import { marked } from 'marked'

/**
 * Content is plain Markdown in ./groups/*.md, bundled at build time (no database).
 * Frontmatter = simple `key: value` lines. Each `## Heading` becomes a chapter;
 * a `## Sources` chapter is rendered separately at the end of the article.
 */

export type IslandGroup = 'Luzon' | 'Visayas' | 'Mindanao'

export interface Chapter {
  id: string
  title: string
  html: string
  /** 3D object key shown while this chapter is on screen (see three/objects/registry) */
  object: string
  /** the chapter's **bold** key terms, shown as callouts pinned around its 3D object */
  terms: string[]
}

export interface Group {
  slug: string
  name: string
  region: string
  island: string
  islandGroup: IslandGroup
  lon: number
  lat: number
  color: string
  tagline: string
  draft: boolean
  /** "Coming soon" issue: listed everywhere, but its body is not published yet */
  placeholder: boolean
  /** optional licensed recording in /public/audio, e.g. `audio: audio/tboli-hegelung.mp3` */
  audio: string | null
  chapters: Chapter[]
  sources: string | null
}

const files = import.meta.glob('./groups/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const ISLAND_GROUP: Record<string, IslandGroup> = {
  Luzon: 'Luzon', Mindoro: 'Luzon', Palawan: 'Luzon',
  Panay: 'Visayas', Negros: 'Visayas', Cebu: 'Visayas', Bohol: 'Visayas', Samar: 'Visayas', Leyte: 'Visayas',
  Mindanao: 'Mindanao', Sulu: 'Mindanao',
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) return { meta: {}, body: raw }
  const meta: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  return { meta, body: m[2] }
}

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

export function parseGroup(raw: string): Group {
  const { meta, body } = parseFrontmatter(raw)
  const placeholder = meta.placeholder === 'true'
  const objects = (meta.objects ?? 'spirits').split(',').map((s) => s.trim()).filter(Boolean)
  const parts = placeholder ? [] : body.split(/^## +/m).slice(1)
  const chapters: Chapter[] = []
  let sources: string | null = null
  for (const part of parts) {
    const nl = part.indexOf('\n')
    const title = part.slice(0, nl).trim()
    const md = part.slice(nl + 1)
    const html = marked.parse(md, { async: false }) as string
    const terms = [...new Set([...md.matchAll(/\*\*([^*]+)\*\*/g)].map((t) => t[1].trim()))]
    if (/^sources?$/i.test(title)) sources = html
    else chapters.push({ id: slugify(title), title, html, object: objects[chapters.length % objects.length], terms })
  }
  return {
    slug: meta.slug ?? slugify(meta.name ?? 'group'),
    name: meta.name ?? 'Untitled',
    region: meta.region ?? '',
    island: meta.island ?? '',
    islandGroup: ISLAND_GROUP[meta.island] ?? 'Luzon',
    lon: parseFloat(meta.lon),
    lat: parseFloat(meta.lat),
    color: meta.color ?? '#d9a441',
    tagline: meta.tagline ?? '',
    draft: meta.draft === 'true',
    placeholder,
    audio: meta.audio || null,
    chapters,
    sources,
  }
}

export const groups: Group[] = Object.values(files)
  .map(parseGroup)
  .sort((a, b) => b.lat - a.lat) // north → south, like turning the pages down the archipelago

export const getGroup = (slug: string) => groups.find((g) => g.slug === slug)

/** The next finished (non-placeholder) issue after `slug`, wrapping around; null if there is none. */
export function nextIssue(slug: string, list: Group[] = groups): Group | null {
  const i = list.findIndex((g) => g.slug === slug)
  if (i < 0) return null
  for (let k = 1; k < list.length; k++) {
    const g = list[(i + k) % list.length]
    if (!g.placeholder) return g
  }
  return null
}

/** Unique 3D object keys a group's scene shows, in chapter order; placeholders get the spirits. */
export function sceneObjectKeys(group: Group): string[] {
  const keys = [...new Set(group.chapters.map((c) => c.object))]
  return keys.length ? keys : ['spirits']
}

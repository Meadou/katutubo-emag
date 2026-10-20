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
  const objects = (meta.objects ?? 'spirits').split(',').map((s) => s.trim()).filter(Boolean)
  const parts = body.split(/^## +/m).slice(1)
  const chapters: Chapter[] = []
  let sources: string | null = null
  for (const part of parts) {
    const nl = part.indexOf('\n')
    const title = part.slice(0, nl).trim()
    const html = marked.parse(part.slice(nl + 1), { async: false }) as string
    if (/^sources?$/i.test(title)) sources = html
    else chapters.push({ id: slugify(title), title, html, object: objects[chapters.length % objects.length] })
  }
  return {
    slug: meta.slug ?? slugify(meta.name ?? 'group'),
    name: meta.name ?? 'Untitled',
    region: meta.region ?? '',
    island: meta.island ?? '',
    islandGroup: ISLAND_GROUP[meta.island] ?? 'Luzon',
    lon: parseFloat(meta.lon ?? '122'),
    lat: parseFloat(meta.lat ?? '12'),
    color: meta.color ?? '#d9a441',
    tagline: meta.tagline ?? '',
    draft: meta.draft === 'true',
    audio: meta.audio || null,
    chapters,
    sources,
  }
}

export const groups: Group[] = Object.values(files)
  .map(parseGroup)
  .sort((a, b) => b.lat - a.lat) // north → south, like turning the pages down the archipelago

export const getGroup = (slug: string) => groups.find((g) => g.slug === slug)

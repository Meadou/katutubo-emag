import { marked } from 'marked'

/**
 * Content is plain Markdown in ./groups/*.md, bundled at build time (no database).
 * Frontmatter = simple `key: value` lines. Each `## Heading` becomes a chapter;
 * a `## Sources` chapter is rendered separately at the end of the article.
 */

/** The five provinces of the Davao Region, in the order the journey circles the Davao Gulf. */
export const PROVINCES = ['Davao del Norte', 'Davao de Oro', 'Davao Oriental', 'Davao Occidental', 'Davao del Sur'] as const
export type Province = (typeof PROVINCES)[number]

export interface Chapter {
  id: string
  title: string
  html: string
  /** 3D object key from the `objects:` frontmatter line, for chapter models dropped in with fromFactory */
  object: string
  /** the chapter's **bold** key terms, listed under its title */
  terms: string[]
}

/** One of a people's instruments, by the trait it is compared under (see ./traits) and its own name for it. */
export interface Instrument { trait: string; name: string }

export interface Group {
  slug: string
  name: string
  /** where the people live: towns and places, as the article names them */
  region: string
  province: Province
  /** the map piece of the province (`davao-del-sur`, ...) */
  provinceKey: string
  lon: number
  lat: number
  color: string
  tagline: string
  /** the issue's angle: its title as a magazine feature (from the editors, not a fact) */
  angle: string
  /** another name the people are known by, shown after the endonym */
  aka: string
  /** the people's own language */
  language: string
  /** instruments by trait, for the comparison (`instruments: boat-lute=kudlung; gong=agung`) */
  instruments: Instrument[]
  /** the themes their stories carry, for the comparison (`themes: creation, culture-hero`) */
  themes: string[]
  draft: boolean
  /** "Coming soon" issue: listed everywhere, but its body is not published yet */
  placeholder: boolean
  /** a placeholder whose published sources are still being looked for: it says "Information unavailable" */
  unavailable: boolean
  /** optional licensed recording in /public/audio, e.g. `audio: audio/tboli-hegelung.mp3` */
  audio: string | null
  chapters: Chapter[]
  sources: string | null
}

const files = import.meta.glob('./groups/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>

const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

/** The map piece a province is drawn as (scripts/worlds/bake.mjs names them the same way). */
export const provinceKey = (p: string) => slugify(p)

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

const list = (s: string | undefined, sep = ',') => (s ?? '').split(sep).map((x) => x.trim()).filter(Boolean)

export function parseGroup(raw: string): Group {
  const { meta, body } = parseFrontmatter(raw)
  const placeholder = meta.placeholder === 'true'
  const objects = list(meta.objects ?? 'spirits')
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
  const province = (PROVINCES as readonly string[]).includes(meta.province) ? (meta.province as Province) : PROVINCES[0]
  return {
    slug: meta.slug ?? slugify(meta.name ?? 'group'),
    name: meta.name ?? 'Untitled',
    region: meta.region ?? '',
    province,
    provinceKey: provinceKey(province),
    lon: parseFloat(meta.lon),
    lat: parseFloat(meta.lat),
    color: meta.color ?? '#d9a441',
    tagline: meta.tagline ?? '',
    angle: meta.angle ?? '',
    aka: meta.aka ?? '',
    language: meta.language ?? '',
    instruments: list(meta.instruments, ';').map((x) => {
      const [trait, name] = x.split('=').map((y) => y.trim())
      return { trait, name: name ?? '' }
    }),
    themes: list(meta.themes),
    draft: meta.draft === 'true',
    placeholder,
    unavailable: placeholder && meta.unavailable === 'true',
    audio: meta.audio || null,
    chapters,
    sources,
  }
}

/** The province named in a file's frontmatter, raw, so the content lint can catch a misspelling. */
export const rawProvince = (raw: string) => parseFrontmatter(raw).meta.province ?? ''
export const rawFiles = files

export const groups: Group[] = Object.values(files)
  .map(parseGroup)
  // around the gulf, province by province; within a province, north to south
  .sort((a, b) => PROVINCES.indexOf(a.province) - PROVINCES.indexOf(b.province) || b.lat - a.lat)

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

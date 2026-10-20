import { marked } from 'marked'
import type { Shot } from '../store'
import type { FigureSpec, InstrumentKind, InstrumentSpec, PoseName, StageSpec } from '../three/stageSpec'

/**
 * A story is a Markdown file in ./stories: frontmatter, then one `## Step` per stop on the journey.
 * Inside a step, `@key: value` lines direct the 3D stage, paragraphs are the story text (left side),
 * and `- **Term**: gloss` lines are the facts (right side). A `## Sources` step closes the story.
 *
 *   @shot: lat, lon, dist, tilt           where the camera looks, how far, how steeply
 *   @cards: word, word                     short words that drift around the scene
 *   @figure: id | dlat, dlon | pose [| wrap] [| mallet] [| small] [| plays kuglung] [| face 1.2]
 *   @instrument: agung | dlat, dlon [| face 0.5]
 *   @light: dlat, dlon [| rise]            a sacred presence, shown only as light; `rise` lifts it skyward
 *
 * Figure and instrument places are offsets in degrees from the story's `anchor`. A figure id that
 * appears again in the next step walks from its old place to its new one.
 */
export interface Fact { term: string; gloss: string }
export interface Step {
  id: string
  title: string
  html: string
  facts: Fact[]
  shot: Shot | null
  cards: string[]
  figures: FigureSpec[]
  instruments: InstrumentSpec[]
  light: { lat: number; lon: number; rise?: boolean } | null
}
export interface Story {
  slug: string
  title: string
  peoples: string[]
  anchor: { lat: number; lon: number }
  draft: boolean
  /** the step (0-based) each people's place opens at, from `starts: manobo 1, matigsalug 2` */
  starts: Record<string, number>
  steps: Step[]
  sources: string | null
}

const POSES: PoseName[] = ['stand', 'walk', 'strike', 'pluck', 'harp', 'kneel', 'raise', 'sit', 'listen']
const INSTRUMENTS: InstrumentKind[] = ['kuglung', 'saluray', 'agung', 'kubing']
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const nums = (s: string) => s.split(',').map((n) => parseFloat(n.trim()))

export function parseStory(raw: string): Story {
  const m = raw.replace(/\r\n/g, '\n').match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/)
  if (!m) throw new Error('story: missing frontmatter')
  const meta: Record<string, string> = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim()
  }
  const [alat, alon] = nums(meta.anchor ?? '')
  const anchor = { lat: alat, lon: alon }
  const steps: Step[] = []
  let sources: string | null = null

  for (const part of m[2].split(/^## +/m).slice(1)) {
    const nl = part.indexOf('\n')
    const title = part.slice(0, nl).trim()
    const body = part.slice(nl + 1)
    if (/^sources?$/i.test(title)) { sources = marked.parse(body, { async: false }) as string; continue }
    const fail = (msg: string) => { throw new Error(`story "${meta.slug}", step "${title}": ${msg}`) }
    const step: Step = { id: slugify(title), title, html: '', facts: [], shot: null, cards: [], figures: [], instruments: [], light: null }
    const text: string[] = []
    for (const line of body.split('\n')) {
      const d = line.match(/^@(\w+):\s*(.*)$/)
      const fact = line.match(/^- \*\*([^*]+)\*\*:\s*(.+)$/)
      if (d) {
        const [, key, val] = d
        const bits = val.split('|').map((b) => b.trim())
        if (key === 'shot') {
          const [lat, lon, dist, tilt] = nums(val)
          step.shot = { lat, lon, dist, tilt }
        } else if (key === 'cards') {
          step.cards = val.split(',').map((c) => c.trim()).filter(Boolean)
        } else if (key === 'figure') {
          const [id, at, pose, ...opts] = bits
          if (!POSES.includes(pose as PoseName)) fail(`unknown pose "${pose}"`)
          const [dlat, dlon] = nums(at)
          const plays = opts.find((o) => o.startsWith('plays '))?.slice(6) as InstrumentKind | undefined
          if (plays && !INSTRUMENTS.includes(plays)) fail(`unknown instrument "${plays}"`)
          const face = opts.find((o) => o.startsWith('face '))
          step.figures.push({
            id, lat: round(anchor.lat + dlat), lon: round(anchor.lon + dlon), pose: pose as PoseName,
            wrap: opts.includes('wrap'), mallet: opts.includes('mallet'), plays,
            ...(opts.includes('small') ? { size: 0.72 } : {}),
            ...(face ? { facing: parseFloat(face.slice(5)) } : {}),
          })
        } else if (key === 'instrument') {
          const [kind, at, ...opts] = bits
          if (!INSTRUMENTS.includes(kind as InstrumentKind)) fail(`unknown instrument "${kind}"`)
          const [dlat, dlon] = nums(at)
          const face = opts.find((o) => o.startsWith('face '))
          step.instruments.push({ kind: kind as InstrumentKind, lat: round(anchor.lat + dlat), lon: round(anchor.lon + dlon), facing: face ? parseFloat(face.slice(5)) : undefined })
        } else if (key === 'light') {
          const [at, flag] = val.split('|').map((b) => b.trim())
          const [dlat, dlon] = nums(at)
          step.light = { lat: round(anchor.lat + dlat), lon: round(anchor.lon + dlon), ...(flag === 'rise' ? { rise: true } : {}) }
        } else fail(`unknown directive "@${key}"`)
      } else if (fact) {
        step.facts.push({ term: fact[1].trim(), gloss: fact[2].trim() })
      } else text.push(line)
    }
    step.html = marked.parse(text.join('\n'), { async: false }) as string
    steps.push(step)
  }
  const starts: Record<string, number> = {}
  for (const pair of (meta.starts ?? '').split(',')) {
    const [who, n] = pair.trim().split(/\s+/)
    if (who && n) starts[who] = Number(n) - 1
  }
  return { slug: meta.slug, title: meta.title ?? '', peoples: (meta.peoples ?? '').split(',').map((p) => p.trim()).filter(Boolean), anchor, draft: meta.draft === 'true', starts, steps, sources }
}

const round = (n: number) => Math.round(n * 1e6) / 1e6

/** What step `i` puts on the map. */
export function stageFor(story: Story, i: number): StageSpec {
  const s = story.steps[i]
  return {
    figures: s.figures,
    instruments: s.instruments,
    light: s.light ?? undefined,
    cards: s.cards,
    center: story.anchor,
  }
}

const files = import.meta.glob('./stories/*.md', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
export const stories: Story[] = Object.values(files).map(parseStory)
/** The story a people's place opens, if they have one. */
export const storyFor = (slug: string) => stories.find((s) => s.slug === slug || s.peoples.includes(slug))

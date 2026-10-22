import { PROVINCES, groups as allGroups, provinceKey, type Group, type Province } from '../content'
import { THEMES, type Theme } from '../content/traits'
import { TIMES, isStillChapter, timeForChapter, type TimeName } from './palettes'
import { DESIGNS, type Shot } from './issues'
import type { Camera, Label, MapState, PlaceName, WorldState } from './types'
import { GULF } from '../stage/regions'
import { coords } from '../i18n/t'

const FOV = 35
const HALF = Math.tan(((FOV / 2) * Math.PI) / 180)
const PH = { lon: 121.9, lat: 12.6 }

/** Camera distance that fits a span of the map (in degrees) on screen at this aspect ratio. */
export function fitDist(spanW: number, spanH: number, aspect: number) {
  return Math.max(spanH / (2 * HALF), spanW / (2 * HALF * aspect)) * 1.06
}

/** The whole archipelago, centred on screen and looking almost straight down. */
export const archipelagoCamera = (aspect: number, lean?: { lon: number; lat: number }, k = 0): Camera => {
  const dist = fitDist(11, 16.6, aspect)
  return {
    lon: PH.lon + ((lean?.lon ?? PH.lon) - PH.lon) * k,
    lat: PH.lat + ((lean?.lat ?? PH.lat) - PH.lat) * k,
    dist,
    tilt: 0.18,
    yaw: 0,
  }
}

/**
 * A camera zoomed in by `k` (0..1) about one point of the map: that point keeps its place on screen,
 * like zooming a map toward the pointer.
 */
export const zoomAbout = (c: Camera, at: { lon: number; lat: number }, k: number): Camera => ({
  ...c, lon: at.lon + (c.lon - at.lon) * k, lat: at.lat + (c.lat - at.lat) * k, dist: c.dist * k,
})

const world = (time: TimeName, rest: Omit<WorldState, keyof (typeof TIMES)['midday']>): WorldState => ({ ...TIMES[time], ...rest })

const at = (focus: { lon: number; lat: number }, s: Shot): Camera => ({
  lon: focus.lon + (s.dlon ?? 0), lat: focus.lat + (s.dlat ?? 0), dist: s.dist, tilt: s.tilt, yaw: s.yaw,
})

/** Quiet map worlds for the index and about pages: the country faded, the Davao Region in its colours. */
export const plainWorlds = (aspect: number, time: TimeName = 'midday'): Record<string, WorldState> => ({
  page: world(time, { still: true, props: [], map: MAPS.cover, camera: { ...archipelagoCamera(aspect), dist: fitDist(11, 16.6, aspect) * 1.12, tilt: 0.42 } }),
})

/** Each province seen whole: the middle of its land (from the bake, scripts/worlds/bake.mjs) and how much map to frame. */
export const PROVINCE_VIEW: Record<Province, { lon: number; lat: number; w: number; h: number }> = {
  'Davao del Norte': { lon: 125.645, lat: 7.572, w: 0.75, h: 0.75 },
  'Davao de Oro': { lon: 126.024, lat: 7.568, w: 0.6, h: 0.85 },
  'Davao Oriental': { lon: 126.3, lat: 7.234, w: 0.7, h: 1.3 },
  'Davao Occidental': { lon: 125.544, lat: 6.09, w: 0.55, h: 1.1 },
  'Davao del Sur': { lon: 125.259, lat: 6.715, w: 0.55, h: 0.65 },
}

/** The names printed on the arrival: the provinces, Davao City, and the landmarks the magazine names. */
export const REGION_NAMES: PlaceName[] = [
  ...PROVINCES.map((p): PlaceName => ({ key: provinceKey(p), lon: PROVINCE_VIEW[p].lon, lat: PROVINCE_VIEW[p].lat, text: p, kind: 'province' })),
  { key: 'davao-city', lon: 125.423, lat: 7.261, text: 'Davao City', kind: 'province' },
  { key: 'apo', lon: 125.2708, lat: 6.9875, text: 'Mount Apo', kind: 'landmark' },
  { key: 'samal', lon: 125.72, lat: 7.09, text: 'Samal Island', kind: 'landmark' },
  { key: 'gulf', lon: 125.78, lat: 6.62, text: 'Davao Gulf', kind: 'water' },
]

/** How the map is laid in each kind of world (see MapState). */
const MAPS = {
  cover: { dim: 0.7, rise: 0.03, part: 0.008, tint: 1 },
  arrival: { dim: 0.86, rise: 0.06, part: 0.05, tint: 1 },
  province: { dim: 0.9, rise: 0.05, part: 0.07, tint: 1 },
  compare: { dim: 0.9, rise: 0.04, part: 0.04, tint: 0.7 },
  essay: { dim: 0.86, rise: 0.035, part: 0.025, tint: 0.9 },
  bookend: { dim: 0.5, rise: 0.015, part: 0, tint: 1 },
} satisfies Record<string, Partial<MapState>>

/** The yaw that looks out at a place from over the gulf, so going province by province circles the gulf. */
export const fromGulf = (p: { lon: number; lat: number }) => Math.atan2(GULF.lon - p.lon, p.lat - GULF.lat)

/** The whole Davao Region, seen across the gulf from the south. */
export const regionCamera = (aspect: number, yaw = 0.35): Camera => ({ lon: 125.8, lat: 6.92, dist: fitDist(2.1, 2.3, aspect), tilt: 0.78, yaw })

export const provinceCamera = (p: Province, aspect: number): Camera => {
  const v = PROVINCE_VIEW[p]
  return { lon: v.lon, lat: v.lat, dist: Math.max(2.3, fitDist(v.w, v.h, aspect) * 1.3), tilt: 0.92, yaw: fromGulf(v) }
}

/** The peoples' places are met close: a stop looks down at the land around the pin. */
const stopShot = (g: Group, aspect: number): Shot => ({ dist: Math.max(1.25, fitDist(0.45, 0.45, aspect)), tilt: 1.0, yaw: fromGulf(g) + 0.25 })

/** One section of the journey, in reading order. Zoom sections carry no text: the camera moves. */
export type Section =
  | { kind: 'intro'; id: string }
  | { kind: 'introduction'; id: string }
  | { kind: 'province'; id: string; province: Province; peoples: Group[] }
  | { kind: 'zoom'; id: string }
  | { kind: 'people'; id: string; group: Group }
  | { kind: 'chapter'; id: string; group: Group; index: number }
  | { kind: 'compare'; id: string; theme: Theme }
  | { kind: 'compare-table'; id: string }
  | { kind: 'part'; id: string; doc: string }
  | { kind: 'end'; id: string }

/** How high the leader line meets each object that has a label (the gong stand's beam). */
const OBJECT_TOP: Record<string, number> = { gong: 0.19 }

export const stopId = (slug: string) => `stop-${slug}`
export const chapterId = (slug: string, chapter: string) => `ch-${slug}-${chapter}`
export const provinceId = (p: Province) => `province-${provinceKey(p)}`
export const compareId = (theme: string) => `compare-${theme}`

/** What a people calls the thing a theme compares (their instrument's name), or '' if they do not carry it. */
export function carries(g: Group, t: Theme): string | null {
  if (t.kind === 'music') return g.instruments.find((i) => i.trait === t.key)?.name ?? null
  return g.themes.includes(t.key) ? g.name : null
}

/**
 * The whole magazine as one journey. The cover holds the whole country; a choreographed descent
 * through the clouds comes down onto the Davao Gulf, where the region parts into its provinces; the
 * camera then circles the gulf province by province, down to each of its two peoples and back up;
 * the comparison takes in the whole region, theme by theme; and the conclusion pulls back out to the
 * whole country, where the region settles back into place.
 */
export function buildJourney(aspect: number, groups: Group[] = allGroups): { sections: Section[]; worlds: Record<string, WorldState> } {
  const sections: Section[] = []
  const worlds: Record<string, WorldState> = {}
  const map = { still: false, props: [] as string[] }
  const zoom = (id: string, from: string, to: string, via?: Camera[], clouds = 0) => {
    sections.push({ kind: 'zoom', id })
    worlds[id] = { ...worlds[from], travel: { from, to, via }, map: clouds ? { clouds } : undefined }
  }
  /** A gentle arc between two views: up over the gulf and down again, rather than a straight slide. */
  const arc = (a: Camera, b: Camera): Camera[] => {
    const d = Math.atan2(Math.sin(b.yaw - a.yaw), Math.cos(b.yaw - a.yaw))
    return [{ lon: (a.lon + b.lon) / 2, lat: (a.lat + b.lat) / 2, dist: Math.max(a.dist, b.dist) * 1.35, tilt: Math.min(a.tilt, b.tilt) * 0.85, yaw: a.yaw + d / 2 }]
  }

  // the cover: the whole country, every region its own piece, the Davao Region printed in colour
  sections.push({ kind: 'intro', id: 'intro' })
  worlds.intro = world('midday', { ...map, map: MAPS.cover, names: [{ key: 'davao-region', lon: 126.75, lat: 7.05, text: 'Davao Region', kind: 'region' }], camera: archipelagoCamera(aspect) })

  // the descent: around and down through the clouds, onto the gulf at sunrise
  const arrival = regionCamera(aspect)
  worlds.introduction = world('sunrise', { ...map, map: MAPS.arrival, names: REGION_NAMES, camera: arrival })
  const cover = worlds.intro.camera
  zoom('descent', 'intro', 'introduction', [
    { lon: 124.9, lat: 8.9, dist: cover.dist * 0.42, tilt: 0.34, yaw: 0.12 },
    { lon: 125.55, lat: 7.6, dist: arrival.dist * 1.9, tilt: 0.62, yaw: 0.5 },
  ], 1)
  sections.push({ kind: 'introduction', id: 'introduction' })
  let last = 'introduction'

  for (const province of PROVINCES) {
    const peoples = groups.filter((g) => g.province === province)
    if (!peoples.length) continue
    const key = provinceKey(province)
    const mid = provinceId(province)
    const focus = { ...MAPS.province, focus: key }
    const named: Label[] = peoples.map((g) => ({ key: g.slug, lon: g.lon, lat: g.lat, text: g.name, href: `#/group/${g.slug}` }))
    const own = REGION_NAMES.filter((n) => n.key === key)
    worlds[mid] = world('morning', { ...map, map: focus, labels: named, names: own, camera: provinceCamera(province, aspect) })
    zoom(`to-${key}`, last, mid, arc(worlds[last].camera, worlds[mid].camera))
    sections.push({ kind: 'province', id: mid, province, peoples })

    peoples.forEach((g, i) => {
      const d = DESIGNS[g.slug]
      const site = d?.focus ?? { lon: g.lon, lat: g.lat }
      const stop = stopId(g.slug)
      const people = { site, people: g.slug, pin: g, map: focus }
      const shot = d?.shots.stop ?? stopShot(g, aspect)
      worlds[stop] = world(g.placeholder ? 'day' : 'morning', {
        ...people, labels: [{ key: g.slug, lon: g.lon, lat: g.lat, text: g.name, sub: coords(g) }], still: false,
        props: g.placeholder ? [] : [g.chapters[0]?.object].filter(Boolean) as string[], camera: at(site, shot),
      })
      // between the two peoples of a province the camera rises back to the province
      if (i > 0) zoom(`up-${g.slug}`, last, mid)
      zoom(`down-${g.slug}`, mid, stop)
      sections.push({ kind: 'people', id: stop, group: g })
      last = stop

      if (!g.placeholder) {
        g.chapters.forEach((c, k) => {
          const id = chapterId(g.slug, c.id)
          // an object with something to try carries a label; a still chapter carries none
          const labelled = OBJECT_TOP[c.object] !== undefined && !isStillChapter(c.id)
          const labels: Label[] = labelled ? [{ key: c.object, lon: site.lon, lat: site.lat, up: OBJECT_TOP[c.object], text: d?.labels?.[c.id] ?? '', object: c.object }] : []
          const fallback: Shot = { ...shot, dist: shot.dist * (k % 2 ? 0.85 : 1.15), yaw: shot.yaw + (k % 2 ? -0.5 : 0.45), tilt: shot.tilt - 0.08 }
          worlds[id] = world(timeForChapter(c.id), {
            ...people, labels, still: isStillChapter(c.id), props: [c.object], camera: at(site, d?.shots[c.id] ?? fallback),
          })
          sections.push({ kind: 'chapter', id, group: g, index: k })
          last = id
        })
      }
    })
  }

  // the comparison: the whole region again, theme by theme, the pins of the peoples who carry it lit
  const overview = regionCamera(aspect, -0.25)
  THEMES.forEach((t, k) => {
    const id = compareId(t.key)
    const lit = groups.filter((g) => carries(g, t) !== null)
    const labels: Label[] = lit.map((g) => ({ key: g.slug, lon: g.lon, lat: g.lat, text: carries(g, t) ?? g.name, sub: t.kind === 'music' ? g.name : undefined }))
    worlds[id] = world(t.kind === 'music' ? 'evening' : 'dusk', {
      ...map, map: MAPS.compare, lit: lit.map((g) => g.slug), labels,
      camera: { ...overview, dist: overview.dist * 1.08, tilt: 0.66, yaw: overview.yaw + (k - (THEMES.length - 1) / 2) * 0.09 },
    })
    if (k === 0) zoom('to-compare', last, id, arc(worlds[last].camera, worlds[id].camera))
    sections.push({ kind: 'compare', id, theme: t })
    last = id
  })
  worlds['compare-table'] = world('day', { ...map, map: MAPS.compare, camera: { ...overview, dist: overview.dist * 1.25, tilt: 0.55 } })
  sections.push({ kind: 'compare-table', id: 'compare-table' })

  worlds.significance = world('dusk', { ...map, map: MAPS.essay, names: REGION_NAMES.filter((n) => n.kind !== 'province'), camera: { ...regionCamera(aspect, -0.7), tilt: 0.7 } })
  sections.push({ kind: 'part', id: 'significance', doc: 'significance' })

  // the bookend: back out to the whole country at dusk, the region settled back into place
  worlds.conclusion = world('dusk', { ...map, map: MAPS.bookend, camera: { ...archipelagoCamera(aspect), tilt: 0.3, yaw: -0.08 } })
  zoom('to-conclusion', 'significance', 'conclusion', [{ lon: 124.6, lat: 9.2, dist: worlds.conclusion.camera.dist * 0.45, tilt: 0.5, yaw: -0.4 }])
  sections.push({ kind: 'part', id: 'conclusion', doc: 'conclusion' })

  worlds.respect = world('day', { ...map, still: true, map: MAPS.bookend, camera: { ...archipelagoCamera(aspect), tilt: 0.34, yaw: -0.08 } })
  sections.push({ kind: 'part', id: 'respect', doc: 'respect' })
  worlds.references = world('day', { ...map, still: true, map: MAPS.bookend, camera: { ...archipelagoCamera(aspect), tilt: 0.38, yaw: -0.08 } })
  sections.push({ kind: 'part', id: 'references', doc: 'references' })

  worlds.end = world('dusk', { ...map, map: MAPS.cover, camera: { ...archipelagoCamera(aspect), tilt: 0.3 } })
  sections.push({ kind: 'end', id: 'end' })
  return { sections, worlds }
}

/** The section a deep link names: a people's stop, or one of its chapters. */
export function sectionFor(slug: string, chapter?: string): string {
  return chapter ? chapterId(slug, chapter) : stopId(slug)
}

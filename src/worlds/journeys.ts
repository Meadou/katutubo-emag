import { groups as allGroups, type Group, type IslandGroup } from '../content'
import { TIMES, isStillChapter, timeForChapter, type TimeName } from './palettes'
import { DESIGNS, type Shot } from './issues'
import type { Camera, WorldState } from './types'

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

/** Quiet map worlds for the index and about pages. */
export const plainWorlds = (aspect: number, time: TimeName = 'midday'): Record<string, WorldState> => ({
  page: world(time, { still: true, props: [], camera: { ...archipelagoCamera(aspect), dist: fitDist(11, 16.6, aspect) * 1.12, tilt: 0.42 } }),
})

export const REGIONS: IslandGroup[] = ['Luzon', 'Visayas', 'Mindanao']

/** Each island group seen whole at "mid zoom": the view the journey returns to between its peoples. */
export const REGION_VIEW: Record<IslandGroup, { lon: number; lat: number; w: number; h: number }> = {
  Luzon: { lon: 121.25, lat: 16.8, w: 2.7, h: 3.8 },
  Visayas: { lon: 122.7, lat: 10.45, w: 1.9, h: 2.9 },
  Mindanao: { lon: 122.5, lat: 6.75, w: 5.4, h: 3.7 },
}

/** One section of the journey, in reading order. Zoom sections carry no text: the camera moves. */
export type Section =
  | { kind: 'intro'; id: string }
  | { kind: 'region'; id: string; region: IslandGroup; peoples: Group[] }
  | { kind: 'zoom'; id: string }
  | { kind: 'people'; id: string; group: Group }
  | { kind: 'chapter'; id: string; group: Group; index: number }
  | { kind: 'sources'; id: string; group: Group }
  | { kind: 'end'; id: string }

export const stopId = (slug: string) => `stop-${slug}`
export const chapterId = (slug: string, chapter: string) => `ch-${slug}-${chapter}`

/**
 * The whole magazine as one journey, north to south: the archipelago, then each island group at mid
 * zoom, down to each people's land and back up again, on to the next group, and out to the whole
 * map at the end. A finished issue's chapters play where its people are; the others say "Coming soon".
 */
export function buildJourney(aspect: number, groups: Group[] = allGroups): { sections: Section[]; worlds: Record<string, WorldState> } {
  const sections: Section[] = []
  const worlds: Record<string, WorldState> = {}
  const map = { still: false, props: [] as string[] }
  const zoom = (id: string, from: string, to: string) => {
    sections.push({ kind: 'zoom', id })
    worlds[id] = { ...worlds[from], travel: { from, to } }
  }

  sections.push({ kind: 'intro', id: 'intro' })
  worlds.intro = world('midday', { ...map, camera: archipelagoCamera(aspect) })
  let last = 'intro'

  for (const region of REGIONS) {
    const peoples = groups.filter((g) => g.islandGroup === region)
    if (!peoples.length) continue
    const v = REGION_VIEW[region]
    const mid = `region-${region.toLowerCase()}`
    worlds[mid] = world('midday', { ...map, camera: { lon: v.lon, lat: v.lat, dist: fitDist(v.w, v.h, aspect), tilt: 0.5, yaw: 0 } })
    zoom(`to-${region.toLowerCase()}`, last, mid)
    sections.push({ kind: 'region', id: mid, region, peoples })

    peoples.forEach((g, i) => {
      const d = DESIGNS[g.slug]
      const site = d?.focus ?? { lon: g.lon, lat: g.lat }
      const stop = stopId(g.slug)
      const own = { site, people: g.slug, pin: g }
      const stopShot = d?.shots.stop ?? { dist: 2.6, tilt: 0.78, yaw: 0 }
      worlds[stop] = world(g.placeholder ? 'day' : 'morning', {
        ...own, still: false, props: g.placeholder ? [] : [g.chapters[0]?.object].filter(Boolean) as string[], camera: at(site, stopShot),
      })
      // between two peoples of one group the camera rises back to the group's mid zoom
      if (i > 0) zoom(`up-${g.slug}`, last, mid)
      zoom(`down-${g.slug}`, mid, stop)
      sections.push({ kind: 'people', id: stop, group: g })
      last = stop

      if (!g.placeholder && d) {
        g.chapters.forEach((c, k) => {
          const id = chapterId(g.slug, c.id)
          worlds[id] = world(timeForChapter(c.id), {
            ...own, still: isStillChapter(c.id), props: [c.object], camera: at(site, d.shots[c.id] ?? stopShot),
          })
          sections.push({ kind: 'chapter', id, group: g, index: k })
          last = id
        })
        if (g.sources) {
          const id = `sources-${g.slug}`
          worlds[id] = world('day', { ...own, still: false, props: [], camera: at(site, d.shots.sources ?? stopShot) })
          sections.push({ kind: 'sources', id, group: g })
          last = id
        }
      }
    })
  }

  worlds.end = world('dusk', { ...map, camera: { ...archipelagoCamera(aspect), tilt: 0.3 } })
  zoom('to-end', last, 'end')
  sections.push({ kind: 'end', id: 'end' })
  return { sections, worlds }
}

/** The section a deep link names: a people's stop, or one of its chapters. */
export function sectionFor(slug: string, chapter?: string): string {
  return chapter ? chapterId(slug, chapter) : stopId(slug)
}

import type { Group } from '../content'
import { TIMES, isStillChapter, timeForChapter, type TimeName } from './palettes'
import type { IssueDesign, Shot } from './issues'
import type { Camera, WorldState } from './types'

const FOV = 35
const HALF = Math.tan(((FOV / 2) * Math.PI) / 180)
const PH = { lon: 121.9, lat: 12.6 }

/** Camera distance that fits a span of the map (in degrees) on screen at this aspect ratio. */
export function fitDist(spanW: number, spanH: number, aspect: number) {
  return Math.max(spanH / (2 * HALF), spanW / (2 * HALF * aspect)) * 1.06
}

/** The whole archipelago, looking almost straight down. */
export const archipelagoCamera = (aspect: number, lean?: { lon: number; lat: number }, k = 0): Camera => {
  const dist = fitDist(11, 16.6, aspect)
  // on wide screens the text card takes the left, so the islands sit right of centre
  const shift = aspect > 1.15 ? 2 * HALF * dist * aspect * 0.17 : 0
  return {
    lon: PH.lon + ((lean?.lon ?? PH.lon) - PH.lon) * k - shift,
    lat: PH.lat + ((lean?.lat ?? PH.lat) - PH.lat) * k,
    dist,
    tilt: 0.18,
    yaw: 0,
  }
}

const world = (time: TimeName, rest: Omit<WorldState, keyof (typeof TIMES)['midday']>): WorldState => ({ ...TIMES[time], ...rest })

const at = (focus: { lon: number; lat: number }, s: Shot): Camera => ({
  lon: focus.lon + (s.dlon ?? 0), lat: focus.lat + (s.dlat ?? 0), dist: s.dist, tilt: s.tilt, yaw: s.yaw,
})

/** The cover: the archipelago at midday, then leaning toward the first people, north to south. */
export function coverWorlds(aspect: number, first?: Group): Record<string, WorldState> {
  const map = { area: 'archipelago', clouds: 0, still: false, props: [] } as const
  return {
    hero: world('midday', { ...map, props: [], camera: archipelagoCamera(aspect) }),
    peoples: world('midday', { ...map, props: [], camera: { ...archipelagoCamera(aspect), tilt: 0.32 } }),
    begin: world('sunrise', {
      ...map, props: [], pin: first,
      camera: first ? { lon: first.lon, lat: first.lat - 0.6, dist: fitDist(11, 16.6, aspect) * 0.42, tilt: 0.5, yaw: 0 } : archipelagoCamera(aspect),
    }),
  }
}

/** Quiet map worlds for the index and about pages. */
export const plainWorlds = (aspect: number, time: TimeName = 'midday'): Record<string, WorldState> => ({
  page: world(time, { area: 'archipelago', clouds: 0, still: true, props: [], camera: { ...archipelagoCamera(aspect), dist: fitDist(11, 16.6, aspect) * 1.12, tilt: 0.42 } }),
})

/**
 * An issue's journey: the map with the place marked, the dive through the clouds into the region,
 * one world per chapter (each its own time of day, beliefs held still), the sources in full day,
 * and the fly back out toward the next people.
 */
export function issueWorlds(group: Group, design: IssueDesign, next: Group | null, aspect: number): Record<string, WorldState> {
  const region = { area: design.area, clouds: 0 } as const
  const worlds: Record<string, WorldState> = {
    map: world('midday', { area: 'archipelago', clouds: 0, still: false, props: [], pin: group, camera: archipelagoCamera(aspect, group, 0.12) }),
  }
  const ids = group.chapters.map((c) => c.id)
  ids.forEach((id, i) => {
    const shot = design.shots[id] ?? design.shots.overview
    worlds[id] = world(timeForChapter(id), {
      ...region, still: isStillChapter(id), props: [group.chapters[i].object], camera: at(design.focus, shot),
    })
  })
  // the dive: from the map straight into the first chapter's world
  worlds.fly = { ...worlds[ids[0]], travel: { from: 'map', to: ids[0] } }
  worlds.sources = world('day', { ...region, still: false, props: [], camera: at(design.focus, design.shots.sources) })
  if (next) {
    worlds.nextmap = world('midday', { area: 'archipelago', clouds: 0, still: false, props: [], pin: next, camera: archipelagoCamera(aspect, next, 0.12) })
    worlds.onward = { ...worlds.sources, travel: { from: 'sources', to: 'nextmap' } }
  }
  return worlds
}

/** A people whose issue is still being prepared: the map, then their place, seen from above. */
export function placeholderWorlds(group: Group, aspect: number): Record<string, WorldState> {
  const close = { lon: group.lon, lat: group.lat - 0.25, dist: 2.4, tilt: 0.6, yaw: 0 }
  return {
    map: world('midday', { area: 'archipelago', clouds: 0, still: false, props: [], pin: group, camera: archipelagoCamera(aspect, group, 0.12) }),
    place: world('morning', { area: 'archipelago', clouds: 0, still: false, props: [], pin: group, camera: close }),
  }
}

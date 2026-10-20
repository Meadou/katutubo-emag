import type { Sheet } from '../worlds/land'
import type { AreaName, Blended } from '../worlds/types'
import { groundAt } from './paper'

/** The paper of each area once it has been laid, so the stage can ask how high the ground is anywhere. */
export const lands: Partial<Record<AreaName, Sheet[]>> = {}

const cache = new Map<string, number>()

/** Height of an area's paper under a point (about 100 m resolution), or null before that area is laid. */
export function groundHeight(area: AreaName, lon: number, lat: number): number | null {
  const sheets = lands[area]
  if (!sheets) return null
  const key = `${area}:${lon.toFixed(3)}:${lat.toFixed(3)}`
  let h = cache.get(key)
  if (h === undefined) {
    h = groundAt(sheets, lon, lat)
    if (cache.size > 4000) cache.clear()
    cache.set(key, h)
  }
  return h
}

/** The place whose finer paper is showing most, and how far it has resolved. */
export function resolving(w: Blended): [AreaName | null, number] {
  let best: AreaName | null = null, weight = 0
  for (const [k, v] of Object.entries(w.areaWeights) as [AreaName, number][]) if (k !== 'archipelago' && v > weight) { best = k; weight = v }
  return [best, weight]
}

/** Ground height under a point, from whichever paper is showing there. */
export function groundUnder(w: Blended, lon: number, lat: number) {
  const base = groundHeight('archipelago', lon, lat) ?? 0
  const [place, k] = resolving(w)
  if (!place || k <= 0) return base
  const g = groundHeight(place, lon, lat)
  return g === null ? base : base + (g - base) * k
}

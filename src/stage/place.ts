import type { Sheet } from '../worlds/land'
import { groundAt } from './paper'

/** The map's sheets once they are laid, so the stage can ask how high the ground is anywhere. */
export const laid: { sheets: Sheet[] | null } = { sheets: null }

const cache = new Map<string, number>()

/** Height of the paper map under a point (about 100 m resolution); 0 before the map is laid. */
export function groundHeight(lon: number, lat: number): number {
  if (!laid.sheets) return 0
  const key = `${lon.toFixed(3)}:${lat.toFixed(3)}`
  let h = cache.get(key)
  if (h === undefined) {
    h = groundAt(laid.sheets, lon, lat)
    if (cache.size > 4000) cache.clear()
    cache.set(key, h)
  }
  return h
}

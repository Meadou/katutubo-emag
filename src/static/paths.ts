import type { Land } from '../worlds/land'

export interface Paths { base: 'sea' | 'land'; sheets: { d: string; sea: boolean; k: number; n: number }[]; lake?: string }
const pathCache = new Map<string, Paths>()

/** SVG path data for every sheet of an area, in degrees from its north-west corner (y grows south). */
export function pathsFor(land: Land): Paths {
  const hit = pathCache.get(land.name)
  if (hit) return hit
  const ring = (r: number[]) => {
    let s = 'M'
    for (let i = 0; i < r.length; i += 2) s += `${(r[i] - land.west).toFixed(4)} ${(land.north - r[i + 1]).toFixed(4)}${i < r.length - 2 ? 'L' : 'Z'}`
    return s
  }
  const landSheets = land.sheets.filter((s) => s.level > 0)
  const out: Paths = {
    base: land.sheets.some((s) => s.level <= 0) || land.name === 'archipelago' ? 'sea' : 'land',
    sheets: land.sheets.map((s) => ({
      d: s.polys.map((p) => p.map(ring).join('')).join(''),
      sea: s.level <= 0,
      k: Math.max(0, landSheets.indexOf(s)),
      n: landSheets.length,
    })),
    lake: land.lake?.polys.map((p) => p.map(ring).join('')).join(''),
  }
  pathCache.set(land.name, out)
  return out
}

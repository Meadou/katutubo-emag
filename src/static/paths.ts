import type { Land } from '../worlds/land'

export interface Paths { sheets: { d: string; level: number }[]; lakes?: string }
let cached: { land: Land; paths: Paths } | null = null

/** SVG path data for every sheet of the map, in degrees from its north-west corner (y grows south). */
export function pathsFor(land: Land): Paths {
  if (cached?.land === land) return cached.paths
  const ring = (r: number[]) => {
    let s = 'M'
    for (let i = 0; i < r.length; i += 2) s += `${(r[i] - land.west).toFixed(4)} ${(land.north - r[i + 1]).toFixed(4)}${i < r.length - 2 ? 'L' : 'Z'}`
    return s
  }
  const paths: Paths = {
    sheets: land.sheets.map((s) => ({ d: s.polys.map((p) => p.map(ring).join('')).join(''), level: s.level })),
    lakes: land.lakes?.polys.map((p) => p.map(ring).join('')).join(''),
  }
  cached = { land, paths }
  return paths
}

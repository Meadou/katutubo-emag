import type { Land, Region } from '../worlds/land'

export interface Paths {
  sheets: { d: string; level: number }[]
  lakes?: string
  /** the Davao pieces, each a stack of sheets */
  pieces: { key: string; sheets: { d: string; level: number }[] }[]
}
let cached: { land: Land; region: Region | null; paths: Paths } | null = null

/** SVG path data for every sheet of the map and of the Davao pieces, in degrees from the map's north-west corner (y grows south). */
export function pathsFor(land: Land, region: Region | null): Paths {
  if (cached?.land === land && cached.region === region) return cached.paths
  const ring = (r: number[]) => {
    let s = 'M'
    for (let i = 0; i < r.length; i += 2) s += `${(r[i] - land.west).toFixed(4)} ${(land.north - r[i + 1]).toFixed(4)}${i < r.length - 2 ? 'L' : 'Z'}`
    return s
  }
  const d = (polys: number[][][]) => polys.map((p) => p.map(ring).join('')).join('')
  const paths: Paths = {
    sheets: land.sheets.map((s) => ({ d: d(s.polys), level: s.level })),
    lakes: land.lakes ? d(land.lakes.polys) : undefined,
    pieces: (region?.pieces ?? []).map((p) => ({ key: p.key, sheets: p.sheets.map((s) => ({ d: d(s.polys), level: s.level })) })),
  }
  cached = { land, region, paths }
  return paths
}

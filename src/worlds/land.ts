import { useEffect, useState } from 'react'
import type { AreaName } from './types'

/** One baked paper area (see scripts/worlds/bake.mjs). Rings are flat [lon, lat, lon, lat, ...]. */
export interface Sheet { level: number; polys: number[][][] }
export interface Land {
  name: string
  west: number
  east: number
  south: number
  north: number
  levels: number[]
  sheets: Sheet[]
  lake?: Sheet
}
/** The procedural hero terraces: a unit square of sheets, and forest trees as [x, y, height, ...]. */
export interface TerraceModel { name: 'terraces'; levels: number[]; sheets: Sheet[]; trees: number[] }

const cache = new Map<string, Promise<unknown>>()

/** The baked files store rings as small integers from the area's south-west corner; turn them into lon/lat. */
function decode<T extends { west?: number; south?: number; q?: number; sheets: Sheet[]; lake?: Sheet }>(raw: T): T {
  if (!raw.q) return raw
  const q = raw.q, x0 = raw.west ?? 0, y0 = raw.south ?? 0
  const ring = (r: number[]) => r.map((v, i) => (i % 2 === 0 ? x0 + v * q : y0 + v * q))
  const sheet = (s: Sheet): Sheet => ({ level: s.level, polys: s.polys.map((p) => p.map(ring)) })
  return { ...raw, sheets: raw.sheets.map(sheet), lake: raw.lake ? sheet(raw.lake) : undefined }
}

export function loadLand(name: AreaName): Promise<Land>
export function loadLand(name: 'terraces'): Promise<TerraceModel>
export function loadLand(name: string): Promise<unknown> {
  let p = cache.get(name)
  if (!p) {
    p = fetch(`${import.meta.env.BASE_URL}worlds/${name}.json`).then((r) => {
      if (!r.ok) throw new Error(`worlds/${name}.json: ${r.status}`)
      return r.json()
    }).then(decode)
    cache.set(name, p)
  }
  return p
}

/** The paper for an area once it has loaded (null until then, and on failure: the page still reads). */
export function useLand(name: AreaName | null): Land | null {
  const [land, setLand] = useState<Land | null>(null)
  useEffect(() => {
    if (!name) return
    let live = true
    loadLand(name).then((l) => { if (live) setLand(l) }, () => { if (live) setLand(null) })
    return () => { live = false }
  }, [name])
  return land && name && land.name === name ? land : null
}

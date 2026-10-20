import { useEffect, useState } from 'react'

/** One sheet of the baked paper map (see scripts/worlds/bake.mjs). Rings are flat [lon, lat, lon, lat, ...]. */
export interface Sheet { level: number; polys: number[][][] }
export interface Land {
  name: string
  west: number
  east: number
  south: number
  north: number
  levels: number[]
  sheets: Sheet[]
  lakes?: Sheet
}

let pending: Promise<Land> | null = null

/** The baked file stores rings as small integers from the map's south-west corner; turn them into lon/lat. */
function decode(raw: Land & { q?: number; lake?: Sheet }): Land {
  const lakes = raw.lakes ?? raw.lake
  if (!raw.q) return { ...raw, lakes }
  const q = raw.q, x0 = raw.west, y0 = raw.south
  const ring = (r: number[]) => r.map((v, i) => (i % 2 === 0 ? x0 + v * q : y0 + v * q))
  const sheet = (s: Sheet): Sheet => ({ level: s.level, polys: s.polys.map((p) => p.map(ring)) })
  return { ...raw, sheets: raw.sheets.map(sheet), lakes: lakes ? sheet(lakes) : undefined }
}

/** The one paper map, fetched once. */
export function loadMap(): Promise<Land> {
  if (!pending) {
    pending = fetch(`${import.meta.env.BASE_URL}worlds/archipelago.json`).then((r) => {
      if (!r.ok) throw new Error(`worlds/archipelago.json: ${r.status}`)
      return r.json()
    }).then(decode)
    // a failed fetch may be tried again
    pending.catch(() => { pending = null })
  }
  return pending
}

/** The paper map once it has loaded (null until then, and on failure: the page still reads). */
export function useMap(): Land | null {
  const [land, setLand] = useState<Land | null>(null)
  useEffect(() => {
    let live = true
    loadMap().then((l) => { if (live) setLand(l) }, () => { if (live) setLand(null) })
    return () => { live = false }
  }, [])
  return land
}

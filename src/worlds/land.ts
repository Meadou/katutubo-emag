import { useEffect, useState } from 'react'

/**
 * One sheet of a baked paper map (see scripts/worlds/bake.mjs). Rings are flat [lon, lat, lon, lat, ...].
 * On the archipelago, `tags` names the region each land polygon belongs to (an index into `regions`, -1 if none).
 */
export interface Sheet { level: number; polys: number[][][]; tags?: number[] }
export interface Land {
  name: string
  west: number
  east: number
  south: number
  north: number
  levels: number[]
  /** the country's regions, by the index the sheets' tags use */
  regions?: string[]
  sheets: Sheet[]
  lakes?: Sheet
}

/** One province (or Davao City) of the Davao Region: a stack of sheets of its own, and the middle of its land. */
export interface Piece { key: string; name: string; lon: number; lat: number; sheets: Sheet[] }
export interface Region { name: string; west: number; east: number; south: number; north: number; levels: number[]; pieces: Piece[] }

type Raw<T> = T & { q?: number; west: number; south: number }

/** The baked files store rings as small integers from the map's south-west corner; turn them into lon/lat. */
function ringDecoder(raw: { q?: number; west: number; south: number }) {
  const q = raw.q, x0 = raw.west, y0 = raw.south
  const ring = (r: number[]) => (q ? r.map((v, i) => (i % 2 === 0 ? x0 + v * q : y0 + v * q)) : r)
  return (s: Sheet): Sheet => ({ ...s, polys: s.polys.map((p) => p.map(ring)) })
}

function decode(raw: Raw<Land> & { lake?: Sheet }): Land {
  const lakes = raw.lakes ?? raw.lake
  const sheet = ringDecoder(raw)
  return { ...raw, sheets: raw.sheets.map(sheet), lakes: lakes ? sheet(lakes) : undefined }
}

function decodeRegion(raw: Raw<Region>): Region {
  const sheet = ringDecoder(raw)
  return { ...raw, pieces: raw.pieces.map((p) => ({ ...p, sheets: p.sheets.map(sheet) })) }
}

function fetcher<R, T>(file: string, decoder: (raw: R) => T) {
  let pending: Promise<T> | null = null
  return (): Promise<T> => {
    if (!pending) {
      pending = fetch(`${import.meta.env.BASE_URL}worlds/${file}`).then((r) => {
        if (!r.ok) throw new Error(`worlds/${file}: ${r.status}`)
        return r.json() as Promise<R>
      }).then(decoder)
      // a failed fetch may be tried again
      pending.catch(() => { pending = null })
    }
    return pending
  }
}

/** The paper map of the whole country, fetched once. */
export const loadMap = fetcher('archipelago.json', decode)
/** The Davao Region's provinces as pieces of their own, fetched once. */
export const loadRegion = fetcher('davao.json', decodeRegion)

function useLoaded<T>(load: () => Promise<T>): T | null {
  const [v, setV] = useState<T | null>(null)
  useEffect(() => {
    let live = true
    load().then((l) => { if (live) setV(l) }, () => { if (live) setV(null) })
    return () => { live = false }
  }, [load])
  return v
}

/** The paper map once it has loaded (null until then, and on failure: the page still reads). */
export const useMap = () => useLoaded(loadMap)
/** The Davao pieces once they have loaded. */
export const useRegion = () => useLoaded(loadRegion)

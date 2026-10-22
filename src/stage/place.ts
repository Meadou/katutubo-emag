import type { Piece, Sheet } from '../worlds/land'
import type { MapBlend } from '../worlds/types'
import { journey } from '../worlds/engine'
import { groundAt, heightOf, levelAt, toX, toZ } from './paper'
import { pieceOffset } from './regions'

/** The map's sheets and the Davao pieces once they are laid, so the stage can ask where the ground is anywhere. */
export const laid: { sheets: Sheet[] | null; pieces: Piece[] | null } = { sheets: null, pieces: null }

const restCache = new Map<string, number>()
const pieceCache = new Map<string, number>()
const levelCache = new Map<string, number>()
const keyOf = (lon: number, lat: number) => `${lon.toFixed(3)}:${lat.toFixed(3)}`

function remember(cache: Map<string, number>, key: string, f: () => number) {
  let v = cache.get(key)
  if (v === undefined) {
    v = f()
    if (cache.size > 4000) cache.clear()
    cache.set(key, v)
  }
  return v
}

/** The Davao piece whose land holds a point when the pieces are at rest (null for the rest of the map and the sea). */
export function pieceAt(lon: number, lat: number): Piece | null {
  const pieces = laid.pieces
  if (!pieces) return null
  const i = remember(pieceCache, keyOf(lon, lat), () => pieces.findIndex((p) => levelAt(p.sheets, lon, lat) > -Infinity))
  return i >= 0 ? pieces[i] : null
}

/**
 * Where a point of the map is now, in world space: on a Davao piece it rides with the piece as it
 * lifts and parts; elsewhere it sits on the paper. About 100 m resolution; flat before the map is laid.
 */
export function placeOn(lon: number, lat: number, m: MapBlend | undefined = journey.current?.map) {
  const p = pieceAt(lon, lat)
  if (p && m) {
    const o = pieceOffset(p, m)
    const top = heightOf(remember(levelCache, `${p.key}:${keyOf(lon, lat)}`, () => levelAt(p.sheets, lon, lat)))
    return { x: toX(lon) + o.x, y: top + o.y, z: toZ(lat) + o.z }
  }
  const sheets = laid.sheets
  const y = sheets ? remember(restCache, keyOf(lon, lat), () => groundAt(sheets, lon, lat)) : 0
  return { x: toX(lon), y, z: toZ(lat) }
}

/** Height of the paper under a point, wherever its piece is now. */
export const groundHeight = (lon: number, lat: number) => placeOn(lon, lat).y

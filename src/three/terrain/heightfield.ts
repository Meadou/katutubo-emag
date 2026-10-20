import AREAS from './areas.json'

/** One baked elevation grid (see scripts/terrain/bake.mjs): row 0 is the north edge. */
export interface Area { name: string; west: number; east: number; south: number; north: number; min: number; max: number }
export interface Heightfield {
  area: Area
  w: number
  h: number
  /** elevation in metres, row-major from the north-west corner */
  metres: Float32Array
  /** bilinear elevation in metres at a longitude/latitude (sea level outside the area) */
  at(lon: number, lat: number): number
}

export type AreaName = keyof typeof AREAS
export const AREA = AREAS as Record<AreaName, Area>

/** Vertical exaggeration: real relief is invisible at archipelago scale (1 world unit = 1 degree ≈ 111 km). */
export const EXAGGERATION = 7
const KM_PER_DEG = 111
/** World-space height of an elevation; the sea floor is pressed nearly flat so islands rise out of a calm ground. */
export const toHeight = (m: number) => (m >= 0 ? m : m * 0.06) / (KM_PER_DEG * 1000) * EXAGGERATION

const cache = new Map<AreaName, Promise<Heightfield>>()

/** Loads and decodes a heightmap once (metres = R * 256 + G - 32768). */
export function loadHeightfield(name: AreaName): Promise<Heightfield> {
  let p = cache.get(name)
  if (!p) {
    p = decode(name).then((f) => (ready[name] = f))
    cache.set(name, p)
  }
  return p
}

async function decode(name: AreaName): Promise<Heightfield> {
  const img = new Image()
  img.src = `${import.meta.env.BASE_URL}terrain/${name}.png`
  await img.decode()
  const c = document.createElement('canvas')
  c.width = img.width
  c.height = img.height
  const g = c.getContext('2d', { willReadFrequently: true })!
  g.drawImage(img, 0, 0)
  const px = g.getImageData(0, 0, img.width, img.height).data
  const metres = new Float32Array(img.width * img.height)
  for (let i = 0; i < metres.length; i++) metres[i] = px[i * 4] * 256 + px[i * 4 + 1] - 32768
  return makeHeightfield(AREA[name], img.width, img.height, metres)
}

export function makeHeightfield(area: Area, w: number, h: number, metres: Float32Array): Heightfield {
  return {
    area, w, h, metres,
    at(lon, lat) {
      const u = ((lon - area.west) / (area.east - area.west)) * w - 0.5
      const v = ((area.north - lat) / (area.north - area.south)) * h - 0.5
      if (u < 0 || v < 0 || u > w - 1 || v > h - 1) return 0
      const i = Math.floor(u), j = Math.floor(v), fu = u - i, fv = v - j
      const i1 = Math.min(i + 1, w - 1), j1 = Math.min(j + 1, h - 1)
      const a = metres[j * w + i], b = metres[j * w + i1], c = metres[j1 * w + i], d = metres[j1 * w + i1]
      return (a * (1 - fu) + b * fu) * (1 - fv) + (c * (1 - fu) + d * fu) * fv
    },
  }
}

/** Fields that have finished loading, so per-frame code can ask for ground height without waiting. */
const ready: Partial<Record<AreaName, Heightfield>> = {}

/** Ground height (world units) at a longitude/latitude, from the finest field loaded there. */
export function groundAt(lon: number, lat: number): number {
  for (const name of ['salug', 'archipelago'] as AreaName[]) {
    const f = ready[name]
    if (!f) continue
    const a = f.area
    if (lon > a.west && lon < a.east && lat > a.south && lat < a.north) return toHeight(f.at(lon, lat))
  }
  return 0
}

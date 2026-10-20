// Bakes the 3D map's heightmaps from public Terrarium elevation tiles (AWS Open Data, "Terrain Tiles":
// SRTM, GMTED, ETOPO1 and other open sources). Run once: `node scripts/terrain/bake.mjs`.
// Output is an equirectangular grid matching toWorld() (x = lon - 122, z = -(lat - 12)), so a texel
// lines up with its longitude and latitude. Each pixel stores elevation in metres as
// R * 256 + G - 32768 (B unused), which the terrain shader decodes.
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(ROOT, 'scripts', 'terrain', '.cache')
const OUT = join(ROOT, 'public', 'terrain')
const TILE = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`

const AREAS = [
  // the whole archipelago, about 1.2 km per pixel
  // Sabah (Malaysian Borneo) falls inside this box; it is masked to open sea so only the Philippines rises.
  { name: 'archipelago', zoom: 7, w: 1024, h: 1580, west: 116.5, east: 127.0, south: 4.6, north: 20.8, mask: (lon, lat) => lon < 119.6 && lat < 7.45 },
  // the Salug (Davao) River valley and the Bukidnon–Davao uplands, about 120 m per pixel
  { name: 'salug', zoom: 11, w: 1024, h: 1152, west: 124.7, east: 125.7, south: 7.0, north: 8.125 },
]

const lon2x = (lon, z) => ((lon + 180) / 360) * 2 ** z
const lat2y = (lat, z) => {
  const r = (lat * Math.PI) / 180
  return ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * 2 ** z
}

async function tile(z, x, y) {
  const file = join(CACHE, `${z}-${x}-${y}.png`)
  if (!existsSync(file)) {
    const res = await fetch(TILE(z, x, y))
    if (!res.ok) throw new Error(`tile ${z}/${x}/${y}: ${res.status}`)
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  return PNG.sync.read(readFileSync(file))
}

async function bake(a) {
  const tiles = new Map()
  const get = async (x, y) => {
    const k = `${x},${y}`
    if (!tiles.has(k)) tiles.set(k, await tile(a.zoom, x, y))
    return tiles.get(k)
  }
  const out = new PNG({ width: a.w, height: a.h })
  let min = Infinity, max = -Infinity
  for (let j = 0; j < a.h; j++) {
    const lat = a.north - ((j + 0.5) / a.h) * (a.north - a.south)
    const ty = lat2y(lat, a.zoom)
    for (let i = 0; i < a.w; i++) {
      const lon = a.west + ((i + 0.5) / a.w) * (a.east - a.west)
      const tx = lon2x(lon, a.zoom)
      const t = await get(Math.floor(tx), Math.floor(ty))
      const px = Math.min(255, Math.floor((tx % 1) * 256)), py = Math.min(255, Math.floor((ty % 1) * 256))
      const s = (py * 256 + px) * 4
      let m = t.data[s] * 256 + t.data[s + 1] + t.data[s + 2] / 256 - 32768
      if (a.mask?.(lon, lat)) m = Math.min(m, -60)
      min = Math.min(min, m); max = Math.max(max, m)
      const v = Math.max(0, Math.min(65535, Math.round(m + 32768)))
      const o = (j * a.w + i) * 4
      out.data[o] = v >> 8
      out.data[o + 1] = v & 255
      out.data[o + 2] = 0
      out.data[o + 3] = 255
    }
  }
  // the source tiles carry a few single-pixel spikes; flatten any pixel 600 m above all of its neighbours
  const at = (i, j) => { const o = (j * a.w + i) * 4; return out.data[o] * 256 + out.data[o + 1] - 32768 }
  for (let j = 1; j < a.h - 1; j++) {
    for (let i = 1; i < a.w - 1; i++) {
      const n = [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)]
      if (at(i, j) - Math.max(...n) > 600) {
        const v = Math.round(n.reduce((x, y) => x + y) / 4 + 32768), o = (j * a.w + i) * 4
        out.data[o] = v >> 8; out.data[o + 1] = v & 255
      }
    }
  }
  max = -Infinity
  for (let o = 0; o < out.data.length; o += 4) max = Math.max(max, out.data[o] * 256 + out.data[o + 1] - 32768)
  writeFileSync(join(OUT, `${a.name}.png`), PNG.sync.write(out))
  return { name: a.name, west: a.west, east: a.east, south: a.south, north: a.north, min: Math.round(min), max: Math.round(max), tiles: tiles.size }
}

mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })
mkdirSync(join(ROOT, 'src', 'three', 'terrain'), { recursive: true })
const meta = {}
for (const a of AREAS) {
  const m = await bake(a)
  meta[m.name] = m
  console.log(m)
}
const info = {
  source: 'Terrain Tiles on AWS Open Data (Terrarium encoding): SRTM, GMTED2010, ETOPO1 and other open sources. https://registry.opendata.aws/terrain-tiles/',
  encoding: 'metres = R * 256 + G - 32768',
  areas: meta,
}
writeFileSync(join(OUT, 'terrain.json'), JSON.stringify(info, null, 2))
// the app imports the bounds at build time; the heightmaps stay in public/ and load on demand
writeFileSync(join(ROOT, 'src', 'three', 'terrain', 'areas.json'), JSON.stringify(meta, null, 2) + '\n')

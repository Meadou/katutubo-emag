// Bakes the paper map: one sheet of paper per contour of real elevation, for the whole archipelago,
// with Lake Lanao as a sheet of water. Run once: `node scripts/worlds/bake.mjs`.
//
// Elevation: Terrain Tiles on AWS Open Data (Terrarium encoding; SRTM, GMTED2010, ETOPO1 and other
// open sources), https://registry.opendata.aws/terrain-tiles/. Contours: d3-contour.
// Output, public/worlds/archipelago.json:
//   { name, west, east, south, north, q, levels, sheets: [{ level, polys: [[outer, hole, ...], ...] }], lakes? }
// Rings are flat integer arrays [x, y, x, y, ...]: degrees east of `west` and north of `south`, in
// steps of `q` degrees (the loader turns them back into lon/lat).
import { mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PNG } from 'pngjs'
import { contours } from 'd3-contour'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..')
const CACHE = join(ROOT, 'scripts', 'worlds', '.cache')
const OUT = join(ROOT, 'public', 'worlds')
const TILE = (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`

const MAP = {
  // the whole archipelago, about 1.2 km per sample; Sabah (Malaysian Borneo) is masked to sea
  name: 'archipelago', zoom: 7, w: 1024, h: 1580, west: 116.5, east: 127.0, south: 4.6, north: 20.8,
  mask: (lon, lat) => lon < 119.6 && lat < 7.45,
  levels: [-200, 1, 300, 700, 1200, 1800], tolerance: 1.1, minArea: 5, digits: 3, smooth: 1,
  // Lake Lanao, the lake of the Maranao ("people of the lake")
  lakeSeed: [124.25, 7.85],
}

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

/** Elevation grid in metres, row 0 at the north edge. */
async function grid(a) {
  const tiles = new Map()
  const get = async (x, y) => {
    const k = `${x},${y}`
    if (!tiles.has(k)) tiles.set(k, await tile(a.zoom, x, y))
    return tiles.get(k)
  }
  const m = new Float64Array(a.w * a.h)
  for (let j = 0; j < a.h; j++) {
    const lat = a.north - ((j + 0.5) / a.h) * (a.north - a.south)
    const ty = lat2y(lat, a.zoom)
    for (let i = 0; i < a.w; i++) {
      const lon = a.west + ((i + 0.5) / a.w) * (a.east - a.west)
      const tx = lon2x(lon, a.zoom)
      const t = await get(Math.floor(tx), Math.floor(ty))
      const px = Math.min(255, Math.floor((tx % 1) * 256)), py = Math.min(255, Math.floor((ty % 1) * 256))
      const s = (py * 256 + px) * 4
      let v = t.data[s] * 256 + t.data[s + 1] + t.data[s + 2] / 256 - 32768
      if (a.mask?.(lon, lat)) v = Math.min(v, -300)
      m[j * a.w + i] = v
    }
  }
  // the source carries spikes and voids; flatten any sample 600 m above or below all four neighbours,
  // a few times over so small clusters fill in from their edges
  const at = (i, j) => m[j * a.w + i]
  for (let pass = 0; pass < 6; pass++) {
    for (let j = 1; j < a.h - 1; j++) for (let i = 1; i < a.w - 1; i++) {
      const n = [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)]
      const v = at(i, j)
      if (v - Math.max(...n) > 600 || Math.min(...n) - v > 600) m[j * a.w + i] = n.reduce((x, y) => x + y) / 4
    }
  }
  return m
}

/** Douglas–Peucker on a closed ring of [x, y] points. */
function simplify(ring, tol) {
  if (ring.length < 8) return ring
  const keep = new Uint8Array(ring.length)
  keep[0] = keep[ring.length - 1] = 1
  const stack = [[0, ring.length - 1]]
  const t2 = tol * tol
  while (stack.length) {
    const [a, b] = stack.pop()
    const [ax, ay] = ring[a], [bx, by] = ring[b]
    const dx = bx - ax, dy = by - ay, len = dx * dx + dy * dy || 1
    let best = -1, bestD = t2
    for (let i = a + 1; i < b; i++) {
      const [px, py] = ring[i]
      const u = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / len))
      const qx = ax + u * dx - px, qy = ay + u * dy - py
      const d = qx * qx + qy * qy
      if (d > bestD) { bestD = d; best = i }
    }
    if (best > 0) { keep[best] = 1; stack.push([a, best], [best, b]) }
  }
  return ring.filter((_, i) => keep[i])
}

const pairs = (flat) => { const out = []; for (let i = 0; i < flat.length; i += 2) out.push([flat[i], flat[i + 1]]); return out }
const ringArea = (r) => {
  let s = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1])
  return s / 2
}

/**
 * Chaikin corner cutting on a closed ring: each pass rounds every corner, like a curve cut by hand.
 * Points on the edge of the grid stay put, so a sheet that fills a place's box keeps square corners
 * and meets the archipelago's paper there without a gap.
 */
function chaikin(ring, passes, w, h) {
  const fixed = ([x, y]) => x <= 0.5 || y <= 0.5 || x >= w - 0.5 || y >= h - 0.5
  let r = ring.slice(0, -1)
  for (let p = 0; p < passes; p++) {
    const out = []
    for (let i = 0; i < r.length; i++) {
      const a = r[i], b = r[(i + 1) % r.length]
      const [ax, ay] = a, [bx, by] = b
      out.push(fixed(a) ? a : [ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25])
      if (!fixed(b)) out.push([ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75])
    }
    r = out
  }
  return [...r, r[0]]
}

/** d3-contour MultiPolygons (grid space) → simplified, smoothed, rounded lon/lat polygons. */
function toPolys(multi, a, tol, minArea, digits, smooth = 0) {
  const f = 10 ** digits
  const lon = (x) => Math.round((x / a.w) * (a.east - a.west) * f)
  const lat = (y) => Math.round((1 - y / a.h) * (a.north - a.south) * f)
  const polys = []
  for (const poly of multi.coordinates) {
    const rings = []
    for (const [k, ring] of poly.entries()) {
      if (Math.abs(ringArea(ring)) < (k === 0 ? minArea : minArea * 2)) { if (k === 0) break; continue }
      let s = simplify(ring, tol)
      if (s.length < 4) { if (k === 0) break; continue }
      if (smooth) s = chaikin(s, smooth, a.w, a.h)
      rings.push(s.slice(0, -1).flatMap(([x, y]) => [lon(x), lat(y)]))
    }
    if (rings.length) polys.push(rings)
  }
  return polys
}

/** The flat water of a lake: everything connected to the seed at the seed's own elevation. */
function lakeMask(m, a) {
  const [slon, slat] = a.lakeSeed
  const si = Math.floor(((slon - a.west) / (a.east - a.west)) * a.w)
  const sj = Math.floor(((a.north - slat) / (a.north - a.south)) * a.h)
  const h0 = m[sj * a.w + si]
  const mask = new Float64Array(a.w * a.h)
  const q = [sj * a.w + si]
  mask[q[0]] = 1
  while (q.length) {
    const p = q.pop(), i = p % a.w, j = (p - i) / a.w
    for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const ni = i + di, nj = j + dj
      if (ni < 0 || nj < 0 || ni >= a.w || nj >= a.h) continue
      const n = nj * a.w + ni
      if (!mask[n] && Math.abs(m[n] - h0) <= 4) { mask[n] = 1; q.push(n) }
    }
  }
  return { mask, h0 }
}

async function bakeArea(a) {
  const m = await grid(a)
  let min = Infinity, max = -Infinity
  for (const v of m) { if (v < min) min = v; if (v > max) max = v }
  const c = contours().size([a.w, a.h]).thresholds(a.levels)(Array.from(m))
  const sheets = c.map((multi) => ({ level: multi.value, polys: toPolys(multi, a, a.tolerance, a.minArea, a.digits, a.smooth) }))
    .filter((s) => s.polys.length)
  const out = { name: a.name, west: a.west, east: a.east, south: a.south, north: a.north, q: 10 ** -a.digits, min: Math.round(min), max: Math.round(max), levels: sheets.map((s) => s.level), sheets }
  if (a.lakeSeed) {
    const { mask, h0 } = lakeMask(m, a)
    const [lake] = contours().size([a.w, a.h]).thresholds([0.5])(Array.from(mask))
    out.lakes = { level: Math.round(h0), polys: toPolys(lake, a, a.tolerance, a.minArea, a.digits, a.smooth) }
  }
  writeFileSync(join(OUT, `${a.name}.json`), JSON.stringify(out))
  const points = sheets.reduce((n, s) => n + s.polys.reduce((k, p) => k + p.reduce((q, r) => q + r.length / 2, 0), 0), 0)
  const lakeArea = out.lakes?.polys.reduce((k, p) => k + Math.abs(ringArea(pairs(p[0]))) * (a.digits ? 10 ** (-2 * a.digits) : 1), 0)
  return { name: a.name, min: out.min, max: out.max, sheets: sheets.length, points, lake: out.lakes?.level, lakeKm2: lakeArea && Math.round(lakeArea * 12300) }
}

mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })
console.log(await bakeArea(MAP))
writeFileSync(join(OUT, 'SOURCES.txt'), [
  'Elevation: Terrain Tiles on AWS Open Data (Terrarium encoding), built from SRTM, GMTED2010, ETOPO1 and other open sources.',
  'https://registry.opendata.aws/terrain-tiles/',
  'Contours: d3-contour.',
  '',
].join('\n'))

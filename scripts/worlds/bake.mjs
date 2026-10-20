// Bakes the paper worlds: one sheet of paper per contour of real elevation, for the archipelago and for
// each issue's region, plus the procedural hero terraces. Run once: `node scripts/worlds/bake.mjs`.
//
// Elevation: Terrain Tiles on AWS Open Data (Terrarium encoding; SRTM, GMTED2010, ETOPO1 and other
// open sources), https://registry.opendata.aws/terrain-tiles/. Contours: d3-contour.
// Output, in public/worlds/<area>.json:
//   { name, west, east, south, north, levels, sheets: [{ level, polys: [[outer, hole, ...], ...] }], lake? }
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

const AREAS = [
  {
    // the whole archipelago, about 1.2 km per sample; Sabah (Malaysian Borneo) is masked to sea
    name: 'archipelago', zoom: 7, w: 1024, h: 1580, west: 116.5, east: 127.0, south: 4.6, north: 20.8,
    mask: (lon, lat) => lon < 119.6 && lat < 7.45,
    levels: [-200, 1, 300, 700, 1200, 1800], tolerance: 1.1, minArea: 5, digits: 3, smooth: 1,
  },
  {
    // Ifugao: the Cordillera around Banaue, Kiangan and Mt Pulag
    name: 'cordillera', zoom: 11, w: 768, h: 768, west: 120.75, east: 121.45, south: 16.55, north: 17.25,
    step: 250, tolerance: 1.4, minArea: 30, digits: 4, smooth: 1,
  },
  {
    // Mangyan: the interior uplands of Mindoro, coast to coast
    name: 'mindoro', zoom: 11, w: 768, h: 768, west: 120.75, east: 121.45, south: 12.6, north: 13.3,
    levels: [-100, 1, 250, 550, 900, 1300, 1750, 2200], tolerance: 1.4, minArea: 30, digits: 4, smooth: 1,
  },
  {
    // T'boli: the highlands around Lake Sebu
    name: 'lakesebu', zoom: 12, w: 640, h: 640, west: 124.55, east: 124.85, south: 6.06, north: 6.36,
    step: 150, tolerance: 1.3, minArea: 30, digits: 4, smooth: 1, lakeSeed: [124.7, 6.21],
  },
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
  // the source carries a few single-sample spikes; flatten any sample 600 m above all four neighbours
  const at = (i, j) => m[j * a.w + i]
  for (let j = 1; j < a.h - 1; j++) for (let i = 1; i < a.w - 1; i++) {
    const n = [at(i - 1, j), at(i + 1, j), at(i, j - 1), at(i, j + 1)]
    if (at(i, j) - Math.max(...n) > 600) m[j * a.w + i] = n.reduce((x, y) => x + y) / 4
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

const ringArea = (r) => {
  let s = 0
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1])
  return s / 2
}

/** Chaikin corner cutting on a closed ring: each pass rounds every corner, like a curve cut by hand. */
function chaikin(ring, passes) {
  let r = ring.slice(0, -1)
  for (let p = 0; p < passes; p++) {
    const out = []
    for (let i = 0; i < r.length; i++) {
      const [ax, ay] = r[i], [bx, by] = r[(i + 1) % r.length]
      out.push([ax * 0.75 + bx * 0.25, ay * 0.75 + by * 0.25], [ax * 0.25 + bx * 0.75, ay * 0.25 + by * 0.75])
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
      if (smooth) s = chaikin(s, smooth)
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
  let levels = a.levels
  if (!levels) {
    levels = []
    for (let l = Math.ceil(Math.max(min, 1) / a.step) * a.step; l < max; l += a.step) levels.push(l)
  }
  const c = contours().size([a.w, a.h]).thresholds(levels)(Array.from(m))
  const sheets = c.map((multi) => ({ level: multi.value, polys: toPolys(multi, a, a.tolerance, a.minArea, a.digits, a.smooth) }))
    .filter((s) => s.polys.length)
  const out = { name: a.name, west: a.west, east: a.east, south: a.south, north: a.north, q: 10 ** -a.digits, min: Math.round(min), max: Math.round(max), levels: sheets.map((s) => s.level), sheets }
  if (a.lakeSeed) {
    const { mask, h0 } = lakeMask(m, a)
    const [lake] = contours().size([a.w, a.h]).thresholds([0.5])(Array.from(mask))
    out.lake = { level: Math.round(h0), polys: toPolys(lake, a, a.tolerance, a.minArea, a.digits, a.smooth) }
  }
  writeFileSync(join(OUT, `${a.name}.json`), JSON.stringify(out))
  const points = sheets.reduce((n, s) => n + s.polys.reduce((k, p) => k + p.reduce((q, r) => q + r.length / 2, 0), 0), 0)
  return { name: a.name, min: out.min, max: out.max, sheets: sheets.length, points, lake: out.lake?.level }
}

// ---------------------------------------------------------------------------------------------------
// The hero terraces: a procedural mountainside cut into many thin contour steps, the way Ifugao
// terraces follow the land, with forest (muyong) left standing on the crown. Not a survey of any one
// place; a deterministic model in a unit square.
function heroTerraces() {
  const N = 256
  let seed = 11
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  const lattice = Array.from({ length: 17 * 17 }, rnd)
  const noise = (x, y) => {
    const gx = x * 16, gy = y * 16, i = Math.floor(gx), j = Math.floor(gy), fx = gx - i, fy = gy - j
    const s = (t) => t * t * (3 - 2 * t)
    const v = (a, b) => lattice[(Math.min(16, b)) * 17 + Math.min(16, a)]
    const top = v(i, j) + (v(i + 1, j) - v(i, j)) * s(fx)
    const bot = v(i, j + 1) + (v(i + 1, j + 1) - v(i, j + 1)) * s(fx)
    return top + (bot - top) * s(fy)
  }
  const field = new Float64Array(N * N)
  for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
    const x = i / (N - 1), y = j / (N - 1)
    // a long ridge running across the square, a summit off-centre, and a valley folding into it
    const ridge = Math.exp(-(((y - 0.42 - 0.08 * Math.sin(x * 4)) ** 2) / 0.05))
    const summit = Math.exp(-(((x - 0.58) ** 2) / 0.05 + ((y - 0.4) ** 2) / 0.04))
    const valley = Math.exp(-(((x - 0.3) ** 2) / 0.004 + ((y - 0.72) ** 2) / 0.08)) * 0.35
    const edge = Math.min(1, Math.min(x, 1 - x, y, 1 - y) * 6)
    field[j * N + i] = (0.55 * ridge + 0.55 * summit - valley + 0.12 * (noise(x, y) - 0.5)) * edge
  }
  const levels = Array.from({ length: 30 }, (_, k) => 0.04 + k * 0.03)
  const box = { west: 0, east: 1, south: 0, north: 1, w: N, h: N }
  const sheets = contours().size([N, N]).thresholds(levels)(Array.from(field))
    .map((multi) => ({ level: Math.round(multi.value * 1000) / 1000, polys: toPolys(multi, box, 0.6, 3, 4, 2) }))
    .filter((s) => s.polys.length)
  // forest crown: trees stand where the land is above the last terraces
  const trees = []
  for (let k = 0; k < 20000 && trees.length < 270; k++) {
    const x = rnd(), y = rnd(), v = field[Math.floor((1 - y) * (N - 1)) * N + Math.floor(x * (N - 1))]
    if (v > 0.8) trees.push(Math.round(x * 1e4) / 1e4, Math.round(y * 1e4) / 1e4, Math.round(v * 1e3) / 1e3)
  }
  const out = { name: 'terraces', west: 0, south: 0, q: 1e-4, levels: sheets.map((s) => s.level), sheets, trees }
  writeFileSync(join(OUT, 'terraces.json'), JSON.stringify(out))
  return { name: 'terraces', sheets: sheets.length, trees: trees.length / 3 }
}

mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })
for (const a of AREAS) console.log(await bakeArea(a))
console.log(heroTerraces())
writeFileSync(join(OUT, 'SOURCES.txt'), [
  'Elevation: Terrain Tiles on AWS Open Data (Terrarium encoding), built from SRTM, GMTED2010, ETOPO1 and other open sources.',
  'https://registry.opendata.aws/terrain-tiles/',
  'Contours: d3-contour. terraces.json is a procedural model, not a survey of any place.',
  '',
].join('\n'))

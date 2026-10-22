// Bakes the paper map: one sheet of paper per contour of real elevation. Run once: `node scripts/worlds/bake.mjs`.
//
// Two files:
//  - public/worlds/archipelago.json: the whole archipelago, cut into its 17 regions with a groove of
//    shallow sea between them, with Lake Lanao as a sheet of water. The Davao Region's land is left out.
//  - public/worlds/davao.json: the Davao Region at four times the detail, one paper piece per province
//    (and Davao City), each a stack of sheets of its own, so the stage can lift and part them.
//
// Elevation: Terrain Tiles on AWS Open Data (Terrarium encoding; SRTM, GMTED2010, ETOPO1 and other
// open sources), https://registry.opendata.aws/terrain-tiles/. Contours: d3-contour.
// Boundaries: geoBoundaries gbOpen PHL ADM1/ADM2/ADM3 (simplified), from NAMRIA, PSA and OCHA
// Philippines, CC BY 3.0 IGO, https://www.geoboundaries.org/. Fetched once into the cache.
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
const BOUNDS = (level) => `https://www.geoboundaries.org/api/current/gbOpen/PHL/${level}/`

/** Below the land, above the shelf's cut: where a groove or the Davao hole lies, the shallow sea shows. */
const SHELF = -150

const MAP = {
  // the whole archipelago, about 1.2 km per sample; Sabah (Malaysian Borneo) is masked to sea
  name: 'archipelago', zoom: 7, w: 1024, h: 1580, west: 116.5, east: 127.0, south: 4.6, north: 20.8,
  mask: (lon, lat) => lon < 119.6 && lat < 7.45,
  levels: [-200, 1, 300, 700, 1200, 1800], tolerance: 1.1, minArea: 5, digits: 3, smooth: 1,
  // Lake Lanao, the lake of the Maranao ("people of the lake")
  lakeSeed: [124.25, 7.85],
  // samples on each side of a border that become sea, so neighbouring regions read as separate pieces
  groove: 2,
}

const DAVAO = {
  // the Davao Region, about 300 m per sample; the levels run up to Mount Apo
  name: 'davao', zoom: 9, w: 620, h: 1056, west: 124.95, east: 126.65, south: 5.2, north: 8.1,
  levels: [1, 250, 600, 1000, 1500, 2000, 2500], tolerance: 1.1, minArea: 6, digits: 4, smooth: 1,
  groove: 2,
}

/** The pieces of the Davao Region, in the order they are drawn. Davao City comes before Davao del Sur, which holds it in the source data. */
const PIECES = [
  { key: 'davao-city', name: 'Davao City', level: 'ADM3', source: 'Davao City' },
  { key: 'davao-del-norte', name: 'Davao del Norte', level: 'ADM2', source: 'Davao del Norte' },
  // renamed from Compostela Valley in 2019 (Republic Act 11297); the boundary data keeps the old name
  { key: 'davao-de-oro', name: 'Davao de Oro', level: 'ADM2', source: 'Compostela Valley' },
  { key: 'davao-oriental', name: 'Davao Oriental', level: 'ADM2', source: 'Davao Oriental' },
  { key: 'davao-occidental', name: 'Davao Occidental', level: 'ADM2', source: 'Davao Occidental' },
  { key: 'davao-del-sur', name: 'Davao del Sur', level: 'ADM2', source: 'Davao del Sur' },
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

/**
 * d3-contour MultiPolygons (grid space) → simplified, smoothed, rounded lon/lat polygons. With
 * `tagOf`, each kept polygon's tag (read from its outer ring in grid space) is pushed onto `tags`.
 */
function toPolys(multi, a, tol, minArea, digits, smooth = 0, tagOf = null, tags = null) {
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
    if (rings.length) {
      polys.push(rings)
      if (tagOf) tags.push(tagOf(poly[0]))
    }
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

/** A geoBoundaries level for the Philippines (simplified geometry), fetched once into the cache. */
async function boundaries(level) {
  const file = join(CACHE, 'boundaries', `PHL-${level}.geojson`)
  if (!existsSync(file)) {
    mkdirSync(dirname(file), { recursive: true })
    const meta = await (await fetch(BOUNDS(level))).json()
    const res = await fetch(meta.simplifiedGeometryGeoJSON)
    if (!res.ok) throw new Error(`boundaries ${level}: ${res.status}`)
    writeFileSync(file, Buffer.from(await res.arrayBuffer()))
  }
  return JSON.parse(readFileSync(file, 'utf8')).features
}

/** A feature's rings as [[lon, lat], ...] lists, outer rings and holes alike (the fill is even-odd). */
const ringsOf = (f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flat()

/** Paints each feature's label into the grid by scanline (-1 where none); a sample keeps the first label painted on it. */
function rasterize(a, features) {
  const labels = new Int16Array(a.w * a.h).fill(-1)
  for (const { rings, label } of features) {
    const edges = []
    let s = Infinity, n = -Infinity, w = Infinity, e = -Infinity
    for (const r of rings) {
      for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
        edges.push([r[j][0], r[j][1], r[i][0], r[i][1]])
        s = Math.min(s, r[i][1]); n = Math.max(n, r[i][1]); w = Math.min(w, r[i][0]); e = Math.max(e, r[i][0])
      }
    }
    if (n < a.south || s > a.north || e < a.west || w > a.east) continue
    for (let j = 0; j < a.h; j++) {
      const lat = a.north - ((j + 0.5) / a.h) * (a.north - a.south)
      if (lat < s || lat > n) continue
      const xs = []
      for (const [x1, y1, x2, y2] of edges) if (y1 > lat !== y2 > lat) xs.push(x1 + ((lat - y1) * (x2 - x1)) / (y2 - y1))
      xs.sort((p, q) => p - q)
      for (let k = 0; k + 1 < xs.length; k += 2) {
        const i0 = Math.max(0, Math.ceil(((xs[k] - a.west) / (a.east - a.west)) * a.w - 0.5))
        const i1 = Math.min(a.w - 1, Math.floor(((xs[k + 1] - a.west) / (a.east - a.west)) * a.w - 0.5))
        for (let i = i0; i <= i1; i++) if (labels[j * a.w + i] < 0) labels[j * a.w + i] = label
      }
    }
  }
  return labels
}

/**
 * Where the elevation's coast and the boundaries' coast disagree, a land sample no boundary covers
 * takes the label of the nearest labelled land, up to `reach` samples away.
 */
function fillCoast(a, m, labels, reach) {
  let front = []
  for (let p = 0; p < labels.length; p++) if (labels[p] >= 0 && m[p] > 0) front.push(p)
  for (let step = 0; step < reach && front.length; step++) {
    const next = []
    for (const p of front) {
      const i = p % a.w, j = (p - i) / a.w
      for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const ni = i + di, nj = j + dj
        if (ni < 0 || nj < 0 || ni >= a.w || nj >= a.h) continue
        const q = nj * a.w + ni
        if (labels[q] < 0 && m[q] > 0) { labels[q] = labels[p]; next.push(q) }
      }
    }
    front = next
  }
}

/** Land samples within `r` samples of land with another label: the cut between two pieces. */
function grooves(a, m, labels, r) {
  const cut = new Uint8Array(labels.length)
  for (let j = 0; j < a.h; j++) for (let i = 0; i < a.w; i++) {
    const p = j * a.w + i, l = labels[p]
    if (m[p] <= 0 || l < 0) continue
    search: for (let dj = -r; dj <= r; dj++) for (let di = -r; di <= r; di++) {
      if (di * di + dj * dj > r * r + 1) continue
      const ni = i + di, nj = j + dj
      if (ni < 0 || nj < 0 || ni >= a.w || nj >= a.h) continue
      const q = nj * a.w + ni
      if (m[q] > 0 && labels[q] >= 0 && labels[q] !== l) { cut[p] = 1; break search }
    }
  }
  return cut
}

/** The label a contour polygon stands on, by vote of the samples around its outer ring (d3-contour puts sample i at i + 0.5). */
const tagger = (a, m, labels, level) => (ring) => {
  const votes = new Map()
  for (const [x, y] of ring) {
    for (const cx of [Math.floor(x - 0.5), Math.ceil(x - 0.5)]) for (const cy of [Math.floor(y - 0.5), Math.ceil(y - 0.5)]) {
      if (cx < 0 || cy < 0 || cx >= a.w || cy >= a.h) continue
      const p = cy * a.w + cx
      if (m[p] >= level && labels[p] >= 0) votes.set(labels[p], (votes.get(labels[p]) ?? 0) + 1)
    }
  }
  let best = -1, most = 0
  for (const [l, c] of votes) if (c > most) { best = l; most = c }
  return best
}

const pointsOf = (sheets) => sheets.reduce((n, s) => n + s.polys.reduce((k, p) => k + p.reduce((q, r) => q + r.length / 2, 0), 0), 0)

/** The archipelago, cut into its regions, without the Davao Region's land. */
async function bakeArchipelago(a) {
  const m = await grid(a)
  let min = Infinity, max = -Infinity
  for (const v of m) { if (v < min) min = v; if (v > max) max = v }
  const adm1 = await boundaries('ADM1')
  const regions = adm1.map((f) => f.properties.shapeName)
  const labels = rasterize(a, adm1.map((f, k) => ({ rings: ringsOf(f), label: k })))
  fillCoast(a, m, labels, 6)
  const cut = grooves(a, m, labels, a.groove)
  const davao = regions.indexOf('Davao Region')
  if (davao < 0) throw new Error('no Davao Region in the boundaries')
  // the Davao Region's provinces are baked as pieces of their own (davao.json): here its land is shallow sea
  for (let p = 0; p < m.length; p++) if (m[p] > 0 && (cut[p] || labels[p] === davao)) m[p] = SHELF
  const c = contours().size([a.w, a.h]).thresholds(a.levels)(Array.from(m))
  const sheets = c.map((multi) => {
    const tags = []
    const polys = toPolys(multi, a, a.tolerance, a.minArea, a.digits, a.smooth, multi.value > 0 ? tagger(a, m, labels, multi.value) : null, tags)
    return multi.value > 0 ? { level: multi.value, polys, tags } : { level: multi.value, polys }
  }).filter((s) => s.polys.length)
  const out = { name: a.name, west: a.west, east: a.east, south: a.south, north: a.north, q: 10 ** -a.digits, min: Math.round(min), max: Math.round(max), levels: sheets.map((s) => s.level), regions, sheets }
  if (a.lakeSeed) {
    const { mask, h0 } = lakeMask(m, a)
    const [lake] = contours().size([a.w, a.h]).thresholds([0.5])(Array.from(mask))
    out.lakes = { level: Math.round(h0), polys: toPolys(lake, a, a.tolerance, a.minArea, a.digits, a.smooth) }
  }
  writeFileSync(join(OUT, `${a.name}.json`), JSON.stringify(out))
  const untagged = sheets.reduce((n, s) => n + (s.tags ?? []).filter((t) => t < 0).length, 0)
  return { name: a.name, min: out.min, max: out.max, sheets: sheets.length, points: pointsOf(sheets), untagged, lake: out.lakes?.level }
}

/** The Davao Region: one stack of sheets per province (and Davao City), with a groove around each. */
async function bakeDavao(a) {
  const m = await grid(a)
  const adm2 = await boundaries('ADM2'), adm3 = await boundaries('ADM3')
  const find = (fs, name) => {
    const f = fs.find((x) => x.properties.shapeName === name)
    if (!f) throw new Error(`no boundary named ${name}`)
    return f
  }
  const OUTSIDE = PIECES.length
  const feats = PIECES.map((p, k) => ({ rings: ringsOf(find(p.level === 'ADM3' ? adm3 : adm2, p.source)), label: k }))
  // every other province the grid reaches is "outside", so the coast fill does not spill across a border
  for (const f of adm2) if (!PIECES.some((p) => p.level === 'ADM2' && p.source === f.properties.shapeName)) feats.push({ rings: ringsOf(f), label: OUTSIDE })
  const labels = rasterize(a, feats)
  fillCoast(a, m, labels, 10)
  const cut = grooves(a, m, labels, a.groove)
  const f = 10 ** a.digits
  const pieces = PIECES.map((p, k) => {
    const v = new Float64Array(m.length)
    let sx = 0, sy = 0, n = 0
    for (let q = 0; q < m.length; q++) {
      const own = labels[q] === k && !cut[q]
      v[q] = own ? m[q] : -500
      if (own && m[q] > 0) { const i = q % a.w; sx += i; sy += (q - i) / a.w; n++ }
    }
    const sheets = contours().size([a.w, a.h]).thresholds(a.levels)(Array.from(v))
      .map((multi) => ({ level: multi.value, polys: toPolys(multi, a, a.tolerance, a.minArea, a.digits, a.smooth) }))
      .filter((s) => s.polys.length)
    // the middle of the piece's land: where its name is pinned, and the way it parts from the others
    const lon = a.west + ((sx / n + 0.5) / a.w) * (a.east - a.west)
    const lat = a.north - ((sy / n + 0.5) / a.h) * (a.north - a.south)
    return { key: p.key, name: p.name, lon: Math.round(lon * f) / f, lat: Math.round(lat * f) / f, sheets }
  })
  const out = { name: a.name, west: a.west, east: a.east, south: a.south, north: a.north, q: 10 ** -a.digits, levels: a.levels, pieces }
  writeFileSync(join(OUT, `${a.name}.json`), JSON.stringify(out))
  return { name: a.name, pieces: pieces.map((p) => `${p.name}: ${p.sheets.length} sheets, ${pointsOf(p.sheets)} points`) }
}

mkdirSync(CACHE, { recursive: true })
mkdirSync(OUT, { recursive: true })
console.log(await bakeArchipelago(MAP))
console.log(await bakeDavao(DAVAO))
writeFileSync(join(OUT, 'SOURCES.txt'), [
  'Elevation: Terrain Tiles on AWS Open Data (Terrarium encoding), built from SRTM, GMTED2010, ETOPO1 and other open sources.',
  'https://registry.opendata.aws/terrain-tiles/',
  'Contours: d3-contour.',
  'Boundaries of the regions, the provinces and Davao City: geoBoundaries (gbOpen PHL ADM1-ADM3, simplified), from the',
  'National Mapping and Resource Information Authority (NAMRIA), the Philippine Statistics Authority (PSA) and',
  'OCHA Philippines, licensed CC BY 3.0 IGO. https://www.geoboundaries.org/ ; https://data.humdata.org/dataset/cod-ab-phl',
  '',
].join('\n'))

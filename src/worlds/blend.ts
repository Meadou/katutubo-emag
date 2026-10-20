import type { Blended, Camera, WorldState } from './types'

const clamp01 = (x: number) => Math.min(1, Math.max(0, x))
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t
/** Smoothstep: eases in and out, so no transition ever moves at a constant rate. */
export const smooth = (t: number) => { const x = clamp01(t); return x * x * (3 - 2 * x) }

function hexToRgb(h: string): [number, number, number] {
  const n = parseInt(h.slice(1), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
const toHex = (c: number) => Math.round(Math.min(255, Math.max(0, c))).toString(16).padStart(2, '0')

export function mixColor(a: string, b: string, t: number): string {
  if (t <= 0) return a
  if (t >= 1) return b
  const [ar, ag, ab] = hexToRgb(a), [br, bg, bb] = hexToRgb(b)
  return `#${toHex(lerp(ar, br, t))}${toHex(lerp(ag, bg, t))}${toHex(lerp(ab, bb, t))}`
}

/** Reads a colour ramp at 0..1, so ramps of different lengths can be mixed sheet by sheet. */
export function sampleRamp(ramp: string[], u: number): string {
  if (ramp.length === 1) return ramp[0]
  const x = clamp01(u) * (ramp.length - 1)
  const i = Math.min(ramp.length - 2, Math.floor(x))
  return mixColor(ramp[i], ramp[i + 1], x - i)
}

function mixRamp(a: string[], b: string[], t: number): string[] {
  const n = Math.max(a.length, b.length)
  return Array.from({ length: n }, (_, i) => mixColor(sampleRamp(a, i / (n - 1)), sampleRamp(b, i / (n - 1)), t))
}

/** Shortest way round between two angles. */
function mixAngle(a: number, b: number, t: number) {
  const d = Math.atan2(Math.sin(b - a), Math.cos(b - a))
  return a + d * t
}

/** Distance mixes on a log scale, so nearby views blend at a steady pace. */
export function mixCamera(a: Camera, b: Camera, t: number): Camera {
  return {
    lon: lerp(a.lon, b.lon, t),
    lat: lerp(a.lat, b.lat, t),
    dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t)),
    tilt: lerp(a.tilt, b.tilt, t),
    yaw: mixAngle(a.yaw, b.yaw, t),
  }
}

/**
 * The zoom between two views of the map, on the smooth pan-and-zoom path of van Wijk and Nuij
 * ("Smooth and efficient zooming and panning", 2003): it rises just enough to keep both ends in
 * sight, so moving between two close places reads as zooming out on one map and back in.
 */
export function zoomCamera(a: Camera, b: Camera, t: number): Camera {
  const rho = Math.SQRT2
  // the view's width on the map is proportional to the distance
  const w0 = a.dist, w1 = b.dist
  const dx = b.lon - a.lon, dy = b.lat - a.lat
  const d2 = dx * dx + dy * dy
  let u: number, w: number
  if (d2 < 1e-10) {
    u = t
    w = w0 * Math.exp(Math.log(w1 / w0) * t)
  } else {
    const d1 = Math.sqrt(d2)
    const b0 = (w1 * w1 - w0 * w0 + rho ** 4 * d2) / (2 * w0 * rho * rho * d1)
    const b1 = (w1 * w1 - w0 * w0 - rho ** 4 * d2) / (2 * w1 * rho * rho * d1)
    const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0)
    const r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1)
    const s = t * ((r1 - r0) / rho)
    const c0 = Math.cosh(r0)
    u = (w0 / (rho * rho * d1)) * (c0 * Math.tanh(rho * s + r0) - Math.sinh(r0))
    w = (w0 * c0) / Math.cosh(rho * s + r0)
  }
  const e = smooth(t)
  return { lon: a.lon + u * dx, lat: a.lat + u * dy, dist: w, tilt: lerp(a.tilt, b.tilt, e), yaw: mixAngle(a.yaw, b.yaw, e) }
}

export function blendOf(w: WorldState): Blended {
  return {
    ...w,
    land: [...w.land],
    propWeights: Object.fromEntries(w.props.map((p) => [p, 1])),
    drift: w.still ? 0 : 1,
  }
}

/** The world between `a` (t = 0) and `b` (t = 1). */
export function mixWorld(a: WorldState, b: WorldState, t: number, camera = mixCamera(a.camera, b.camera, t)): Blended {
  if (t <= 0 && !('propWeights' in a)) return blendOf(a)
  if (t >= 1 && !('propWeights' in b)) return blendOf(b)
  const near = t < 0.5 ? a : b
  const propWeights: Record<string, number> = {}
  for (const p of a.props) propWeights[p] = (propWeights[p] ?? 0) + (1 - t)
  for (const p of b.props) propWeights[p] = (propWeights[p] ?? 0) + t
  return {
    sky: [mixColor(a.sky[0], b.sky[0], t), mixColor(a.sky[1], b.sky[1], t)],
    sun: {
      color: mixColor(a.sun.color, b.sun.color, t),
      intensity: lerp(a.sun.intensity, b.sun.intensity, t),
      azimuth: mixAngle(a.sun.azimuth, b.sun.azimuth, t),
      elevation: lerp(a.sun.elevation, b.sun.elevation, t),
    },
    ambient: lerp(a.ambient, b.ambient, t),
    land: mixRamp(a.land, b.land, t),
    sea: [mixColor(a.sea[0], b.sea[0], t), mixColor(a.sea[1], b.sea[1], t)],
    edge: mixColor(a.edge, b.edge, t),
    accent: mixColor(a.accent, b.accent, t),
    camera,
    still: near.still,
    props: near.props,
    site: near.site,
    people: near.people,
    pin: near.pin,
    propWeights,
    drift: lerp(a.still ? 0 : 1, b.still ? 0 : 1, t),
  }
}

/** A zoom eases in, moves fastest through the middle, and settles slowly at the end. */
const zoomCurve = (p: number) => { const x = Math.min(1, Math.max(0, p)); return x * x * x * (x * (x * 6 - 15) + 10) }

/** The world a section shows at its reading progress. Travel worlds zoom between their two ends on one path. */
export function resolveWorld(id: string, progress: number, worlds: Record<string, WorldState>): Blended | null {
  const w = worlds[id]
  if (!w) return null
  if (!w.travel) return blendOf(w)
  const a = worlds[w.travel.from], b = worlds[w.travel.to]
  if (!a || !b) return blendOf(w)
  const t = zoomCurve(progress)
  return mixWorld(a, b, t, zoomCamera(a.camera, b.camera, t))
}

/** Mixes two already-blended worlds (at the boundary between two sections). */
export function mixBlended(a: Blended, b: Blended, t: number): Blended {
  if (t <= 0) return a
  if (t >= 1) return b
  const m = mixWorld(a, b, t)
  const weights = (x: Record<string, number>, y: Record<string, number>) => {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(x)) out[k] = (out[k] ?? 0) + v * (1 - t)
    for (const [k, v] of Object.entries(y)) out[k] = (out[k] ?? 0) + v * t
    return out
  }
  m.propWeights = weights(a.propWeights, b.propWeights)
  m.drift = a.drift + (b.drift - a.drift) * t
  return m
}

/**
 * Exponential approach of `cur` toward `target` (critically damped, never linear). `k` is the rate:
 * about 63% of the way in 1/k seconds. Colours, light and camera all settle the same way.
 */
export function dampWorld(cur: Blended, target: Blended, k: number, dt: number): Blended {
  const f = 1 - Math.exp(-k * dt)
  const m = mixWorld(cur, target, f)
  m.propWeights = target.propWeights
  m.still = target.still
  m.props = target.props
  m.site = target.site
  m.people = target.people
  m.pin = target.pin
  return m
}

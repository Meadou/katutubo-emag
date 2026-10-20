import type { AreaName, Blended, Camera, WorldState } from './types'

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

/** Distance mixes on a log scale, so a fly-in from the whole archipelago to one valley reads as one steady dive. */
export function mixCamera(a: Camera, b: Camera, t: number): Camera {
  return {
    lon: lerp(a.lon, b.lon, t),
    lat: lerp(a.lat, b.lat, t),
    dist: Math.exp(lerp(Math.log(a.dist), Math.log(b.dist), t)),
    tilt: lerp(a.tilt, b.tilt, t),
    yaw: mixAngle(a.yaw, b.yaw, t),
  }
}

export function blendOf(w: WorldState): Blended {
  return {
    ...w,
    land: [...w.land],
    areaWeights: { [w.area]: 1 },
    propWeights: Object.fromEntries(w.props.map((p) => [p, 1])),
    drift: w.still ? 0 : 1,
  }
}

/** The world between `a` (t = 0) and `b` (t = 1). */
export function mixWorld(a: WorldState, b: WorldState, t: number): Blended {
  if (t <= 0) return blendOf(a)
  if (t >= 1) return blendOf(b)
  const near = t < 0.5 ? a : b
  const areaWeights: Partial<Record<AreaName, number>> = {}
  areaWeights[a.area] = (areaWeights[a.area] ?? 0) + (1 - t)
  areaWeights[b.area] = (areaWeights[b.area] ?? 0) + t
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
    camera: mixCamera(a.camera, b.camera, t),
    area: near.area,
    clouds: lerp(a.clouds, b.clouds, t),
    still: near.still,
    props: near.props,
    pin: near.pin,
    areaWeights,
    propWeights,
    drift: lerp(a.still ? 0 : 1, b.still ? 0 : 1, t),
  }
}

/** A dive eases in, falls fast through the middle, and settles slowly at the end. */
const diveCurve = (p: number) => { const x = Math.min(1, Math.max(0, p)); return x * x * x * (x * (x * 6 - 15) + 10) }

/**
 * The world a section shows at its reading progress. Travel worlds move between their two ends; the
 * cloud bank is densest exactly where the paper areas hand over, so the swap is never seen.
 */
export function resolveWorld(id: string, progress: number, worlds: Record<string, WorldState>): Blended | null {
  const w = worlds[id]
  if (!w) return null
  if (!w.travel) return blendOf(w)
  const a = worlds[w.travel.from], b = worlds[w.travel.to]
  if (!a || !b) return blendOf(w)
  const t = diveCurve(progress)
  const m = mixWorld(a, b, t)
  m.clouds = Math.max(m.clouds, Math.sin(Math.PI * t))
  return m
}

/** Mixes two already-blended worlds (used at the boundary between a travel section and its neighbour). */
export function mixBlended(a: Blended, b: Blended, t: number): Blended {
  if (t <= 0) return a
  if (t >= 1) return b
  const m = mixWorld(a, b, t)
  const weights = (x: Partial<Record<string, number>>, y: Partial<Record<string, number>>) => {
    const out: Record<string, number> = {}
    for (const [k, v] of Object.entries(x)) out[k] = (out[k] ?? 0) + (v ?? 0) * (1 - t)
    for (const [k, v] of Object.entries(y)) out[k] = (out[k] ?? 0) + (v ?? 0) * t
    return out
  }
  m.areaWeights = weights(a.areaWeights, b.areaWeights)
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
  // weights follow directly: they only fade behind the clouds, and must reach exactly 0 or 1
  m.areaWeights = target.areaWeights
  m.propWeights = target.propWeights
  m.area = target.area
  m.still = target.still
  m.props = target.props
  m.pin = target.pin
  return m
}

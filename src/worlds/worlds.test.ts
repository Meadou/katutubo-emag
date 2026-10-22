import { describe, expect, it } from 'vitest'
import { DEFAULT_MAP, blendOf, dampWorld, mapOf, mixCamera, mixColor, mixWorld, pathCamera, resolveWorld, sampleRamp, zoomCamera } from './blend'
import { readingProgress, worldAt, type SectionBox } from './sections'
import type { WorldState } from './types'

const base: WorldState = {
  sky: ['#000000', '#ffffff'],
  sun: { color: '#ffffff', intensity: 1, azimuth: 0, elevation: 0.5 },
  ambient: 0.5,
  land: ['#000000', '#ffffff'],
  sea: ['#000000', '#000000'],
  edge: '#ffffff',
  accent: '#ff0000',
  camera: { lon: 121, lat: 16.5, dist: 6, tilt: 0.5, yaw: 0 },
  still: false,
  props: [],
}
// a close view down over the Cordillera
const close: WorldState = { ...base, sky: ['#ffffff', '#000000'], camera: { lon: 121.06, lat: 16.92, dist: 0.5, tilt: 0.9, yaw: 0 }, still: true, props: ['spirits'] }

describe('blending worlds', () => {
  it('mixes colours and reads ramps of any length', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(sampleRamp(['#000000', '#ffffff', '#000000'], 0.5)).toBe('#ffffff')
    expect(sampleRamp(['#000000', '#ffffff'], 0.25)).toBe('#404040')
  })
  it('mixes nearby cameras on a log scale of distance', () => {
    const half = mixCamera(base.camera, { ...base.camera, dist: 0.06 }, 0.5)
    expect(half.dist).toBeCloseTo(0.6)
  })
  it('crosses props over and stills the camera as it enters a still world', () => {
    const m = mixWorld(close, { ...close, props: ['gong'], still: false }, 0.25)
    expect(m.propWeights).toEqual({ spirits: 0.75, gong: 0.25 })
    expect(m.drift).toBeCloseTo(0.25)
    expect(blendOf(close).drift).toBe(0)
  })
  it('damps toward the target exponentially, never overshooting', () => {
    const cur = blendOf(base), target = blendOf(close)
    const a = dampWorld(cur, target, 4, 1 / 60)
    expect(a.camera.dist).toBeLessThan(6)
    expect(a.camera.dist).toBeGreaterThan(0.5)
    let w = cur
    for (let i = 0; i < 600; i++) w = dampWorld(w, target, 4, 1 / 60)
    expect(w.camera.dist).toBeCloseTo(0.5, 3)
  })
})

describe('the zoom', () => {
  it('pans and zooms on one smooth path that starts and ends on its two views', () => {
    const a = { lon: 121.3, lat: 17.4, dist: 0.6, tilt: 0.9, yaw: 0 }
    const b = { lon: 121.35, lat: 16.15, dist: 0.6, tilt: 0.9, yaw: 0 }
    expect(zoomCamera(a, b, 0).lat).toBeCloseTo(17.4)
    expect(zoomCamera(a, b, 1).lat).toBeCloseTo(16.15)
    expect(zoomCamera(a, b, 1).dist).toBeCloseTo(0.6)
    // two close views far apart: the path rises to see both, like zooming out on a map and back in
    expect(zoomCamera(a, b, 0.5).dist).toBeGreaterThan(1)
  })
})

describe('sections', () => {
  const s: SectionBox[] = [
    { id: 'a', world: 'map', top: 0, height: 1000 },
    { id: 'b', world: 'fly', top: 1000, height: 2000 },
    { id: 'c', world: 'overview', top: 3000, height: 1000 },
  ]
  const vh = 800
  it('holds a world while its section is under the reading line', () => {
    expect(worldAt(s, 0, vh)).toEqual({ from: 'map', to: 'map', t: 0, index: 0, fromIndex: 0, toIndex: 0 })
    expect(worldAt(s, 1600, vh)).toEqual({ from: 'fly', to: 'fly', t: 0, index: 1, fromIndex: 1, toIndex: 1 })
  })
  it('hands over across a short eased zone at each boundary', () => {
    const mid = worldAt(s, 1000 - vh / 2, vh)
    expect(mid.from).toBe('map')
    expect(mid.to).toBe('fly')
    expect(mid.t).toBeCloseTo(0.5)
    expect(worldAt(s, 9999, vh).from).toBe('overview')
  })
  it('measures reading progress through a section', () => {
    expect(readingProgress(s[1], 1000 - vh / 2, vh)).toBe(0)
    expect(readingProgress(s[1], 2000 - vh / 2, vh)).toBeCloseTo(0.5)
    expect(readingProgress(s[1], 5000, vh)).toBe(1)
  })
})

describe('travel worlds (the zoom between places)', () => {
  const worlds = { map: base, place: close, zoom: { ...base, travel: { from: 'map', to: 'place' } } }
  it('starts and ends exactly on its neighbours, so the zoom has no seams', () => {
    expect(resolveWorld('zoom', 0, worlds)!.camera.dist).toBeCloseTo(6)
    expect(resolveWorld('zoom', 1, worlds)!.camera.dist).toBeCloseTo(0.5)
  })
  it('eases out of its start and into its end', () => {
    // a tenth of the way through, the camera has hardly left; nine tenths, it has nearly arrived
    expect(resolveWorld('zoom', 0.1, worlds)!.camera.dist).toBeGreaterThan(5.5)
    expect(resolveWorld('zoom', 0.9, worlds)!.camera.dist).toBeLessThan(0.6)
  })
})

describe('choreographed flights', () => {
  const keys = [
    { lon: 121.9, lat: 12.6, dist: 28, tilt: 0.18, yaw: 0 },
    { lon: 124.9, lat: 8.9, dist: 12, tilt: 0.34, yaw: 0.12 },
    { lon: 125.8, lat: 6.9, dist: 3.5, tilt: 0.78, yaw: 0.35 },
  ]
  it('passes through every key camera, starting and ending on its two views', () => {
    expect(pathCamera(keys, 0).dist).toBeCloseTo(28)
    expect(pathCamera(keys, 0.5).lat).toBeCloseTo(8.9)
    expect(pathCamera(keys, 1).dist).toBeCloseTo(3.5, 1)
  })
  it('turns the short way round between neighbouring yaws', () => {
    const turn = [{ ...keys[0], yaw: 3.0 }, { ...keys[2], yaw: -3.0 }]
    // from 3.0 to -3.0 is a small turn across ±π, not a whole spin back through 0
    expect(Math.abs(pathCamera(turn, 0.5).yaw)).toBeGreaterThan(3)
  })
  it('swells the clouds in the middle of a travel world and clears them at its ends', () => {
    const worlds = { a: base, b: close, fly: { ...base, travel: { from: 'a', to: 'b', via: [keys[1]] }, map: { clouds: 1 } } }
    expect(resolveWorld('fly', 0, worlds)!.map.clouds).toBeCloseTo(0)
    expect(resolveWorld('fly', 0.5, worlds)!.map.clouds).toBeCloseTo(1)
    expect(resolveWorld('fly', 1, worlds)!.map.clouds).toBeCloseTo(0)
  })
})

describe('the map in a world', () => {
  it('fills in a world with no map state of its own', () => {
    expect(mapOf(base)).toEqual({ ...DEFAULT_MAP, focus: {} })
  })
  it('hands the focus from one province to the next as a weight on each', () => {
    const a = { ...base, map: { focus: 'davao-del-norte', rise: 0.05 } }, b = { ...base, map: { focus: 'davao-de-oro', rise: 0.05 } }
    const m = mixWorld(a, b, 0.25).map
    expect(m.focus['davao-del-norte']).toBeCloseTo(0.75)
    expect(m.focus['davao-de-oro']).toBeCloseTo(0.25)
    expect(m.rise).toBeCloseTo(0.05)
  })
})

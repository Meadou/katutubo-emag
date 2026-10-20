import { describe, expect, it } from 'vitest'
import { dampWorld, mixCamera, mixColor, mixWorld, resolveWorld, sampleRamp, blendOf } from './blend'
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
  camera: { lon: 120, lat: 10, dist: 10, tilt: 0, yaw: 0 },
  area: 'archipelago',
  clouds: 0,
  still: false,
  props: [],
}
const night: WorldState = { ...base, sky: ['#ffffff', '#000000'], camera: { lon: 122, lat: 12, dist: 0.1, tilt: 1, yaw: 0 }, area: 'cordillera', still: true, props: ['spirits'] }

describe('blending worlds', () => {
  it('mixes colours and reads ramps of any length', () => {
    expect(mixColor('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(sampleRamp(['#000000', '#ffffff', '#000000'], 0.5)).toBe('#ffffff')
    expect(sampleRamp(['#000000', '#ffffff'], 0.25)).toBe('#404040')
  })
  it('flies the camera on a log scale, so the dive keeps a steady pace', () => {
    const half = mixCamera(base.camera, night.camera, 0.5)
    expect(half.dist).toBeCloseTo(1)
    expect(half.lon).toBeCloseTo(121)
  })
  it('cross-fades areas and props, and stills the camera as it enters a still world', () => {
    const m = mixWorld(base, night, 0.25)
    expect(m.areaWeights).toEqual({ archipelago: 0.75, cordillera: 0.25 })
    expect(m.propWeights).toEqual({ spirits: 0.25 })
    expect(m.drift).toBeCloseTo(0.75)
    expect(mixWorld(base, night, 1).drift).toBe(0)
  })
  it('damps toward the target exponentially, never overshooting', () => {
    const cur = blendOf(base), target = blendOf(night)
    const a = dampWorld(cur, target, 4, 1 / 60)
    expect(a.camera.dist).toBeLessThan(10)
    expect(a.camera.dist).toBeGreaterThan(0.1)
    let w = cur
    for (let i = 0; i < 600; i++) w = dampWorld(w, target, 4, 1 / 60)
    expect(w.camera.dist).toBeCloseTo(0.1, 3)
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

describe('travel worlds (the fly-in)', () => {
  const worlds = { map: base, overview: night, fly: { ...base, travel: { from: 'map', to: 'overview' } } }
  it('starts and ends exactly on its neighbours, so the dive has no seams', () => {
    expect(resolveWorld('fly', 0, worlds)!.camera.dist).toBeCloseTo(10)
    expect(resolveWorld('fly', 1, worlds)!.camera.dist).toBeCloseTo(0.1)
  })
  it('hides the paper swap inside the densest cloud', () => {
    const mid = resolveWorld('fly', 0.5, worlds)!
    expect(mid.areaWeights.archipelago).toBeCloseTo(0.5)
    expect(mid.clouds).toBeCloseTo(1)
    expect(resolveWorld('fly', 0, worlds)!.clouds).toBeCloseTo(0)
  })
})

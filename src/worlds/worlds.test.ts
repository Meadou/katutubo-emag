import { describe, expect, it } from 'vitest'
import { blendOf, dampWorld, detailAt, mixCamera, mixColor, mixWorld, resolveWorld, sampleRamp, zoomCamera } from './blend'
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
  area: 'archipelago',
  still: false,
  props: [],
}
// a close view inside the Cordillera's finer paper
const close: WorldState = { ...base, sky: ['#ffffff', '#000000'], camera: { lon: 121.06, lat: 16.92, dist: 0.5, tilt: 0.9, yaw: 0 }, area: 'cordillera', still: true, props: ['spirits'] }

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
  it('resolves a place\'s finer paper only when the camera is close to it', () => {
    expect(detailAt('cordillera', 0.5)).toBe(1)
    expect(detailAt('cordillera', 6)).toBe(0)
    const mid = detailAt('cordillera', 1.3)
    expect(mid).toBeGreaterThan(0)
    expect(mid).toBeLessThan(1)
    expect(detailAt('archipelago', 30)).toBe(1)
  })
  it('keeps the finer paper while the camera is still settling in a close world', () => {
    let w = blendOf(base)
    const target = blendOf(close)
    // the camera is still far: the place has not resolved yet, whatever the target says
    w = dampWorld(w, target, 4, 1 / 60)
    expect(w.areaWeights.cordillera ?? 0).toBeLessThan(0.05)
    for (let i = 0; i < 600; i++) w = dampWorld(w, target, 4, 1 / 60)
    expect(w.areaWeights.cordillera).toBeCloseTo(1)
    expect(w.areaWeights.archipelago).toBe(1)
  })
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
  it('wants the place it zooms to, and shows it only once close', () => {
    expect(resolveWorld('zoom', 0.5, worlds)!.area).toBe('cordillera')
    expect(resolveWorld('zoom', 0.1, worlds)!.areaWeights.cordillera ?? 0).toBe(0)
    expect(resolveWorld('zoom', 1, worlds)!.areaWeights.cordillera).toBeCloseTo(1)
  })
})

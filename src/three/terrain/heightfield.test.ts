import { describe, expect, it } from 'vitest'
import { makeHeightfield, toHeight } from './heightfield'

const area = { name: 't', west: 0, east: 2, south: 0, north: 2, min: 0, max: 300 }

describe('heightfield', () => {
  // 2x2 grid, row 0 = north: NW 0, NE 100, SW 200, SE 300
  const f = makeHeightfield(area, 2, 2, new Float32Array([0, 100, 200, 300]))
  it('reads texel centres by longitude and latitude', () => {
    expect(f.at(0.5, 1.5)).toBeCloseTo(0)
    expect(f.at(1.5, 1.5)).toBeCloseTo(100)
    expect(f.at(0.5, 0.5)).toBeCloseTo(200)
  })
  it('interpolates between texels and is sea level outside the area', () => {
    expect(f.at(1, 1)).toBeCloseTo(150)
    expect(f.at(5, 5)).toBe(0)
  })
  it('exaggerates land and presses the sea floor nearly flat', () => {
    expect(toHeight(1110)).toBeCloseTo(0.07)
    expect(Math.abs(toHeight(-1110))).toBeLessThan(0.01)
  })
})

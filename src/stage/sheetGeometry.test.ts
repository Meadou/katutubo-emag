import { describe, expect, it } from 'vitest'
import { buildSheet } from './sheetGeometry'

// a square sheet (lon/lat) with a square hole in it
const outer = [0, 0, 1, 0, 1, 1, 0, 1]
const hole = [0.4, 0.4, 0.6, 0.4, 0.6, 0.6, 0.4, 0.6]
const TOP = 0.1, THICK = 0.05
const s = buildSheet([[outer, hole]], TOP, THICK)

const vec = (i: number) => [s.position[i * 3], s.position[i * 3 + 1], s.position[i * 3 + 2]]
const nrm = (i: number) => [s.normal[i * 3], s.normal[i * 3 + 1], s.normal[i * 3 + 2]]
const sub = (a: number[], b: number[]) => a.map((v, k) => v - b[k])
const cross = (a: number[], b: number[]) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const faceNormal = (t: number) => {
  const [a, b, c] = [vec(s.index[t]), vec(s.index[t + 1]), vec(s.index[t + 2])]
  return cross(sub(b, a), sub(c, a))
}
// world x = lon - 122, z = -(lat - 12)
const centre = (lon: number, lat: number) => [lon - 122, 0, -(lat - 12)]

describe('a paper sheet', () => {
  it('is two draw groups: every top face first, then every wall', () => {
    // 8 wall edges, two triangles each; the square-with-a-hole top takes 8 triangles
    expect(s.capIndexCount).toBe(8 * 3)
    expect(s.index.length).toBe(s.capIndexCount + 8 * 6)
  })

  it('has its top faces pointing up, and no bottom (it is never seen)', () => {
    for (let t = 0; t < s.capIndexCount; t += 3) {
      expect(faceNormal(t)[1]).toBeGreaterThan(0)
      for (let k = 0; k < 3; k++) expect(vec(s.index[t + k])[1]).toBeCloseTo(TOP)
    }
  })

  it('has walls facing away from the paper: out of the outer edge, into the hole', () => {
    const outerC = centre(0.5, 0.5), holeC = centre(0.5, 0.5)
    for (let t = s.capIndexCount; t < s.index.length; t += 3) {
      const i = s.index[t]
      const n = nrm(i)
      // the triangle's winding agrees with its normal, so a single-sided material shows it
      expect(dot(faceNormal(t), n)).toBeGreaterThan(0)
      const mid = [0, 1, 2].map((k) => vec(s.index[t + k])).reduce((a, b) => a.map((v, j) => v + b[j] / 3), [0, 0, 0])
      const fromC = sub([mid[0], 0, mid[2]], outerC)
      const onHole = Math.abs(fromC[0]) < 0.11 && Math.abs(fromC[2]) < 0.11
      if (onHole) expect(dot(n, sub([mid[0], 0, mid[2]], holeC))).toBeLessThan(0)
      else expect(dot(n, fromC)).toBeGreaterThan(0)
    }
  })

  it('runs from its top down by its thickness', () => {
    let lo = Infinity, hi = -Infinity
    for (let i = 1; i < s.position.length; i += 3) { lo = Math.min(lo, s.position[i]); hi = Math.max(hi, s.position[i]) }
    expect(hi).toBeCloseTo(TOP)
    expect(lo).toBeCloseTo(TOP - THICK)
  })
})

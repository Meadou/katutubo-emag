import { describe, expect, it } from 'vitest'
import { paragraphStates } from './paragraphs'

const shown = (p: number, n: number) => paragraphStates(p, n).map((s) => Math.round(s.opacity * 100) / 100)

describe('a chapter\'s paragraphs, stepping in place', () => {
  it('opens on the first paragraph and ends on the last', () => {
    expect(shown(0, 4)[0]).toBe(1)
    expect(shown(1, 4)[3]).toBe(1)
  })

  it('shows one paragraph at a time while the reader is inside its part of the section', () => {
    for (const p of [0.2, 0.4, 0.6, 0.75]) expect(shown(p, 4).filter((o) => o === 1)).toHaveLength(1)
  })

  it('hands over by cross-fading, never with both gone or both full', () => {
    for (let p = 0; p <= 1; p += 0.005) {
      const ops = shown(p, 4)
      const sum = ops.reduce((a, b) => a + b, 0)
      expect(sum).toBeGreaterThan(0.95)
      expect(sum).toBeLessThan(1.05)
      expect(ops.filter((o) => o > 0).length).toBeLessThanOrEqual(2)
    }
  })

  it('moves through the paragraphs in order', () => {
    const current = (p: number) => shown(p, 5).indexOf(Math.max(...shown(p, 5)))
    let last = 0
    for (let p = 0; p <= 1; p += 0.02) { const c = current(p); expect(c).toBeGreaterThanOrEqual(last); last = c }
  })

  it('keeps a single paragraph on screen throughout, and handles a chapter with none', () => {
    expect(shown(0.5, 1)).toEqual([1])
    expect(paragraphStates(0.5, 0)).toEqual([])
  })
})

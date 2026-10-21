import { describe, expect, it } from 'vitest'
import { recedeAt } from './Recede'

describe('the chapter card receding', () => {
  it('stays put while the reader is still reading', () => {
    expect(recedeAt(0, false)).toEqual({ hidden: false, k: 0 })
    expect(recedeAt(0.55, false).k).toBe(0)
  })

  it('is gone once the section is read, and comes back only well below where it left', () => {
    expect(recedeAt(0.75, false).hidden).toBe(true)
    expect(recedeAt(1, true).hidden).toBe(true)
    expect(recedeAt(0.46, true).hidden).toBe(true)
    expect(recedeAt(0.45, true).hidden).toBe(false)
  })

  it('does not flicker for a reader resting between the two thresholds', () => {
    // 0.6 is in the band: whatever it was, it stays
    expect(recedeAt(0.6, true).hidden).toBe(true)
    expect(recedeAt(0.6, false).hidden).toBe(false)
  })

  it('fades across the band rather than snapping, and never passes fully opaque or transparent', () => {
    expect(recedeAt(0.65, false).k).toBeCloseTo(0.5, 5)
    for (const p of [0, 0.4, 0.5, 0.55, 0.6, 0.7, 0.75, 0.9, 1]) {
      const { k } = recedeAt(p, false)
      expect(k).toBeGreaterThanOrEqual(0)
      expect(k).toBeLessThanOrEqual(1)
    }
  })
})

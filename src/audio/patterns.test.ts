import { describe, expect, it } from 'vitest'
import { PITCHES, hitsAt, STEPS } from './patterns'

describe('the gong patterns', () => {
  it('tunes four flat gongs and five bossed gongs, as the two chapters name them', () => {
    expect(PITCHES.flat).toEqual([330, 370, 415, 466])
    expect(PITCHES.bossed).toEqual([196, 220, 262, 294, 330])
  })

  it('interlocks the flat gongs: every step is played by exactly one gong, and each keeps its own part', () => {
    for (let s = 0; s < STEPS; s++) expect(hitsAt('flat', s)).toHaveLength(1)
    const players = new Set(Array.from({ length: 8 }, (_, s) => hitsAt('flat', s)[0]))
    expect(players.size).toBe(4)
  })

  it('plays the bossed gongs as a tune on every other step, on gongs that exist', () => {
    for (let s = 0; s < STEPS; s++) {
      const hits = hitsAt('bossed', s)
      expect(hits).toHaveLength(s % 2 === 0 ? 1 : 0)
      for (const i of hits) expect(i).toBeLessThan(PITCHES.bossed.length)
    }
  })
})

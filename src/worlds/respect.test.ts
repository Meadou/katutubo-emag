import { describe, expect, it } from 'vitest'
import { groups, nextIssue } from '../content'
import { DESIGNS } from './issues'
import { issueWorlds } from './journeys'
import { isStillChapter } from './palettes'
import { resolveWorld } from './blend'
import { STILL_KEYS } from '../stage/props/registry'

// The respect rules, checked on the worlds themselves: sacred chapters are still, with nothing moving.
describe('beliefs and rituals worlds', () => {
  const finished = groups.filter((g) => !g.placeholder && DESIGNS[g.slug])

  it('exist for every finished issue', () => {
    expect(finished.map((g) => g.slug).sort()).toEqual(['ifugao', 'mangyan', 'tboli'])
  })

  for (const g of finished) {
    it(`are still in the ${g.name} issue`, () => {
      const worlds = issueWorlds(g, DESIGNS[g.slug], nextIssue(g.slug), 1.6)
      const still = g.chapters.filter((c) => isStillChapter(c.id))
      expect(still.length).toBeGreaterThan(0)
      for (const c of still) {
        const w = worlds[c.id]
        expect(w.still).toBe(true)
        for (const key of w.props) expect(STILL_KEYS.has(key)).toBe(true)
        // and the camera does not drift with the pointer while the reader is in it
        expect(resolveWorld(c.id, 0.5, worlds)?.drift).toBe(0)
      }
    })
  }
})

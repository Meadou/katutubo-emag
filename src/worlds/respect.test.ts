import { describe, expect, it } from 'vitest'
import { groups } from '../content'
import { buildJourney, chapterId, stopId } from './journeys'
import { isStillChapter } from './palettes'
import { resolveWorld } from './blend'
import { STILL_KEYS } from '../stage/props/registry'

// The respect and honesty rules, checked on the journey's worlds themselves.
describe('the journey', () => {
  const { worlds } = buildJourney(1.6)
  const finished = groups.filter((g) => !g.placeholder)

  it('keeps the myths still: they tell of beings the communities hold sacred', () => {
    expect(isStillChapter('myths-stories')).toBe(true)
    expect(isStillChapter('music')).toBe(false)
  })

  for (const g of finished) {
    it(`keeps every Myths and Beliefs world still in the ${g.name} issue`, () => {
      const still = g.chapters.filter((c) => isStillChapter(c.id))
      expect(still.length).toBeGreaterThan(0)
      for (const c of still) {
        const id = chapterId(g.slug, c.id)
        const w = worlds[id]
        expect(w.still).toBe(true)
        for (const key of w.props) expect(STILL_KEYS.has(key)).toBe(true)
        // and the camera does not drift with the pointer while the reader is in it
        expect(resolveWorld(id, 0.5, worlds)?.drift).toBe(0)
      }
    })
  }

  it('puts nothing on the land of a people whose issue is still being prepared', () => {
    for (const g of groups.filter((x) => x.placeholder)) expect(worlds[stopId(g.slug)].props, g.slug).toEqual([])
  })

  it("stands no object on the map outside a people's own chapters", () => {
    for (const [id, w] of Object.entries(worlds)) if (!id.startsWith('ch-') && !id.startsWith('stop-')) expect(w.props, id).toEqual([])
  })
})

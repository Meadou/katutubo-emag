import { describe, expect, it } from 'vitest'
import { groups } from '../content'
import { DESIGNS } from './issues'
import { buildJourney, chapterId } from './journeys'
import { isStillChapter } from './palettes'

// Labels sit on the visual, so they must not say anything the article does not.
describe('labels on the map', () => {
  const { worlds } = buildJourney(1.6)

  it('name an object only in its own chapter\'s words', () => {
    for (const g of groups.filter((x) => !x.placeholder)) {
      for (const [chapter, term] of Object.entries(DESIGNS[g.slug].labels ?? {})) {
        const c = g.chapters.find((x) => x.id === chapter)
        expect(c, `${g.slug}: no chapter ${chapter}`).toBeDefined()
        expect(c!.terms, `${g.slug}/${chapter}: "${term}"`).toContain(term)
      }
    }
  })

  it('leave still chapters without labels', () => {
    for (const g of groups.filter((x) => !x.placeholder)) {
      for (const c of g.chapters.filter((x) => isStillChapter(x.id))) expect(worlds[chapterId(g.slug, c.id)].labels ?? []).toEqual([])
    }
  })

  it('name each island group\'s three peoples at their places, each leading to its stop', () => {
    for (const r of ['luzon', 'visayas', 'mindanao']) {
      const labels = worlds[`region-${r}`].labels ?? []
      expect(labels).toHaveLength(3)
      for (const l of labels) expect(l.href).toBe(`#/group/${l.key}`)
    }
  })
})

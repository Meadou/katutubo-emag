import { describe, expect, it } from 'vitest'
import { PROVINCES, groups } from '../content'
import { THEMES } from '../content/traits'
import { DESIGNS } from './issues'
import { REGION_NAMES, buildJourney, carries, chapterId, compareId, provinceId } from './journeys'
import { isStillChapter } from './palettes'

// Labels sit on the visual, so they must not say anything the article does not.
describe('labels on the map', () => {
  const { worlds } = buildJourney(1.6)

  it('name an object only in its own chapter\'s words', () => {
    for (const g of groups.filter((x) => !x.placeholder)) {
      for (const [chapter, term] of Object.entries(DESIGNS[g.slug]?.labels ?? {})) {
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

  it('name each province\'s two peoples at their places, each leading to its stop', () => {
    for (const p of PROVINCES) {
      const labels = worlds[provinceId(p)].labels ?? []
      expect(labels.map((l) => l.key).sort()).toEqual(groups.filter((g) => g.province === p).map((g) => g.slug).sort())
      for (const l of labels) expect(l.href).toBe(`#/group/${l.key}`)
    }
  })

  it('print every province and Davao City on the arrival, and the province alone when it is in focus', () => {
    const arrival = worlds.introduction.names ?? []
    for (const p of PROVINCES) expect(arrival.map((n) => n.text)).toContain(p)
    expect(arrival.map((n) => n.text)).toContain('Davao City')
    for (const p of PROVINCES) expect((worlds[provinceId(p)].names ?? []).map((n) => n.text)).toEqual([p])
    expect(REGION_NAMES.filter((n) => n.kind === 'province')).toHaveLength(6)
  })

  it('light and label, in each comparison, exactly the peoples whose articles carry the theme, by their own names', () => {
    for (const t of THEMES) {
      const w = worlds[compareId(t.key)]
      const carrying = groups.filter((g) => carries(g, t) !== null)
      expect(w.lit ?? []).toEqual(carrying.map((g) => g.slug))
      expect((w.labels ?? []).map((l) => l.text)).toEqual(carrying.map((g) => carries(g, t)))
    }
  })
})

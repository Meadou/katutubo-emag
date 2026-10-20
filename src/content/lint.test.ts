import { describe, expect, it } from 'vitest'
import { groups } from '.'
import { ISLANDS, pointInIsland } from '../geo/archipelago'
import { OBJECTS } from '../stage/props/registry'

describe('content lint', () => {
  it('slugs are unique and url-safe', () => {
    const slugs = groups.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s, s).toMatch(/^[a-z0-9-]+$/)
  })
  it.each(groups.map((g) => [g.slug, g] as const))('%s is valid', (slug, g) => {
    expect(Object.keys(ISLANDS), `${slug}: unknown island "${g.island}"`).toContain(g.island)
    expect(pointInIsland(g.island, g.lon, g.lat), `${slug}: marker not on ${g.island}`).toBe(true)
    expect(g.color, slug).toMatch(/^#[0-9a-f]{6}$/i)
    if (!g.placeholder) {
      expect(g.chapters.length, `${slug}: no chapters`).toBeGreaterThan(0)
      expect(g.sources, `${slug}: no Sources section`).not.toBeNull()
      for (const c of g.chapters) expect(Object.keys(OBJECTS), `${slug}: unknown object "${c.object}"`).toContain(c.object)
    }
  })
  it('covers Luzon, Visayas and Mindanao', () => {
    expect(new Set(groups.map((g) => g.islandGroup))).toEqual(new Set(['Luzon', 'Visayas', 'Mindanao']))
  })
})

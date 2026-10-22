import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { PROVINCES, groups, rawFiles, rawProvince } from '.'
import { THEME_KEYS } from './traits'
import { OBJECTS } from '../stage/props/registry'
import { levelAt } from '../stage/paper'
import type { Sheet } from '../worlds/land'

// the Davao pieces as baked (scripts/worlds/bake.mjs), decoded to lon/lat, to check every pin lies on its own province
const raw = JSON.parse(readFileSync(join(process.cwd(), 'public', 'worlds', 'davao.json'), 'utf8')) as {
  west: number; south: number; q: number; pieces: { key: string; sheets: Sheet[] }[]
}
const pieces = Object.fromEntries(raw.pieces.map((p) => [p.key, p.sheets.map((s) => ({
  ...s, polys: s.polys.map((poly) => poly.map((r) => r.map((v, i) => (i % 2 === 0 ? raw.west : raw.south) + v * raw.q))),
}))]))

/** In-text citations, "(Benedict, 1916)" or "(Cole, 1913, p. 54)": a surname and a year. */
const citations = (html: string) => [...html.replace(/<[^>]+>/g, '').matchAll(/\(([A-Z][\p{L}'’-]+)(?: et al\.| (?:and|&) [A-Z][\p{L}'’-]+)?, (\d{4})[a-z]?(?:, pp?\. [\d–-]+)?\)/gu)]
  .map((m) => ({ author: m[1], year: m[2] }))

describe('content lint', () => {
  it('slugs are unique and url-safe', () => {
    const slugs = groups.map((g) => g.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
    for (const s of slugs) expect(s, s).toMatch(/^[a-z0-9-]+$/)
  })

  it('names a province of the Davao Region in every file, spelled as the region spells it', () => {
    for (const [file, text] of Object.entries(rawFiles)) expect(PROVINCES, `${file}: province "${rawProvince(text)}"`).toContain(rawProvince(text))
  })

  it('has two peoples in each of the five provinces', () => {
    for (const p of PROVINCES) expect(groups.filter((g) => g.province === p).map((g) => g.slug), p).toHaveLength(2)
  })

  it.each(groups.map((g) => [g.slug, g] as const))('%s is valid', (slug, g) => {
    expect(pieces[g.provinceKey], `${slug}: no map piece for ${g.province}`).toBeDefined()
    expect(levelAt(pieces[g.provinceKey], g.lon, g.lat), `${slug}: pin not on ${g.province}`).toBeGreaterThan(-Infinity)
    expect(g.color, slug).toMatch(/^#[0-9a-f]{6}$/i)
    for (const t of g.themes) expect(THEME_KEYS, `${slug}: unknown theme "${t}"`).toContain(t)
    for (const i of g.instruments) {
      expect(THEME_KEYS, `${slug}: unknown instrument trait "${i.trait}"`).toContain(i.trait)
      expect(i.name, `${slug}: ${i.trait} has no name`).not.toBe('')
    }
    if (!g.placeholder) {
      // the rubric's two subjects: every finished people has its myths and stories, and its music
      expect(g.chapters.map((c) => c.id), slug).toEqual(expect.arrayContaining(['myths-stories', 'music']))
      expect(g.sources, `${slug}: no Sources section`).not.toBeNull()
      for (const c of g.chapters) expect(Object.keys(OBJECTS), `${slug}: unknown object "${c.object}"`).toContain(c.object)
      // every in-text citation names a source listed under Sources, by its author and year
      for (const c of g.chapters) {
        for (const { author, year } of citations(c.html)) {
          expect(g.sources, `${slug}/${c.id}: (${author}, ${year}) is not in Sources`).toContain(author)
          expect(g.sources, `${slug}/${c.id}: (${author}, ${year}) is not in Sources`).toContain(year)
        }
      }
    }
  })
})

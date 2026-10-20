import { describe, expect, it } from 'vitest'
import { nextIssue, parseGroup, sceneObjectKeys } from '.'

const RAW = `---
name: Test People
island: Panay
lon: 122.2
lat: 11.2
objects: loom, gong
draft: true
---

## Overview
Hello **world**.

## Music
Gongs.

## Crafts
Weaving.

## Sources
- A book
`

describe('parseGroup', () => {
  it('splits ## headings into chapters and pulls Sources out', () => {
    const g = parseGroup(RAW)
    expect(g.chapters.map((c) => c.title)).toEqual(['Overview', 'Music', 'Crafts'])
    expect(g.chapters[0].html).toContain('<strong>world</strong>')
    expect(g.sources).toContain('<li>A book</li>')
  })
  it('cycles the objects list across chapters', () => {
    expect(parseGroup(RAW).chapters.map((c) => c.object)).toEqual(['loom', 'gong', 'loom'])
  })
  it('derives slug, island group and draft flag', () => {
    const g = parseGroup(RAW)
    expect(g.slug).toBe('test-people')
    expect(g.islandGroup).toBe('Visayas')
    expect(g.draft).toBe(true)
  })
  it('handles CRLF line endings', () => {
    const g = parseGroup(RAW.replace(/\n/g, '\r\n'))
    expect(g.name).toBe('Test People')
    expect(g.chapters.map((c) => c.title)).toEqual(['Overview', 'Music', 'Crafts'])
    expect(g.sources).toContain('A book')
  })
})

const make = (slug: string, placeholder = false) =>
  parseGroup(`---\nname: ${slug}\nslug: ${slug}\n${placeholder ? 'placeholder: true\n' : ''}---\n\n## Overview\nx\n\n## Sources\n- y\n`)

describe('placeholders', () => {
  it('ignores the body of a placeholder', () => {
    const p = make('p', true)
    expect(p.placeholder).toBe(true)
    expect(p.chapters).toEqual([])
    expect(p.sources).toBeNull()
    expect(make('a').placeholder).toBe(false)
  })
})

describe('nextIssue', () => {
  const [a, p1, b, p2] = [make('a'), make('p1', true), make('b'), make('p2', true)]
  const list = [a, p1, b, p2]
  it('nextIssue skips placeholders and wraps', () => {
    expect(nextIssue('a', list)?.slug).toBe('b')
    expect(nextIssue('b', list)?.slug).toBe('a')
    expect(nextIssue('p1', list)?.slug).toBe('b')
    expect(nextIssue('p2', list)?.slug).toBe('a')
  })
  it('returns null when there is no other finished issue', () => {
    expect(nextIssue('a', [a, p1])).toBeNull()
    expect(nextIssue('p1', [a, p1])?.slug).toBe('a')
    expect(nextIssue('nope', list)).toBeNull()
  })
})

describe('sceneObjectKeys', () => {
  it('dedupes chapter objects in order, spirits for placeholders', () => {
    expect(sceneObjectKeys(parseGroup(RAW))).toEqual(['loom', 'gong'])
    expect(sceneObjectKeys(make('p', true))).toEqual(['spirits'])
  })
})

describe('coordinates', () => {
  it('leaves missing lat/lon as NaN so content lint rejects them', () => {
    const g = parseGroup('---\nname: Lost\nisland: Panay\n---\n')
    expect(Number.isNaN(g.lat)).toBe(true)
    expect(Number.isNaN(g.lon)).toBe(true)
  })
})

describe('chapter terms', () => {
  it("collects each chapter's bold terms, in order and without duplicates", () => {
    const g = parseGroup('---\nname: T\n---\n\n## Music\nThe **gangsa** and the **bangibang**, then **gangsa** again.\n\n## Crafts\nNo bold here.\n')
    expect(g.chapters[0].terms).toEqual(['gangsa', 'bangibang'])
    expect(g.chapters[1].terms).toEqual([])
  })
})

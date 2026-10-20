import { describe, expect, it } from 'vitest'
import { parseGroup } from '.'

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

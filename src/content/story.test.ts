import { describe, expect, it } from 'vitest'
import { parseStory, stageFor } from './story'

const RAW = `---
slug: test-story
title: A test journey
peoples: manobo, matigsalug
anchor: 7.5, 125.1
starts: manobo 1, matigsalug 2
draft: true
---

## Mindanao
@shot: 7.9, 125.0, 3, 0.5
@cards: Manobo, Bukidnon
The **Manobo** peoples live across Mindanao.

- **Manobo**: a family of related peoples

## The hero sets out
@shot: 7.5, 125.1, 0.4, 0.8
@figure: hero | 0.01, -0.02 | walk
@figure: elder | 0, 0 | listen | wrap
@instrument: agung | 0.005, 0.01
@light: 0.02, 0.02 | rise
The hero walks.

## Sources
- A book
`

describe('parseStory', () => {
  const s = parseStory(RAW)
  it('reads frontmatter, steps and sources', () => {
    expect(s.slug).toBe('test-story')
    expect(s.peoples).toEqual(['manobo', 'matigsalug'])
    expect(s.anchor).toEqual({ lat: 7.5, lon: 125.1 })
    expect(s.steps.map((x) => x.title)).toEqual(['Mindanao', 'The hero sets out'])
    expect(s.sources).toContain('A book')
    expect(s.starts).toEqual({ manobo: 0, matigsalug: 1 })
  })
  it('splits each step into text for the left, facts for the right, and directives for the stage', () => {
    const [a] = s.steps
    expect(a.shot).toEqual({ lat: 7.9, lon: 125.0, dist: 3, tilt: 0.5 })
    expect(a.cards).toEqual(['Manobo', 'Bukidnon'])
    expect(a.html).toContain('<strong>Manobo</strong> peoples')
    expect(a.html).not.toContain('a family of related peoples')
    expect(a.facts).toEqual([{ term: 'Manobo', gloss: 'a family of related peoples' }])
  })
  it('places figures and instruments relative to the anchor', () => {
    const stage = stageFor(s, 1)
    expect(stage.figures).toEqual([
      { id: 'hero', lat: 7.51, lon: 125.08, pose: 'walk', wrap: false, mallet: false, plays: undefined },
      { id: 'elder', lat: 7.5, lon: 125.1, pose: 'listen', wrap: true, mallet: false, plays: undefined },
    ])
    expect(stage.instruments).toEqual([{ kind: 'agung', lat: 7.505, lon: 125.11, facing: undefined }])
    expect(stage.light).toEqual({ lat: 7.52, lon: 125.12, rise: true })
  })
  it('rejects unknown poses and instruments, naming the step', () => {
    expect(() => parseStory(RAW.replace('| walk', '| fly'))).toThrow(/The hero sets out.*fly/)
    expect(() => parseStory(RAW.replace('@instrument: agung', '@instrument: drum'))).toThrow(/drum/)
  })
})

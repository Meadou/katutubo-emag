import { describe, expect, it } from 'vitest'
import { frameAt, tabbable } from './Recede'

describe('a section\'s frame', () => {
  it('is out of sight before its section, and fades in place as the section begins', () => {
    expect(frameAt(0, false)).toMatchObject({ hidden: true, k: 1 })
    const half = frameAt(0.04, false)
    expect(half.k).toBeGreaterThan(0)
    expect(half.k).toBeLessThan(1)
    expect(half.dir).toBe(1)
    expect(frameAt(0.1, false)).toMatchObject({ hidden: false, k: 0 })
  })

  it('holds still and fully readable while its section is read', () => {
    for (const p of [0.2, 0.5, 0.8]) expect(frameAt(p, false).k).toBe(0)
  })

  it('fades away as the journey continues, across a band rather than at once', () => {
    const going = frameAt(0.9, false)
    expect(going.k).toBeGreaterThan(0)
    expect(going.k).toBeLessThan(1)
    expect(going.dir).toBe(-1)
    expect(frameAt(0.97, false).hidden).toBe(true)
    expect(frameAt(1, true).hidden).toBe(true)
  })

  it('does not flicker for a reader resting near the end: once gone, it returns only well above', () => {
    expect(frameAt(0.9, true).hidden).toBe(true)
    expect(frameAt(0.81, true).hidden).toBe(true)
    expect(frameAt(0.8, true).hidden).toBe(false)
  })

  it('can be there from the start (the cover) or stay to the end (the last screen)', () => {
    expect(frameAt(0, false, { enter: false })).toMatchObject({ hidden: false, k: 0 })
    expect(frameAt(1, false, { exit: false })).toMatchObject({ hidden: false, k: 0 })
  })

  it('never goes past fully shown or fully gone', () => {
    for (const p of [0, 0.03, 0.08, 0.5, 0.86, 0.9, 0.97, 1]) {
      const { k } = frameAt(p, false)
      expect(k).toBeGreaterThanOrEqual(0)
      expect(k).toBeLessThanOrEqual(1)
    }
  })
})

describe('a frame out of sight', () => {
  it('takes its controls out of the Tab order and puts them back as they were, keeping its words', () => {
    const root = document.createElement('div')
    root.innerHTML = '<a href="#/x">a</a><button>b</button><span tabindex="0">c</span><p>words</p>'
    const marks = () => [...root.querySelectorAll('a, button, span')].map((e) => e.getAttribute('tabindex'))
    tabbable(root, false)
    expect(marks()).toEqual(['-1', '-1', '-1'])
    tabbable(root, false)
    tabbable(root, true)
    expect(marks()).toEqual([null, null, '0'])
    expect(root.textContent).toBe('abcwords')
  })
})

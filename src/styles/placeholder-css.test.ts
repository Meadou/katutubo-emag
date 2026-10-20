import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const css = readFileSync(resolve(import.meta.dirname, 'global.css'), 'utf8')

describe('placeholder styles', () => {
  it('mute placeholders with colour, not opacity (keeps small text at WCAG AA contrast)', () => {
    const block = css.slice(css.indexOf('/* "Coming soon" placeholder issues'))
    expect(block).toContain('.card__soon')
    expect(block).not.toMatch(/opacity\s*:/)
  })
})

import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

// (read from disk: the test runner does not load CSS)
const tokens = readFileSync('src/styles/tokens.css', 'utf8')
const journey = readFileSync('src/styles/journey.css', 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')

const token = (name: string) => {
  const m = tokens.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!m) throw new Error(`no --${name}`)
  return m[1]
}
const luminance = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}

describe('text on paper', () => {
  for (const ink of ['ink', 'ink-soft']) {
    for (const paper of ['paper', 'paper-deep']) {
      it(`--${ink} on --${paper} meets AA (4.5:1)`, () => {
        expect(contrast(token(ink), token(paper))).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})

describe('"Coming soon" placeholders', () => {
  it('are muted by colour, never by opacity', () => {
    const rules = journey.match(/[^{}]*(is-soon|issue--soon)[^{}]*\{[^}]*\}/g) ?? []
    expect(rules.length).toBeGreaterThan(0)
    for (const r of rules) expect(r).not.toMatch(/opacity/)
  })
})

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
/** An `rgba(r, g, b, a)` scrim token, as [r, g, b, a] with channels 0-255. */
const rgba = (name: string): [number, number, number, number] => {
  const m = tokens.match(new RegExp(`--${name}:\\s*rgba\\(\\s*(\\d+),\\s*(\\d+),\\s*(\\d+),\\s*([\\d.]+)\\s*\\)`))
  if (!m) throw new Error(`no --${name} (expected rgba(...))`)
  return [+m[1], +m[2], +m[3], +m[4]]
}
const luminance = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const contrast = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x)
  return (hi + 0.05) / (lo + 0.05)
}
/** A translucsent scrim laid over a ground colour: what the eye actually reads. */
const over = (scrim: [number, number, number, number], ground: string) => {
  const [r, g, b, a] = scrim
  const hex = (v: number) => Math.round(v).toString(16).padStart(2, '0')
  const base = [1, 3, 5].map((i) => parseInt(ground.slice(i, i + 2), 16))
  return `#${[r, g, b].map((c, i) => hex(c * a + base[i] * (1 - a))).join('')}`
}
const rgbHex = ([r, g, b]: number[]) => `#${[r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('')}`

describe('text on paper', () => {
  for (const ink of ['ink', 'ink-soft']) {
    for (const paper of ['paper', 'paper-deep']) {
      it(`--${ink} on --${paper} meets AA (4.5:1)`, () => {
        expect(contrast(token(ink), token(paper))).toBeGreaterThanOrEqual(4.5)
      })
    }
  }
})

/**
 * Bare ink sits on the world, so the scrim is what the reader actually reads against. The grounds
 * below are the darkest land and sky in palettes.ts (night: #24304c, #101a2c) — the worst case in
 * the whole journey. If the scrim holds there, it holds everywhere.
 */
describe('bare ink on the world', () => {
  const DARKEST_LAND = '#24304c'
  const DARKEST_SKY = '#101a2c'
  for (const ink of ['ink', 'ink-soft']) {
    it(`--${ink} over --scrim-land holds AA on the darkest land`, () => {
      expect(contrast(token(ink), over(rgba('scrim-land'), DARKEST_LAND))).toBeGreaterThanOrEqual(4.5)
    })
    it(`--${ink} over --scrim-sky holds AA on the darkest sky`, () => {
      expect(contrast(token(ink), over(rgba('scrim-sky'), DARKEST_SKY))).toBeGreaterThanOrEqual(4.5)
    })
  }
  it('the scrims are translucent, so the world still shows through', () => {
    for (const s of ['scrim-land', 'scrim-sky']) expect(rgba(s)[3]).toBeLessThan(1)
  })
})

describe('"Coming soon" placeholders', () => {
  it('are muted by colour, never by opacity', () => {
    const rules = journey.match(/[^{}]*(is-soon|issue--soon)[^{}]*\{[^}]*\}/g) ?? []
    expect(rules.length).toBeGreaterThan(0)
    for (const r of rules) expect(r).not.toMatch(/opacity/)
  })
})

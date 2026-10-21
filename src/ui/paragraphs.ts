/** Where in its section a chapter's body starts and stops stepping (after the frame fades in, before it goes). */
const FROM = 0.1
const TO = 0.84

const ease = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) }

/**
 * How visible each of a chapter's `count` paragraphs is at the section's reading progress `p`. Each
 * paragraph holds its own band of the section; at each boundary the old one fades out exactly as the
 * new one fades in, in the same place, so the text steps instead of scrolling. `dir` says which way a
 * fading paragraph is going: 1 arriving, -1 leaving, 0 steady.
 */
export function paragraphStates(p: number, count: number): { opacity: number; dir: number }[] {
  if (count <= 0) return []
  if (count === 1) return [{ opacity: 1, dir: 0 }]
  const w = (TO - FROM) / count
  const f = Math.min(0.04, w * 0.3)
  return Array.from({ length: count }, (_, i) => {
    const start = FROM + i * w, end = start + w
    const arrive = i === 0 ? 1 : ease((p - (start - f / 2)) / f)
    const leave = i === count - 1 ? 1 : 1 - ease((p - (end - f / 2)) / f)
    return { opacity: Math.min(arrive, leave), dir: arrive < 1 ? 1 : leave < 1 ? -1 : 0 }
  })
}

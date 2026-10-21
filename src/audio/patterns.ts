import { bossedGong, flatGong, now } from './synth'

export type GongKind = 'flat' | 'bossed'

/** Four flat gongs (Ifugao gangsa) and five bossed gongs (T'boli klintang), tuned to suggest a set. */
export const PITCHES: Record<GongKind, number[]> = {
  flat: [330, 370, 415, 466],
  bossed: [196, 220, 262, 294, 330],
}
/** Interlocking parts: each flat gong keeps its own beat, and together they fill every step. */
const FLAT_PARTS = [
  [1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 1],
]
const BOSSED_TUNE = [0, 2, 1, 3, 2, 4, 3, 1]
/** Seconds per step, and how many steps the pattern plays. */
const STEP = 0.19
export const STEPS = 32

/** Which gongs sound at a step of the pattern. */
export function hitsAt(kind: GongKind, s: number): number[] {
  return kind === 'flat' ? FLAT_PARTS.flatMap((p, i) => (p[s % 8] ? [i] : [])) : s % 2 === 0 ? [BOSSED_TUNE[(s / 2) % 8]] : []
}

/** Anything that shows a gong being struck (the 3D gongs, the flat demo) listens here. */
type Listener = (kind: GongKind, i: number) => void
const listeners = new Set<Listener>()
export function onStrike(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } }
const told = (kind: GongKind, i: number) => listeners.forEach((l) => l(kind, i))

/** Strikes one gong now (only ever from a tap: that is when browsers let sound begin). */
export function strike(kind: GongKind, i: number) {
  ;(kind === 'flat' ? flatGong : bossedGong)(PITCHES[kind][i])
  told(kind, i)
}

/** Plays the whole pattern; returns a function that stops it. `done` runs when it ends by itself. */
export function playPattern(kind: GongKind, done?: () => void): () => void {
  const timers: number[] = []
  const t0 = now() + 0.08
  for (let s = 0; s < STEPS; s++) {
    for (const i of hitsAt(kind, s)) {
      ;(kind === 'flat' ? flatGong : bossedGong)(PITCHES[kind][i], t0 + s * STEP)
      timers.push(window.setTimeout(() => told(kind, i), (0.08 + s * STEP) * 1000))
    }
  }
  timers.push(window.setTimeout(() => done?.(), (0.08 + STEPS * STEP) * 1000 + 400))
  return () => timers.forEach(clearTimeout)
}

import { lutePluck, now } from './synth'

/**
 * The boat lute demo's notes: five frets on the melody string, in a pentatonic scale with no
 * semitones, over one unfretted drone. A suggestion of how the instrument works, tuned for the demo;
 * it is not a traditional tuning and the phrase is not a traditional piece.
 */
export const FRETS = [294, 330, 392, 440, 494]
export const DRONE = 147

/** A short phrase on the frets: the drone sounds with every other note. */
const PHRASE = [0, 2, 1, 3, 2, 4, 3, 2, 1, 2, 0, 0]
const STEP = 0.32

type Listener = (fret: number) => void
const listeners = new Set<Listener>()
export function onPluck(l: Listener) { listeners.add(l); return () => { listeners.delete(l) } }

/** Plucks one fret now, with the drone (only ever from a tap: that is when browsers let sound begin). */
export function pluck(fret: number) {
  lutePluck(FRETS[fret], DRONE)
  listeners.forEach((l) => l(fret))
}

/** Plays the phrase; returns a function that stops it. `done` runs when it ends by itself. */
export function playPhrase(done?: () => void): () => void {
  const timers: number[] = []
  const t0 = now() + 0.08
  PHRASE.forEach((f, s) => {
    lutePluck(FRETS[f], s % 2 === 0 ? DRONE : null, t0 + s * STEP)
    timers.push(window.setTimeout(() => listeners.forEach((l) => l(f)), (0.08 + s * STEP) * 1000))
  })
  timers.push(window.setTimeout(() => done?.(), (0.08 + PHRASE.length * STEP) * 1000 + 600))
  return () => timers.forEach(clearTimeout)
}

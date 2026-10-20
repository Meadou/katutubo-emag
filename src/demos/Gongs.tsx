import { useEffect, useRef, useState } from 'react'
import { bossedGong, flatGong, now } from '../audio/synth'
import { fill, strings } from '../i18n/t'

const FLAT = [330, 370, 415, 466]
const BOSSED = [196, 220, 262, 294, 330]
/** Interlocking parts: each gong keeps its own beat, and together they fill every step. */
const FLAT_PARTS = [
  [1, 0, 0, 0, 1, 0, 0, 0],
  [0, 0, 1, 0, 0, 0, 1, 0],
  [0, 1, 0, 0, 0, 1, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 1],
]
const BOSSED_TUNE = [0, 2, 1, 3, 2, 4, 3, 1]
const STEP = 0.19

/**
 * Music demo: gongs to tap, and a short pattern to play. Flat gongs (no raised knob) or bossed gongs,
 * as the chapter names them. All sound is synthesized and labelled as such by the demo card.
 */
export default function Gongs({ kind }: { kind: 'flat' | 'bossed' }) {
  const pitches = kind === 'flat' ? FLAT : BOSSED
  const [struck, setStruck] = useState<number[]>(() => pitches.map(() => 0))
  const [playing, setPlaying] = useState(false)
  const timers = useRef<number[]>([])

  const sound = (i: number, at?: number) => (kind === 'flat' ? flatGong : bossedGong)(pitches[i], at)
  const flash = (i: number) => setStruck((s) => s.map((v, k) => (k === i ? v + 1 : v)))
  const strike = (i: number) => { sound(i); flash(i) }

  const stop = () => { timers.current.forEach(clearTimeout); timers.current = []; setPlaying(false) }
  const play = () => {
    stop()
    setPlaying(true)
    const t0 = now() + 0.08
    const steps = 32
    for (let s = 0; s < steps; s++) {
      const hits = kind === 'flat' ? FLAT_PARTS.flatMap((p, i) => (p[s % 8] ? [i] : [])) : s % 2 === 0 ? [BOSSED_TUNE[(s / 2) % 8]] : []
      for (const i of hits) {
        sound(i, t0 + s * STEP)
        timers.current.push(window.setTimeout(() => flash(i), (0.08 + s * STEP) * 1000))
      }
    }
    timers.current.push(window.setTimeout(() => setPlaying(false), (0.08 + steps * STEP) * 1000 + 400))
  }
  useEffect(() => stop, [])

  const s = strings.demo.gongs
  return (
    <div className={`gongs gongs--${kind}`}>
      <div className="gongs__rail" aria-hidden="true" />
      <div className="gongs__row">
        {pitches.map((_, i) => (
          <button key={i} type="button" className="gong" aria-label={fill(s.gong, { n: i + 1 })} onClick={() => strike(i)}>
            <span className="gong__cord" aria-hidden="true" />
            <svg viewBox="0 0 80 80" aria-hidden="true">
              {kind === 'flat' ? (
                <>
                  <ellipse cx="40" cy="40" rx="34" ry="34" className="gong__face" />
                  <ellipse cx="40" cy="40" rx="27" ry="27" className="gong__line" />
                </>
              ) : (
                <>
                  <circle cx="40" cy="40" r="34" className="gong__face" />
                  <circle cx="40" cy="40" r="22" className="gong__line" />
                  <circle cx="40" cy="40" r="10" className="gong__boss" />
                </>
              )}
            </svg>
            {/* keyed by strike count, so each strike restarts the swing */}
            <span key={struck[i]} className={struck[i] ? 'gong__ring is-on' : 'gong__ring'} aria-hidden="true" />
          </button>
        ))}
      </div>
      <p className="gongs__how">{kind === 'flat' ? s.flat : s.bossed}</p>
      <button type="button" className="btn btn--small" onClick={playing ? stop : play} aria-pressed={playing}>
        {playing ? s.stop : s.play}
      </button>
    </div>
  )
}

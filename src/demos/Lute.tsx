import { useEffect, useRef, useState } from 'react'
import { FRETS, onPluck, playPhrase, pluck } from '../audio/lute'
import { fill, strings } from '../i18n/t'

/** Where each fret sits along the drawn neck (x in the 360-wide drawing). */
const FRET_X = [92, 122, 150, 176, 200]

/**
 * The Music demo for a two-string boat lute: the instrument drawn plainly (a long carved body and
 * neck, a fretted melody string and an unfretted drone, with no community's carving), frets to tap,
 * and a short phrase to play. All sound is synthesized and labelled so.
 */
export default function Lute({ name }: { name?: string }) {
  const [plucked, setPlucked] = useState<number[]>(() => FRETS.map(() => 0))
  const [playing, setPlaying] = useState(false)
  const stopper = useRef<(() => void) | null>(null)
  useEffect(() => onPluck((f) => setPlucked((p) => p.map((v, i) => (i === f ? v + 1 : v)))), [])
  useEffect(() => () => stopper.current?.(), [])
  const stop = () => { stopper.current?.(); stopper.current = null; setPlaying(false) }
  const play = () => { stop(); setPlaying(true); stopper.current = playPhrase(() => setPlaying(false)) }

  const s = strings.demo.lute
  return (
    <div className="lute">
      <div className="lute__draw">
        <svg viewBox="0 0 360 96" aria-hidden="true">
          {/* body and neck: one log, hollowed, with a narrow waist where they meet */}
          <path className="lute__wood" d="M8 48 C 8 30, 30 26, 70 30 L 228 40 C 250 41, 330 41, 350 44 C 356 45, 356 51, 350 52 C 330 55, 250 55, 228 56 L 70 66 C 30 70, 8 66, 8 48 Z" />
          <path className="lute__board" d="M232 43 L 342 45.5 L 342 50.5 L 232 53 Z" />
          {/* the frets: lumps on the neck under the melody string */}
          {FRET_X.map((x, i) => <rect key={i} className="lute__fret" x={x - 3} y={36} width={6} height={10} rx={2} />)}
          {/* the melody string (fretted) and the drone (open) */}
          <line className="lute__string" x1="20" y1="44" x2="344" y2="47" />
          <line className="lute__string lute__string--drone" x1="20" y1="54" x2="344" y2="50" />
        </svg>
        <div className="lute__frets">
          {FRET_X.map((x, i) => (
            <button key={i} type="button" className="lute__tap" style={{ left: `${(x / 360) * 100}%` }} aria-label={fill(s.fret, { n: i + 1 })} onClick={() => pluck(i)}>
              <span key={plucked[i]} className={plucked[i] ? 'lute__ring is-on' : 'lute__ring'} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>
      <p className="lute__how">{name ? fill(s.howNamed, { name }) : s.how}</p>
      <button type="button" className="btn btn--small" onClick={playing ? stop : play} aria-pressed={playing}>
        {playing ? s.stop : s.play}
      </button>
    </div>
  )
}

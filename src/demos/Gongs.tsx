import { useEffect, useRef, useState } from 'react'
import { PITCHES, onStrike, playPattern, strike, type GongKind } from '../audio/patterns'
import { fill, strings } from '../i18n/t'

/**
 * The flat version of the Music demo, for readers without the 3D gongs (no WebGL, or reduced
 * motion): gongs to tap, and a short pattern to play. All sound is synthesized and labelled so.
 */
export default function Gongs({ kind }: { kind: GongKind }) {
  const [struck, setStruck] = useState<number[]>(() => PITCHES[kind].map(() => 0))
  const [playing, setPlaying] = useState(false)
  const stopper = useRef<(() => void) | null>(null)

  useEffect(() => onStrike((k, i) => { if (k === kind) setStruck((s) => s.map((v, j) => (j === i ? v + 1 : v))) }), [kind])
  const stop = () => { stopper.current?.(); stopper.current = null; setPlaying(false) }
  const play = () => { stop(); setPlaying(true); stopper.current = playPattern(kind, () => setPlaying(false)) }
  useEffect(() => () => stopper.current?.(), [])

  const s = strings.demo.gongs
  return (
    <div className={`gongs gongs--${kind}`}>
      <div className="gongs__rail" aria-hidden="true" />
      <div className="gongs__row">
        {PITCHES[kind].map((_, i) => (
          <button key={i} type="button" className="gong" aria-label={fill(s.gong, { n: i + 1 })} onClick={() => strike(kind, i)}>
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
            {/* keyed by strike count, so each strike shows again */}
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

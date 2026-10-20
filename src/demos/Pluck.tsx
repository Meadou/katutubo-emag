import { useState } from 'react'
import { pluck } from '../audio/synth'
import { fill, strings } from '../i18n/t'

const PITCHES = [147, 196, 220, 294]

/** Music demo for string instruments: a lute body with strings to tap or swipe across. */
export default function Pluck({ strings: n }: { strings: number }) {
  const [hits, setHits] = useState<number[]>(() => Array.from({ length: n }, () => 0))
  const play = (i: number) => {
    pluck(PITCHES[i % PITCHES.length])
    setHits((h) => h.map((v, k) => (k === i ? v + 1 : v)))
  }
  return (
    <div className="pluck">
      <svg viewBox="0 0 320 120" className="pluck__body" aria-hidden="true">
        <path d="M18 60 Q 18 30 60 30 L 250 44 Q 300 48 304 60 Q 300 72 250 76 L 60 90 Q 18 90 18 60Z" className="pluck__wood" />
        <circle cx="96" cy="60" r="11" className="pluck__hole" />
        {Array.from({ length: 9 }, (_, i) => <rect key={i} x={140 + i * 14} y={48} width={2.5} height={24} className="pluck__fret" />)}
      </svg>
      <div className="pluck__strings" style={{ ['--n' as string]: n }}>
        {Array.from({ length: n }, (_, i) => (
          <button key={i} type="button" className="pluck__string" aria-label={fill(strings.demo.pluck.string, { n: i + 1 })}
            onPointerDown={() => play(i)} onPointerEnter={(e) => { if (e.buttons) play(i) }}
            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); play(i) } }}>
            <i key={hits[i]} className={hits[i] ? 'is-on' : ''} />
          </button>
        ))}
      </div>
    </div>
  )
}

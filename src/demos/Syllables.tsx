import { useState } from 'react'
import { fill, strings } from '../i18n/t'

/** Abstract incision strokes on bamboo, one per beat. Not Surat Mangyan: the caption says so. */
const MARKS = [
  'M40 38 l8 22', 'M64 34 l-6 26', 'M86 40 l10 18', 'M110 34 l2 26', 'M134 38 l-8 22', 'M156 36 l10 22', 'M180 34 l-4 26',
]

/** Mangyan Myths demo: tap the seven beats of one ambahan line; each beat scores a mark on the bamboo. */
export default function Syllables() {
  const [count, setCount] = useState(0)
  const s = strings.demo.syllables
  const done = count >= 7
  return (
    <div className="syllables">
      <svg viewBox="0 0 220 96" className="syllables__bamboo" aria-hidden="true">
        <rect x="14" y="22" width="192" height="52" rx="26" className="bamboo__tube" />
        <rect x="106" y="20" width="6" height="56" className="bamboo__node" />
        {MARKS.map((d, i) => <path key={i} d={d} className={i < count ? 'bamboo__mark is-on' : 'bamboo__mark'} pathLength={1} />)}
      </svg>
      <ol className="syllables__beats">
        {Array.from({ length: 7 }, (_, i) => (
          <li key={i}>
            <button type="button" className={i < count ? 'beat is-on' : 'beat'} aria-label={fill(s.beat, { n: i + 1 })}
              onClick={() => setCount(done ? 1 : i < count ? i + 1 : Math.min(7, count + 1))}>
              {i + 1}
            </button>
          </li>
        ))}
      </ol>
      <p className="syllables__done" aria-live="polite">{done ? s.done : ' '}</p>
    </div>
  )
}

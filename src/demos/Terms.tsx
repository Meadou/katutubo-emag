import { useState } from 'react'
import { sentences, sentenceWith } from '../ui/chapterText'
import { fill, strings } from '../i18n/t'

/**
 * Beliefs & Rituals demo, deliberately still: the sacred is only named. Choosing a term shows the
 * sentence of the chapter it comes from, with no motion of any kind.
 */
export default function Terms({ terms, html }: { terms: string[]; html: string }) {
  const [pick, setPick] = useState<string | null>(null)
  const line = pick ? sentenceWith(html, pick) : null
  return (
    <div className="terms">
      <ul className="terms__list">
        {terms.map((t) => (
          <li key={t}>
            <button type="button" className={pick === t ? 'term is-on' : 'term'} aria-pressed={pick === t} onClick={() => setPick(pick === t ? null : t)}>
              {t}
            </button>
          </li>
        ))}
      </ul>
      <p className="terms__line" aria-live="polite">{line ?? strings.demo.terms.pick}</p>
    </div>
  )
}

/** The same stillness for a chapter that names no terms: its own sentences, one at a time, by tapping. */
export function Lines({ html }: { html: string }) {
  const lines = sentences(html)
  const [i, setI] = useState(0)
  const s = strings.demo.terms
  return (
    <div className="terms">
      <p className="terms__line" aria-live="polite">{lines[i]}</p>
      <div className="terms__nav">
        <span className="terms__count">{fill(s.count, { n: i + 1, of: lines.length })}</span>
        <button type="button" className="btn btn--small" onClick={() => setI((i + 1) % lines.length)}>{s.next}</button>
      </div>
    </div>
  )
}

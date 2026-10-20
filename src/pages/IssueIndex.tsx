import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { groups, type IslandGroup } from '../content'
import { setTone } from '../hooks/useSections'
import { coords } from '../format'

const FILTERS: ('All' | IslandGroup)[] = ['All', 'Luzon', 'Visayas', 'Mindanao']

export default function IssueIndex() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const list = filter === 'All' ? groups : groups.filter((g) => g.islandGroup === filter)
  const soon = groups.filter((g) => g.placeholder).length

  useEffect(() => setTone('light'), [])

  return (
    <section className="index">
      <header className="index__head">
        <h1>Issues</h1>
        <p className="index__sum">
          {groups.length} peoples, north to south. {groups.length - soon} issues to read, {soon} being prepared.
        </p>
        <div className="chips" role="group" aria-label="Filter by island group">
          {FILTERS.map((f) => (
            <button key={f} className={f === filter ? 'is-on' : ''} aria-pressed={f === filter} onClick={() => setFilter(f)}>
              {f}
            </button>
          ))}
        </div>
      </header>

      {list.length === 0 ? (
        <p className="index__empty">No stories from {filter} yet. More issues are on the way.</p>
      ) : (
        <ol className="cards">
          {list.map((g) => (
            <li key={g.slug}>
              <Link to={`/group/${g.slug}`} className={`card ${g.placeholder ? 'card--soon' : ''}`} style={{ ['--c' as string]: g.color }}>
                <i className="card__dot" aria-hidden="true" />
                <strong className="card__name">{g.name}</strong>
                <span className="card__region">{g.region}</span>
                <span className="card__coord mono">{coords(g)}</span>
                {g.placeholder ? <span className="card__soon">Coming soon</span> : <span className="card__tag">{g.tagline}</span>}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

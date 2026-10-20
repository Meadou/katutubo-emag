import { useState } from 'react'
import { Link } from 'react-router-dom'
import { groups, type IslandGroup } from '../content'

const FILTERS: ('All' | IslandGroup)[] = ['All', 'Luzon', 'Visayas', 'Mindanao']

export default function IssueIndex() {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const list = filter === 'All' ? groups : groups.filter((g) => g.islandGroup === filter)

  return (
    <section className="index">
      <header className="index__head">
        <p className="kicker">Contents</p>
        <h1>The Issues</h1>
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
          {list.map((g, i) => (
            <li key={g.slug}>
              <Link to={`/group/${g.slug}`} className="card" style={{ ['--c' as string]: g.color }}>
                <span className="card__no">{String(i + 1).padStart(2, '0')}</span>
                <span className="card__island">{g.islandGroup} · {g.island}</span>
                <strong className="card__name">{g.name}</strong>
                <span className="card__tag">{g.tagline}</span>
                <span className="card__region">{g.region}</span>
              </Link>
            </li>
          ))}
        </ol>
      )}
    </section>
  )
}

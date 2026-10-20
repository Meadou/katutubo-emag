import { Link } from 'react-router-dom'
import { groups } from '../content'
import { useMag } from '../store'

export default function Home() {
  const hovered = useMag((s) => s.hovered)
  const setFlyTo = useMag((s) => s.setFlyTo)
  const setHovered = useMag((s) => s.setHovered)
  const active = groups.find((g) => g.slug === hovered)

  return (
    <section className="cover">
      <div className="cover__head">
        <p className="kicker">Issue 01 · An e-magazine</p>
        <h1 className="cover__title">
          Katutubo
          <em>the first peoples of the islands</em>
        </h1>
        <p className="cover__lede">
          Over a hundred Indigenous Peoples call the Philippine archipelago home. Each one has its own stories, music, beliefs and crafts.
          Choose a light on the map to begin.
        </p>
      </div>

      <div className="cover__hint" aria-live="polite">
        {active ? (
          <span style={{ color: active.color }}>{active.name}: {active.tagline}</span>
        ) : (
          <span>Hover or tap a light</span>
        )}
      </div>

      {/* Keyboard / screen-reader route to the same articles the 3D markers open */}
      <ul className="cover__list">
        {groups.map((g) => (
          <li key={g.slug}>
            <Link
              to={`/group/${g.slug}`}
              style={{ ['--c' as string]: g.color }}
              onMouseEnter={() => setHovered(g.slug)}
              onMouseLeave={() => setHovered(null)}
              onFocus={() => setHovered(g.slug)}
              onBlur={() => setHovered(null)}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey) return
                e.preventDefault()
                setFlyTo(g.slug)
              }}
            >
              <strong>{g.name}</strong>
              <span>{g.island}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

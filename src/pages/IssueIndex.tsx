import { useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { groups, type IslandGroup } from '../content'
import { useJourney } from '../worlds/engine'
import { plainWorlds } from '../worlds/journeys'
import { useAspect } from '../worlds/useAspect'
import { coords, fill, strings } from '../i18n/t'

const FILTERS: ('All' | IslandGroup)[] = ['All', 'Luzon', 'Visayas', 'Mindanao']

/** Every issue on one paper sheet, filterable by island group. */
export default function IssueIndex() {
  const root = useRef<HTMLElement>(null)
  const aspect = useAspect()
  const worlds = useMemo(() => plainWorlds(aspect, 'day'), [aspect])
  useJourney(root, worlds, `index:${aspect}`)
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All')
  const list = filter === 'All' ? groups : groups.filter((g) => g.islandGroup === filter)
  const soon = groups.filter((g) => g.placeholder).length
  const s = strings.index

  return (
    <section ref={root} className="index">
      <div id="page" data-world="page" className="sec sec--plain">
        <div className="card card--index">
          <h1>{s.title}</h1>
          <p className="lede lede--small">{fill(s.summary, { total: groups.length, ready: groups.length - soon, soon })}</p>
          <div className="chips" role="group" aria-label={s.filter}>
            {FILTERS.map((f) => (
              <button key={f} type="button" className={f === filter ? 'is-on' : ''} aria-pressed={f === filter} onClick={() => setFilter(f)}>
                {f === 'All' ? s.all : f}
              </button>
            ))}
          </div>
          {list.length === 0 ? (
            <p className="index__empty">{fill(s.empty, { group: filter })}</p>
          ) : (
            <ol className="rows">
              {list.map((g) => (
                <li key={g.slug}>
                  <Link to={`/group/${g.slug}`} className={`row ${g.placeholder ? 'is-soon' : ''}`} style={{ ['--c' as string]: g.color }}>
                    <span className="row__name">{g.name}</span>
                    <span className="row__where">{g.islandGroup} · {g.region}</span>
                    <span className="row__coords nums">{coords(g)}</span>
                    {g.angle && <span className="row__tag">{g.angle}</span>}
                    {g.placeholder && <span className="soon-tag">{strings.soon.title}</span>}
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </section>
  )
}

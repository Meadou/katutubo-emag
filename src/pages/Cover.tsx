import { useEffect, useMemo, useRef } from 'react'
import { Link } from 'react-router-dom'
import { groups } from '../content'
import { journey, useJourney } from '../worlds/engine'
import { coverWorlds, fitDist } from '../worlds/journeys'
import { useAspect } from '../worlds/useAspect'
import { useUi } from '../ui/store'
import ScrollCue from '../ui/ScrollCue'
import { coords, fill, strings } from '../i18n/t'

/**
 * The cover: what Katutubo is, in one sentence over the paper archipelago, a cue to scroll, then the
 * peoples north to south. The list is the keyboard and screen-reader route to every issue; pointing
 * at a people leans the camera toward their place.
 */
export default function Cover() {
  const root = useRef<HTMLElement>(null)
  const aspect = useAspect()
  const ready = groups.filter((g) => !g.placeholder)
  const first = ready[0]
  const worlds = useMemo(() => coverWorlds(aspect, first), [aspect, first])
  useJourney(root, worlds, `cover:${aspect}`)
  const hovered = useUi((s) => s.hovered)
  const setHovered = useUi((s) => s.setHovered)
  const s = strings.cover

  useEffect(() => {
    const g = groups.find((x) => x.slug === hovered)
    journey.focus = g ? { lon: g.lon, lat: g.lat - 0.4, dist: fitDist(11, 16.6, aspect) * 0.5, tilt: 0.42, yaw: 0 } : null
  }, [hovered, aspect])
  useEffect(() => () => { journey.focus = null; setHovered(null) }, [setHovered])

  return (
    <section ref={root} className="cover">
      <div id="hero" data-world="hero" className="sec sec--hero">
        <header className="card card--masthead">
          <p className="card__over">{s.over}</p>
          <h1>{strings.site.name}</h1>
          <p className="masthead">{strings.site.masthead}</p>
          <p className="lede">{s.lede}</p>
          <ScrollCue label={s.cue} />
        </header>
      </div>

      <div id="peoples" data-world="peoples" className="sec sec--peoples">
        <div className="card card--list">
          <h2>{fill(s.peoplesTitle, { total: groups.length })}</h2>
          <p className="lede lede--small">{fill(s.peoplesLede, { ready: ready.length, soon: groups.length - ready.length })}</p>
          <ol className="peoples" aria-label={s.listLabel}>
            {groups.map((g) => (
              <li key={g.slug}>
                <Link to={`/group/${g.slug}`} className={`people ${g.placeholder ? 'is-soon' : ''} ${hovered === g.slug ? 'is-on' : ''}`}
                  style={{ ['--c' as string]: g.color }}
                  onMouseEnter={() => setHovered(g.slug)} onMouseLeave={() => setHovered(null)}
                  onFocus={() => setHovered(g.slug)} onBlur={() => setHovered(null)}>
                  <span className="people__name">{g.name}</span>
                  <span className="people__where">{g.region}</span>
                  <span className="people__coords">{coords(g)}</span>
                  {g.placeholder && <span className="soon-tag">{s.soon}</span>}
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>

      {first && (
        <div id="begin" data-world="begin" className="sec sec--begin">
          <div className="card card--begin">
            <h2>{s.beginTitle}</h2>
            <Link to={`/group/${first.slug}`} className="btn btn--big">{fill(s.begin, { name: first.name })}</Link>
          </div>
        </div>
      )}
    </section>
  )
}

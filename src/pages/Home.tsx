import { useEffect, useRef, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { groups, type IslandGroup } from '../content'
import { useMag, type CoverFocus } from '../store'
import { useSections } from '../hooks/useSections'
import Callouts from '../components/Callouts'
import Panel from '../components/Panel'
import { ArrowDown, ArrowRight } from '../components/Icon'
import { coords } from '../format'

const REGIONS: { name: IslandGroup; tone: 'light' | 'dark' }[] = [
  { name: 'Luzon', tone: 'light' },
  { name: 'Visayas', tone: 'dark' },
  { name: 'Mindanao', tone: 'light' },
]

export default function Home() {
  const root = useRef<HTMLElement>(null)
  const hovered = useMag((s) => s.hovered)
  const focus = useMag((s) => s.coverFocus)
  const setFlyTo = useMag((s) => s.setFlyTo)
  const setHovered = useMag((s) => s.setHovered)
  const setCoverFocus = useMag((s) => s.setCoverFocus)
  const active = groups.find((g) => g.slug === hovered)

  useSections(root, (el) => setCoverFocus((el.dataset.focus as CoverFocus | undefined) ?? 'all'))

  // Number keys open the issues in map order, north to south.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= groups.length) setFlyTo(groups[n - 1].slug)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFlyTo])

  const open = (slug: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey) return
    e.preventDefault()
    setFlyTo(slug)
  }
  const peek = (slug: string | null) => () => setHovered(slug)

  return (
    <section ref={root} className="cover">
      <div className="cover__intro" data-tone="dark" data-focus="all">
        <h1>The first peoples of the islands.</h1>
        <p className="lede">
          Katutubo is an e-magazine about the Indigenous Peoples of the Philippines. Over a hundred peoples call the archipelago home,
          each with its own stories, music, beliefs and crafts.
        </p>
        <div className="actions">
          <a href="#luzon" className="btn btn--primary"
            onClick={(e) => { e.preventDefault(); document.getElementById('luzon')?.scrollIntoView({ behavior: 'smooth' }) }}>
            Start in the north <ArrowDown />
          </a>
          <Link to="/issues" className="btn">All issues</Link>
        </div>
      </div>

      {REGIONS.map((r) => {
        const list = groups.filter((g) => g.islandGroup === r.name)
        return (
          <div key={r.name} id={r.name.toLowerCase()} className="cover__region" data-tone={r.tone} data-focus={r.name}>
            <h2>{r.name}</h2>
            <ul className="cover__list">
              {list.map((g) => (
                <li key={g.slug}>
                  <Link to={`/group/${g.slug}`} style={{ ['--c' as string]: g.color }} onClick={open(g.slug)}
                    onMouseEnter={peek(g.slug)} onMouseLeave={peek(null)} onFocus={peek(g.slug)} onBlur={peek(null)}>
                    <strong>{g.name}</strong>
                    <span>{g.placeholder ? 'Coming soon' : g.tagline}</span>
                    <span className="cover__meta">{g.region} · <span className="mono">{coords(g)}</span></span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )
      })}

      <div className="cover__end" data-tone="dark" data-focus="all">
        <h2>Every issue lists its sources.</h2>
        <p className="lede">
          Drafts stay marked until their facts are checked against community, NCIP and academic sources. If you belong to one of
          these communities and see an error, we want to hear from you.
        </p>
        <div className="actions">
          <Link to="/issues" className="btn btn--primary">Read the issues <ArrowRight /></Link>
          <Link to="/about" className="btn">How Katutubo is made</Link>
        </div>
      </div>

      <Callouts
        onHover={(id) => setHovered(id ? id.replace('issue:', '') : null)}
        items={groups.map((g) => ({
          id: `issue:${g.slug}`,
          label: g.name,
          sub: g.placeholder ? 'Coming soon' : g.island,
          color: g.placeholder ? undefined : g.color,
          to: `/group/${g.slug}`,
          onSelect: () => setFlyTo(g.slug),
          active: hovered === g.slug,
          muted: focus !== 'all' && g.islandGroup !== focus,
        }))}
      />

      <Panel label="Issues on the map">
        <p className="cover__hint" aria-live="polite">
          {active ? `${active.name}: ${active.placeholder ? 'Coming soon' : active.tagline}` : 'Choose a people on the map'}
        </p>
        <ol className="legend">
          {groups.map((g, i) => (
            <li key={g.slug}>
              <Link to={`/group/${g.slug}`} onClick={open(g.slug)} onMouseEnter={peek(g.slug)} onMouseLeave={peek(null)}
                className={hovered === g.slug ? 'is-on' : ''}>
                <kbd>{i + 1}</kbd>
                <span className="legend__name">{g.name}</span>
                <i className={`legend__dot ${g.placeholder ? 'is-soon' : ''}`} style={{ ['--c' as string]: g.color }} aria-hidden="true" />
              </Link>
            </li>
          ))}
        </ol>
        <p className="panel__hint">Press 1–{groups.length} to open an issue</p>
      </Panel>
    </section>
  )
}

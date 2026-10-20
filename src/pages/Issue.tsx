import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGroup, nextIssue, type Group } from '../content'
import { goToSection, useJourney } from '../worlds/engine'
import { issueWorlds, placeholderWorlds } from '../worlds/journeys'
import { DESIGNS, type IssueDesign } from '../worlds/issues'
import { useAspect } from '../worlds/useAspect'
import { place } from '../stage/place'
import { ChapterCard } from '../ui/ChapterCard'
import ChapterRail from '../ui/ChapterRail'
import ScrollCue from '../ui/ScrollCue'
import Demo from '../demos/Demo'
import { coords, fill, strings } from '../i18n/t'

/** An issue without its own design flies to its place on the archipelago, framed simply. */
const generic = (g: Group): IssueDesign => ({
  area: 'archipelago',
  focus: { lon: g.lon, lat: g.lat },
  shots: { overview: { dist: 1.6, tilt: 0.7, yaw: 0 }, sources: { dist: 3, tilt: 0.4, yaw: 0 } },
  demos: { overview: { kind: 'region' } },
})

export default function Issue() {
  const { slug = '', chapter } = useParams()
  const group = getGroup(slug)
  if (!group) {
    return (
      <section className="sec sec--plain">
        <div className="card"><h1>{strings.notFound.title}</h1><p><Link to="/issues">{strings.notFound.back}</Link></p></div>
      </section>
    )
  }
  return group.placeholder ? <Placeholder key={group.slug} group={group} /> : <Journey key={group.slug} group={group} chapter={chapter} />
}

/**
 * One issue as one journey: the map with the place marked, the dive through the clouds, a world per
 * chapter with its text and its demo, the sources, and the flight on to the next people.
 */
function Journey({ group, chapter }: { group: Group; chapter?: string }) {
  const root = useRef<HTMLElement>(null)
  const aspect = useAspect()
  const design = DESIGNS[group.slug] ?? generic(group)
  const next = nextIssue(group.slug)
  const worlds = useMemo(() => issueWorlds(group, design, next, aspect), [group, design, next, aspect])
  useJourney(root, worlds, `${group.slug}:${aspect}`)
  const s = strings.issue

  // tell the stage where this issue's chapter objects stand
  useEffect(() => {
    const music = design.demos.music
    place.focus = design.focus
    place.area = design.area
    place.gong = music?.kind === 'gongs' ? music.gong : 'flat'
    return () => { place.focus = null; place.area = null }
  }, [design])

  // a deep link to a chapter (#/group/ifugao/music) lands on it; otherwise the journey starts at the map
  useEffect(() => {
    if (chapter && group.chapters.some((c) => c.id === chapter)) requestAnimationFrame(() => goToSection(`ch-${chapter}`, false))
    else window.scrollTo(0, 0)
  }, [group, chapter])

  return (
    <article ref={root} className="issue" style={{ ['--c' as string]: group.color }}>
      <div id="map" data-world="map" className="sec sec--hero">
        <header className="card card--issue">
          <p className="card__over">{group.region} · <span className="nums">{coords(group)}</span></p>
          <h1>{group.name}</h1>
          <p className="lede">{group.tagline}</p>
          {group.draft && <p className="draft" role="note">{s.draft}</p>}
          <ScrollCue label={s.cue} />
        </header>
      </div>

      <div id="fly" data-world="fly" className="sec sec--fly">
        <p className="fly-caption">{fill(s.flying, { region: group.region })}</p>
      </div>

      {group.chapters.map((c, i) => {
        const spec = design.demos[c.id]
        return (
          <section key={c.id} id={`ch-${c.id}`} data-world={c.id} className={`sec sec--chapter ${i % 2 ? 'is-flipped' : ''}`}>
            <ChapterCard chapter={c} index={i} />
            {spec && <div className="demo-slot"><Demo spec={spec} chapter={c} group={group} area={design.area} /></div>}
          </section>
        )
      })}

      {group.sources && (
        <section id="sources" data-world="sources" className="sec sec--sources">
          <div className="card card--sources">
            <h2>{s.sources}</h2>
            <div className="prose prose--sources" dangerouslySetInnerHTML={{ __html: group.sources }} />
          </div>
        </section>
      )}

      {next && (
        <>
          <div id="onward" data-world="onward" className="sec sec--fly" aria-hidden="true" />
          <div id="nextmap" data-world="nextmap" className="sec sec--next">
            <div className="card card--next">
              <p className="card__over">{s.nextLabel}</p>
              <Link to={`/group/${next.slug}`} className="next-link" style={{ ['--c' as string]: next.color }}>
                {fill(s.next, { name: next.name })}
              </Link>
              <p className="card__under">{next.region}</p>
            </div>
          </div>
        </>
      )}

      <ChapterRail slug={group.slug} chapters={group.chapters} />
    </article>
  )
}

/** A people whose issue is still being prepared: their place on the map, and an honest card. */
function Placeholder({ group }: { group: Group }) {
  const root = useRef<HTMLElement>(null)
  const aspect = useAspect()
  const worlds = useMemo(() => placeholderWorlds(group, aspect), [group, aspect])
  useJourney(root, worlds, `${group.slug}:${aspect}`)
  // (a block body: newer browsers return a Promise from scrollTo, which an effect must not return)
  useEffect(() => { window.scrollTo(0, 0) }, [group])
  const next = nextIssue(group.slug)
  const s = strings.soon
  return (
    <article ref={root} className="issue issue--soon" style={{ ['--c' as string]: group.color }}>
      <div id="map" data-world="map" className="sec sec--hero">
        <header className="card card--issue">
          <p className="card__over">{group.region} · <span className="nums">{coords(group)}</span></p>
          <h1>{group.name}</h1>
          <p className="lede soon-lede">{s.title}</p>
          <p className="soon-body">{s.body}</p>
        </header>
      </div>
      <div id="place" data-world="place" className="sec sec--next">
        {next && (
          <div className="card card--next">
            <p className="card__over">{s.readFinished}</p>
            <Link to={`/group/${next.slug}`} className="next-link" style={{ ['--c' as string]: next.color }} aria-label={fill(s.readLink, { name: next.name })}>
              {next.name}
            </Link>
            <p className="card__under">{next.region}</p>
          </div>
        )}
      </div>
    </article>
  )
}

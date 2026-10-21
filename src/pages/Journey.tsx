import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGroup, groups, type Group } from '../content'
import { goToSection, journey, useJourney, useNearest } from '../worlds/engine'
import { REGIONS, REGION_VIEW, archipelagoCamera, buildJourney, chapterId, sectionFor, zoomAbout, type Section } from '../worlds/journeys'
import { DESIGNS } from '../worlds/issues'
import { useAspect } from '../worlds/useAspect'
import { ChapterCard } from '../ui/ChapterCard'
import Recede from '../ui/Recede'
import JourneyRail from '../ui/JourneyRail'
import ScrollCue from '../ui/ScrollCue'
import { useUi } from '../ui/store'
import Demo from '../demos/Demo'
import { coords, fill, strings } from '../i18n/t'

/**
 * The whole magazine as one journey down the archipelago: an opening card, then each island group
 * at mid zoom, down to each people's land and back up, a finished issue's chapters where its people
 * are, and out to the whole map at the end. Deep links (#/group/ifugao, #/group/ifugao/music) land
 * on their section.
 */
export default function Journey() {
  const { slug, chapter } = useParams()
  const root = useRef<HTMLElement>(null)
  const aspect = useAspect()
  const { sections, worlds } = useMemo(() => buildJourney(aspect), [aspect])
  useJourney(root, worlds, `journey:${aspect}`)

  useEffect(() => {
    const g = slug ? getGroup(slug) : undefined
    if (!g) { window.scrollTo(0, 0); return }
    const ch = chapter && g.chapters.some((c) => c.id === chapter) ? chapter : undefined
    // a people's stop is met at its foot, where its card is; a chapter from its top
    requestAnimationFrame(() => goToSection(sectionFor(g.slug, ch), false, ch ? 'start' : 'end'))
  }, [slug, chapter])

  return (
    <article ref={root} className="journey">
      {/* the rail comes right after the opening card in the page, so it is the next stop for the Tab key (it is fixed on screen) */}
      {sections.slice(0, 1).map((s) => <JourneySection key={s.id} s={s} aspect={aspect} />)}
      <JourneyRail sections={sections} worlds={worlds} />
      {sections.slice(1).map((s) => <JourneySection key={s.id} s={s} aspect={aspect} />)}
    </article>
  )
}

function JourneySection({ s, aspect }: { s: Section; aspect: number }) {
  switch (s.kind) {
    case 'intro': return <Intro aspect={aspect} />
    case 'region': return <Region s={s} />
    case 'zoom': return <div id={s.id} data-world={s.id} className="sec sec--zoom" aria-hidden="true" />
    case 'people': return <People g={s.group} />
    case 'chapter': return <Chapter g={s.group} index={s.index} />
    case 'sources': return <Sources g={s.group} />
    case 'end': return <End />
  }
}

/**
 * What Katutubo is, in one card, and the way in. The journey rail is the keyboard and screen-reader
 * route to every people; on the map, pointing at a pin or an island group leans the opening view.
 */
function Intro({ aspect }: { aspect: number }) {
  const s = strings.intro
  const near = useNearest()
  const hovered = useUi((u) => u.hovered)
  const region = useUi((u) => u.hoveredRegion)
  const setHovered = useUi((u) => u.setHovered)
  const setRegion = useUi((u) => u.setHoveredRegion)
  // the lean belongs to the opening view only: pointing at a pin zooms toward that people, at an island
  // group a little toward it. It zooms about the thing pointed at, so it stays under the pointer to be chosen.
  useEffect(() => {
    const g = groups.find((x) => x.slug === hovered)
    const anchor = g ?? (region ? REGION_VIEW[region] : null)
    journey.focus = near === 'intro' && anchor ? zoomAbout(archipelagoCamera(aspect), anchor, g ? 0.6 : 0.78) : null
  }, [hovered, region, near, aspect])
  useEffect(() => () => { journey.focus = null; setHovered(null); setRegion(null) }, [setHovered, setRegion])

  return (
    <div id="intro" data-world="intro" className="sec sec--intro">
      <header className="card card--ink card--masthead">
        <p className="card__over">{s.over}</p>
        <h1>{strings.site.name}</h1>
        <p className="masthead">{strings.site.masthead}</p>
        <p className="lede">{s.lede}</p>
        <div className="begin">
          <button type="button" className="btn btn--big" onClick={() => goToSection(`region-${REGIONS[0].toLowerCase()}`)}>{s.begin}</button>
          <ScrollCue label={s.cue} />
        </div>
      </header>
    </div>
  )
}

/** An island group at mid zoom: its name and its three peoples. */
function Region({ s }: { s: Extract<Section, { kind: 'region' }> }) {
  return (
    <section id={s.id} data-world={s.id} className="sec sec--region" aria-labelledby={`h-${s.id}`}>
      <div className="card card--ink card--region">
        <p className="card__over">{s.region}</p>
        <h2 id={`h-${s.id}`}>{strings.regions[s.region]}</h2>
        <p className="region__peoples">{s.peoples.map((g) => g.name).join(' · ')}</p>
      </div>
    </section>
  )
}

/** A people's stop: their land at the centre, a slim card at the side. */
function People({ g }: { g: Group }) {
  const s = strings.journey
  const id = `stop-${g.slug}`
  return (
    <section id={id} data-world={id} className={`sec sec--people ${g.placeholder ? 'is-soon' : ''}`} aria-labelledby={`h-${id}`} style={{ ['--c' as string]: g.color }}>
      <p className="zoom-caption" aria-hidden="true">{g.name} · {g.region}</p>
      <div className="card card--ink card--people">
        <p className="card__over">{g.region} · <span className="nums">{coords(g)}</span></p>
        <h2 id={`h-${id}`}>{g.name}</h2>
        {g.aka && <p className="people__aka">{fill(s.aka, { aka: g.aka })}</p>}
        {g.angle && <p className="angle"><span>{s.angle}</span>{g.angle}</p>}
        {g.placeholder ? (
          <>
            <p className="soon-tag">{strings.soon.title}</p>
            <p className="soon-body">{strings.soon.body}</p>
          </>
        ) : (
          <>
            {g.tagline && <p className="lede">{g.tagline}</p>}
            {g.draft && <p className="draft" role="note">{s.draft}</p>}
            <p className="people__follow">{fill(s.follow, { n: g.chapters.length })}</p>
          </>
        )}
      </div>
    </section>
  )
}

/** One chapter of a finished issue: the text at one edge, its demo at the other, the land between. */
function Chapter({ g, index }: { g: Group; index: number }) {
  const c = g.chapters[index]
  const id = chapterId(g.slug, c.id)
  const design = DESIGNS[g.slug]
  const spec = design?.demos[c.id]
  return (
    <section id={id} data-world={id} className={`sec sec--chapter ${index % 2 ? 'is-flipped' : ''}`} style={{ ['--c' as string]: g.color }}>
      <Recede sectionId={id}><ChapterCard chapter={c} index={index} people={g.name} id={id} /></Recede>
      {spec && <div className="demo-slot"><Demo spec={spec} chapter={c} group={g} sectionId={id} /></div>}
    </section>
  )
}

function Sources({ g }: { g: Group }) {
  const id = `sources-${g.slug}`
  return (
    <section id={id} data-world={id} className="sec sec--sources" aria-labelledby={`h-${id}`}>
      <div className="wash card--sources">
        <p className="card__over">{g.name}</p>
        <h2 id={`h-${id}`}>{strings.journey.sources}</h2>
        <div className="prose prose--sources" dangerouslySetInnerHTML={{ __html: g.sources ?? '' }} />
      </div>
    </section>
  )
}

function End() {
  const s = strings.journey
  const soon = groups.filter((g) => g.placeholder).length
  return (
    <section id="end" data-world="end" className="sec sec--end" aria-labelledby="h-end">
      <div className="card card--ink card--end">
        <h2 id="h-end">{s.endTitle}</h2>
        <p className="lede">{fill(s.endBody, { ready: groups.length - soon, soon })}</p>
        <div className="end__links">
          <button type="button" className="btn" onClick={() => goToSection('intro')}>{s.again}</button>
          <Link to="/issues" className="btn btn--quiet">{s.issues}</Link>
        </div>
      </div>
    </section>
  )
}

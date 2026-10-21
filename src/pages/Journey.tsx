import { useEffect, useMemo, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGroup, groups, type Group } from '../content'
import { goToSection, journey, useJourney, useNearest } from '../worlds/engine'
import { REGIONS, REGION_VIEW, archipelagoCamera, buildJourney, chapterId, sectionFor, zoomAbout, type Section } from '../worlds/journeys'
import { DESIGNS } from '../worlds/issues'
import { useAspect } from '../worlds/useAspect'
import { ChapterCard } from '../ui/ChapterCard'
import Recede from '../ui/Recede'
import ScrollCue from '../ui/ScrollCue'
import { useUi } from '../ui/store'
import { blocks, splitLede } from '../ui/chapterText'
import Demo from '../demos/Demo'
import { fill, strings } from '../i18n/t'

/**
 * The whole magazine as one journey down the archipelago: the opening, then each island group at mid
 * zoom, down to each people's land and back up, a finished issue's chapters where its people are,
 * and out to the whole map at the end. Each section's words are held still in a frame that fades in
 * place; the scroll moves the camera. Deep links (#/group/ifugao, #/group/ifugao/music) land on their section.
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
    // a people's stop is met at its foot, where its words hold; a chapter from its top
    requestAnimationFrame(() => goToSection(sectionFor(g.slug, ch), false, ch ? 'start' : 'end'))
  }, [slug, chapter])

  return (
    <article ref={root} className="journey">
      {sections.map((s) => <JourneySection key={s.id} s={s} aspect={aspect} />)}
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
 * What Katutubo is, and the way in. On the map, pointing at a pin or an island group leans the
 * opening view toward it.
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
      <Recede sectionId="intro" enter={false} className="frame--intro">
        <div className="card frame__body">
          <p className="over">{s.over}</p>
          <h1>{strings.site.name}</h1>
          <p className="lede">{s.lede}</p>
          <div className="begin">
            <button type="button" className="btn" onClick={() => goToSection(`region-${REGIONS[0].toLowerCase()}`)}>{s.begin}</button>
            <ScrollCue label={s.cue} />
          </div>
        </div>
      </Recede>
    </div>
  )
}

/** An island group at mid zoom: its name and one line. Its three peoples are named on the map itself. */
function Region({ s }: { s: Extract<Section, { kind: 'region' }> }) {
  return (
    <section id={s.id} data-world={s.id} className="sec sec--region" aria-labelledby={`h-${s.id}`}>
      <Recede sectionId={s.id} className="frame--side">
        <div className="card frame__body">
          <p className="over">{s.region}</p>
          <h2 id={`h-${s.id}`}>{strings.regions[s.region]}</h2>
          <p className="lede">{s.peoples.map((g) => g.name).join(' · ')}</p>
        </div>
      </Recede>
    </section>
  )
}

/** A people's stop: their name, one line, and their land. */
function People({ g }: { g: Group }) {
  const s = strings.journey
  const id = `stop-${g.slug}`
  return (
    <section id={id} data-world={id} className={`sec sec--people ${g.placeholder ? 'is-soon' : ''}`} aria-labelledby={`h-${id}`} style={{ ['--c' as string]: g.color }}>
      <Recede sectionId={id} className="frame--side">
        <div className="card frame__body">
          <p className="over">{g.region}</p>
          <h2 id={`h-${id}`}>{g.name}</h2>
          {g.aka && <p className="small">{fill(s.aka, { aka: g.aka })}</p>}
          <p className="lede">{g.placeholder ? g.angle : g.tagline || g.angle}</p>
          {g.placeholder ? <p className="small status">{strings.soon.title}</p> : g.draft && <p className="small status" role="note">{s.draft}</p>}
        </div>
      </Recede>
    </section>
  )
}

/** One chapter of a finished issue: its words held at one edge, the land and its object at the centre. */
function Chapter({ g, index }: { g: Group; index: number }) {
  const c = g.chapters[index]
  const id = chapterId(g.slug, c.id)
  const spec = DESIGNS[g.slug]?.demos[c.id]
  // a longer chapter gets a longer stretch of the journey, so each paragraph has room to be read
  const steps = useMemo(() => blocks(splitLede(c.html).rest).length, [c.html])
  return (
    <section id={id} data-world={id} className="sec sec--chapter" style={{ ['--c' as string]: g.color, ['--steps' as string]: steps }}>
      <Recede sectionId={id} className={`frame--chapter ${index % 2 ? 'is-flipped' : ''}`}>
        <div className="frame__body"><ChapterCard chapter={c} index={index} people={g.name} id={id} /></div>
        {spec && <div className="frame__aside"><Demo spec={spec} chapter={c} group={g} sectionId={id} /></div>}
      </Recede>
    </section>
  )
}

function Sources({ g }: { g: Group }) {
  const id = `sources-${g.slug}`
  return (
    <section id={id} data-world={id} className="sec sec--sources" aria-labelledby={`h-${id}`} style={{ ['--c' as string]: g.color }}>
      <Recede sectionId={id} className="frame--side">
        <div className="card frame__body">
          <p className="over">{g.name}</p>
          <h2 id={`h-${id}`}>{strings.journey.sources}</h2>
          <div className="prose small" dangerouslySetInnerHTML={{ __html: g.sources ?? '' }} />
        </div>
      </Recede>
    </section>
  )
}

function End() {
  const s = strings.journey
  const soon = groups.filter((g) => g.placeholder).length
  return (
    <section id="end" data-world="end" className="sec sec--end" aria-labelledby="h-end">
      <Recede sectionId="end" exit={false} className="frame--side">
        <div className="card frame__body">
          <h2 id="h-end">{s.endTitle}</h2>
          <p className="lede">{fill(s.endBody, { ready: groups.length - soon, soon })}</p>
          <div className="end__links">
            <button type="button" className="btn" onClick={() => goToSection('intro')}>{s.again}</button>
            <Link to="/issues" className="btn btn--quiet">{s.issues}</Link>
          </div>
        </div>
      </Recede>
    </section>
  )
}

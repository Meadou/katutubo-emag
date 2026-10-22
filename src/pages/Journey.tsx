import { useEffect, useMemo, useRef, useState, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PROVINCES, getGroup, groups, type Group } from '../content'
import { THEMES, type Theme } from '../content/traits'
import { doc } from '../content/front'
import { goToSection, journey, useJourney, useNearest } from '../worlds/engine'
import { archipelagoCamera, buildJourney, carries, chapterId, compareId, provinceId, sectionFor, stopId, zoomAbout, type Section } from '../worlds/journeys'
import { DESIGNS } from '../worlds/issues'
import { useAspect } from '../worlds/useAspect'
import { ChapterCard } from '../ui/ChapterCard'
import Recede from '../ui/Recede'
import ScrollCue from '../ui/ScrollCue'
import Instruments from '../ui/Instruments'
import { useUi } from '../ui/store'
import { blocks, splitLede } from '../ui/chapterText'
import Demo from '../demos/Demo'
import { fill, strings } from '../i18n/t'

/**
 * The whole magazine as one journey over the paper map: the cover on the whole country, the descent
 * onto the Davao Gulf, the introduction, the peoples province by province around the gulf, the
 * comparison across all ten, cultural significance, the conclusion back on the whole country, and the
 * note on respect and the references. Each section's words are held still in a frame that fades in
 * place (the long parts read as ordinary pages); the scroll moves the camera. Deep links
 * (#/group/mandaya, #/group/mandaya/music) land on their section.
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
      {sections.map((s) => <JourneySection key={s.id} s={s} />)}
    </article>
  )
}

function JourneySection({ s }: { s: Section }) {
  switch (s.kind) {
    case 'intro': return <Cover />
    case 'introduction': return <Introduction />
    case 'province': return <ProvinceStop s={s} />
    case 'zoom': return <div id={s.id} data-world={s.id} className="sec sec--zoom" aria-hidden="true" />
    case 'people': return <People g={s.group} />
    case 'chapter': return <Chapter g={s.group} index={s.index} />
    case 'compare': return <Compare theme={s.theme} />
    case 'compare-table': return <CompareTable />
    case 'part': return <Part id={s.id} docKey={s.doc} />
    case 'end': return <End />
  }
}

/**
 * The cover: the title, the people who made it, and the instruments the magazine is about. On the
 * map, pointing at a pin leans the opening view toward that people.
 */
function Cover() {
  const s = strings.intro
  const near = useNearest()
  const hovered = useUi((u) => u.hovered)
  const setHovered = useUi((u) => u.setHovered)
  const aspect = useAspect()
  useEffect(() => {
    const g = groups.find((x) => x.slug === hovered)
    journey.focus = near === 'intro' && g ? zoomAbout(archipelagoCamera(aspect), g, 0.6) : null
  }, [hovered, near, aspect])
  useEffect(() => () => { journey.focus = null; setHovered(null) }, [setHovered])

  return (
    <div id="intro" data-world="intro" className="sec sec--intro">
      <Recede sectionId="intro" enter={false} className="frame--intro">
        <div className="card frame__body cover">
          <p className="over">{s.over}</p>
          <h1>{strings.site.name}</h1>
          <p className="cover__title">{s.title}</p>
          <p className="lede">{s.lede}</p>
          <Instruments />
          <div className="cover__by">
            <p className="small">{s.by}</p>
            <ul className="cover__members">{s.members.map((m) => <li key={m}>{m}</li>)}</ul>
          </div>
          <div className="begin">
            <button type="button" className="btn" onClick={() => goToSection('introduction')}>{s.begin}</button>
            <ScrollCue label={s.cue} />
          </div>
        </div>
      </Recede>
    </div>
  )
}

/** The magazine's parts, as links into the journey: the contents of this issue. */
function Contents() {
  const p = strings.parts
  const go = (id: string) => (e: MouseEvent) => { e.preventDefault(); goToSection(id) }
  return (
    <nav className="contents" aria-label={strings.introduction.contents}>
      <p className="small contents__title">{strings.introduction.contents}</p>
      <ol>
        <li><a href="#introduction" onClick={go('introduction')}>{p.introduction}</a></li>
        <li>
          <a href={`#${provinceId(PROVINCES[0])}`} onClick={go(provinceId(PROVINCES[0]))}>{p.provinces}</a>
          <ul className="contents__provinces">
            {PROVINCES.map((pr) => (
              <li key={pr}>
                <a href={`#${provinceId(pr)}`} onClick={go(provinceId(pr))}>{pr}</a>
                <span className="small"> · {groups.filter((g) => g.province === pr).map((g) => g.name).join(', ')}</span>
              </li>
            ))}
          </ul>
        </li>
        <li><a href={`#${compareId(THEMES[0].key)}`} onClick={go(compareId(THEMES[0].key))}>{p.compare}</a></li>
        <li><a href="#significance" onClick={go('significance')}>{p.significance}</a></li>
        <li><a href="#conclusion" onClick={go('conclusion')}>{p.conclusion}</a></li>
        <li><a href="#respect" onClick={go('respect')}>{p.respect}</a></li>
        <li><a href="#references" onClick={go('references')}>{p.references}</a></li>
      </ol>
    </nav>
  )
}

/** The introduction, on the arrival: the region parted into its provinces, and the contents of the issue. */
function Introduction() {
  const d = doc('introduction')
  const s = strings.introduction
  return (
    <section id="introduction" data-world="introduction" className="sec sec--read" aria-labelledby="h-introduction">
      <div className="card read-card read-card--intro">
        <p className="over">{s.over}</p>
        <h2 id="h-introduction">{s.title}</h2>
        {d.placeholder ? <p className="lede status">{s.soon}</p> : (
          <div className="prose">
            <div dangerouslySetInnerHTML={{ __html: d.lede }} />
            {d.parts.map((p) => <div key={p.id}><h3>{p.title}</h3><div dangerouslySetInnerHTML={{ __html: p.html }} /></div>)}
          </div>
        )}
        <Contents />
      </div>
    </section>
  )
}

/** A province seen whole, lifted from the others: its name, and its two peoples (named on the map). */
function ProvinceStop({ s }: { s: Extract<Section, { kind: 'province' }> }) {
  return (
    <section id={s.id} data-world={s.id} className="sec sec--region" aria-labelledby={`h-${s.id}`}>
      <Recede sectionId={s.id} className="frame--side">
        <div className="card frame__body">
          <p className="over">{fill(strings.province.over, { n: PROVINCES.indexOf(s.province) + 1, of: PROVINCES.length })}</p>
          <h2 id={`h-${s.id}`}>{s.province}</h2>
          <p className="lede">{s.peoples.map((g) => g.name).join(' · ')}</p>
        </div>
      </Recede>
    </section>
  )
}

/** A people's stop: their name, their language, one line, and their land. */
function People({ g }: { g: Group }) {
  const s = strings.journey
  const id = stopId(g.slug)
  return (
    <section id={id} data-world={id} className={`sec sec--people ${g.placeholder ? 'is-soon' : ''}`} aria-labelledby={`h-${id}`} style={{ ['--c' as string]: g.color }}>
      <Recede sectionId={id} className="frame--side">
        <div className="card frame__body">
          <p className="over">{g.region}</p>
          <h2 id={`h-${id}`}>{g.name}</h2>
          {g.aka && <p className="small">{fill(s.aka, { aka: g.aka })}</p>}
          {g.language && <p className="small">{fill(s.language, { language: g.language })}</p>}
          {!g.placeholder && (g.tagline || g.angle) && <p className="lede">{g.tagline || g.angle}</p>}
          {g.placeholder ? <p className="small status">{g.unavailable ? strings.unavailable.title : strings.soon.title}</p> : g.draft && <p className="small status" role="note">{s.draft}</p>}
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

/** One theme compared across all ten peoples: the prose beside the map, where the peoples who carry it are lit. */
function Compare({ theme }: { theme: Theme }) {
  const s = strings.compare
  const id = compareId(theme.key)
  const k = THEMES.indexOf(theme)
  const part = doc('compare').parts.find((p) => p.theme === theme.key)
  const lit = groups.filter((g) => carries(g, theme) !== null)
  return (
    <section id={id} data-world={id} className="sec sec--compare" aria-labelledby={`h-${id}`}>
      <Recede sectionId={id} className="frame--side frame--compare">
        <div className="card frame__body">
          <p className="over">{fill(s.over, { n: k + 1, of: THEMES.length })}</p>
          <h2 id={`h-${id}`}>{part?.title ?? theme.label}</h2>
          {part ? <div className="prose" dangerouslySetInnerHTML={{ __html: part.html }} /> : <p className="small status">{s.soon}</p>}
          {lit.length ? (
            <>
              <p className="small">{s.carry}</p>
              <ul className="compare__lit">
                {lit.map((g) => <li key={g.slug} style={{ ['--c' as string]: g.color }}><strong>{carries(g, theme)}</strong>{theme.kind === 'music' && <span className="small"> · {g.name}</span>}</li>)}
              </ul>
            </>
          ) : <p className="small">{s.none}</p>}
        </div>
      </Recede>
    </section>
  )
}

const themeLabel = (key: string) => THEMES.find((t) => t.key === key)?.label ?? key

/** What a people's row holds in the comparison: their stories' themes and their instruments by name. */
function Facts({ g }: { g: Group }) {
  const s = strings.compare
  return (
    <>
      <td>{g.province}</td>
      <td>{g.language || <span className="soft">{s.unknown}</span>}</td>
      <td>{g.themes.length ? g.themes.map(themeLabel).join('; ') : <span className="soft">{s.unknown}</span>}</td>
      <td>{g.instruments.length ? g.instruments.map((i) => `${i.name} (${themeLabel(i.trait).toLowerCase()})`).join('; ') : <span className="soft">{s.unknown}</span>}</td>
    </>
  )
}

/** All ten side by side, and any two put next to each other. */
function CompareTable() {
  const s = strings.compare
  const [a, setA] = useState(groups[0]?.slug ?? '')
  const [b, setB] = useState(groups[groups.length - 1]?.slug ?? '')
  const pair = [getGroup(a), getGroup(b)].filter(Boolean) as Group[]
  return (
    <section id="compare-table" data-world="compare-table" className="sec sec--read" aria-labelledby="h-compare-table">
      <div className="card read-card">
        <p className="over">{strings.parts.compare}</p>
        <h2 id="h-compare-table">{s.tableTitle}</h2>
        <p className="small">{s.tableNote}</p>
        <div className="table-wrap">
          <table className="compare-table">
            <thead><tr><th scope="col">{s.people}</th><th scope="col">{s.province}</th><th scope="col">{s.language}</th><th scope="col">{s.stories}</th><th scope="col">{s.music}</th></tr></thead>
            <tbody>
              {groups.map((g) => (
                <tr key={g.slug} style={{ ['--c' as string]: g.color }}>
                  <th scope="row"><Link to={`/group/${g.slug}`}>{g.name}</Link></th>
                  <Facts g={g} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3 className="pair__title">{s.pick}</h3>
        <div className="pair__pick">
          <label>{s.first}<select value={a} onChange={(e) => setA(e.target.value)}>{groups.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}</select></label>
          <label>{s.second}<select value={b} onChange={(e) => setB(e.target.value)}>{groups.map((g) => <option key={g.slug} value={g.slug}>{g.name}</option>)}</select></label>
        </div>
        <div className="pair">
          {pair.map((g, i) => (
            <dl key={`${g.slug}-${i}`} className="pair__card" style={{ ['--c' as string]: g.color }}>
              <dt className="pair__name">{g.name}</dt>
              <dd><span className="small">{s.province}</span> {g.province}</dd>
              <dd><span className="small">{s.language}</span> {g.language || s.unknown}</dd>
              <dd><span className="small">{s.stories}</span> {g.themes.length ? g.themes.map(themeLabel).join('; ') : s.unknown}</dd>
              <dd><span className="small">{s.music}</span> {g.instruments.length ? g.instruments.map((x) => x.name).join(', ') : s.unknown}</dd>
            </dl>
          ))}
        </div>
      </div>
    </section>
  )
}

/** A part of the magazine read as an ordinary page over the map: significance, the conclusion, respect, the references. */
function Part({ id, docKey }: { id: string; docKey: string }) {
  const d = doc(docKey)
  const title = strings.parts[docKey as keyof typeof strings.parts] ?? d.title
  return (
    <section id={id} data-world={id} className="sec sec--read" aria-labelledby={`h-${id}`}>
      <div className="card read-card">
        <h2 id={`h-${id}`}>{title}</h2>
        {d.placeholder ? <p className="lede status">{strings.part.soon}</p> : (
          <div className="prose">
            <div dangerouslySetInnerHTML={{ __html: d.lede }} />
            {d.parts.map((p) => <div key={p.id} id={`${id}-${p.id}`}><h3>{p.title}</h3><div dangerouslySetInnerHTML={{ __html: p.html }} /></div>)}
          </div>
        )}
        {docKey === 'references' && <PeoplesSources />}
      </div>
    </section>
  )
}

/** Each people's own sources, under the general references. */
function PeoplesSources() {
  const ready = groups.filter((g) => g.sources)
  if (!ready.length) return null
  return (
    <div className="prose refs">
      {ready.map((g) => <div key={g.slug}><h3>{g.name}</h3><div dangerouslySetInnerHTML={{ __html: g.sources ?? '' }} /></div>)}
    </div>
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


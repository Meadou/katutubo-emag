import { useEffect, useRef } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { getGroup, nextIssue } from '../content'
import { stageFor, storyFor, type Story } from '../content/story'
import { useMag } from '../store'
import { setTone } from '../hooks/useSections'
import { ArrowRight } from '../components/Icon'
import { coords } from '../format'

const INSTRUMENT_HINT: Record<string, string> = {
  agung: 'Click a gong to strike it. Hold to keep a rhythm going.',
  kuglung: 'Pluck the kuglung: along the melody string for its notes, or the drone string beside it.',
  saluray: 'Pluck the five strips of the saluray.',
  kubing: 'Click the kubing to set it buzzing.',
}

/** Wheel, keys, drag and swipe all move one step at a time. */
function useStepInput(go: (d: number) => void) {
  const lock = useRef(0)
  useEffect(() => {
    const step = (d: number) => {
      const now = performance.now()
      if (now < lock.current) return
      lock.current = now + 750
      go(d)
    }
    let acc = 0
    const onWheel = (e: WheelEvent) => {
      acc += e.deltaY + e.deltaX
      if (Math.abs(acc) > 60) { step(Math.sign(acc)); acc = 0 }
    }
    const onKey = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(e.key)) { e.preventDefault(); step(1) }
      if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(e.key)) { e.preventDefault(); step(-1) }
    }
    let sx = 0, sy = 0, down = false
    const onDown = (e: PointerEvent) => { down = true; sx = e.clientX; sy = e.clientY }
    const onUp = (e: PointerEvent) => {
      if (!down) return
      down = false
      const dx = e.clientX - sx, dy = e.clientY - sy
      if (Math.max(Math.abs(dx), Math.abs(dy)) > 70) step(Math.abs(dx) > Math.abs(dy) ? -Math.sign(dx) : -Math.sign(dy))
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('keydown', onKey)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointerup', onUp)
    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
    }
  }, [go])
}

function StoryView({ story, slug, at }: { story: Story; slug: string; at: number }) {
  const navigate = useNavigate()
  const setShot = useMag((s) => s.setShot)
  const setStage = useMag((s) => s.setStage)
  const steps = story.steps
  const i = Math.min(Math.max(at, 0), steps.length - 1)
  const step = steps[i]
  const last = i === steps.length - 1
  const goRef = useRef((d: number) => { void d })
  goRef.current = (d: number) => {
    const n = Math.min(Math.max(i + d, 0), steps.length - 1)
    if (n !== i) navigate(`/people/${slug}/${n + 1}`, { replace: true })
  }
  const go = useRef((d: number) => goRef.current(d)).current
  useStepInput(go)

  useEffect(() => {
    setShot(step.shot)
    setStage(stageFor(story, i))
  }, [story, i, step, setShot, setStage])

  const hints = [...new Set(step.instruments.map((x) => x.kind))].map((k) => INSTRUMENT_HINT[k])

  return (
    <article className="journey">
      <nav className="steps" aria-label="Story steps">
        <span className="steps__end" aria-hidden="true">{steps[0].title}</span>
        <ol>
          <span className="steps__track" aria-hidden="true"><i style={{ width: `${(i / Math.max(1, steps.length - 1)) * 100}%` }} /></span>
          {steps.map((s, k) => (
            <li key={s.id}>
              <Link to={`/people/${slug}/${k + 1}`} replace title={s.title} className={k === i ? 'is-on' : k < i ? 'is-past' : ''} aria-current={k === i ? 'step' : undefined}>
                <span className="visually-hidden">{s.title}</span>
              </Link>
            </li>
          ))}
        </ol>
        <span className="steps__end" aria-hidden="true">{steps[steps.length - 1].title}</span>
      </nav>

      <div className="sides">
      <section className="side side--left" key={`l-${step.id}`}>
        {i === 0 && story.draft && (
          <p className="draft-note" role="note">Draft. Facts still need to be checked against community, NCIP and academic sources.</p>
        )}
        <div className="prose" dangerouslySetInnerHTML={{ __html: step.html }} />
      </section>

      <aside className="side side--right" key={`r-${step.id}`} aria-label="Key terms">
        {step.facts.length > 0 && (
          <dl className="facts">
            {step.facts.map((f) => (
              <div key={f.term}><dt>{f.term}</dt><dd>{f.gloss}</dd></div>
            ))}
          </dl>
        )}
        {hints.length > 0 && (
          <div className="play-hint">
            {hints.map((h) => <p key={h}>{h}</p>)}
            <p className="play-hint__note">Sounds are synthesized in your browser to suggest each instrument. They are not traditional recordings.</p>
          </div>
        )}
        {last && story.sources && (
          <div className="story-sources">
            <h2>Sources</h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: story.sources }} />
          </div>
        )}
      </aside>
      </div>

      <h1 className="step-title" key={`t-${step.id}`}>{step.title}</h1>

      <div className="stepper">
        <span className="stepper__count mono">{String(i + 1).padStart(2, '0')} / {String(steps.length).padStart(2, '0')}</span>
        <button type="button" onClick={() => go(-1)} disabled={i === 0} aria-label="Previous step"><ArrowRight /></button>
        <button type="button" onClick={() => go(1)} disabled={last} aria-label="Next step"><ArrowRight /></button>
        <span className="stepper__hint">Scroll, drag or use the arrow keys</span>
      </div>
    </article>
  )
}

/** A people without a story yet: the camera goes to their place, and a short card says what is there. */
function PlaceView({ slug }: { slug: string }) {
  const g = getGroup(slug)!
  const setShot = useMag((s) => s.setShot)
  const setStage = useMag((s) => s.setStage)
  useEffect(() => { setShot({ lon: g.lon, lat: g.lat, dist: 1.6, tilt: 0.62, yaw: -0.25 }); setStage(null) }, [g, setShot, setStage])
  const next = nextIssue(g.slug)
  return (
    <article className="journey">
      <section className="side side--left">
        <p className="place-card__region">{g.region} · <span className="mono">{coords(g)}</span></p>
        {g.placeholder ? (
          <p className="prose">This issue is still being prepared. Its stories, music and crafts will be shared here once they have been gathered and checked with care.</p>
        ) : (
          <p className="prose">{g.tagline}</p>
        )}
        <div className="actions">
          {!g.placeholder && <Link to={`/group/${g.slug}`} className="btn btn--primary">Read the issue <ArrowRight /></Link>}
          {g.placeholder && next && <Link to={`/people/${next.slug}`} className="btn">Visit the {next.name} <ArrowRight /></Link>}
          <Link to="/" className="btn">Back to the map</Link>
        </div>
      </section>
      <h1 className="step-title">{g.name}</h1>
    </article>
  )
}

export default function People() {
  const { slug = '', step } = useParams()
  const story = storyFor(slug)
  useEffect(() => setTone('dark'), [])
  useEffect(() => () => { useMag.getState().setShot(null); useMag.getState().setStage(null) }, [])
  if (!getGroup(slug) && !story) {
    return (
      <section className="article article--missing">
        <h1>Place not found</h1>
        <p><Link to="/">Back to the map</Link></p>
      </section>
    )
  }
  if (story) {
    // a people inside a story opens at the story's first step about them
    const start = step ? Number(step) - 1 : story.starts[slug] ?? 0
    return <StoryView story={story} slug={slug} at={Number.isFinite(start) ? start : 0} />
  }
  return <PlaceView slug={slug} />
}

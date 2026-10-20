import { useEffect, useRef, type MouseEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGroup, nextIssue } from '../content'
import { frameState, useMag } from '../store'
import { setTone, useSections } from '../hooks/useSections'
import MusicPlayer from '../components/MusicPlayer'
import Panel from '../components/Panel'
import { ArrowRight } from '../components/Icon'
import { coords } from '../format'

/** Chapters alternate grounds, the way the scroll story does: bone, charcoal, bone… */
const toneOf = (i: number) => (i % 2 === 0 ? 'light' : 'dark')

export default function Article() {
  const { slug = '' } = useParams()
  const group = getGroup(slug)
  const chapter = useMag((s) => s.chapter)
  const setChapter = useMag((s) => s.setChapter)
  const root = useRef<HTMLElement>(null)
  const refs = useRef<(HTMLElement | null)[]>([])

  // The section crossing the middle of the screen sets the tone and the chapter (and so the 3D object).
  useSections(root, (el) => { if (el.dataset.i !== undefined) setChapter(Number(el.dataset.i)) }, [group])

  useEffect(() => { if (!group) setTone('dark') }, [group])

  // The current chapter's object comes apart as its section scrolls past.
  useEffect(() => {
    if (!group || group.placeholder) { frameState.explode = 0; return }
    const onScroll = () => {
      const el = refs.current[useMag.getState().chapter]
      if (!el) return
      const r = el.getBoundingClientRect()
      const p = (window.innerHeight * 0.85 - r.top) / (r.height * 0.7)
      frameState.explode = Math.min(1, Math.max(0, p))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => { window.removeEventListener('scroll', onScroll); frameState.explode = 0 }
  }, [group])

  if (!group) {
    return (
      <section className="article article--missing">
        <h1>Story not found</h1>
        <p><Link to="/issues">Back to the issues</Link></p>
      </section>
    )
  }

  const next = nextIssue(group.slug)

  if (group.placeholder) {
    return (
      <article ref={root} className="article article--soon" style={{ ['--c' as string]: group.color }}>
        <header className="article__hero" data-tone="dark">
          <h1>{group.name}</h1>
          <p className="article__region">{group.region} · <span className="mono">{coords(group)}</span></p>
          <p className="article__tagline">Coming soon</p>
          <p className="article__soon">
            This issue is still being prepared. Its stories, music and crafts will be shared here once they have been gathered and checked with care.
          </p>
        </header>
        {next && (
          <footer className="next" data-tone="dark">
            <p className="next__label">Read a finished issue</p>
            <Link to={`/group/${next.slug}`} style={{ ['--c' as string]: next.color }}>{next.name} <ArrowRight /></Link>
          </footer>
        )}
      </article>
    )
  }

  const go = (i: number) => (e: MouseEvent) => {
    e.preventDefault()
    refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <article ref={root} className="article" style={{ ['--c' as string]: group.color }}>
      <header className="article__hero" data-tone="dark">
        <h1>{group.name}</h1>
        <p className="article__region">{group.region} · <span className="mono">{coords(group)}</span></p>
        <p className="article__tagline">{group.tagline}</p>
        {group.draft && (
          <p className="draft-note" role="note">
            Draft. Facts still need to be checked against community, NCIP and academic sources.
          </p>
        )}
      </header>

      {group.chapters.map((c, i) => (
        <section key={c.id} id={c.id} data-i={i} data-tone={toneOf(i)} ref={(el) => { refs.current[i] = el }}
          className={`chapter ${i === chapter ? 'is-on' : ''}`}>
          <div className="chapter__text">
            <h2>{c.title}</h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: c.html }} />
            {/^music/i.test(c.title) && /gong|gangsa|klintang|agung/i.test(c.html) && <MusicPlayer group={group} />}
          </div>
        </section>
      ))}

      {group.sources && (
        <section className="sources" data-tone={toneOf(group.chapters.length)}>
          <h2>Sources and further reading</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: group.sources }} />
        </section>
      )}

      {next && (
        <footer className="next" data-tone="dark">
          <p className="next__label">Next issue</p>
          <Link to={`/group/${next.slug}`} style={{ ['--c' as string]: next.color }}>{next.name} <ArrowRight /></Link>
        </footer>
      )}

      <Panel label="Reading position">
        <nav aria-label="Chapters">
          <ol className="chapters">
            {group.chapters.map((c, i) => (
              <li key={c.id}>
                <a href={`#/group/${group.slug}`} className={i === chapter ? 'is-on' : ''} aria-current={i === chapter ? 'step' : undefined} onClick={go(i)}>
                  <span className="mono">{String(i + 1).padStart(2, '0')}</span> {c.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </Panel>
    </article>
  )
}

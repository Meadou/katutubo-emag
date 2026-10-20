import { useEffect, useRef } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getGroup, nextIssue } from '../content'
import { useMag } from '../store'
import MusicPlayer from '../components/MusicPlayer'

export default function Article() {
  const { slug = '' } = useParams()
  const group = getGroup(slug)
  const chapter = useMag((s) => s.chapter)
  const setChapter = useMag((s) => s.setChapter)
  const refs = useRef<(HTMLElement | null)[]>([])

  // The chapter whose section crosses the middle of the screen drives the 3D object.
  useEffect(() => {
    if (!group || group.placeholder) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setChapter(Number((e.target as HTMLElement).dataset.i))
      },
      { rootMargin: '-45% 0px -45% 0px' },
    )
    refs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [group, setChapter])

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
      <article className="article article--soon" style={{ ['--c' as string]: group.color }}>
        <header className="article__hero">
          <p className="kicker">{group.region}</p>
          <h1>{group.name}</h1>
          <p className="article__tagline">Coming soon</p>
          <p className="article__soon">
            This issue is still being prepared. Its stories, music and crafts will be shared here once they have been gathered and checked with care.
          </p>
        </header>
        {next && (
          <footer className="next">
            <p className="kicker">Read a finished issue</p>
            <Link to={`/group/${next.slug}`} style={{ color: next.color }}>{next.name} →</Link>
          </footer>
        )}
      </article>
    )
  }

  return (
    <article className="article" style={{ ['--c' as string]: group.color }}>
      <header className="article__hero">
        <p className="kicker">{group.region}</p>
        <h1>{group.name}</h1>
        <p className="article__tagline">{group.tagline}</p>
        {group.draft && (
          <p className="draft-note" role="note">
            Draft. Facts still need to be checked against community, NCIP and academic sources.
          </p>
        )}
        <span className="scroll-cue" aria-hidden="true">Scroll</span>
      </header>

      <nav className="toc" aria-label="Chapters">
        {group.chapters.map((c, i) => (
          <a key={c.id} href={`#/group/${group.slug}`} className={i === chapter ? 'is-on' : ''}
            onClick={(e) => { e.preventDefault(); refs.current[i]?.scrollIntoView({ behavior: 'smooth', block: 'start' }) }}>
            <span>{String(i + 1).padStart(2, '0')}</span> {c.title}
          </a>
        ))}
      </nav>

      {group.chapters.map((c, i) => (
        <section key={c.id} id={c.id} data-i={i} ref={(el) => { refs.current[i] = el }}
          className={`chapter ${i === chapter ? 'is-on' : ''}`}>
          <div className="chapter__card">
            <p className="chapter__no">Chapter {String(i + 1).padStart(2, '0')}</p>
            <h2>{c.title}</h2>
            <div className="prose" dangerouslySetInnerHTML={{ __html: c.html }} />
            {/^music/i.test(c.title) && <MusicPlayer group={group} />}
          </div>
        </section>
      ))}

      {group.sources && (
        <section className="sources">
          <h2>Sources &amp; further reading</h2>
          <div className="prose" dangerouslySetInnerHTML={{ __html: group.sources }} />
        </section>
      )}

      {next && (
        <footer className="next">
          <p className="kicker">Next issue</p>
          <Link to={`/group/${next.slug}`} style={{ color: next.color }}>{next.name} →</Link>
        </footer>
      )}
    </article>
  )
}

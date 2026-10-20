import { useMemo, type ReactNode } from 'react'
import type { Chapter } from '../content'
import Reveal from './Reveal'
import { splitLede } from './chapterText'
import { strings } from '../i18n/t'

/**
 * The anime.js pattern on paper: a short title, one plain sentence, the chapter's key terms as points,
 * then the rest of the text arriving strip by strip. Nothing is cut: every word of the article is here.
 */
export function ChapterCard({ chapter, index, people, id }: { chapter: Chapter; index: number; people: string; id: string }) {
  const { lede, rest } = useMemo(() => splitLede(chapter.html), [chapter.html])
  return (
    <article className="card chapter-card" aria-labelledby={`h-${id}`}>
      <p className="chapter-card__no"><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span> {people}</p>
      <h2 id={`h-${id}`}>{chapter.title}</h2>
      {lede && <p className="lede" dangerouslySetInnerHTML={{ __html: lede }} />}
      {chapter.terms.length > 0 && (
        <ul className="points" aria-label={strings.journey.terms}>
          {chapter.terms.map((t) => <li key={t}>{t}</li>)}
        </ul>
      )}
      <Reveal html={rest} />
    </article>
  )
}

/** The live demo beside a chapter: a title, the thing itself, and an honest caption. */
export function DemoCard({ title, caption, note, children }: { title: string; caption?: string; note?: string; children: ReactNode }) {
  return (
    <aside className="card demo-card" aria-label={title}>
      <h3>{title}</h3>
      <div className="demo-card__stage">{children}</div>
      {caption && <p className="demo-card__caption">{caption}</p>}
      {note && <p className="demo-card__note">{note}</p>}
    </aside>
  )
}

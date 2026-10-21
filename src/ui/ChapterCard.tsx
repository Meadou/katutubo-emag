import { useMemo, type ReactNode } from 'react'
import type { Chapter } from '../content'
import Steps from './Steps'
import { blocks, splitLede } from './chapterText'
import { strings } from '../i18n/t'

/**
 * A chapter, held still over the map: its title, one plain sentence, its key terms, then the rest of
 * the text stepping through in place, one block at a time. Nothing is cut: every word is here.
 */
export function ChapterCard({ chapter, index, people, id }: { chapter: Chapter; index: number; people: string; id: string }) {
  const { lede, rest } = useMemo(() => splitLede(chapter.html), [chapter.html])
  const body = useMemo(() => blocks(rest), [rest])
  return (
    <article className="card chapter-card" aria-labelledby={`h-${id}`}>
      {/* one block on a laptop; on a phone the head sits at the top and the body above the control, the visual between */}
      <div className="chapter-card__head">
        <p className="over"><span className="nums">{String(index + 1).padStart(2, '0')}</span> · {people}</p>
        <h2 id={`h-${id}`}>{chapter.title}</h2>
        {lede && <p className="lede" dangerouslySetInnerHTML={{ __html: lede }} />}
        {chapter.terms.length > 0 && (
          <p className="terms-line"><span className="visually-hidden">{strings.journey.terms}: </span>{chapter.terms.join(' · ')}</p>
        )}
      </div>
      {body.length > 0 && <div className="chapter-card__body"><Steps blocks={body} sectionId={id} /></div>}
    </article>
  )
}

/** A panel beside a chapter (the myths scene, or a flat demo without 3D): a title, the thing itself, an honest caption. */
export function DemoCard({ title, caption, note, children }: { title: string; caption?: string; note?: string; children: ReactNode }) {
  return (
    <aside className="wash demo-card" aria-label={title}>
      <h3>{title}</h3>
      <div className="demo-card__stage">{children}</div>
      {caption && <p className="demo-card__caption">{caption}</p>}
      {note && <p className="demo-card__note">{note}</p>}
    </aside>
  )
}

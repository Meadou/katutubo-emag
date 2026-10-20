import type { MouseEvent } from 'react'
import type { Chapter } from '../content'
import { goToSection, useNearest } from '../worlds/engine'
import { strings } from '../i18n/t'

/** The chapters as a slim rail at the edge: where you are, and a way to jump. */
export default function ChapterRail({ slug, chapters }: { slug: string; chapters: Chapter[] }) {
  const near = useNearest()
  const go = (id: string) => (e: MouseEvent) => {
    e.preventDefault()
    goToSection(`ch-${id}`)
    history.replaceState(null, '', `#/group/${slug}/${id}`)
  }
  return (
    <nav className="rail" aria-label={strings.issue.chapters}>
      <ol>
        {chapters.map((c) => (
          <li key={c.id}>
            <a href={`#/group/${slug}/${c.id}`} onClick={go(c.id)} className={near === `ch-${c.id}` ? 'is-on' : ''}
              aria-current={near === `ch-${c.id}` ? 'step' : undefined}>
              <span>{c.title}</span>
            </a>
          </li>
        ))}
      </ol>
    </nav>
  )
}

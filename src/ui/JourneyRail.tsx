import type { MouseEvent } from 'react'
import { groups } from '../content'
import { goToSection, useNearest } from '../worlds/engine'
import { REGIONS, chapterId, stopId, type Section } from '../worlds/journeys'
import type { WorldState } from '../worlds/types'
import { strings } from '../i18n/t'

/**
 * The journey as a strip of stops along the bottom: every people by island group, the one being
 * visited marked, and a finished issue's chapters while the reader is in it. Each is a link.
 */
export default function JourneyRail({ sections, worlds }: { sections: Section[]; worlds: Record<string, WorldState> }) {
  const near = useNearest()
  const here = worlds[near]?.people ?? sections.find((s) => s.id === near && s.kind === 'zoom' && s.id.startsWith('down-'))?.id.slice(5)
  const people = groups.find((g) => g.slug === here)
  const go = (id: string, hash: string, block: ScrollLogicalPosition = 'start') => (e: MouseEvent) => {
    e.preventDefault()
    goToSection(id, true, block)
    history.replaceState(null, '', hash)
  }
  const s = strings.journey
  return (
    // on screen from the start: it is the keyboard and screen-reader route to every people
    <nav className="rail" aria-label={s.rail}>
      {people && !people.placeholder && (
        <ol className="rail__chapters" aria-label={`${people.name}: ${s.chapters}`}>
          {people.chapters.map((c) => {
            const id = chapterId(people.slug, c.id)
            return (
              <li key={c.id}>
                <a href={`#/group/${people.slug}/${c.id}`} onClick={go(id, `#/group/${people.slug}/${c.id}`)}
                  className={near === id ? 'is-on' : ''} aria-current={near === id ? 'step' : undefined}>{c.title}</a>
              </li>
            )
          })}
        </ol>
      )}
      <ol className="rail__stops">
        {REGIONS.map((r) => (
          <li key={r} className="rail__region">
            <span className="rail__group" aria-hidden="true">{r}</span>
            <ol aria-label={r}>
              {groups.filter((g) => g.islandGroup === r).map((g) => (
                <li key={g.slug}>
                  <a href={`#/group/${g.slug}`} onClick={go(stopId(g.slug), `#/group/${g.slug}`, 'end')} style={{ ['--c' as string]: g.color }}
                    className={`${here === g.slug ? 'is-on' : ''} ${g.placeholder ? 'is-soon' : ''}`} aria-current={here === g.slug ? 'location' : undefined}>
                    {g.name}
                  </a>
                </li>
              ))}
            </ol>
          </li>
        ))}
      </ol>
    </nav>
  )
}

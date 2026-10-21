import { useEffect, useId, useRef, useState, type MouseEvent } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { getGroup, groups, type Group, type IslandGroup } from '../content'
import { goToSection, journey, useNearest } from '../worlds/engine'
import { REGIONS, chapterId, stopId } from '../worlds/journeys'
import { useUi } from './store'
import { focusSection } from './Recede'
import { strings } from '../i18n/t'

/** Where the reader is in the journey: a people (on its stop, chapters or the way down to it), or an island group. */
function whereAt(near: string): { people?: Group; region?: IslandGroup } {
  const slug = journey.worlds[near]?.people ?? (near.startsWith('down-') ? near.slice(5) : undefined)
  const people = slug ? getGroup(slug) : undefined
  if (people) return { people }
  const ids = journey.sections.map((s) => s.id)
  for (let i = ids.indexOf(near); i >= 0; i--) {
    const region = REGIONS.find((r) => ids[i] === `region-${r.toLowerCase()}`)
    if (region) return { region }
  }
  return {}
}

/**
 * The one control: a pill that says where you are ("Katutubo / Ifugao ▾") and opens onto every
 * people by island group, the current people's chapters, and the other pages. It also holds the
 * sound switch. It is the first thing the Tab key reaches: the keyboard and screen-reader route to
 * every people.
 */
export default function Crumb() {
  const s = strings.crumb
  const { pathname } = useLocation()
  const near = useNearest()
  const onJourney = pathname === '/' || pathname.startsWith('/group/')
  const { people, region } = onJourney ? whereAt(near) : {}
  const here = pathname === '/issues' ? s.issues : pathname === '/about' ? s.about : people?.name ?? region ?? s.journey

  const [open, setOpen] = useState(false)
  const root = useRef<HTMLDivElement>(null)
  const button = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const close = (focus = false) => { setOpen(false); if (focus) button.current?.focus() }

  // the menu closes on Escape (back to its button) and on a press anywhere outside it
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(true) }
    const onDown = (e: PointerEvent) => { if (!root.current?.contains(e.target as Node)) close() }
    document.addEventListener('keydown', onKey)
    document.addEventListener('pointerdown', onDown)
    return () => { document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onDown) }
  }, [open])

  // on the journey a choice moves the journey there at once; elsewhere the link opens it
  const go = (id: string, hash: string, block: ScrollLogicalPosition) => (e: MouseEvent) => {
    close()
    if (!onJourney) return
    e.preventDefault()
    goToSection(id, false, block)
    history.replaceState(null, '', hash)
    focusSection(id)
  }

  const sound = useUi((u) => u.sound)
  const setSound = useUi((u) => u.setSound)
  // turning sound on says what it is: synthesized, not a recording
  const [note, setNote] = useState(false)
  useEffect(() => {
    if (!sound) { setNote(false); return }
    setNote(true)
    const t = setTimeout(() => setNote(false), 6000)
    return () => clearTimeout(t)
  }, [sound])

  return (
    <header className="crumb" ref={root}>
      <div className="crumb__pill">
        <Link to="/" className="crumb__home" onClick={go('intro', '#/', 'start')}>{strings.site.name}</Link>
        <span className="crumb__sep" aria-hidden="true">/</span>
        <button ref={button} type="button" className="crumb__here" aria-expanded={open} aria-controls={menuId} onClick={() => setOpen(!open)}>
          <span className="visually-hidden">{s.open}: </span>{here}<span className="crumb__caret" aria-hidden="true">▾</span>
        </button>
        <button type="button" className={`crumb__sound ${sound ? 'is-on' : ''}`} aria-pressed={sound} onClick={() => setSound(!sound)}>
          <span className="sound-dot" aria-hidden="true" /><span className="crumb__sound-label">{s.sound}</span>
        </button>
      </div>

      <nav id={menuId} className="crumb__menu" aria-label={s.label} hidden={!open}>
        <div className="crumb__groups">
          {REGIONS.map((r) => (
            <div key={r} className="crumb__group">
              <p className="crumb__title">{r}</p>
              <ul>
                {groups.filter((g) => g.islandGroup === r).map((g) => (
                  <li key={g.slug}>
                    <a href={`#/group/${g.slug}`} onClick={go(stopId(g.slug), `#/group/${g.slug}`, 'end')} className={g.placeholder ? 'is-soon' : ''}
                      aria-current={people?.slug === g.slug ? 'location' : undefined} style={{ ['--c' as string]: g.color }}>
                      {g.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {people && !people.placeholder && (
          <div className="crumb__group crumb__chapters">
            <p className="crumb__title">{people.name}: {s.chapters}</p>
            <ul>
              {people.chapters.map((c) => (
                <li key={c.id}>
                  <a href={`#/group/${people.slug}/${c.id}`} onClick={go(chapterId(people.slug, c.id), `#/group/${people.slug}/${c.id}`, 'start')}
                    aria-current={near === chapterId(people.slug, c.id) ? 'step' : undefined}>{c.title}</a>
                </li>
              ))}
            </ul>
          </div>
        )}
        <ul className="crumb__more">
          <li><Link to="/issues" onClick={() => close()}>{s.issues}</Link></li>
          <li><Link to="/about" onClick={() => close()}>{s.about}</Link></li>
        </ul>
      </nav>

      <p className="crumb__note" role="status">{note ? s.soundNote : ''}</p>
    </header>
  )
}

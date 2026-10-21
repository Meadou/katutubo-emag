import { useEffect, useRef, useState, type MouseEvent } from 'react'
import { goToSection, journey, onFrame, useNearest } from '../worlds/engine'
import { stopId } from '../worlds/journeys'
import { DESIGNS } from '../worlds/issues'
import { playPattern, type GongKind } from '../audio/patterns'
import type { Label } from '../worlds/types'
import { spots } from './spots'
import { focusSection } from './Recede'
import { strings } from '../i18n/t'

/** How far a label sits from the point it names, up and to the side, in CSS pixels. */
const OFF_X = 36
const OFF_Y = 64
/** How close a label may come to the edge of the screen. */
const EDGE = 10

/** The gongs' label: their name in the chapter's words, and the pattern to play (the keyboard route to the gongs). */
function GongLabel({ label, kind }: { label: Label; kind: GongKind }) {
  const s = strings.labels
  const [playing, setPlaying] = useState(false)
  const stopper = useRef<(() => void) | null>(null)
  useEffect(() => () => stopper.current?.(), [])
  const toggle = () => {
    if (playing) { stopper.current?.(); stopper.current = null; setPlaying(false); return }
    setPlaying(true)
    stopper.current = playPattern(kind, () => setPlaying(false))
  }
  return (
    <>
      <p><strong>{label.text}</strong> {s.tapGong}</p>
      <button type="button" className="btn btn--small" aria-pressed={playing} onClick={toggle}>{playing ? s.stop : s.play}</button>
      <p className="small">{s.synthesized}</p>
    </>
  )
}

/**
 * Words attached to the 3D map by thin leader lines: a people's name at their place, each of an
 * island group's peoples at theirs, and the chapter's object with what can be done with it. Only the
 * section being read has labels; on a phone, only the first shows.
 */
export default function Labels() {
  const near = useNearest()
  const world = journey.worlds[near]
  const labels = world && !world.travel ? world.labels ?? [] : []
  const boxes = useRef(new Map<string, HTMLElement>())
  const lines = useRef(new Map<string, SVGLineElement>())
  const dots = useRef(new Map<string, SVGCircleElement>())

  useEffect(() => onFrame(() => {
    const vw = window.innerWidth, phone = vw < 860
    // on a phone the chapter's head holds the top of the screen: a label stays below it
    const head = phone ? document.getElementById(journey.nearest)?.querySelector('.chapter-card__head') : null
    const top = head ? head.getBoundingClientRect().bottom + 8 : EDGE
    for (const s of spots.items) {
      const box = boxes.current.get(s.key), line = lines.current.get(s.key), dot = dots.current.get(s.key)
      if (!box || !line || !dot) continue
      // a label leans toward the roomier side, and never runs off the screen
      const w = box.offsetWidth, h = box.offsetHeight
      let flip = s.x > vw * 0.62
      if (!flip && s.x + OFF_X + w > vw - EDGE) flip = true
      if (flip && s.x - OFF_X - w < EDGE) flip = false
      const lx = flip ? Math.max(s.x - OFF_X, w + EDGE) : Math.min(s.x + OFF_X, vw - w - EDGE)
      // on a phone the label stays close to what it names
      const ly = Math.max(s.y - (phone ? OFF_Y * 0.3 : OFF_Y), top + h)
      box.style.transform = `translate(${lx}px, ${ly}px) translate(${flip ? '-100%' : '0'}, -100%)`
      box.style.visibility = s.on ? '' : 'hidden'
      line.setAttribute('x1', String(s.x)); line.setAttribute('y1', String(s.y))
      line.setAttribute('x2', String(lx)); line.setAttribute('y2', String(ly))
      line.style.visibility = box.style.visibility
      dot.setAttribute('cx', String(s.x)); dot.setAttribute('cy', String(s.y))
      dot.style.visibility = box.style.visibility
    }
  }), [])

  const jump = (slug: string) => (e: MouseEvent) => {
    e.preventDefault()
    goToSection(stopId(slug), false, 'end')
    history.replaceState(null, '', `#/group/${slug}`)
    focusSection(stopId(slug))
  }
  const gong = (DESIGNS[world?.people ?? '']?.demos.music as { gong?: GongKind } | undefined)?.gong ?? 'flat'

  return (
    <div className="labels" key={near}>
      <svg className="labels__lines" aria-hidden="true">
        {labels.map((l) => (
          <g key={l.key}>
            <line ref={(el) => { if (el) lines.current.set(l.key, el); else lines.current.delete(l.key) }} />
            <circle r={3} ref={(el) => { if (el) dots.current.set(l.key, el); else dots.current.delete(l.key) }} />
          </g>
        ))}
      </svg>
      {labels.map((l) => (
        <div key={l.key} ref={(el) => { if (el) boxes.current.set(l.key, el); else boxes.current.delete(l.key) }} className={`label ${l.object ? 'label--object' : ''}`}>
          {l.object === 'gong' ? <GongLabel label={l} kind={gong} />
            : l.object === 'loom' ? <p className="small">{strings.labels.weave}</p>
            : l.href ? <a href={l.href} onClick={jump(l.key)}><strong>{l.text}</strong></a>
            : <p><strong>{l.text}</strong>{l.sub && <span className="small nums"> {l.sub}</span>}</p>}
        </div>
      ))}
    </div>
  )
}

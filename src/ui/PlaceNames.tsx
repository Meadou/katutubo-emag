import { useEffect, useRef } from 'react'
import { journey, onFrame, useNearest } from '../worlds/engine'
import { spots } from './spots'

/**
 * Names printed on the map itself, centred on what they name: the Davao Region on the cover, then its
 * provinces, Davao City, Mount Apo, Samal Island and the gulf as the region parts. They are set in the
 * display face, like lettering on a printed map, and carry no links (the crumb and the cards do).
 */
export default function PlaceNames() {
  const near = useNearest()
  const world = journey.worlds[near]
  const names = world && !world.travel ? world.names ?? [] : []
  const els = useRef(new Map<string, HTMLElement>())

  useEffect(() => onFrame(() => {
    for (const s of spots.names) {
      const el = els.current.get(s.key)
      if (!el) continue
      // the region's name stands beside it, out over the sea; every other name is centred on its place
      el.style.transform = `translate(${s.x}px, ${s.y}px) translate(${el.dataset.kind === 'region' ? '0' : '-50%'}, -50%)`
      el.style.visibility = s.on ? '' : 'hidden'
    }
  }), [])

  return (
    <div className="place-names" key={near} aria-hidden="true">
      {names.map((n) => (
        <span key={n.key} ref={(el) => { if (el) els.current.set(n.key, el); else els.current.delete(n.key) }} className={`place-name place-name--${n.kind}`} data-kind={n.kind}>
          {n.text}
        </span>
      ))}
    </div>
  )
}

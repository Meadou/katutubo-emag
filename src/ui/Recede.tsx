import { useEffect, useRef, type ReactNode } from 'react'
import { journey } from '../worlds/engine'
import { useProgressFrame } from '../demos/useProgress'

/** Past this progress the reader has finished the text and the object gets the frame. */
const OUT = 0.55
/** …and by here the card is gone. The gap is the fade, so it never snaps. */
const GONE = 0.75
/** Coming back up, the card only returns below this — further down than OUT, so it cannot flicker. */
const RETURN = 0.45

/**
 * Whether the card is out of the way, and how far (0..1). Hysteresis, so a reader resting exactly at
 * the threshold does not see it pulse: it goes at GONE, and only comes back below RETURN.
 */
export function recedeAt(p: number, wasHidden: boolean): { hidden: boolean; k: number } {
  const hidden = p >= GONE ? true : p <= RETURN ? false : wasHidden
  const k = hidden ? 1 : Math.min(1, Math.max(0, (p - OUT) / (GONE - OUT)))
  return { hidden, k }
}

/**
 * A card that steps aside once its section has been read, leaving the chapter object and the land
 * alone on screen. It returns on scroll-up. It only ever moves and fades; the layout never changes,
 * and in calm mode it does not move at all.
 *
 * shortcut: only the chapter card recedes; the demo holds the frame. To recede the demo too, move
 * this wrapper to the section's children — the rule lives on the card, not the grid.
 */
export default function Recede({ sectionId, children }: { sectionId: string; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)

  useProgressFrame(sectionId, (p) => {
    const el = ref.current
    if (!el || journey.calm) return
    const { hidden, k } = recedeAt(p, el.dataset.hidden === 'true')
    el.dataset.hidden = String(hidden)
    el.style.opacity = String(1 - k)
    el.style.transform = `translateX(${k * 28}px)`
    el.style.pointerEvents = hidden ? 'none' : ''
    // invisible text must also leave the tab order, or Tab lands on a card nobody can see
    el.inert = hidden
  })

  // calm mode (and the moment the reader arrives) always starts visible and fully readable
  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (journey.calm) { el.style.opacity = ''; el.style.transform = ''; el.inert = false; el.dataset.hidden = 'false' }
  }, [sectionId])

  return <div ref={ref} className="recede">{children}</div>
}

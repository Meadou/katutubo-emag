import { useEffect, useRef, type ReactNode } from 'react'
import { goToSection, journey, onFrame } from '../worlds/engine'

/** The frame has faded in by here (it fades from the moment its section begins)… */
const IN_END = 0.08
/** …starts to go here, as the journey continues… */
const OUT = 0.86
/** …and is gone by here. The gap is the fade, so it never snaps. */
const GONE = 0.97
/** Coming back up, it only returns below this, well above where it left, so it cannot flicker. */
const BACK = 0.8

const ease = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t) }

/**
 * How far a section's frame is out of sight (`k`, 0 shown to 1 gone) at the section's reading
 * progress, which way it is moving (1 arriving from below, -1 leaving upward), and whether it counts
 * as hidden. Hysteresis on the way out, so a reader resting near the end does not see it pulse.
 */
export function frameAt(p: number, wasHidden: boolean, { enter = true, exit = true } = {}) {
  const kIn = enter ? 1 - ease(p / IN_END) : 0
  const gone = exit && (p >= GONE ? true : p <= BACK ? false : wasHidden)
  const kOut = !exit ? 0 : gone ? 1 : Math.min(1, Math.max(0, (p - OUT) / (GONE - OUT)))
  const k = Math.max(kIn, kOut)
  return { k, hidden: gone || kIn >= 0.999, dir: kIn >= kOut ? 1 : -1 }
}

const CONTROLS = 'a[href], button, input, select, textarea, [tabindex]'

/**
 * Takes a frame's controls out of the Tab order while it is out of sight (`on` false), and puts each
 * back as it was. Its words stay in the page for screen readers and find-in-page.
 */
export function tabbable(root: HTMLElement, on: boolean) {
  for (const el of root.querySelectorAll<HTMLElement>(CONTROLS)) {
    const was = el.dataset.tab
    if (!on && was === undefined) { el.dataset.tab = el.getAttribute('tabindex') ?? ''; el.tabIndex = -1 }
    else if (on && was !== undefined) {
      if (was) el.setAttribute('tabindex', was); else el.removeAttribute('tabindex')
      delete el.dataset.tab
    }
  }
}

/** Moves the keyboard to a section's heading once the journey has jumped there and its frame is in sight. */
export function focusSection(id: string) {
  requestAnimationFrame(() => requestAnimationFrame(() => {
    const h = document.getElementById(id)?.querySelector<HTMLElement>('h1, h2')
    if (!h) return
    h.tabIndex = -1
    h.focus({ preventScroll: true })
  }))
}

/**
 * A section's words, held still on screen while the camera moves: they fade in place as the
 * section begins and fade away as the journey continues, never travelling up the page. Only one
 * section's frame is ever in sight. In calm mode (no WebGL, or reduced motion) frames sit in the
 * page and scroll like ordinary text, and never fade.
 *
 * Everything stays in the page for screen readers. The Tab key reaches only the frame in sight (the
 * crumb's menu goes everywhere else); if a screen reader moves into a frame out of sight, the
 * journey goes to its section.
 */
export default function Recede({ sectionId, enter = true, exit = true, className = '', children }: {
  sectionId: string
  enter?: boolean
  exit?: boolean
  className?: string
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let last = '', shown: boolean | undefined
    return onFrame(() => {
      const el = ref.current
      if (!el) return
      const { k, hidden, dir } = journey.calm ? { k: 0, hidden: false, dir: 0 } : frameAt(journey.progress[sectionId] ?? 0, el.dataset.hidden === 'true', { enter, exit })
      const key = `${k.toFixed(3)}:${hidden}`
      if (key === last) return
      last = key
      if (shown !== !hidden) { tabbable(el, !hidden); shown = !hidden }
      el.dataset.hidden = String(hidden)
      el.style.opacity = journey.calm ? '' : String(1 - k)
      el.style.transform = journey.calm || k === 0 ? '' : `translateY(${dir * k * 16}px)`
    })
  }, [sectionId, enter, exit])

  const onFocus = () => { if (ref.current?.dataset.hidden === 'true') goToSection(sectionId, false) }
  return <div ref={ref} className={`frame ${className}`} data-hidden={enter ? 'true' : 'false'} onFocus={onFocus}>{children}</div>
}

import { useLayoutEffect, useSyncExternalStore, type RefObject } from 'react'
import { blendOf, dampWorld, mixBlended, mixCamera, resolveWorld } from './blend'
import { readingProgress, worldAt, type SectionBox } from './sections'
import type { Blended, Camera, WorldState } from './types'

/**
 * The scroll-world engine. Pages mark sections with `data-world="<id>"` and register the worlds those
 * ids name; one frame loop turns the scroll position into the blended world every renderer reads.
 * Nothing here re-renders React per frame: the 3D stage and the demos read `journey` directly.
 */
export const journey = {
  worlds: {} as Record<string, WorldState>,
  sections: [] as SectionBox[],
  els: [] as HTMLElement[],
  /** the world at the reading line, before smoothing */
  target: null as Blended | null,
  /** the world as shown: damped toward the target */
  current: null as Blended | null,
  /** section id → reading progress 0..1 */
  progress: {} as Record<string, number>,
  /** id of the section under the reading line */
  nearest: '',
  /** a camera the page asks to look toward for a moment (hovering a place on the cover) */
  focus: null as Camera | null,
  focusWeight: 0,
  /** reduced motion or static mode: worlds switch without easing */
  calm: false,
  dirty: true,
}

// development only: lets a test driver read the world being shown
if (import.meta.env.DEV && typeof window !== 'undefined') (window as unknown as { __journey: typeof journey }).__journey = journey

const frameListeners = new Set<(dt: number) => void>()
const nearestListeners = new Set<() => void>()

/** Run `cb` every frame after the world is updated. Returns an unsubscribe. */
export function onFrame(cb: (dt: number) => void) {
  frameListeners.add(cb)
  return () => { frameListeners.delete(cb) }
}

function measure() {
  const y = window.scrollY
  journey.sections = journey.els.map((el) => {
    const r = el.getBoundingClientRect()
    return { id: el.id || el.dataset.world!, world: el.dataset.world!, top: r.top + y, height: Math.max(1, r.height) }
  })
  journey.dirty = false
}

let skyEl: HTMLElement | null = null
let lastSky = ''

/**
 * The sky is painted straight onto its own element, and only when it changes. Nothing is written to
 * <html>: a custom property there re-styles the whole page (every chapter's text) each time it changes.
 */
function paint(w: Blended) {
  const sky = `linear-gradient(${w.sky[0]}, ${w.sky[1]})`
  if (sky === lastSky) return
  if (!skyEl || !skyEl.isConnected) skyEl = document.querySelector<HTMLElement>('.sky')
  if (skyEl) { skyEl.style.background = sky; lastSky = sky }
}

let started = false
let raf = 0
let last = 0

function frame(now: number) {
  raf = requestAnimationFrame(frame)
  const dt = Math.min(0.1, last ? (now - last) / 1000 : 1 / 60)
  last = now
  if (!journey.els.length) return
  if (journey.dirty) measure()
  const vh = window.innerHeight
  const y = window.scrollY
  const pos = worldAt(journey.sections, y, vh)
  for (const s of journey.sections) journey.progress[s.id] = readingProgress(s, y, vh)
  const sa = journey.sections[pos.fromIndex], sb = journey.sections[pos.toIndex]
  const a = sa && resolveWorld(sa.world, journey.progress[sa.id], journey.worlds)
  const b = sb && resolveWorld(sb.world, journey.progress[sb.id], journey.worlds)
  if (!a || !b) return
  const target = mixBlended(a, b, pos.t)
  // a page may ask the camera to lean toward a place for a moment
  const fw = journey.focus ? 1 : 0
  journey.focusWeight += (fw - journey.focusWeight) * (1 - Math.exp(-4 * dt))
  if (journey.focus && journey.focusWeight > 0.001) target.camera = mixCamera(target.camera, journey.focus, journey.focusWeight * 0.85)
  journey.target = target
  journey.current = journey.calm || !journey.current ? target : dampWorld(journey.current, target, 3.2, dt)
  const near = journey.sections[pos.index]?.id ?? ''
  if (near !== journey.nearest) {
    journey.nearest = near
    nearestListeners.forEach((l) => l())
  }
  paint(journey.current)
  frameListeners.forEach((cb) => cb(dt))
}

/** Starts the frame loop once for the whole app. */
export function startEngine() {
  if (started || typeof window === 'undefined' || typeof requestAnimationFrame !== 'function') return
  started = true
  const markDirty = () => { journey.dirty = true }
  window.addEventListener('resize', markDirty)
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(markDirty).observe(document.body)
  raf = requestAnimationFrame(frame)
}
export function stopEngine() { cancelAnimationFrame(raf); started = false }

/**
 * Registers a page's journey: every `[data-world]` element inside `root`, in order, and the worlds
 * their ids name. The first world shows at once (no easing on arrival).
 */
export function useJourney(root: RefObject<HTMLElement | null>, worlds: Record<string, WorldState>, key: string) {
  useLayoutEffect(() => {
    const host = root.current
    if (!host) return
    journey.worlds = worlds
    journey.els = [...host.querySelectorAll<HTMLElement>('[data-world]')]
    journey.dirty = true
    journey.focus = null
    if (journey.els.length) {
      measure()
      const pos = worldAt(journey.sections, window.scrollY, window.innerHeight)
      const first = worlds[pos.from]
      // arriving on a page keeps the camera where it was, so the canvas carries over between routes
      if (first && !journey.current) journey.current = resolveWorld(pos.from, 0, worlds) ?? blendOf(first)
      journey.nearest = journey.sections[pos.index]?.id ?? ''
      nearestListeners.forEach((l) => l())
    }
    return () => {
      if (journey.els.length && journey.els[0] && host.contains(journey.els[0])) { journey.els = []; journey.sections = [] }
    }
  }, [root, worlds, key])
}

/** The id of the section under the reading line (re-renders only when it changes). */
export function useNearest() {
  return useSyncExternalStore(
    (cb) => { nearestListeners.add(cb); return () => { nearestListeners.delete(cb) } },
    () => journey.nearest,
    () => '',
  )
}

/**
 * Scroll a section into view by id, honouring reduced motion. `block: 'end'` lands on a section whose
 * card sits at its foot (a people's stop), so the card is on screen on arrival.
 */
export function goToSection(id: string, smooth = true, block: ScrollLogicalPosition = 'start') {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: smooth && !journey.calm ? 'smooth' : 'auto', block })
}

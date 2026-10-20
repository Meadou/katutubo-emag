import { useSyncExternalStore } from 'react'

/**
 * How the journey is drawn on this device.
 * - live: the persistent 3D paper world.
 * - static: no WebGL, or the reader prefers reduced motion: the same journey as flat paper SVG,
 *   with simple fades and no camera drift. A device too slow even for the lighter 3D tier is moved
 *   here too, for the rest of the visit.
 */
export type Mode = 'live' | 'static'

export function hasWebGL(): boolean {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

const reduceQuery = () => (typeof window !== 'undefined' && window.matchMedia ? window.matchMedia('(prefers-reduced-motion: reduce)') : null)
export const prefersReducedMotion = () => !!reduceQuery()?.matches

let webgl: boolean | null = null
let tooSlow = false
const listeners = new Set<() => void>()

export function getMode(): Mode {
  if (typeof window === 'undefined') return 'static'
  if (webgl === null) webgl = hasWebGL()
  return webgl && !tooSlow && !prefersReducedMotion() ? 'live' : 'static'
}

/** The stage gives up on 3D for this visit: the journey carries on as flat paper. */
export function fallBackToStatic() {
  if (tooSlow) return
  tooSlow = true
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  const q = reduceQuery()
  const on = () => listeners.forEach((l) => l())
  q?.addEventListener?.('change', on)
  return () => { listeners.delete(cb); q?.removeEventListener?.('change', on) }
}

/** The current mode; switches live if the reader changes their motion preference. */
export const useMode = () => useSyncExternalStore(subscribe, getMode, () => 'static' as Mode)

/**
 * A first guess at a modest device: touch-first, few cores or little memory. Such devices start in
 * the lighter 3D tier; the stage's performance monitor can still step any device down at runtime.
 */
export function lowPower(): boolean {
  if (typeof navigator === 'undefined') return true
  const coarse = typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches
  const cores = navigator.hardwareConcurrency ?? 4
  const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8
  return !!coarse || cores <= 4 || mem <= 4
}

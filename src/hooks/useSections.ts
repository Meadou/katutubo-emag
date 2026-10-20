import { useEffect, type RefObject } from 'react'
import { frameState } from '../store'

export type Tone = 'dark' | 'light'

/** Sets the page tone: the CSS ground and type flip at once, the canvas cross-fades after them. */
export function setTone(tone: Tone) {
  frameState.tone = tone === 'light' ? 1 : 0
  if (typeof document !== 'undefined') document.documentElement.dataset.tone = tone
}

/**
 * Watches the `[data-tone]` sections inside `root`. Whichever crosses the middle of the screen sets
 * the page tone, and `onEnter` hears about it (the cover uses this to move the camera).
 */
export function useSections(root: RefObject<HTMLElement | null>, onEnter?: (el: HTMLElement) => void, deps: unknown[] = []) {
  useEffect(() => {
    const host = root.current
    if (!host || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue
          const el = e.target as HTMLElement
          setTone(el.dataset.tone === 'light' ? 'light' : 'dark')
          onEnter?.(el)
        }
      },
      { rootMargin: '-50% 0px -50% 0px' },
    )
    host.querySelectorAll<HTMLElement>('[data-tone]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, deps)
}

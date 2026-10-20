import { useEffect, useRef, type ReactNode } from 'react'
import { scrollState } from '../store'

const TICKS = 64

/** The tick ruler: a red mark travels along it with the page scroll. */
export function Ruler() {
  const mark = useRef<HTMLSpanElement>(null)
  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function') return
    let raf = 0
    const tick = () => {
      if (mark.current) mark.current.style.left = `${(scrollState.progress * 100).toFixed(2)}%`
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])
  return (
    <div className="ruler" aria-hidden="true">
      {Array.from({ length: TICKS }, (_, i) => <i key={i} className={i % 8 === 0 ? 'is-major' : ''} />)}
      <span ref={mark} className="ruler__mark" />
    </div>
  )
}

/** The dark rounded panel fixed at the bottom right: a legend or chapter list above the ruler. */
export default function Panel({ children, label }: { children: ReactNode; label: string }) {
  return (
    <aside className="panel" aria-label={label}>
      <div className="panel__body">{children}</div>
      <Ruler />
    </aside>
  )
}

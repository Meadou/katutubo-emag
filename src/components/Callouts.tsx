import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { anchors } from '../three/anchors'

export interface CalloutItem {
  /** matches an <Anchor id> in the 3D scene */
  id: string
  label: string
  sub?: string
  /** a dot in this colour marks the label */
  color?: string
  to?: string
  onSelect?: () => void
  active?: boolean
  muted?: boolean
}

/**
 * A column of labels at the right edge, each joined to its point on the 3D object by an elbow
 * leader line. Pointer-only: the same destinations are reachable as ordinary links in the page.
 */
export default function Callouts({ items, onHover }: { items: CalloutItem[]; onHover?: (id: string | null) => void }) {
  const labels = useRef<(HTMLElement | null)[]>([])
  const lines = useRef<(SVGPathElement | null)[]>([])
  const dots = useRef<(SVGCircleElement | null)[]>([])

  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function') return
    let raf = 0
    const tick = () => {
      items.forEach((it, i) => {
        const el = labels.current[i], path = lines.current[i], dot = dots.current[i]
        if (!el || !path || !dot) return
        const a = anchors.get(it.id)
        const r = el.getBoundingClientRect()
        if (!a || !a.on || r.width === 0) {
          path.style.visibility = dot.style.visibility = 'hidden'
          return
        }
        const sx = r.left - 12, sy = r.top + r.height / 2, ex = sx - 56
        path.setAttribute('d', `M${sx} ${sy}H${ex}L${a.x} ${a.y}`)
        dot.setAttribute('cx', String(a.x))
        dot.setAttribute('cy', String(a.y))
        path.style.visibility = dot.style.visibility = 'visible'
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [items])

  return (
    <div className="callouts" aria-hidden="true">
      <svg className="callouts__lines">
        {items.map((it, i) => (
          <g key={it.id} className={`callouts__line ${it.active ? 'is-on' : ''} ${it.muted ? 'is-muted' : ''}`}>
            <path ref={(el) => { lines.current[i] = el }} pathLength={1} />
            <circle ref={(el) => { dots.current[i] = el }} r={3} />
          </g>
        ))}
      </svg>
      <ol className="callouts__list" style={{ ['--n' as string]: items.length }}>
        {items.map((it, i) => {
          const body = (
            <>
              <span className="callouts__name">
                {it.color && <i style={{ background: it.color }} />}
                {it.label}
              </span>
              {it.sub && <span className="callouts__sub">{it.sub}</span>}
            </>
          )
          const cls = `callouts__item ${it.active ? 'is-on' : ''} ${it.muted ? 'is-muted' : ''}`
          const hover = {
            onMouseEnter: () => onHover?.(it.id),
            onMouseLeave: () => onHover?.(null),
          }
          return (
            <li key={it.id}>
              {it.to ? (
                <Link to={it.to} tabIndex={-1} className={cls} ref={(el) => { labels.current[i] = el }}
                  onClick={(e) => { if (it.onSelect) { e.preventDefault(); it.onSelect() } }} {...hover}>
                  {body}
                </Link>
              ) : (
                <button type="button" tabIndex={-1} className={cls} ref={(el) => { labels.current[i] = el }}
                  onClick={it.onSelect} {...hover}>
                  {body}
                </button>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}

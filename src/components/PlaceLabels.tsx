import { useEffect, useRef, type MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { anchors } from '../three/anchors'
import { groups } from '../content'
import { useMag } from '../store'

/**
 * The names of the peoples, set on the map beside their statues. Each is a real link, so the map can
 * be explored by keyboard and screen reader as well as by clicking the figures.
 */
export default function PlaceLabels() {
  const els = useRef<(HTMLAnchorElement | null)[]>([])
  const hovered = useMag((s) => s.hovered)
  const setHovered = useMag((s) => s.setHovered)
  const setFlyTo = useMag((s) => s.setFlyTo)

  useEffect(() => {
    if (typeof window.requestAnimationFrame !== 'function') return
    let raf = 0
    const tick = () => {
      groups.forEach((g, i) => {
        const el = els.current[i]
        const a = anchors.get(`place:${g.slug}`)
        if (!el) return
        if (!a || !a.on) { el.style.visibility = 'hidden'; return }
        el.style.visibility = 'visible'
        el.style.transform = `translate(${a.x.toFixed(1)}px, ${a.y.toFixed(1)}px)`
      })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [])

  const open = (slug: string) => (e: MouseEvent) => {
    if (e.metaKey || e.ctrlKey) return
    e.preventDefault()
    setFlyTo(slug)
  }

  return (
    <ul className="places" aria-label="Peoples on the map">
      {groups.map((g, i) => (
        <li key={g.slug}>
          <Link
            to={`/people/${g.slug}`}
            ref={(el) => { els.current[i] = el }}
            className={`place ${hovered === g.slug ? 'is-on' : ''} ${g.placeholder ? 'is-soon' : ''}`}
            onClick={open(g.slug)}
            onMouseEnter={() => setHovered(g.slug)} onMouseLeave={() => setHovered(null)}
            onFocus={() => setHovered(g.slug)} onBlur={() => setHovered(null)}
          >
            <span className="place__name">{g.name}</span>
            {g.placeholder && <span className="place__soon">Coming soon</span>}
          </Link>
        </li>
      ))}
    </ul>
  )
}

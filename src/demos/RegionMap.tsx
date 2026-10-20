import { useEffect, useMemo, useRef, useState } from 'react'
import { useMap } from '../worlds/land'
import { pathsFor } from '../static/paths'
import { MAP } from '../worlds/types'
import { journey } from '../worlds/engine'
import { strings } from '../i18n/t'

type Box = [number, number, number, number]

/** The square of land marked around a people's place: about what the camera sees when it comes down there. */
const AROUND = 0.35

/**
 * Overview demo: the paper archipelago with the people's land marked and lit. One tap zooms the
 * little map into it and back, so the reader sees where the journey has come down.
 */
export default function RegionMap({ lon, lat }: { lon: number; lat: number }) {
  const land = useMap()
  const paths = useMemo(() => (land ? pathsFor(land) : null), [land])
  const A = MAP, R = { west: lon - AROUND, east: lon + AROUND, south: lat - AROUND, north: lat + AROUND }
  const whole: Box = [0.2, 0.2, A.east - A.west - 0.4, A.north - A.south - 0.4]
  const rw = R.east - R.west, rh = R.north - R.south
  const near: Box = [R.west - A.west - rw * 1.6, A.north - R.north - rh * 1.6, rw * 4.2, rh * 4.2]
  const [zoomed, setZoomed] = useState(false)
  const svg = useRef<SVGSVGElement>(null)
  const box = useRef<Box>(whole)

  // the little map eases between its two views (exponentially, as everything here does)
  useEffect(() => {
    const target = zoomed ? near : whole
    if (journey.calm || typeof requestAnimationFrame !== 'function') {
      box.current = target
      svg.current?.setAttribute('viewBox', target.join(' '))
      return
    }
    let raf = 0, last = performance.now()
    const step = (t: number) => {
      const f = 1 - Math.exp(-6 * Math.min(0.05, (t - last) / 1000))
      last = t
      box.current = box.current.map((v, i) => v + (target[i] - v) * f) as Box
      svg.current?.setAttribute('viewBox', box.current.join(' '))
      if (Math.abs(box.current[2] - target[2]) > 0.002) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [zoomed])

  const s = strings.demo.region
  return (
    <div className="region">
      <svg ref={svg} viewBox={whole.join(' ')} className="region__map" role="img" aria-label={s.title}>
        <rect x={-2} y={-2} width={A.east - A.west + 4} height={A.north - A.south + 4} fill="#cfdde3" />
        {paths?.sheets.filter((p) => p.level > 0).map((p, i) => (
          <path key={i} d={p.d} fillRule="evenodd" fill={['#9fb8a2', '#86a58c', '#6f9278', '#5a7f66', '#476c55'][Math.min(4, i)]} />
        ))}
        <rect x={R.west - A.west} y={A.north - R.north} width={rw} height={rh} className="region__cut" />
        <circle cx={lon - A.west} cy={A.north - lat} r={zoomed ? 0.02 : 0.16} className="region__pin" />
      </svg>
      <button type="button" className="btn btn--small" aria-pressed={zoomed} onClick={() => setZoomed((z) => !z)}>
        {zoomed ? strings.demo.region.wide : strings.demo.region.zoom}
      </button>
    </div>
  )
}

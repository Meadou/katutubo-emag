import { useEffect, useMemo, useState } from 'react'
import { journey, useNearest } from '../worlds/engine'
import { resolveWorld, sampleRamp } from '../worlds/blend'
import { useMap } from '../worlds/land'
import { pathsFor } from './paths'
import { useAspect } from '../worlds/useAspect'
import { shadeOf } from '../stage/paper'
import { MAP, type Blended } from '../worlds/types'

const HALF = Math.tan((17.5 * Math.PI) / 180)

/** One world drawn as flat paper: the map's sheets in their colours, a soft offset shadow under each. */
function PaperSvg({ w }: { w: Blended }) {
  const land = useMap()
  const aspect = useAspect()
  const paths = useMemo(() => (land ? pathsFor(land) : null), [land])
  // the 3D camera sees about this much of the map from straight above; the flat view frames the same
  const H = Math.min(MAP.north - MAP.south, w.camera.dist * 2 * HALF)
  const W = H * aspect
  const cx = w.camera.lon - MAP.west, cy = MAP.north - w.camera.lat
  const o = H * 0.0045
  const sx = -Math.sin(w.sun.azimuth) * o, sy = Math.cos(w.sun.azimuth) * o
  return (
    <svg className="paper-svg" viewBox={`${cx - W / 2} ${cy - H / 2} ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* the open sea reaches past every edge of the view, as the 3D board does */}
      <rect x={cx - W} y={cy - H} width={W * 2} height={H * 2} fill={w.sea[0]} />
      {paths?.sheets.map((s, i) => (
        <g key={i}>
          <path d={s.d} transform={`translate(${sx} ${sy})`} fill="#000" fillOpacity={0.16} fillRule="evenodd" />
          <path d={s.d} fillRule="evenodd" fill={s.level <= 0 ? w.sea[1] : sampleRamp(w.land, shadeOf(s.level))}
            stroke={w.edge} strokeOpacity={0.35} strokeWidth={H * 0.0009} />
        </g>
      ))}
      {paths?.lakes && <path d={paths.lakes} fill={w.sea[1]} fillRule="evenodd" stroke={w.edge} strokeOpacity={0.6} strokeWidth={H * 0.0012} />}
      {w.pin && (
        <g transform={`translate(${w.pin.lon - MAP.west} ${MAP.north - w.pin.lat})`}>
          <circle r={H * 0.016} fill="none" stroke={w.edge} strokeWidth={H * 0.003} />
          <circle r={H * 0.006} fill={w.accent} stroke="#1d1b17" strokeWidth={H * 0.0015} />
        </g>
      )}
    </svg>
  )
}

/**
 * The journey drawn without WebGL, or for readers who prefer reduced motion: the world of the section
 * being read, as flat paper, cross-fading simply when the section changes. No camera drift, no zoom.
 */
export default function StaticWorld() {
  const near = useNearest()
  const sec = journey.sections.find((s) => s.id === near)
  // a zoom section shows where it is going
  const w = sec ? resolveWorld(sec.world, 1, journey.worlds) : journey.current
  const [layers, setLayers] = useState<{ key: string; w: Blended }[]>([])

  useEffect(() => {
    if (!w) return
    const key = sec?.world ?? 'start'
    setLayers((ls) => (ls.length && ls[ls.length - 1].key === key ? ls : [...ls.slice(-1), { key, w }]))
    // the old layer is dropped once the new one has faded in
    const t = setTimeout(() => setLayers((ls) => ls.slice(-1)), 900)
    return () => clearTimeout(t)
  }, [sec?.world, near])

  return (
    <div className="static-world" aria-hidden="true">
      {layers.map((l) => <div key={l.key} className="static-world__layer"><PaperSvg w={l.w} /></div>)}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { journey, useNearest } from '../worlds/engine'
import { resolveWorld, sampleRamp, mixColor } from '../worlds/blend'
import { useLand } from '../worlds/land'
import { pathsFor } from './paths'
import { useAspect } from '../worlds/useAspect'
import { AREAS, type Blended } from '../worlds/types'

const HALF = Math.tan((17.5 * Math.PI) / 180)

/** One world drawn as flat paper: sheets in their colours, a soft offset shadow under each. */
function PaperSvg({ w }: { w: Blended }) {
  const land = useLand(w.area)
  const aspect = useAspect()
  const area = AREAS[w.area]
  const paths = useMemo(() => (land ? pathsFor(land) : null), [land])
  // the 3D camera sees about this much of the map from straight above; the flat view frames the same
  const H = Math.min(area.north - area.south, w.camera.dist * 2 * HALF)
  const W = H * aspect
  const cx = w.camera.lon - area.west, cy = area.north - w.camera.lat
  const o = H * 0.0045
  const sx = -Math.sin(w.sun.azimuth) * o, sy = Math.cos(w.sun.azimuth) * o
  const base = paths?.base === 'land' ? mixColor(w.land[0], '#000000', 0.18) : w.sea[0]
  return (
    <svg className="paper-svg" viewBox={`${cx - W / 2} ${cy - H / 2} ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect x={cx - W} y={cy - H} width={W * 2} height={H * 2} fill={base} />
      {paths?.sheets.map((s, i) => (
        <g key={i}>
          <path d={s.d} transform={`translate(${sx} ${sy})`} fill="#000" fillOpacity={0.16} fillRule="evenodd" />
          <path d={s.d} fillRule="evenodd" fill={s.sea ? w.sea[1] : sampleRamp(w.land, s.n > 1 ? s.k / (s.n - 1) : 0)}
            stroke={w.edge} strokeOpacity={0.35} strokeWidth={H * 0.0009} />
        </g>
      ))}
      {paths?.lake && <path d={paths.lake} fill={w.sea[1]} fillRule="evenodd" stroke={w.edge} strokeOpacity={0.6} strokeWidth={H * 0.0012} />}
      {w.pin && (
        <g transform={`translate(${w.pin.lon - area.west} ${area.north - w.pin.lat})`}>
          <circle r={H * 0.016} fill="none" stroke={w.edge} strokeWidth={H * 0.003} />
          <circle r={H * 0.006} fill={w.accent} stroke="#1d1b17" strokeWidth={H * 0.0015} />
        </g>
      )}
    </svg>
  )
}

/**
 * The journey drawn without WebGL, or for readers who prefer reduced motion: the world of the section
 * being read, as flat paper, cross-fading simply when the section changes. No camera drift.
 */
export default function StaticWorld() {
  const near = useNearest()
  const sec = journey.sections.find((s) => s.id === near)
  // a travel section shows where it is going
  const w = sec ? resolveWorld(sec.world, 1, journey.worlds) : journey.current
  const [layers, setLayers] = useState<{ key: string; w: Blended }[]>([])

  useEffect(() => {
    if (!w) return
    const key = `${sec?.world ?? 'start'}:${w.area}`
    setLayers((ls) => (ls.length && ls[ls.length - 1].key === key ? ls : [...ls.slice(-1), { key, w }]))
    // the old layer is dropped once the new one has faded in
    const t = setTimeout(() => setLayers((ls) => ls.slice(-1)), 900)
    return () => clearTimeout(t)
  }, [sec?.world, w?.area, near])

  return (
    <div className="static-world" aria-hidden="true">
      {layers.map((l) => <div key={l.key} className="static-world__layer"><PaperSvg w={l.w} /></div>)}
    </div>
  )
}

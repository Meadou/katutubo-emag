import { useEffect, useMemo, useState } from 'react'
import { journey, useNearest } from '../worlds/engine'
import { detailAt, resolveWorld, sampleRamp } from '../worlds/blend'
import { useLand } from '../worlds/land'
import { pathsFor } from './paths'
import { useAspect } from '../worlds/useAspect'
import { shadeOf } from '../stage/paper'
import { AREAS, type AreaName, type Blended } from '../worlds/types'

const HALF = Math.tan((17.5 * Math.PI) / 180)

/** The paper a flat view draws: the place's own once the view is close enough, else the archipelago. */
const shownArea = (w: Blended): AreaName => (w.area !== 'archipelago' && detailAt(w.area, w.camera.dist) > 0.5 ? w.area : 'archipelago')

/** An area's sheets in the world's colours, each over a soft offset shadow. */
function Sheets({ area, w, H, at }: { area: AreaName; w: Blended; H: number; at?: string }) {
  const land = useLand(area)
  const paths = useMemo(() => (land ? pathsFor(land) : null), [land])
  const o = H * 0.0045
  const sx = -Math.sin(w.sun.azimuth) * o, sy = Math.cos(w.sun.azimuth) * o
  return (
    <g transform={at}>
      {paths?.sheets.map((s, i) => (
        <g key={i}>
          <path d={s.d} transform={`translate(${sx} ${sy})`} fill="#000" fillOpacity={0.16} fillRule="evenodd" />
          <path d={s.d} fillRule="evenodd" fill={s.level <= 0 ? w.sea[1] : sampleRamp(w.land, shadeOf(s.level))}
            stroke={w.edge} strokeOpacity={0.35} strokeWidth={H * 0.0009} />
        </g>
      ))}
      {paths?.lake && <path d={paths.lake} fill={w.sea[1]} fillRule="evenodd" stroke={w.edge} strokeOpacity={0.6} strokeWidth={H * 0.0012} />}
    </g>
  )
}

/** One world drawn as flat paper; a place's finer paper lies on the archipelago, as in 3D. */
function PaperSvg({ w, area }: { w: Blended; area: AreaName }) {
  const aspect = useAspect()
  const box = AREAS[area], arch = AREAS.archipelago
  // the 3D camera sees about this much of the map from straight above; the flat view frames the same
  const H = Math.min(box.north - box.south, w.camera.dist * 2 * HALF)
  const W = H * aspect
  const cx = w.camera.lon - box.west, cy = box.north - w.camera.lat
  return (
    <svg className="paper-svg" viewBox={`${cx - W / 2} ${cy - H / 2} ${W} ${H}`} preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      {/* the open sea reaches past every edge of the view, as the 3D board does */}
      <rect x={cx - W} y={cy - H} width={W * 2} height={H * 2} fill={w.sea[0]} />
      {area !== 'archipelago' && <Sheets area="archipelago" w={w} H={H} at={`translate(${arch.west - box.west} ${box.north - arch.north})`} />}
      <Sheets area={area} w={w} H={H} />
      {w.pin && area === 'archipelago' && (
        <g transform={`translate(${w.pin.lon - box.west} ${box.north - w.pin.lat})`}>
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
  const [layers, setLayers] = useState<{ key: string; w: Blended; area: AreaName }[]>([])

  useEffect(() => {
    if (!w) return
    const area = shownArea(w)
    const key = `${sec?.world ?? 'start'}:${area}`
    setLayers((ls) => (ls.length && ls[ls.length - 1].key === key ? ls : [...ls.slice(-1), { key, w, area }]))
    // the old layer is dropped once the new one has faded in
    const t = setTimeout(() => setLayers((ls) => ls.slice(-1)), 900)
    return () => clearTimeout(t)
  }, [sec?.world, w?.area, near])

  return (
    <div className="static-world" aria-hidden="true">
      {layers.map((l) => <div key={l.key} className="static-world__layer"><PaperSvg w={l.w} area={l.area} /></div>)}
    </div>
  )
}

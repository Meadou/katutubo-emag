import { useEffect, useMemo, useState } from 'react'
import { journey, useNearest } from '../worlds/engine'
import { mixColor, resolveWorld, sampleRamp } from '../worlds/blend'
import { useMap, useRegion } from '../worlds/land'
import { pathsFor } from './paths'
import { useAspect } from '../worlds/useAspect'
import { shadeOf } from '../stage/paper'
import { pieceColor, restColor } from '../stage/regions'
import { MAP, type Blended, type PlaceName } from '../worlds/types'

const HALF = Math.tan((17.5 * Math.PI) / 180)

/**
 * One world drawn as flat paper: the country's sheets faded as the world asks, the Davao pieces in
 * their own colours (lifted by a deeper shadow when the region rises), and the names printed on it.
 */
function PaperSvg({ w, names }: { w: Blended; names: PlaceName[] }) {
  const land = useMap()
  const region = useRegion()
  const aspect = useAspect()
  const paths = useMemo(() => (land ? pathsFor(land, region) : null), [land, region])
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
          <path d={s.d} fillRule="evenodd" fill={s.level <= 0 ? w.sea[1] : restColor(sampleRamp(w.land, shadeOf(s.level)), w.map)}
            stroke={w.edge} strokeOpacity={0.35} strokeWidth={H * 0.0009} />
        </g>
      ))}
      {paths?.pieces.map((p) => {
        const lift = 1 + (w.map.rise + (w.map.focus[p.key] ?? 0) * 0.04) * 40
        return (
          <g key={p.key}>
            {p.sheets.map((s, i) => {
              const c = pieceColor(p.key, sampleRamp(w.land, shadeOf(s.level)), shadeOf(s.level), w.map)
              return (
                <g key={i}>
                  <path d={s.d} transform={`translate(${sx * (i ? 1 : lift)} ${sy * (i ? 1 : lift)})`} fill="#000" fillOpacity={i ? 0.14 : 0.22} fillRule="evenodd" />
                  <path d={s.d} fillRule="evenodd" fill={c} stroke={mixColor(c, '#000000', 0.3)} strokeOpacity={0.5} strokeWidth={H * 0.0009} />
                </g>
              )
            })}
          </g>
        )
      })}
      {paths?.lakes && <path d={paths.lakes} fill={w.sea[1]} fillRule="evenodd" stroke={w.edge} strokeOpacity={0.6} strokeWidth={H * 0.0012} />}
      {names.map((n) => (
        <text key={n.key} x={n.lon - MAP.west} y={MAP.north - n.lat} className={`paper-svg__name paper-svg__name--${n.kind}`}
          fontSize={H * (n.kind === 'landmark' ? 0.016 : n.kind === 'region' ? 0.032 : 0.022)} textAnchor={n.kind === 'region' ? 'start' : 'middle'} dominantBaseline="middle">{n.text}</text>
      ))}
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
      {layers.map((l) => <div key={l.key} className="static-world__layer"><PaperSvg w={l.w} names={journey.worlds[l.key]?.names ?? []} /></div>)}
    </div>
  )
}

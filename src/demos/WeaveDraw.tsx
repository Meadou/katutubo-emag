import { useCallback, useMemo, useRef } from 'react'
import { useProgressFrame } from './useProgress'
import { strings } from '../i18n/t'

const COLS = 14, ROWS = 11, CELL = 18, PAD = 12

/**
 * Crafts demo: a weave that draws itself as the chapter is read. The warp threads are laid first,
 * then each weft pass goes over and under them. Plain weave (over one, under one) or a twill basket
 * weave (over two, under two, stepping each row). Structure only, never a community's design.
 */
export default function WeaveDraw({ sectionId, structure, colors }: { sectionId: string; structure: 'plain' | 'twill'; colors: string[] }) {
  const warps = useRef<(SVGLineElement | null)[]>([])
  const wefts = useRef<(SVGGElement | null)[]>([])
  const over = useCallback((r: number, c: number) => (structure === 'plain' ? (r + c) % 2 === 0 : (c + r) % 4 < 2), [structure])
  const W = PAD * 2 + COLS * CELL, H = PAD * 2 + ROWS * CELL
  const warpColor = (c: number) => colors[[0, 0, 2, 0, 0, 1, 1, 0, 0, 2, 0, 0, 1, 1][c % 14] % colors.length]
  const weftColor = (r: number) => colors[r % 4 === 3 ? 0 : Math.min(1, colors.length - 1)]
  const len = H - PAD

  const apply = useCallback((p: number) => {
    // warp: first 45% of the chapter; weft passes: from 35% to the end
    warps.current.forEach((el, c) => {
      if (!el) return
      const k = Math.min(1, Math.max(0, (p * 1.3 - (c / COLS) * 0.45) / 0.18))
      el.style.strokeDashoffset = String(len * (1 - k))
    })
    wefts.current.forEach((el, i) => {
      if (!el) return
      // under- and over-passes of the same row arrive together
      const r = i % ROWS
      const k = Math.min(1, Math.max(0, (p - 0.35 - (r / ROWS) * 0.55) / 0.06))
      el.style.opacity = String(k)
      el.style.transform = `translateX(${(1 - k) * -10}px)`
    })
  }, [len])
  useProgressFrame(sectionId, apply)

  const rows = useMemo(() => Array.from({ length: ROWS }, (_, r) => r), [])
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="weave" role="img" aria-label={strings.demo.weave.title}>
      <rect width={W} height={H} className="weave__ground" />
      {/* weft passes run beneath the warp... */}
      {rows.map((r) => (
        <g key={`u${r}`} ref={(el) => { wefts.current[r] = el }} className="weave__pass">
          <line x1={PAD} x2={W - PAD} y1={PAD + r * CELL + CELL / 2} y2={PAD + r * CELL + CELL / 2} stroke={weftColor(r)} strokeWidth={CELL * 0.62} />
        </g>
      ))}
      {Array.from({ length: COLS }, (_, c) => (
        <line key={c} ref={(el) => { warps.current[c] = el }} x1={PAD + c * CELL + CELL / 2} x2={PAD + c * CELL + CELL / 2} y1={PAD / 2} y2={H - PAD / 2}
          stroke={warpColor(c)} strokeWidth={CELL * 0.62} strokeDasharray={len} strokeDashoffset={len} className="weave__warp" />
      ))}
      {/* ...and cross over it where the structure says so */}
      {rows.map((r) => (
        <g key={`o${r}`} ref={(el) => { wefts.current[ROWS + r] = el }} className="weave__pass">
          {Array.from({ length: COLS }, (_, c) => (over(r, c) ? (
            <rect key={c} x={PAD + c * CELL + 1} y={PAD + r * CELL + CELL * 0.19} width={CELL - 2} height={CELL * 0.62} fill={weftColor(r)} />
          ) : null))}
        </g>
      ))}
    </svg>
  )
}

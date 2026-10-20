import { useStage } from './useProgress'
import { fill, strings } from '../i18n/t'

const STOPS = [0, 0.32, 0.52, 0.74]

/**
 * Myths & Stories demo: a paper-cut scene that changes in stages as each part of the chapter is read.
 * The land and water move; people are still silhouettes, and nothing sacred is drawn or animated.
 */
export default function StoryStages({ scene, sectionId }: { scene: 'flood' | 'abaca'; sectionId: string }) {
  const stage = useStage(sectionId, STOPS)
  return (
    <div className="stages" data-stage={stage}>
      <svg viewBox="0 0 360 240" className="stages__scene" role="img" aria-label={fill(strings.demo.story.scene, { n: stage + 1, of: STOPS.length })}>
        {scene === 'flood' ? <Flood stage={stage} /> : <Abaca stage={stage} />}
      </svg>
      <ol className="stages__dots" aria-hidden="true">
        {STOPS.map((_, i) => <li key={i} className={i <= stage ? 'is-on' : ''} />)}
      </ol>
      <p className="visually-hidden" aria-live="polite">{fill(strings.demo.story.scene, { n: stage + 1, of: STOPS.length })}</p>
    </div>
  )
}

/** Ifugao: the harvest terraces, the great flood rising, two siblings on the one peak above it, the land returning. */
function Flood({ stage }: { stage: number }) {
  const water = [150, 72, 18, 150][stage]
  return (
    <g>
      <rect width="360" height="240" className="st-sky" fill={stage === 0 || stage === 3 ? '#f3c98b' : '#c98f86'} />
      <path d="M0 150 L40 108 L78 128 L120 84 L162 120 L205 70 L248 112 L290 80 L330 116 L360 98 L360 240 L0 240Z" fill="#6c5878" />
      <path d="M0 176 L52 140 L96 162 L150 118 L196 150 L240 124 L292 158 L360 132 L360 240 L0 240Z" fill="#4c3e5f" />
      {/* the one peak that stays above the water */}
      <path d="M150 240 L214 46 L232 40 L250 52 L300 240Z" fill="#3a2f50" />
      {/* terraces: thin stepped bands on the near slope */}
      <g className="st-fade" style={{ opacity: stage === 1 || stage === 2 ? 0 : 1 }}>
        {Array.from({ length: 8 }, (_, i) => (
          <path key={i} d={`M${18 + i * 6} ${226 - i * 13} Q 90 ${214 - i * 13} ${160 - i * 4} ${222 - i * 13} L${160 - i * 4} ${226 - i * 13} Q 90 ${218 - i * 13} ${18 + i * 6} ${230 - i * 13}Z`}
            fill={stage === 3 ? '#7fa36a' : '#d9b45a'} />
        ))}
      </g>
      {/* water: three cut sheets that rise and fall together */}
      <g className="st-move" style={{ transform: `translateY(${water}px)` }}>
        <path d="M0 96 Q 45 84 90 96 T 180 96 T 270 96 T 360 96 L360 260 L0 260Z" fill="#5a93b6" />
        <path d="M0 112 Q 45 100 90 112 T 180 112 T 270 112 T 360 112 L360 260 L0 260Z" fill="#3f78a0" />
        <path d="M0 130 Q 45 118 90 130 T 180 130 T 270 130 T 360 130 L360 260 L0 260Z" fill="#2f5f86" />
      </g>
      {/* two figures, still, on the peak */}
      <g className="st-fade" style={{ opacity: stage >= 2 ? 1 : 0 }} fill="#1d1b17">
        <path d="M222 44 a4 4 0 1 1 0.01 0 Z M219 49 h7 l1 14 h-9 Z" />
        <path d="M236 46 a3.6 3.6 0 1 1 0.01 0 Z M233 50.5 h6.5 l1 12.5 h-8.5 Z" />
      </g>
    </g>
  )
}

/** T'boli: abaca on the hills, a still night (designs come in dreams, and are not drawn), thread tied on the frame, plain cloth. */
function Abaca({ stage }: { stage: number }) {
  const night = stage === 1
  return (
    <g>
      <rect width="360" height="240" className="st-sky" fill={night ? '#1f2a44' : '#f1c99a'} />
      <circle cx="292" cy="58" r="16" fill="#e9e4d4" className="st-fade" style={{ opacity: night ? 1 : 0 }} />
      <path d="M0 168 L60 132 L118 152 L180 118 L248 146 L310 124 L360 140 L360 240 L0 240Z" fill={night ? '#2a3654' : '#6f8a5a'} className="st-tint" />
      <path d="M0 196 L70 170 L140 186 L214 162 L290 182 L360 168 L360 240 L0 240Z" fill={night ? '#202b45' : '#557447'} className="st-tint" />
      {/* abaca plants: tall leaves on a trunk */}
      <g className="st-fade" style={{ opacity: stage <= 1 ? 1 : 0 }} fill={night ? '#16203a' : '#3f5d34'}>
        {[60, 104, 150, 300].map((x, i) => (
          <g key={x} transform={`translate(${x} ${186 - (i % 2) * 8})`}>
            <rect x="-2.5" y="-46" width="5" height="46" />
            <path d="M0 -44 Q -26 -64 -40 -50 Q -22 -54 0 -40Z M0 -46 Q 22 -72 40 -60 Q 20 -60 0 -42Z M0 -40 Q -14 -76 -6 -88 Q -2 -64 2 -42Z" />
          </g>
        ))}
      </g>
      {/* thread tied on a frame, in plain bands */}
      <g className="st-fade" style={{ opacity: stage === 2 ? 1 : 0 }}>
        <rect x="110" y="70" width="140" height="8" fill="#5a3a24" />
        <rect x="110" y="190" width="140" height="8" fill="#5a3a24" />
        {Array.from({ length: 22 }, (_, i) => (
          <line key={i} x1={116 + i * 6} y1="78" x2={116 + i * 6} y2="190" stroke={i % 5 === 0 ? '#8e2f2a' : '#e8dcc4'} strokeWidth="3" />
        ))}
      </g>
      {/* plain woven cloth, no design */}
      <g className="st-fade" style={{ opacity: stage === 3 ? 1 : 0 }}>
        <rect x="104" y="64" width="152" height="140" fill="#5a3a24" />
        {Array.from({ length: 14 }, (_, r) => Array.from({ length: 15 }, (_, c) => (
          (r + c) % 2 === 0 ? <rect key={`${r}-${c}`} x={106 + c * 10} y={66 + r * 10} width="8" height="8" fill={r % 4 === 0 ? '#8e2f2a' : '#e8dcc4'} /> : null
        )))}
      </g>
    </g>
  )
}

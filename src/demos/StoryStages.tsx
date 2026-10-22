import type { JSX } from 'react'
import { useStage } from './useProgress'
import { fill, strings } from '../i18n/t'

const STOPS = [0, 0.32, 0.52, 0.74]

export type Scene = 'mountain' | 'sea' | 'sky' | 'river'

/**
 * Myths & Stories demo: a paper-cut landscape that changes in stages as each part of the chapter is
 * read: light, water and sky shift; the land answers. It illustrates the setting, never the sacred:
 * no beings, spirits or ancestors are drawn, and nothing in it stands for a particular telling.
 */
export default function StoryStages({ scene, sectionId }: { scene: Scene; sectionId: string }) {
  const stage = useStage(sectionId, STOPS)
  const Comp = SCENES[scene] ?? Mountain
  return (
    <div className="stages" data-stage={stage}>
      <svg viewBox="0 0 360 240" className="stages__scene" role="img" aria-label={fill(strings.demo.story.scene, { n: stage + 1, of: STOPS.length })}>
        <Comp stage={stage} />
      </svg>
      <ol className="stages__dots" aria-hidden="true">
        {STOPS.map((_, i) => <li key={i} className={i <= stage ? 'is-on' : ''} />)}
      </ol>
      <p className="visually-hidden" aria-live="polite">{fill(strings.demo.story.scene, { n: stage + 1, of: STOPS.length })}</p>
    </div>
  )
}

/** The four lights a scene passes through: first light, full day, dusk, night. */
const SKY = ['#f4c9a0', '#cfe0e6', '#d98b74', '#1f2a44']
const FAR = ['#7e8fa0', '#6f8f86', '#7a5a78', '#2a3654']
const NEAR = ['#4f6b5a', '#47704f', '#4f3d63', '#1d2740']

/** Mountains in ranks, the highest last to lose the light. */
function Mountain({ stage }: { stage: number }) {
  return (
    <g>
      <rect width="360" height="240" className="st-sky" fill={SKY[stage]} />
      {/* the sun rises, stands, sets; the moon takes its place */}
      <circle cx="292" cy="96" r="15" className="st-move st-tint" fill={stage === 3 ? '#e9e4d4' : '#fff1d6'} style={{ transform: `translateY(${[0, -44, 24, -36][stage]}px)` }} />
      <path className="st-tint" fill={FAR[stage]} d="M0 160 L52 118 L96 140 L150 96 L200 132 L252 90 L300 124 L360 104 L360 240 L0 240Z" />
      <path className="st-tint" fill={stage === 3 ? '#253152' : '#5b6f86'} d="M118 240 L186 58 L204 50 L222 62 L292 240Z" />
      <path className="st-tint" fill={NEAR[stage]} d="M0 190 L64 160 L120 178 L176 150 L236 176 L300 156 L360 172 L360 240 L0 240Z" />
      {/* mist that gathers in the valleys in the second and third parts */}
      <path className="st-fade" fill="#f6efe2" style={{ opacity: stage === 1 || stage === 2 ? 0.55 : 0 }} d="M0 182 Q 90 168 180 180 T 360 176 L360 196 Q 270 188 180 198 T 0 196Z" />
    </g>
  )
}

/** The sea, rising and falling, and an island that stays. */
function Sea({ stage }: { stage: number }) {
  const water = [130, 104, 92, 120][stage]
  return (
    <g>
      <rect width="360" height="240" className="st-sky" fill={SKY[stage]} />
      <path className="st-tint" fill={FAR[stage]} d="M150 240 L196 112 L214 104 L232 116 L270 240Z" />
      <g className="st-move" style={{ transform: `translateY(${water - 130}px)` }}>
        <path fill="#5a93b6" d="M0 130 Q 45 120 90 130 T 180 130 T 270 130 T 360 130 L360 260 L0 260Z" />
        <path fill="#3f78a0" d="M0 150 Q 45 140 90 150 T 180 150 T 270 150 T 360 150 L360 260 L0 260Z" />
        <path fill="#2f5f86" d="M0 172 Q 45 162 90 172 T 180 172 T 270 172 T 360 172 L360 260 L0 260Z" />
      </g>
    </g>
  )
}

/** A sky that opens: bands of cloud part and close above still land. */
function Sky({ stage }: { stage: number }) {
  const apart = [0, 46, 90, 24][stage]
  return (
    <g>
      <rect width="360" height="240" className="st-sky" fill={SKY[stage]} />
      <g className="st-move" style={{ transform: `translateX(${-apart}px)` }} fill="#f6efe2" opacity={stage === 3 ? 0.35 : 0.85}>
        <path d="M-20 70 Q 30 50 80 66 Q 120 46 170 64 L170 84 L-20 84Z" />
      </g>
      <g className="st-move" style={{ transform: `translateX(${apart}px)` }} fill="#f6efe2" opacity={stage === 3 ? 0.35 : 0.85}>
        <path d="M190 58 Q 240 38 290 56 Q 330 42 380 60 L380 80 L190 80Z" />
      </g>
      <path className="st-tint" fill={FAR[stage]} d="M0 176 L80 150 L160 166 L240 140 L320 160 L360 150 L360 240 L0 240Z" />
      <path className="st-tint" fill={NEAR[stage]} d="M0 204 L90 186 L180 198 L270 182 L360 196 L360 240 L0 240Z" />
    </g>
  )
}

/** A river from the hills to the sea, filling and running clear. */
function River({ stage }: { stage: number }) {
  const width = [6, 12, 18, 10][stage]
  return (
    <g>
      <rect width="360" height="240" className="st-sky" fill={SKY[stage]} />
      <path className="st-tint" fill={FAR[stage]} d="M0 140 L70 104 L130 128 L200 92 L270 120 L360 98 L360 240 L0 240Z" />
      <path className="st-tint" fill={NEAR[stage]} d="M0 176 L80 150 L170 168 L260 146 L360 162 L360 240 L0 240Z" />
      <path className="st-width" fill="none" stroke="#5a93b6" strokeLinecap="round" strokeWidth={width}
        d="M200 112 C 190 140, 230 150, 210 176 S 150 210, 170 240" />
    </g>
  )
}

const SCENES: Record<Scene, (p: { stage: number }) => JSX.Element> = { mountain: Mountain, sea: Sea, sky: Sky, river: River }

import { useRef } from 'react'
import { useProgressFrame } from '../demos/useProgress'
import { paragraphStates } from './paragraphs'

/**
 * A chapter's body, one block at a time, in place: each paragraph fades in where the last one was as
 * the reader scrolls through the section. All of them stay in the page (for screen readers, and in
 * calm mode, where they simply sit one after another).
 */
export default function Steps({ blocks, sectionId }: { blocks: string[]; sectionId: string }) {
  const refs = useRef<(HTMLDivElement | null)[]>([])
  useProgressFrame(sectionId, (p) => {
    paragraphStates(p, blocks.length).forEach((s, i) => {
      const el = refs.current[i]
      if (!el) return
      el.style.opacity = String(s.opacity)
      el.style.transform = s.opacity < 1 ? `translateY(${s.dir * (1 - s.opacity) * 12}px)` : ''
      // a faded paragraph's links must not catch the pointer
      el.style.pointerEvents = s.opacity < 0.5 ? 'none' : ''
    })
  })
  return (
    <div className="steps">
      {blocks.map((b, i) => <div key={i} ref={(el) => { refs.current[i] = el }} className="step" dangerouslySetInnerHTML={{ __html: b }} />)}
    </div>
  )
}

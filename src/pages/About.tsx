import { useMemo, useRef } from 'react'
import { useJourney } from '../worlds/engine'
import { plainWorlds } from '../worlds/journeys'
import { useAspect } from '../worlds/useAspect'
import { strings } from '../i18n/t'

export default function About() {
  const root = useRef<HTMLElement>(null)
  const aspect = useAspect()
  const worlds = useMemo(() => plainWorlds(aspect, 'dusk'), [aspect])
  useJourney(root, worlds, `about:${aspect}`)
  const s = strings.about
  return (
    <section ref={root} className="about">
      <div id="page" data-world="page" className="sec sec--plain">
        <div className="card card--about prose">
          <h1>{s.title}</h1>
          <p dangerouslySetInnerHTML={{ __html: s.meaning }} />
          <h2>{s.respectTitle}</h2>
          <p>{s.respect}</p>
          <h2>{s.madeTitle}</h2>
          <p>{s.made}</p>
        </div>
      </div>
    </section>
  )
}

import { useEffect, useState } from 'react'
import { isReady, progressOf, useLoading } from './loading'
import { strings } from '../i18n/t'

/** However slow the connection, the page is never held back longer than this. */
const PATIENCE = 12000

/**
 * The first screen while everything is prepared: the fonts, the paper map, and in 3D every sheet
 * built and every shader compiled, so the journey never stalls once it starts. It says what Katutubo
 * is while it waits, and steps aside after a while even if something is slow.
 */
export default function Loader({ live }: { live: boolean }) {
  const s = useLoading()
  const [patience, setPatience] = useState(false)
  useEffect(() => { const t = setTimeout(() => setPatience(true), PATIENCE); return () => clearTimeout(t) }, [])
  const done = isReady(s, live) || patience
  // the page underneath stays still until it is ready
  useEffect(() => { document.documentElement.classList.toggle('is-loading', !done) }, [done])
  const [gone, setGone] = useState(false)
  useEffect(() => {
    if (!done) return
    const t = setTimeout(() => setGone(true), 700)
    return () => clearTimeout(t)
  }, [done])
  if (gone) return null
  const p = Math.round(progressOf(s, live) * 100)
  return (
    <div className={`loader ${done ? 'is-done' : ''}`}>
      <div className="card loader__card" role="status">
        <p className="over">{strings.intro.over}</p>
        <p className="loader__name">{strings.site.name}</p>
        <p className="masthead">{strings.site.masthead}</p>
        <div className="loader__bar" aria-hidden="true"><i style={{ transform: `scaleX(${done ? 1 : p / 100})` }} /></div>
        <p className="loader__note">{done ? strings.loaded : `${strings.loading}… ${p}%`}</p>
      </div>
    </div>
  )
}

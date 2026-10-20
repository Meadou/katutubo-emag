import { useEffect } from 'react'
import { groups } from '../content'
import { useMag } from '../store'
import { setTone } from '../hooks/useSections'
import PlaceLabels from '../components/PlaceLabels'

/** The cover: the whole archipelago in 3D, each people standing at their place. Click one to go there. */
export default function Home() {
  const hovered = useMag((s) => s.hovered)
  const setFlyTo = useMag((s) => s.setFlyTo)
  const setShot = useMag((s) => s.setShot)
  const setStage = useMag((s) => s.setStage)
  const active = groups.find((g) => g.slug === hovered)

  useEffect(() => { setTone('dark'); setShot(null); setStage(null) }, [setShot, setStage])

  // Number keys open the peoples in map order, north to south.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number(e.key)
      if (n >= 1 && n <= groups.length) setFlyTo(groups[n - 1].slug)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setFlyTo])

  return (
    <section className="cover">
      <h1 className="cover__title">The first peoples of the islands</h1>
      <PlaceLabels />
      <p className="cover__hint" aria-live="polite">
        {active ? `${active.name}: ${active.placeholder ? 'Coming soon' : active.tagline}` : 'Click a place to explore'}
      </p>
    </section>
  )
}

import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Crumb from './ui/Crumb'
import Loader from './ui/Loader'
import SoundBed from './ui/SoundBed'
import Labels from './ui/Labels'
import PlaceNames from './ui/PlaceNames'
import Journey from './pages/Journey'
import IssueIndex from './pages/IssueIndex'
import About from './pages/About'
import StaticWorld from './static/StaticWorld'
import { journey, startEngine } from './worlds/engine'
import { useMode } from './worlds/mode'
import { loadMap, loadRegion } from './worlds/land'
import { isReady, useLoading } from './ui/loading'

// three.js is the heavy part of the bundle; the flat paper world paints first while it loads.
const Stage = lazy(() => import('./stage/Stage'))

export default function App() {
  const mode = useMode()
  journey.calm = mode === 'static'
  const mark = useLoading((s) => s.mark)
  const ready = useLoading((s) => isReady(s, mode === 'live'))

  useEffect(() => {
    startEngine()
    // the map and the fonts are waited for once; a failure lets the page through (it still reads)
    Promise.all([loadMap(), loadRegion()]).then(() => mark({ map: true }), () => mark({ map: true }))
    if (document.fonts) document.fonts.ready.then(() => mark({ fonts: true }), () => mark({ fonts: true }))
    else mark({ fonts: true })
  }, [mark])
  useEffect(() => { document.documentElement.classList.toggle('calm', mode === 'static') }, [mode])

  return (
    <>
      <div className="sky" aria-hidden="true" />
      {mode === 'live' ? (
        <Suspense fallback={<StaticWorld />}>
          <Stage />
        </Suspense>
      ) : (
        <StaticWorld />
      )}
      <Crumb />
      <SoundBed />
      <main className="pages" aria-busy={!ready}>
        <Routes>
          <Route path="/" element={<Journey />} />
          <Route path="/group/:slug/:chapter?" element={<Journey />} />
          <Route path="/issues" element={<IssueIndex />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Journey />} />
        </Routes>
      </main>
      {/* after the words in the Tab order: a section's heading, then the labels on its map */}
      {mode === 'live' && <PlaceNames />}
      {mode === 'live' && <Labels />}
      <Loader live={mode === 'live'} />
    </>
  )
}

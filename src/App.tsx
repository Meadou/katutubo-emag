import { lazy, Suspense, useEffect } from 'react'
import { Route, Routes } from 'react-router-dom'
import Nav from './ui/Nav'
import Cover from './pages/Cover'
import Issue from './pages/Issue'
import IssueIndex from './pages/IssueIndex'
import About from './pages/About'
import StaticWorld from './static/StaticWorld'
import { journey, startEngine } from './worlds/engine'
import { useMode } from './worlds/mode'
import { loadLand } from './worlds/land'

// three.js is the heavy part of the bundle; the flat paper world paints first while it loads.
const Stage = lazy(() => import('./stage/Stage'))

export default function App() {
  const mode = useMode()
  journey.calm = mode === 'static'

  useEffect(() => {
    startEngine()
    void loadLand('archipelago').catch(() => {})
  }, [])
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
      <Nav />
      <main className="pages">
        <Routes>
          <Route path="/" element={<Cover />} />
          <Route path="/issues" element={<IssueIndex />} />
          <Route path="/group/:slug/:chapter?" element={<Issue />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Cover />} />
        </Routes>
      </main>
    </>
  )
}

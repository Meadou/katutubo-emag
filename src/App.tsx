import { lazy, Suspense, useEffect, useState } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import Nav from './components/Nav'
import Loader from './components/Loader'
import NoWebGLFallback from './components/NoWebGLFallback'
import Home from './pages/Home'
import IssueIndex from './pages/IssueIndex'
import Article from './pages/Article'
import About from './pages/About'
import People from './pages/People'
import SoundToggle from './components/SoundToggle'
import { prefersReducedMotion, scrollState, useMag } from './store'

// three.js + effects are the heavy part of the bundle; load them after the page shell.
const Stage = lazy(() => import('./three/Stage'))

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

/** Keeps the 3D scene in sync with the route, and turns a marker click into a fly-in + navigation. */
function useSceneSync() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const setScene = useMag((s) => s.setScene)
  const flyTo = useMag((s) => s.flyTo)

  useEffect(() => {
    const m = pathname.match(/^\/(?:group|people)\/([^/]+)/)
    setScene(m ? m[1] : pathname.startsWith('/issues') ? 'index' : 'home')
    window.scrollTo(0, 0)
    scrollState.progress = 0
  }, [pathname, setScene])

  useEffect(() => {
    if (!flyTo) return
    // the camera starts its zoom on the map; the page follows once it is most of the way down
    const t = setTimeout(() => navigate(`/people/${flyTo}`), prefersReducedMotion() ? 0 : 900)
    return () => clearTimeout(t)
  }, [flyTo, navigate])

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollState.progress = max > 0 ? window.scrollY / max : 0
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])
}

export default function App() {
  const [webgl] = useState(hasWebGL)
  useSceneSync()

  return (
    <>
      {webgl ? (
        <Suspense fallback={<Loader />}>
          <Stage />
        </Suspense>
      ) : (
        <NoWebGLFallback />
      )}
      <Nav />
      <SoundToggle />
      <main className="pages">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/issues" element={<IssueIndex />} />
          <Route path="/people/:slug/:step?" element={<People />} />
          <Route path="/group/:slug" element={<Article />} />
          <Route path="/about" element={<About />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
    </>
  )
}

import { useCallback, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import PaperLand from './PaperLand'
import Clouds from './Clouds'
import Pins from './Pins'
import Props from './Props'
import StaticWorld from '../static/StaticWorld'
import { journey } from '../worlds/engine'
import { fallBackToStatic, lowPower } from '../worlds/mode'
import { AREAS, type AreaName } from '../worlds/types'
import { mixColor } from '../worlds/blend'
import { place } from './place'
import { toX, toZ } from './paper'

type Tier = 'high' | 'lite'
const AREA_NAMES = Object.keys(AREAS) as AreaName[]

/** The camera follows the blended world, with a slight drift toward the pointer (none in still worlds). */
function CameraRig() {
  const { camera } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ pointer }) => {
    const w = journey.current
    if (!w) return
    const c = w.camera
    let ty = 0
    for (const a of AREA_NAMES) ty += (w.areaWeights[a] ?? 0) * (place.focus && place.area === a && place.ground[a] !== undefined && c.dist < 2 ? place.ground[a]! : place.rest[a] ?? 0)
    const yaw = c.yaw + pointer.x * 0.05 * w.drift
    const tilt = Math.min(1.35, c.tilt + pointer.y * 0.025 * w.drift)
    look.set(toX(c.lon), ty, toZ(c.lat))
    camera.position.set(look.x + c.dist * Math.sin(tilt) * Math.sin(yaw), look.y + c.dist * Math.cos(tilt), look.z + c.dist * Math.sin(tilt) * Math.cos(yaw))
    const pc = camera as THREE.PerspectiveCamera
    pc.near = Math.max(0.0005, c.dist * 0.01)
    pc.far = c.dist * 14 + 4
    pc.updateProjectionMatrix()
    camera.lookAt(look)
  })
  return null
}

/** Sun, sky light and fog, all taken from the world the reader is in. */
function Light({ shadows }: { shadows: boolean }) {
  const { scene } = useThree()
  const sun = useMemo(() => {
    const l = new THREE.DirectionalLight('#ffffff', 2)
    l.castShadow = shadows
    l.shadow.mapSize.set(2048, 2048)
    l.shadow.bias = -0.0004
    return l
  }, [shadows])
  const hemi = useMemo(() => new THREE.HemisphereLight('#ffffff', '#223', 0.6), [])
  const fog = useMemo(() => new THREE.Fog('#ffffff', 10, 60), [])
  useFrame(({ camera }) => {
    const w = journey.current
    if (!w) return
    const c = w.camera
    const target = new THREE.Vector3(toX(c.lon), 0, toZ(c.lat))
    const az = w.sun.azimuth, el = w.sun.elevation
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))
    sun.position.copy(target).addScaledVector(dir, c.dist * 2.5)
    sun.target.position.copy(target)
    sun.target.updateMatrixWorld()
    sun.color.set(w.sun.color)
    sun.intensity = w.sun.intensity
    if (shadows) {
      const s = sun.shadow.camera as THREE.OrthographicCamera
      const half = c.dist * 0.9
      s.left = -half; s.right = half; s.top = half; s.bottom = -half
      s.near = 0.01; s.far = c.dist * 6
      s.updateProjectionMatrix()
      sun.shadow.normalBias = c.dist * 0.002
    }
    hemi.color.set(mixColor(mixColor(w.sky[0], w.sky[1], 0.5), '#ffffff', 0.45))
    hemi.groundColor.set(mixColor(w.land[0], '#000000', 0.4))
    hemi.intensity = w.ambient * 2
    fog.color.set(w.sky[1])
    fog.near = c.dist * 1.4
    fog.far = c.dist * 5.5 + camera.position.y * 0.5
    scene.fog = fog
  })
  return (
    <>
      <primitive object={sun} />
      <primitive object={sun.target} />
      <primitive object={hemi} />
    </>
  )
}

/** Only the areas the journey is in (or passing through) are laid out; the archipelago always is. */
function Lands({ shadows, onReady }: { shadows: boolean; onReady: () => void }) {
  const [wanted, setWanted] = useState<AreaName[]>(['archipelago'])
  useFrame(() => {
    const w = journey.current
    if (!w) return
    const need = AREA_NAMES.filter((a) => a === 'archipelago' || (w.areaWeights[a] ?? 0) > 0 || place.area === a)
    if (need.some((a) => !wanted.includes(a))) setWanted((cur) => [...new Set([...cur, ...need])])
  })
  return <>{wanted.map((a) => <PaperLand key={a} area={a} shadows={shadows} onReady={a === 'archipelago' ? onReady : undefined} />)}</>
}

/**
 * The one persistent 3D canvas behind every page. It never remounts between sections or routes; the
 * scroll-world engine tells it what world to show. Modest devices start in the lite tier (no shadow
 * maps, lower resolution), and any device steps down if its frame rate falls.
 */
export default function Stage() {
  const [tier, setTier] = useState<Tier>(() => (lowPower() ? 'lite' : 'high'))
  const [ready, setReady] = useState(false)
  const onReady = useCallback(() => setReady(true), [])
  const shadows = tier === 'high'
  return (
    <>
      {!ready && <StaticWorld />}
      <div className="stage" aria-hidden="true" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}>
        <Canvas
          flat
          shadows={shadows ? { type: THREE.PCFSoftShadowMap } : false}
          dpr={tier === 'high' ? [1, 2] : [1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 35, near: 0.01, far: 200, position: [0, 30, 4] }}
        >
          <PerformanceMonitor onDecline={() => setTier('lite')} flipflops={2} />
          {/* still struggling in the lite tier once the land is laid out: the flat journey reads better */}
          {ready && tier === 'lite' && <PerformanceMonitor bounds={() => [18, 26]} iterations={16} onDecline={fallBackToStatic} />}
          <CameraRig />
          <Light shadows={shadows} />
          <Lands shadows={shadows} onReady={onReady} />
          <Pins />
          <Props />
          <Clouds count={tier === 'high' ? 16 : 9} />
        </Canvas>
      </div>
    </>
  )
}

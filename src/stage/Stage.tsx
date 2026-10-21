import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import PaperLand from './PaperLand'
import Pins from './Pins'
import MapHotspots from './MapHotspots'
import Anchors from './Anchors'
import Props from './Props'
import StaticWorld from '../static/StaticWorld'
import { journey } from '../worlds/engine'
import { fallBackToStatic, lowPower } from '../worlds/mode'
import { mixColor } from '../worlds/blend'
import { useLoading } from '../ui/loading'
import { groundHeight } from './place'
import { toX, toZ } from './paper'

type Tier = 'high' | 'lite'

/**
 * The camera follows the blended world, with a slight drift toward the pointer (none in still
 * worlds), and keeps its target on the ground as the land rises and falls beneath it.
 */
function CameraRig() {
  const { camera } = useThree()
  const look = useMemo(() => new THREE.Vector3(), [])
  const y = useRef(0)
  useFrame(({ pointer }, dt) => {
    const w = journey.current
    if (!w) return
    const c = w.camera
    y.current = THREE.MathUtils.damp(y.current, groundHeight(c.lon, c.lat), 4, dt)
    const yaw = c.yaw + pointer.x * 0.05 * w.drift
    const tilt = Math.min(1.35, c.tilt + pointer.y * 0.025 * w.drift)
    look.set(toX(c.lon), y.current, toZ(c.lat))
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
  const { scene, gl } = useThree()
  // shadows are drawn again only when something that casts or frames them has moved
  useEffect(() => {
    gl.shadowMap.autoUpdate = false
    gl.shadowMap.needsUpdate = true
    return () => { gl.shadowMap.autoUpdate = true }
  }, [gl, shadows])
  const shadowKey = useRef('')
  const sun = useMemo(() => {
    const l = new THREE.DirectionalLight('#ffffff', 2)
    l.castShadow = shadows
    // at map scale the paper's shadows are broad: a modest shadow map is plenty, and cheap on laptops
    l.shadow.mapSize.set(1024, 1024)
    l.shadow.bias = -0.0004
    return l
  }, [shadows])
  const hemi = useMemo(() => new THREE.HemisphereLight('#ffffff', '#223', 0.6), [])
  const fog = useMemo(() => new THREE.Fog('#ffffff', 10, 60), [])
  const target = useMemo(() => new THREE.Vector3(), [])
  const dir = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera }) => {
    const w = journey.current
    if (!w) return
    const c = w.camera
    target.set(toX(c.lon), 0, toZ(c.lat))
    const az = w.sun.azimuth, el = w.sun.elevation
    dir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el))
    sun.position.copy(target).addScaledVector(dir, c.dist * 2.5)
    sun.target.position.copy(target)
    sun.target.updateMatrixWorld()
    sun.color.set(w.sun.color)
    sun.intensity = w.sun.intensity
    if (shadows) {
      // the shadow frame follows the world's camera target and sun (not the pointer drift), and the props as they rise
      const key = `${c.lon.toFixed(4)}:${c.lat.toFixed(4)}:${c.dist.toFixed(4)}:${az.toFixed(3)}:${el.toFixed(3)}:${Object.values(w.propWeights).map((v) => v.toFixed(2)).join()}`
      if (key !== shadowKey.current) { shadowKey.current = key; gl.shadowMap.needsUpdate = true }
      const s = sun.shadow.camera as THREE.OrthographicCamera
      const half = c.dist * 0.9
      s.left = -half; s.right = half; s.top = half; s.bottom = -half
      s.near = 0.01; s.far = c.dist * 6
      s.updateProjectionMatrix()
      sun.shadow.normalBias = c.dist * 0.002
    }
    // the sky light is a pale tint of the whole sky, not its darkest colour
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

/**
 * Once the map is laid, compiles every shader the journey will use, behind the loading screen, so
 * nothing stalls on the way. (Synchronous on purpose: the asynchronous path can take many seconds on
 * some integrated GPUs, and the reader is waiting on the loader anyway.)
 */
function WarmUp({ laidOut, onDone }: { laidOut: boolean; onDone: () => void }) {
  const { gl, scene, camera } = useThree()
  useEffect(() => {
    if (!laidOut) return
    // compiles every material in the scene, hidden props included (three walks the whole scene)
    gl.compile(scene, camera)
    const raf = requestAnimationFrame(onDone)
    return () => cancelAnimationFrame(raf)
  }, [laidOut, gl, scene, camera, onDone])
  // development only: lets a test driver read the renderer's draw calls
  if (import.meta.env.DEV) (window as unknown as { __gl: typeof gl }).__gl = gl
  return null
}

/**
 * The one persistent 3D canvas behind every page. It never remounts between sections or routes; the
 * scroll-world engine tells it what world to show. Modest devices start in the lite tier (no shadow
 * maps, lower resolution), and any device steps down if its frame rate falls.
 */
export default function Stage() {
  const [tier, setTier] = useState<Tier>(() => (lowPower() ? 'lite' : 'high'))
  const [laidOut, setLaidOut] = useState(false)
  const [ready, setReady] = useState(false)
  const mark = useLoading((s) => s.mark)
  useEffect(() => { mark({ stage: true }) }, [mark])
  const onLaid = useCallback(() => setLaidOut(true), [])
  const onCompiled = useCallback(() => { setReady(true); mark({ compiled: true }) }, [mark])
  const shadows = tier === 'high'
  return (
    <>
      {!ready && <StaticWorld />}
      <div className="stage" aria-hidden="true" style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.8s ease' }}>
        <Canvas
          flat
          shadows={shadows ? { type: THREE.PCFShadowMap } : false}
          dpr={tier === 'high' ? [1, 2] : [1, 1.25]}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          camera={{ fov: 35, near: 0.01, far: 200, position: [0, 30, 4] }}
        >
          <PerformanceMonitor onDecline={() => setTier('lite')} flipflops={2} />
          {/* still struggling in the lite tier once the land is laid out: the flat journey reads better */}
          {ready && tier === 'lite' && <PerformanceMonitor bounds={() => [18, 26]} iterations={16} onDecline={fallBackToStatic} />}
          <CameraRig />
          <Light shadows={shadows} />
          <PaperLand shadows={shadows} onReady={onLaid} />
          <Pins />
          <MapHotspots />
          <Props />
          <Anchors />
          <WarmUp laidOut={laidOut} onDone={onCompiled} />
        </Canvas>
      </div>
    </>
  )
}

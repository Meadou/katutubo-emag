import { Suspense, useMemo, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import Terrain from './terrain/Terrain'
import { AREA, groundAt } from './terrain/heightfield'
import PlaceMarkers from './scenes/PlaceMarkers'
import StoryStage from './scenes/StoryStage'
import { PALETTE } from './palette'
import { getGroup } from '../content'
import { prefersReducedMotion, useMag, type Shot } from '../store'

const ARCHIPELAGO_SEG: [number, number] = [420, 648]
const SALUG_SEG: [number, number] = [320, 360]
const SALUG = AREA.salug
const SALUG_RECT: [number, number, number, number] = [SALUG.west - 122, -(SALUG.north - 12), SALUG.east - 122, -(SALUG.south - 12)]
const inSalug = (lon: number, lat: number) => lon > SALUG.west && lon < SALUG.east && lat > SALUG.south && lat < SALUG.north

/** The whole archipelago framed in the viewport, looking almost straight down. */
function overview(aspect: number, fov: number): Shot {
  const v = THREE.MathUtils.degToRad(fov)
  const fitH = 16.4 / 2 / Math.tan(v / 2)
  const fitW = 11 / 2 / Math.tan(Math.atan(Math.tan(v / 2) * aspect))
  return { lon: 121.9, lat: 12.4, dist: Math.max(fitH, fitW) * 1.04, tilt: 0.28, yaw: 0 }
}

/** Where the current page wants the camera. */
function wantedShot(aspect: number, fov: number): Shot {
  const { scene, flyTo, shot } = useMag.getState()
  if (flyTo) {
    const g = getGroup(flyTo)
    if (g) return { lon: g.lon, lat: g.lat, dist: 1.1, tilt: 0.62 }
  }
  if (shot) return shot
  if (scene === 'home') return overview(aspect, fov)
  if (scene === 'index') return { ...overview(aspect, fov), dist: overview(aspect, fov).dist * 1.25 }
  const g = getGroup(scene)
  if (g) return { lon: g.lon, lat: g.lat, dist: 1.4, tilt: 0.7, yaw: -0.3 }
  return overview(aspect, fov)
}

/**
 * Glides the camera between shots. Distance is eased on a log scale, so flying from the archipelago
 * down to one valley reads as a single continuous zoom into the same map.
 */
function CameraRig({ onNear }: { onNear: (near: boolean) => void }) {
  const { camera, size, scene } = useThree()
  const s = useMemo(() => {
    const o = overview(size.width / size.height, 38)
    return { lon: o.lon, lat: o.lat, logD: Math.log(o.dist), tilt: o.tilt!, yaw: 0, near: false, calm: prefersReducedMotion() }
  }, [])
  const fog = useMemo(() => new THREE.Fog(PALETTE.ground, 10, 60), [])
  const look = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ pointer }, dt) => {
    const want = wantedShot(size.width / size.height, (camera as THREE.PerspectiveCamera).fov)
    const k = s.calm ? 60 : 1.9
    s.lon = THREE.MathUtils.damp(s.lon, want.lon, k, dt)
    s.lat = THREE.MathUtils.damp(s.lat, want.lat, k, dt)
    s.logD = THREE.MathUtils.damp(s.logD, Math.log(want.dist), k * 0.9, dt)
    s.tilt = THREE.MathUtils.damp(s.tilt, want.tilt ?? 0.5, k, dt)
    s.yaw = THREE.MathUtils.damp(s.yaw, want.yaw ?? 0, k, dt)
    const d = Math.exp(s.logD)
    const drift = s.calm ? 0 : 1
    const tilt = s.tilt + pointer.y * 0.04 * drift
    const yaw = s.yaw + pointer.x * 0.07 * drift
    look.set(s.lon - 122, groundAt(s.lon, s.lat), -(s.lat - 12))
    camera.position.set(look.x + Math.sin(tilt) * Math.sin(yaw) * d, look.y + Math.cos(tilt) * d, look.z + Math.sin(tilt) * Math.cos(yaw) * d)
    camera.near = Math.max(0.002, d * 0.02)
    camera.far = d * 6 + 10
    camera.updateProjectionMatrix()
    camera.lookAt(look)
    fog.near = d * 0.9
    fog.far = d * 3.4
    scene.fog = fog
    const near = d < 2.6 && inSalug(s.lon, s.lat)
    if (near !== s.near) { s.near = near; onNear(near) }
  })
  return null
}

function World() {
  // close over the Salug valley: the finer terrain loads and takes the coarse map's place
  const [near, setNear] = useState(false)
  return (
    <>
      <CameraRig onNear={setNear} />
      <Suspense fallback={null}>
        <Terrain name="archipelago" segments={ARCHIPELAGO_SEG} hole={near ? SALUG_RECT : null} />
      </Suspense>
      {near && (
        <Suspense fallback={null}>
          <Terrain name="salug" segments={SALUG_SEG} relief={0.7} />
        </Suspense>
      )}
      <PlaceMarkers />
      <StoryStage />
    </>
  )
}

export default function Stage() {
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [0, 30, 6], fov: 38, near: 0.01, far: 200 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => useMag.getState().setHovered(null)}
      >
        <color attach="background" args={[PALETTE.ground]} />
        <AdaptiveDpr pixelated={false} />
        <hemisphereLight args={['#dfe9e2', '#0f1512', 0.9]} />
        <directionalLight position={[-6, 10, -4]} intensity={2.2} color="#f4f1e8" />
        <World />
      </Canvas>
    </div>
  )
}

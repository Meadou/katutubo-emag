import { useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Environment, Lightformer, PerformanceMonitor } from '@react-three/drei'
import * as THREE from 'three'
import ArchipelagoScene from './scenes/ArchipelagoScene'
import GroupScene from './scenes/GroupScene'
import Post from './effects/Post'
import { getGroup } from '../content'
import { toWorld } from './archipelago'
import { prefersReducedMotion, useMag } from '../store'

const BG = '#0b0a14'

/** Smoothly moves the camera to wherever the current page wants it. */
function CameraRig() {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3())
  const pos = new THREE.Vector3()
  const tgt = new THREE.Vector3()
  const calm = prefersReducedMotion()

  useFrame(({ pointer, clock }, dt) => {
    const { scene, flyTo } = useMag.getState()
    const narrow = size.width / size.height < 0.8
    const drift = calm ? 0 : 1
    if (flyTo) {
      const g = getGroup(flyTo)!
      const [x, z] = toWorld(g.lon, g.lat)
      pos.set(x, 2.4, z + 2.6); tgt.set(x, 0.3, z)
    } else if (scene === 'home') {
      // on wide screens shift the view left so the map sits to the right of the cover text
      const shift = narrow ? 0 : -Math.min(4.5, (size.width / size.height - 0.8) * 4.5)
      narrow ? pos.set(0, 20, 13) : pos.set(shift, 12.5, 10.5)
      pos.x += (pointer.x * 1.2 + Math.sin(clock.elapsedTime * 0.1) * 0.6) * drift
      pos.z += pointer.y * -0.8 * drift
      tgt.set(0.4 + shift, 0, 0.6)
    } else if (scene === 'index') {
      pos.set(pointer.x * 0.8 * drift, 7, 14); tgt.set(0, -1, 0)
    } else {
      pos.set(pointer.x * 0.3 * drift, pointer.y * 0.2 * drift, 6); tgt.set(0, 0, 0)
    }
    const k = flyTo ? 2.6 : 2
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, k, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, k, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, k, dt)
    look.current.lerp(tgt, 1 - Math.exp(-k * dt))
    camera.lookAt(look.current)
  })
  return null
}

function Scenes() {
  const scene = useMag((s) => s.scene)
  const group = scene !== 'home' && scene !== 'index' ? getGroup(scene) : undefined
  return group ? <GroupScene key={group.slug} group={group} /> : <ArchipelagoScene dim={scene === 'index'} />
}

export default function Stage() {
  const hq = useMag((s) => s.hq)
  const setHq = useMag((s) => s.setHq)
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, 2]}
        camera={{ position: [0, 14, 12], fov: 45, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => useMag.getState().setHovered(null)}
      >
        <color attach="background" args={[BG]} />
        <fog attach="fog" args={[BG, 14, 34]} />
        <PerformanceMonitor onDecline={() => setHq(false)} onIncline={() => setHq(true)} flipflops={3} onFallback={() => setHq(false)} />
        <AdaptiveDpr pixelated={false} />
        <ambientLight intensity={0.35} />
        <directionalLight position={[5, 8, 4]} intensity={1.6} color="#ffe4b5" />
        <pointLight position={[-6, 3, -4]} intensity={30} color="#5b5bd6" />
        {/* Procedural studio lighting for metals — no external HDR download needed */}
        <Environment resolution={256}>
          <Lightformer form="rect" intensity={3} position={[0, 5, -5]} scale={[10, 2, 1]} color="#ffd9a0" />
          <Lightformer form="rect" intensity={1.5} position={[-5, 1, 2]} scale={[2, 6, 1]} color="#8fa8ff" />
          <Lightformer form="ring" intensity={2} position={[4, 2, 4]} scale={2} color="#ffffff" />
        </Environment>
        <CameraRig />
        <Scenes />
        {hq && <Post />}
      </Canvas>
    </div>
  )
}

import { useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr } from '@react-three/drei'
import * as THREE from 'three'
import ArchipelagoScene from './scenes/ArchipelagoScene'
import GroupScene from './scenes/GroupScene'
import { InkDriver, INK } from './ink'
import { getGroup, groups } from '../content'
import { toWorld } from './archipelago'
import { prefersReducedMotion, useMag, type CoverFocus } from '../store'

/** Where the cover camera looks for each scroll section: the whole archipelago or one island group. */
function focusTarget(focus: CoverFocus): THREE.Vector3 {
  if (focus === 'all') return new THREE.Vector3(0.6, 0, 1.9)
  const pts = groups.filter((g) => g.islandGroup === focus).map((g) => toWorld(g.lon, g.lat))
  const [x, z] = pts.reduce(([ax, az], [px, pz]) => [ax + px / pts.length, az + pz / pts.length], [0, 0])
  return new THREE.Vector3(x, 0, z)
}

/** Smoothly moves the camera to wherever the current page wants it. */
function CameraRig() {
  const { camera, size } = useThree()
  const look = useRef(new THREE.Vector3(0.6, 0, 0.8))
  const v = useMemo(() => ({ pos: new THREE.Vector3(), tgt: new THREE.Vector3(), calm: prefersReducedMotion() }), [])

  useFrame(({ pointer }, dt) => {
    const { scene, flyTo, coverFocus } = useMag.getState()
    const { pos, tgt, calm } = v
    const wide = size.width > 900
    const drift = calm ? 0 : 1
    if (flyTo) {
      const g = getGroup(flyTo)!
      const [x, z] = toWorld(g.lon, g.lat)
      tgt.set(x, 0.3, z)
      pos.set(x - 0.6, 2.6, z + 2.4)
    } else if (scene === 'home' || scene === 'index') {
      tgt.copy(focusTarget(scene === 'index' ? 'all' : coverFocus))
      const near = coverFocus !== 'all' && scene === 'home'
      // wide screens: the text column sits at the left, so aim the camera left of the islands
      const lead = wide ? (near ? 3.4 : 3.6) : 0
      tgt.x -= lead
      pos.set(tgt.x + pointer.x * 0.6 * drift, near ? 10.5 : 15, tgt.z + (near ? 8 : 9.5) - pointer.y * 0.5 * drift)
      if (!wide) pos.y += near ? 6 : 12
    } else {
      pos.set(pointer.x * 0.3 * drift, pointer.y * 0.2 * drift, 7)
      tgt.set(0, 0, 0)
    }
    const k = calm ? 50 : flyTo ? 2.6 : 2.2
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pos.x, k, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, pos.y, k, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, pos.z, k, dt)
    look.current.lerp(tgt, calm ? 1 : 1 - Math.exp(-k * dt))
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
  return (
    <div className="stage" aria-hidden="true">
      <Canvas
        dpr={[1, 1.75]}
        camera={{ position: [-3, 15, 10], fov: 40, near: 0.1, far: 100 }}
        gl={{ antialias: true, powerPreference: 'high-performance' }}
        onPointerMissed={() => useMag.getState().setHovered(null)}
      >
        <color attach="background" args={[INK.dark.bg]} />
        <AdaptiveDpr pixelated={false} />
        <ambientLight intensity={0.9} />
        <directionalLight position={[4, 9, 5]} intensity={1.7} />
        <directionalLight position={[-6, 3, -3]} intensity={0.35} />
        <InkDriver />
        <CameraRig />
        <Scenes />
      </Canvas>
    </div>
  )
}

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../worlds/engine'
import { OBJECTS } from './props/registry'
import { placeOn } from './place'

/** Objects belong to a people's chapters: they stand only when the camera has come down to them. */
const NEAR = 3.4

/**
 * A chapter's object rises from the map like a pop-up page as its world arrives, and folds back down
 * when the reader moves on. Once standing, nothing about it moves.
 */
function Prop({ id }: { id: string }) {
  const hinge = useRef<THREE.Group>(null!)
  const root = useRef<THREE.Group>(null!)
  const Comp = OBJECTS[id]
  useFrame(() => {
    const w = journey.current, site = w?.site
    if (!w || !site || w.camera.dist > NEAR) { if (root.current) root.current.visible = false; return }
    const weight = w.propWeights[id] ?? 0
    root.current.visible = weight > 0.01
    if (!root.current.visible) return
    const at = placeOn(site.lon, site.lat, w.map)
    root.current.position.set(at.x, at.y, at.z)
    // folded flat at 0, standing at 1 (eased by the world's own damping)
    hinge.current.rotation.x = -Math.PI / 2 * (1 - THREE.MathUtils.smoothstep(weight, 0.15, 0.95))
  })
  if (!Comp) return null
  return (
    <group ref={root} visible={false}>
      <group ref={hinge}><Comp accent="#ffffff" /></group>
    </group>
  )
}

export default function Props() {
  return <>{Object.keys(OBJECTS).map((id) => <Prop key={id} id={id} />)}</>
}

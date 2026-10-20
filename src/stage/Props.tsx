import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../worlds/engine'
import { OBJECTS } from './props/registry'
import { groundUnder } from './place'
import { toX, toZ } from './paper'

/**
 * A chapter's object rises from the land like a pop-up page as its world arrives, and folds back down
 * when the reader moves on. Once standing, nothing about it moves.
 */
function Prop({ id }: { id: string }) {
  const hinge = useRef<THREE.Group>(null!)
  const root = useRef<THREE.Group>(null!)
  const Comp = OBJECTS[id]
  useFrame(() => {
    const w = journey.current, site = w?.site
    if (!w || !site) { if (root.current) root.current.visible = false; return }
    // an object stands only on its place's finer paper, never on the coarse map
    const weight = (w.propWeights[id] ?? 0) * (w.area === 'archipelago' ? 0 : w.areaWeights[w.area] ?? 0)
    root.current.visible = weight > 0.01
    if (!root.current.visible) return
    root.current.position.set(toX(site.lon), groundUnder(w, site.lon, site.lat), toZ(site.lat))
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

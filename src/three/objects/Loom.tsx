import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Inked, inkMaterials } from '../ink'
import { useExplode } from './useExplode'

const W = 1.6, H = 3.2

/**
 * Backstrap loom drawn as structure only: two beams, the warp threads between them, a few weft
 * passes. Deliberately no textile designs: those belong to the weavers, not to this drawing.
 */
export default function Loom(_: { color: string }) {
  const top = useRef<THREE.Group>(null!)
  const bottom = useRef<THREE.Group>(null!)
  const cloth = useRef<THREE.Group>(null!)
  const e = useExplode()
  const geo = useMemo(() => {
    const warp: THREE.Vector3[] = []
    for (let i = 0; i <= 24; i++) {
      const x = -W / 2 + (i / 24) * W
      warp.push(new THREE.Vector3(x, -H / 2, 0), new THREE.Vector3(x, H / 2, 0))
    }
    const weft: THREE.Vector3[] = []
    for (let j = 0; j < 14; j++) {
      const y = -H / 2 + 0.2 + j * 0.09
      weft.push(new THREE.Vector3(-W / 2, y, 0.004), new THREE.Vector3(W / 2, y, 0.004))
    }
    const cords = [
      new THREE.Vector3(-0.9, 0, 0), new THREE.Vector3(-0.4, -0.9, 0.5),
      new THREE.Vector3(0.9, 0, 0), new THREE.Vector3(0.4, -0.9, 0.5),
    ]
    return {
      sheet: new THREE.BoxGeometry(W, H, 0.01),
      warp: new THREE.BufferGeometry().setFromPoints(warp),
      weft: new THREE.BufferGeometry().setFromPoints(weft),
      beam: new THREE.CylinderGeometry(0.06, 0.06, 2.1, 8).rotateZ(Math.PI / 2),
      cords: new THREE.BufferGeometry().setFromPoints(cords),
    }
  }, [])

  useFrame(({ clock }) => {
    const x = e.current
    top.current.position.y = H / 2 + 0.08 + x * 0.55
    bottom.current.position.y = -H / 2 - 0.08 - x * 0.55
    cloth.current.position.z = x * 0.25
    cloth.current.rotation.x = Math.sin(clock.elapsedTime * 0.7) * 0.03
  })

  return (
    <group rotation={[0.12, -0.45, 0.04]}>
      <group ref={cloth}>
        <Inked geometry={geo.sheet} />
        <lineSegments geometry={geo.warp} material={inkMaterials.soft} position-z={0.006} />
        <lineSegments geometry={geo.weft} material={inkMaterials.edge} position-z={0.006} />
      </group>
      <group ref={top}><Inked geometry={geo.beam} /></group>
      <group ref={bottom}>
        <Inked geometry={geo.beam} />
        {/* strap cords to the weaver's back */}
        <lineSegments geometry={geo.cords} material={inkMaterials.edge} />
      </group>
    </group>
  )
}

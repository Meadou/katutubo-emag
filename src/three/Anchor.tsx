import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { anchors } from './anchors'

/** An invisible point in the scene that a leader line can pin to. */
export default function Anchor({ id, position = [0, 0, 0] }: { id: string; position?: [number, number, number] }) {
  const ref = useRef<THREE.Object3D>(null!)
  const v = useMemo(() => new THREE.Vector3(), [])
  useEffect(() => () => { anchors.delete(id) }, [id])
  useFrame(({ camera, size }) => {
    ref.current.getWorldPosition(v)
    v.project(camera)
    const on = v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05
    const p = anchors.get(id) ?? { x: 0, y: 0, on }
    p.x = (v.x * 0.5 + 0.5) * size.width
    p.y = (-v.y * 0.5 + 0.5) * size.height
    p.on = on
    anchors.set(id, p)
  })
  return <object3D ref={ref} position={position} />
}

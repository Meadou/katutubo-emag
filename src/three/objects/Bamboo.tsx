import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Inked, inkMaterials } from '../ink'
import { useExplode } from './useExplode'

const LAYOUT = [
  { p: [-0.55, 0.15, 0], r: [0.2, 0, 1.2], l: 3.2, out: [-0.9, 0.5, 0.2] },
  { p: [0.35, -0.25, 0.35], r: [-0.1, 0.3, 1.35], l: 2.6, out: [0.6, -0.7, 0.5] },
  { p: [0.75, 0.5, -0.4], r: [0.3, -0.2, 1.05], l: 2.2, out: [0.7, 0.8, -0.4] },
] as const

/**
 * Bamboo tubes with incised marks, evoking ambahan carved on bamboo. The marks are deliberately
 * abstract — they are NOT real Surat Mangyan characters. The tubes drift apart as the chapter scrolls.
 */
export default function Bamboo(_: { color: string }) {
  const tubes = useRef<THREE.Group>(null!)
  const e = useExplode()
  const geo = useMemo(() => {
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    return LAYOUT.map((b) => {
      // short abstract strokes scored around the tube surface
      const marks: THREE.Vector3[] = []
      for (let row = 0; row < 3; row++) {
        for (let k = 0; k < 9; k++) {
          const a = -0.9 + k * 0.22 + rnd() * 0.05
          const y = -b.l * 0.25 + row * 0.22
          const r = 0.165
          marks.push(new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r), new THREE.Vector3(Math.cos(a + 0.05) * r, y + 0.09 + rnd() * 0.05, Math.sin(a + 0.05) * r))
        }
      }
      return {
        tube: new THREE.CylinderGeometry(0.16, 0.16, b.l, 10, 1),
        node: new THREE.TorusGeometry(0.168, 0.022, 4, 10).rotateX(Math.PI / 2),
        marks: new THREE.BufferGeometry().setFromPoints(marks),
      }
    })
  }, [])

  useFrame(({ clock }) => {
    const x = e.current
    tubes.current.children.forEach((t, i) => {
      const b = LAYOUT[i]
      t.position.set(b.p[0] + b.out[0] * x, b.p[1] + b.out[1] * x + Math.sin(clock.elapsedTime * 0.9 + i * 2) * 0.08, b.p[2] + b.out[2] * x)
      t.rotation.y = clock.elapsedTime * 0.2 + i
    })
  })

  return (
    <group ref={tubes}>
      {LAYOUT.map((b, i) => (
        <group key={i} rotation={b.r as unknown as [number, number, number]}>
          <Inked geometry={geo[i].tube} threshold={40} />
          {[-0.5, 0, 0.5].map((k) => <Inked key={k} geometry={geo[i].node} position-y={k * b.l * 0.9} threshold={50} />)}
          <lineSegments geometry={geo[i].marks} material={inkMaterials.edge} />
        </group>
      ))}
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Inked } from '../ink'
import { useExplode } from './useExplode'

const N = 9

/** A mountainside carved into stepped terraces, forest on the crown. The steps lift apart like a section drawing as the chapter scrolls. */
export default function RiceTerraces(_: { color: string }) {
  const ref = useRef<THREE.Group>(null!)
  const steps = useRef<THREE.Group[]>([])
  const crown = useRef<THREE.Group>(null!)
  const e = useExplode()
  const geo = useMemo(() => {
    const out: THREE.BufferGeometry[] = []
    for (let i = 0; i < N; i++) {
      const r = 2.1 - i * 0.21
      const g = new THREE.CylinderGeometry(r, r + 0.05, 0.2, 40, 1)
      // wobble the contour so it follows an organic hillside, not a perfect cylinder
      const pos = g.attributes.position as THREE.BufferAttribute
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v), z = pos.getZ(v)
        const a = Math.atan2(z, x)
        const k = 1 + 0.09 * Math.sin(a * 3 + i * 0.9) + 0.05 * Math.sin(a * 7 + i * 2.1)
        pos.setXYZ(v, x * k, pos.getY(v), z * k)
      }
      g.computeVertexNormals()
      out.push(g)
    }
    return { steps: out, tree: new THREE.ConeGeometry(0.14, 0.42, 6) }
  }, [])

  useFrame((_, dt) => {
    ref.current.rotation.y += dt * 0.1
    const x = e.current
    steps.current.forEach((s, i) => { if (s) s.position.y = i * (0.2 + x * 0.2) })
    crown.current.position.y = 2.05 + x * 1.9
  })

  return (
    <group ref={ref} position-y={-1.1}>
      {geo.steps.map((g, i) => (
        <group key={i} ref={(el) => { if (el) steps.current[i] = el }}>
          <Inked geometry={g} threshold={40} />
        </group>
      ))}
      {/* forest crown (muyong) */}
      <group ref={crown}>
        {Array.from({ length: 12 }).map((_, i) => {
          const a = (i / 12) * Math.PI * 2
          return <Inked key={i} geometry={geo.tree} position={[Math.cos(a) * 0.3, (i % 3) * 0.05, Math.sin(a) * 0.3]} />
        })}
      </group>
    </group>
  )
}

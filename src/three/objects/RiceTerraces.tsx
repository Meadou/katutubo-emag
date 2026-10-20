import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** A mountain sculpted into stepped terraces, each step holding a mirror of water. */
export default function RiceTerraces({ color }: { color: string }) {
  const ref = useRef<THREE.Group>(null!)
  const steps = useMemo(() => {
    const out: { y: number; geo: THREE.BufferGeometry; water: THREE.BufferGeometry }[] = []
    const n = 9
    for (let i = 0; i < n; i++) {
      const r = 2.1 - i * 0.21
      const geo = new THREE.CylinderGeometry(r, r + 0.05, 0.2, 96, 1)
      // wobble the contour so it follows an organic hillside, not a perfect cylinder
      const pos = geo.attributes.position as THREE.BufferAttribute
      for (let v = 0; v < pos.count; v++) {
        const x = pos.getX(v), z = pos.getZ(v)
        const a = Math.atan2(z, x)
        const k = 1 + 0.09 * Math.sin(a * 3 + i * 0.9) + 0.05 * Math.sin(a * 7 + i * 2.1)
        pos.setXYZ(v, x * k, pos.getY(v), z * k)
      }
      geo.computeVertexNormals()
      const water = new THREE.CircleGeometry(r * 0.97, 96)
      const wp = water.attributes.position as THREE.BufferAttribute
      for (let v = 0; v < wp.count; v++) {
        const x = wp.getX(v), y = wp.getY(v)
        const a = Math.atan2(y, x)
        const k = 1 + 0.09 * Math.sin(-a * 3 + i * 0.9) + 0.05 * Math.sin(-a * 7 + i * 2.1)
        wp.setXY(v, x * k, y * k)
      }
      out.push({ y: i * 0.2, geo, water })
    }
    return out
  }, [])
  const green = useMemo(() => new THREE.Color(color), [color])

  useFrame((_, dt) => { ref.current.rotation.y += dt * 0.12 })

  return (
    <group ref={ref} position-y={-0.9}>
      {steps.map((s, i) => (
        <group key={i} position-y={s.y}>
          <mesh geometry={s.geo} castShadow receiveShadow>
            <meshStandardMaterial color={green.clone().offsetHSL(0, 0, -0.18 + i * 0.015)} roughness={0.9} />
          </mesh>
          <mesh geometry={s.water} rotation-x={-Math.PI / 2} position-y={0.101}>
            <meshStandardMaterial color={i % 2 ? '#9fd3c7' : green} metalness={0.6} roughness={i % 2 ? 0.08 : 0.7} />
          </mesh>
        </group>
      ))}
      {/* forest crown (muyong) */}
      {Array.from({ length: 14 }).map((_, i) => {
        const a = (i / 14) * Math.PI * 2
        return (
          <mesh key={i} position={[Math.cos(a) * 0.3, 2.05 + (i % 3) * 0.05, Math.sin(a) * 0.3]}>
            <coneGeometry args={[0.14, 0.42, 7]} />
            <meshStandardMaterial color="#2f5d3a" roughness={0.8} />
          </mesh>
        )
      })}
    </group>
  )
}

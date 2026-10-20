import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Inked } from '../ink'
import { useExplode } from './useExplode'

/**
 * A slow orbit of small drawn solids around an empty centre — used for chapters about belief, story
 * and the unseen world, and for issues still being prepared. The orbit widens as the chapter scrolls.
 */
export default function Spirits(_: { color: string }) {
  const ref = useRef<THREE.Group>(null!)
  const e = useExplode()
  const bodies = useMemo(() => {
    const ico = new THREE.IcosahedronGeometry(1, 0)
    return Array.from({ length: 11 }, (_, i) => ({
      a: (i / 11) * Math.PI * 2,
      r: 0.9 + (i % 3) * 0.35,
      y: ((i * 37) % 11) / 11 * 2.4 - 1.2,
      s: 0.08 + ((i * 13) % 5) * 0.035,
      speed: 0.12 + (i % 4) * 0.03,
      geo: ico,
    }))
  }, [])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime
    const w = 1 + e.current * 0.7
    ref.current.children.forEach((c, i) => {
      const b = bodies[i]
      const a = b.a + t * b.speed
      c.position.set(Math.cos(a) * b.r * w, b.y + Math.sin(t * 0.5 + i) * 0.12, Math.sin(a) * b.r * w)
      c.rotation.set(t * 0.3 + i, t * 0.2, 0)
    })
  })

  return (
    <group ref={ref}>
      {bodies.map((b, i) => <Inked key={i} geometry={b.geo} scale={b.s} threshold={1} />)}
    </group>
  )
}

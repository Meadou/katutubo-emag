import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { createWeaveMaterial } from '../shaders/WeavePattern'

/** Backstrap loom: two bars holding a length of patterned cloth that ripples like it's being worked. */
export default function Loom({ color }: { color: string }) {
  const mat = useMemo(() => createWeaveMaterial(color, { wave: 0.12 }), [color])
  useEffect(() => () => mat.dispose(), [mat])
  useFrame(({ clock }) => { mat.uniforms.uTime.value = clock.elapsedTime })

  return (
    <group rotation={[0.15, -0.5, 0.05]}>
      <mesh material={mat}>
        <planeGeometry args={[1.6, 3.2, 40, 80]} />
      </mesh>
      {[1.68, -1.68].map((y) => (
        <mesh key={y} position-y={y} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.06, 0.06, 2.1, 16]} />
          <meshStandardMaterial color="#6b4423" roughness={0.55} />
        </mesh>
      ))}
      {/* strap cords */}
      {[-0.9, 0.9].map((x) => (
        <mesh key={x} position={[x, -2.1, 0.3]} rotation-x={0.6}>
          <cylinderGeometry args={[0.012, 0.012, 1, 6]} />
          <meshStandardMaterial color="#c9b48a" />
        </mesh>
      ))}
    </group>
  )
}

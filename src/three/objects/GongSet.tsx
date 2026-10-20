import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { audioLevel } from '../../store'

/** Kulintang-style set of bossed gongs on a wooden frame. Gongs swing and glow with the music player. */
export default function GongSet({ color }: { color: string }) {
  const gongGeo = useMemo(() => {
    // Lathe profile: rim → flat face → raised boss (knob) in the center
    const p = [
      [0.0, 0.2], [0.08, 0.2], [0.12, 0.17], [0.14, 0.1], [0.36, 0.08], [0.42, 0.04], [0.44, -0.08], [0.4, -0.1], [0.36, -0.02], [0.0, -0.02],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return new THREE.LatheGeometry(p, 64)
  }, [])
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: '#c9973a', metalness: 1, roughness: 0.28, emissive: new THREE.Color(color), emissiveIntensity: 0 }), [color])
  const mats = useMemo(() => Array.from({ length: 5 }, () => brass.clone()), [brass])
  const gongs = useRef<THREE.Group[]>([])

  useFrame(({ clock }, dt) => {
    gongs.current.forEach((g, i) => {
      if (!g) return
      const b = audioLevel.bands[i] ?? 0
      audioLevel.bands[i] = Math.max(0, b - dt * 2.2) // decay
      g.position.y = 0.35 + Math.sin(clock.elapsedTime * 1.4 + i) * 0.03 + b * 0.08
      g.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i * 0.7) * 0.04 + b * 0.15
      mats[i].emissiveIntensity = b * 2.5
    })
  })

  return (
    <group rotation-x={0.5}>
      {/* frame */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[4.6, 0.12, 0.9]} />
        <meshStandardMaterial color="#4a2a17" roughness={0.6} />
      </mesh>
      {[-0.35, 0.35].map((z) => (
        <mesh key={z} position={[0, 0.18, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.03, 0.03, 4.4, 8]} />
          <meshStandardMaterial color="#8a5a2b" roughness={0.5} />
        </mesh>
      ))}
      {mats.map((m, i) => (
        <group key={i} position={[(i - 2) * 0.88, 0.35, 0]} ref={(el) => { if (el) gongs.current[i] = el }} scale={1 - Math.abs(i - 2) * 0.04}>
          <mesh geometry={gongGeo} material={m} castShadow />
        </group>
      ))}
    </group>
  )
}

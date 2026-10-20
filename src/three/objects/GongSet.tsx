import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { audioLevel } from '../../store'
import { Inked } from '../ink'
import { useExplode } from './useExplode'

/** A row of bossed gongs on a wooden frame. They lift off the frame as the chapter scrolls, and swing with the music player. */
export default function GongSet(_: { color: string }) {
  const geo = useMemo(() => {
    // Lathe profile: rim → flat face → raised boss (knob) in the center
    const p = [
      [0.0, 0.2], [0.08, 0.2], [0.12, 0.17], [0.14, 0.1], [0.36, 0.08], [0.42, 0.04], [0.44, -0.08], [0.4, -0.1], [0.36, -0.02], [0.0, -0.02],
    ].map(([x, y]) => new THREE.Vector2(x, y))
    return {
      gong: new THREE.LatheGeometry(p, 28),
      frame: new THREE.BoxGeometry(4.6, 0.12, 0.9),
      rail: new THREE.CylinderGeometry(0.03, 0.03, 4.4, 6).rotateZ(Math.PI / 2),
    }
  }, [])
  const gongs = useRef<THREE.Group[]>([])
  const rails = useRef<THREE.Group>(null!)
  const e = useExplode()

  useFrame(({ clock }, dt) => {
    const x = e.current
    rails.current.position.y = -x * 0.35
    gongs.current.forEach((g, i) => {
      if (!g) return
      const b = audioLevel.bands[i] ?? 0
      audioLevel.bands[i] = Math.max(0, b - dt * 2.2) // decay
      const off = i - 2
      g.position.x = off * (0.88 + x * 0.32)
      g.position.y = 0.35 + x * (0.75 + Math.abs(off) * 0.18) + Math.sin(clock.elapsedTime * 1.4 + i) * 0.03 + b * 0.08
      g.rotation.x = -x * 0.5
      g.rotation.z = Math.sin(clock.elapsedTime * 0.8 + i * 0.7) * 0.04 + b * 0.15
    })
  })

  return (
    <group rotation-x={0.45} position-y={-0.3}>
      <group ref={rails}>
        <Inked geometry={geo.frame} position={[0, 0.05, 0]} />
        {[-0.35, 0.35].map((z) => <Inked key={z} geometry={geo.rail} position={[0, 0.18, z]} />)}
      </group>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} ref={(el) => { if (el) gongs.current[i] = el }} scale={1 - Math.abs(i - 2) * 0.04}>
          <Inked geometry={geo.gong} threshold={20} />
        </group>
      ))}
    </group>
  )
}

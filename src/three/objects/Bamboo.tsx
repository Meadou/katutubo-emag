import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/**
 * Floating bamboo tubes with incised marks, evoking ambahan carved on bamboo.
 * The marks are deliberately abstract — they are NOT real Surat Mangyan characters.
 */
function useCarvingTexture(color: string) {
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512; c.height = 128
    const g = c.getContext('2d')!
    const grd = g.createLinearGradient(0, 0, 0, 128)
    grd.addColorStop(0, '#c8b06a'); grd.addColorStop(0.5, '#e3cf8f'); grd.addColorStop(1, '#a88f4c')
    g.fillStyle = grd; g.fillRect(0, 0, 512, 128)
    // fibre lines
    g.globalAlpha = 0.15; g.strokeStyle = '#6d5a2a'
    for (let y = 0; y < 128; y += 3) { g.beginPath(); g.moveTo(0, y); g.lineTo(512, y + Math.random() * 2); g.stroke() }
    // abstract incised strokes in rows
    g.globalAlpha = 0.9; g.strokeStyle = '#3a2a12'; g.lineWidth = 2.5; g.lineCap = 'round'
    let seed = 7
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
    for (let row = 0; row < 3; row++) {
      for (let x = 20; x < 490; x += 18 + rnd() * 10) {
        const y = 22 + row * 36
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + 6 + rnd() * 6, y + 10 + rnd() * 8)
        if (rnd() > 0.5) { g.moveTo(x + 2, y + 14); g.lineTo(x + 12, y + 6) }
        g.stroke()
      }
    }
    g.globalAlpha = 0.25; g.fillStyle = color; g.fillRect(0, 118, 512, 10)
    const tex = new THREE.CanvasTexture(c)
    tex.colorSpace = THREE.SRGBColorSpace
    tex.anisotropy = 4
    return tex
  }, [color])
}

export default function Bamboo({ color }: { color: string }) {
  const tex = useCarvingTexture(color)
  const tubes = useRef<THREE.Group>(null!)
  const layout = useMemo(() => [
    { p: [-0.7, 0.2, 0], r: [0.2, 0, 1.2], l: 3.2 },
    { p: [0.4, -0.3, 0.4], r: [-0.1, 0.3, 1.35], l: 2.6 },
    { p: [0.9, 0.6, -0.5], r: [0.3, -0.2, 1.05], l: 2.2 },
  ] as const, [])

  useFrame(({ clock }) => {
    tubes.current.children.forEach((t, i) => {
      t.position.y = layout[i].p[1] + Math.sin(clock.elapsedTime * 0.9 + i * 2) * 0.12
      t.rotation.y = clock.elapsedTime * 0.25 + i
    })
  })

  return (
    <group ref={tubes}>
      {layout.map((b, i) => (
        <group key={i} position={b.p as unknown as [number, number, number]} rotation={b.r as unknown as [number, number, number]}>
          <mesh>
            <cylinderGeometry args={[0.16, 0.16, b.l, 32, 1, true]} />
            <meshStandardMaterial map={tex} roughness={0.55} side={THREE.DoubleSide} />
          </mesh>
          {/* nodes */}
          {[-0.5, 0, 0.5].map((k) => (
            <mesh key={k} position-y={k * b.l * 0.9}>
              <torusGeometry args={[0.165, 0.025, 8, 32]} />
              <meshStandardMaterial color="#9c8442" roughness={0.6} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  )
}

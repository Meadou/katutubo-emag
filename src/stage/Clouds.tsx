import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../worlds/engine'
import { paperMaterial, toX, toZ } from './paper'

/**
 * Cut-paper clouds over the Davao Region, met only on the descent. Each is two layers of card, a
 * shaded one under a lighter one, like the map's own sheets. They are driven by the scroll, not by the
 * clock: they gather as the camera comes down through them and slide apart and fade as it arrives,
 * so nothing drifts while the reader is still.
 */

interface Cloud { lon: number; lat: number; y: number; r: number; seed: number; out: [number, number] }

// laid along the descent onto the gulf, from high over northern Mindanao down to the gulf, each with the way it parts
const CLOUDS: Cloud[] = [
  { lon: 124.7, lat: 8.6, y: 8.4, r: 0.75, seed: 1, out: [-1, -0.3] },
  { lon: 125.5, lat: 8.8, y: 7.6, r: 0.6, seed: 2, out: [0.6, -1] },
  { lon: 124.9, lat: 7.9, y: 6.6, r: 0.55, seed: 3, out: [-1, 0.2] },
  { lon: 126.1, lat: 8.1, y: 6.0, r: 0.65, seed: 4, out: [1, -0.4] },
  { lon: 125.4, lat: 7.6, y: 5.2, r: 0.5, seed: 5, out: [-0.7, -0.7] },
  { lon: 126.3, lat: 7.3, y: 4.6, r: 0.55, seed: 6, out: [1, 0.2] },
  { lon: 125.0, lat: 7.1, y: 4.1, r: 0.45, seed: 7, out: [-1, 0.5] },
  { lon: 125.9, lat: 7.6, y: 3.7, r: 0.4, seed: 8, out: [0.5, -1] },
  { lon: 125.6, lat: 6.6, y: 3.3, r: 0.5, seed: 9, out: [0.2, 1] },
  { lon: 126.2, lat: 6.7, y: 2.9, r: 0.38, seed: 10, out: [1, 0.7] },
  { lon: 125.25, lat: 6.6, y: 2.6, r: 0.36, seed: 11, out: [-1, 0.8] },
]

/** A flat, softly lobed outline, like a cloud cut from card with scissors. */
function cloudGeometry(seed: number) {
  const s = new THREE.Shape()
  const n = 96, p1 = seed * 1.7, p2 = seed * 2.3
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    // lobes on the top edge, a flatter bottom, as a cloud is drawn
    const r = 1 + 0.2 * Math.max(0, Math.sin(4 * a + p1)) + 0.08 * Math.sin(7 * a + p2)
    const x = Math.cos(a) * r * 1.5, y = Math.sin(a) * r * (Math.sin(a) > 0 ? 0.85 : 0.55)
    if (i === 0) s.moveTo(x, y)
    else s.lineTo(x, y)
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false, curveSegments: 1 })
  g.rotateX(-Math.PI / 2)
  return g
}

const card = (color: string) => {
  const m = paperMaterial(color)
  m.transparent = true
  m.opacity = 0
  m.depthWrite = false
  return m
}

export default function Clouds() {
  const items = useMemo(() => CLOUDS.map((c) => ({ c, geo: cloudGeometry(c.seed), under: card('#ddd3c4'), top: card('#fffaf2') })), [])
  const refs = useRef<(THREE.Group | null)[]>([])
  const v = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ camera }) => {
    const k = journey.current?.map.clouds ?? 0
    items.forEach(({ c, under, top }, i) => {
      const g = refs.current[i]
      if (!g) return
      g.visible = k > 0.01
      if (!g.visible) return
      // apart when absent, gathered along the descent at its height
      const spread = (1 - k) * 1.8
      g.position.set(toX(c.lon) + c.out[0] * spread, c.y, toZ(c.lat) + c.out[1] * spread)
      // the camera passes a cloud without a white flash: it thins as the lens comes close
      const near = THREE.MathUtils.smoothstep(camera.position.distanceTo(v.copy(g.position)), c.r * 0.8, c.r * 3)
      top.opacity = 0.82 * k * near
      under.opacity = 0.6 * k * near
    })
  })

  return (
    <group>
      {items.map(({ c, geo, under, top }, i) => (
        <group key={i} ref={(g) => { refs.current[i] = g }} scale={[c.r, 1, c.r]} visible={false}>
          {/* the shaded layer, a little lower and to the side, then the light one over it */}
          <mesh geometry={geo} material={under} position={[0.08, -0.05, 0.06]} scale={[1.02, 1, 1.04]} renderOrder={1} />
          <mesh geometry={geo} material={top} renderOrder={2} />
        </group>
      ))}
    </group>
  )
}

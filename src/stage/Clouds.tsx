import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../worlds/engine'
import { mixColor } from '../worlds/blend'
import { toX, toZ } from './paper'

/** A cloud cut from paper: a lobed outline, extruded thin. */
function cloudGeometry(seed: number) {
  const shape = new THREE.Shape()
  const lobes = 5 + (seed % 3)
  const N = 64
  for (let i = 0; i <= N; i++) {
    const a = (i / N) * Math.PI * 2
    const r = 1 + 0.22 * Math.sin(a * lobes + seed) + 0.12 * Math.sin(a * (lobes + 3) + seed * 2.3)
    const x = Math.cos(a) * r * 1.7, y = Math.sin(a) * r * 0.75
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  const g = new THREE.ExtrudeGeometry(shape, { depth: 0.08, bevelEnabled: false, curveSegments: 1 })
  g.rotateX(-Math.PI / 2)
  return g
}

/**
 * The bank of paper clouds the camera dives through. It hangs above the point the camera is diving
 * toward, at heights the dive passes through, so the reader falls through it; it is only drawn while
 * the world asks for clouds.
 */
export default function Clouds({ count = 14 }: { count?: number }) {
  const group = useRef<THREE.Group>(null!)
  const mat = useMemo(() => new THREE.MeshLambertMaterial({ color: '#ffffff', transparent: true }), [])
  const clouds = useMemo(() => {
    let s = 7
    const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647)
    return Array.from({ length: count }, (_, i) => {
      const h = 0.5 * Math.pow(9, i / (count - 1)) // heights from 0.5 to 4.5, denser near the land
      const a = rnd() * Math.PI * 2, r = (0.25 + rnd() * 0.75) * h * 0.6
      return { geo: cloudGeometry(i * 3 + 1), x: Math.cos(a) * r, z: Math.sin(a) * r, y: h, s: h * (0.22 + rnd() * 0.18), spin: rnd() * Math.PI }
    })
  }, [count])

  useFrame(({ clock }) => {
    const w = journey.current
    if (!w) return
    const k = w.clouds
    group.current.visible = k > 0.01
    if (!group.current.visible) return
    group.current.position.set(toX(w.camera.lon), 0, toZ(w.camera.lat))
    mat.opacity = Math.min(1, k * 1.15)
    mat.color.set(mixColor('#ffffff', w.sky[1], 0.25))
    mat.emissive.set(mixColor(w.sky[1], '#ffffff', 0.4)).multiplyScalar(0.45)
    // clouds drift slowly; they are landscape, free to move
    group.current.children.forEach((c, i) => { c.rotation.y = clouds[i].spin + clock.elapsedTime * 0.01 * (i % 2 ? 1 : -1) })
  })

  return (
    <group ref={group}>
      {clouds.map((c, i) => <mesh key={i} geometry={c.geo} material={mat} position={[c.x, c.y, c.z]} scale={[c.s, c.s * 0.6, c.s]} />)}
    </group>
  )
}

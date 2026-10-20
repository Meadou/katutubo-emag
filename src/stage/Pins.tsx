import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { groups, type Group } from '../content'
import { journey } from '../worlds/engine'
import { useUi } from '../ui/store'
import { groundHeight } from './place'
import { heightOf, toX, toZ } from './paper'
import { paperMaterial } from './paper'

const pole = new THREE.CylinderGeometry(0.02, 0.02, 1, 6).translate(0, 0.5, 0)
const flag = (() => {
  const s = new THREE.Shape()
  s.moveTo(0, 0); s.lineTo(0.62, -0.17); s.lineTo(0, -0.34); s.lineTo(0, 0)
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false })
  g.translate(0.02, 1, -0.01)
  return g
})()
const ink = paperMaterial('#1d1b17')

/** A paper flag on a pin at each people's place on the map views; the marked place stands taller. */
function Pin({ g }: { g: Group }) {
  const ref = useRef<THREE.Group>(null!)
  const mat = useMemo(() => paperMaterial(g.placeholder ? '#efe7d6' : g.color), [g])
  useFrame(({ camera }, dt) => {
    const w = journey.current
    if (!w) return
    const on = (w.pin && Math.abs(w.pin.lon - g.lon) < 1e-6 && Math.abs(w.pin.lat - g.lat) < 1e-6) || useUi.getState().hovered === g.slug
    // pins belong to the map: they fold away as the camera comes down to a place
    const showing = w.camera.dist > 2.2 ? 1 : 0
    ref.current.position.y = groundHeight('archipelago', g.lon, g.lat) ?? heightOf(1)
    const d = camera.position.distanceTo(ref.current.position)
    const target = showing * d * (on ? 0.05 : 0.034)
    const s = THREE.MathUtils.damp(ref.current.scale.x, target, 8, dt)
    ref.current.scale.setScalar(s)
    ref.current.visible = s > d * 0.002
  })
  return (
    <group ref={ref} position={[toX(g.lon), heightOf(1), toZ(g.lat)]} scale={0.0001}>
      <mesh geometry={pole} material={ink} />
      <mesh geometry={flag} material={mat} />
    </group>
  )
}

export default function Pins() {
  return <>{groups.map((g) => <Pin key={g.slug} g={g} />)}</>
}

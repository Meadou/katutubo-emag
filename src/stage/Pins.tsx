import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { groups, type Group } from '../content'
import { goToSection, journey } from '../worlds/engine'
import { stopId } from '../worlds/journeys'
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
// a generous, invisible target around the flag, so a pin is easy to point at and to tap
const hit = new THREE.SphereGeometry(0.42, 10, 8).translate(0.28, 0.8, 0)
const unseen = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })

const pointer = (on: boolean) => { document.body.style.cursor = on ? 'pointer' : '' }

/** Farther out than this, the camera is on a map view (the cover, an island group) and the pins stand. */
export const MAP_VIEW = 3.2

/**
 * A paper flag on a pin at each people's place on the map views; the marked or pointed-at place
 * stands taller. Pointing at a pin leans the opening view toward that people; choosing it goes
 * straight to their stop, skipping the peoples in between.
 */
function Pin({ g }: { g: Group }) {
  const ref = useRef<THREE.Group>(null!)
  const mat = useMemo(() => paperMaterial(g.placeholder ? '#efe7d6' : g.color), [g])
  const setHovered = useUi((u) => u.setHovered)
  useEffect(() => () => pointer(false), [])

  useFrame(({ camera }, dt) => {
    const w = journey.current
    if (!w) return
    const on = (w.pin && Math.abs(w.pin.lon - g.lon) < 1e-6 && Math.abs(w.pin.lat - g.lat) < 1e-6) || useUi.getState().hovered === g.slug
    // pins belong to the map views: they fold away as the camera comes down to a people
    const showing = w.camera.dist > MAP_VIEW ? 1 : 0
    ref.current.position.y = Math.max(groundHeight(g.lon, g.lat), heightOf(1))
    const d = camera.position.distanceTo(ref.current.position)
    const target = showing * d * (on ? 0.05 : 0.034)
    const s = THREE.MathUtils.damp(ref.current.scale.x, target, 8, dt)
    ref.current.scale.setScalar(s)
    ref.current.visible = s > d * 0.002
  })

  const over = (e: ThreeEvent<PointerEvent>) => {
    if (!ref.current.visible) return
    e.stopPropagation()
    setHovered(g.slug)
    pointer(true)
  }
  const out = () => {
    if (useUi.getState().hovered === g.slug) setHovered(null)
    pointer(false)
  }
  const choose = (e: ThreeEvent<MouseEvent>) => {
    if (!ref.current.visible) return
    e.stopPropagation()
    // let go of the lean first, or the camera would keep pulling toward the opening view
    setHovered(null)
    pointer(false)
    // an instant jump: the camera then glides straight to that people, not through every stop on the way
    goToSection(stopId(g.slug), false, 'end')
    history.replaceState(null, '', `#/group/${g.slug}`)
  }

  return (
    <group ref={ref} position={[toX(g.lon), heightOf(1), toZ(g.lat)]} scale={0.0001} onPointerOver={over} onPointerOut={out} onClick={choose}>
      <mesh geometry={pole} material={ink} />
      <mesh geometry={flag} material={mat} />
      <mesh geometry={hit} material={unseen} />
    </group>
  )
}

export default function Pins() {
  return <>{groups.map((g) => <Pin key={g.slug} g={g} />)}</>
}

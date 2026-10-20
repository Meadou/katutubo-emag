import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import Statue, { stone } from '../figures/Statue'
import Anchor from '../Anchor'
import { groundAt } from '../terrain/heightfield'
import { groups, type Group } from '../../content'
import { useMag } from '../../store'

const plinth = new THREE.CylinderGeometry(0.16, 0.19, 0.08, 20).translate(0, 0.04, 0)
const v = new THREE.Vector3()

/**
 * Each people stands on the map as a small statue at their place; a people whose issue is still being
 * prepared is an empty plinth. Markers keep a readable size at every zoom, and give way to the story's
 * own figures once you are there.
 */
function Marker({ group, hidden }: { group: Group; hidden: boolean }) {
  const root = useRef<THREE.Group>(null!)
  const on = useMag((s) => s.hovered === group.slug)
  const setHovered = useMag((s) => s.setHovered)
  const setFlyTo = useMag((s) => s.setFlyTo)
  const x = group.lon - 122, z = -(group.lat - 12)

  useFrame(({ camera }, dt) => {
    const y = groundAt(group.lon, group.lat)
    root.current.position.set(x, y, z)
    const dist = camera.position.distanceTo(v.set(x, y, z))
    const target = hidden ? 0.0001 : THREE.MathUtils.clamp(dist * 0.032, 0.05, 0.9) * (on ? 1.25 : 1)
    root.current.scale.setScalar(THREE.MathUtils.damp(root.current.scale.x, target, 8, dt))
    root.current.visible = root.current.scale.x > 0.002
  })

  return (
    <group ref={root}>
      {group.placeholder ? (
        <mesh geometry={plinth} material={stone} />
      ) : (
        <Statue pose={on ? 'raise' : 'stand'} position={[0, 0, 0]} height={1} facing={0.4} seed={group.lat} />
      )}
      <Anchor id={`place:${group.slug}`} position={[0, group.placeholder ? 0.2 : 1.15, 0]} />
      <mesh
        position-y={0.5} visible={false}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(group.slug); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(null); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); setFlyTo(group.slug) }}
      >
        <cylinderGeometry args={[0.45, 0.45, 1.2, 8]} />
      </mesh>
    </group>
  )
}

export default function PlaceMarkers() {
  const scene = useMag((s) => s.scene)
  const stage = useMag((s) => s.stage)
  const here = useMemo(() => new Set(stage ? [scene] : []), [scene, stage])
  return <>{groups.map((g) => <Marker key={g.slug} group={g} hidden={here.has(g.slug)} />)}</>
}

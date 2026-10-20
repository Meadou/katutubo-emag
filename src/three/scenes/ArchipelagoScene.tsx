import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { ISLANDS, toWorld } from '../archipelago'
import { Inked, inkMaterials } from '../ink'
import DotGrid from '../DotGrid'
import Anchor from '../Anchor'
import { groups, type Group } from '../../content'
import { useMag } from '../../store'

const DEPTH = 0.22
const POST = 0.95

function Island({ points }: { points: [number, number][] }) {
  const geometry = useMemo(() => {
    // Shape lives in XY; rotated -90° on X so shape-y becomes world -z (north) and extrusion goes up.
    const shape = new THREE.Shape(points.map(([lon, lat]) => new THREE.Vector2(lon - 122, lat - 12)))
    return new THREE.ExtrudeGeometry(shape, { depth: DEPTH, bevelEnabled: false })
  }, [points])
  return <Inked geometry={geometry} threshold={40} rotation-x={-Math.PI / 2} />
}

const head = new THREE.OctahedronGeometry(0.1, 0)
const headEdges = new THREE.EdgesGeometry(head)
const post = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, POST, 0)])

/** A survey post standing on the island: solid in the people's colour, or an empty outline while the issue is coming. */
function Marker({ group }: { group: Group }) {
  const [x, z] = toWorld(group.lon, group.lat)
  const top = useRef<THREE.Group>(null!)
  const on = useMag((s) => s.hovered === group.slug || s.flyTo === group.slug)
  const setHovered = useMag((s) => s.setHovered)
  const setFlyTo = useMag((s) => s.setFlyTo)
  const fill = useMemo(() => new THREE.MeshBasicMaterial({ color: group.color }), [group.color])

  useFrame(({ clock }, dt) => {
    const s = THREE.MathUtils.damp(top.current.scale.x, on ? 1.7 : 1, 8, dt)
    top.current.scale.setScalar(s)
    top.current.rotation.y = clock.elapsedTime * 0.6
  })

  const hit = {
    onPointerOver: (e: { stopPropagation: () => void }) => { e.stopPropagation(); setHovered(group.slug); document.body.style.cursor = 'pointer' },
    onPointerOut: () => { setHovered(null); document.body.style.cursor = '' },
    onClick: (e: { stopPropagation: () => void }) => { e.stopPropagation(); setFlyTo(group.slug) },
  }

  return (
    <group position={[x, DEPTH, z]}>
      <lineSegments geometry={post} material={inkMaterials.edge} />
      <group ref={top} position-y={POST}>
        {!group.placeholder && <mesh geometry={head} material={fill} />}
        <lineSegments geometry={headEdges} material={group.placeholder ? inkMaterials.soft : inkMaterials.edge} />
      </group>
      <Anchor id={`issue:${group.slug}`} position={[0, POST, 0]} />
      {/* invisible, larger hit area for fingers */}
      <mesh position-y={POST / 2} visible={false} {...hit}>
        <cylinderGeometry args={[0.35, 0.35, POST + 0.4, 8]} />
      </mesh>
    </group>
  )
}

export default function ArchipelagoScene({ dim = false }: { dim?: boolean }) {
  const root = useRef<THREE.Group>(null!)

  useFrame((_, dt) => {
    const s = THREE.MathUtils.damp(root.current.scale.x, dim ? 0.7 : 1, 3, dt)
    root.current.scale.setScalar(s)
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, dim ? -1.2 : 0, 3, dt)
  })

  return (
    <group ref={root}>
      <DotGrid size={44} step={0.5} y={-0.02} />
      {!dim && Object.entries(ISLANDS).map(([name, pts]) => <Island key={name} points={pts} />)}
      {!dim && groups.map((g) => <Marker key={g.slug} group={g} />)}
    </group>
  )
}

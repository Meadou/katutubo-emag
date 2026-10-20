import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { ISLANDS, toWorld } from '../archipelago'
import { createOceanMaterial } from '../shaders/WeavePattern'
import { groups, type Group } from '../../content'
import { useMag } from '../../store'

function Island({ points }: { points: [number, number][] }) {
  const { geometry, outline } = useMemo(() => {
    // Shape lives in XY; rotated -90° on X so shape-y becomes world -z (north) and extrusion goes up.
    const shape = new THREE.Shape(points.map(([lon, lat]) => new THREE.Vector2(lon - 122, lat - 12)))
    const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.18, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 2 })
    const pts = points.map(([lon, lat]) => new THREE.Vector3(lon - 122, lat - 12, 0.25))
    pts.push(pts[0].clone())
    const outline = new THREE.BufferGeometry().setFromPoints(pts)
    return { geometry, outline }
  }, [points])
  return (
    <group rotation-x={-Math.PI / 2}>
      <mesh geometry={geometry} castShadow receiveShadow>
        <meshStandardMaterial color="#1b1726" roughness={0.75} metalness={0.15} />
      </mesh>
      <lineLoop geometry={outline}>
        <lineBasicMaterial color="#d9a441" transparent opacity={0.85} toneMapped={false} />
      </lineLoop>
    </group>
  )
}

function Marker({ group, index }: { group: Group; index: number }) {
  const [x, z] = toWorld(group.lon, group.lat)
  const ring = useRef<THREE.Mesh>(null)
  const beam = useRef<THREE.Mesh>(null!)
  const hovered = useMag((s) => s.hovered === group.slug)
  const setHovered = useMag((s) => s.setHovered)
  const setFlyTo = useMag((s) => s.setFlyTo)
  const color = useMemo(() => new THREE.Color(group.color), [group.color])

  useFrame(({ clock }) => {
    const t = clock.elapsedTime + index * 1.3
    // placeholders ("coming soon") sit quietly: no pulsing ring
    if (ring.current) {
      const s = 1 + ((t * 0.6) % 1) * 2.2
      ring.current.scale.setScalar(s)
      ;(ring.current.material as THREE.MeshBasicMaterial).opacity = 1 - ((t * 0.6) % 1)
    }
    const target = hovered ? 1.6 : 1
    beam.current.scale.y += (target - beam.current.scale.y) * 0.12
  })

  return (
    <group position={[x, 0.3, z]}>
      {!group.placeholder && (
        <mesh rotation-x={-Math.PI / 2} ref={ring}>
          <ringGeometry args={[0.16, 0.2, 48]} />
          <meshBasicMaterial color={color} transparent toneMapped={false} />
        </mesh>
      )}
      <mesh ref={beam} position-y={0.6}>
        <cylinderGeometry args={[0.025, 0.06, 1.2, 12, 1, true]} />
        <meshBasicMaterial color={color} transparent opacity={group.placeholder ? 0.3 : 0.7} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <mesh
        position-y={1.25}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(group.slug); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(null); document.body.style.cursor = '' }}
        onClick={(e) => { e.stopPropagation(); setFlyTo(group.slug) }}
      >
        <sphereGeometry args={[0.13, 24, 24]} />
        <meshBasicMaterial color={color.clone().multiplyScalar(2.2)} toneMapped={false} />
      </mesh>
      {/* invisible, larger hit area for fingers */}
      <mesh position-y={0.8} visible={false}
        onPointerOver={(e) => { e.stopPropagation(); setHovered(group.slug) }}
        onPointerOut={() => setHovered(null)}
        onClick={(e) => { e.stopPropagation(); setFlyTo(group.slug) }}>
        <cylinderGeometry args={[0.45, 0.45, 1.8, 8]} />
      </mesh>
      <Html position={[0, 1.65, 0]} center distanceFactor={9} zIndexRange={[10, 0]} style={{ pointerEvents: 'none' }}>
        <div className={`map-label ${hovered ? 'is-on' : ''}`} style={{ ['--c' as string]: group.color }}>
          <strong>{group.name}</strong>
          <span>{group.placeholder ? 'Coming soon' : group.region}</span>
        </div>
      </Html>
    </group>
  )
}

export default function ArchipelagoScene({ dim = false }: { dim?: boolean }) {
  const root = useRef<THREE.Group>(null!)
  const ocean = useMemo(createOceanMaterial, [])

  useFrame(({ clock }, dt) => {
    ocean.uniforms.uTime.value = clock.elapsedTime
    const target = dim ? 0.55 : 1
    const s = THREE.MathUtils.damp(root.current.scale.x, target, 3, dt)
    root.current.scale.setScalar(s)
    root.current.position.y = THREE.MathUtils.damp(root.current.position.y, dim ? -1.5 : 0, 3, dt)
  })

  return (
    <group ref={root}>
      <mesh rotation-x={-Math.PI / 2} position-y={-0.05} material={ocean}>
        <planeGeometry args={[40, 40]} />
      </mesh>
      {Object.entries(ISLANDS).map(([name, pts]) => <Island key={name} points={pts} />)}
      {!dim && groups.map((g, i) => <Marker key={g.slug} group={g} index={i} />)}
    </group>
  )
}

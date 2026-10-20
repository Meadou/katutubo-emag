import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { ISLAND_GROUP, type IslandGroup } from '../content'
import { ISLANDS } from '../geo/archipelago'
import { journey } from '../worlds/engine'
import { REGIONS } from '../worlds/journeys'
import { MAP_VIEW } from './Pins'
import { useUi } from '../ui/store'

// unseen: the island groups are felt by the pointer, not drawn
const unseen = new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, side: THREE.DoubleSide })

/** One island group's islands as a flat shape just above the paper (x = lon-122, z = -(lat-12)). */
function groupShape(region: IslandGroup) {
  const shapes = Object.entries(ISLANDS)
    .filter(([name]) => ISLAND_GROUP[name] === region)
    .map(([, ring]) => new THREE.Shape(ring.map(([lon, lat]) => new THREE.Vector2(lon - 122, lat - 12))))
  const g = new THREE.ShapeGeometry(shapes)
  g.rotateX(-Math.PI / 2)
  g.translate(0, 0.2, 0)
  return g
}

/**
 * Luzon, the Visayas and Mindanao as invisible hover targets on the map, shaped like the islands
 * themselves. Pointing at one tells the opening view to zoom in on it a little; pins sit above and
 * take the pointer first.
 */
export default function MapHotspots() {
  const setRegion = useUi((u) => u.setHoveredRegion)
  const group = useRef<THREE.Group>(null!)
  const shapes = useMemo(() => REGIONS.map((r) => [r, groupShape(r)] as const), [])
  // like the pins, they belong to the map views: put away when the camera comes down to a place
  useFrame(() => {
    const on = (journey.current?.camera.dist ?? 0) > MAP_VIEW
    group.current.visible = on
    if (!on && useUi.getState().hoveredRegion) setRegion(null)
  })
  return (
    <group ref={group}>
      {shapes.map(([r, geo]) => (
        <mesh key={r} geometry={geo} material={unseen}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => { if (!group.current.visible) return; e.stopPropagation(); setRegion(r) }}
          onPointerOut={() => { if (useUi.getState().hoveredRegion === r) setRegion(null) }} />
      ))}
    </group>
  )
}

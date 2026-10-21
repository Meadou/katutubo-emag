import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../worlds/engine'
import { spots } from '../ui/spots'
import { groundHeight } from './place'
import { toX, toZ } from './paper'

/**
 * Projects the labels of the section being read onto the screen every frame, so the overlay's leader
 * lines touch exactly the place or object they name, however the camera moves.
 */
export default function Anchors() {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    const w = journey.worlds[journey.nearest]
    const labels = w && !w.travel ? w.labels ?? [] : []
    spots.items = labels.map((l) => {
      v.set(toX(l.lon), groundHeight(l.lon, l.lat) + (l.up ?? 0.01), toZ(l.lat)).project(camera)
      return { key: l.key, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, on: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 }
    })
  })
  return null
}

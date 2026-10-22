import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { journey } from '../worlds/engine'
import { spots } from '../ui/spots'
import { placeOn } from './place'

/**
 * Projects the labels and the printed names of the section being read onto the screen every frame,
 * so the overlay's leader lines touch exactly the place or object they name, and a name stays on its
 * place, however the camera moves.
 */
export default function Anchors() {
  const v = useMemo(() => new THREE.Vector3(), [])
  useFrame(({ camera, size }) => {
    const w = journey.worlds[journey.nearest]
    const labels = w && !w.travel ? w.labels ?? [] : []
    const project = (key: string, lon: number, lat: number, up: number) => {
      const at = placeOn(lon, lat)
      v.set(at.x, at.y + up, at.z).project(camera)
      return { key, x: ((v.x + 1) / 2) * size.width, y: ((1 - v.y) / 2) * size.height, on: v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 }
    }
    spots.items = labels.map((l) => project(l.key, l.lon, l.lat, l.up ?? 0.01))
    // names lie on the paper: a little above it, so a lifted piece carries its name with it
    spots.names = (w && !w.travel ? w.names ?? [] : []).map((n) => project(n.key, n.lon, n.lat, 0.02))
  })
  return null
}

import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { paperMaterial } from '../paper'
import { journey } from '../../worlds/engine'
import { DESIGNS } from '../../worlds/issues'
import type { PropProps } from './registry'

/**
 * Procedural stand-ins, cut from paper and standing still. A real model can replace any of them via
 * fromFactory. They are drawn at map scale: about a quarter of the view at a chapter's distance.
 */
const S = 0.12

/** Which gongs the people being read play, by their Music demo: flat (Ifugao gangsa) or bossed (T'boli klintang). */
const bossedHere = () => {
  const music = DESIGNS[journey.current?.people ?? '']?.demos.music
  return music?.kind === 'gongs' && music.gong === 'bossed'
}

/** A row of gongs hanging from a beam: flat discs for flat gongs, a raised knob for bossed gongs. */
export function GongStand(_: PropProps) {
  const flat = useRef<THREE.Group>(null!)
  const bossed = useRef<THREE.Group>(null!)
  const g = useMemo(() => ({
    disc: new THREE.CylinderGeometry(S * 0.5, S * 0.5, S * 0.06, 24).rotateX(Math.PI / 2),
    boss: new THREE.SphereGeometry(S * 0.14, 12, 8).scale(1, 1, 0.6),
    post: new THREE.BoxGeometry(S * 0.08, S * 1.6, S * 0.08),
    beam: new THREE.BoxGeometry(S * 3.4, S * 0.08, S * 0.08),
  }), [])
  const wood = useMemo(() => paperMaterial('#6b4a2b'), [])
  const metal = useMemo(() => paperMaterial('#b5874a'), [])
  // the stand never moves; only which set of gongs hangs from it follows the people
  useFrame(() => {
    const b = bossedHere()
    flat.current.visible = !b
    bossed.current.visible = b
  })
  const row = (n: number, gap: number, knob: boolean) => Array.from({ length: n }, (_, i) => (
    <group key={i} position={[(i - (n - 1) / 2) * S * gap, S * 1.0, 0]}>
      <mesh geometry={g.disc} material={metal} castShadow />
      {knob && <mesh geometry={g.boss} material={metal} position-z={S * 0.04} />}
    </group>
  ))
  return (
    <group>
      {[-1.6, 1.6].map((x) => <mesh key={x} geometry={g.post} material={wood} position={[x * S, S * 0.8, 0]} castShadow />)}
      <mesh geometry={g.beam} material={wood} position={[0, S * 1.6, 0]} castShadow />
      <group ref={flat}>{row(4, 0.78, false)}</group>
      <group ref={bossed} visible={false}>{row(5, 0.62, true)}</group>
    </group>
  )
}

/** A backstrap loom laid out: two beams and the warp between them. Structure only, no design. */
export function LoomFrame(_: PropProps) {
  const g = useMemo(() => {
    const warp: THREE.Vector3[] = []
    for (let i = 0; i <= 16; i++) { const x = (-1 + i / 8) * S; warp.push(new THREE.Vector3(x, S * 0.1, -S * 1.4), new THREE.Vector3(x, S * 0.1, S * 1.4)) }
    return { beam: new THREE.CylinderGeometry(S * 0.07, S * 0.07, S * 2.3, 8).rotateZ(Math.PI / 2), warp: new THREE.BufferGeometry().setFromPoints(warp), cloth: new THREE.BoxGeometry(S * 2, S * 0.02, S * 1.1) }
  }, [])
  const wood = useMemo(() => paperMaterial('#6b4a2b'), [])
  const thread = useMemo(() => new THREE.LineBasicMaterial({ color: '#e8dcc4' }), [])
  const cloth = useMemo(() => paperMaterial('#8e5a3a'), [])
  return (
    <group>
      <mesh geometry={g.beam} material={wood} position={[0, S * 0.1, -S * 1.45]} castShadow />
      <mesh geometry={g.beam} material={wood} position={[0, S * 0.1, S * 1.45]} castShadow />
      <lineSegments geometry={g.warp} material={thread} />
      <mesh geometry={g.cloth} material={cloth} position={[0, S * 0.1, S * 0.85]} castShadow />
    </group>
  )
}

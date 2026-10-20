import { useMemo } from 'react'
import * as THREE from 'three'
import { paperMaterial } from '../paper'
import { place } from '../place'
import type { PropProps } from './registry'

/** Procedural stand-ins, cut from paper and standing still. A real model can replace any of them via fromFactory. */
const S = 0.02

/** A row of gongs hanging from a beam: flat discs for flat gongs, a raised knob for bossed gongs. */
export function GongStand(_: PropProps) {
  const g = useMemo(() => {
    const bossed = place.gong === 'bossed'
    const disc = new THREE.CylinderGeometry(S * 0.5, S * 0.5, S * 0.06, 24).rotateX(Math.PI / 2)
    const boss = new THREE.SphereGeometry(S * 0.14, 12, 8).scale(1, 1, 0.6)
    return { disc, boss, bossed, post: new THREE.BoxGeometry(S * 0.08, S * 1.6, S * 0.08), beam: new THREE.BoxGeometry(S * 3.4, S * 0.08, S * 0.08) }
  }, [])
  const wood = useMemo(() => paperMaterial('#6b4a2b'), [])
  const metal = useMemo(() => paperMaterial('#b5874a'), [])
  const n = g.bossed ? 5 : 4
  return (
    <group>
      {[-1.6, 1.6].map((x) => <mesh key={x} geometry={g.post} material={wood} position={[x * S, S * 0.8, 0]} castShadow />)}
      <mesh geometry={g.beam} material={wood} position={[0, S * 1.6, 0]} castShadow />
      {Array.from({ length: n }, (_, i) => {
        const x = (i - (n - 1) / 2) * S * (g.bossed ? 0.62 : 0.78)
        return (
          <group key={i} position={[x, S * 1.0, 0]}>
            <mesh geometry={g.disc} material={metal} castShadow />
            {g.bossed && <mesh geometry={g.boss} material={metal} position-z={S * 0.04} />}
          </group>
        )
      })}
    </group>
  )
}

/** A stand of bamboo: a few tall paper tubes with nodes. */
export function BambooGrove(_: PropProps) {
  const tube = useMemo(() => new THREE.CylinderGeometry(S * 0.09, S * 0.1, S * 3, 8).translate(0, S * 1.5, 0), [])
  const node = useMemo(() => new THREE.TorusGeometry(S * 0.1, S * 0.02, 4, 10).rotateX(Math.PI / 2), [])
  const green = useMemo(() => paperMaterial('#8a9a4a'), [])
  const dark = useMemo(() => paperMaterial('#5d6b31'), [])
  const stalks = [[0, 0], [0.5, 0.3], [-0.45, 0.2], [0.2, -0.45], [-0.25, -0.35], [0.7, -0.15]]
  return (
    <group>
      {stalks.map(([x, z], i) => (
        <group key={i} position={[x * S, 0, z * S]} rotation={[0.04 * (i % 3 - 1), 0, 0.05 * ((i % 2) * 2 - 1)]} scale={[1, 0.8 + (i % 3) * 0.15, 1]}>
          <mesh geometry={tube} material={green} castShadow />
          {[0.8, 1.6, 2.4].map((h) => <mesh key={h} geometry={node} material={dark} position-y={h * S} />)}
        </group>
      ))}
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

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { paperMaterial } from '../paper'
import { journey } from '../../worlds/engine'
import { DESIGNS } from '../../worlds/issues'
import { PITCHES, onStrike, strike, type GongKind } from '../../audio/patterns'
import type { PropProps } from './registry'

/**
 * Procedural stand-ins, cut from paper and standing still. A real model can replace any of them via
 * fromFactory. They are drawn at map scale: about a quarter of the view at a chapter's distance.
 */
const S = 0.12

/** Which gongs the people being read play, by their Music demo: flat (Ifugao gangsa) or bossed (T'boli klintang). */
const kindHere = (): GongKind => {
  const music = DESIGNS[journey.current?.people ?? '']?.demos.music
  return music?.kind === 'gongs' ? music.gong : 'flat'
}

/** Only an object the reader can see may be played: every parent up the scene must be showing. */
const showing = (o: THREE.Object3D | null) => { for (let p = o; p; p = p.parent) if (!p.visible) return false; return true }
const pointer = (on: boolean) => { document.body.style.cursor = on ? 'pointer' : '' }

const METAL = new THREE.Color('#b5874a')
const GLOW = new THREE.Color('#6a4410')

/**
 * A row of gongs hanging from a beam: flat discs for flat gongs, a raised knob for bossed gongs. Tap a
 * gong to strike it (synthesized, as its label says); a struck gong brightens for a moment. The stand
 * itself never moves.
 */
export function GongStand(_: PropProps) {
  const flatRow = useRef<THREE.Group>(null!)
  const bossedRow = useRef<THREE.Group>(null!)
  const g = useMemo(() => ({
    disc: new THREE.CylinderGeometry(S * 0.5, S * 0.5, S * 0.06, 24).rotateX(Math.PI / 2),
    boss: new THREE.SphereGeometry(S * 0.14, 12, 8).scale(1, 1, 0.6),
    post: new THREE.BoxGeometry(S * 0.08, S * 1.6, S * 0.08),
    beam: new THREE.BoxGeometry(S * 3.4, S * 0.08, S * 0.08),
  }), [])
  const wood = useMemo(() => paperMaterial('#6b4a2b'), [])
  // one material per gong, so each can brighten on its own
  const metals = useMemo(() => ({
    flat: PITCHES.flat.map(() => paperMaterial('#b5874a')),
    bossed: PITCHES.bossed.map(() => paperMaterial('#b5874a')),
  }), [])
  const glow = useRef<Record<GongKind, number[]>>({ flat: PITCHES.flat.map(() => 0), bossed: PITCHES.bossed.map(() => 0) })
  useEffect(() => onStrike((kind, i) => { glow.current[kind][i] = 1 }), [])
  useEffect(() => () => pointer(false), [])

  useFrame((_, dt) => {
    const bossed = kindHere() === 'bossed'
    flatRow.current.visible = !bossed
    bossedRow.current.visible = bossed
    for (const kind of ['flat', 'bossed'] as const) {
      glow.current[kind].forEach((v, i) => {
        const next = Math.max(0, v - dt * 2.5)
        glow.current[kind][i] = next
        metals[kind][i].emissive.copy(GLOW).multiplyScalar(next)
        metals[kind][i].color.copy(METAL)
      })
    }
  })

  const hit = (kind: GongKind, i: number) => (e: ThreeEvent<MouseEvent>) => {
    if (!showing(e.object)) return
    e.stopPropagation()
    strike(kind, i)
  }
  const over = (e: ThreeEvent<PointerEvent>) => { if (showing(e.object)) { e.stopPropagation(); pointer(true) } }
  const out = () => pointer(false)

  const row = (kind: GongKind, gap: number) => PITCHES[kind].map((_, i) => (
    <group key={i} position={[(i - (PITCHES[kind].length - 1) / 2) * S * gap, S * 1.0, 0]}>
      <mesh geometry={g.disc} material={metals[kind][i]} castShadow onClick={hit(kind, i)} onPointerOver={over} onPointerOut={out} />
      {kind === 'bossed' && <mesh geometry={g.boss} material={metals[kind][i]} position-z={S * 0.04} onClick={hit(kind, i)} />}
    </group>
  ))
  return (
    <group>
      {[-1.6, 1.6].map((x) => <mesh key={x} geometry={g.post} material={wood} position={[x * S, S * 0.8, 0]} castShadow />)}
      <mesh geometry={g.beam} material={wood} position={[0, S * 1.6, 0]} castShadow />
      <group ref={flatRow}>{row('flat', 0.78)}</group>
      <group ref={bossedRow} visible={false}>{row('bossed', 0.62)}</group>
    </group>
  )
}

/** How many rows of cloth the loom weaves across its section. */
const ROWS = 12

/**
 * A backstrap loom laid out: two beams and the warp between them. As the chapter is read, the cloth
 * weaves itself row by row, in the colours the chapter names. Structure only, no design.
 */
export function LoomFrame(_: PropProps) {
  const g = useMemo(() => {
    const warp: THREE.Vector3[] = []
    for (let i = 0; i <= 16; i++) { const x = (-1 + i / 8) * S; warp.push(new THREE.Vector3(x, S * 0.1, -S * 1.4), new THREE.Vector3(x, S * 0.1, S * 1.4)) }
    return {
      beam: new THREE.CylinderGeometry(S * 0.07, S * 0.07, S * 2.3, 8).rotateZ(Math.PI / 2),
      warp: new THREE.BufferGeometry().setFromPoints(warp),
      // one row of weft: it grows across the warp from one side, as if passed through by hand
      row: new THREE.BoxGeometry(S * 2, S * 0.02, S * 0.17).translate(S, 0, 0),
    }
  }, [])
  const wood = useMemo(() => paperMaterial('#6b4a2b'), [])
  const thread = useMemo(() => new THREE.LineBasicMaterial({ color: '#e8dcc4' }), [])
  const cloth = useMemo(() => Array.from({ length: ROWS }, () => paperMaterial('#8e5a3a')), [])
  const rows = useRef<(THREE.Mesh | null)[]>([])

  useFrame(() => {
    const crafts = DESIGNS[journey.current?.people ?? '']?.demos.crafts
    const colours = crafts?.kind === 'weave' ? crafts.colors : ['#8e5a3a', '#e8dcc4']
    const p = journey.calm ? 1 : journey.progress[journey.nearest] ?? 1
    rows.current.forEach((m, i) => {
      if (!m) return
      // the weave runs from the start of the section to near its end, one row after another
      const k = Math.min(1, Math.max(0, (p * 1.15 - 0.05 - i / ROWS) * ROWS))
      m.visible = k > 0.001
      m.scale.x = Math.max(0.001, k)
      cloth[i].color.set(colours[i % colours.length])
    })
  })

  return (
    <group>
      <mesh geometry={g.beam} material={wood} position={[0, S * 0.1, -S * 1.45]} castShadow />
      <mesh geometry={g.beam} material={wood} position={[0, S * 0.1, S * 1.45]} castShadow />
      <lineSegments geometry={g.warp} material={thread} />
      {cloth.map((m, i) => (
        <mesh key={i} ref={(el) => { rows.current[i] = el }} geometry={g.row} material={m}
          position={[-S, S * 0.11, S * 1.3 - (i + 0.5) * ((S * 2.6) / ROWS)]} castShadow />
      ))}
    </group>
  )
}

import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { stone } from '../figures/Statue'
import { gong, pluck, twang } from '../../audio/synth'
import { PALETTE } from '../palette'
import type { InstrumentKind } from '../stageSpec'

/** Bumped every time an instrument sounds, so the figure playing it can answer with a gesture. */
export const hits: Record<InstrumentKind, { current: number }> = { agung: { current: 0 }, kuglung: { current: 0 }, saluray: { current: 0 }, kubing: { current: 0 } }

/** A sounding part lights in brass for a moment, then settles back into stone. */
function useFlash() {
  const mat = useMemo(() => stone.clone(), [])
  const brass = useMemo(() => new THREE.Color(PALETTE.brass), [])
  const base = useMemo(() => new THREE.Color(PALETTE.stone), [])
  const level = useRef(0)
  useFrame((_, dt) => {
    level.current = Math.max(0, level.current - dt * 1.6)
    mat.color.lerpColors(base, brass, level.current)
    mat.emissive.copy(brass).multiplyScalar(level.current * 0.25)
  })
  return { mat, flash: () => { level.current = 1 } }
}

const pointer = (on: boolean) => () => { document.body.style.cursor = on ? 'pointer' : '' }
const stop = (e: ThreeEvent<PointerEvent | MouseEvent>) => e.stopPropagation()

/** A gong to strike: lathe profile with a raised boss, hung from the frame by a cord. */
function HangingGong({ x, hz, radius }: { x: number; hz: number; radius: number }) {
  const geo = useMemo(() => {
    const p = [[0, 0.32], [0.16, 0.3], [0.22, 0.2], [0.24, 0.12], [0.86, 0.1], [0.98, 0.04], [1, -0.16], [0.9, -0.2], [0.84, -0.04], [0, -0.04]]
    return new THREE.LatheGeometry(p.map(([a, b]) => new THREE.Vector2(a * radius, b * radius)), 32).rotateX(Math.PI / 2)
  }, [radius])
  const swing = useRef<THREE.Group>(null!)
  const s = useMemo(() => ({ v: 0, a: 0 }), [])
  const { mat, flash } = useFlash()
  const timer = useRef(0)

  useFrame((_, dt) => {
    s.v += -s.a * 40 * dt - s.v * 1.6 * dt
    s.a += s.v * dt
    swing.current.rotation.x = s.a
  })
  const strike = () => { gong(hz); flash(); s.v += 2.2; hits.agung.current++ }
  const hold = () => {
    strike()
    let n = 0
    timer.current = window.setInterval(() => { n++; if (n % 2 === 0 || n % 5 === 0) strike() }, 260)
  }
  const release = () => clearInterval(timer.current)

  return (
    <group position={[x, 0.92, 0]}>
      <group ref={swing}>
        <mesh geometry={geo} material={mat} position-y={-radius - 0.08}
          onPointerDown={(e) => { stop(e); hold() }} onPointerUp={release} onPointerLeave={() => { release(); pointer(false)() }}
          onPointerOver={pointer(true)} />
        <mesh material={stone} position-y={-0.04}>
          <cylinderGeometry args={[0.006, 0.006, 0.08, 4]} />
        </mesh>
      </group>
    </group>
  )
}

/** A row of agung on a wooden frame. Click to strike; hold to keep an interlocking rhythm going. */
export function Agung() {
  return (
    <group>
      {[-0.62, 0.62].map((x) => (
        <mesh key={x} material={stone} position={[x, 0.5, 0]}><boxGeometry args={[0.05, 1, 0.05]} /></mesh>
      ))}
      <mesh material={stone} position-y={0.96}><boxGeometry args={[1.38, 0.05, 0.06]} /></mesh>
      <HangingGong x={-0.32} hz={118} radius={0.27} />
      <HangingGong x={0.3} hz={142} radius={0.24} />
    </group>
  )
}

/** An anhemitonic (gapped, five-note) scale, the kind used in kuglung and saluray duets. Pitches are illustrative. */
const SCALE = [147, 165, 196, 220, 247, 294]

/**
 * Kuglung, the two-string boat lute: carved from one log, a box-shaped body tapering into a long neck
 * with a hooked head. The melody string is fretted, so where you pluck along it picks the note;
 * the second string is the drone.
 */
export function Kuglung() {
  const geo = useMemo(() => ({
    body: new THREE.BoxGeometry(0.42, 0.14, 0.08).translate(-0.33, 0, 0),
    waist: new THREE.CylinderGeometry(0.04, 0.065, 0.12, 8).rotateZ(Math.PI / 2).translate(-0.07, 0, 0),
    neck: new THREE.BoxGeometry(0.62, 0.05, 0.05).translate(0.3, 0, 0),
    head: new THREE.TorusGeometry(0.05, 0.016, 6, 12, Math.PI * 1.2).translate(0.64, 0.04, 0),
    fret: new THREE.BoxGeometry(0.012, 0.018, 0.02),
  }), [])
  const melody = useFlash()
  const drone = useFlash()
  const local = useMemo(() => new THREE.Vector3(), [])
  return (
    <group position-y={0.3} rotation-z={0.18}>
      <mesh geometry={geo.body} material={stone} />
      <mesh geometry={geo.waist} material={stone} />
      <mesh geometry={geo.neck} material={stone} />
      <mesh geometry={geo.head} material={stone} />
      {[0.04, 0.12, 0.2, 0.28, 0.36, 0.44].map((x) => <mesh key={x} geometry={geo.fret} material={stone} position={[x, 0.03, 0.012]} />)}
      {/* melody string, fretted: the pluck position picks the note */}
      <group position={[0.02, 0.04, 0.012]}>
        <mesh material={melody.mat} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.0035, 0.0035, 1.0, 4]} /></mesh>
        <mesh visible={false}
          onPointerDown={(e) => {
            stop(e)
            local.copy(e.point)
            e.object.worldToLocal(local)
            const k = Math.round(THREE.MathUtils.clamp(local.x + 0.5, 0, 1) * (SCALE.length - 1))
            pluck(SCALE[SCALE.length - 1 - k]); melody.flash(); hits.kuglung.current++
          }}
          onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
          <boxGeometry args={[1.0, 0.05, 0.04]} />
        </mesh>
      </group>
      {/* drone string */}
      <group position={[0.02, 0.04, -0.012]}>
        <mesh material={drone.mat} rotation-z={Math.PI / 2}><cylinderGeometry args={[0.0035, 0.0035, 1.0, 4]} /></mesh>
        <mesh visible={false}
          onPointerDown={(e) => { stop(e); pluck(110); drone.flash(); hits.kuglung.current++ }}
          onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
          <boxGeometry args={[1.0, 0.05, 0.03]} />
        </mesh>
      </group>
    </group>
  )
}

/**
 * Saluray, the bamboo tube zither: strings cut from the bamboo's own skin and lifted on small wedges,
 * plucked with the fingers of both hands. Each of the five strips sounds its own note.
 */
export function Saluray() {
  const tube = useMemo(() => new THREE.CylinderGeometry(0.075, 0.075, 0.7, 18).rotateZ(Math.PI / 2), [])
  const flashes = [useFlash(), useFlash(), useFlash(), useFlash(), useFlash()]
  return (
    <group position-y={0.22} rotation-y={0.2}>
      <mesh geometry={tube} material={stone} />
      {flashes.map((f, i) => {
        const a = -0.9 + i * 0.45
        return (
          <group key={i} position={[0, Math.cos(a) * 0.081, Math.sin(a) * 0.081]} rotation-x={a}>
            <mesh material={f.mat} rotation-z={Math.PI / 2}><boxGeometry args={[0.008, 0.6, 0.004]} /></mesh>
            <mesh visible={false} rotation-z={Math.PI / 2}
              onPointerDown={(e) => { stop(e); pluck(SCALE[i] * 2, 0.8); f.flash(); hits.saluray.current++ }}
              onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
              <boxGeometry args={[0.04, 0.62, 0.03]} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

/** A bamboo jaw harp held at a small stand. Click to set its tongue buzzing. */
export function Kubing() {
  const { mat, flash } = useFlash()
  return (
    <group position-y={0.4}>
      <mesh material={mat} rotation-z={Math.PI / 2}
        onPointerDown={(e) => { stop(e); twang(98); flash(); hits.kubing.current++ }}
        onPointerOver={pointer(true)} onPointerOut={pointer(false)}>
        <boxGeometry args={[0.07, 0.5, 0.02]} />
      </mesh>
      <mesh material={stone} position-y={-0.2}><boxGeometry args={[0.04, 0.4, 0.04]} /></mesh>
    </group>
  )
}

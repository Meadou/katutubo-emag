import { useMemo, useRef, type ReactNode } from 'react'
import { useFrame, type ThreeElements } from '@react-three/fiber'
import { Billboard, Text } from '@react-three/drei'
import * as THREE from 'three'
import Statue from '../figures/Statue'
import { Agung, Kubing, Kuglung, Saluray, hits } from './instruments'
import { groundAt } from '../terrain/heightfield'
import { PALETTE } from '../palette'
import { useMag } from '../../store'
import type { FigureSpec, InstrumentSpec, StageSpec } from '../stageSpec'

/** Height of a figure on the map. Everything a story places is sized against it. */
export const FIGURE = 0.045
const world = (lon: number, lat: number): [number, number, number] => [lon - 122, 0, -(lat - 12)]
/** ground height at a world x/z (the finer terrain may load after a step does, so this is read every frame) */
const ground = (x: number, z: number) => groundAt(x + 122, 12 - z)

/** Stands its children on the terrain at a longitude/latitude, tracking the ground as terrain loads. */
function Grounded({ lon, lat, children, ...props }: { lon: number; lat: number; children: ReactNode } & ThreeElements['group']) {
  const ref = useRef<THREE.Group>(null!)
  useFrame(() => { ref.current.position.set(lon - 122, groundAt(lon, lat), -(lat - 12)) })
  return <group ref={ref} {...props}>{children}</group>
}

function Figure({ f }: { f: FigureSpec }) {
  return <Statue pose={f.pose} position={world(f.lon, f.lat)} ground={ground} facing={f.facing ?? 0} height={FIGURE * (f.size ?? 1)} wrap={f.wrap} mallet={f.mallet}
    hitRef={f.plays ? hits[f.plays] : undefined} seed={f.lon * 31} speed={0.035} />
}

function Instrument({ i }: { i: InstrumentSpec }) {
  const Comp = { agung: Agung, kuglung: Kuglung, saluray: Saluray, kubing: Kubing }[i.kind]
  return (
    <Grounded lon={i.lon} lat={i.lat} rotation-y={i.facing ?? 0} scale={FIGURE}>
      <Comp />
    </Grounded>
  )
}

/** A sacred presence, shown only as a soft column of light standing on the land. */
function Presence({ lon, lat, rise }: { lon: number; lat: number; rise?: boolean }) {
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ color: PALETTE.stone, transparent: true, opacity: 0.12, depthWrite: false, side: THREE.DoubleSide }), [])
  const ref = useRef<THREE.Mesh>(null!)
  const lift = useRef(0)
  useFrame(({ clock }, dt) => {
    mat.opacity = 0.1 + Math.sin(clock.elapsedTime * 0.8) * 0.04
    // rising: the column lifts slowly off the land and thins as it goes
    lift.current = rise ? Math.min(lift.current + dt * FIGURE * 0.35, FIGURE * 6) : 0
    ref.current.position.y = FIGURE * 2 + lift.current
    ref.current.scale.x = ref.current.scale.z = 1 - (lift.current / (FIGURE * 6)) * 0.6
  })
  return (
    <Grounded lon={lon} lat={lat}>
      <mesh ref={ref} material={mat} position-y={FIGURE * 2}>
        <cylinderGeometry args={[FIGURE * 0.35, FIGURE * 0.6, FIGURE * 4, 32, 1, true]} />
      </mesh>
      <pointLight color={PALETTE.stone} intensity={0.02} distance={FIGURE * 8} position-y={FIGURE} />
    </Grounded>
  )
}

/** Short words that drift slowly around the scene, always turned toward the reader. */
function Cards({ words, center }: { words: string[]; center: { lon: number; lat: number } }) {
  const ring = useRef<THREE.Group>(null!)
  useFrame(({ clock }) => { ring.current.rotation.y = clock.elapsedTime * 0.05 })
  const r = FIGURE * 3.4
  return (
    <Grounded lon={center.lon} lat={center.lat}>
      <group ref={ring}>
        {words.map((w, i) => {
          const a = (i / words.length) * Math.PI * 2
          return (
            <Billboard key={w} position={[Math.cos(a) * r, FIGURE * (1.9 + (i % 2) * 0.5), Math.sin(a) * r]}>
              <Text font={`${import.meta.env.BASE_URL}fonts/RedHatDisplay.ttf`} fontSize={FIGURE * 0.22} color={PALETTE.stone} anchorX="center" anchorY="middle" maxWidth={FIGURE * 3}>
                {w}
              </Text>
            </Billboard>
          )
        })}
      </group>
    </Grounded>
  )
}

export default function StoryStage() {
  const stage = useMag((s) => s.stage) as StageSpec | null
  if (!stage) return null
  return (
    <group>
      {stage.figures.map((f) => <Figure key={f.id} f={f} />)}
      {stage.instruments.map((i) => <Instrument key={`${i.kind}-${i.lon}-${i.lat}`} i={i} />)}
      {stage.light && <Presence {...stage.light} />}
      {stage.cards.length > 0 && <Cards words={stage.cards} center={stage.center} />}
    </group>
  )
}

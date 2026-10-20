import { useMemo, useRef, type MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PALETTE } from '../palette'
import type { PoseName } from '../stageSpec'

/**
 * A sculpted, faceless figure in one matte stone, like a statue standing on the map. Deliberately no
 * costume or ornament: the figures stand for people without inventing what they wear.
 * Poses are joint angles over time; the figure blends toward whichever pose it is given.
 */
export type Pose = PoseName

export const stone = new THREE.MeshStandardMaterial({ color: PALETTE.stone, roughness: 0.82, metalness: 0 })

const lathe = (pts: [number, number][], seg = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg)
const capsule = (r: number, len: number) => new THREE.CapsuleGeometry(r, len, 4, 10).translate(0, -len / 2 - r, 0)

/** Shared geometry, in a figure one unit tall (feet at y = 0). */
const G = {
  torso: lathe([[0.001, 0], [0.105, 0.005], [0.095, 0.1], [0.085, 0.16], [0.112, 0.25], [0.105, 0.29], [0.05, 0.315], [0.001, 0.32]]),
  wrap: lathe([[0.001, 0], [0.135, -0.005], [0.12, 0.11], [0.098, 0.2], [0.001, 0.205]]),
  head: new THREE.SphereGeometry(0.062, 18, 14).scale(0.92, 1.12, 1),
  neck: new THREE.CylinderGeometry(0.028, 0.032, 0.06, 10),
  thigh: capsule(0.052, 0.17),
  shin: capsule(0.043, 0.17),
  foot: new THREE.BoxGeometry(0.06, 0.035, 0.12).translate(0, -0.0175, 0.03),
  upper: capsule(0.034, 0.13),
  fore: capsule(0.029, 0.12),
  hand: new THREE.SphereGeometry(0.03, 10, 8).scale(0.8, 1.15, 0.6),
  mallet: new THREE.CylinderGeometry(0.008, 0.008, 0.2, 6).rotateX(Math.PI / 2).translate(0, -0.02, 0.09),
  malletHead: new THREE.SphereGeometry(0.025, 10, 8).translate(0, -0.02, 0.19),
}

type Joint = 'hips' | 'spine' | 'head' | 'lUpper' | 'lFore' | 'rUpper' | 'rFore' | 'lThigh' | 'lShin' | 'rThigh' | 'rShin'
type Angles = Partial<Record<Joint, [number, number, number]>> & { drop?: number }

/** Joint angles (x = swing forward/back, z = out to the side) for pose `p` at time t. */
function poseAt(p: Pose, t: number, hit: number): Angles {
  const s = Math.sin, breath = s(t * 1.6) * 0.02
  switch (p) {
    case 'walk': {
      const w = t * 7, a = s(w) * 0.55
      return {
        lThigh: [-a, 0, 0], rThigh: [a, 0, 0],
        lShin: [Math.max(0, s(w + 1.6)) * 0.9, 0, 0], rShin: [Math.max(0, -s(w + 1.6)) * 0.9, 0, 0],
        lUpper: [a * 0.7, 0, 0.08], rUpper: [-a * 0.7, 0, -0.08], lFore: [-0.35, 0, 0], rFore: [-0.35, 0, 0],
        spine: [0.06, 0, 0], drop: Math.abs(s(w)) * 0.018,
      }
    }
    case 'strike': {
      // the right arm draws back and swings the mallet forward; `hit` (0..1) is a fresh strike
      const sw = -1.1 - hit * 0.9 + s(t * 2) * 0.05
      return { rUpper: [sw, 0, -0.25], rFore: [-0.9 + hit * 0.6, 0, 0], lUpper: [-0.25, 0, 0.18], lFore: [-0.6, 0, 0], spine: [0.08 + hit * 0.06, 0, 0] }
    }
    case 'pluck':
      return {
        lUpper: [-0.7, 0, 0.5], lFore: [-1.3, 0, 0], rUpper: [-0.5, 0, -0.4], rFore: [-1.5 + hit * 0.4 + s(t * 9) * 0.04, 0, 0],
        lThigh: [-1.5, 0, 0.12], rThigh: [-1.5, 0, -0.12], lShin: [1.5, 0, 0], rShin: [1.5, 0, 0], drop: 0.27, spine: [0.1, 0, 0],
      }
    case 'harp':
      return { lUpper: [-1.2, 0, 0.35], lFore: [-2.0, 0, 0], rUpper: [-0.9, 0, -0.3], rFore: [-1.7 + hit * 0.5 + s(t * 14) * 0.05, 0, 0], head: [-0.05, 0, 0] }
    case 'kneel':
      return { lThigh: [-1.4, 0, 0.05], lShin: [1.4, 0, 0], rThigh: [0.15, 0, 0], rShin: [1.65, 0, 0], drop: 0.22, lUpper: [-0.3, 0, 0.1], rUpper: [-0.3, 0, -0.1], lFore: [-0.8, 0, 0], rFore: [-0.8, 0, 0], spine: [0.15, 0, 0] }
    case 'sit':
      return { lThigh: [-1.55, 0, 0.18], rThigh: [-1.55, 0, -0.18], lShin: [1.55, 0, 0], rShin: [1.55, 0, 0], drop: 0.28, lUpper: [-0.4, 0, 0.12], rUpper: [-0.4, 0, -0.12], lFore: [-0.7, 0, 0], rFore: [-0.7, 0, 0] }
    case 'raise':
      return { rUpper: [-2.8 + s(t * 1.2) * 0.05, 0, -0.15], rFore: [-0.2, 0, 0], lUpper: [0.1, 0, 0.12], spine: [-0.05, 0, 0], head: [-0.2, 0, 0] }
    case 'listen':
      return { head: [0.18, 0.3, 0], lUpper: [0.05, 0, 0.1], rUpper: [0.05, 0, -0.1], lFore: [-0.2, 0, 0], rFore: [-0.2, 0, 0], spine: [0.04 + breath, 0, 0] }
    default:
      return { lUpper: [0.04, 0, 0.1], rUpper: [0.04, 0, -0.1], lFore: [-0.15, 0, 0], rFore: [-0.15, 0, 0], spine: [breath, 0, 0] }
  }
}

export interface StatueProps {
  pose: Pose
  /** world position of the feet; when it changes, the figure walks there */
  position: [number, number, number]
  /** yaw in radians when standing still */
  facing?: number
  /** world-space height of the figure */
  height?: number
  wrap?: boolean
  mallet?: boolean
  /** increment to trigger one strike or pluck gesture */
  hitRef?: MutableRefObject<number>
  /** world units per second while walking */
  speed?: number
  /** phase offset so a group does not move in lockstep */
  seed?: number
  /** ground height at a world x/z; when given, the feet follow the terrain as it loads and as they walk */
  ground?: (x: number, z: number) => number
}

export default function Statue({ pose, position, facing = 0, height = 0.045, wrap = false, mallet = false, hitRef, speed = 0.05, seed = 0, ground }: StatueProps) {
  const root = useRef<THREE.Group>(null!)
  const j = useRef<Partial<Record<Joint, THREE.Group>>>({})
  const body = useRef<THREE.Group>(null!)
  const state = useMemo(() => ({ pos: new THREE.Vector3(...position), yaw: facing, hit: 0, lastHit: hitRef?.current ?? 0, init: false }), [])
  const goal = useMemo(() => new THREE.Vector3(), [])

  useFrame(({ clock }, dt) => {
    const t = clock.elapsedTime + seed * 1.7
    goal.set(...position)
    if (ground) goal.y = ground(goal.x, goal.z)
    if (!state.init) { state.pos.copy(goal); state.init = true }
    const d = goal.clone().sub(state.pos)
    d.y = 0
    const dist = d.length()
    const moving = dist > height * 0.05
    if (moving) {
      const step = Math.min(dist, speed * dt)
      state.pos.addScaledVector(d.normalize(), step)
      state.yaw = THREE.MathUtils.damp(state.yaw, Math.atan2(d.x, d.z), 8, dt)
    } else {
      state.yaw = THREE.MathUtils.damp(state.yaw, facing, 4, dt)
    }
    state.pos.y = ground ? ground(state.pos.x, state.pos.z) : THREE.MathUtils.damp(state.pos.y, goal.y, 10, dt)
    root.current.position.copy(state.pos)
    root.current.rotation.y = state.yaw

    if (hitRef && hitRef.current !== state.lastHit) { state.lastHit = hitRef.current; state.hit = 1 }
    state.hit = Math.max(0, state.hit - dt * 3.5)

    const a = poseAt(moving ? 'walk' : pose, t, state.hit)
    for (const k of Object.keys(j.current) as Joint[]) {
      const g = j.current[k]!
      const [x, y, z] = a[k] ?? [0, 0, 0]
      g.rotation.x = THREE.MathUtils.damp(g.rotation.x, x, 10, dt)
      g.rotation.y = THREE.MathUtils.damp(g.rotation.y, y, 10, dt)
      g.rotation.z = THREE.MathUtils.damp(g.rotation.z, z, 10, dt)
    }
    body.current.position.y = THREE.MathUtils.damp(body.current.position.y, -(a.drop ?? 0), 10, dt)
  })

  const set = (k: Joint) => (el: THREE.Group | null) => { if (el) j.current[k] = el }
  const m = stone

  return (
    <group ref={root} scale={height}>
      <group ref={body}>
        <group ref={set('hips')} position-y={0.47}>
          {/* legs */}
          {(['l', 'r'] as const).map((side) => (
            <group key={side} ref={set(`${side}Thigh` as Joint)} position-x={side === 'l' ? 0.058 : -0.058}>
              <mesh geometry={G.thigh} material={m} />
              <group ref={set(`${side}Shin` as Joint)} position-y={-0.24}>
                <mesh geometry={G.shin} material={m} />
                <mesh geometry={G.foot} material={m} position-y={-0.215} />
              </group>
            </group>
          ))}
          {wrap && <mesh geometry={G.wrap} material={m} position-y={-0.2} />}
          <group ref={set('spine')}>
            <mesh geometry={G.torso} material={m} />
            <mesh geometry={G.neck} material={m} position-y={0.34} />
            <group ref={set('head')} position-y={0.37}>
              <mesh geometry={G.head} material={m} position-y={0.055} />
            </group>
            {(['l', 'r'] as const).map((side) => (
              <group key={side} ref={set(`${side}Upper` as Joint)} position={[side === 'l' ? 0.13 : -0.13, 0.285, 0]}>
                <mesh geometry={G.upper} material={m} />
                <group ref={set(`${side}Fore` as Joint)} position-y={-0.2}>
                  <mesh geometry={G.fore} material={m} />
                  <mesh geometry={G.hand} material={m} position-y={-0.19} />
                  {mallet && side === 'r' && (
                    <group position-y={-0.19}>
                      <mesh geometry={G.mallet} material={m} />
                      <mesh geometry={G.malletHead} material={m} />
                    </group>
                  )}
                </group>
              </group>
            ))}
          </group>
        </group>
      </group>
    </group>
  )
}

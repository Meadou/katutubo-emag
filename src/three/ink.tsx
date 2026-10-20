import { useMemo } from 'react'
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber'
import * as THREE from 'three'
import { frameState, prefersReducedMotion } from '../store'

/**
 * The magazine draws every 3D object like a technical illustration: flat-shaded slabs with crisp
 * edges on the charcoal ground, and an outline drawing on the bone ground. All objects share these
 * materials, and InkDriver cross-fades them with the page tone, so nothing re-renders per frame.
 */
export const INK = {
  dark: { bg: '#252321', face: '#57524b', edge: '#141312', soft: '#6c6760' },
  light: { bg: '#dad5d0', face: '#dad5d0', edge: '#7d776f', soft: '#a9a39b' },
}

const c = (hex: string) => new THREE.Color(hex)
const dark = { bg: c(INK.dark.bg), face: c(INK.dark.face), edge: c(INK.dark.edge), soft: c(INK.dark.soft) }
const light = { bg: c(INK.light.bg), face: c(INK.light.face), edge: c(INK.light.edge), soft: c(INK.light.soft) }
// on bone the faces are mostly emissive paper colour, with only this much light-driven shade on top
const shade = light.face.clone().multiplyScalar(0.09)

export const inkMaterials = {
  /** faces: lit and flat on charcoal, washed to the paper colour on bone */
  face: new THREE.MeshLambertMaterial({
    color: dark.face.clone(), emissive: new THREE.Color(0, 0, 0), flatShading: true,
    polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1,
  }),
  edge: new THREE.LineBasicMaterial({ color: dark.edge.clone() }),
  /** secondary lines: grids, cords, hidden detail */
  soft: new THREE.LineBasicMaterial({ color: dark.soft.clone(), transparent: true, opacity: 0.8 }),
}

/** Damps the shared tone toward frameState.tone and recolours materials and the background. */
export function InkDriver() {
  const scene = useThree((s) => s.scene)
  const state = useMemo(() => ({ t: frameState.tone, bg: dark.bg.clone(), calm: prefersReducedMotion() }), [])
  useFrame((_, dt) => {
    state.t = state.calm ? frameState.tone : THREE.MathUtils.damp(state.t, frameState.tone, 5, dt)
    const t = state.t
    inkMaterials.face.color.lerpColors(dark.face, shade, t)
    inkMaterials.face.emissive.copy(light.face).multiplyScalar(t * 0.8)
    inkMaterials.edge.color.lerpColors(dark.edge, light.edge, t)
    inkMaterials.soft.color.lerpColors(dark.soft, light.soft, t)
    state.bg.lerpColors(dark.bg, light.bg, t)
    scene.background = state.bg
  })
  return null
}

/** A mesh drawn in ink: shared face material plus its crease edges. */
export function Inked({ geometry, threshold = 28, ...props }: { geometry: THREE.BufferGeometry; threshold?: number } & ThreeElements['group']) {
  const edges = useMemo(() => new THREE.EdgesGeometry(geometry, threshold), [geometry, threshold])
  return (
    <group {...props}>
      <mesh geometry={geometry} material={inkMaterials.face} />
      <lineSegments geometry={edges} material={inkMaterials.edge} />
    </group>
  )
}

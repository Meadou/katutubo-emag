import { useEffect, useMemo, useState } from 'react'
import * as THREE from 'three'
import { loadLand, type TerraceModel } from '../../worlds/land'
import { extrudeSheet, paperMaterial, sheetShapes } from '../paper'
import type { PropProps } from './registry'

/** Size of the model in world units (degrees): about ten kilometres across, a diorama piece. */
const SIZE = 0.11
const STEP = SIZE * 0.0105

/**
 * The hero: a mountainside cut into thirty thin terrace steps, each following the contour of the slope
 * the way Ifugao terraces do, with the forest (muyong) left standing on the crown. The steps are lit
 * like paper; the pond fields on their tops catch the colour of the sky. It stands still.
 */
export default function Terraces(_: PropProps) {
  const [model, setModel] = useState<TerraceModel | null>(null)
  useEffect(() => { loadLand('terraces').then(setModel, () => {}) }, [])

  const built = useMemo(() => {
    if (!model) return null
    const n = model.sheets.length
    const steps = model.sheets.map((s, k) => extrudeSheet(sheetShapes(s, (v) => (v - 0.5) * SIZE, (v) => (v - 0.5) * SIZE), STEP * 0.8, (k + 1) * STEP))
    const tree = new THREE.ConeGeometry(SIZE * 0.012, SIZE * 0.05, 5).translate(0, SIZE * 0.025, 0)
    const trees: [number, number, number][] = []
    for (let i = 0; i < model.trees.length; i += 3) {
      const x = (model.trees[i] - 0.5) * SIZE, z = -(model.trees[i + 1] - 0.5) * SIZE
      const lvl = model.levels.findIndex((l) => l > model.trees[i + 2])
      trees.push([x, ((lvl < 0 ? n : lvl) + 1) * STEP, z])
    }
    return { steps, tree, trees, n }
  }, [model])

  const mats = useMemo(() => {
    if (!built) return null
    // greens deepen toward the crown; the step tops hold water, a paler sky-coloured paper
    const side = paperMaterial('#5d7f4f')
    const tops = built.steps.map((_, k) => paperMaterial(new THREE.Color('#9fb58a').lerp(new THREE.Color('#5f8a5a'), k / built.n).getStyle()))
    return { side, tops, forest: paperMaterial('#2f5a3a') }
  }, [built])

  useEffect(() => () => { built?.steps.forEach((g) => g.dispose()); built?.tree.dispose() }, [built])
  if (!built || !mats) return null

  return (
    <group>
      {built.steps.map((g, k) => <mesh key={k} geometry={g} material={[mats.tops[k], mats.side]} castShadow receiveShadow />)}
      <Forest geo={built.tree} at={built.trees} mat={mats.forest} />
    </group>
  )
}

function Forest({ geo, at, mat }: { geo: THREE.BufferGeometry; at: [number, number, number][]; mat: THREE.Material }) {
  const mesh = useMemo(() => {
    const m = new THREE.InstancedMesh(geo, mat, at.length)
    const o = new THREE.Object3D()
    at.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.scale.setScalar(0.8 + ((i * 37) % 10) / 20); o.updateMatrix(); m.setMatrixAt(i, o.matrix) })
    m.castShadow = true
    return m
  }, [geo, mat, at])
  return <primitive object={mesh} />
}

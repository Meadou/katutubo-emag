import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadLand, type Land } from '../worlds/land'
import { journey } from '../worlds/engine'
import { mixColor, sampleRamp } from '../worlds/blend'
import { AREAS, type AreaName } from '../worlds/types'
import { GAP, extrudeSheet, paperMaterial, sheetShapes, stackHeightAt } from './paper'
import { place } from './place'

interface Built { geo: THREE.BufferGeometry; sea: boolean; k: number; n: number }

/**
 * One area of paper: a sheet per contour, extruded, stacked at the area's gap, coloured by the world
 * the reader is in and cross-faded behind the clouds when the journey changes area. Sheets are built
 * one per frame, so laying out a region never stalls the page.
 */
export default function PaperLand({ area, shadows, onReady }: { area: AreaName; shadows: boolean; onReady?: () => void }) {
  const [land, setLand] = useState<Land | null>(null)
  const [built, setBuilt] = useState<Built[]>([])
  const group = useRef<THREE.Group>(null!)
  const gap = GAP[area]

  useEffect(() => {
    let live = true
    loadLand(area).then((l) => { if (live) setLand(l) }, () => {})
    return () => { live = false }
  }, [area])

  // lay the sheets one per frame, lowest first
  useEffect(() => {
    if (!land) return
    let k = 0, raf = 0
    const landSheets = land.sheets.filter((s) => s.level > 0)
    const seaCount = land.sheets.length - landSheets.length
    const out: Built[] = []
    const step = () => {
      if (k >= land.sheets.length) {
        if (land.lake) {
          // the lake: a still sheet of water, just above the land beneath it
          const top = stackHeightAt(land.sheets, gap, ...center(land.lake.polys[0][0]), -seaCount * gap) + gap * 0.05
          out.push({ geo: extrudeSheet(sheetShapes(land.lake), gap * 0.4, top), sea: true, k: -1, n: 0 })
        }
        setBuilt([...out])
        const f = place.focus
        if (f) place.ground[area] = stackHeightAt(land.sheets, gap, f.lon, f.lat, -seaCount * gap)
        place.rest[area] = (landSheets.length / 2) * gap
        onReady?.()
        return
      }
      const s = land.sheets[k]
      const isSea = s.level <= 0
      // sea sheets sit below the shore; land sheets stack up from it
      const top = (k + 1 - seaCount) * gap
      out.push({ geo: extrudeSheet(sheetShapes(s), gap * 0.55, top), sea: isSea, k: Math.max(0, landSheets.indexOf(s)), n: landSheets.length })
      k++
      if (k % 3 === 0) setBuilt([...out])
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [land, gap, area, onReady])

  useEffect(() => () => built.forEach((b) => b.geo.dispose()), [built])

  const caps = useMemo(() => built.map(() => paperMaterial()), [built.length])
  const edges = useMemo(() => built.map(() => paperMaterial()), [built.length])
  const base = useMemo(() => paperMaterial(), [])
  // the sheet materials are remade as sheets are added; the old ones go back to the GPU
  useEffect(() => () => { caps.forEach((m) => m.dispose()); edges.forEach((m) => m.dispose()) }, [caps, edges])
  // the ground under the sheets runs far past the area's edge and dissolves into the fog: open sea
  // around the archipelago, the valley floor around a region
  const board = useMemo(() => {
    const a = AREAS[area]
    const span = area === 'archipelago' ? 80 : Math.max(a.east - a.west, a.north - a.south) * 14
    const g = new THREE.PlaneGeometry(span, span).rotateX(-Math.PI / 2)
    g.translate((a.west + a.east) / 2 - 122, -gap * (area === 'archipelago' ? 1 : 0.02), -((a.south + a.north) / 2 - 12))
    return g
  }, [area, gap])

  useFrame(() => {
    const w = journey.current
    if (!w || !group.current) return
    const weight = w.areaWeights[area] ?? 0
    group.current.visible = weight > 0.004
    if (!group.current.visible) return
    const fade = weight < 0.999
    const all = [...caps, ...edges, base]
    for (const m of all) { m.transparent = fade; m.opacity = weight; m.depthWrite = !fade || weight > 0.5 }
    built.forEach((b, i) => {
      const c = b.sea ? w.sea[1] : sampleRamp(w.land, b.n > 1 ? b.k / (b.n - 1) : 0)
      caps[i].color.set(c)
      // the cut edge is the same paper turned away from the light: always a little darker than the top
      edges[i].color.set(mixColor(c, '#000000', 0.22))
    })
    base.color.set(area === 'archipelago' ? w.sea[0] : mixColor(w.land[0], '#000000', 0.2))
  })

  return (
    <group ref={group}>
      <mesh geometry={board} material={base} receiveShadow={shadows} />
      {built.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={[caps[i], edges[i]]} castShadow={shadows} receiveShadow={shadows} />
      ))}
    </group>
  )
}

const center = (r: number[]): [number, number] => {
  let x = 0, y = 0
  for (let i = 0; i < r.length; i += 2) { x += r[i]; y += r[i + 1] }
  return [x / (r.length / 2), y / (r.length / 2)]
}

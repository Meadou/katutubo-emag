import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadLand, type Land } from '../worlds/land'
import { journey } from '../worlds/engine'
import { mixColor, sampleRamp } from '../worlds/blend'
import { AREAS, type AreaName } from '../worlds/types'
import { SEA_FLOOR, baseDepthMaterial, detail, extrudeSheet, heightOf, newDetail, paperMaterial, shadeOf, sheetShapes, toX, toZ } from './paper'
import { lands } from './place'

interface Built { geo: THREE.BufferGeometry; level: number; sea: boolean; cap: THREE.MeshLambertMaterial; edge: THREE.MeshLambertMaterial }

const baseDepth = baseDepthMaterial()

/**
 * One area of paper: a sheet per contour, extruded and stacked by the shared height rule, coloured
 * by the world the reader is in. The archipelago is always laid; a place's finer paper resolves
 * inside its own box as the camera comes close, and the archipelago gives way there pixel by pixel.
 * Sheets are built one per frame, so laying out a place never stalls the page.
 */
export default function PaperLand({ area, shadows, onReady }: { area: AreaName; shadows: boolean; onReady?: () => void }) {
  const [land, setLand] = useState<Land | null>(null)
  const [built, setBuilt] = useState<Built[]>([])
  const group = useRef<THREE.Group>(null!)
  const isBase = area === 'archipelago'
  const role = isBase ? 'base' : 'detail'
  // a place keeps its own box and dissolve; the archipelago reads the shared one
  const u = useMemo(() => {
    if (isBase) return detail
    const a = AREAS[area], d = newDetail()
    d.box.value.set(toX(a.west), toZ(a.north), toX(a.east), toZ(a.south))
    return d
  }, [area, isBase])

  useEffect(() => {
    let live = true
    loadLand(area).then((l) => { if (live) setLand(l) }, () => {})
    return () => { live = false }
  }, [area])

  // lay the sheets one per frame, lowest first
  useEffect(() => {
    if (!land) return
    let k = 0, raf = 0
    const out: Built[] = []
    const add = (geo: THREE.BufferGeometry, level: number, sea: boolean) =>
      out.push({ geo, level, sea, cap: paperMaterial('#ffffff', role, u), edge: paperMaterial('#ffffff', role, u) })
    const step = () => {
      if (k >= land.sheets.length) {
        if (land.lake) {
          // the lake: a still sheet of water, just above the shore around it
          const top = heightOf(land.lake.level) + 0.0015
          add(extrudeSheet(sheetShapes(land.lake), 0.003, top), land.lake.level, true)
        }
        setBuilt([...out])
        lands[area] = land.lake ? [...land.sheets, land.lake] : land.sheets
        onReady?.()
        return
      }
      const s = land.sheets[k]
      const top = heightOf(s.level)
      const below = k > 0 ? heightOf(land.sheets[k - 1].level) : SEA_FLOOR
      add(extrudeSheet(sheetShapes(s), Math.max(0.003, (top - below) * 0.6), top), s.level, s.level <= 0)
      k++
      if (k % 3 === 0) setBuilt([...out])
      raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    // everything this build made goes back to the GPU when the area is taken down
    return () => { cancelAnimationFrame(raf); out.forEach((b) => { b.geo.dispose(); b.cap.dispose(); b.edge.dispose() }) }
  }, [land, area, role, u, onReady])

  const board = useMemo(() => paperMaterial('#ffffff', role, u), [role, u])
  // the open sea under everything: far past the archipelago's edge into the fog, or exactly a place's box
  const boardGeo = useMemo(() => {
    const a = AREAS[area]
    const w = isBase ? 80 : a.east - a.west, h = isBase ? 80 : a.north - a.south
    const g = new THREE.PlaneGeometry(w, h).rotateX(-Math.PI / 2)
    g.translate((a.west + a.east) / 2 - 122, SEA_FLOOR, -((a.south + a.north) / 2 - 12))
    return g
  }, [area, isBase])

  useFrame(() => {
    const w = journey.current
    if (!w || !group.current) return
    const weight = isBase ? 1 : w.areaWeights[area] ?? 0
    group.current.visible = weight > 0.002
    if (!group.current.visible) return
    if (!isBase) u.mix.value = weight
    for (const b of built) {
      const c = b.sea ? w.sea[1] : sampleRamp(w.land, shadeOf(b.level))
      b.cap.color.set(c)
      // the cut edge is the same paper turned away from the light: always a little darker than the top
      b.edge.color.set(mixColor(c, '#000000', 0.22))
    }
    board.color.set(w.sea[0])
  })

  return (
    <group ref={group}>
      <mesh geometry={boardGeo} material={board} receiveShadow={shadows} />
      {built.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={[b.cap, b.edge]} castShadow={shadows} receiveShadow={shadows}
          customDepthMaterial={isBase ? baseDepth : undefined} />
      ))}
    </group>
  )
}

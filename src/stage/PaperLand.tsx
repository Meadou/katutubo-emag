import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadMap, type Land, type Sheet } from '../worlds/land'
import { journey } from '../worlds/engine'
import { mixColor, sampleRamp } from '../worlds/blend'
import { MAP } from '../worlds/types'
import { useLoading } from '../ui/loading'
import { SEA_FLOOR, heightOf, paperMaterial, shadeOf } from './paper'
import { buildSheet } from './sheetGeometry'
import { laid } from './place'

interface Built { geo: THREE.BufferGeometry; level: number; water: boolean; cap: THREE.MeshLambertMaterial; edge: THREE.MeshLambertMaterial }

function geometry(polys: number[][][], top: number, thickness: number) {
  const b = buildSheet(polys, top, thickness)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(b.position, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(b.normal, 3))
  g.setIndex(new THREE.BufferAttribute(b.index, 1))
  // two draw calls a sheet, whatever the number of islands on it: the tops, then the cut edges
  g.addGroup(0, b.capIndexCount, 0)
  g.addGroup(b.capIndexCount, b.index.length - b.capIndexCount, 1)
  g.computeBoundingSphere()
  return g
}

/**
 * The one paper map: a sheet per contour of real elevation, stacked by height and coloured by the
 * world the reader is in. Sheets are built one per frame behind the loading screen, each as exactly
 * two draw calls, so the map costs the same to draw however many islands it holds.
 */
export default function PaperLand({ shadows, onReady }: { shadows: boolean; onReady: () => void }) {
  const [land, setLand] = useState<Land | null>(null)
  const [built, setBuilt] = useState<Built[]>([])
  const mark = useLoading((s) => s.mark)

  useEffect(() => {
    let live = true
    loadMap().then((l) => { if (live) setLand(l) }, () => {})
    return () => { live = false }
  }, [])

  // lay the sheets one per frame, lowest first, so the loading bar moves
  useEffect(() => {
    if (!land) return
    let k = 0, raf = 0
    const out: Built[] = []
    const jobs: { s: Sheet; water: boolean; top: number; thick: number }[] = land.sheets.map((s, i) => {
      const top = heightOf(s.level), below = i > 0 ? heightOf(land.sheets[i - 1].level) : SEA_FLOOR
      return { s, water: s.level <= 0, top, thick: Math.max(0.003, (top - below) * 0.6) }
    })
    // lakes: a still sheet of water just above the shore around them
    if (land.lakes) jobs.push({ s: land.lakes, water: true, top: heightOf(land.lakes.level) + 0.0015, thick: 0.003 })
    mark({ total: jobs.length, built: 0 })
    const step = () => {
      const j = jobs[k]
      out.push({ geo: geometry(j.s.polys, j.top, j.thick), level: j.s.level, water: j.water, cap: paperMaterial(), edge: paperMaterial() })
      k++
      setBuilt([...out])
      mark({ built: k })
      if (k < jobs.length) { raf = requestAnimationFrame(step); return }
      laid.sheets = land.lakes ? [...land.sheets, land.lakes] : land.sheets
      onReady()
    }
    raf = requestAnimationFrame(step)
    // everything this build made goes back to the GPU when the map is taken down
    return () => { cancelAnimationFrame(raf); out.forEach((b) => { b.geo.dispose(); b.cap.dispose(); b.edge.dispose() }) }
  }, [land, mark, onReady])

  const board = useMemo(() => paperMaterial(), [])
  // the open sea under everything, far past the map's edge into the fog
  const boardGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2)
    g.translate((MAP.west + MAP.east) / 2 - 122, SEA_FLOOR, -((MAP.south + MAP.north) / 2 - 12))
    return g
  }, [])

  // colours follow the world, but only change when its paper does
  const last = useRef('')
  useFrame(() => {
    const w = journey.current
    if (!w) return
    const key = `${w.land.join()}|${w.sea.join()}`
    if (key === last.current) return
    last.current = key
    for (const b of built) {
      const c = b.water ? w.sea[1] : sampleRamp(w.land, shadeOf(b.level))
      b.cap.color.set(c)
      // the cut edge is the same paper turned away from the light: always a little darker than the top
      b.edge.color.set(mixColor(c, '#000000', 0.22))
    }
    board.color.set(w.sea[0])
  })
  // a newly built sheet takes the current colours on the next frame
  useEffect(() => { last.current = '' }, [built])

  return (
    <group>
      <mesh geometry={boardGeo} material={board} receiveShadow={shadows} />
      {built.map((b, i) => (
        <mesh key={i} geometry={b.geo} material={[b.cap, b.edge]} castShadow={shadows} receiveShadow={shadows} />
      ))}
    </group>
  )
}

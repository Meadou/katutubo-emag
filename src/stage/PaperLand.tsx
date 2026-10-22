import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { loadMap, loadRegion, type Land, type Piece, type Region, type Sheet } from '../worlds/land'
import { journey } from '../worlds/engine'
import { mixColor, sampleRamp } from '../worlds/blend'
import { MAP } from '../worlds/types'
import { useLoading } from '../ui/loading'
import { SEA_FLOOR, heightOf, paperMaterial, shadeOf } from './paper'
import { buildSheet } from './sheetGeometry'
import { laid } from './place'
import { pieceColor, pieceOffset, restColor, toneOf } from './regions'

interface Built { geo: THREE.BufferGeometry; level: number; water: boolean; cap: THREE.MeshLambertMaterial; edge: THREE.MeshLambertMaterial }
interface Job { s: Sheet; water: boolean; top: number; thick: number; piece?: number; tones?: [number, number, number][] }

/** How deep a Davao piece's lowest sheet reaches below the sea, so a lifted piece shows a thick cut edge, like card. */
const PIECE_BASE = 0.16

function geometry(j: Job) {
  const b = buildSheet(j.s.polys, j.top, j.thick, j.tones)
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.BufferAttribute(b.position, 3))
  g.setAttribute('normal', new THREE.BufferAttribute(b.normal, 3))
  if (b.color) g.setAttribute('color', new THREE.BufferAttribute(b.color, 3))
  g.setIndex(new THREE.BufferAttribute(b.index, 1))
  // two draw calls a sheet, whatever the number of islands on it: the tops, then the cut edges
  g.addGroup(0, b.capIndexCount, 0)
  g.addGroup(b.capIndexCount, b.index.length - b.capIndexCount, 1)
  g.computeBoundingSphere()
  return g
}

/** The sheets of one stack, lowest first, each as thick as the step below it (the lowest down to `floor`). */
function stack(sheets: Sheet[], floor: number, extra: Partial<Job> = {}): Job[] {
  return sheets.map((s, i) => {
    const top = heightOf(s.level), below = i > 0 ? heightOf(sheets[i - 1].level) : floor
    return { s, water: s.level <= 0, top, thick: Math.max(0.003, i > 0 ? (top - below) * 0.6 : top - floor), ...extra }
  })
}

/**
 * The paper map. The country is a sheet per contour of real elevation, cut into its regions (each in
 * its own paper tone, with a groove of sea between them); the Davao Region is six pieces of its own,
 * one per province and Davao City, which rise, part and take their own colours as the world asks.
 * Sheets are built one per frame behind the loading screen, each as exactly two draw calls.
 */
export default function PaperLand({ shadows, onReady }: { shadows: boolean; onReady: () => void }) {
  const [maps, setMaps] = useState<{ land: Land; region: Region } | null>(null)
  const [built, setBuilt] = useState<Built[]>([])
  const [pieceOf, setPieceOf] = useState<(number | undefined)[]>([])
  const groups = useRef<(THREE.Group | null)[]>([])
  const mark = useLoading((s) => s.mark)

  useEffect(() => {
    let live = true
    Promise.all([loadMap(), loadRegion()]).then(([land, region]) => { if (live) setMaps({ land, region }) }, () => {})
    return () => { live = false }
  }, [])

  // lay the sheets one per frame, lowest first, so the loading bar moves
  useEffect(() => {
    if (!maps) return
    const { land, region } = maps
    let k = 0, raf = 0
    const out: Built[] = [], owners: (number | undefined)[] = []
    const jobs: Job[] = stack(land.sheets, SEA_FLOOR).map((j) => ({
      ...j, tones: j.s.tags ? j.s.tags.map((t) => toneOf(land.regions?.[t])) : undefined,
    }))
    // lakes: a still sheet of water just above the shore around them
    if (land.lakes) jobs.push({ s: land.lakes, water: true, top: heightOf(land.lakes.level) + 0.0015, thick: 0.003 })
    region.pieces.forEach((p, i) => jobs.push(...stack(p.sheets, SEA_FLOOR - PIECE_BASE, { piece: i })))
    mark({ total: jobs.length, built: 0 })
    const step = () => {
      const j = jobs[k]
      const cap = paperMaterial(), edge = paperMaterial()
      if (j.tones) { cap.vertexColors = true; edge.vertexColors = true }
      out.push({ geo: geometry(j), level: j.s.level, water: j.water, cap, edge })
      owners.push(j.piece)
      k++
      setBuilt([...out])
      setPieceOf([...owners])
      mark({ built: k })
      if (k < jobs.length) { raf = requestAnimationFrame(step); return }
      laid.sheets = land.lakes ? [...land.sheets, land.lakes] : land.sheets
      laid.pieces = region.pieces
      onReady()
    }
    raf = requestAnimationFrame(step)
    // everything this build made goes back to the GPU when the map is taken down
    return () => { cancelAnimationFrame(raf); out.forEach((b) => { b.geo.dispose(); b.cap.dispose(); b.edge.dispose() }) }
  }, [maps, mark, onReady])

  const board = useMemo(() => paperMaterial(), [])
  // the open sea under everything, far past the map's edge into the fog
  const boardGeo = useMemo(() => {
    const g = new THREE.PlaneGeometry(80, 80).rotateX(-Math.PI / 2)
    g.translate((MAP.west + MAP.east) / 2 - 122, SEA_FLOOR, -((MAP.south + MAP.north) / 2 - 12))
    return g
  }, [])

  const pieces: Piece[] = maps?.region.pieces ?? []

  // colours follow the world, but only change when its paper or the map's state does
  const last = useRef('')
  useFrame(() => {
    const w = journey.current
    if (!w) return
    const m = w.map
    pieces.forEach((p, i) => {
      const g = groups.current[i]
      if (!g) return
      const o = pieceOffset(p, m)
      g.position.set(o.x, o.y, o.z)
    })
    const focus = Object.entries(m.focus).map(([k, v]) => `${k}${v.toFixed(3)}`).join()
    const key = `${w.land.join()}|${w.sea.join()}|${m.dim.toFixed(3)}|${m.tint.toFixed(3)}|${focus}`
    if (key === last.current) return
    last.current = key
    built.forEach((b, i) => {
      const own = pieceOf[i]
      const world = sampleRamp(w.land, shadeOf(b.level))
      const c = b.water ? w.sea[1] : own !== undefined ? pieceColor(pieces[own].key, world, shadeOf(b.level), m) : restColor(world, m)
      b.cap.color.set(c)
      // the cut edge is the same paper turned away from the light: always a little darker than the top
      b.edge.color.set(mixColor(c, '#000000', b.water ? 0.22 : own !== undefined ? 0.26 : 0.22))
    })
    board.color.set(w.sea[0])
  })
  // a newly built sheet takes the current colours on the next frame
  useEffect(() => { last.current = '' }, [built])

  const rest = built.map((b, i) => (pieceOf[i] === undefined ? (
    <mesh key={i} geometry={b.geo} material={[b.cap, b.edge]} castShadow={shadows} receiveShadow={shadows} />
  ) : null))

  return (
    <group>
      <mesh geometry={boardGeo} material={board} receiveShadow={shadows} />
      {rest}
      {pieces.map((p, k) => (
        <group key={p.key} ref={(g) => { groups.current[k] = g }}>
          {built.map((b, i) => (pieceOf[i] === k ? (
            <mesh key={i} geometry={b.geo} material={[b.cap, b.edge]} castShadow={shadows} receiveShadow={shadows} />
          ) : null))}
        </group>
      ))}
    </group>
  )
}
